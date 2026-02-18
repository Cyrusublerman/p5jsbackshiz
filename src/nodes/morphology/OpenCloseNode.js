import { EffectNode } from '../EffectNode.js';
import { grayscaleOpen, grayscaleClose } from '../../modules/morphology/operations.js';

export class OpenCloseNode extends EffectNode {
  constructor() {
    super('openclose', 'OPEN/CLOSE', {
      mode:   { value: 'open', options: ['open', 'close'], label: 'MODE', type: 'select' },
      radius: { value: 1, min: 1, max: 10, step: 1, label: 'RADIUS' }
    });
  }

  apply(s, d, w, h) {
    const radius = this.params.radius;
    const op = this.params.mode === 'open' ? grayscaleOpen : grayscaleClose;

    const n = w * h;
    const r = new Uint8Array(n);
    const g = new Uint8Array(n);
    const b = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      const j = i * 4;
      r[i] = s[j];
      g[i] = s[j + 1];
      b[i] = s[j + 2];
    }

    const ro = op(r, w, h, radius);
    const go = op(g, w, h, radius);
    const bo = op(b, w, h, radius);

    for (let i = 0; i < n; i++) {
      const j = i * 4;
      d[j] = ro[i];
      d[j + 1] = go[i];
      d[j + 2] = bo[i];
      d[j + 3] = s[j + 3];
    }
  }
}
