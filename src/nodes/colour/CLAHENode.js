import { EffectNode } from '../EffectNode.js';

export class CLAHENode extends EffectNode {
  constructor() {
    super('clahe', 'CLAHE', {
      tileSize:  { value: 32, min: 8, max: 64, step: 8, label: 'TILE SIZE' },
      clipLimit: { value: 3, min: 1, max: 10, step: 0.5, label: 'CLIP LIMIT' }
    });
  }

  apply(s, d, w, h) {
    const { tileSize, clipLimit } = this.params;
    const tw = Math.ceil(w / tileSize), th = Math.ceil(h / tileSize);
    const tilePixels = tileSize * tileSize;
    const clipCount = Math.round(clipLimit * tilePixels / 256);

    // Build per-tile CLAHEd LUTs
    const luts = new Array(tw * th);
    for (let ty = 0; ty < th; ty++) {
      for (let tx = 0; tx < tw; tx++) {
        const hist = new Uint32Array(256);
        const x0 = tx * tileSize, y0 = ty * tileSize;
        const x1 = Math.min(x0 + tileSize, w), y1 = Math.min(y0 + tileSize, h);
        let count = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * w + x) * 4;
            const lum = Math.round(s[i] * 0.299 + s[i + 1] * 0.587 + s[i + 2] * 0.114);
            hist[lum]++; count++;
          }
        }
        // Clip histogram
        let excess = 0;
        for (let i = 0; i < 256; i++) {
          if (hist[i] > clipCount) { excess += hist[i] - clipCount; hist[i] = clipCount; }
        }
        const inc = Math.floor(excess / 256);
        for (let i = 0; i < 256; i++) hist[i] += inc;

        // CDF → LUT
        const lut = new Uint8Array(256);
        let cdf = 0;
        const cdfDenom = count || 1;
        for (let i = 0; i < 256; i++) {
          cdf += hist[i];
          lut[i] = Math.round((cdf / cdfDenom) * 255);
        }
        luts[ty * tw + tx] = lut;
      }
    }

    // Apply with bilinear interpolation between tiles
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        // Tile coords (centre-based)
        const ftx = (x - tileSize / 2) / tileSize;
        const fty = (y - tileSize / 2) / tileSize;
        const tx0 = Math.max(0, Math.min(tw - 1, Math.floor(ftx)));
        const ty0 = Math.max(0, Math.min(th - 1, Math.floor(fty)));
        const tx1 = Math.min(tw - 1, tx0 + 1);
        const ty1 = Math.min(th - 1, ty0 + 1);
        const fx = ftx - tx0, fy = fty - ty0;
        const ifx = 1 - Math.max(0, Math.min(1, fx));
        const ify = 1 - Math.max(0, Math.min(1, fy));
        const ffx = Math.max(0, Math.min(1, fx));
        const ffy = Math.max(0, Math.min(1, fy));

        for (let c = 0; c < 3; c++) {
          const v = s[i + c];
          const v00 = luts[ty0 * tw + tx0][v];
          const v10 = luts[ty0 * tw + tx1][v];
          const v01 = luts[ty1 * tw + tx0][v];
          const v11 = luts[ty1 * tw + tx1][v];
          d[i + c] = Math.round((v00 * ifx + v10 * ffx) * ify + (v01 * ifx + v11 * ffx) * ffy);
        }
        d[i + 3] = s[i + 3];
      }
    }
  }
}
