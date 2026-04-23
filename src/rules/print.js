/**
 * Rule: print
 *
 * Transforms Python's `print(...)` into `console.log(...)`.
 * Handles multi-argument prints and nested parentheses.
 */

export default {
  name: 'print',
  description: 'print(...) → console.log(...)',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    // Match `print(` that is NOT part of a longer identifier
    // (e.g., `blueprint(` should NOT match)
    return code.replace(
      /\bprint\s*\(/g,
      'console.log('
    );
  }
};
