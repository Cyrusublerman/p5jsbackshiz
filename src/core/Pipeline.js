import { Sampler } from './Sampler.js';
import { hashSeed } from './SeededRNG.js';

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

    let src = (prev && sc < 1)
      ? this._ds(s.sourcePixels, s.sourceW, s.sourceH, w, h)
      : new Uint8ClampedArray(s.sourcePixels);

    let bufA = src;
    let bufB = new Uint8ClampedArray(w * h * 4);

    const active = s.soloNodeId !== null
      ? s.stack.filter(n => n.id === s.soloNodeId && n.enabled)
      : s.stack.filter(n => n.enabled);

    const t0 = performance.now();

    for (let ni = 0; ni < active.length; ni++) {
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

      if (node.opacity >= 1) {
        node.apply(bufA, bufB, w, h, ctx);
      } else {
        const tmp = new Uint8ClampedArray(w * h * 4);
        node.apply(bufA, tmp, w, h, ctx);
        const op = node.opacity;
        const inv = 1 - op;
        for (let i = 0; i < bufA.length; i += 4) {
          bufB[i]     = bufA[i]     * inv + tmp[i]     * op;
          bufB[i + 1] = bufA[i + 1] * inv + tmp[i + 1] * op;
          bufB[i + 2] = bufA[i + 2] * inv + tmp[i + 2] * op;
          bufB[i + 3] = bufA[i + 3] * inv + tmp[i + 3] * op;
        }
      }
      [bufA, bufB] = [bufB, bufA];
    }

    s.lastRenderTime = performance.now() - t0;
    s.rendering = false;
    s.needsRender = false;
    return { pixels: bufA, width: w, height: h };
  }

  _ds(src, sw, sh, dw, dh) {
    const d = new Uint8ClampedArray(dw * dh * 4);
    const sx = sw / dw, sy = sh / dh;
    for (let y = 0; y < dh; y++) {
      for (let x = 0; x < dw; x++) {
        const c = Sampler.bilinear(src, sw, sh, x * sx, y * sy);
        const i = (y * dw + x) * 4;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3];
      }
    }
    return d;
  }

  renderFinal() {
    const q = this.s.quality;
    this.s.quality = 'final';
    const r = this.render();
    this.s.quality = q;
    return r;
  }
}
