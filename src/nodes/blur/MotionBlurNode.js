import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class MotionBlurNode extends EffectNode {
  constructor() {
    super('motionblur', 'MOTION BLUR', {
      angle:    { value: 0, min: 0, max: 360, step: 1, label: 'ANGLE' },
      distance: { value: 10, min: 1, max: 100, step: 1, label: 'DISTANCE' }
    });
  }

  apply(s, d, w, h, ctx) {
    let dist = this.params.distance;
    if (ctx && ctx.quality === 'preview') dist = Math.max(1, Math.round(dist * 0.5));
    const rad = this.params.angle * Math.PI / 180;
    const dx = Math.cos(rad), dy = Math.sin(rad);
    const samples = Math.max(3, dist);
    const invS = 1 / samples;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let ar = 0, ag = 0, ab = 0, aa = 0;
        for (let si = 0; si < samples; si++) {
          const t = (si / (samples - 1) - 0.5) * dist;
          const fx = x + dx * t, fy = y + dy * t;
          const sx = Math.max(0, Math.min(w - 1, Math.round(fx)));
          const sy = Math.max(0, Math.min(h - 1, Math.round(fy)));
          const j = (sy * w + sx) * 4;
          ar += s[j]; ag += s[j + 1]; ab += s[j + 2]; aa += s[j + 3];
        }
        const i = (y * w + x) * 4;
        d[i] = ar * invS; d[i + 1] = ag * invS; d[i + 2] = ab * invS; d[i + 3] = aa * invS;
      }
    }
  }
}
