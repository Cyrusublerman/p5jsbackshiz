import { EffectNode } from '../EffectNode.js';
import { Sampler } from '../../core/Sampler.js';

export class PolarCoordsNode extends EffectNode {
  constructor() {
    super('polarcoords', 'POLAR COORDS', {
      mode:    { value: 'rectToPolar', options: ['rectToPolar', 'polarToRect'], label: 'MODE', type: 'select' },
      centreX: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' }
    });
  }

  apply(s, d, w, h) {
    const { mode, centreX, centreY } = this.params;
    const cx = centreX * w, cy = centreY * h;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let fx, fy;
        if (mode === 'rectToPolar') {
          const r = (y / h) * maxR;
          const a = (x / w) * Math.PI * 2;
          fx = cx + Math.cos(a) * r;
          fy = cy + Math.sin(a) * r;
        } else {
          const dx = x - cx, dy = y - cy;
          const r = Math.sqrt(dx * dx + dy * dy);
          const a = Math.atan2(dy, dx);
          fx = ((a + Math.PI) / (Math.PI * 2)) * w;
          fy = (r / maxR) * h;
        }
        const i = (y * w + x) * 4;
        Sampler.bilinearDst(s, w, h, fx, fy, d, i);
      }
    }
  }
}
