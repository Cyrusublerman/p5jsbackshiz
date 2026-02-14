import { EffectNode } from '../EffectNode.js';
import { PerlinNoise } from '../../core/PerlinNoise.js';
import { Sampler } from '../../core/Sampler.js';

export class DomainWarpNode extends EffectNode {
  constructor() {
    super('domainwarp', 'DOMAIN WARP', {
      strength: { value: 30, min: 0, max: 200, step: 1, label: 'STRENGTH' },
      scale:    { value: 3, min: 0.1, max: 20, step: 0.1, label: 'SCALE' },
      octaves:  { value: 4, min: 1, max: 8, step: 1, label: 'OCTAVES' },
      layers:   { value: 1, min: 1, max: 3, step: 1, label: 'LAYERS' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { strength, scale, octaves, layers } = this.params;
    const noise = new PerlinNoise(ctx ? ctx.nodeSeed : 42);

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let wx = x, wy = y;
      for (let l = 0; l < layers; l++) {
        const sc = scale * Math.pow(2, l);
        const str = strength / Math.pow(2, l);
        const nx = noise.fbm(wx / w * sc, wy / h * sc, octaves);
        const ny = noise.fbm(wx / w * sc + 5.2, wy / h * sc + 1.3, octaves);
        wx += nx * str;
        wy += ny * str;
      }
      const i = (y * w + x) * 4;
      Sampler.bilinearDst(s, w, h, wx, wy, d, i);
    }
  }
}
