import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';

export class VoronoiNode extends EffectNode {
  constructor() {
    super('voronoi', 'VORONOI', {
      pointCount: { value: 64, min: 4, max: 512, step: 1, label: 'POINTS' },
      colorMode:  { value: 'cell', options: ['distance', 'cell', 'edge'], label: 'MODE', type: 'select' },
      blendAmt:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'BLEND' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { pointCount, colorMode, blendAmt } = this.params;
    const rng = new SeededRNG(ctx ? ctx.nodeSeed : 42);
    const pts = [];
    for (let i = 0; i < pointCount; i++) {
      pts.push({ x: rng.next() * w, y: rng.next() * h,
        r: rng.nextInt(50, 255), g: rng.nextInt(50, 255), b: rng.nextInt(50, 255) });
    }

    const inv = 1 - blendAmt;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let minD = Infinity, minD2 = Infinity, minIdx = 0;
      for (let p = 0; p < pts.length; p++) {
        const dx = x - pts[p].x, dy = y - pts[p].y;
        const dd = dx*dx + dy*dy;
        if (dd < minD) { minD2 = minD; minD = dd; minIdx = p; }
        else if (dd < minD2) minD2 = dd;
      }
      const oi = (y * w + x) * 4;
      if (colorMode === 'distance') {
        const v = Math.min(255, Math.sqrt(minD));
        d[oi]=Math.round(s[oi]*inv + v*blendAmt);
        d[oi+1]=Math.round(s[oi+1]*inv + v*blendAmt);
        d[oi+2]=Math.round(s[oi+2]*inv + v*blendAmt);
      } else if (colorMode === 'cell') {
        const cp = pts[minIdx];
        d[oi]=Math.round(s[oi]*inv + cp.r*blendAmt);
        d[oi+1]=Math.round(s[oi+1]*inv + cp.g*blendAmt);
        d[oi+2]=Math.round(s[oi+2]*inv + cp.b*blendAmt);
      } else { // edge
        const edge = Math.sqrt(minD2) - Math.sqrt(minD);
        const v = edge < 2 ? 0 : 255;
        d[oi]=Math.round(s[oi]*inv + v*blendAmt);
        d[oi+1]=Math.round(s[oi+1]*inv + v*blendAmt);
        d[oi+2]=Math.round(s[oi+2]*inv + v*blendAmt);
      }
      d[oi+3] = s[oi+3];
    }
  }
}
