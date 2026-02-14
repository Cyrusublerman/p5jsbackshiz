import { EffectNode } from '../EffectNode.js';
import { SeededRNG, hashSeed } from '../../core/SeededRNG.js';
import { Sampler } from '../../core/Sampler.js';

export class IterativeRewarpNode extends EffectNode {
  constructor() {
    super('iterrewarp', 'ITER REWARP', {
      samples:     { value: 5, min: 2, max: 20, step: 1, label: 'SAMPLES' },
      jitterX:     { value: 10, min: 0, max: 100, step: 1, label: 'JITTER X' },
      jitterY:     { value: 10, min: 0, max: 100, step: 1, label: 'JITTER Y' },
      opacityMode: { value: 'decay', options: ['equal', 'decay'], label: 'BLEND', type: 'select' },
      decay:       { value: 0.7, min: 0.1, max: 0.99, step: 0.01, label: 'DECAY' },
      rotJitter:   { value: 0, min: 0, max: 10, step: 0.1, label: 'ROT JITTER' },
      scaleJitter: { value: 0, min: 0, max: 0.5, step: 0.01, label: 'SC JITTER' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { samples, jitterX, jitterY, opacityMode, decay, rotJitter, scaleJitter } = this.params;
    const n = ctx.quality === 'preview' ? Math.min(samples, 8) : samples;
    const sm = ctx.quality === 'preview' ? 'nearest' : 'bilinear';
    const aR = new Float32Array(w * h);
    const aG = new Float32Array(w * h);
    const aB = new Float32Array(w * h);
    const aA = new Float32Array(w * h);
    const aW = new Float32Array(w * h);

    for (let si = 0; si < n; si++) {
      const rng = new SeededRNG(hashSeed(ctx.nodeSeed, si, 999));
      const ox = (rng.next() - 0.5) * 2 * jitterX;
      const oy = (rng.next() - 0.5) * 2 * jitterY;
      const rot = (rng.next() - 0.5) * 2 * rotJitter * Math.PI / 180;
      const sc = 1 + (rng.next() - 0.5) * 2 * scaleJitter;
      const wt = opacityMode === 'decay' ? Math.pow(decay, si) : 1;
      const cosR = Math.cos(rot) * sc, sinR = Math.sin(rot) * sc;
      const cx = w * 0.5, cy = h * 0.5;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const px = x - cx, py = y - cy;
          const idx = y * w + x;
          const srcX = px * cosR - py * sinR + cx + ox;
          const srcY = px * sinR + py * cosR + cy + oy;
          // Inline sample for accumulation (no dst write, need values)
          const sx0 = Math.floor(srcX), sy0 = Math.floor(srcY);
          const fdx = srcX - sx0, fdy = srcY - sy0;
          const scx0 = sx0 < 0 ? 0 : sx0 >= w ? w-1 : sx0;
          const scx1 = sx0+1 < 0 ? 0 : sx0+1 >= w ? w-1 : sx0+1;
          const scy0 = sy0 < 0 ? 0 : sy0 >= h ? h-1 : sy0;
          const scy1 = sy0+1 < 0 ? 0 : sy0+1 >= h ? h-1 : sy0+1;
          const si00 = (scy0*w+scx0)*4, si10 = (scy0*w+scx1)*4;
          const si01 = (scy1*w+scx0)*4, si11 = (scy1*w+scx1)*4;
          const ifdx = 1-fdx, ifdy = 1-fdy;
          const w00 = ifdx*ifdy, w10 = fdx*ifdy, w01 = ifdx*fdy, w11 = fdx*fdy;
          aR[idx] += (s[si00]*w00+s[si10]*w10+s[si01]*w01+s[si11]*w11) * wt;
          aG[idx] += (s[si00+1]*w00+s[si10+1]*w10+s[si01+1]*w01+s[si11+1]*w11) * wt;
          aB[idx] += (s[si00+2]*w00+s[si10+2]*w10+s[si01+2]*w01+s[si11+2]*w11) * wt;
          aA[idx] += (s[si00+3]*w00+s[si10+3]*w10+s[si01+3]*w01+s[si11+3]*w11) * wt;
          aW[idx] += wt;
        }
      }
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const i = idx * 4;
        const wt = aW[idx] || 1;
        d[i] = aR[idx] / wt; d[i + 1] = aG[idx] / wt;
        d[i + 2] = aB[idx] / wt; d[i + 3] = aA[idx] / wt;
      }
    }
  }
}
