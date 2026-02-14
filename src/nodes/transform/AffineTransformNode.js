import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class AffineTransformNode extends EffectNode {
  constructor() {
    super('affine', 'AFFINE XFORM', {
      translateX: { value: 0, min: -1, max: 1, step: 0.01, label: 'TRANSLATE X' },
      translateY: { value: 0, min: -1, max: 1, step: 0.01, label: 'TRANSLATE Y' },
      rotate:     { value: 0, min: -180, max: 180, step: 0.5, label: 'ROTATE' },
      scaleX:     { value: 1, min: 0.1, max: 5, step: 0.01, label: 'SCALE X' },
      scaleY:     { value: 1, min: 0.1, max: 5, step: 0.01, label: 'SCALE Y' },
      centreX:    { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY:    { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { translateX, translateY, rotate, scaleX, scaleY, centreX, centreY } = this.params;
    const cx = centreX * w, cy = centreY * h;
    const rad = -rotate * Math.PI / 180;
    const cosR = Math.cos(rad), sinR = Math.sin(rad);
    const isx = 1 / scaleX, isy = 1 / scaleY;
    const tx = translateX * w, ty = translateY * h;
    const sm = ctx.quality === 'preview' ? 'nearest' : 'bilinear';

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let px = x - cx - tx, py = y - cy - ty;
        const i = (y * w + x) * 4;
        Sampler.sampleDst(
          s, w, h,
          (px * cosR - py * sinR) * isx + cx,
          (px * sinR + py * cosR) * isy + cy,
          sm, d, i
        );
      }
    }
  }
}
