import { EffectNode } from '../EffectNode.js';

export class GradientMapNode extends EffectNode {
  constructor() {
    super('gradientmap', 'GRADIENT MAP', {
      darkR:  { value: 0, min: 0, max: 255, step: 1, label: 'DARK R' },
      darkG:  { value: 0, min: 0, max: 255, step: 1, label: 'DARK G' },
      darkB:  { value: 30, min: 0, max: 255, step: 1, label: 'DARK B' },
      lightR: { value: 255, min: 0, max: 255, step: 1, label: 'LIGHT R' },
      lightG: { value: 200, min: 0, max: 255, step: 1, label: 'LIGHT G' },
      lightB: { value: 150, min: 0, max: 255, step: 1, label: 'LIGHT B' }
    });
    this.isLUT = true;
  }

  apply(s, d, w, h) {
    const lutR = new Uint8Array(256), lutG = new Uint8Array(256), lutB = new Uint8Array(256);
    for (let i = 0; i < 256; i++) { lutR[i] = lutG[i] = lutB[i] = i; }
    this.buildLUT(lutR, lutG, lutB);
    // Need luminance first
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const lum = Math.round(s[i] * 0.299 + s[i + 1] * 0.587 + s[i + 2] * 0.114);
      d[i] = lutR[lum]; d[i + 1] = lutG[lum]; d[i + 2] = lutB[lum]; d[i + 3] = s[i + 3];
    }
  }

  buildLUT(lutR, lutG, lutB) {
    const p = this.params;
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      // Compute greyscale from current LUT state
      const grey = Math.round(lutR[i] * 0.299 + lutG[i] * 0.587 + lutB[i] * 0.114);
      const tt = grey / 255;
      lutR[i] = Math.round(p.darkR + (p.lightR - p.darkR) * tt);
      lutG[i] = Math.round(p.darkG + (p.lightG - p.darkG) * tt);
      lutB[i] = Math.round(p.darkB + (p.lightB - p.darkB) * tt);
    }
  }
}
