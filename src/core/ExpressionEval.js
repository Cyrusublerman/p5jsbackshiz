/**
 * ExpressionEval — evaluate simple math expressions for parameter values.
 * Expressions start with '=' and have access to: seed, frame, frameCount, PI, sin, cos, abs, random.
 */
export class ExpressionEval {
  /**
   * Evaluate an expression string.
   * @param {string} expr — expression without the leading '='
   * @param {object} vars — { seed, frame, frameCount }
   * @returns {number|null} — result or null if invalid
   */
  static evaluate(expr, vars = {}) {
    try {
      const fn = new Function(
        'seed', 'frame', 'frameCount', 'PI', 'sin', 'cos', 'abs', 'floor', 'ceil', 'random', 'min', 'max', 'pow',
        `"use strict"; return (${expr});`
      );
      const result = fn(
        vars.seed || 0,
        vars.frame || 0,
        vars.frameCount || 1,
        Math.PI,
        Math.sin, Math.cos, Math.abs, Math.floor, Math.ceil, Math.random,
        Math.min, Math.max, Math.pow
      );
      return typeof result === 'number' && isFinite(result) ? result : null;
    } catch (e) {
      return null;
    }
  }

  /** Check if a string is an expression (starts with '='). */
  static isExpression(str) {
    return typeof str === 'string' && str.startsWith('=');
  }
}
