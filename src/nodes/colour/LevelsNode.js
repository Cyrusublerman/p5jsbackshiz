import { EffectNode } from '../EffectNode.js';

export class LevelsNode extends EffectNode {
  constructor() {
    super('levels', 'LEVELS', {
      blackPoint: { value: 0, min: 0, max: 255, step: 1, label: 'BLACK IN' },
      whitePoint: { value: 255, min: 0, max: 255, step: 1, label: 'WHITE IN' },
      midGamma:   { value: 1, min: 0.1, max: 3, step: 0.01, label: 'GAMMA' },
      outBlack:   { value: 0, min: 0, max: 255, step: 1, label: 'BLACK OUT' },
      outWhite:   { value: 255, min: 0, max: 255, step: 1, label: 'WHITE OUT' }
    });
    this.isLUT = true;
  }

  _buildInternalLUT() {
    const { blackPoint, whitePoint, midGamma, outBlack, outWhite } = this.params;
    const rng = Math.max(whitePoint - blackPoint, 1);
    const oR = outWhite - outBlack;
    const inv = 1 / midGamma;
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.round(
        outBlack + Math.pow(Math.max(0, Math.min(1, (i - blackPoint) / rng)), inv) * oR
      );
    }
    return lut;
  }

  apply(s, d, w, h) {
    const lut = this._buildInternalLUT();
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i]     = lut[s[i]];
      d[i + 1] = lut[s[i + 1]];
      d[i + 2] = lut[s[i + 2]];
      d[i + 3] = s[i + 3];
    }
  }

  buildLUT(lutR, lutG, lutB) {
    const lut = this._buildInternalLUT();
    for (let i = 0; i < 256; i++) {
      lutR[i] = lut[lutR[i]];
      lutG[i] = lut[lutG[i]];
      lutB[i] = lut[lutB[i]];
    }
  }
}
