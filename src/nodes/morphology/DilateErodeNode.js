import { EffectNode } from '../EffectNode.js';
import { grayscaleDilate, grayscaleErode } from '../../modules/morphology/operations.js';

export class DilateErodeNode extends EffectNode {
  constructor() {
    super('dilateerode', 'DILATE/ERODE', {
      mode:   { value: 'dilate', options: ['dilate', 'erode'], label: 'MODE', type: 'select' },
      radius: { value: 1, min: 1, max: 10, step: 1, label: 'RADIUS' },
      shape:  { value: 'square', options: ['square', 'circle'], label: 'SHAPE', type: 'select' }
    });
  }

  apply(s, d, w, h) {
    const radius = this.params.radius;
    const erodeMode = this.params.mode === 'erode';

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

    const morph = erodeMode ? grayscaleErode : grayscaleDilate;
    const ro = morph(r, w, h, radius);
    const go = morph(g, w, h, radius);
    const bo = morph(b, w, h, radius);

    for (let i = 0; i < n; i++) {
      const j = i * 4;
      d[j] = ro[i];
      d[j + 1] = go[i];
      d[j + 2] = bo[i];
      d[j + 3] = s[j + 3];
    }
  }
}
