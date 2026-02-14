import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class ChromaticAbNode extends EffectNode {
  constructor() {
    super('chromaticab', 'CHROMATIC AB', {
      redShift:  { value: 2, min: -20, max: 20, step: 0.5, label: 'RED SHIFT' },
      blueShift: { value: -2, min: -20, max: 20, step: 0.5, label: 'BLUE SHIFT' },
      centreX:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' }
    });
  }

  apply(s, d, w, h) {
    const { redShift, blueShift, centreX, centreY } = this.params;
    const cx = centreX * w, cy = centreY * h;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt(cx * cx + cy * cy);
        const t = dist / (maxDist || 1);

        const i = (y * w + x) * 4;
        // Red channel: shifted outward
        const rOff = t * redShift;
        const rAng = dist > 0.001 ? Math.atan2(dy, dx) : 0;
        const rx = Math.max(0, Math.min(w - 1, Math.round(x + Math.cos(rAng) * rOff)));
        const ry = Math.max(0, Math.min(h - 1, Math.round(y + Math.sin(rAng) * rOff)));
        d[i] = s[(ry * w + rx) * 4];

        // Green channel: no shift
        d[i + 1] = s[i + 1];

        // Blue channel: shifted
        const bOff = t * blueShift;
        const bx = Math.max(0, Math.min(w - 1, Math.round(x + Math.cos(rAng) * bOff)));
        const by = Math.max(0, Math.min(h - 1, Math.round(y + Math.sin(rAng) * bOff)));
        d[i + 2] = s[(by * w + bx) * 4 + 2];

        d[i + 3] = s[i + 3];
      }
    }
  }
}
