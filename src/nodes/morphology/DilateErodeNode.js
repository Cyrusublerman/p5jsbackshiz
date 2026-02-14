import { EffectNode } from '../EffectNode.js';

export class DilateErodeNode extends EffectNode {
  constructor() {
    super('dilateerode', 'DILATE/ERODE', {
      mode:   { value: 'dilate', options: ['dilate', 'erode'], label: 'MODE', type: 'select' },
      radius: { value: 1, min: 1, max: 10, step: 1, label: 'RADIUS' },
      shape:  { value: 'square', options: ['square', 'circle'], label: 'SHAPE', type: 'select' }
    });
  }

  apply(s, d, w, h) {
    const { mode, radius: r, shape } = this.params;
    const isDilate = mode === 'dilate';
    const isCircle = shape === 'circle';
    const r2 = r * r;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const oi = (y * w + x) * 4;
        let bestR = isDilate ? 0 : 255;
        let bestG = isDilate ? 0 : 255;
        let bestB = isDilate ? 0 : 255;

        for (let dy = -r; dy <= r; dy++) {
          const ny = Math.max(0, Math.min(h - 1, y + dy));
          for (let dx = -r; dx <= r; dx++) {
            if (isCircle && dx * dx + dy * dy > r2) continue;
            const nx = Math.max(0, Math.min(w - 1, x + dx));
            const ni = (ny * w + nx) * 4;
            if (isDilate) {
              if (s[ni] > bestR) bestR = s[ni];
              if (s[ni + 1] > bestG) bestG = s[ni + 1];
              if (s[ni + 2] > bestB) bestB = s[ni + 2];
            } else {
              if (s[ni] < bestR) bestR = s[ni];
              if (s[ni + 1] < bestG) bestG = s[ni + 1];
              if (s[ni + 2] < bestB) bestB = s[ni + 2];
            }
          }
        }
        d[oi] = bestR; d[oi + 1] = bestG; d[oi + 2] = bestB; d[oi + 3] = s[oi + 3];
      }
    }
  }
}
