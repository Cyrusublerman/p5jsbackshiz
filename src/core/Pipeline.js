import { Sampler } from './Sampler.js';
import { hashSeed } from './SeededRNG.js';
import { pool } from './BufferPool.js';

export class Pipeline {
  constructor(state) {
    this.s = state;
    this._lastW = 0;
    this._lastH = 0;
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

    // Downscale or copy source
    let src;
    if (prev && sc < 1) {
      src = pool.acquire(bufSize);
      this._ds(s.sourcePixels, s.sourceW, s.sourceH, w, h, src);
    } else {
      src = pool.acquire(s.sourcePixels.length);
      src.set(s.sourcePixels);
    }

    const active = s.soloNodeId !== null
      ? s.stack.filter(n => n.id === s.soloNodeId && n.enabled)
      : s.stack.filter(n => n.enabled);

    // Dirty-node cache: find first invalid node
    let startIdx = 0;
    for (let i = 0; i < active.length; i++) {
      if (!active[i]._cacheValid || !active[i]._cache || active[i]._cache.length !== bufSize) {
        startIdx = i;
        break;
      }
      startIdx = active.length; // all cached
    }

    // If we can skip ahead, use the cached output of the node before startIdx
    let bufA;
    if (startIdx > 0 && startIdx <= active.length) {
      const cached = active[startIdx - 1]._cache;
      bufA = pool.acquire(bufSize);
      bufA.set(cached);
      pool.release(src);
    } else {
      bufA = src;
      startIdx = 0;
    }

    let bufB = pool.acquire(bufSize);

    const t0 = performance.now();

    for (let ni = startIdx; ni < active.length; ni++) {
      const node = active[ni];
      const ctx = {
        width: w,
        height: h,
        quality: s.quality,
        globalSeed: s.globalSeed,
        nodeSeed: hashSeed(s.globalSeed, ni, node.id),
        previewScale: sc,
        nodeIndex: ni
      };

      // LUT fusion: detect consecutive LUT-eligible nodes
      if (node.isLUT && node.opacity >= 1) {
        let fusionEnd = ni;
        while (fusionEnd + 1 < active.length &&
               active[fusionEnd + 1].isLUT &&
               active[fusionEnd + 1].opacity >= 1 &&
               active[fusionEnd + 1].enabled) {
          fusionEnd++;
        }
        if (fusionEnd > ni) {
          // Fuse LUT chain
          const lutR = new Uint8Array(256);
          const lutG = new Uint8Array(256);
          const lutB = new Uint8Array(256);
          for (let i = 0; i < 256; i++) { lutR[i] = lutG[i] = lutB[i] = i; }
          for (let fi = ni; fi <= fusionEnd; fi++) {
            active[fi].buildLUT(lutR, lutG, lutB);
          }
          // Single-pass apply
          for (let i = 0; i < bufSize; i += 4) {
            bufB[i]     = lutR[bufA[i]];
            bufB[i + 1] = lutG[bufA[i + 1]];
            bufB[i + 2] = lutB[bufA[i + 2]];
            bufB[i + 3] = bufA[i + 3];
          }
          // Cache each fused node
          for (let fi = ni; fi <= fusionEnd; fi++) {
            if (!active[fi]._cache || active[fi]._cache.length !== bufSize) {
              active[fi]._cache = new Uint8ClampedArray(bufSize);
            }
            active[fi]._cache.set(bufB);
            active[fi]._cacheValid = true;
          }
          [bufA, bufB] = [bufB, bufA];
          ni = fusionEnd;
          continue;
        }
      }

      if (node.opacity >= 1) {
        node.apply(bufA, bufB, w, h, ctx);
      } else {
        const tmp = pool.acquire(bufSize);
        node.apply(bufA, tmp, w, h, ctx);
        const op = node.opacity;
        const inv = 1 - op;
        for (let i = 0; i < bufSize; i += 4) {
          bufB[i]     = bufA[i]     * inv + tmp[i]     * op;
          bufB[i + 1] = bufA[i + 1] * inv + tmp[i + 1] * op;
          bufB[i + 2] = bufA[i + 2] * inv + tmp[i + 2] * op;
          bufB[i + 3] = bufA[i + 3] * inv + tmp[i + 3] * op;
        }
        pool.release(tmp);
      }

      // Cache node output
      if (!node._cache || node._cache.length !== bufSize) {
        node._cache = new Uint8ClampedArray(bufSize);
      }
      node._cache.set(bufB);
      node._cacheValid = true;

      [bufA, bufB] = [bufB, bufA];
    }

    pool.release(bufB);

    s.lastRenderTime = performance.now() - t0;
    s.rendering = false;
    s.needsRender = false;
    this._lastW = w;
    this._lastH = h;

    return { pixels: bufA, width: w, height: h, _pooled: true };
  }

  releaseResult(result) {
    if (result && result._pooled) {
      pool.release(result.pixels);
    }
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
