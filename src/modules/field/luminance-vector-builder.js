import { createVectorField } from './vector-field.js';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export function buildLuminanceField(pixels, width, height) {
  const lum = new Float32Array(width * height);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    lum[p] = (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
  }
  return lum;
}

export function buildGradientField(luminance, width, height, { deadZone = 0 } = {}) {
  const gx = new Float32Array(width * height);
  const gy = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      gx[i] =
        -luminance[(y - 1) * width + x - 1] + luminance[(y - 1) * width + x + 1]
        - 2 * luminance[y * width + x - 1] + 2 * luminance[y * width + x + 1]
        - luminance[(y + 1) * width + x - 1] + luminance[(y + 1) * width + x + 1];
      gy[i] =
        -luminance[(y - 1) * width + x - 1] - 2 * luminance[(y - 1) * width + x] - luminance[(y - 1) * width + x + 1]
        + luminance[(y + 1) * width + x - 1] + 2 * luminance[(y + 1) * width + x] + luminance[(y + 1) * width + x + 1];
    }
  }

  const mag = new Float32Array(width * height);
  const angle = new Float32Array(width * height);
  let maxMag = 0;

  for (let i = 0; i < mag.length; i++) {
    const m = Math.hypot(gx[i], gy[i]);
    maxMag = Math.max(maxMag, m);
  }

  const norm = maxMag || 1;
  for (let i = 0; i < mag.length; i++) {
    const m = Math.hypot(gx[i], gy[i]);
    const mNorm = clamp((m - deadZone) / Math.max(1e-8, norm - deadZone), 0, 1);
    mag[i] = mNorm;
    angle[i] = Math.atan2(gy[i], gx[i]);
  }

  return { width, height, gx, gy, mag, angle, maxMag };
}

export function buildVectorFieldFromGradient(gradient, { tangent = false, scale = 1 } = {}) {
  const vectors = new Float32Array(gradient.width * gradient.height * 2);
  for (let i = 0; i < gradient.width * gradient.height; i++) {
    const gxi = gradient.gx[i];
    const gyi = gradient.gy[i];
    const d = Math.hypot(gxi, gyi) || 1;
    let vx = gxi / d;
    let vy = gyi / d;
    if (tangent) {
      const tx = -vy;
      const ty = vx;
      vx = tx; vy = ty;
    }
    vectors[i * 2] = vx * gradient.mag[i] * scale;
    vectors[i * 2 + 1] = vy * gradient.mag[i] * scale;
  }
  return createVectorField(gradient.width, gradient.height, vectors);
}
