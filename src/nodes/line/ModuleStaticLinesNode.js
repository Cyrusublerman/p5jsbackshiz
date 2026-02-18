import { EffectNode } from '../EffectNode.js';
import { buildStaticLines } from '../../modules/line/static-line-engine.js';
import { vectorToRaster } from '../../modules/bridge/node-adapters.js';

/**
 * ModuleStaticLinesNode — module-backed static line renderer.
 */
export class ModuleStaticLinesNode extends EffectNode {
  constructor() {
    super('modulestaticlines', 'MODULE STATIC LINES', {
      spacing:     { value: 8, min: 2, max: 40, step: 1, label: 'SPACING' },
      horizontal:  { value: true, label: 'HORIZONTAL', type: 'toggle' },
      zigzag:      { value: false, label: 'ZIGZAG', type: 'toggle' },
      strokeW:     { value: 1, min: 0.25, max: 4, step: 0.25, label: 'STROKE W' },
      bgColor:     { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      strokeColor: { value: 0, min: 0, max: 255, step: 1, label: 'STROKE LVL' }
    });
  }

  applyVector(_src, w, h) {
  apply(src, dst, w, h) {
    const p = this.params;
    const set = buildStaticLines({
      width: w,
      height: h,
      spacing: p.spacing,
      horizontal: p.horizontal,
      zigzag: p.zigzag
    });

    return {
      lines: set.lines,
      strokeRGBA: [p.strokeColor, p.strokeColor, p.strokeColor, 255],
      strokeWidth: p.strokeW,
      clearRGBA: [p.bgColor, p.bgColor, p.bgColor, 255]
    };
  }

  apply(src, dst, w, h) {
    const vectorSet = this.applyVector(src, w, h);
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
      if (!line || line.length < 2) continue;
      c.beginPath();
      c.moveTo(line[0].x, line[0].y);
      for (let i = 1; i < line.length; i++) c.lineTo(line[i].x, line[i].y);
      c.stroke();
    }

    dst.set(c.getImageData(0, 0, w, h).data);
  }
}
