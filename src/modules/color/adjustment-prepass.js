function clamp255(v) {
  return Math.max(0, Math.min(255, v));
}

export function applySaturation(r, g, b, saturation = 1) {
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return [
    clamp255(lum + (r - lum) * saturation),
    clamp255(lum + (g - lum) * saturation),
    clamp255(lum + (b - lum) * saturation)
  ];
}

export function applyContrast(r, g, b, contrast = 1, pivot = 0.5) {
  const map = (v) => (((v / 255 - pivot) * contrast) + pivot) * 255;
  return [clamp255(map(r)), clamp255(map(g)), clamp255(map(b))];
}

export function applyGamma(r, g, b, gamma = 1) {
  if (gamma <= 0 || gamma === 1) return [r, g, b];
  const inv = 1 / gamma;
  const map = (v) => Math.pow(clamp255(v) / 255, inv) * 255;
  return [clamp255(map(r)), clamp255(map(g)), clamp255(map(b))];
}

export function applyImageAdjustments(pixels, {
  gamma = 1,
  contrast = 1,
  saturation = 1,
  order = ['saturation', 'contrast', 'gamma']
} = {}) {
  const out = new Uint8ClampedArray(pixels);
  for (let i = 0; i < out.length; i += 4) {
    let r = out[i];
    let g = out[i + 1];
    let b = out[i + 2];

    for (const step of order) {
      if (step === 'saturation') [r, g, b] = applySaturation(r, g, b, saturation);
      else if (step === 'contrast') [r, g, b] = applyContrast(r, g, b, contrast);
      else if (step === 'gamma') [r, g, b] = applyGamma(r, g, b, gamma);
    }

    out[i] = Math.round(r);
    out[i + 1] = Math.round(g);
    out[i + 2] = Math.round(b);
  }
  return out;
}
