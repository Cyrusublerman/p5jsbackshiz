import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';

export class FilmGrainNode extends EffectNode {
  constructor() {
    super('filmgrain', 'FILM GRAIN', {
      amount:    { value: 25, min: 0, max: 100, step: 1, label: 'AMOUNT' },
      size:      { value: 1, min: 1, max: 3, step: 1, label: 'SIZE' },
      lumResp:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'LUM RESP' },
      chromatic: { value: 0, min: 0, max: 1, step: 1, label: 'CHROMATIC' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { amount, size, lumResp, chromatic } = this.params;
    const rng = new SeededRNG(ctx ? ctx.nodeSeed : 42);
    const scale = amount / 100;

    // Generate noise at grain size
    const gw = Math.ceil(w / size), gh = Math.ceil(h / size);
    const noiseR = new Float32Array(gw * gh);
    const noiseG = chromatic ? new Float32Array(gw * gh) : noiseR;
    const noiseB = chromatic ? new Float32Array(gw * gh) : noiseR;
    for (let i = 0; i < gw * gh; i++) {
      noiseR[i] = (rng.next() - 0.5) * 2;
      if (chromatic) { noiseG[i] = (rng.next() - 0.5) * 2; noiseB[i] = (rng.next() - 0.5) * 2; }
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const gi = Math.floor(y / size) * gw + Math.floor(x / size);
        const lum = (s[i] * 0.299 + s[i + 1] * 0.587 + s[i + 2] * 0.114) / 255;
        // Film grain is stronger in midtones, weaker in shadows/highlights
        const lumWeight = 1 - lumResp * Math.abs(lum - 0.5) * 2;
        const localAmount = this.getModulated('amount', y * w + x, ctx);
        const localScale = localAmount / 100;
        const str = localScale * lumWeight * 255;
        d[i]     = Math.max(0, Math.min(255, s[i]     + noiseR[gi] * str));
        d[i + 1] = Math.max(0, Math.min(255, s[i + 1] + noiseG[gi] * str));
        d[i + 2] = Math.max(0, Math.min(255, s[i + 2] + noiseB[gi] * str));
        d[i + 3] = s[i + 3];
      }
    }
  }
}
