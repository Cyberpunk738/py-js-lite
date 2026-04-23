/**
 * indent.js — Indentation utilities for pyjs-lite
 *
 * Handles converting Python-style indentation into JavaScript
 * curly-brace blocks. This is the heart of the structural
 * transformation pipeline.
 */

/**
 * Measure the leading whitespace of a line.
 * Treats each tab as 4 spaces for consistency.
 *
 * @param {string} line - A single source line
 * @returns {number} The indentation level (in spaces)
 */
export function getIndentLevel(line) {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  // Normalize tabs → 4 spaces
  return match[1].replace(/\t/g, '    ').length;
}

/**
 * Convert Python-style indentation blocks into JS curly braces.
 *
 * Algorithm:
 *  1. Walk every line, tracking a stack of indent levels.
 *  2. When indentation increases  → push `{` onto previous line.
 *  3. When indentation decreases  → insert `}` lines to close blocks.
 *  4. After the last line         → close any remaining open blocks.
 *
 * Lines that end with `:` have the colon stripped (it's the Python
 * block-opener; we replace it with `{`).
 *
 * @param {string} code - Multi-line source with Python indentation
 * @returns {string} Source with curly braces inserted
 */
export function indentToBlocks(code) {
  const lines = code.split('\n');
  const result = [];
  const indentStack = [0]; // Stack tracking open indent levels

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Preserve blank lines
    if (trimmed === '') {
      result.push('');
      continue;
    }

    const currentIndent = getIndentLevel(line);
    const previousIndent = indentStack[indentStack.length - 1];

    // --- Indent DECREASED → close blocks ---
    if (currentIndent < previousIndent) {
      while (
        indentStack.length > 1 &&
        indentStack[indentStack.length - 1] > currentIndent
      ) {
        indentStack.pop();
        const depth = indentStack.length - 1;
        result.push('  '.repeat(depth) + '}');
      }
    }

    // --- Indent INCREASED → open a block on the previous line ---
    if (currentIndent > previousIndent) {
      indentStack.push(currentIndent);
      // Attach `{` to the previous non-blank result line
      for (let j = result.length - 1; j >= 0; j--) {
        if (result[j].trim() !== '') {
          // Remove trailing colon if present (Python block syntax)
          result[j] = result[j].replace(/:\s*$/, '');
          result[j] += ' {';
          break;
        }
      }
    }

    // Strip trailing colon on block-opening lines that don't
    // immediately increase indent (edge-case safety)
    const cleanLine = trimmed.replace(/:\s*$/, (match, offset) => {
      // Only strip if the colon follows a block keyword pattern
      const blockPattern = /^(if|else if|elif|else|for|while|def|class)\b/;
      if (blockPattern.test(trimmed)) return '';
      return match; // Keep colons in other contexts (e.g. object literals)
    });

    const depth = indentStack.length - 1;
    result.push('  '.repeat(depth) + cleanLine);
  }

  // --- Close any remaining open blocks ---
  while (indentStack.length > 1) {
    indentStack.pop();
    const depth = indentStack.length - 1;
    result.push('  '.repeat(depth) + '}');
  }

  return result.join('\n');
}
