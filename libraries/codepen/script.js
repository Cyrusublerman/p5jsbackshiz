import * as P5JSAlgorithms from './algorithms/index.js';

window.P5JSAlgorithms = P5JSAlgorithms;

function radialDensity(x, y, width, height) {
  const cx = width * 0.5;
  const cy = height * 0.5;
  const dx = (x - cx) / cx;
  const dy = (y - cy) / cy;
  const dist = Math.min(1, Math.sqrt(dx * dx + dy * dy));
  return 1 - dist;
}

async function setup() {
  createCanvas(520, 520);
  background(248);
  stroke(20);
  noFill();

  const { Sampling, TSP } = P5JSAlgorithms;

  const points = Sampling.importanceSampling(
    300,
    width,
    height,
    (x, y) => radialDensity(x, y, width, height)
  );

  const relaxed = Sampling.lloydRelaxation(points, width, height, 2, 8);
  const nn = TSP.nearestNeighbor(relaxed);
  const optimized = TSP.twoOpt(relaxed, nn.path, 200);

  beginShape();
  optimized.path.forEach((idx) => {
    vertex(relaxed[idx].x, relaxed[idx].y);
  });
  endShape();

  console.log('Algorithms loaded:', P5JSAlgorithms);
}
