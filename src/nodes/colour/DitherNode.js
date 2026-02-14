import { EffectNode } from '../EffectNode.js';

/**
 * DitherNode — ordered dithering (Bayer) + Floyd-Steinberg error diffusion.
 * Operates in greyscale or per-channel depending on mode.
 */

// 8x8 Bayer matrix
const BAYER8 = [
   0, 48, 12, 60,  3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
   8, 56,  4, 52, 11, 59,  7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
   2, 50, 14, 62,  1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58,  6, 54,  9, 57,  5, 53,
  42, 26, 38, 22, 41, 25, 37, 21
];

function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }

export class DitherNode extends EffectNode {
  constructor() {
    super('dither', 'DITHER', {
      method:   { value: 'floyd-steinberg', options: ['floyd-steinberg', 'bayer', 'none'], label: 'METHOD', type: 'select' },
      levels:   { value: 2, min: 2, max: 16, step: 1, label: 'LEVELS' },
      strength: { value: 1, min: 0, max: 2, step: 0.05, label: 'STRENGTH' }
    });
  }

  apply(src, dst, w, h) {
    const { method, levels, strength } = this.params;

    if (method === 'none') {
      dst.set(src);
      return;
    }

    if (method === 'bayer') {
      this._bayer(src, dst, w, h, levels, strength);
    } else {
      this._floydSteinberg(src, dst, w, h, levels, strength);
    }
  }

  _bayer(src, dst, w, h, levels, strength) {
    const step = 255 / (levels - 1);
    const n = w * h * 4;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const threshold = (BAYER8[(y & 7) * 8 + (x & 7)] / 64 - 0.5) * step * strength;
        for (let c = 0; c < 3; c++) {
          dst[i + c] = clamp(Math.round((src[i + c] + threshold) / step) * step);
        }
        dst[i + 3] = src[i + 3];
      }
    }
  }

  _floydSteinberg(src, dst, w, h, levels, strength) {
    const step = 255 / (levels - 1);
    // Work in float buffer
    const buf = new Float32Array(w * h * 3);
    for (let i = 0, j = 0; i < w * h * 4; i += 4, j += 3) {
      buf[j] = src[i]; buf[j + 1] = src[i + 1]; buf[j + 2] = src[i + 2];
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const j = (y * w + x) * 3;
        for (let c = 0; c < 3; c++) {
          const old = buf[j + c];
          const nv = Math.round(old / step) * step;
          buf[j + c] = nv;
          const err = (old - nv) * strength;
          if (x + 1 < w) buf[j + 3 + c] += err * 7 / 16;
          if (y + 1 < h) {
            if (x > 0) buf[((y + 1) * w + x - 1) * 3 + c] += err * 3 / 16;
            buf[((y + 1) * w + x) * 3 + c] += err * 5 / 16;
            if (x + 1 < w) buf[((y + 1) * w + x + 1) * 3 + c] += err * 1 / 16;
          }
        }
      }
    }

    for (let i = 0, j = 0; i < w * h * 4; i += 4, j += 3) {
      dst[i] = clamp(buf[j]);
      dst[i + 1] = clamp(buf[j + 1]);
      dst[i + 2] = clamp(buf[j + 2]);
      dst[i + 3] = src[i + 3];
    }
  }
}
