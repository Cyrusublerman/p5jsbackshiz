import { EffectNode } from '../EffectNode.js';

export class MedianFilterNode extends EffectNode {
  constructor() {
    super('median', 'MEDIAN FILTER', {
      radius: { value: 1, min: 1, max: 5, step: 1, label: 'RADIUS' }
    });
  }

  apply(s, d, w, h) {
    const r = this.params.radius;
    const size = (2 * r + 1) * (2 * r + 1);
    const mid = size >> 1;
    const buf = new Uint8Array(size);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const oi = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          let k = 0;
          for (let dy = -r; dy <= r; dy++) {
            const sy = Math.max(0, Math.min(h - 1, y + dy));
            for (let dx = -r; dx <= r; dx++) {
              const sx = Math.max(0, Math.min(w - 1, x + dx));
              buf[k++] = s[(sy * w + sx) * 4 + c];
            }
          }
          // Partial sort to find median
          buf.subarray(0, k).sort();
          d[oi + c] = buf[mid];
        }
        d[oi + 3] = s[oi + 3];
      }
    }
  }
}
