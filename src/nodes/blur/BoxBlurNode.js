import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class BoxBlurNode extends EffectNode {
  constructor() {
    super('boxblur', 'BOX BLUR', {
      radius: { value: 3, min: 1, max: 50, step: 1, label: 'RADIUS' },
      passes: { value: 1, min: 1, max: 5, step: 1, label: 'PASSES' }
    });
  }

  apply(s, d, w, h, ctx) {
    let r = this.params.radius;
    let p = this.params.passes;
    if (ctx.quality === 'preview') {
      r = Math.max(1, Math.round(r * 0.5));
      p = Math.min(p, 2);
    }
    let cur = new Uint8ClampedArray(s);
    let tmp = new Uint8ClampedArray(s.length);
    for (let pass = 0; pass < p; pass++) {
      this._bH(cur, tmp, w, h, r);
      this._bV(tmp, cur, w, h, r);
    }
    d.set(cur);
  }

  _bH(s, d, w, h, r) {
    const dia = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      let sr = 0, sg = 0, sb = 0, sa = 0;
      for (let x = -r; x <= r; x++) {
        const c = Sampler.clamp(x, w);
        const i = (y * w + c) * 4;
        sr += s[i]; sg += s[i + 1]; sb += s[i + 2]; sa += s[i + 3];
      }
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        d[i] = sr / dia; d[i + 1] = sg / dia; d[i + 2] = sb / dia; d[i + 3] = sa / dia;
        const a = Sampler.clamp(x + r + 1, w);
        const rm = Sampler.clamp(x - r, w);
        const ai = (y * w + a) * 4;
        const ri = (y * w + rm) * 4;
        sr += s[ai] - s[ri]; sg += s[ai + 1] - s[ri + 1];
        sb += s[ai + 2] - s[ri + 2]; sa += s[ai + 3] - s[ri + 3];
      }
    }
  }

  _bV(s, d, w, h, r) {
    const dia = 2 * r + 1;
    for (let x = 0; x < w; x++) {
      let sr = 0, sg = 0, sb = 0, sa = 0;
      for (let y = -r; y <= r; y++) {
        const c = Sampler.clamp(y, h);
        const i = (c * w + x) * 4;
        sr += s[i]; sg += s[i + 1]; sb += s[i + 2]; sa += s[i + 3];
      }
      for (let y = 0; y < h; y++) {
        const i = (y * w + x) * 4;
        d[i] = sr / dia; d[i + 1] = sg / dia; d[i + 2] = sb / dia; d[i + 3] = sa / dia;
        const a = Sampler.clamp(y + r + 1, h);
        const rm = Sampler.clamp(y - r, h);
        const ai = (a * w + x) * 4;
        const ri = (rm * w + x) * 4;
        sr += s[ai] - s[ri]; sg += s[ai + 1] - s[ri + 1];
        sb += s[ai + 2] - s[ri + 2]; sa += s[ai + 3] - s[ri + 3];
      }
    }
  }
}
