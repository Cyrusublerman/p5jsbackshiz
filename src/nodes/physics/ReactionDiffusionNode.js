import { EffectNode } from '../EffectNode.js';

const PRESETS = {
  mitosis:   { Du: 0.2097, Dv: 0.105, feed: 0.0367, kill: 0.0649 },
  coral:     { Du: 0.16, Dv: 0.08, feed: 0.06, kill: 0.062 },
  spots:     { Du: 0.16, Dv: 0.08, feed: 0.035, kill: 0.065 },
  maze:      { Du: 0.21, Dv: 0.105, feed: 0.029, kill: 0.057 },
  worms:     { Du: 0.21, Dv: 0.105, feed: 0.046, kill: 0.063 },
  solitons:  { Du: 0.19, Dv: 0.095, feed: 0.03, kill: 0.06 },
  pulsating: { Du: 0.19, Dv: 0.095, feed: 0.026, kill: 0.055 },
  chaos:     { Du: 0.16, Dv: 0.08, feed: 0.026, kill: 0.052 }
};

export class ReactionDiffusionNode extends EffectNode {
  constructor() {
    super('reactiondiffusion', 'REACT-DIFFUSE', {
      preset:   { value: 'coral', options: Object.keys(PRESETS), label: 'PRESET', type: 'select' },
      steps:    { value: 500, min: 10, max: 5000, step: 10, label: 'STEPS' },
      seedSize: { value: 20, min: 5, max: 100, step: 1, label: 'SEED SIZE' }
    });
  }

  apply(s, d, w, h, ctx) {
    const p = PRESETS[this.params.preset] || PRESETS.coral;
    let steps = this.params.steps;
    if (ctx && ctx.quality === 'preview') steps = Math.min(steps, 100);
    const half = Math.floor(this.params.seedSize / 2);
    const cx = w >> 1, cy = h >> 1;
    const n = w * h;

    let u = new Float32Array(n).fill(1);
    let v = new Float32Array(n).fill(0);
    // Seed centre from image luminance
    for (let y = cy-half; y < cy+half && y < h; y++) {
      for (let x = cx-half; x < cx+half && x < w; x++) {
        if (x >= 0 && y >= 0) {
          const i = y*w+x, j = i*4;
          const lum = (s[j]*0.299 + s[j+1]*0.587 + s[j+2]*0.114) / 255;
          u[i] = 0.5; v[i] = 0.25 + lum * 0.1;
        }
      }
    }

    const { Du, Dv, feed, kill } = p;
    let uN = new Float32Array(n), vN = new Float32Array(n);
    for (let step = 0; step < steps; step++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y*w+x;
        const l = x > 0 ? i-1 : i, r = x < w-1 ? i+1 : i;
        const t = y > 0 ? i-w : i, b = y < h-1 ? i+w : i;
        const lapU = u[l]+u[r]+u[t]+u[b]-4*u[i];
        const lapV = v[l]+v[r]+v[t]+v[b]-4*v[i];
        const uv2 = u[i]*v[i]*v[i];
        uN[i] = Math.max(0, Math.min(1, u[i] + Du*lapU - uv2 + feed*(1-u[i])));
        vN[i] = Math.max(0, Math.min(1, v[i] + Dv*lapV + uv2 - (feed+kill)*v[i]));
      }
      [u, uN] = [uN, u]; [v, vN] = [vN, v];
    }

    // Map V → pixels (blend with source)
    for (let i = 0; i < n; i++) {
      const val = Math.round(v[i] * 255);
      const j = i * 4;
      d[j] = val; d[j+1] = val; d[j+2] = val; d[j+3] = s[j+3];
    }
  }
}
