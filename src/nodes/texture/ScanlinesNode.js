import { EffectNode } from '../EffectNode.js';

export class ScanlinesNode extends EffectNode {
  constructor() {
    super('scanlines', 'SCANLINES', {
      spacing:   { value: 2, min: 1, max: 10, step: 1, label: 'SPACING' },
      thickness: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'THICKNESS' },
      opacity:   { value: 0.3, min: 0, max: 1, step: 0.01, label: 'OPACITY' }
    });
  }

  apply(s, d, w, h) {
    const { spacing, thickness, opacity: op } = this.params;
    const keep = 1 - op;

    for (let y = 0; y < h; y++) {
      const linePhase = (y % spacing) / spacing;
      const isDark = linePhase < thickness;
      const factor = isDark ? keep : 1;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] = s[i] * factor; d[i + 1] = s[i + 1] * factor; d[i + 2] = s[i + 2] * factor;
        d[i + 3] = s[i + 3];
      }
    }
  }
}
