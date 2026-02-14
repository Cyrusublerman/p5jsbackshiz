import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class GaussianBlurNode extends EffectNode {
  constructor() {
    super('gaussblur', 'GAUSS BLUR', {
      sigma:  { value: 2, min: 0.1, max: 30, step: 0.1, label: 'SIGMA' },
      passes: { value: 1, min: 1, max: 3, step: 1, label: 'PASSES' }
    });
  }

  apply(s, d, w, h, ctx) {
    let sig = this.params.sigma;
    let p = this.params.passes;
    if (ctx.quality === 'preview') { sig *= 0.5; p = 1; }
    const rad = Math.ceil(sig * 3);
    const k = this._k(sig, rad);
    let cur = new Uint8ClampedArray(s);
    let tmp = new Uint8ClampedArray(s.length);
    for (let pass = 0; pass < p; pass++) {
      this._cH(cur, tmp, w, h, k, rad);
      this._cV(tmp, cur, w, h, k, rad);
    }
    d.set(cur);
  }

  _k(sig, r) {
    const k = new Float32Array(r * 2 + 1);
    let sum = 0;
    for (let i = -r; i <= r; i++) {
      k[i + r] = Math.exp(-(i * i) / (2 * sig * sig));
      sum += k[i + r];
    }
    for (let i = 0; i < k.length; i++) k[i] /= sum;
    return k;
  }

  _cH(s, d, w, h, k, r) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let cr = 0, cg = 0, cb = 0, ca = 0;
        for (let j = -r; j <= r; j++) {
          const cx = Sampler.clamp(x + j, w);
          const i = (y * w + cx) * 4;
          const wt = k[j + r];
          cr += s[i] * wt; cg += s[i + 1] * wt;
          cb += s[i + 2] * wt; ca += s[i + 3] * wt;
        }
        const o = (y * w + x) * 4;
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = ca;
      }
    }
  }

  _cV(s, d, w, h, k, r) {
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let cr = 0, cg = 0, cb = 0, ca = 0;
        for (let j = -r; j <= r; j++) {
          const cy = Sampler.clamp(y + j, h);
          const i = (cy * w + x) * 4;
          const wt = k[j + r];
          cr += s[i] * wt; cg += s[i + 1] * wt;
          cb += s[i + 2] * wt; ca += s[i + 3] * wt;
        }
        const o = (y * w + x) * 4;
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = ca;
      }
    }
  }
}
