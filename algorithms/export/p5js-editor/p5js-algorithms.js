/**
 * @fileoverview p5.js Editor Loader for Algorithms
 *
 * Drop this file into the p5.js editor as an additional file and call
 * `loadP5JSAlgorithms()` from your sketch to attach the algorithms library
 * to `globalThis.P5JSAlgorithms`.
 */

const DEFAULT_ALGO_URL =
  'https://cdn.jsdelivr.net/gh/USER/REPO@main/algorithms/index.js';

export async function loadP5JSAlgorithms(url = DEFAULT_ALGO_URL) {
  const module = await import(url);
  globalThis.P5JSAlgorithms = module;
  return module;
}

if (typeof globalThis !== 'undefined') {
  globalThis.loadP5JSAlgorithms = loadP5JSAlgorithms;
}
