/**
 * pyjs-lite — Demo / Example Usage
 *
 * Run with: node examples/demo.js
 */

import { compile, run } from '../src/index.js';

// ─── Example 1: Basic print & variables ────────────────────────
console.log('═══ Example 1: Variables & Print ═══');
const ex1 = `
name = "World"
greeting = f"Hello {name}!"
print(greeting)
`;

const result1 = run(ex1);
console.log('Output:', result1.output.join('\n'));
console.log('JS:\n', result1.js);

// ─── Example 2: For loop with range ────────────────────────────
console.log('\n═══ Example 2: For Loop ═══');
const ex2 = `
total = 0
for i in range(1, 6):
    total = total + i
    print(f"i={i}, total={total}")
print(f"Final total: {total}")
`;

const result2 = run(ex2);
console.log('Output:');
result2.output.forEach(line => console.log('  ', line));

// ─── Example 3: Conditionals ──────────────────────────────────
console.log('\n═══ Example 3: Conditionals ═══');
const ex3 = `
x = 42
if x > 100:
    print("big")
elif x > 10:
    print("medium")
else:
    print("small")
`;

const result3 = run(ex3);
console.log('Output:', result3.output.join('\n'));

// ─── Example 4: Functions ─────────────────────────────────────
console.log('\n═══ Example 4: Functions ═══');
const ex4 = `
def add(a, b):
    return a + b

result = add(3, 4)
print(f"3 + 4 = {result}")
`;

const result4 = run(ex4);
console.log('Output:', result4.output.join('\n'));

// ─── Example 5: While loop ───────────────────────────────────
console.log('\n═══ Example 5: While Loop ═══');
const ex5 = `
count = 0
while count < 5:
    print(count)
    count = count + 1
`;

const result5 = run(ex5);
console.log('Output:', result5.output.join(', '));

// ─── Example 6: Lists / Arrays ───────────────────────────────
console.log('\n═══ Example 6: Lists ═══');
const ex6 = `
fruits = ["apple", "banana", "cherry"]
fruits.append("date")
print(f"Count: {len(fruits)}")
for i in range(len(fruits)):
    print(fruits[i])
`;

const result6 = run(ex6);
console.log('Output:');
result6.output.forEach(line => console.log('  ', line));

// ─── Example 7: Compile only (inspect output) ────────────────
console.log('\n═══ Example 7: Compile Only ═══');
const ex7 = `
# FizzBuzz in Python-like syntax
for i in range(1, 16):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
`;

console.log('Transpiled JS:');
console.log(compile(ex7));
console.log('\nExecution:');
const result7 = run(ex7);
result7.output.forEach(line => console.log('  ', line));
