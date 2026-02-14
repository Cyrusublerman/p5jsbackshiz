import { EffectNode } from '../EffectNode.js';

export class MoireNode extends EffectNode {
  constructor() {
    super('moire', 'MOIRE', {
      wavelength1: { value: 15, min: 2, max: 100, step: 1, label: 'WAVE 1' },
      angle1:      { value: 0, min: 0, max: 180, step: 1, label: 'ANGLE 1' },
      wavelength2: { value: 16, min: 2, max: 100, step: 1, label: 'WAVE 2' },
      angle2:      { value: 5, min: 0, max: 180, step: 1, label: 'ANGLE 2' },
      combineMode: { value: 'product', options: ['product', 'sum', 'xor', 'min', 'max'], label: 'COMBINE', type: 'select' },
      blendMode:   { value: 'multiply', options: ['multiply', 'screen', 'replace'], label: 'BLEND', type: 'select' }
    });
  }

  apply(s, d, w, h) {
    const { wavelength1: wl1, angle1: a1, wavelength2: wl2, angle2: a2, combineMode, blendMode } = this.params;
    const r1 = a1 * Math.PI / 180, r2 = a2 * Math.PI / 180;
    const PI2 = Math.PI * 2;

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const rx1 = x * Math.cos(r1) + y * Math.sin(r1);
      const rx2 = x * Math.cos(r2) + y * Math.sin(r2);
      const i1 = 0.5 * (1 + Math.cos(PI2 * rx1 / wl1));
      const i2 = 0.5 * (1 + Math.cos(PI2 * rx2 / wl2));
      let v;
      if (combineMode === 'product') v = i1 * i2;
      else if (combineMode === 'sum') v = Math.min(1, (i1 + i2) / 2);
      else if (combineMode === 'xor') v = Math.abs(i1 - i2);
      else if (combineMode === 'min') v = Math.min(i1, i2);
      else v = Math.max(i1, i2);

      const oi = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        if (blendMode === 'replace') d[oi+c] = Math.round(v * 255);
        else if (blendMode === 'multiply') d[oi+c] = Math.round(s[oi+c] * v);
        else d[oi+c] = Math.round(255 - (255-s[oi+c]) * (1-v));
      }
      d[oi+3] = s[oi+3];
    }
  }
}
