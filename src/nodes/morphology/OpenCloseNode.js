import { EffectNode } from '../EffectNode.js';
import { DilateErodeNode } from './DilateErodeNode.js';

export class OpenCloseNode extends EffectNode {
  constructor() {
    super('openclose', 'OPEN/CLOSE', {
      mode:   { value: 'open', options: ['open', 'close'], label: 'MODE', type: 'select' },
      radius: { value: 1, min: 1, max: 10, step: 1, label: 'RADIUS' }
    });
    this._helper = new DilateErodeNode();
  }

  apply(s, d, w, h, ctx) {
    const r = this.params.radius;
    const tmp = new Uint8ClampedArray(s.length);

    if (this.params.mode === 'open') {
      // Erode then dilate
      this._helper.params = { mode: 'erode', radius: r, shape: 'circle' };
      this._helper.apply(s, tmp, w, h, ctx);
      this._helper.params = { mode: 'dilate', radius: r, shape: 'circle' };
      this._helper.apply(tmp, d, w, h, ctx);
    } else {
      // Dilate then erode
      this._helper.params = { mode: 'dilate', radius: r, shape: 'circle' };
      this._helper.apply(s, tmp, w, h, ctx);
      this._helper.params = { mode: 'erode', radius: r, shape: 'circle' };
      this._helper.apply(tmp, d, w, h, ctx);
    }
  }
}
