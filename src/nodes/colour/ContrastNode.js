import { EffectNode } from '../EffectNode.js';

export class ContrastNode extends EffectNode {
  constructor() {
    super('contrast', 'LIFT/GAM/GAIN', {
      lift:     { value: 0, min: -0.5, max: 0.5, step: 0.01, label: 'LIFT' },
      gamma:    { value: 1, min: 0.2, max: 3, step: 0.01, label: 'GAMMA' },
      gain:     { value: 1, min: 0, max: 3, step: 0.01, label: 'GAIN' },
      contrast: { value: 0, min: -1, max: 1, step: 0.01, label: 'CONTRAST' },
      pivot:    { value: 0.5, min: 0, max: 1, step: 0.01, label: 'PIVOT' }
    });
  }

  apply(s, d, w, h) {
    const { lift, gamma, gain, contrast, pivot } = this.params;
    const inv = 1 / gamma;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      for (let c = 0; c < 3; c++) {
        let v = s[i + c] / 255 * gain + lift;
        v = Math.pow(Math.max(0, v), inv);
        if (contrast) v = pivot + (v - pivot) * (1 + contrast);
        d[i + c] = Math.round(Math.max(0, Math.min(1, v)) * 255);
      }
      d[i + 3] = s[i + 3];
    }
  }
}
