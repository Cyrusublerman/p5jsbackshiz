import { EffectNode } from '../EffectNode.js';

export class PosterizeNode extends EffectNode {
  constructor() {
    super('posterize', 'POSTERIZE', {
      levels: { value: 4, min: 2, max: 32, step: 1, label: 'LEVELS' }
    });
    this.isLUT = true;
  }

  apply(s, d, w, h) {
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) lut[i] = this._map(i);
    for (let i = 0, n = w*h*4; i < n; i += 4) {
      d[i]=lut[s[i]]; d[i+1]=lut[s[i+1]]; d[i+2]=lut[s[i+2]]; d[i+3]=s[i+3];
    }
  }

  _map(v) {
    const n = this.params.levels;
    const step = 1 / n;
    const level = Math.min(Math.floor((v / 255) / step), n - 1);
    return Math.round((level / (n - 1)) * 255);
  }

  buildLUT(lutR, lutG, lutB) {
    for (let i = 0; i < 256; i++) {
      const m = this._map(i);
      lutR[i] = this._map(lutR[i]);
      lutG[i] = this._map(lutG[i]);
      lutB[i] = this._map(lutB[i]);
    }
  }
}
