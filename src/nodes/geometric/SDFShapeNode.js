import { EffectNode } from '../EffectNode.js';

export class SDFShapeNode extends EffectNode {
  constructor() {
    super('sdfshape', 'SDF SHAPE', {
      shape:     { value: 'circle', options: ['circle', 'box', 'ring'], label: 'SHAPE', type: 'select' },
      centreX:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY:   { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' },
      size:      { value: 0.3, min: 0.01, max: 1, step: 0.01, label: 'SIZE' },
      softness:  { value: 0.02, min: 0, max: 0.2, step: 0.005, label: 'SOFTNESS' },
      invert:    { value: 0, min: 0, max: 1, step: 1, label: 'INVERT' },
      fillR:     { value: 0, min: 0, max: 255, step: 1, label: 'FILL R' },
      fillG:     { value: 0, min: 0, max: 255, step: 1, label: 'FILL G' },
      fillB:     { value: 0, min: 0, max: 255, step: 1, label: 'FILL B' }
    });
  }

  apply(s, d, w, h) {
    const { shape, centreX, centreY, size, softness, invert, fillR, fillG, fillB } = this.params;
    const cx = centreX * w, cy = centreY * h;
    const sz = size * Math.min(w, h);

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = y - cy;
      let dist;
      if (shape === 'circle') {
        dist = Math.sqrt(dx*dx + dy*dy) - sz;
      } else if (shape === 'box') {
        const ax = Math.abs(dx) - sz, ay = Math.abs(dy) - sz;
        dist = Math.sqrt(Math.max(ax,0)**2 + Math.max(ay,0)**2) + Math.min(Math.max(ax,ay), 0);
      } else { // ring
        dist = Math.abs(Math.sqrt(dx*dx+dy*dy) - sz) - sz * 0.15;
      }

      // Normalize dist to [0,1] alpha
      let alpha = softness > 0 ? Math.max(0, Math.min(1, 0.5 - dist / (softness * Math.min(w,h)))) : (dist < 0 ? 1 : 0);
      if (invert) alpha = 1 - alpha;

      const i = (y * w + x) * 4;
      d[i]   = Math.round(s[i]   * (1-alpha) + fillR * alpha);
      d[i+1] = Math.round(s[i+1] * (1-alpha) + fillG * alpha);
      d[i+2] = Math.round(s[i+2] * (1-alpha) + fillB * alpha);
      d[i+3] = s[i+3];
    }
  }
}
