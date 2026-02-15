import { EffectNode } from '../EffectNode.js';

export class ChannelMixerNode extends EffectNode {
  constructor() {
    super('channelmixer', 'CHANNEL MIXER', {
      rr: { value: 1, min: -2, max: 2, step: 0.01, label: 'R→R' },
      rg: { value: 0, min: -2, max: 2, step: 0.01, label: 'G→R' },
      rb: { value: 0, min: -2, max: 2, step: 0.01, label: 'B→R' },
      gr: { value: 0, min: -2, max: 2, step: 0.01, label: 'R→G' },
      gg: { value: 1, min: -2, max: 2, step: 0.01, label: 'G→G' },
      gb: { value: 0, min: -2, max: 2, step: 0.01, label: 'B→G' },
      br: { value: 0, min: -2, max: 2, step: 0.01, label: 'R→B' },
      bg: { value: 0, min: -2, max: 2, step: 0.01, label: 'G→B' },
      bb: { value: 1, min: -2, max: 2, step: 0.01, label: 'B→B' }
    });
  }

  apply(s, d, w, h) {
    const { rr, rg, rb, gr, gg, gb, br, bg, bb } = this.params;
    for (let i = 0, n = w * h * 4; i < n; i += 4) {
      const r = s[i], g = s[i + 1], b = s[i + 2];
      d[i]     = Math.max(0, Math.min(255, Math.round(r * rr + g * rg + b * rb)));
      d[i + 1] = Math.max(0, Math.min(255, Math.round(r * gr + g * gg + b * gb)));
      d[i + 2] = Math.max(0, Math.min(255, Math.round(r * br + g * bg + b * bb)));
      d[i + 3] = s[i + 3];
    }
  }
}
