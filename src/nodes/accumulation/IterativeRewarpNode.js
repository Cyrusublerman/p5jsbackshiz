import { EffectNode } from '../EffectNode.js';
import { SeededRNG, hashSeed } from '../../core/SeededRNG.js';
import { Sampler } from '../../core/Sampler.js';

export class IterativeRewarpNode extends EffectNode {
  constructor() {
    super('iterrewarp', 'ITER REWARP', {
      samples:     { value: 5, min: 2, max: 20, step: 1, label: 'SAMPLES' },
      jitterX:     { value: 10, min: 0, max: 100, step: 1, label: 'JITTER X' },
      jitterY:     { value: 10, min: 0, max: 100, step: 1, label: 'JITTER Y' },
      opacityMode: { value: 'decay', options: ['equal', 'decay'], label: 'BLEND', type: 'select' },
      decay:       { value: 0.7, min: 0.1, max: 0.99, step: 0.01, label: 'DECAY' },
      rotJitter:   { value: 0, min: 0, max: 10, step: 0.1, label: 'ROT JITTER' },
      scaleJitter: { value: 0, min: 0, max: 0.5, step: 0.01, label: 'SC JITTER' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { samples, jitterX, jitterY, opacityMode, decay, rotJitter, scaleJitter } = this.params;
    const n = ctx.quality === 'preview' ? Math.min(samples, 8) : samples;
    const sm = ctx.quality === 'preview' ? 'nearest' : 'bilinear';
    const aR = new Float32Array(w * h);
    const aG = new Float32Array(w * h);
    const aB = new Float32Array(w * h);
    const aA = new Float32Array(w * h);
    const aW = new Float32Array(w * h);

    for (let si = 0; si < n; si++) {
      const rng = new SeededRNG(hashSeed(ctx.nodeSeed, si, 999));
      const ox = (rng.next() - 0.5) * 2 * jitterX;
      const oy = (rng.next() - 0.5) * 2 * jitterY;
      const rot = (rng.next() - 0.5) * 2 * rotJitter * Math.PI / 180;
      const sc = 1 + (rng.next() - 0.5) * 2 * scaleJitter;
      const wt = opacityMode === 'decay' ? Math.pow(decay, si) : 1;
      const cosR = Math.cos(rot) * sc, sinR = Math.sin(rot) * sc;
      const cx = w * 0.5, cy = h * 0.5;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const px = x - cx, py = y - cy;
          const c = Sampler.sample(s, w, h,
            px * cosR - py * sinR + cx + ox,
            px * sinR + py * cosR + cy + oy, sm);
          const idx = y * w + x;
          aR[idx] += c[0] * wt; aG[idx] += c[1] * wt;
          aB[idx] += c[2] * wt; aA[idx] += c[3] * wt;
          aW[idx] += wt;
        }
      }
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const i = idx * 4;
        const wt = aW[idx] || 1;
        d[i] = aR[idx] / wt; d[i + 1] = aG[idx] / wt;
        d[i + 2] = aB[idx] / wt; d[i + 3] = aA[idx] / wt;
      }
    }
  }
}
