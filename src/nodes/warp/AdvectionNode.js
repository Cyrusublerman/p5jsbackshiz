import { EffectNode } from '../EffectNode.js';
import { PerlinNoise } from '../../core/PerlinNoise.js';
import { Sampler } from '../../core/Sampler.js';

export class AdvectionNode extends EffectNode {
  constructor() {
    super('advection', 'ADVECTION', {
      velocityType: { value: 'noise', options: ['noise', 'radial', 'vortex'], label: 'VELOCITY', type: 'select' },
      steps:        { value: 5, min: 1, max: 30, step: 1, label: 'STEPS' },
      speed:        { value: 2, min: 0.1, max: 20, step: 0.1, label: 'SPEED' },
      noiseScale:   { value: 3, min: 0.1, max: 20, step: 0.1, label: 'NOISE SC' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { velocityType, speed, noiseScale } = this.params;
    let steps = this.params.steps;
    if (ctx && ctx.quality === 'preview') steps = Math.min(steps, 3);
    const noise = new PerlinNoise(ctx ? ctx.nodeSeed : 42);
    const cx = w / 2, cy = h / 2;

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let px = x, py = y;
      for (let st = 0; st < steps; st++) {
        let vx, vy;
        if (velocityType === 'noise') {
          vx = noise.fbm(px / w * noiseScale, py / h * noiseScale, 3);
          vy = noise.fbm(px / w * noiseScale + 31.7, py / h * noiseScale + 47.3, 3);
        } else if (velocityType === 'radial') {
          const dx = px - cx, dy = py - cy;
          const dist = Math.sqrt(dx*dx+dy*dy) || 1;
          vx = dx / dist; vy = dy / dist;
        } else { // vortex
          const dx = px - cx, dy = py - cy;
          const dist = Math.sqrt(dx*dx+dy*dy) || 1;
          vx = -dy / dist; vy = dx / dist;
        }
        px -= vx * speed; py -= vy * speed;
      }
      const i = (y * w + x) * 4;
      Sampler.bilinearDst(s, w, h, px, py, d, i);
    }
  }
}
