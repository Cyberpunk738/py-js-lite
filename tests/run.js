/**
 * pyjs-lite — Test Suite
 *
 * A lightweight test runner — no dependencies required.
 * Run with: node tests/run.js
 */

import { compile, run } from '../src/index.js';

let passed = 0;
let failed = 0;
const failures = [];

/**
 * Assert helper
 */
function assert(testName, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push({ testName, actual, expected });
    console.log(`  ✗ ${testName}`);
    console.log(`    Expected: ${JSON.stringify(expected)}`);
    console.log(`    Actual:   ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(testName, haystack, needle) {
  if (haystack.includes(needle)) {
    passed++;
    console.log(`  ✓ ${testName}`);
  } else {
    failed++;
    failures.push({ testName, actual: haystack, expected: `includes "${needle}"` });
    console.log(`  ✗ ${testName}`);
    console.log(`    Expected to include: ${JSON.stringify(needle)}`);
    console.log(`    Actual: ${JSON.stringify(haystack)}`);
  }
}

// ── Test Group: print ──────────────────────────────────────────
console.log('\n🔧 print rule');
{
  const { output } = run('print("hello")');
  assert('print("hello") outputs hello', output[0], 'hello');
}
{
  const { output } = run('print(1 + 2)');
  assert('print(1 + 2) outputs 3', output[0], '3');
}

// ── Test Group: range ──────────────────────────────────────────
console.log('\n🔧 range rule');
{
  const { output } = run(`
for i in range(3):
    print(i)
`);
  assert('range(3) → 0,1,2', output.join(','), '0,1,2');
}
{
  const { output } = run(`
for i in range(2, 5):
    print(i)
`);
  assert('range(2,5) → 2,3,4', output.join(','), '2,3,4');
}
{
  const { output } = run(`
for i in range(0, 10, 3):
    print(i)
`);
  assert('range(0,10,3) → 0,3,6,9', output.join(','), '0,3,6,9');
}

// ── Test Group: conditionals ───────────────────────────────────
console.log('\n🔧 conditionals rule');
{
  const { output } = run(`
x = 5
if x > 3:
    print("yes")
else:
    print("no")
`);
  assert('if/else basic', output[0], 'yes');
}
{
  const { output } = run(`
x = 50
if x > 100:
    print("big")
elif x > 10:
    print("medium")
else:
    print("small")
`);
  assert('elif chain', output[0], 'medium');
}
{
  const js = compile('a = True and False');
  assertIncludes('True → true', js, 'true');
  assertIncludes('and → &&', js, '&&');
  assertIncludes('False → false', js, 'false');
}
{
  const js = compile('b = None');
  assertIncludes('None → null', js, 'null');
}

// ── Test Group: variables ──────────────────────────────────────
console.log('\n🔧 variables rule');
{
  const js = compile('x = 10');
  assertIncludes('first assignment gets let', js, 'let x = 10');
}
{
  const js = compile(`
x = 10
x = 20
`);
  // Should only have ONE `let`
  const letCount = (js.match(/\blet\b/g) || []).length;
  assert('re-assignment has no let', letCount, 1);
}

// ── Test Group: functions ──────────────────────────────────────
console.log('\n🔧 functions rule');
{
  const { output } = run(`
def greet(name):
    print(f"Hello {name}")

greet("Alice")
`);
  assert('def → function works', output[0], 'Hello Alice');
}
{
  const { output } = run(`
def add(a, b):
    return a + b

print(add(2, 3))
`);
  assert('def with return', output[0], '5');
}

// ── Test Group: strings ────────────────────────────────────────
console.log('\n🔧 strings rule');
{
  const js = compile('msg = f"Hi {name}"');
  assertIncludes('f-string → template literal', js, '`Hi ${name}`');
}

// ── Test Group: lists ──────────────────────────────────────────
console.log('\n🔧 lists rule');
{
  const js = compile('arr.append(1)');
  assertIncludes('append → push', js, '.push(1)');
}
{
  const js = compile('x = len(arr)');
  assertIncludes('len(arr) → arr.length', js, 'arr.length');
}

// ── Test Group: while ──────────────────────────────────────────
console.log('\n🔧 while rule');
{
  const { output } = run(`
i = 0
while i < 3:
    print(i)
    i = i + 1
`);
  assert('while loop', output.join(','), '0,1,2');
}

// ── Test Group: comments ───────────────────────────────────────
console.log('\n🔧 comments rule');
{
  const js = compile('# this is a comment');
  assertIncludes('# → //', js, '// this is a comment');
}

// ── Test Group: nested blocks ──────────────────────────────────
console.log('\n🔧 nested blocks');
{
  const { output } = run(`
for i in range(3):
    for j in range(2):
        print(f"{i}-{j}")
`);
  assert('nested loop count', output.length, 6);
  assert('nested loop first', output[0], '0-0');
  assert('nested loop last', output[5], '2-1');
}

// ── Test Group: FizzBuzz (integration) ─────────────────────────
console.log('\n🔧 FizzBuzz integration');
{
  const { output } = run(`
for i in range(1, 16):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`);
  assert('FizzBuzz length', output.length, 15);
  assert('FizzBuzz[0] = 1', output[0], '1');
  assert('FizzBuzz[2] = Fizz', output[2], 'Fizz');
  assert('FizzBuzz[4] = Buzz', output[4], 'Buzz');
  assert('FizzBuzz[14] = FizzBuzz', output[14], 'FizzBuzz');
}

// ── Summary ────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('\nFailed tests:');
  failures.forEach(f => {
    console.log(`  • ${f.testName}`);
  });
  process.exit(1);
} else {
  console.log('All tests passed! 🎉');
}
