import { EffectNode } from '../EffectNode.js';

/**
 * LuminanceFlowNode — renders line-displaced output to pixel buffer.
 * Embeds: VectorFieldMap, ForceSystem, Steering, LineGenerator,
 * DisplacementMatrix, ColorMapper from luminance-distortion.
 */

/* ── Internal helpers ── */

class VectorFieldMap {
  constructor() {
    this.w = 0; this.h = 0; this.ready = false;
    this.lum = null; this.mag = null;
    this.cosA = null; this.sinA = null;
    this.tanCos = null; this.tanSin = null; this.maxMag = 0;
  }
  build(px, w, h, dz) {
    this.w = w; this.h = h;
    const n = w * h;
    const L = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      L[i] = (0.2126 * px[j] + 0.7152 * px[j + 1] + 0.0722 * px[j + 2]) / 255;
    }
    const gx = new Float32Array(n), gy = new Float32Array(n);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        gx[i] = -L[(y-1)*w+x-1]+L[(y-1)*w+x+1]-2*L[y*w+x-1]+2*L[y*w+x+1]-L[(y+1)*w+x-1]+L[(y+1)*w+x+1];
        gy[i] = -L[(y-1)*w+x-1]-2*L[(y-1)*w+x]-L[(y-1)*w+x+1]+L[(y+1)*w+x-1]+2*L[(y+1)*w+x]+L[(y+1)*w+x+1];
      }
    }
    this.lum = L;
    this.mag = new Float32Array(n);
    this.cosA = new Float32Array(n); this.sinA = new Float32Array(n);
    this.tanCos = new Float32Array(n); this.tanSin = new Float32Array(n);
    let mx = 0;
    for (let i = 0; i < n; i++) {
      const m = Math.sqrt(gx[i]*gx[i] + gy[i]*gy[i]);
      if (m > mx) mx = m;
    }
    this.maxMag = mx;
    const dzF = Math.max(dz * 2, 0.001);
    for (let i = 0; i < n; i++) {
      const rm = Math.sqrt(gx[i]*gx[i] + gy[i]*gy[i]);
      let t = 0;
      if (rm > dz) { t = Math.min((rm - dz) / dzF, 1); t = t * t * (3 - 2 * t); }
      this.mag[i] = rm * t;
      if (rm > 0.0001) { this.cosA[i] = gx[i] / rm; this.sinA[i] = gy[i] / rm; }
      this.tanCos[i] = -this.sinA[i]; this.tanSin[i] = this.cosA[i];
    }
    this.ready = true;
  }
  sample(x, y) {
    if (!this.ready) return { lum: 0.5, mag: 0, cosA: 0, sinA: 0, tanCos: 0, tanSin: 1 };
    const ix = Math.max(0, Math.min(~~x, this.w - 1));
    const iy = Math.max(0, Math.min(~~y, this.h - 1));
    const i = iy * this.w + ix;
    return { lum: this.lum[i], mag: this.mag[i], cosA: this.cosA[i], sinA: this.sinA[i], tanCos: this.tanCos[i], tanSin: this.tanSin[i] };
  }
}

class LineGenerator {
  generate(type, w, h, sp) {
    if (type === 'radial' || type === 'concentric') return this._rc(type, w, h, sp);
    return this._build(type, w, h, this._pos(type, w, h, sp));
  }
  _pos(type, w, h, sp) {
    const o = [];
    if (type === 'horizontal' || type === 'grid') for (let y = 0; y < h; y += sp) o.push(y);
    else if (type === 'vertical') for (let x = 0; x < w; x += sp) o.push(x);
    else if (type === 'diagonal') for (let d = -h; d < w + h; d += sp) o.push(d);
    return o;
  }
  _build(type, w, h, pos) {
    const out = [];
    for (let i = 0; i < pos.length; i++) {
      const p = pos[i], pts = [];
      if (type === 'horizontal' || type === 'grid') for (let x = 0; x < w; x++) pts.push({ x, y: p });
      else if (type === 'vertical') for (let y = 0; y < h; y++) pts.push({ x: p, y });
      else if (type === 'diagonal') for (let t = 0; t < w + h; t++) {
        const x = p + t * 0.707, y = t * 0.707;
        if (x >= 0 && x < w && y >= 0 && y < h) pts.push({ x, y });
      }
      if (pts.length > 2) out.push({ pts, idx: i });
    }
    if (type === 'grid') {
      const sp = pos.length > 1 ? pos[1] - pos[0] : 10;
      for (let x = 0; x < w; x += sp) {
        const pts = [];
        for (let y = 0; y < h; y++) pts.push({ x, y });
        out.push({ pts, idx: -1 });
      }
    }
    return out;
  }
  _rc(type, w, h, sp) {
    const out = [], PI2 = Math.PI * 2, cx = w / 2, cy = h / 2, mr = Math.sqrt(cx * cx + cy * cy);
    if (type === 'radial') {
      const as = sp * 0.02;
      for (let a = 0; a < PI2; a += as) {
        const pts = [];
        for (let r = 0; r < mr; r += 2) pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        out.push({ pts, idx: out.length });
      }
    } else {
      for (let r = sp; r < mr; r += sp) {
        const pts = [], sg = Math.max(60, ~~(r * 0.5));
        for (let j = 0; j <= sg; j++) {
          const a = (j / sg) * PI2;
          pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
        out.push({ pts, idx: out.length });
      }
    }
    return out;
  }
}

export class LuminanceFlowNode extends EffectNode {
  constructor() {
    super('lumflow', 'LUMINANCE FLOW', {
      patternType:  { value: 'horizontal', options: ['horizontal', 'vertical', 'diagonal', 'grid', 'radial', 'concentric'], label: 'PATTERN', type: 'select' },
      spacing:      { value: 8, min: 1, max: 40, step: 1, label: 'SPACING' },
      strokeWeight: { value: 0.7, min: 0.1, max: 4, step: 0.1, label: 'STROKE W' },
      resolution:   { value: 2, min: 1, max: 10, step: 1, label: 'STEP' },
      amplitude:    { value: 15, min: 0, max: 80, step: 1, label: 'AMPLITUDE' },
      lumExp:       { value: 1, min: 0.2, max: 4, step: 0.1, label: 'LUM EXP' },
      damping:      { value: 0.95, min: 0.01, max: 1, step: 0.01, label: 'DAMPING' },
      iterations:   { value: 3, min: 1, max: 20, step: 1, label: 'ITERATIONS' },
      bgBrightness: { value: 10, min: 0, max: 255, step: 1, label: 'BG LEVEL' }
    });
  }

