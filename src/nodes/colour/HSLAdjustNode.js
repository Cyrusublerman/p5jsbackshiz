import { EffectNode } from '../EffectNode.js';

export class HSLAdjustNode extends EffectNode {
  constructor() {
    super('hsladjust', 'HSL ADJUST', {
      hue:        { value: 0, min: -180, max: 180, step: 1, label: 'HUE' },
      saturation: { value: 1, min: 0, max: 3, step: 0.01, label: 'SATURATION' },
      lightness:  { value: 0, min: -1, max: 1, step: 0.01, label: 'LIGHTNESS' }
    });
  }

  apply(s, d, w, h) {
    const { hue, saturation, lightness } = this.params;
    const hShift = hue / 360;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      let r = s[i] / 255, g = s[i + 1] / 255, b = s[i + 2] / 255;
      // RGB → HSL
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let hv, sv, l = (max + min) / 2;
      if (max === min) { hv = sv = 0; }
      else {
        const d = max - min;
        sv = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hv = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) hv = ((b - r) / d + 2) / 6;
        else hv = ((r - g) / d + 4) / 6;
      }
      // Adjust
      hv = (hv + hShift + 1) % 1;
      sv = Math.max(0, Math.min(1, sv * saturation));
      l = Math.max(0, Math.min(1, l + lightness));
      // HSL → RGB
      if (sv === 0) { r = g = b = l; }
      else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + sv) : l + sv - l * sv;
        const p = 2 * l - q;
        r = hue2rgb(p, q, hv + 1/3);
        g = hue2rgb(p, q, hv);
        b = hue2rgb(p, q, hv - 1/3);
      }
      d[i] = Math.round(r * 255); d[i + 1] = Math.round(g * 255);
      d[i + 2] = Math.round(b * 255); d[i + 3] = s[i + 3];
    }
  }
}
