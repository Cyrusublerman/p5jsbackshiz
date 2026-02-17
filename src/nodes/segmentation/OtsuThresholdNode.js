import { EffectNode } from '../EffectNode.js';
import { otsuThreshold } from '../../modules/segmentation/advanced.js';

export class OtsuThresholdNode extends EffectNode {
  constructor() {
    super('otsuthreshold', 'OTSU THRESH', {
      mode:   { value: 'binary', options: ['binary', 'mask'], label: 'MODE', type: 'select' },
      invert: { value: 0, min: 0, max: 1, step: 1, label: 'INVERT' }
    });
  }

  apply(s, d, w, h) {
    const n = w * h;
    const luma = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      luma[i] = Math.round(s[j] * 0.299 + s[j + 1] * 0.587 + s[j + 2] * 0.114);
    }

    const bestT = otsuThreshold(luma);
    const inv = this.params.invert;
    const isMask = this.params.mode === 'mask';

    for (let i = 0; i < n; i++) {
      const j = i * 4;
      let bit = luma[i] > bestT ? 1 : 0;
      if (inv) bit = 1 - bit;
      if (isMask) {
        d[j] = s[j] * bit;
        d[j + 1] = s[j + 1] * bit;
        d[j + 2] = s[j + 2] * bit;
      } else {
        const v = bit * 255;
        d[j] = v;
        d[j + 1] = v;
        d[j + 2] = v;
      }
      d[j + 3] = s[j + 3];
    }
  }
}
