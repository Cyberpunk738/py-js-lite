/**
 * Rule: variables
 *
 * Transforms Python-style bare variable assignments into
 * JavaScript `let` declarations.
 *
 * Strategy:
 *  - Track which variable names have been declared.
 *  - First assignment  → `let x = ...`
 *  - Re-assignment     → `x = ...` (unchanged)
 *
 * Skips lines that are already JS-declared (let/const/var),
 * control flow, function definitions, or comments.
 */

export default {
  name: 'variables',
  description: 'Auto-insert `let` for first assignment',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    const lines = code.split('\n');
    const declared = new Set();
    const result = [];

    // Patterns to skip (these lines shouldn't get `let` injected)
    const skipPatterns = [
      /^\s*(let|const|var)\s/,       // Already declared
      /^\s*(if|else|for|while|return|\/\/|\/\*|}\s*else)/,  // Control flow / comments
      /^\s*(function|class|import|export)\b/,                // JS keywords
      /^\s*console\./,               // console calls
      /^\s*$/,                       // Blank lines
      /^\s*[{}]/,                    // Brace-only lines
    ];

    for (const line of lines) {
      const trimmed = line.trim();

      // Check if this line should be skipped
      const shouldSkip = skipPatterns.some(p => p.test(trimmed));

      if (!shouldSkip) {
        // Match: variableName = value (simple assignment)
        const assignMatch = trimmed.match(
          /^([a-zA-Z_]\w*)\s*=\s*(.+)$/
        );

        if (assignMatch) {
          const [, varName, value] = assignMatch;

          // Avoid catching comparison operators or augmented assignment
          // that look like assignments (e.g., `x === 5`, `x += 1`)
          const isComparison = /^[=!<>]/.test(value);
          const isAugmented = /^([+\-*/%]|<<|>>|&|\||\^)=/.test(
            trimmed.slice(varName.length).trim()
          );

          if (!isComparison && !isAugmented && !declared.has(varName)) {
            declared.add(varName);
            const indent = line.match(/^(\s*)/)[1];
            result.push(`${indent}let ${varName} = ${value}`);
            continue;
          }
        }
      }

      result.push(line);
    }

    return result.join('\n');
  }
};
