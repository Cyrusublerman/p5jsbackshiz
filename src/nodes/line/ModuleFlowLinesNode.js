import { EffectNode } from '../EffectNode.js';
import { buildBaseGradient } from '../../modules/field/base-gradient.js';
import { normalizeField } from '../../modules/field/vector-field.js';
import { buildFlowLines } from '../../modules/line/flow-line-engine.js';
import { vectorToRaster } from '../../modules/bridge/node-adapters.js';

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

  applyVector(src, w, h, ctx) {
    const p = this.params;
    const field = normalizeField(buildBaseGradient(src, w, h, true));
    const seeds = this._seedGrid(w, h, Math.max(2, p.spacing));
    const set = buildFlowLines({
      field,
      seeds,
      iterations: ctx.quality === 'preview' ? Math.min(p.iterations, 12) : p.iterations,
      step: p.stepSize
    });

    return {
      lines: set.lines,
      strokeRGBA: [p.strokeColor, p.strokeColor, p.strokeColor, 255],
      strokeWidth: p.strokeW,
      clearRGBA: [p.bgColor, p.bgColor, p.bgColor, 255]
    };
  }

  apply(src, dst, w, h, ctx) {
    const vectorSet = this.applyVector(src, w, h, ctx);
    dst.set(vectorToRaster({
      basePixels: src,
      width: w,
      height: h,
      lines: vectorSet.lines,
      strokeRGBA: vectorSet.strokeRGBA,
      strokeWidth: vectorSet.strokeWidth,
      clearRGBA: vectorSet.clearRGBA,
      opacity: 1
    }));
  }
}
