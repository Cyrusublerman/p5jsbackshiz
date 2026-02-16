import { lineBounds } from './line-engine-common.js';

export function buildStaticLines({ width, height, spacing = 8, horizontal = true, zigzag = false }) {
  const lines = [];
  if (horizontal) {
    for (let y = 0; y < height; y += spacing) {
      lines.push(zigzag && ((y / spacing) % 2 === 1)
        ? [{ x: width - 1, y }, { x: 0, y }]
        : [{ x: 0, y }, { x: width - 1, y }]);
    }
  } else {
    for (let x = 0; x < width; x += spacing) {
      lines.push(zigzag && ((x / spacing) % 2 === 1)
        ? [{ x, y: height - 1 }, { x, y: 0 }]
        : [{ x, y: 0 }, { x, y: height - 1 }]);
    }
  }

  return { lines, bounds: lineBounds(lines) };
}
