import { EffectNode } from '../EffectNode.js';

export class SobelNode extends EffectNode {
  constructor() {
    super('sobel', 'SOBEL EDGE', {
      threshold: { value: 0, min: 0, max: 255, step: 1, label: 'THRESHOLD' },
      normalize: { value: 1, min: 0, max: 1, step: 1, label: 'NORMALIZE' }
    });
  }

  apply(s, d, w, h) {
    const { threshold, normalize } = this.params;
    const n = w * h;
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) { const j = i * 4; lum[i] = s[j] * 0.299 + s[j+1] * 0.587 + s[j+2] * 0.114; }

    const mag = new Float32Array(n);
    let maxMag = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = -lum[i-w-1] + lum[i-w+1] - 2*lum[i-1] + 2*lum[i+1] - lum[i+w-1] + lum[i+w+1];
        const gy = -lum[i-w-1] - 2*lum[i-w] - lum[i-w+1] + lum[i+w-1] + 2*lum[i+w] + lum[i+w+1];
        mag[i] = Math.sqrt(gx * gx + gy * gy);
        if (mag[i] > maxMag) maxMag = mag[i];
      }
    }

    const scale = normalize && maxMag > 0 ? 255 / maxMag : 1;
    for (let i = 0; i < n; i++) {
      const v = Math.min(255, mag[i] * scale);
      const j = i * 4;
      d[j] = d[j+1] = d[j+2] = v > threshold ? v : 0;
      d[j+3] = s[j+3];
    }
  }
}
