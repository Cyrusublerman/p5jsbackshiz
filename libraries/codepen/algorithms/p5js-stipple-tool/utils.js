export const GEOMETRY_EPSILON = 1e-6;

export function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function scaleField(field, scale) {
  const result = new Float32Array(field.length);
  for (let i = 0; i < field.length; i++) {
    result[i] = field[i] * scale;
  }
  return result;
}

export function blurField(field, width, height, radius) {
  if (radius <= 0) return field.slice();
  const temp = new Float32Array(field.length);
  const output = new Float32Array(field.length);
  const window = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) {
      const cx = Math.min(width - 1, Math.max(0, x));
      sum += field[y * width + cx];
    }
    for (let x = 0; x < width; x++) {
      temp[y * width + x] = sum / window;
      const removeX = Math.max(0, x - radius);
      const addX = Math.min(width - 1, x + radius + 1);
      sum += field[y * width + addX] - field[y * width + removeX];
    }
  }

  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) {
      const cy = Math.min(height - 1, Math.max(0, y));
      sum += temp[cy * width + x];
    }
    for (let y = 0; y < height; y++) {
      output[y * width + x] = sum / window;
      const removeY = Math.max(0, y - radius);
      const addY = Math.min(height - 1, y + radius + 1);
      sum += temp[addY * width + x] - temp[removeY * width + x];
    }
  }

  return output;
}

export function vector(a, b) {
  return { x: b.x - a.x, y: b.y - a.y };
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function orientation(a, b, c) {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (Math.abs(value) < GEOMETRY_EPSILON) return 0;
  return value > 0 ? 1 : 2;
}

export function onSegment(a, b, c) {
  return (
    b.x <= Math.max(a.x, c.x) + GEOMETRY_EPSILON &&
    b.x + GEOMETRY_EPSILON >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) + GEOMETRY_EPSILON &&
    b.y + GEOMETRY_EPSILON >= Math.min(a.y, c.y)
  );
}

export function segmentsIntersectStrict(p1, p2, p3, p4) {
  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

export function findTopLeftIndex(points) {
  let idx = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].y < points[idx].y - GEOMETRY_EPSILON) {
      idx = i;
    } else if (
      Math.abs(points[i].y - points[idx].y) < GEOMETRY_EPSILON &&
      points[i].x < points[idx].x
    ) {
      idx = i;
    }
  }
  return idx;
}
