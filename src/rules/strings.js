/**
 * Rule: strings
 *
 * Transforms Python f-strings into JavaScript template literals.
 *
 *   f"Hello {name}"   →  `Hello ${name}`
 *   f'Value: {x + 1}' →  `Value: ${x + 1}`
 */

export default {
  name: 'strings',
  description: 'f"..." → template literals',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    // Match f"..." or f'...'
    // Replace f-string delimiters and convert {expr} → ${expr}
    return code.replace(
      /\bf(["'])((?:[^"'\\]|\\.)*)(\1)/g,
      (match, quote, content, closeQuote) => {
        // Convert Python {expr} to JS ${expr}
        const jsContent = content.replace(
          /\{([^}]+)\}/g,
          '${$1}'
        );
        return '`' + jsContent + '`';
      }
    );
  }
};