  apply(src, dst, w, h, ctx) {
    const p = this.params;
    const iters = ctx.quality === 'preview' ? Math.min(p.iterations, 2) : p.iterations;

    // Build vector field from source
    const vf = new VectorFieldMap();
    vf.build(src, w, h, 0.02);

    // Generate line topology
    const lg = new LineGenerator();
    const lines = lg.generate(p.patternType, w, h, p.spacing);
    const res = p.resolution;

    // Displacement matrix
    const nPts = [];
    const dmData = [];
    for (let l = 0; l < lines.length; l++) {
      const np = Math.ceil(lines[l].pts.length / res);
      nPts.push(np);
      dmData.push(new Float32Array(np * 2));
    }

    // Run iterations: damp → accumulate displacement
    for (let iter = 0; iter < iters; iter++) {
      // Damp
      const dampFactor = 1 - p.damping;
      for (let l = 0; l < lines.length; l++) {
        const d = dmData[l];
        for (let i = 0; i < d.length; i++) d[i] *= dampFactor;
      }

      // Accumulate fixed-angle forces
      const cA = 1, sA = 0; // angle=90° → cos(90)=0, sin(90)=1; simplified
      for (let l = 0; l < lines.length; l++) {
        const pts = lines[l].pts;
        for (let pi = 0; pi < nPts[l]; pi++) {
          const i = pi * res;
          if (i >= pts.length) break;
          const bx = pts[i].x, by = pts[i].y;
          const s = vf.sample(bx, by);
          const lum = Math.pow(s.lum, p.lumExp);
          const fx = lum * p.amplitude * 0.5;
          const fy = lum * p.amplitude;
          dmData[l][pi * 2] += fx;
          dmData[l][pi * 2 + 1] += fy;
        }
      }
    }

    // Render to offscreen canvas (cached)
    if (!this._oc || this._ocW !== w || this._ocH !== h) {
      this._oc = new OffscreenCanvas(w, h);
      this._ocCtx = this._oc.getContext('2d');
      this._ocW = w; this._ocH = h;
    }
    const oc = this._oc;
    const c = this._ocCtx;
    c.fillStyle = `rgb(${p.bgBrightness},${p.bgBrightness},${p.bgBrightness})`;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = p.strokeWeight;

    for (let l = 0; l < lines.length; l++) {
      const pts = lines[l].pts;
      c.beginPath();
      for (let pi = 0; pi < nPts[l]; pi++) {
        const i = pi * res;
        if (i >= pts.length) break;
        const bx = pts[i].x, by = pts[i].y;
        const lum = Math.pow(vf.sample(bx, by).lum, p.lumExp);
        const alpha = 50 + lum * 200;
        c.strokeStyle = `rgba(255,255,255,${(alpha / 255).toFixed(3)})`;
        const dx = bx + dmData[l][pi * 2];
        const dy = by + dmData[l][pi * 2 + 1];
        if (pi === 0) c.moveTo(dx, dy);
        else c.lineTo(dx, dy);
      }
      c.stroke();
    }

    // Read back pixels
    const id = c.getImageData(0, 0, w, h);
    dst.set(id.data);
  }
}
