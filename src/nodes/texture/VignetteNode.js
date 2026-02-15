import { EffectNode } from '../EffectNode.js';

export class VignetteNode extends EffectNode {
  constructor() {
    super('vignette', 'VIGNETTE', {
      amount:    { value: 0.5, min: 0, max: 1, step: 0.01, label: 'AMOUNT' },
      softness:  { value: 0.5, min: 0.01, max: 1, step: 0.01, label: 'SOFTNESS' },
      roundness: { value: 1, min: 0, max: 1, step: 0.01, label: 'ROUNDNESS' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { amount, softness, roundness } = this.params;
    const hasAmtMod = this.modulation.amount?.mapId && ctx?.modMaps;
    const cx = w / 2, cy = h / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) / cx, dy = (y - cy) / cy;
        // Roundness: 1=circular, 0=follows image aspect
        const rx = roundness + (1 - roundness) * (w / Math.max(w, h));
        const ry = roundness + (1 - roundness) * (h / Math.max(w, h));
        const dist = Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));
        const edge = 1 - softness;
        const v = dist < edge ? 1 : Math.max(0, 1 - ((dist - edge) / softness));
        const localAmount = hasAmtMod ? this.getModulated('amount', y * w + x, ctx) : amount;
        const factor = 1 - localAmount * (1 - v * v);
        const i = (y * w + x) * 4;
        d[i] = s[i] * factor; d[i + 1] = s[i + 1] * factor; d[i + 2] = s[i + 2] * factor;
        d[i + 3] = s[i + 3];
      }
    }
  }
}
