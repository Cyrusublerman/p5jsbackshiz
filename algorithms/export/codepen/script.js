const DEFAULT_ALGO_URL =
  'https://cdn.jsdelivr.net/gh/USER/REPO@main/algorithms/index.js';

async function loadP5JSAlgorithms(url = DEFAULT_ALGO_URL) {
  const module = await import(url);
  window.P5JSAlgorithms = module;
  return module;
}

async function setup() {
  createCanvas(400, 400);
  background(240);

  const algorithms = await loadP5JSAlgorithms();
  console.log('Algorithms loaded:', algorithms);

  if (algorithms?.Noise?.simplex2D) {
    const value = algorithms.Noise.simplex2D(0.1, 0.2);
    text(`simplex2D: ${value.toFixed(3)}`, 20, 40);
  } else {
    text('Algorithms loaded.', 20, 40);
  }
}
