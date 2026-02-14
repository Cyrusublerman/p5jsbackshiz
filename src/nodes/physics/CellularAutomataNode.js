import { EffectNode } from '../EffectNode.js';

const RULES = {
  life:     { birth: [3], survival: [2, 3] },
  highLife: { birth: [3, 6], survival: [2, 3] },
  seeds:    { birth: [2], survival: [] },
  dayNight: { birth: [3, 6, 7, 8], survival: [3, 4, 6, 7, 8] },
  maze:     { birth: [3], survival: [1, 2, 3, 4, 5] },
  anneal:   { birth: [4, 6, 7, 8], survival: [3, 5, 6, 7, 8] }
};

export class CellularAutomataNode extends EffectNode {
  constructor() {
    super('cellularautomata', 'CELL AUTOMATA', {
      rule:     { value: 'life', options: Object.keys(RULES), label: 'RULE', type: 'select' },
      steps:    { value: 50, min: 1, max: 500, step: 1, label: 'STEPS' },
      threshold:{ value: 128, min: 0, max: 255, step: 1, label: 'INIT THRESH' },
      blendAmt: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'BLEND' }
    });
  }

  apply(s, d, w, h, ctx) {
    let steps = this.params.steps;
    if (ctx && ctx.quality === 'preview') steps = Math.min(steps, 20);
    const rule = RULES[this.params.rule] || RULES.life;
    const n = w * h;

    // Init grid from source luminance threshold
    let grid = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const lum = s[j] * 0.299 + s[j+1] * 0.587 + s[j+2] * 0.114;
      grid[i] = lum > this.params.threshold ? 1 : 0;
    }

    // Run steps
    let next = new Uint8Array(n);
    for (let step = 0; step < steps; step++) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let nb = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = (x+dx+w)%w, ny = (y+dy+h)%h;
          nb += grid[ny*w+nx];
        }
        const i = y*w+x;
        if (grid[i]) next[i] = rule.survival.includes(nb) ? 1 : 0;
        else next[i] = rule.birth.includes(nb) ? 1 : 0;
      }
      [grid, next] = [next, grid];
    }

    // Blend CA result with source
    const blend = this.params.blendAmt;
    const inv = 1 - blend;
    for (let i = 0; i < n; i++) {
      const j = i * 4;
      const ca = grid[i] * 255;
      d[j]   = Math.round(s[j]   * inv + ca * blend);
      d[j+1] = Math.round(s[j+1] * inv + ca * blend);
      d[j+2] = Math.round(s[j+2] * inv + ca * blend);
      d[j+3] = s[j+3];
    }
  }
}
