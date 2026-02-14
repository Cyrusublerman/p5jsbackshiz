import { EffectNode } from '../EffectNode.js';
import { PerlinNoise } from '../../core/PerlinNoise.js';
import { Sampler } from '../../core/Sampler.js';

export class FlowFieldNode extends EffectNode {
  constructor() {
    super('flowfield', 'FLOW FIELD', {
      noiseScale:  { value: 3, min: 0.1, max: 20, step: 0.1, label: 'NOISE SCALE' },
      octaves:     { value: 3, min: 1, max: 8, step: 1, label: 'OCTAVES' },
      lacunarity:  { value: 2, min: 1, max: 4, step: 0.1, label: 'LACUNARITY' },
      gain:        { value: 0.5, min: 0.1, max: 0.9, step: 0.05, label: 'GAIN' },
      strength:    { value: 40, min: 0, max: 200, step: 1, label: 'STRENGTH' },
      curl:        { value: 0, min: -1, max: 1, step: 0.01, label: 'CURL' },
      advectSteps: { value: 1, min: 1, max: 10, step: 1, label: 'ADVECT' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { noiseScale, octaves, lacunarity, gain, strength, curl, advectSteps } = this.params;
    const noise = new PerlinNoise(ctx.nodeSeed);
    const steps = ctx.quality === 'preview' ? Math.min(advectSteps, 3) : advectSteps;
    const sm = ctx.quality === 'preview' ? 'nearest' : 'bilinear';
    const str = strength * (ctx.quality === 'preview' ? ctx.previewScale : 1);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sx = x, sy = y;
        const ss = str / steps;
        for (let st = 0; st < steps; st++) {
          const u = sx / w * noiseScale, v = sy / h * noiseScale;
          let dx = noise.fbm(u, v, octaves, lacunarity, gain);
          let dy = noise.fbm(u + 31.7, v + 47.3, octaves, lacunarity, gain);
          if (curl) {
            const cd = dy * curl;
            const cy2 = -dx * curl;
            dx = dx * (1 - Math.abs(curl)) + cd;
            dy = dy * (1 - Math.abs(curl)) + cy2;
          }
          sx -= dx * ss;
          sy -= dy * ss;
        }
        const i = (y * w + x) * 4;
        Sampler.sampleDst(s, w, h, sx, sy, sm, d, i);
      }
    }
  }
}
