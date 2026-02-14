import { EffectNode } from '../EffectNode.js';

export class InterferenceNode extends EffectNode {
  constructor() {
    super('interference', 'INTERFERENCE', {
      filmThickness: { value: 300, min: 100, max: 800, step: 10, label: 'THICKNESS' },
      viewAngle:     { value: 0, min: 0, max: 60, step: 1, label: 'VIEW ANGLE' },
      iridescence:   { value: 1, min: 0, max: 2, step: 0.05, label: 'IRIDESCENCE' },
      blendAmt:      { value: 0.5, min: 0, max: 1, step: 0.01, label: 'BLEND' }
    });
  }

  apply(s, d, w, h) {
    const { filmThickness, viewAngle, iridescence, blendAmt } = this.params;
    const cosAngle = Math.cos(viewAngle * Math.PI / 180);
    const n = w * h;
    const inv = 1 - blendAmt;

    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const lum = (s[j]*0.299 + s[j+1]*0.587 + s[j+2]*0.114) / 255;
      // Map luminance to film thickness variation
      const thickness = filmThickness + lum * 200 * iridescence;
      const opd = 2 * 1.33 * thickness * cosAngle; // n=1.33 (soap film)

      // Compute interference for R, G, B wavelengths
      const rI = 0.5 + 0.5 * Math.cos(2 * Math.PI * opd / 650); // 650nm red
      const gI = 0.5 + 0.5 * Math.cos(2 * Math.PI * opd / 550); // 550nm green
      const bI = 0.5 + 0.5 * Math.cos(2 * Math.PI * opd / 450); // 450nm blue

      d[j]   = Math.round(s[j]   * inv + rI * 255 * blendAmt);
      d[j+1] = Math.round(s[j+1] * inv + gI * 255 * blendAmt);
      d[j+2] = Math.round(s[j+2] * inv + bI * 255 * blendAmt);
      d[j+3] = s[j+3];
    }
  }
}
