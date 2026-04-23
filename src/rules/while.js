/**
 * Rule: while
 *
 * Transforms Python-style while loops into JavaScript.
 *
 *   while condition:   →  while (condition)
 *   while True:        →  while (true)
 */

export default {
  name: 'while',
  description: 'while condition: → while (condition)',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    // Match `while <condition>:` or `while <condition>`
    // Wrap condition in parens if not already wrapped
    return code.replace(
      /\bwhile\s+(.+?):\s*$/gm,
      (match, condition) => {
        const trimmed = condition.trim();
        // Don't double-wrap if already in parens
        if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          return `while ${trimmed}`;
        }
        return `while (${trimmed})`;
      }
    );
  }
};
