import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class UnsharpMaskNode extends EffectNode {
  constructor() {
    super('unsharpmask', 'UNSHARP MASK', {
      amount:    { value: 1, min: 0, max: 5, step: 0.1, label: 'AMOUNT' },
      radius:    { value: 2, min: 0.1, max: 20, step: 0.1, label: 'RADIUS' },
      threshold: { value: 0, min: 0, max: 255, step: 1, label: 'THRESHOLD' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { amount, radius, threshold } = this.params;
    let sig = radius;
    if (ctx && ctx.quality === 'preview') sig *= 0.5;
    const rad = Math.ceil(sig * 3);
    const kSize = rad * 2 + 1;
    const kernel = new Float32Array(kSize);
    let sum = 0;
    for (let i = -rad; i <= rad; i++) { kernel[i + rad] = Math.exp(-(i * i) / (2 * sig * sig)); sum += kernel[i + rad]; }
    for (let i = 0; i < kSize; i++) kernel[i] /= sum;

    // Separable Gaussian blur
    const tmp = new Uint8ClampedArray(s.length);
    const blur = new Uint8ClampedArray(s.length);
    // Horizontal
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let cr = 0, cg = 0, cb = 0;
      for (let j = -rad; j <= rad; j++) {
        const cx = Math.max(0, Math.min(w - 1, x + j));
        const si = (y * w + cx) * 4; const wt = kernel[j + rad];
        cr += s[si] * wt; cg += s[si + 1] * wt; cb += s[si + 2] * wt;
      }
      const oi = (y * w + x) * 4;
      tmp[oi] = cr; tmp[oi + 1] = cg; tmp[oi + 2] = cb; tmp[oi + 3] = s[oi + 3];
    }
    // Vertical
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      let cr = 0, cg = 0, cb = 0;
      for (let j = -rad; j <= rad; j++) {
        const cy = Math.max(0, Math.min(h - 1, y + j));
        const si = (cy * w + x) * 4; const wt = kernel[j + rad];
        cr += tmp[si] * wt; cg += tmp[si + 1] * wt; cb += tmp[si + 2] * wt;
      }
      const oi = (y * w + x) * 4;
      blur[oi] = cr; blur[oi + 1] = cg; blur[oi + 2] = cb; blur[oi + 3] = s[oi + 3];
    }
    // Unsharp: out = src + amount * (src - blur) if diff > threshold
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      for (let c = 0; c < 3; c++) {
        const diff = s[i + c] - blur[i + c];
        d[i + c] = Math.abs(diff) > threshold
          ? Math.max(0, Math.min(255, Math.round(s[i + c] + amount * diff)))
          : s[i + c];
      }
      d[i + 3] = s[i + 3];
    }
  }
}
