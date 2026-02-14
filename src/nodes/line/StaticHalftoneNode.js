import { EffectNode } from '../EffectNode.js';

/**
 * StaticHalftoneNode — static parallel-line halftone → pixel buffer.
 * From serpentine's ParallelStaticEngine.
 */

function applyCurve(t, type, str) {
  if (type === 'exponential') return Math.pow(t, str);
  if (type === 'logarithmic') return Math.log(1 + t * (Math.pow(Math.E, str) - 1)) / str;
  if (type === 'sigmoid') { const k = str * 2; return 1 / (1 + Math.exp(-k * (t - 0.5))); }
  return t; // linear
}

export class StaticHalftoneNode extends EffectNode {
  constructor() {
    super('statichalftone', 'STATIC HALFTONE', {
      spacing:       { value: 6, min: 2, max: 40, step: 1, label: 'SPACING' },
      maxAmplitude:  { value: 3, min: 0.5, max: 30, step: 0.5, label: 'MAX AMP' },
      frequency:     { value: 60, min: 5, max: 300, step: 1, label: 'FREQUENCY' },
      sampleStep:    { value: 1, min: 0.5, max: 5, step: 0.25, label: 'DENSITY' },
      phaseOffset:   { value: 0, min: 0, max: 6.28, step: 0.01, label: 'PHASE' },
      phaseInc:      { value: 0, min: 0, max: 3.14, step: 0.01, label: 'PHASE INC' },
      ampCurve:      { value: 'linear', options: ['linear', 'exponential', 'logarithmic', 'sigmoid'], label: 'AMP CURVE', type: 'select' },
      curveStrength: { value: 2, min: 0.5, max: 5, step: 0.1, label: 'CURVE STR' },
      orientation:   { value: 'horizontal', options: ['horizontal', 'vertical'], label: 'ORIENT', type: 'select' },
      strokeW:       { value: 1, min: 0.25, max: 4, step: 0.25, label: 'STROKE W' },
      bgColor:       { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      strokeColor:   { value: 0, min: 0, max: 255, step: 1, label: 'STROKE LVL' }
    });
  }

  apply(src, dst, w, h) {
    const p = this.params;
    const isHoriz = p.orientation === 'horizontal';
    const pad = 2;

    // Build luminance field
    const n = w * h;
    const lum = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      lum[i] = (0.2126 * src[j] + 0.7152 * src[j + 1] + 0.0722 * src[j + 2]) / 255;
    }

    const pLen = isHoriz ? w : h;
    const cLen = isHoriz ? h : w;
    const numLines = Math.max(1, Math.floor((cLen - 2 * pad) / p.spacing) + 1);

    // Generate lines
    const lines = [];
    for (let li = 0; li < numLines; li++) {
      const base = pad + li * p.spacing;
      const ph = p.phaseOffset + li * p.phaseInc;
      const pts = [];
      for (let s = pad; s <= pLen - pad; s += p.sampleStep) {
        const cx = isHoriz ? s : base;
        const cy = isHoriz ? base : s;
        const ix = Math.max(0, Math.min(w - 1, Math.floor(cx)));
        const iy = Math.max(0, Math.min(h - 1, Math.floor(cy)));
        const l = lum[iy * w + ix];
        const curved = applyCurve(1 - l, p.ampCurve, p.curveStrength);
        const disp = p.maxAmplitude * curved * Math.sin((s / pLen) * p.frequency + ph);
        if (isHoriz) pts.push({ x: s, y: base + disp });
        else pts.push({ x: base + disp, y: s });
      }
      lines.push(pts);
    }

    // Render
    const oc = new OffscreenCanvas(w, h);
    const c = oc.getContext('2d');
    const bg = p.bgColor;
    c.fillStyle = `rgb(${bg},${bg},${bg})`;
    c.fillRect(0, 0, w, h);

    const sc = p.strokeColor;
    c.strokeStyle = `rgb(${sc},${sc},${sc})`;
    c.lineWidth = p.strokeW;

    for (const pts of lines) {
      if (pts.length < 2) continue;
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
      c.stroke();
    }

    const id = c.getImageData(0, 0, w, h);
    dst.set(id.data);
  }
}
