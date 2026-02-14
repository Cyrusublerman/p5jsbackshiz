import { EffectNode } from '../EffectNode.js';

/**
 * QuantiseNode — palette-based colour quantisation.
 * Nearest-colour in RGB space. Predefined + custom palettes.
 */

const PALETTES = {
  '1-bit':    ['#000000', '#FFFFFF'],
  '2-bit':    ['#000000', '#555555', '#AAAAAA', '#FFFFFF'],
  '3-bit':    ['#000000', '#FF0000', '#00FF00', '#FFFF00', '#0000FF', '#FF00FF', '#00FFFF', '#FFFFFF'],
  'gameboy':  ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'],
  'nes': [
    '#7C7C7C', '#0000FC', '#0000BC', '#4428BC', '#940084', '#A80020',
    '#A81000', '#881400', '#503000', '#007800', '#006800', '#005800',
    '#004058', '#000000', '#F8F8F8', '#FFFFFF'
  ],
  'pastel': ['#FFC0CB', '#E6E6FA', '#ADD8E6', '#98FF98', '#FFFFE0', '#FFDAB9']
};

function hexToRgb(hex) {
  const c = hex.startsWith('#') ? hex.slice(1) : hex;
  return [
    parseInt(c.slice(0, 2), 16),
    parseInt(c.slice(2, 4), 16),
    parseInt(c.slice(4, 6), 16)
  ];
}

export class QuantiseNode extends EffectNode {
  constructor() {
    super('quantise', 'QUANTISE', {
      palette: { value: '1-bit', options: Object.keys(PALETTES), label: 'PALETTE', type: 'select' }
    });
  }

  apply(src, dst, w, h) {
    const palName = this.params.palette;
    const hexPal = PALETTES[palName] || PALETTES['1-bit'];
    const rgbPal = hexPal.map(hexToRgb);
    const n = w * h * 4;

    for (let i = 0; i < n; i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2];
      let bestDist = Infinity, bestIdx = 0;
      for (let j = 0; j < rgbPal.length; j++) {
        const pr = rgbPal[j][0], pg = rgbPal[j][1], pb = rgbPal[j][2];
        const d = (r - pr) * (r - pr) + (g - pg) * (g - pg) + (b - pb) * (b - pb);
        if (d < bestDist) { bestDist = d; bestIdx = j; }
      }
      dst[i] = rgbPal[bestIdx][0];
      dst[i + 1] = rgbPal[bestIdx][1];
      dst[i + 2] = rgbPal[bestIdx][2];
      dst[i + 3] = src[i + 3];
    }
  }
}
