import { Sampling } from '../index.js';
import { seededRandom } from './utils.js';
import { mergeClosePoints } from './merge.js';

export class StippleEngine {
  constructor() {
    this.points = [];
  }

  generate(analysis, params) {
    if (!analysis) return [];
    const { width, height } = analysis;
    const rng = seededRandom(params.seedStipple);

    const basePoints = Sampling.poissonDisk(width, height, params.minDistance, 30, rng);
    const accepted = [];
    const densityScale = params.densityScale;

    for (const point of basePoints) {
      const sample = sampleFields(analysis, point.x, point.y);
      const toneValue = 1 - sample.tone;
      const toneDensity = Math.pow(toneValue, params.gamma);
      const edgeDensity = Math.pow(sample.edgeInfluence, params.edgeExponent);
      const combined = Math.min(1, toneDensity + params.edgeWeight * edgeDensity);
      const threshold = Math.min(1, combined * densityScale);
      if (rng() < threshold) {
        accepted.push({
          x: point.x,
          y: point.y,
          tone: sample.tone,
          edge: sample.edge,
          edgeInfluence: sample.edgeInfluence,
          clusterSize: 1
        });
      }
    }

    this.points = mergeClosePoints(accepted, params.minDistance);
    return this.points;
  }
}

function sampleFields(analysis, x, y) {
  const { width, height, tone, edgeMagnitude, edgeInfluence } = analysis;
  const ix = Math.min(width - 1, Math.max(0, Math.floor(x)));
  const iy = Math.min(height - 1, Math.max(0, Math.floor(y)));
  const idx = iy * width + ix;
  return {
    tone: tone[idx],
    edge: edgeMagnitude[idx],
    edgeInfluence: edgeInfluence[idx]
  };
}
