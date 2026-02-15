import { EffectNode } from '../EffectNode.js';
import { PerlinNoise } from '../../core/PerlinNoise.js';

export class PerlinOverlayNode extends EffectNode {
  constructor() {
    super('perlinoverlay', 'NOISE OVERLAY', {
      scale:       { value: 3, min: 0.1, max: 20, step: 0.1, label: 'SCALE' },
      octaves:     { value: 4, min: 1, max: 8, step: 1, label: 'OCTAVES' },
      strength:    { value: 0.3, min: 0, max: 1, step: 0.01, label: 'STRENGTH' },
      blendMode:   { value: 'add', options: ['add', 'multiply', 'screen', 'overlay'], label: 'BLEND', type: 'select' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { scale, octaves, strength, blendMode } = this.params;
    const noise = new PerlinNoise(ctx ? ctx.nodeSeed : 42);

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const n = (noise.fbm(x / w * scale, y / h * scale, octaves) + 1) * 0.5; // [0,1]
      const oi = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const sv = s[oi+c] / 255;
        let out;
        if (blendMode === 'add') out = sv + (n - 0.5) * strength * 2;
        else if (blendMode === 'multiply') out = sv * (1 - strength + n * strength);
        else if (blendMode === 'screen') out = 1 - (1-sv) * (1 - n * strength);
        else out = sv < 0.5 ? 2*sv*(0.5 + (n-0.5)*strength) : 1 - 2*(1-sv)*(0.5 + (0.5-n)*strength);
        d[oi+c] = Math.max(0, Math.min(255, Math.round(out * 255)));
      }
      d[oi+3] = s[oi+3];
    }
  }
}
