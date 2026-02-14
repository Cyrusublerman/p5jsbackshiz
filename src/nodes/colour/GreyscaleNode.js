import { EffectNode } from '../EffectNode.js';

export class GreyscaleNode extends EffectNode {
  constructor() {
    super('greyscale', 'GREYSCALE', {
      wr: { value: 0.299, min: 0, max: 1, step: 0.01, label: 'R WEIGHT' },
      wg: { value: 0.587, min: 0, max: 1, step: 0.01, label: 'G WEIGHT' },
      wb: { value: 0.114, min: 0, max: 1, step: 0.01, label: 'B WEIGHT' }
    });
    this.isLUT = true;
  }

  apply(s, d, w, h) {
    const { wr, wg, wb } = this.params;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const l = s[i] * wr + s[i + 1] * wg + s[i + 2] * wb;
      d[i] = d[i + 1] = d[i + 2] = l;
      d[i + 3] = s[i + 3];
    }
  }

  buildLUT(lutR, lutG, lutB) {
    const { wr, wg, wb } = this.params;
    const tmpR = new Uint8Array(256);
    const tmpG = new Uint8Array(256);
    const tmpB = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      tmpR[i] = lutR[i]; tmpG[i] = lutG[i]; tmpB[i] = lutB[i];
    }
    // Greyscale: output = wr*R + wg*G + wb*B for all channels
    // For LUT fusion, we approximate: each channel independently weighted
    for (let i = 0; i < 256; i++) {
      const grey = Math.round(tmpR[i] * wr + tmpG[i] * wg + tmpB[i] * wb);
      lutR[i] = lutG[i] = lutB[i] = Math.max(0, Math.min(255, grey));
    }
  }
}
