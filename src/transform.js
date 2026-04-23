/**
 * transform.js — Transformation Pipeline
 *
 * Orchestrates the full Python → JavaScript transformation by
 * running source code through a series of ordered rules and
 * the indentation-to-blocks converter.
 *
 * The pipeline order matters:
 *  1. Comments     (before anything so # doesn't interfere)
 *  2. Strings      (f-strings before other transforms)
 *  3. Functions    (def → function)
 *  4. Range loops  (for i in range → for loop)
 *  5. While loops  (while cond: → while (cond))
 *  6. Conditionals (elif → else if, True → true, etc.)
 *  7. If/Else      (wrap conditions in parens)
 *  8. Lists        (append → push, len → .length)
 *  9. Print        (print → console.log)
 * 10. Indentation  (Python whitespace → curly braces)
 * 11. Variables    (auto-insert `let` — runs LAST on JS-shaped code)
 */

import { indentToBlocks } from './utils/indent.js';

// Import all rules
import commentsRule   from './rules/comments.js';
import stringsRule    from './rules/strings.js';
import functionsRule  from './rules/functions.js';
import rangeRule      from './rules/range.js';
import whileRule      from './rules/while.js';
import conditionalsRule from './rules/conditionals.js';
import ifelseRule     from './rules/ifelse.js';
import listsRule      from './rules/lists.js';
import printRule      from './rules/print.js';
import variablesRule  from './rules/variables.js';

/**
 * The ordered rule pipeline.
 * Each rule is an object with { name, description, transform(code) }.
 */
const defaultRules = [
  commentsRule,
  stringsRule,
  functionsRule,
  rangeRule,
  whileRule,
  conditionalsRule,
  ifelseRule,
  listsRule,
  printRule,
];

/**
 * Transform Python-like source code into executable JavaScript.
 *
 * @param {string} pyCode  - Python-like source code
 * @param {Object} [options]
 * @param {Array}  [options.rules]         - Custom rules array (overrides defaults)
 * @param {Array}  [options.extraRules]    - Additional rules appended to defaults
 * @param {boolean}[options.debug]         - Log each transformation step
 * @returns {string} JavaScript source code
 */
export function transform(pyCode, options = {}) {
  const {
    rules = defaultRules,
    extraRules = [],
    debug = false,
  } = options;

  // Combine rules
  const pipeline = [...rules, ...extraRules];

  let code = pyCode;

  // --- Phase 1: Apply regex-based rule transforms ---
  for (const rule of pipeline) {
    const before = code;
    code = rule.transform(code);

    if (debug && code !== before) {
      console.log(`\n── Rule: ${rule.name} ──`);
      console.log(code);
    }
  }

  // --- Phase 2: Convert indentation → curly braces ---
  code = indentToBlocks(code);

  if (debug) {
    console.log('\n── Indent → Blocks ──');
    console.log(code);
  }

  // --- Phase 3: Auto-declare variables (runs on block-structured code) ---
  code = variablesRule.transform(code);

  if (debug) {
    console.log('\n── Variables ──');
    console.log(code);
  }

  return code;
}

/**
 * Get the list of all default rule names.
 * @returns {string[]}
 */
export function getRuleNames() {
  return [...defaultRules, variablesRule].map(r => r.name);
}

export { defaultRules };
