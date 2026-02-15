import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class WaveDistortionNode extends EffectNode {
  constructor() {
    super('wavedistortion', 'WAVE DISTORT', {
      speed:    { value: 0.5, min: 0.01, max: 2, step: 0.01, label: 'SPEED' },
      damping:  { value: 0.995, min: 0.9, max: 1, step: 0.001, label: 'DAMPING' },
      steps:    { value: 100, min: 10, max: 500, step: 10, label: 'STEPS' },
      strength: { value: 10, min: 0, max: 50, step: 1, label: 'STRENGTH' },
      initType: { value: 'gaussian', options: ['gaussian', 'ripple'], label: 'INIT', type: 'select' },
      radius:   { value: 0.1, min: 0.01, max: 0.5, step: 0.01, label: 'RADIUS' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { speed, damping, strength, initType, radius } = this.params;
    let steps = this.params.steps;
    if (ctx && ctx.quality === 'preview') steps = Math.min(steps, 30);
    const n = w * h;
    const c2 = speed * speed;
    const cx = w / 2, cy = h / 2, rPx = radius * Math.min(w, h);

    let cur = new Float32Array(n), prev = new Float32Array(n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      let v = 0;
      if (initType === 'gaussian') v = Math.exp(-(dist*dist)/(2*rPx*rPx));
      else v = Math.cos(dist/rPx * Math.PI) * Math.exp(-dist/(2*rPx));
      cur[y*w+x] = prev[y*w+x] = v;
    }

    let next = new Float32Array(n);
    for (let step = 0; step < steps; step++) {
      for (let y = 1; y < h-1; y++) for (let x = 1; x < w-1; x++) {
        const i = y*w+x;
        const lap = cur[i-1]+cur[i+1]+cur[i-w]+cur[i+w]-4*cur[i];
        next[i] = damping * (2*cur[i] - prev[i] + c2*lap);
      }
      [prev, cur, next] = [cur, next, prev];
    }

    // Use wave height as displacement to warp source
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y*w+x;
      const disp = cur[i] * strength;
      const oi = i * 4;
      Sampler.bilinearDst(s, w, h, x + disp, y + disp, d, oi);
    }
  }
}
