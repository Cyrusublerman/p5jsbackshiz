import { GEOMETRY_EPSILON } from './utils.js';

export function mergeClosePoints(points, minDist) {
  let current = points;
  while (true) {
    const { merged, changed } = mergeOnce(current, minDist);
    current = merged;
    if (!changed) break;
  }
  return current;
}

function mergeOnce(points, minDist) {
  if (points.length === 0) return { merged: [], changed: false };
  const cellSize = minDist;
  const grid = new Map();

  const cellKey = (x, y) => `${x},${y}`;

  points.forEach((pt, idx) => {
    const gx = Math.floor(pt.x / cellSize);
    const gy = Math.floor(pt.y / cellSize);
    const key = cellKey(gx, gy);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(idx);
  });

  const parent = points.map((_, i) => i);
  let changed = false;

  const find = (i) => {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  };

  const unite = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) {
      parent[rb] = ra;
      changed = true;
    }
  };

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const gx = Math.floor(pt.x / cellSize);
    const gy = Math.floor(pt.y / cellSize);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = cellKey(gx + dx, gy + dy);
        const bucket = grid.get(key);
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          const other = points[j];
          const dist = Math.hypot(pt.x - other.x, pt.y - other.y);
          if (dist < minDist - GEOMETRY_EPSILON) {
            unite(i, j);
          }
        }
      }
    }
  }

  const clusters = new Map();
  points.forEach((pt, idx) => {
    const root = find(idx);
    if (!clusters.has(root)) {
      clusters.set(root, {
        x: 0,
        y: 0,
        tone: 0,
        edge: 0,
        edgeInfluence: 0,
        count: 0
      });
    }
    const cluster = clusters.get(root);
    cluster.x += pt.x;
    cluster.y += pt.y;
    cluster.tone += pt.tone;
    cluster.edge += pt.edge;
    cluster.edgeInfluence += pt.edgeInfluence;
    cluster.count += 1;
  });

  const merged = Array.from(clusters.values()).map((cluster) => ({
    x: cluster.x / cluster.count,
    y: cluster.y / cluster.count,
    tone: cluster.tone / cluster.count,
    edge: cluster.edge / cluster.count,
    edgeInfluence: cluster.edgeInfluence / cluster.count,
    clusterSize: cluster.count
  }));

  return { merged, changed };
}
