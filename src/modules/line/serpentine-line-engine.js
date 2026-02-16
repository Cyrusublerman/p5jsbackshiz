import { lineBounds, seededRandom } from './line-engine-common.js';

export function buildSerpentineLines({
  width,
  height,
  spacing = 8,
  amplitude = 4,
  frequency = 0.15,
  seed = 1,
  jitter = 0
}) {
  const rnd = seededRandom(seed);
  const lines = [];

  for (let y0 = 0; y0 < height; y0 += spacing) {
    const line = [];
    for (let x = 0; x < width; x++) {
      const j = jitter ? (rnd() * 2 - 1) * jitter : 0;
      const y = y0 + Math.sin(x * frequency) * amplitude + j;
      line.push({ x, y });
    }
    lines.push(line);
  }

  return { lines, bounds: lineBounds(lines) };
}
