import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';
import { Sampler } from '../../core/Sampler.js';

export class LensBubblesNode extends EffectNode {
  constructor() {
    super('lensbubbles', 'LENS BUBBLES', {
      count:         { value: 5, min: 1, max: 30, step: 1, label: 'COUNT' },
      minRadius:     { value: 0.03, min: 0.01, max: 0.3, step: 0.01, label: 'MIN RAD' },
      maxRadius:     { value: 0.12, min: 0.02, max: 0.5, step: 0.01, label: 'MAX RAD' },
      magnification: { value: 1.5, min: 0.2, max: 5, step: 0.1, label: 'MAGNIFY' },
      edgeSoft:      { value: 0.2, min: 0, max: 1, step: 0.01, label: 'EDGE SOFT' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { count, minRadius, maxRadius, magnification, edgeSoft } = this.params;
    const rng = new SeededRNG(ctx.nodeSeed);
    const diag = Math.sqrt(w * w + h * h);
    const bubbles = [];
    for (let i = 0; i < count; i++) {
      bubbles.push({
        cx: rng.next() * w,
        cy: rng.next() * h,
        r: rng.nextRange(minRadius, maxRadius) * diag
      });
    }
    const sm = ctx.quality === 'preview' ? 'nearest' : 'bilinear';

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sx = x, sy = y;
        for (const b of bubbles) {
          const dx = x - b.cx, dy = y - b.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < b.r) {
            const t = dist / b.r;
            const se = edgeSoft > 0 ? Math.min(1, (1 - t) / edgeSoft) : 1;
            const m = 1 + (magnification - 1) * se * (1 - t * t);
            sx = b.cx + dx / m;
            sy = b.cy + dy / m;
            break;
          }
        }
        const i = (y * w + x) * 4;
        Sampler.sampleDst(s, w, h, sx, sy, sm, d, i);
      }
    }
  }
}
