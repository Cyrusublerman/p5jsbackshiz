import { EffectNode } from '../EffectNode.js';
import { buildBaseGradient } from '../../modules/field/base-gradient.js';
import { normalizeField } from '../../modules/field/vector-field.js';
import { buildFlowLines } from '../../modules/line/flow-line-engine.js';

/**
 * ModuleFlowLinesNode — module-backed flow-line renderer.
 * Keeps legacy EffectNode shape/contract for UI/recipes/stack.
 */
export class ModuleFlowLinesNode extends EffectNode {
  constructor() {
    super('moduleflowlines', 'MODULE FLOW LINES', {
      spacing:      { value: 8, min: 2, max: 40, step: 1, label: 'SPACING' },
      iterations:   { value: 24, min: 4, max: 200, step: 1, label: 'ITERATIONS' },
      stepSize:     { value: 1, min: 0.25, max: 5, step: 0.25, label: 'STEP' },
      strokeW:      { value: 1, min: 0.25, max: 4, step: 0.25, label: 'STROKE W' },
      bgColor:      { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      strokeColor:  { value: 0, min: 0, max: 255, step: 1, label: 'STROKE LVL' }
    });
  }

  _seedGrid(w, h, spacing) {
    const seeds = [];
    for (let y = spacing; y < h; y += spacing) {
      for (let x = spacing; x < w; x += spacing) seeds.push({ x, y });
    }
    return seeds;
  }

  apply(src, dst, w, h, ctx) {
    const p = this.params;
    const field = normalizeField(buildBaseGradient(src, w, h, true));
    const seeds = this._seedGrid(w, h, Math.max(2, p.spacing));
    const set = buildFlowLines({
      field,
      seeds,
      iterations: ctx.quality === 'preview' ? Math.min(p.iterations, 12) : p.iterations,
      step: p.stepSize
    });

    const oc = new OffscreenCanvas(w, h);
    const c = oc.getContext('2d');
    c.fillStyle = `rgb(${p.bgColor},${p.bgColor},${p.bgColor})`;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = `rgb(${p.strokeColor},${p.strokeColor},${p.strokeColor})`;
    c.lineWidth = p.strokeW;

    for (const line of set.lines) {
      if (!line || line.length < 2) continue;
      c.beginPath();
      c.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) c.lineTo(line[i].x, line[i].y);
      c.stroke();
    }

    dst.set(c.getImageData(0, 0, w, h).data);
  }
}
