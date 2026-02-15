import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class SpherizeNode extends EffectNode {
  constructor() {
    super('spherize', 'SPHERIZE', {
      amount:  { value: 0.5, min: -1, max: 1, step: 0.01, label: 'AMOUNT' },
      centreX: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' },
      radius:  { value: 0.5, min: 0.01, max: 1, step: 0.01, label: 'RADIUS' }
    });
  }

  apply(s, d, w, h) {
    const { amount, centreX, centreY, radius } = this.params;
    const cx = centreX * w, cy = centreY * h;
    const r = radius * Math.min(w, h);
    const r2 = r * r;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        const dist2 = dx * dx + dy * dy;
        const i = (y * w + x) * 4;
        if (dist2 < r2) {
          const dist = Math.sqrt(dist2);
          const t = dist / r;
          const newR = amount > 0
            ? Math.pow(t, 1 + amount) * r
            : Math.pow(t, 1 / (1 - amount)) * r;
          const scale = dist > 0.001 ? newR / dist : 1;
          Sampler.bilinearDst(s, w, h, cx + dx * scale, cy + dy * scale, d, i);
        } else {
          d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = s[i + 3];
        }
      }
    }
  }
}
