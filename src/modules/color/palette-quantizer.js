import { deltaE00, rgbToLab } from './color-science.js';
import { chooseNearestOppositeStrategy, findNearestLabIndex } from './dither-strategies.js';

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

function quantizeSolid(pixels, width, height, prepared) {
  const quant = new Uint8ClampedArray(pixels.length);
  for (let i = 0; i < pixels.length; i += 4) {
    const lab = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
    const idx = findNearestLabIndex(lab, prepared);
    const rgb = prepared[idx].rgb;
    quant[i] = rgb[0];
    quant[i + 1] = rgb[1];
    quant[i + 2] = rgb[2];
    quant[i + 3] = pixels[i + 3];
  }
  return quant;
}

function quantizeBlueNoise(pixels, width, height, prepared, blueNoise) {
  const quant = new Uint8ClampedArray(pixels.length);
  const bnW = blueNoise.width;
  const bnH = blueNoise.height;
  const bn = blueNoise.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lab = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
      const strategy = chooseNearestOppositeStrategy(lab, prepared);
      let chosen = strategy.idx1;
      if (strategy.type === 'dither') {
        const bi = ((y % bnH) * bnW + (x % bnW)) * 4;
        const bnVal = bn[bi] / 255;
        chosen = bnVal < strategy.weight1 ? strategy.idx1 : strategy.idx2;
      }
      const rgb = prepared[chosen].rgb;
      quant[i] = rgb[0];
      quant[i + 1] = rgb[1];
      quant[i + 2] = rgb[2];
      quant[i + 3] = pixels[i + 3];
    }
  }

  return quant;
}

function quantizeFloydSteinberg(pixels, width, height, prepared) {
  const out = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) out[i] = pixels[i];

  const pick = (r, g, b) => {
    const lab = rgbToLab(r, g, b);
    const idx = findNearestLabIndex(lab, prepared);
    return prepared[idx].rgb;
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
      const [nr, ng, nb] = pick(oldR, oldG, oldB);
      const er = oldR - nr;
      const eg = oldG - ng;
      const eb = oldB - nb;
      out[i] = nr; out[i + 1] = ng; out[i + 2] = nb;
      addErr(x + 1, y, er, eg, eb, 7 / 16);
      addErr(x - 1, y + 1, er, eg, eb, 3 / 16);
      addErr(x, y + 1, er, eg, eb, 5 / 16);
      addErr(x + 1, y + 1, er, eg, eb, 1 / 16);
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

export function quantizeImage(pixels, width, height, palette, { dither = false } = {}) {
  const mode = dither ? 'floyd-steinberg' : 'none';
  return quantizeImageAdvanced(pixels, width, height, palette, { ditherMode: mode });
}

export function quantizeImageAdvanced(pixels, width, height, palette, {
  ditherMode = 'none',
  blueNoise = null
} = {}) {
  const prepared = precomputePalette(palette);
  if (ditherMode === 'blue-noise' && blueNoise?.data && blueNoise.width > 0 && blueNoise.height > 0) {
    return quantizeBlueNoise(pixels, width, height, prepared, blueNoise);
  }
  if (ditherMode === 'floyd-steinberg') {
    return quantizeFloydSteinberg(pixels, width, height, prepared);
  }
  return quantizeSolid(pixels, width, height, prepared);
}
