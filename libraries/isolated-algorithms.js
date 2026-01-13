/**
 * @fileoverview Isolated Algorithms Bundle Entry
 *
 * Single-file entry that exposes the full algorithms library as:
 * - ES module default export
 * - Named export (Algorithms)
 * - Browser global (globalThis.P5JSAlgorithms)
 *
 * This is intended for future bundling or direct module use in the p5.js editor
 * or CodePen without requiring a multi-file import tree, including stippling
 * and TSP art workflows.
 */

import * as Algorithms from '../algorithms/index.js';

export { Algorithms };
export default Algorithms;

if (typeof globalThis !== 'undefined') {
  globalThis.P5JSAlgorithms = Algorithms;
}
