import { deltaE00, rgbToLab } from './color-science.js';

function precomputePalette(palette) {
  return palette.map((rgb) => ({ rgb, lab: rgbToLab(rgb[0], rgb[1], rgb[2]) }));
}

export function quantizePixel(rgb, palette) {
  const lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
  const prepared = precomputePalette(palette);
  let best = prepared[0].rgb;
  let bestD = Infinity;
  for (const c of prepared) {
    const d = deltaE00(lab, c.lab);
    if (d < bestD) {
      bestD = d;
      best = c.rgb;
    }
  }
  return best;
}

export function quantizeImage(pixels, width, height, palette, { dither = false } = {}) {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) out[i] = pixels[i];
  const prepared = precomputePalette(palette);

  const bestColor = (r, g, b) => {
    const lab = rgbToLab(r, g, b);
    let best = prepared[0].rgb;
    let bestD = Infinity;
    for (const p of prepared) {
      const d = deltaE00(lab, p.lab);
      if (d < bestD) {
        bestD = d;
        best = p.rgb;
      }
    }
    return best;
  };

  const addErr = (x, y, er, eg, eb, factor) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    out[i] += er * factor;
    out[i + 1] += eg * factor;
    out[i + 2] += eb * factor;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const oldR = Math.max(0, Math.min(255, out[i]));
      const oldG = Math.max(0, Math.min(255, out[i + 1]));
      const oldB = Math.max(0, Math.min(255, out[i + 2]));
      const [nr, ng, nb] = bestColor(oldR, oldG, oldB);
      const er = oldR - nr;
      const eg = oldG - ng;
      const eb = oldB - nb;
      out[i] = nr; out[i + 1] = ng; out[i + 2] = nb;

      if (dither) {
        addErr(x + 1, y, er, eg, eb, 7 / 16);
        addErr(x - 1, y + 1, er, eg, eb, 3 / 16);
        addErr(x, y + 1, er, eg, eb, 5 / 16);
        addErr(x + 1, y + 1, er, eg, eb, 1 / 16);
      }
    }
  }

  const quant = new Uint8ClampedArray(out.length);
  for (let i = 0; i < out.length; i += 4) {
    quant[i] = out[i];
    quant[i + 1] = out[i + 1];
    quant[i + 2] = out[i + 2];
    quant[i + 3] = pixels[i + 3];
  }
  return quant;
}
