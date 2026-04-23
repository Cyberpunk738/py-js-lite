/**
 * Rule: lists
 *
 * Transforms common Python list/array methods into JS equivalents.
 *
 *   .append(x)  → .push(x)
 *   len(x)      → x.length
 *   .pop()      → .pop()       (same — no change needed)
 */

export default {
  name: 'lists',
  description: 'Python list methods → JS array methods',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    let result = code;

    // .append(x) → .push(x)
    result = result.replace(/\.append\s*\(/g, '.push(');

    // len(x) → x.length
    // Match `len(identifier)` and `len(expr)` for simple cases
    result = result.replace(
      /\blen\s*\(\s*([a-zA-Z_]\w*)\s*\)/g,
      '$1.length'
    );

    // str(x) → String(x)
    result = result.replace(/\bstr\s*\(/g, 'String(');

    // int(x) → parseInt(x)
    result = result.replace(/\bint\s*\(/g, 'parseInt(');

    // float(x) → parseFloat(x)
    result = result.replace(/\bfloat\s*\(/g, 'parseFloat(');

    // input(x) → prompt(x)
    result = result.replace(/\binput\s*\(/g, 'prompt(');

    return result;
  }
};
