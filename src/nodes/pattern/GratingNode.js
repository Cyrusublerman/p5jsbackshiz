import { EffectNode } from '../EffectNode.js';

export class GratingNode extends EffectNode {
  constructor() {
    super('grating', 'GRATING', {
      type:       { value: 'linear', options: ['linear', 'radial', 'angular', 'spiral'], label: 'TYPE', type: 'select' },
      wavelength: { value: 20, min: 2, max: 200, step: 1, label: 'WAVELENGTH' },
      phase:      { value: 0, min: 0, max: 1, step: 0.01, label: 'PHASE' },
      angle:      { value: 0, min: 0, max: 360, step: 1, label: 'ANGLE' },
      spiralRate: { value: 1, min: 0.1, max: 10, step: 0.1, label: 'SPIRAL RATE' },
      blendMode:  { value: 'multiply', options: ['multiply', 'screen', 'replace'], label: 'BLEND', type: 'select' }
    });
  }

  apply(s, d, w, h) {
    const { type, wavelength, phase, angle, spiralRate, blendMode } = this.params;
    const cx = w / 2, cy = h / 2;
    const rad = angle * Math.PI / 180;
    const PI2 = Math.PI * 2;

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let intensity;
      if (type === 'linear') {
        const rx = x * Math.cos(rad) + y * Math.sin(rad);
        intensity = 0.5 * (1 + Math.cos(PI2 * (rx / wavelength + phase)));
      } else if (type === 'radial') {
        const r = Math.sqrt((x-cx)**2 + (y-cy)**2);
        intensity = 0.5 * (1 + Math.cos(PI2 * (r / wavelength + phase)));
      } else if (type === 'angular') {
        const theta = Math.atan2(y - cy, x - cx);
        intensity = 0.5 * (1 + Math.cos(wavelength * theta + phase * PI2));
      } else {
        const dx = x-cx, dy = y-cy;
        const r = Math.sqrt(dx*dx+dy*dy);
        const theta = Math.atan2(dy, dx);
        const u = r / wavelength + spiralRate * theta / PI2;
        intensity = 0.5 * (1 + Math.cos(PI2 * (u + phase)));
      }

      const oi = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        if (blendMode === 'replace') d[oi+c] = Math.round(intensity * 255);
        else if (blendMode === 'multiply') d[oi+c] = Math.round(s[oi+c] * intensity);
        else d[oi+c] = Math.round(255 - (255-s[oi+c]) * (1-intensity));
      }
      d[oi+3] = s[oi+3];
    }
  }
}
