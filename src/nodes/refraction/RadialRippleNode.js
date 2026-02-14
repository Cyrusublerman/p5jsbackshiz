import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class RadialRippleNode extends EffectNode {
  constructor() {
    super('ripple', 'RADIAL RIPPLE', {
      centreX:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' },
      amplitude: { value: 15, min: 0, max: 100, step: 0.5, label: 'AMPLITUDE' },
      frequency: { value: 10, min: 0.5, max: 50, step: 0.5, label: 'FREQUENCY' },
      phase:     { value: 0, min: 0, max: 6.28, step: 0.01, label: 'PHASE' },
      falloff:   { value: 1, min: 0, max: 5, step: 0.1, label: 'FALLOFF' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { centreX, centreY, amplitude, frequency, phase, falloff } = this.params;
    const cx = centreX * w, cy = centreY * h;
    const md = Math.sqrt(w * w + h * h) * 0.5;
    const sm = ctx.quality === 'preview' ? 'nearest' : 'bilinear';

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.001) {
          const i = (y * w + x) * 4;
          d[i] = s[i]; d[i + 1] = s[i + 1]; d[i + 2] = s[i + 2]; d[i + 3] = s[i + 3];
          continue;
        }
        const off = Math.sin(dist / w * frequency * Math.PI * 2 + phase) *
                    amplitude * Math.exp(-(dist / md) * falloff);
        const ang = Math.atan2(dy, dx);
        const i = (y * w + x) * 4;
        Sampler.sampleDst(s, w, h, x + Math.cos(ang) * off, y + Math.sin(ang) * off, sm, d, i);
      }
    }
  }
}
