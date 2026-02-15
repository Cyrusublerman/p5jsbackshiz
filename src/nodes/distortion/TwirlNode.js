import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class TwirlNode extends EffectNode {
  constructor() {
    super('twirl', 'TWIRL', {
      angle:   { value: 180, min: -720, max: 720, step: 1, label: 'ANGLE' },
      centreX: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' },
      radius:  { value: 0.5, min: 0.01, max: 1, step: 0.01, label: 'RADIUS' }
    });
  }

  apply(s, d, w, h) {
    const { angle, centreX, centreY, radius } = this.params;
    const cx = centreX * w, cy = centreY * h;
    const r = radius * Math.min(w, h);
    const maxAngle = angle * Math.PI / 180;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const i = (y * w + x) * 4;
        if (dist < r) {
          const t = 1 - dist / r;
          const twist = t * t * maxAngle; // quadratic falloff
          const cosT = Math.cos(twist), sinT = Math.sin(twist);
          Sampler.bilinearDst(s, w, h, cx + dx * cosT - dy * sinT, cy + dx * sinT + dy * cosT, d, i);
        } else {
          d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = s[i + 3];
        }
      }
    }
  }
}
