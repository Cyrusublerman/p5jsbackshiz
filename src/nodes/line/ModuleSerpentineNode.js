import { EffectNode } from '../EffectNode.js';
import { buildSerpentineLines } from '../../modules/line/serpentine-line-engine.js';
import { vectorToRaster } from '../../modules/bridge/node-adapters.js';

/**
 * ModuleSerpentineNode — module-backed serpentine renderer.
 */
export class ModuleSerpentineNode extends EffectNode {
  constructor() {
    super('moduleserpentine', 'MODULE SERPENTINE', {
      spacing:     { value: 8, min: 2, max: 40, step: 1, label: 'SPACING' },
      amplitude:   { value: 3, min: 0.5, max: 20, step: 0.5, label: 'AMPLITUDE' },
      frequency:   { value: 0.2, min: 0.05, max: 1.5, step: 0.05, label: 'FREQUENCY' },
      jitter:      { value: 0.4, min: 0, max: 4, step: 0.1, label: 'JITTER' },
      strokeW:     { value: 1, min: 0.25, max: 4, step: 0.25, label: 'STROKE W' },
      bgColor:     { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      strokeColor: { value: 0, min: 0, max: 255, step: 1, label: 'STROKE LVL' }
    });
  }

  applyVector(_src, w, h, ctx) {
  apply(src, dst, w, h, ctx) {
    const p = this.params;
    const set = buildSerpentineLines({
      width: w,
      height: h,
      spacing: p.spacing,
      amplitude: p.amplitude,
      frequency: p.frequency,
      seed: ctx.nodeSeed,
      jitter: ctx.quality === 'preview' ? p.jitter * 0.5 : p.jitter
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
    const oc = new OffscreenCanvas(w, h);
    const c = oc.getContext('2d');
    c.fillStyle = `rgb(${p.bgColor},${p.bgColor},${p.bgColor})`;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = `rgb(${p.strokeColor},${p.strokeColor},${p.strokeColor})`;
    c.lineWidth = p.strokeW;

    for (const line of set.lines) {
      if (line.length < 2) continue;
      c.beginPath();
      c.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) c.lineTo(line[i].x, line[i].y);
      c.stroke();
    }

    dst.set(c.getImageData(0, 0, w, h).data);
  }
}
