/**
 * Rule: conditionals
 *
 * Transforms Python conditional keywords into JavaScript equivalents.
 *
 *   elif       → else if
 *   and        → &&
 *   or         → ||
 *   not        → !
 *   True/False → true/false
 *   None       → null
 *   ==         (kept as ===)
 *   !=         (kept as !==)
 */

export default {
  name: 'conditionals',
  description: 'Python conditionals → JS conditionals',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    let result = code;

    // `elif` → `else if` (must come before general keyword transforms)
    result = result.replace(/\belif\b/g, 'else if');

    // Boolean operators
    result = result.replace(/\band\b/g, '&&');
    result = result.replace(/\bor\b/g, '||');

    // `not` → `!` (but not `not in`, `is not`)
    result = result.replace(/\bnot\s+(?!in\b)/g, '!');

    // Boolean & null literals
    result = result.replace(/\bTrue\b/g, 'true');
    result = result.replace(/\bFalse\b/g, 'false');
    result = result.replace(/\bNone\b/g, 'null');

    // Python `==` → JS `===` (strict equality)
    // Careful: don't transform `===` that already exists
    result = result.replace(/(?<!=)==(?!=)/g, '===');

    // Python `!=` → JS `!==`
    result = result.replace(/!=(?!=)/g, '!==');

    return result;
  }
};
