import { EffectNode } from '../EffectNode.js';

export class ColourBalanceNode extends EffectNode {
  constructor() {
    super('colourbalance', 'COLOUR BALANCE', {
      shadowR:  { value: 0, min: -100, max: 100, step: 1, label: 'SHADOW R' },
      shadowG:  { value: 0, min: -100, max: 100, step: 1, label: 'SHADOW G' },
      shadowB:  { value: 0, min: -100, max: 100, step: 1, label: 'SHADOW B' },
      midR:     { value: 0, min: -100, max: 100, step: 1, label: 'MID R' },
      midG:     { value: 0, min: -100, max: 100, step: 1, label: 'MID G' },
      midB:     { value: 0, min: -100, max: 100, step: 1, label: 'MID B' },
      highR:    { value: 0, min: -100, max: 100, step: 1, label: 'HIGH R' },
      highG:    { value: 0, min: -100, max: 100, step: 1, label: 'HIGH G' },
      highB:    { value: 0, min: -100, max: 100, step: 1, label: 'HIGH B' }
    });
  }

  apply(s, d, w, h) {
    const p = this.params;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const r = s[i], g = s[i + 1], b = s[i + 2];
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      // Shadow weight peaks at lum=0, midtone at lum=0.5, highlight at lum=1
      const sw = Math.max(0, 1 - lum * 2);        // 1→0 over [0, 0.5]
      const mw = 1 - Math.abs(lum - 0.5) * 2;     // peak at 0.5
      const hw = Math.max(0, (lum - 0.5) * 2);     // 0→1 over [0.5, 1]
      const sc = 0.5; // scale factor
      d[i]     = Math.max(0, Math.min(255, r + (p.shadowR * sw + p.midR * mw + p.highR * hw) * sc));
      d[i + 1] = Math.max(0, Math.min(255, g + (p.shadowG * sw + p.midG * mw + p.highG * hw) * sc));
      d[i + 2] = Math.max(0, Math.min(255, b + (p.shadowB * sw + p.midB * mw + p.highB * hw) * sc));
      d[i + 3] = s[i + 3];
    }
  }
}
