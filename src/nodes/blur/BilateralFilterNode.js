import { EffectNode } from '../EffectNode.js';

export class BilateralFilterNode extends EffectNode {
  constructor() {
    super('bilateral', 'BILATERAL', {
      spatialSigma: { value: 5, min: 1, max: 20, step: 0.5, label: 'SPATIAL σ' },
      rangeSigma:   { value: 30, min: 5, max: 100, step: 1, label: 'RANGE σ' }
    });
  }

  apply(s, d, w, h, ctx) {
    let sS = this.params.spatialSigma;
    const rS = this.params.rangeSigma;
    if (ctx && ctx.quality === 'preview') sS = Math.max(1, sS * 0.5);
    const rad = Math.ceil(sS * 2);
    const sSq2 = 2 * sS * sS;
    const rSq2 = 2 * rS * rS;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ci = (y * w + x) * 4;
        let wr = 0, wg = 0, wb = 0, wSum = 0;
        const cr = s[ci], cg = s[ci + 1], cb = s[ci + 2];

        for (let dy = -rad; dy <= rad; dy++) {
          const ny = Math.max(0, Math.min(h - 1, y + dy));
          for (let dx = -rad; dx <= rad; dx++) {
            const nx = Math.max(0, Math.min(w - 1, x + dx));
            const ni = (ny * w + nx) * 4;
            const nr = s[ni], ng = s[ni + 1], nb = s[ni + 2];
            const spatialDist = dx * dx + dy * dy;
            const rangeDist = (nr - cr) * (nr - cr) + (ng - cg) * (ng - cg) + (nb - cb) * (nb - cb);
            const weight = Math.exp(-spatialDist / sSq2 - rangeDist / rSq2);
            wr += nr * weight; wg += ng * weight; wb += nb * weight;
            wSum += weight;
          }
        }

        const inv = 1 / (wSum || 1);
        d[ci]     = Math.round(wr * inv);
        d[ci + 1] = Math.round(wg * inv);
        d[ci + 2] = Math.round(wb * inv);
        d[ci + 3] = s[ci + 3];
      }
    }
  }
}
