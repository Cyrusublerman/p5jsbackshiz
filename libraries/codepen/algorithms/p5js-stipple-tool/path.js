import { TSP, Delaunay } from '../index.js';
import {
  GEOMETRY_EPSILON,
  seededRandom,
  distance,
  vector,
  findTopLeftIndex,
  segmentsIntersectStrict
} from './utils.js';

export class PathSolver {
  constructor() {
    this.path = [];
  }

  build(points, params) {
    if (!points.length) return [];
    const topLeftIndex = findTopLeftIndex(points);
    const candidateModes = [
      params.pathMode,
      'monotone-y',
      'delaunay',
      'nearest',
      'christofides',
      'monotone-x'
    ].filter((mode, index, list) => list.indexOf(mode) === index);

    const backbone = this.buildGuaranteedPath(points, topLeftIndex, params);

    const candidates = [];
    for (const mode of candidateModes) {
      const path = this.buildPathForMode(points, topLeftIndex, params, mode);
      if (!path) continue;
      if (!this.isPathValid(path)) continue;
      const metrics = this.computePathMetrics(path);
      candidates.push({ path, metrics, mode });
    }

    if (!candidates.length) {
      this.path = backbone;
      return this.path;
    }

    candidates.sort(this.comparePathMetrics);
    this.path = candidates[0].path;
    return this.path;
  }

  buildGuaranteedPath(points, startIndex, params) {
    return this.buildMonotonePath(points, startIndex, params, 'y', 'asc') ?? points;
  }

  buildPathForMode(points, startIndex, params, mode) {
    switch (mode) {
      case 'monotone-y':
        return this.buildMonotonePath(points, startIndex, params, 'y');
      case 'monotone-x':
        return this.buildMonotonePath(points, startIndex, params, 'x');
      case 'nearest':
        return this.buildTspPath(points, startIndex, 'nearest');
      case 'christofides':
        return this.buildTspPath(points, startIndex, 'christofides');
      case 'delaunay':
        return this.buildDelaunayPath(points, startIndex);
      default:
        return this.buildMonotonePath(points, startIndex, params, 'y');
    }
  }

  buildMonotonePath(points, startIndex, params, axis, tieDirection = 'asc') {
    const rng = seededRandom(params.seedPath);
    const decorated = points.map((pt, idx) => ({
      ...pt,
      idx,
      jitter: rng()
    }));

    const sorted = decorated.sort((a, b) => {
      const primary = axis === 'y' ? a.y - b.y : a.x - b.x;
      if (Math.abs(primary) > GEOMETRY_EPSILON) return primary;
      const secondary = axis === 'y' ? a.x - b.x : a.y - b.y;
      if (Math.abs(secondary) > GEOMETRY_EPSILON) {
        return tieDirection === 'asc' ? secondary : -secondary;
      }
      return tieDirection === 'asc' ? a.jitter - b.jitter : b.jitter - a.jitter;
    });

    if (sorted[0].idx !== startIndex && axis === 'x') {
      return null;
    }

    if (sorted[0].idx !== startIndex && axis === 'y') {
      return null;
    }

    return sorted.map((pt) => points[pt.idx]);
  }

  buildTspPath(points, startIndex, method) {
    if (points.length < 2) return [...points];
    let pathIndices;
    if (method === 'nearest') {
      pathIndices = TSP.nearestNeighbor(points, startIndex).path;
    } else {
      pathIndices = TSP.christofides(points).path;
      pathIndices = this.rotatePathToStart(pathIndices, startIndex);
    }
    return pathIndices.map((idx) => points[idx]);
  }

