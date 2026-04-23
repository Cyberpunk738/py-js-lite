/**
 * Rule: ifelse
 *
 * Wraps Python `if`/`else if`/`else` conditions in parentheses
 * for valid JavaScript syntax.
 *
 *   if x > 5:         →  if (x > 5)
 *   else if x < 2:    →  else if (x < 2)
 *   else:             →  else
 */

export default {
  name: 'ifelse',
  description: 'if condition: → if (condition)',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    let result = code;

    // `if condition:` → `if (condition)`
    result = result.replace(
      /\bif\s+(.+?):\s*$/gm,
      (match, condition) => {
        const trimmed = condition.trim();
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          return `if ${trimmed}`;
        }
        return `if (${trimmed})`;
      }
    );

    // `else if condition:` → `else if (condition)`
    result = result.replace(
      /\belse\s+if\s+(.+?):\s*$/gm,
      (match, condition) => {
        const trimmed = condition.trim();
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          return `else if ${trimmed}`;
        }
        return `else if (${trimmed})`;
      }
    );

    // `else:` → `else`
    result = result.replace(/\belse\s*:\s*$/gm, 'else');

    return result;
  }
};
