/**
 * @fileoverview p5.js Editor Loader for Algorithms
 *
 * Drop this file into the p5.js editor as an additional file. It imports
 * the full algorithms library from the local `algorithms/` folder and
 * exposes it as `globalThis.P5JSAlgorithms`.
 */

import * as P5JSAlgorithms from './algorithms/index.js';

if (typeof globalThis !== 'undefined') {
  globalThis.P5JSAlgorithms = P5JSAlgorithms;
}
