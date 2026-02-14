import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';

export class StippleNode extends EffectNode {
  constructor() {
    super('stipple', 'STIPPLE', {
      minDist:  { value: 4, min: 2, max: 20, step: 1, label: 'MIN DIST' },
      dotRadius:{ value: 1.5, min: 0.5, max: 5, step: 0.5, label: 'DOT RAD' },
      attempts: { value: 30, min: 5, max: 100, step: 5, label: 'ATTEMPTS' },
      bgLevel:  { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      dotLevel: { value: 0, min: 0, max: 255, step: 1, label: 'DOT LEVEL' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { minDist, dotRadius, attempts, bgLevel, dotLevel } = this.params;
    const rng = new SeededRNG(ctx ? ctx.nodeSeed : 42);

    // Build luminance
    const n = w * h;
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j=i*4; lum[i]=(s[j]*0.299+s[j+1]*0.587+s[j+2]*0.114)/255; }

    // Poisson-ish importance sampling
    const cellSize = minDist / Math.SQRT2;
    const gw = Math.ceil(w / cellSize), gh = Math.ceil(h / cellSize);
    const grid = new Int32Array(gw * gh).fill(-1);
    const points = [];

    const maxPts = ctx && ctx.quality === 'preview' ? 3000 : 15000;

    for (let iter = 0; iter < maxPts; iter++) {
      const px = rng.next() * w, py = rng.next() * h;
      const ix = Math.floor(px / cellSize), iy = Math.floor(py / cellSize);
      const li = Math.floor(py) * w + Math.floor(px);
      const l = li >= 0 && li < n ? lum[li] : 0.5;
      // Darker pixels = higher probability of accepting point
      if (rng.next() > (1 - l) * 0.8 + 0.1) continue;

      // Check minimum distance
      let tooClose = false;
      for (let dy = -2; dy <= 2 && !tooClose; dy++) {
        for (let dx = -2; dx <= 2 && !tooClose; dx++) {
          const nx = ix+dx, ny = iy+dy;
          if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue;
          const gi = grid[ny * gw + nx];
          if (gi >= 0) {
            const ddx = px - points[gi * 2], ddy = py - points[gi * 2 + 1];
            if (ddx*ddx + ddy*ddy < minDist*minDist) tooClose = true;
          }
        }
      }
      if (tooClose) continue;

      const pi = points.length / 2;
      points.push(px, py);
      grid[iy * gw + ix] = pi;
    }

    // Render
    for (let i = 0, nn = w*h*4; i < nn; i += 4) { d[i]=d[i+1]=d[i+2]=bgLevel; d[i+3]=s[i+3]; }
    const r2 = dotRadius * dotRadius;
    const ir = Math.ceil(dotRadius);
    for (let p = 0; p < points.length; p += 2) {
      const px = points[p], py = points[p+1];
      for (let dy = -ir; dy <= ir; dy++) {
        const ny = Math.round(py) + dy; if (ny < 0 || ny >= h) continue;
        for (let dx = -ir; dx <= ir; dx++) {
          const nx = Math.round(px) + dx; if (nx < 0 || nx >= w) continue;
          if (dx*dx+dy*dy <= r2) {
            const oi = (ny*w+nx)*4;
            d[oi]=d[oi+1]=d[oi+2]=dotLevel;
          }
        }
      }
    }
  }
}
