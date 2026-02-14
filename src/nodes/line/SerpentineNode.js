import { EffectNode } from '../EffectNode.js';

/**
 * SerpentineNode — flow wave-front halftone → pixel buffer.
 * Embeds: LuminanceField, DragModel, FlowWaveFront, WaveFrontFlowEngine
 * from serpentine halftone.
 */

/* ── Internal: Drag model ── */
function calcDrag(lum, dragLight, dragDark, curveType, curveStr) {
  let t = 1 - lum;
  if (curveType === 'exponential') t = Math.pow(t, curveStr);
  else if (curveType === 'logarithmic') t = Math.log(1 + t * (Math.pow(Math.E, curveStr) - 1)) / curveStr;
  else if (curveType === 'sigmoid') { const k = curveStr * 2; t = 1 / (1 + Math.exp(-k * (t - 0.5))); }
  return dragLight + (dragDark - dragLight) * t;
}

/* ── Internal: Luminance field from pixel buffer ── */
function buildLumField(px, w, h) {
  const n = w * h;
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    lum[i] = (0.2126 * px[j] + 0.7152 * px[j + 1] + 0.0722 * px[j + 2]) / 255;
  }
  return lum;
}

function lumAt(lum, w, h, cx, cy) {
  const ix = Math.max(0, Math.min(w - 1, Math.floor(cx)));
  const iy = Math.max(0, Math.min(h - 1, Math.floor(cy)));
  return lum[iy * w + ix];
}

export class SerpentineNode extends EffectNode {
  constructor() {
    super('serpentine', 'SERPENTINE', {
      mode:        { value: 'flow', options: ['flow', 'serpentine'], label: 'MODE', type: 'select' },
      spacing:     { value: 6, min: 2, max: 40, step: 1, label: 'SPACING' },
      amplitude:   { value: 2.5, min: 0.5, max: 20, step: 0.5, label: 'AMPLITUDE' },
      frequency:   { value: 1, min: 0.1, max: 5, step: 0.1, label: 'FREQUENCY' },
      baseSpeed:   { value: 0.5, min: 0.05, max: 3, step: 0.05, label: 'SPEED' },
      dragLight:   { value: 0, min: 0, max: 0.8, step: 0.01, label: 'DRAG LIGHT' },
      dragDark:    { value: 0.5, min: 0, max: 0.95, step: 0.01, label: 'DRAG DARK' },
      iterations:  { value: 200, min: 10, max: 2000, step: 10, label: 'ITERATIONS' },
      strokeW:     { value: 1, min: 0.25, max: 4, step: 0.25, label: 'STROKE W' },
      bgColor:     { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      strokeColor: { value: 0, min: 0, max: 255, step: 1, label: 'STROKE LVL' }
    });
  }

  apply(src, dst, w, h, ctx) {
    const p = this.params;
    const iters = ctx.quality === 'preview' ? Math.min(p.iterations, 60) : p.iterations;
    const lumField = buildLumField(src, w, h);
    const isHoriz = true;
    const pad = 2;

    // Build wave fronts
    const waveFronts = [];
    const lineStart = pad, lineEnd = w - pad;
    const flowStart = pad, farEdge = h - pad;
    const spawnInterval = Math.max(1, Math.round(p.spacing / Math.max(0.01, p.baseSpeed)));
    let framesSinceSpawn = Infinity;
    let frontIndex = 0;

    for (let frame = 0; frame < iters; frame++) {
      framesSinceSpawn++;
      if (framesSinceSpawn >= spawnInterval) {
        // Create new wave front
        const phase = frontIndex * 0;
        const pts = [];
        for (let s = lineStart; s <= lineEnd; s += 1) {
          const sineDisp = Math.sin(s * p.frequency * 0.01 + phase) * p.amplitude;
          pts.push({ linePos: s, flowPos: flowStart + sineDisp, lum: 0.5 });
        }
        waveFronts.push({ points: pts, complete: false });
        framesSinceSpawn = 0;
        frontIndex++;
      }

      // Update all active wave fronts
      for (const wf of waveFronts) {
        if (wf.complete) continue;
        let allDone = true;
        for (const pt of wf.points) {
          if (pt.flowPos >= farEdge) continue;
          const cx = pt.linePos;
          const cy = pt.flowPos;
          let lum = lumAt(lumField, w, h, cx, cy);
          pt.lum = lum;
          const drag = calcDrag(lum, p.dragLight, p.dragDark, 'linear', 2);
          pt.flowPos += p.baseSpeed * (1 - drag);
          if (pt.flowPos >= farEdge) pt.flowPos = farEdge;
          else allDone = false;
        }
        if (allDone) wf.complete = true;
      }
    }

    // Render to offscreen canvas
    const oc = new OffscreenCanvas(w, h);
    const c = oc.getContext('2d');
    const bg = p.bgColor;
    c.fillStyle = `rgb(${bg},${bg},${bg})`;
    c.fillRect(0, 0, w, h);

    const sc = p.strokeColor;
    c.strokeStyle = `rgb(${sc},${sc},${sc})`;
    c.lineWidth = p.strokeW;

    for (const wf of waveFronts) {
      if (!wf.points || wf.points.length < 2) continue;
      c.beginPath();
      for (let i = 0; i < wf.points.length; i++) {
        const pt = wf.points[i];
        const x = pt.linePos;
        const y = pt.flowPos;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }

    const id = c.getImageData(0, 0, w, h);
    dst.set(id.data);
  }
}
