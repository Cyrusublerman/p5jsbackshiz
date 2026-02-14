import { EffectNode } from '../EffectNode.js';

export class HistogramEQNode extends EffectNode {
  constructor() {
    super('histogrameq', 'HISTOGRAM EQ', {
      strength: { value: 1, min: 0, max: 1, step: 0.01, label: 'STRENGTH' }
    });
  }

  apply(s, d, w, h) {
    const str = this.params.strength;
    const n = w * h;
    // Build luminance histogram
    const hist = new Uint32Array(256);
    for (let i = 0; i < n * 4; i += 4) {
      const lum = Math.round(s[i] * 0.299 + s[i + 1] * 0.587 + s[i + 2] * 0.114);
      hist[lum]++;
    }
    // CDF
    const cdf = new Float32Array(256);
    cdf[0] = hist[0];
    for (let i = 1; i < 256; i++) cdf[i] = cdf[i - 1] + hist[i];
    const cdfMin = cdf.find(v => v > 0) || 0;
    const denom = n - cdfMin || 1;
    // Build LUT
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      lut[i] = Math.round((cdf[i] - cdfMin) / denom * 255);
    }
    // Apply with strength blend
    for (let i = 0; i < n * 4; i += 4) {
      for (let c = 0; c < 3; c++) {
        const eq = lut[s[i + c]];
        d[i + c] = Math.round(s[i + c] * (1 - str) + eq * str);
      }
      d[i + 3] = s[i + 3];
    }
  }
}
