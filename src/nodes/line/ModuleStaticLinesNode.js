import { EffectNode } from '../EffectNode.js';
import { buildStaticLines } from '../../modules/line/static-line-engine.js';

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

  apply(src, dst, w, h) {
    const p = this.params;
    const set = buildStaticLines({
      width: w,
      height: h,
      spacing: p.spacing,
      horizontal: p.horizontal,
      zigzag: p.zigzag
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
