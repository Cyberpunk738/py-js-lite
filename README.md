# pyjs-lite

> Write Python. Run JavaScript.

A lightweight Python-to-JavaScript transpiler that uses **regex-based transformations** to convert Python-like syntax into executable JavaScript. No AST, no heavy parsers — just clean, modular regex rules.

---

## ✨ Features

| Python Syntax | JavaScript Output |
|---|---|
| `print("hello")` | `console.log("hello")` |
| `for i in range(10):` | `for (let i = 0; i < 10; i++)` |
| `if x > 5:` / `elif` / `else:` | `if (x > 5)` / `else if` / `else` |
| `def greet(name):` | `function greet(name)` |
| `f"Hello {name}"` | `` `Hello ${name}` `` |
| `True` / `False` / `None` | `true` / `false` / `null` |
| `and` / `or` / `not` | `&&` / `\|\|` / `!` |
| `.append(x)` | `.push(x)` |
| `len(arr)` | `arr.length` |
| Indentation blocks | `{ }` curly braces |
| `# comment` | `// comment` |
| `x = 10` (first use) | `let x = 10` |

---

## 📁 Project Structure

```
pyjs-lite/
├── src/
│   ├── index.js          # Entry point — compile() & run()
│   ├── transform.js      # Transformation pipeline
│   ├── rules/
│   │   ├── print.js      # print() → console.log()
│   │   ├── range.js      # for-in-range → for loop
│   │   ├── conditionals.js # elif, and, or, True, etc.
│   │   ├── ifelse.js     # Wrap conditions in parens
│   │   ├── variables.js  # Auto-insert let declarations
│   │   ├── functions.js  # def → function
│   │   ├── strings.js    # f-strings → template literals
│   │   ├── lists.js      # append, len, str, int, float
│   │   ├── while.js      # while loop conversion
│   │   └── comments.js   # # → //
│   └── utils/
│       └── indent.js     # Indentation → curly braces
├── playground/
│   ├── index.html        # Browser playground
│   ├── style.css         # Playground styles
│   └── app.js            # Playground logic
├── examples/
│   └── demo.js           # Example usage
├── tests/
│   └── run.js            # Test suite
└── package.json
```

---

## 🚀 Quick Start

### As a Library

```javascript
import { compile, run } from './src/index.js';

// Compile only
const js = compile(`
for i in range(5):
    print(i)
`);
console.log(js);

// Compile and execute
const result = run(`
name = "Alice"
print(f"Hello {name}!")
`);
console.log(result.output); // ["Hello Alice!"]
```

### Run Examples

```bash
node examples/demo.js
```

### Run Tests

```bash
node tests/run.js
```

### Browser Playground

```bash
npx -y serve playground -l 3000
# Open http://localhost:3000
```

---

## 🏗️ Architecture

### Pipeline Order

The transformation pipeline runs in a carefully ordered sequence:

1. **Comments** — `#` → `//` (first, to avoid interference)
2. **Strings** — f-strings → template literals
3. **Functions** — `def` → `function`
4. **Range** — `for x in range(...)` → JS for loop
5. **While** — `while cond:` → `while (cond)`
6. **Conditionals** — `elif` → `else if`, `True` → `true`, etc.
7. **If/Else** — Wrap conditions in parentheses
8. **Lists** — `.append()` → `.push()`, `len()` → `.length`
9. **Print** — `print()` → `console.log()`
10. **Indent → Blocks** — Python whitespace → `{ }` braces
11. **Variables** — Auto-insert `let` for first assignments

### Adding Custom Rules

```javascript
import { compile } from './src/index.js';

const myRule = {
  name: 'custom',
  transform(code) {
    return code.replace(/\bmy_func\b/g, 'customFunction');
  }
};

const js = compile(pyCode, { extraRules: [myRule] });
```

---

## 🧪 Test Results

```
✓ 28/28 tests passing
```

Covers: print, range (1/2/3 args), conditionals, variables, functions, f-strings, lists, while, comments, nested blocks, and FizzBuzz integration.

---

## 📄 License

MIT
#
