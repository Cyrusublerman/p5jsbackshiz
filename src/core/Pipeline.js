import { Sampler } from './Sampler.js';
import { hashSeed } from './SeededRNG.js';
import { pool } from './BufferPool.js';

/**
 * Pipeline — strictly sequential render loop.
 *
 * Guarantee: node N always receives the output of node N-1 as input.
 * No node-specific optimisation paths (LUT fusion, batching, reordering).
 * Correctness is architectural, not per-node.
 *
 * Performance comes from:
 * - BufferPool: zero-alloc buffer recycling
 * - Dirty-node cache: skip unchanged prefix of the stack
 * - Progressive preview: lower resolution during interaction
 * - Worker thread: off-main-thread execution
 */
export class Pipeline {
  constructor(state) {
    this.s = state;
  }

  render() {
    const s = this.s;
    if (!s.sourcePixels || s.rendering) return null;
    s.rendering = true;

    const prev = s.quality === 'preview';
    const sc = prev ? s.previewScale : 1;
    const w = Math.round(s.sourceW * sc);
    const h = Math.round(s.sourceH * sc);
    const bufSize = w * h * 4;

    // ── Source ──
    let src;
    if (prev && sc < 1) {
      src = pool.acquire(bufSize);
      this._ds(s.sourcePixels, s.sourceW, s.sourceH, w, h, src);
    } else {
      src = pool.acquire(s.sourcePixels.length);
      src.set(s.sourcePixels);
    }

    // ── Active nodes ──
    // Solo = process all enabled nodes up to and including the solo'd node, skip after
    let active;
    if (s.soloNodeId !== null) {
      active = [];
      for (const n of s.stack) {
        if (n.enabled) active.push(n);
        if (n.id === s.soloNodeId) break;
      }
    } else {
      active = s.stack.filter(n => n.enabled);
    }

    // ── Modulation maps ──
    const modMaps = this._buildModMaps(w, h);

    // ── Dirty-node cache: find first invalid node ──
    let startIdx = 0;
    let allCached = true;
    for (let i = 0; i < active.length; i++) {
      if (!active[i]._cacheValid || !active[i]._cache || active[i]._cache.length !== bufSize) {
        startIdx = i;
        allCached = false;
        break;
      }
    }
    if (allCached) startIdx = active.length;

    // Resume from cache or start from source
    let bufA;
    if (startIdx > 0 && startIdx <= active.length) {
      bufA = pool.acquire(bufSize);
      bufA.set(active[startIdx - 1]._cache);
      pool.release(src);
    } else {
      bufA = src;
      startIdx = 0;
    }

    let bufB = pool.acquire(bufSize);
    const t0 = performance.now();

    // ── Sequential render: each node reads bufA, writes bufB, then swap ──
    for (let ni = startIdx; ni < active.length; ni++) {
      const node = active[ni];
      const hasMask = node.mask.enabled && node.mask.source !== 'none';
      const hasModulation = Object.keys(node.modulation).length > 0;

      const ctx = {
        width: w,
        height: h,
        quality: s.quality,
        globalSeed: s.globalSeed,
        nodeSeed: hashSeed(s.globalSeed, ni, node.id),
        previewScale: sc,
        nodeIndex: ni,
        modMaps: hasModulation ? modMaps : null
      };

      // Build mask if needed
      if (hasMask) node.buildMask(bufA, w, h);

      // Apply: always sequential — node reads bufA (previous output), writes to bufB or tmp
      const needsBlend = (node.opacity < 1) || (hasMask && node.mask.data);

      if (needsBlend) {
        const tmp = pool.acquire(bufSize);
        node.apply(bufA, tmp, w, h, ctx);

        const maskData = hasMask ? node.mask.data : null;
        const scalarOp = node.opacity;

        for (let i = 0; i < bufSize; i += 4) {
          const pi = i >> 2;
          const maskVal = maskData ? maskData[pi] / 255 : 1;
          const op = scalarOp * maskVal;
          const inv = 1 - op;
          bufB[i]     = bufA[i]     * inv + tmp[i]     * op;
          bufB[i + 1] = bufA[i + 1] * inv + tmp[i + 1] * op;
          bufB[i + 2] = bufA[i + 2] * inv + tmp[i + 2] * op;
          bufB[i + 3] = bufA[i + 3] * inv + tmp[i + 3] * op;
        }
        pool.release(tmp);
      } else {
        node.apply(bufA, bufB, w, h, ctx);
      }

      // Cache this node's output
      if (!node._cache || node._cache.length !== bufSize) {
        node._cache = new Uint8ClampedArray(bufSize);
      }
      node._cache.set(bufB);
      node._cacheValid = true;

      // Progress
      s.renderProgress = (ni + 1) / active.length;

      // Swap: bufB becomes next node's input (bufA)
      [bufA, bufB] = [bufB, bufA];
    }

    pool.release(bufB);

    s.lastRenderTime = performance.now() - t0;
    s.rendering = false;
    s.needsRender = false;

    return { pixels: bufA, width: w, height: h, _pooled: true };
  }

  releaseResult(result) {
    if (result && result._pooled) pool.release(result.pixels);
  }

  _buildModMaps(w, h) {
    const s = this.s;
    const maps = {};
    for (const [name, map] of Object.entries(s.modulationMaps)) {
      const n = w * h;
      const dst = new Uint8Array(n);
      const sx = map.sourceW / w, sy = map.sourceH / h;
      const sp = map.sourcePixels;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const ox = Math.min(map.sourceW - 1, Math.round(x * sx));
          const oy = Math.min(map.sourceH - 1, Math.round(y * sy));
          const si = (oy * map.sourceW + ox) * 4;
          dst[y * w + x] = Math.round(sp[si] * 0.299 + sp[si + 1] * 0.587 + sp[si + 2] * 0.114);
        }
      }
      maps[name] = dst;
    }
    return maps;
  }

  _ds(src, sw, sh, dw, dh, dst) {
    const sx = sw / dw, sy = sh / dh;
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const c = Sampler.bilinear(src, sw, sh, x * sx, y * sy);
        const i = (y * dw + x) * 4;
        dst[i] = c[0]; dst[i + 1] = c[1]; dst[i + 2] = c[2]; dst[i + 3] = c[3];
      }
    }
  }

  renderFinal() {
    const q = this.s.quality;
    this.s.quality = 'final';
    const r = this.render();
    this.s.quality = q;
    return r;
  }
}
