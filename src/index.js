/**
 * pyjs-lite — Entry Point
 *
 * A lightweight Python-to-JavaScript transpiler that uses
 * regex-based transformations to convert Python-like syntax
 * into executable JavaScript.
 *
 * Usage:
 *   import { compile, run } from 'pyjs-lite';
 *
 *   const js = compile(`
 *     for i in range(5):
 *       print(i)
 *   `);
 *
 *   run(js); // Executes the transpiled code
 *
 * @module pyjs-lite
 */

import { transform, getRuleNames, defaultRules } from './transform.js';

/**
 * Compile Python-like source code into a JavaScript string.
 *
 * @param {string} pyCode  - Python-like source
 * @param {Object} [options] - Transform options
 * @returns {string} Executable JavaScript source
 */
export function compile(pyCode, options = {}) {
  return transform(pyCode, options);
}

/**
 * Compile and execute Python-like source code.
 *
 * Uses `new Function()` for safe-ish execution (no direct eval).
 * Captures console.log output and returns it.
 *
 * @param {string} pyCode  - Python-like source
 * @param {Object} [options]
 * @param {Object} [options.transformOptions] - Options for the transform step
 * @param {Object} [options.context]          - Variables to inject into scope
 * @returns {{ output: string[], result: any, js: string }}
 */
export function run(pyCode, options = {}) {
  const { transformOptions = {}, context = {} } = options;

  // Step 1: Transpile
  const js = compile(pyCode, transformOptions);

  // Step 2: Capture console.log output
  const output = [];
  const mockConsole = {
    log: (...args) => {
      output.push(args.map(String).join(' '));
    },
  };

  // Step 3: Build and execute the function
  // We inject `console` as a parameter so we can capture output
  const contextKeys = Object.keys(context);
  const contextValues = Object.values(context);

  try {
    const fn = new Function(
      'console',
      ...contextKeys,
      js
    );
    const result = fn(mockConsole, ...contextValues);

    return { output, result, js, error: null };
  } catch (error) {
    return {
      output,
      result: undefined,
      js,
      error: {
        message: error.message,
        stack: error.stack,
      },
    };
  }
}

// Re-export utilities for advanced usage
export { transform, getRuleNames, defaultRules };
