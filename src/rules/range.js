/**
 * Rule: range
 *
 * Transforms Python-style `for x in range(...)` loops into
 * JavaScript `for` loops.
 *
 * Supported forms:
 *   for i in range(n)           → for (let i = 0; i < n; i++)
 *   for i in range(start, end)  → for (let i = start; i < end; i++)
 *   for i in range(start, end, step) → for (let i = start; i < end; i += step)
 */

export default {
  name: 'range',
  description: 'for x in range(...) → JS for loop',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    // Pattern: for <var> in range(<args>)
    const rangePattern =
      /\bfor\s+(\w+)\s+in\s+range\s*\(\s*([^)]+)\s*\)/g;

    return code.replace(rangePattern, (match, variable, argsStr) => {
      const args = argsStr.split(',').map(a => a.trim());

      let start, end, step;

      if (args.length === 1) {
        // range(n) → 0 to n
        start = '0';
        end = args[0];
        step = null;
      } else if (args.length === 2) {
        // range(start, end)
        start = args[0];
        end = args[1];
        step = null;
      } else if (args.length === 3) {
        // range(start, end, step)
        start = args[0];
        end = args[1];
        step = args[2];
      } else {
        // Unsupported arity — return unchanged
        return match;
      }

      const increment = step
        ? `${variable} += ${step}`
        : `${variable}++`;

      return `for (let ${variable} = ${start}; ${variable} < ${end}; ${increment})`;
    });
  }
};
