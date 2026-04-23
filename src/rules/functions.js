/**
 * Rule: functions
 *
 * Transforms Python-style function definitions into JavaScript.
 *
 *   def greet(name):  →  function greet(name)
 *   def add(a, b):    →  function add(a, b)
 *   return x          →  return x  (unchanged — valid in both)
 */

export default {
  name: 'functions',
  description: 'def func(...): → function func(...)',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    // `def name(args):` → `function name(args)`
    // The trailing colon is handled by the indent-to-blocks step
    return code.replace(
      /\bdef\s+(\w+)\s*\(([^)]*)\)/g,
      'function $1($2)'
    );
  }
};
