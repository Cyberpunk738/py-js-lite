/**
 * Rule: comments
 *
 * Transforms Python-style comments into JavaScript comments.
 *
 *   # this is a comment   →  // this is a comment
 *
 * Careful not to transform hash inside strings.
 */

export default {
  name: 'comments',
  description: '# comment → // comment',

  /**
   * @param {string} code - Source code to transform
   * @returns {string} Transformed source code
   */
  transform(code) {
    return code.replace(
      /^(\s*)#\s?(.*)$/gm,
      '$1// $2'
    );
  }
};
