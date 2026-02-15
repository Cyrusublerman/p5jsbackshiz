import { EffectNode } from '../EffectNode.js';

/**
 * TileBlendNode — multi-image blend modes.
 * Blend modes: crossfade, multiply, difference.
 * Operates on the pipeline buffer (self-blend or tiled).
 */

export class TileBlendNode extends EffectNode {
  constructor() {
    super('tileblend', 'TILE BLEND', {
      blendMode:  { value: 'multiply', options: ['crossfade', 'multiply', 'difference'], label: 'BLEND', type: 'select' },
      mix:        { value: 0.5, min: 0, max: 1, step: 0.01, label: 'MIX' },
      offsetX:    { value: 0.5, min: 0, max: 1, step: 0.01, label: 'OFFSET X' },
      offsetY:    { value: 0.5, min: 0, max: 1, step: 0.01, label: 'OFFSET Y' },
      mirrorX:    { value: 0, min: 0, max: 1, step: 1, label: 'MIRROR X' },
      mirrorY:    { value: 0, min: 0, max: 1, step: 1, label: 'MIRROR Y' },
      exposure:   { value: 0, min: -2, max: 2, step: 0.1, label: 'EXPOSURE' },
      gamma:      { value: 1, min: 0.2, max: 3, step: 0.05, label: 'GAMMA' }
    });
  }

  apply(src, dst, w, h) {
    const { blendMode, mix, offsetX, offsetY, mirrorX, mirrorY, exposure, gamma } = this.params;
    const ox = Math.round(offsetX * w);
    const oy = Math.round(offsetY * h);
    const expMul = Math.pow(2, exposure);
    const invGamma = 1 / Math.max(0.01, gamma);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;

        // Second sample: offset + optional mirror
        let sx = (x + ox) % w;
        let sy = (y + oy) % h;
        if (mirrorX && sx > w / 2) sx = w - sx;
        if (mirrorY && sy > h / 2) sy = h - sy;
        sx = Math.max(0, Math.min(w - 1, Math.round(sx)));
        sy = Math.max(0, Math.min(h - 1, Math.round(sy)));
        const j = (sy * w + sx) * 4;

        for (let c = 0; c < 3; c++) {
          const a = src[i + c] / 255;
          const b = src[j + c] / 255;
          let out;

          if (blendMode === 'crossfade') {
            out = a * (1 - mix) + b * mix;
          } else if (blendMode === 'multiply') {
            out = a * b;
          } else { // difference
            out = Math.abs(a - b);
          }

          // Tone map: exposure + gamma
          out = Math.max(0, out * expMul);
          out = Math.pow(out, invGamma);
          dst[i + c] = Math.round(Math.max(0, Math.min(1, out)) * 255);
        }
        dst[i + 3] = src[i + 3];
      }
    }
  }
}
