import { EffectNode } from '../EffectNode.js';

export class RadialBlurNode extends EffectNode {
  constructor() {
    super('radialblur', 'RADIAL BLUR', {
      type:    { value: 'zoom', options: ['zoom', 'spin'], label: 'TYPE', type: 'select' },
      centreX: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE X' },
      centreY: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'CENTRE Y' },
      amount:  { value: 10, min: 1, max: 50, step: 1, label: 'AMOUNT' },
      samples: { value: 12, min: 4, max: 32, step: 1, label: 'SAMPLES' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { type, centreX, centreY, amount } = this.params;
    let samples = this.params.samples;
    if (ctx && ctx.quality === 'preview') samples = Math.max(4, Math.round(samples * 0.5));
    const cx = centreX * w, cy = centreY * h;
    const invS = 1 / samples;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let ar = 0, ag = 0, ab = 0, aa = 0;
        for (let si = 0; si < samples; si++) {
          const t = (si / (samples - 1) - 0.5) * 2;
          let fx, fy;
          if (type === 'zoom') {
            const scale = 1 + t * amount * 0.002;
            fx = cx + (x - cx) * scale;
            fy = cy + (y - cy) * scale;
          } else { // spin
            const angle = t * amount * 0.002;
            const dx = x - cx, dy = y - cy;
            const cosA = Math.cos(angle), sinA = Math.sin(angle);
            fx = cx + dx * cosA - dy * sinA;
            fy = cy + dx * sinA + dy * cosA;
          }
          const sx = Math.max(0, Math.min(w - 1, Math.round(fx)));
          const sy = Math.max(0, Math.min(h - 1, Math.round(fy)));
          const j = (sy * w + sx) * 4;
          ar += s[j]; ag += s[j + 1]; ab += s[j + 2]; aa += s[j + 3];
        }
        const i = (y * w + x) * 4;
        d[i] = ar * invS; d[i + 1] = ag * invS; d[i + 2] = ab * invS; d[i + 3] = aa * invS;
      }
    }
  }
}
