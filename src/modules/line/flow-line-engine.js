import { sampleField } from '../field/vector-field.js';
import { clipPoint, lineBounds } from './line-engine-common.js';
import { propagateFront } from './front-propagation-core.js';

export function buildFlowLines({
  field,
  seeds = [],
  iterations = 64,
  step = 1,
  minMove = 0.0001,
  occupancy = null
}) {
  const lines = [];

  for (const seed of seeds) {
    const line = propagateFront(seed, {
      steps: iterations,
      stepFn: (p) => {
        const [vx, vy] = sampleField(field, p.x, p.y, 'bilinear');
        const nx = p.x + vx * step;
        const ny = p.y + vy * step;
        const moved = Math.hypot(nx - p.x, ny - p.y);
        if (moved < minMove) return null;
        const next = clipPoint(nx, ny, field.width, field.height);
        if (occupancy) {
          const key = `${Math.round(next.x)},${Math.round(next.y)}`;
          if (occupancy.has(key)) return null;
          occupancy.add(key);
        }
        return next;
      }
    });
    lines.push(line);
  }

  return { lines, bounds: lineBounds(lines) };
}
