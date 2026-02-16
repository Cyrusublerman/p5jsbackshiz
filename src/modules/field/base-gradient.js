import { toLumaMap } from '../core/image-io.js';

export function buildBaseGradient(pixels, width, height, normalize = true) {
  const lum = toLumaMap(pixels);
  const vectors = new Float32Array(width * height * 2);

  const lumaAt = (x, y) => lum[Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gx =
        -lumaAt(x - 1, y - 1) + lumaAt(x + 1, y - 1) +
        -2 * lumaAt(x - 1, y) + 2 * lumaAt(x + 1, y) +
        -lumaAt(x - 1, y + 1) + lumaAt(x + 1, y + 1);
      const gy =
        -lumaAt(x - 1, y - 1) - 2 * lumaAt(x, y - 1) - lumaAt(x + 1, y - 1) +
         lumaAt(x - 1, y + 1) + 2 * lumaAt(x, y + 1) + lumaAt(x + 1, y + 1);

      const i = (y * width + x) * 2;
      if (normalize) {
        const d = Math.hypot(gx, gy) || 1;
        vectors[i] = gx / d;
        vectors[i + 1] = gy / d;
      } else {
        vectors[i] = gx;
        vectors[i + 1] = gy;
      }
    }
  }

  return { width, height, vectors };
}
