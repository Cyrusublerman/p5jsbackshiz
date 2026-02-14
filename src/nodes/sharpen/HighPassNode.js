import { EffectNode } from '../EffectNode.js';

export class HighPassNode extends EffectNode {
  constructor() {
    super('highpass', 'HIGH PASS', {
      radius: { value: 5, min: 0.1, max: 50, step: 0.1, label: 'RADIUS' }
    });
  }

  apply(s, d, w, h, ctx) {
    let sig = this.params.radius;
    if (ctx && ctx.quality === 'preview') sig *= 0.5;
    const rad = Math.ceil(sig * 3);
    const kSize = rad * 2 + 1;
    const k = new Float32Array(kSize);
    let sum = 0;
    for (let i = -rad; i <= rad; i++) { k[i + rad] = Math.exp(-(i * i) / (2 * sig * sig)); sum += k[i + rad]; }
    for (let i = 0; i < kSize; i++) k[i] /= sum;

    const tmp = new Uint8ClampedArray(s.length);
    const blur = new Uint8ClampedArray(s.length);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let cr = 0, cg = 0, cb = 0;
      for (let j = -rad; j <= rad; j++) {
        const cx = Math.max(0, Math.min(w - 1, x + j));
        const si = (y * w + cx) * 4; const wt = k[j + rad];
        cr += s[si] * wt; cg += s[si + 1] * wt; cb += s[si + 2] * wt;
      }
      const oi = (y * w + x) * 4;
      tmp[oi] = cr; tmp[oi + 1] = cg; tmp[oi + 2] = cb; tmp[oi + 3] = s[oi + 3];
    }
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
      let cr = 0, cg = 0, cb = 0;
      for (let j = -rad; j <= rad; j++) {
        const cy = Math.max(0, Math.min(h - 1, y + j));
        const si = (cy * w + x) * 4; const wt = k[j + rad];
        cr += tmp[si] * wt; cg += tmp[si + 1] * wt; cb += tmp[si + 2] * wt;
      }
      const oi = (y * w + x) * 4;
      blur[oi] = cr; blur[oi + 1] = cg; blur[oi + 2] = cb; blur[oi + 3] = s[oi + 3];
    }
    // High pass = src - blur + 128 (mid-grey shift)
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i]     = Math.max(0, Math.min(255, s[i]     - blur[i]     + 128));
      d[i + 1] = Math.max(0, Math.min(255, s[i + 1] - blur[i + 1] + 128));
      d[i + 2] = Math.max(0, Math.min(255, s[i + 2] - blur[i + 2] + 128));
      d[i + 3] = s[i + 3];
    }
  }
}
