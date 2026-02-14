import { EffectNode } from '../EffectNode.js';

export class HalftonePatternNode extends EffectNode {
  constructor() {
    super('halftonepattern', 'HALFTONE DOT', {
      spacing:  { value: 8, min: 2, max: 40, step: 1, label: 'SPACING' },
      angle:    { value: 45, min: 0, max: 180, step: 1, label: 'ANGLE' },
      minDot:   { value: 0.5, min: 0, max: 5, step: 0.1, label: 'MIN DOT' },
      maxDot:   { value: 4, min: 1, max: 15, step: 0.5, label: 'MAX DOT' },
      bgLevel:  { value: 255, min: 0, max: 255, step: 1, label: 'BG LEVEL' },
      dotLevel: { value: 0, min: 0, max: 255, step: 1, label: 'DOT LEVEL' }
    });
  }

  apply(s, d, w, h) {
    const { spacing: sp, angle, minDot, maxDot, bgLevel, dotLevel } = this.params;
    const cosA = Math.cos(angle * Math.PI / 180), sinA = Math.sin(angle * Math.PI / 180);

    // Fill background
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      d[i] = d[i+1] = d[i+2] = bgLevel; d[i+3] = s[i+3];
    }

    // Build luminance
    const lum = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) { const j=i*4; lum[i] = (s[j]*0.299+s[j+1]*0.587+s[j+2]*0.114)/255; }

    // Place dots on rotated grid
    const diag = Math.sqrt(w*w+h*h);
    const numI = Math.ceil(diag / sp) * 2;
    for (let gi = -numI; gi <= numI; gi++) {
      for (let gj = -numI; gj <= numI; gj++) {
        const gx = gi * sp, gy = gj * sp;
        const px = Math.round(w/2 + gx * cosA - gy * sinA);
        const py = Math.round(h/2 + gx * sinA + gy * cosA);
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        const l = lum[py * w + px];
        const radius = minDot + (1 - l) * (maxDot - minDot);
        const r2 = radius * radius;
        const ir = Math.ceil(radius);
        for (let dy = -ir; dy <= ir; dy++) {
          const ny = py + dy;
          if (ny < 0 || ny >= h) continue;
          for (let dx = -ir; dx <= ir; dx++) {
            const nx = px + dx;
            if (nx < 0 || nx >= w) continue;
            if (dx*dx + dy*dy <= r2) {
              const oi = (ny * w + nx) * 4;
              d[oi] = d[oi+1] = d[oi+2] = dotLevel;
            }
          }
        }
      }
    }
  }
}
