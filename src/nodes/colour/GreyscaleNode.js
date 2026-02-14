import { EffectNode } from '../EffectNode.js';

export class GreyscaleNode extends EffectNode {
  constructor() {
    super('greyscale', 'GREYSCALE', {
      wr: { value: 0.299, min: 0, max: 1, step: 0.01, label: 'R WEIGHT' },
      wg: { value: 0.587, min: 0, max: 1, step: 0.01, label: 'G WEIGHT' },
      wb: { value: 0.114, min: 0, max: 1, step: 0.01, label: 'B WEIGHT' }
    });
  }

  apply(s, d, w, h) {
    const { wr, wg, wb } = this.params;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const l = s[i] * wr + s[i + 1] * wg + s[i + 2] * wb;
      d[i] = d[i + 1] = d[i + 2] = l;
      d[i + 3] = s[i + 3];
    }
  }
}
