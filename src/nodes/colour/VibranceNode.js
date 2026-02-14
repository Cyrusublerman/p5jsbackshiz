import { EffectNode } from '../EffectNode.js';

export class VibranceNode extends EffectNode {
  constructor() {
    super('vibrance', 'VIBRANCE', {
      vibrance: { value: 0, min: -1, max: 1, step: 0.01, label: 'VIBRANCE' }
    });
  }

  apply(s, d, w, h) {
    const vib = this.params.vibrance;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const r = s[i] / 255, g = s[i + 1] / 255, b = s[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max - min; // rough saturation
      // Less-saturated pixels get more boost
      const amt = vib * (1 - sat) * (1 - sat);
      const avg = (r + g + b) / 3;
      d[i]     = Math.max(0, Math.min(255, Math.round((r + (r - avg) * amt) * 255)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round((g + (g - avg) * amt) * 255)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round((b + (b - avg) * amt) * 255)));
      d[i + 3] = s[i + 3];
    }
  }
}
