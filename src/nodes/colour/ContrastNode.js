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
    this.isLUT = true;
  }

  _mapValue(v) {
    const { lift, gamma, gain, contrast, pivot } = this.params;
    const inv = 1 / gamma;
    let x = v / 255 * gain + lift;
    x = Math.pow(Math.max(0, x), inv);
    if (contrast) x = pivot + (x - pivot) * (1 + contrast);
    return Math.round(Math.max(0, Math.min(1, x)) * 255);
  }

  apply(s, d, w, h, ctx) {
    const hasGainMod = this.modulation.gain && this.modulation.gain.mapId && ctx && ctx.modMaps;
    if (!hasGainMod) {
      // Fast path: LUT
      const lut = new Uint8Array(256);
      for (let i = 0; i < 256; i++) lut[i] = this._mapValue(i);
      for (let i = 0, n = w * h * 4; i < n; i += 4) {
        d[i] = lut[s[i]]; d[i + 1] = lut[s[i + 1]]; d[i + 2] = lut[s[i + 2]]; d[i + 3] = s[i + 3];
      }
    } else {
      // Per-pixel modulated gain
      const { lift, gamma, contrast, pivot } = this.params;
      const inv = 1 / gamma;
      for (let i = 0, n = w * h * 4; i < n; i += 4) {
        const pi = i >> 2;
        const localGain = this.getModulated('gain', pi, ctx);
        for (let c = 0; c < 3; c++) {
          let v = s[i + c] / 255 * localGain + lift;
          v = Math.pow(Math.max(0, v), inv);
          if (contrast) v = pivot + (v - pivot) * (1 + contrast);
          d[i + c] = Math.round(Math.max(0, Math.min(1, v)) * 255);
        }
        d[i + 3] = s[i + 3];
      }
    }
  }

  buildLUT(lutR, lutG, lutB) {
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) lut[i] = this._mapValue(i);
    for (let i = 0; i < 256; i++) {
      lutR[i] = lut[lutR[i]];
      lutG[i] = lut[lutG[i]];
      lutB[i] = lut[lutB[i]];
    }
  }
}
