export function clipPoint(x, y, width, height) {
  return {
    x: Math.max(0, Math.min(width - 1, x)),
    y: Math.max(0, Math.min(height - 1, y))
  };
}

export function lineBounds(lines) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const line of lines) {
    for (const p of line) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

export function seededRandom(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function pathLength(line) {
  let len = 0;
  for (let i = 1; i < line.length; i++) {
    const dx = line[i].x - line[i - 1].x;
    const dy = line[i].y - line[i - 1].y;
    len += Math.hypot(dx, dy);
  }
  return len;
}
