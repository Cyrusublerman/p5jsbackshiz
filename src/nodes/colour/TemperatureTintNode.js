import { EffectNode } from '../EffectNode.js';

export class TemperatureTintNode extends EffectNode {
  constructor() {
    super('temptint', 'TEMP / TINT', {
      temperature: { value: 0, min: -100, max: 100, step: 1, label: 'TEMPERATURE' },
      tint:        { value: 0, min: -100, max: 100, step: 1, label: 'TINT' }
    });
    this.isLUT = true;
  }

  apply(s, d, w, h) {
    const lutR = new Uint8Array(256), lutG = new Uint8Array(256), lutB = new Uint8Array(256);
    for (let i = 0; i < 256; i++) { lutR[i] = lutG[i] = lutB[i] = i; }
    this.buildLUT(lutR, lutG, lutB);
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i] = lutR[s[i]]; d[i + 1] = lutG[s[i + 1]]; d[i + 2] = lutB[s[i + 2]]; d[i + 3] = s[i + 3];
    }
  }

  buildLUT(lutR, lutG, lutB) {
    const { temperature, tint } = this.params;
    const tScale = 0.5; // soften the effect
    for (let i = 0; i < 256; i++) {
      // Temperature: warm(+) = add red, subtract blue; cool(-) = opposite
      lutR[i] = Math.max(0, Math.min(255, Math.round(lutR[i] + temperature * tScale)));
      lutB[i] = Math.max(0, Math.min(255, Math.round(lutB[i] - temperature * tScale)));
      // Tint: green(-) ↔ magenta(+)
      lutG[i] = Math.max(0, Math.min(255, Math.round(lutG[i] - tint * tScale)));
    }
  }
}
