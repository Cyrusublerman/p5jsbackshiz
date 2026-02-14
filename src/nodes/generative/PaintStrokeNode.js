import { EffectNode } from '../EffectNode.js';
import { SeededRNG } from '../../core/SeededRNG.js';

/**
 * PaintStrokeNode — iterative brush painting with palette matching.
 * Adapted from paint-image generative painter.
 */

export class PaintStrokeNode extends EffectNode {
  constructor() {
    super('paintstroke', 'PAINT STROKE', {
      brushMin:     { value: 10, min: 1, max: 100, step: 1, label: 'BRUSH MIN' },
      brushMax:     { value: 50, min: 2, max: 200, step: 1, label: 'BRUSH MAX' },
      minOpacity:   { value: 10, min: 1, max: 255, step: 1, label: 'MIN OPAC' },
      maxOpacity:   { value: 50, min: 1, max: 255, step: 1, label: 'MAX OPAC' },
      iterations:   { value: 5000, min: 100, max: 50000, step: 100, label: 'STROKES' },
      maxLayers:    { value: 15, min: 1, max: 50, step: 1, label: 'MAX LAYERS' },
      paletteMode:  { value: 'source', options: ['source', 'greyscale', 'warm', 'cool'], label: 'PALETTE', type: 'select' }
    });
  }

  apply(src, dst, w, h, ctx) {
    const p = this.params;
    const rng = new SeededRNG(ctx.nodeSeed);
    const iters = ctx.quality === 'preview' ? Math.min(p.iterations, 1000) : p.iterations;

    // Layer tracker: simple grid
    const layers = new Float32Array(w * h);
    const totalPixels = w * h;
    let totalStrokes = 0;

    // Working canvas buffer (start black)
    const buf = new Uint8ClampedArray(w * h * 4);
    for (let i = 3; i < buf.length; i += 4) buf[i] = 255;

    // Palette generation
    const palette = this._buildPalette(src, w, h, p.paletteMode, rng);

    for (let iter = 0; iter < iters; iter++) {
      // Check average layers
      const avgBrushR = (p.brushMin + p.brushMax) / 4;
      const avgArea = Math.PI * avgBrushR * avgBrushR;
      const avgLayers = (totalStrokes * avgArea) / totalPixels;
      if (avgLayers >= p.maxLayers) break;

      const x = rng.nextInt(0, w);
      const y = rng.nextInt(0, h);
      const idx = y * w + x;
      if (layers[idx] > p.maxLayers * 1.3) continue;

      // Target colour from source
      const si = (y * w + x) * 4;
      const tr = src[si], tg = src[si + 1], tb = src[si + 2];

      // Current colour from buffer
      const cr = buf[si], cg = buf[si + 1], cb = buf[si + 2];

      // Find best palette colour
      const alphaNorm = ((p.minOpacity + p.maxOpacity) / 2) / 255;
      let bestColor = null, bestDist = Infinity;

      for (const pc of palette) {
        const sr = cr + (pc[0] - cr) * alphaNorm;
        const sg = cg + (pc[1] - cg) * alphaNorm;
        const sb = cb + (pc[2] - cb) * alphaNorm;
        const d = (sr - tr) ** 2 + (sg - tg) ** 2 + (sb - tb) ** 2;
        if (d < bestDist) { bestDist = d; bestColor = pc; }
      }

      if (!bestColor) continue;

      // Draw radial gradient brush
      const opacity = rng.nextRange(p.minOpacity, p.maxOpacity) / 255;
      const size = rng.nextRange(p.brushMin, p.brushMax);
      const radius = size / 2;
      const r2 = radius * radius;
      const x0 = Math.max(0, Math.floor(x - radius));
      const x1 = Math.min(w - 1, Math.ceil(x + radius));
      const y0 = Math.max(0, Math.floor(y - radius));
      const y1 = Math.min(h - 1, Math.ceil(y + radius));

      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const dx = px - x, dy = py - y;
          const d2 = dx * dx + dy * dy;
          if (d2 > r2) continue;
          const falloff = 1 - Math.sqrt(d2) / radius;
          const a = opacity * falloff;
          const bi = (py * w + px) * 4;
          buf[bi]     = buf[bi]     + (bestColor[0] - buf[bi]) * a;
          buf[bi + 1] = buf[bi + 1] + (bestColor[1] - buf[bi + 1]) * a;
          buf[bi + 2] = buf[bi + 2] + (bestColor[2] - buf[bi + 2]) * a;
        }
      }

      // Track layers
      const lr = Math.floor(size / 4);
      const lx0 = Math.max(0, x - lr), lx1 = Math.min(w, x + lr);
      const ly0 = Math.max(0, y - lr), ly1 = Math.min(h, y + lr);
      for (let py = ly0; py < ly1; py++) {
        for (let px = lx0; px < lx1; px++) {
          layers[py * w + px] += 1;
        }
      }
      totalStrokes++;
    }

    dst.set(buf);
  }

  _buildPalette(src, w, h, mode, rng) {
    if (mode === 'greyscale') {
      return [[0, 0, 0], [64, 64, 64], [128, 128, 128], [192, 192, 192], [255, 255, 255]];
    }
    if (mode === 'warm') {
      return [[30, 10, 5], [120, 40, 20], [200, 100, 50], [240, 180, 100], [255, 230, 200]];
    }
    if (mode === 'cool') {
      return [[5, 10, 30], [20, 40, 120], [50, 100, 200], [100, 180, 240], [200, 230, 255]];
    }
    // Source: sample random pixels to build palette
    const palette = [];
    const samples = Math.min(16, Math.max(8, Math.floor(w * h / 1000)));
    for (let i = 0; i < samples; i++) {
      const x = rng.nextInt(0, w);
      const y = rng.nextInt(0, h);
      const si = (y * w + x) * 4;
      palette.push([src[si], src[si + 1], src[si + 2]]);
    }
    return palette;
  }
}
