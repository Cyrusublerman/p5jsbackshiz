import { EffectNode } from '../EffectNode.js';

export class PixelateNode extends EffectNode {
  constructor() {
    super('pixelate', 'PIXELATE', {
      blockSize: { value: 8, min: 2, max: 100, step: 1, label: 'BLOCK SIZE' }
    });
  }

  apply(s, d, w, h) {
    const bs = this.params.blockSize;
    for (let by = 0; by < h; by += bs) {
      for (let bx = 0; bx < w; bx += bs) {
        let ar = 0, ag = 0, ab = 0, count = 0;
        const yEnd = Math.min(by + bs, h), xEnd = Math.min(bx + bs, w);
        for (let y = by; y < yEnd; y++) {
          for (let x = bx; x < xEnd; x++) {
            const i = (y * w + x) * 4;
            ar += s[i]; ag += s[i + 1]; ab += s[i + 2]; count++;
          }
        }
        ar = Math.round(ar / count); ag = Math.round(ag / count); ab = Math.round(ab / count);
        for (let y = by; y < yEnd; y++) {
          for (let x = bx; x < xEnd; x++) {
            const i = (y * w + x) * 4;
            d[i] = ar; d[i + 1] = ag; d[i + 2] = ab; d[i + 3] = s[i + 3];
          }
        }
      }
    }
  }
}
