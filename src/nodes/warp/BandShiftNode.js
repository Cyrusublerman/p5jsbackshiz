import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';
import { PerlinNoise } from '../../core/PerlinNoise.js';
import { Sampler } from '../../core/Sampler.js';

export class BandShiftNode extends EffectNode {
  constructor() {
    super('bandshift', 'BAND SHIFT', {
      axis:       { value: 'horizontal', options: ['horizontal', 'vertical'], label: 'AXIS', type: 'select' },
      bandSize:   { value: 20, min: 2, max: 200, step: 1, label: 'BAND SIZE' },
      intensity:  { value: 30, min: 0, max: 200, step: 1, label: 'INTENSITY' },
      offsetType: { value: 'noise', options: ['noise', 'sine', 'stepped'], label: 'OFFSET', type: 'select' },
      phase:      { value: 0, min: 0, max: 6.28, step: 0.01, label: 'PHASE' },
      freq:       { value: 1, min: 0.1, max: 10, step: 0.1, label: 'FREQ' },
      noiseScale: { value: 2, min: 0.1, max: 10, step: 0.1, label: 'NOISE SC' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { axis, bandSize, intensity, offsetType, phase, freq, noiseScale } = this.params;
    const rng = new SeededRNG(ctx.nodeSeed);
    const noise = new PerlinNoise(ctx.nodeSeed);
    const isH = axis === 'horizontal';
    const dim = isH ? h : w;
    const num = Math.ceil(dim / Math.max(1, bandSize));
    const off = new Float32Array(num);

    for (let b = 0; b < num; b++) {
      const t = b / num;
      if (offsetType === 'sine') {
        off[b] = Math.sin(t * freq * Math.PI * 2 + phase) * intensity;
      } else if (offsetType === 'stepped') {
        off[b] = (Math.round(rng.next() * 4) - 2) * intensity * 0.5;
      } else {
        off[b] = noise.noise2D(t * noiseScale, phase) * intensity;
      }
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const bi = Math.min(Math.floor((isH ? y : x) / Math.max(1, bandSize)), num - 1);
        const o = off[bi];
        const i = (y * w + x) * 4;
        Sampler.bilinearDst(s, w, h, isH ? x + o : x, isH ? y : y + o, d, i);
      }
    }
  }
}
