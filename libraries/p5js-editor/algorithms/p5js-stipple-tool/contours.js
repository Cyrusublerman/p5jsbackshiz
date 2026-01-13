import { MarchingSquares } from '../index.js';

export class ContourEngine {
  constructor() {
    this.lines = [];
  }

  generate(analysis, params) {
    if (!analysis) return [];
    const { width, height, smoothed } = analysis;
    const interval = params.contourInterval;

    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < smoothed.length; i++) {
      min = Math.min(min, smoothed[i]);
      max = Math.max(max, smoothed[i]);
    }

    const lines = [];
    for (let level = min + interval; level < max; level += interval) {
      const contours = MarchingSquares.extractContours(smoothed, width, height, level, { cellSize: 1 });
      lines.push(...contours);
    }

    this.lines = lines;
    return this.lines;
  }
}
