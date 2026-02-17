import { sampleField } from './vector-field.js';

export function buildDisplacement(field, amount = 1, sampling = 'nearest') {
  const { width, height } = field;
  const offsets = new Float32Array(width * height * 2);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [vx, vy] = sampleField(field, x, y, sampling);
      const i = (y * width + x) * 2;
      offsets[i] = vx * amount;
      offsets[i + 1] = vy * amount;
    }
  }
  return { width, height, offsets };
}

export function stabilizeDisplacement(prev, next, alpha = 0.5) {
  if (prev.offsets.length !== next.offsets.length) throw new Error('Displacement shape mismatch');
  const offsets = new Float32Array(next.offsets.length);
  for (let i = 0; i < offsets.length; i++) offsets[i] = prev.offsets[i] * (1 - alpha) + next.offsets[i] * alpha;
  return { width: next.width, height: next.height, offsets };
}

export function applyDisplacementToImage(asset, displacement) {
  const { width, height, pixels } = asset;
  const out = new Uint8ClampedArray(pixels.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 2;
      const sx = Math.max(0, Math.min(width - 1, Math.round(x + displacement.offsets[di])));
      const sy = Math.max(0, Math.min(height - 1, Math.round(y + displacement.offsets[di + 1])));
      const si = (sy * width + sx) * 4;
      const oi = (y * width + x) * 4;
      out[oi] = pixels[si];
      out[oi + 1] = pixels[si + 1];
      out[oi + 2] = pixels[si + 2];
      out[oi + 3] = pixels[si + 3];
    }
  }

  return { ...asset, pixels: out };
}