  buildDelaunayPath(points, startIndex) {
    if (points.length < 2) return [...points];
    const triangles = Delaunay.delaunayTriangulate(points);
    if (!triangles.length) return null;

    const adjacency = new Map();
    triangles.forEach(([a, b, c]) => {
      this.addAdjacency(adjacency, a, b);
      this.addAdjacency(adjacency, b, c);
      this.addAdjacency(adjacency, c, a);
    });

    const visited = new Set([startIndex]);
    const path = [points[startIndex]];

    while (visited.size < points.length) {
      const currentIndex = this.findPointIndex(points, path[path.length - 1]);
      const neighbors = Array.from(adjacency.get(currentIndex) || []);
      const candidates = neighbors
        .filter((idx) => !visited.has(idx))
        .map((idx) => ({ idx, dist: distance(points[currentIndex], points[idx]) }))
        .sort((a, b) => a.dist - b.dist)
        .map((entry) => entry.idx);

      const fallback = points
        .map((pt, idx) => ({ idx, pt }))
        .filter((entry) => !visited.has(entry.idx))
        .map((entry) => ({ idx: entry.idx, dist: distance(points[currentIndex], entry.pt) }))
        .sort((a, b) => a.dist - b.dist)
        .map((entry) => entry.idx);

      const nextIndex = this.pickNextIndex(path, points, [...candidates, ...fallback]);
      if (nextIndex === null) return null;
      visited.add(nextIndex);
      path.push(points[nextIndex]);
    }

    return path;
  }

  addAdjacency(map, a, b) {
    if (!map.has(a)) map.set(a, new Set());
    if (!map.has(b)) map.set(b, new Set());
    map.get(a).add(b);
    map.get(b).add(a);
  }

  pickNextIndex(path, points, candidates) {
    for (const idx of candidates) {
      const candidatePoint = points[idx];
      if (this.canAddSegment(path, candidatePoint)) {
        return idx;
      }
    }
    return null;
  }

  canAddSegment(path, nextPoint) {
    if (path.length < 2) return true;
    const newStart = path[path.length - 1];
    const newEnd = nextPoint;
    for (let i = 0; i < path.length - 2; i++) {
      const a = path[i];
      const b = path[i + 1];
      if (segmentsIntersectStrict(a, b, newStart, newEnd)) {
        return false;
      }
    }
    return true;
  }

  rotatePathToStart(pathIndices, startIndex) {
    const startPos = pathIndices.indexOf(startIndex);
    if (startPos <= 0) return pathIndices;
    return [...pathIndices.slice(startPos), ...pathIndices.slice(0, startPos)];
  }

  computePathMetrics(path) {
    if (path.length < 2) {
      return { maxSegment: 0, totalLength: 0, smoothness: 1 };
    }
    let maxSegment = 0;
    let totalLength = 0;
    let smoothSum = 0;
    let smoothCount = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const segLength = distance(path[i], path[i + 1]);
      totalLength += segLength;
      maxSegment = Math.max(maxSegment, segLength);
      if (i > 0) {
        const prev = vector(path[i - 1], path[i]);
        const next = vector(path[i], path[i + 1]);
        const denom = Math.hypot(prev.x, prev.y) * Math.hypot(next.x, next.y);
        if (denom > 0) {
          smoothSum += (prev.x * next.x + prev.y * next.y) / denom;
          smoothCount++;
        }
      }
    }
    return {
      maxSegment,
      totalLength,
      smoothness: smoothCount > 0 ? smoothSum / smoothCount : 1
    };
  }

  comparePathMetrics(a, b) {
    if (Math.abs(a.metrics.maxSegment - b.metrics.maxSegment) > 1e-6) {
      return a.metrics.maxSegment - b.metrics.maxSegment;
    }
    if (Math.abs(a.metrics.totalLength - b.metrics.totalLength) > 1e-6) {
      return a.metrics.totalLength - b.metrics.totalLength;
    }
    return b.metrics.smoothness - a.metrics.smoothness;
  }

  isPathValid(path) {
    for (let i = 0; i < path.length - 1; i++) {
      for (let j = i + 2; j < path.length - 1; j++) {
        const a = path[i];
        const b = path[i + 1];
        const c = path[j];
        const d = path[j + 1];
        if (segmentsIntersectStrict(a, b, c, d)) {
          return false;
        }
      }
    }
    return true;
  }

  findPointIndex(points, target) {
    return points.findIndex((pt) => pt === target);
  }
}
