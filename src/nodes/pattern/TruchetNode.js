import { EffectNode } from '../EffectNode.js';

export class TruchetNode extends EffectNode {
  constructor() {
    super('truchet', 'TRUCHET', {
      tileSize:    { value: 20, min: 5, max: 100, step: 1, label: 'TILE SIZE' },
      strokeWidth: { value: 3, min: 0.5, max: 15, step: 0.5, label: 'STROKE W' },
      blendMode:   { value: 'multiply', options: ['multiply', 'screen', 'overlay'], label: 'BLEND', type: 'select' }
    });
  }

  apply(s, d, w, h, ctx) {
    const { tileSize: ts, strokeWidth: sw, blendMode } = this.params;
    const seed = ctx ? ctx.nodeSeed : 0;
    const cols = Math.ceil(w / ts), rows = Math.ceil(h / ts);
    const grid = new Uint8Array(cols * rows);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      let hv = seed ^ (i * 0x45d9f3b); hv = ((hv ^ j) * 0x45d9f3b) >>> 0;
      hv = ((hv >> 16) ^ hv) >>> 0;
      grid[j * cols + i] = hv & 1;
    }

    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ti = Math.floor(x / ts), tj = Math.floor(y / ts);
      const st = grid[Math.min(tj, rows-1) * cols + Math.min(ti, cols-1)];
      const lx = x - ti * ts, ly = y - tj * ts;
      const r = ts / 2;
      let minDist = Infinity;
      if (st === 0) {
        let dx = lx, dy = ly; minDist = Math.min(minDist, Math.abs(Math.sqrt(dx*dx+dy*dy) - r));
        dx = lx - ts; dy = ly - ts; minDist = Math.min(minDist, Math.abs(Math.sqrt(dx*dx+dy*dy) - r));
      } else {
        let dx = lx - ts, dy = ly; minDist = Math.min(minDist, Math.abs(Math.sqrt(dx*dx+dy*dy) - r));
        dx = lx; dy = ly - ts; minDist = Math.min(minDist, Math.abs(Math.sqrt(dx*dx+dy*dy) - r));
      }
      const pat = minDist < sw / 2 ? 0 : 255;
      const oi = (y * w + x) * 4;
      const pn = pat / 255;
      for (let c = 0; c < 3; c++) {
        const sv = s[oi + c] / 255;
        let out;
        if (blendMode === 'multiply') out = sv * pn;
        else if (blendMode === 'screen') out = 1 - (1 - sv) * (1 - pn);
        else out = sv < 0.5 ? 2 * sv * pn : 1 - 2 * (1 - sv) * (1 - pn);
        d[oi + c] = Math.round(out * 255);
      }
      d[oi + 3] = s[oi + 3];
    }
  }
}
