import { EffectNode } from '../EffectNode.js';

export class OtsuThresholdNode extends EffectNode {
  constructor() {
    super('otsuthreshold', 'OTSU THRESH', {
      mode:   { value: 'binary', options: ['binary', 'mask'], label: 'MODE', type: 'select' },
      invert: { value: 0, min: 0, max: 1, step: 1, label: 'INVERT' }
    });
  }

  apply(s, d, w, h) {
    const n = w * h;
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      hist[Math.round(s[j] * 0.299 + s[j+1] * 0.587 + s[j+2] * 0.114)]++;
    }
    // Find optimal threshold (max between-class variance)
    let bestT = 0, bestVar = 0;
    let w0 = 0, sum0 = 0, sumTotal = 0;
    for (let i = 0; i < 256; i++) sumTotal += i * hist[i];
    for (let t = 0; t < 256; t++) {
      w0 += hist[t]; if (w0 === 0) continue;
      const w1 = n - w0; if (w1 === 0) break;
      sum0 += t * hist[t];
      const m0 = sum0 / w0, m1 = (sumTotal - sum0) / w1;
      const v = w0 * w1 * (m0 - m1) * (m0 - m1);
      if (v > bestVar) { bestVar = v; bestT = t; }
    }
    const inv = this.params.invert;
    const isMask = this.params.mode === 'mask';
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const lum = s[j] * 0.299 + s[j+1] * 0.587 + s[j+2] * 0.114;
      let bit = lum > bestT ? 1 : 0;
      if (inv) bit = 1 - bit;
      if (isMask) {
        d[j] = s[j] * bit; d[j+1] = s[j+1] * bit; d[j+2] = s[j+2] * bit;
      } else {
        const v = bit * 255;
        d[j] = d[j+1] = d[j+2] = v;
      }
      d[j+3] = s[j+3];
    }
  }
}
