/**
 * pyjs-lite — Playground Application Script
 *
 * Wires up the CodeMirror editors, transpile/run buttons,
 * examples dropdown, and output tabs. All transformation
 * logic is inlined here (browser-compatible, no build step).
 */

// ═══════════════════════════════════════════════════════
// Inline the pyjs-lite transpiler (browser-compatible)
// ═══════════════════════════════════════════════════════

// ── Indentation Utility ────────────────────────────────
function getIndentLevel(line) {
  const match = line.match(/^(\s*)/);
  if (!match) return 0;
  return match[1].replace(/\t/g, '    ').length;
}

function indentToBlocks(code) {
  const lines = code.split('\n');
  const result = [];
  const indentStack = [0];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { result.push(''); continue; }

    const currentIndent = getIndentLevel(line);
    const previousIndent = indentStack[indentStack.length - 1];

    if (currentIndent < previousIndent) {
      while (indentStack.length > 1 && indentStack[indentStack.length - 1] > currentIndent) {
        indentStack.pop();
        result.push('  '.repeat(indentStack.length - 1) + '}');
      }
    }

    if (currentIndent > previousIndent) {
      indentStack.push(currentIndent);
      for (let j = result.length - 1; j >= 0; j--) {
        if (result[j].trim() !== '') {
          result[j] = result[j].replace(/:\s*$/, '');
          result[j] += ' {';
          break;
        }
      }
    }

    const cleanLine = trimmed.replace(/:\s*$/, (match) => {
      const blockPattern = /^(if|else if|elif|else|for|while|def|class)\b/;
      if (blockPattern.test(trimmed)) return '';
      return match;
    });

    result.push('  '.repeat(indentStack.length - 1) + cleanLine);
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    result.push('  '.repeat(indentStack.length - 1) + '}');
  }

  return result.join('\n');
}

// ── Rules ──────────────────────────────────────────────
const rules = [
  // Comments: # → //
  { name: 'comments', transform: c => c.replace(/^(\s*)#\s?(.*)$/gm, '$1// $2') },

  // F-strings: f"..." → template literals
  {
    name: 'strings', transform: c => c.replace(
      /\bf(["'])((?:[^"'\\]|\\.)*)(\1)/g,
      (_, q, content) => '`' + content.replace(/\{([^}]+)\}/g, '${$1}') + '`'
    )
  },

  // Functions: def → function
  { name: 'functions', transform: c => c.replace(/\bdef\s+(\w+)\s*\(([^)]*)\)/g, 'function $1($2)') },

  // Range: for x in range(...)
  {
    name: 'range', transform: c => c.replace(
      /\bfor\s+(\w+)\s+in\s+range\s*\(\s*([^)]+)\s*\)/g,
      (match, v, argsStr) => {
        const args = argsStr.split(',').map(a => a.trim());
        let s, e, st;
        if (args.length === 1) { s = '0'; e = args[0]; st = null; }
        else if (args.length === 2) { s = args[0]; e = args[1]; st = null; }
        else if (args.length === 3) { s = args[0]; e = args[1]; st = args[2]; }
        else return match;
        const inc = st ? `${v} += ${st}` : `${v}++`;
        return `for (let ${v} = ${s}; ${v} < ${e}; ${inc})`;
      }
    )
  },

  // While: while cond: → while (cond)
  {
    name: 'while', transform: c => c.replace(
      /\bwhile\s+(.+?):\s*$/gm,
      (_, cond) => {
        const t = cond.trim();
        return t.startsWith('(') && t.endsWith(')') ? `while ${t}` : `while (${t})`;
      }
    )
  },

  // Conditionals: elif → else if, True → true, etc.
  {
    name: 'conditionals', transform: c => {
      let r = c;
      r = r.replace(/\belif\b/g, 'else if');
      r = r.replace(/\band\b/g, '&&');
      r = r.replace(/\bor\b/g, '||');
      r = r.replace(/\bnot\s+(?!in\b)/g, '!');
      r = r.replace(/\bTrue\b/g, 'true');
      r = r.replace(/\bFalse\b/g, 'false');
      r = r.replace(/\bNone\b/g, 'null');
      r = r.replace(/(?<!=)==(?!=)/g, '===');
      r = r.replace(/!=(?!=)/g, '!==');
      return r;
    }
  },

  // If/Else: wrap conditions in parens
  {
    name: 'ifelse', transform: c => {
      let r = c;
      r = r.replace(/\bif\s+(.+?):\s*$/gm, (_, cond) => {
        const t = cond.trim();
        return t.startsWith('(') && t.endsWith(')') ? `if ${t}` : `if (${t})`;
      });
      r = r.replace(/\belse\s+if\s+(.+?):\s*$/gm, (_, cond) => {
        const t = cond.trim();
        return t.startsWith('(') && t.endsWith(')') ? `else if ${t}` : `else if (${t})`;
      });
      r = r.replace(/\belse\s*:\s*$/gm, 'else');
      return r;
    }
  },

  // Lists: append → push, len → .length, etc.
  {
    name: 'lists', transform: c => {
      let r = c;
      r = r.replace(/\.append\s*\(/g, '.push(');
      r = r.replace(/\blen\s*\(\s*([a-zA-Z_]\w*)\s*\)/g, '$1.length');
      r = r.replace(/\bstr\s*\(/g, 'String(');
      r = r.replace(/\bint\s*\(/g, 'parseInt(');
      r = r.replace(/\bfloat\s*\(/g, 'parseFloat(');
      r = r.replace(/\binput\s*\(/g, 'prompt(');
      return r;
    }
  },

  // Print: print() → console.log()
  { name: 'print', transform: c => c.replace(/\bprint\s*\(/g, 'console.log(') },
];

// Variables rule (runs after indent-to-blocks)
function variablesTransform(code) {
  const lines = code.split('\n');
  const declared = new Set();
  const result = [];

  const skipPatterns = [
    /^\s*(let|const|var)\s/,
    /^\s*(if|else|for|while|return|\/\/|\/\*|}\s*else)/,
    /^\s*(function|class|import|export)\b/,
    /^\s*console\./,
    /^\s*$/,
    /^\s*[{}]/,
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    const shouldSkip = skipPatterns.some(p => p.test(trimmed));

    if (!shouldSkip) {
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
      if (assignMatch) {
        const [, varName, value] = assignMatch;
        const isComparison = /^[=!<>]/.test(value);
        const isAugmented = /^([+\-*/%]|<<|>>|&|\||\^)=/.test(trimmed.slice(varName.length).trim());

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

// Full pipeline
function compile(pyCode) {
  let code = pyCode;
  for (const rule of rules) {
    code = rule.transform(code);
  }
  code = indentToBlocks(code);
  code = variablesTransform(code);
  return code;
}

function runCode(pyCode) {
  const js = compile(pyCode);
  const output = [];
  const mockConsole = {
    log: (...args) => output.push(args.map(String).join(' ')),
  };

  try {
    const fn = new Function('console', js);
    fn(mockConsole);
    return { output, js, error: null };
  } catch (error) {
    return { output, js, error: { message: error.message, stack: error.stack } };
  }
}


// ═══════════════════════════════════════════════════════
// Example Programs
// ═══════════════════════════════════════════════════════

const EXAMPLES = [
  {
    title: '👋 Hello World',
    desc: 'The classic first program',
    code: `name = "World"\ngreeting = f"Hello {name}!"\nprint(greeting)`,
  },
  {
    title: '🔢 FizzBuzz',
    desc: 'Classic interview problem — loops + conditionals',
    code: `# FizzBuzz in Python-like syntax\nfor i in range(1, 16):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)`,
  },
  {
    title: '🔁 For Loop + Range',
    desc: 'Sum numbers 1–10 with for loop',
    code: `total = 0\nfor i in range(1, 11):\n    total = total + i\n    print(f"i={i}, total={total}")\nprint(f"Final sum: {total}")`,
  },
  {
    title: '⚡ Functions',
    desc: 'Define and call functions',
    code: `def greet(name):\n    return f"Hello, {name}!"\n\ndef add(a, b):\n    return a + b\n\nmsg = greet("Alice")\nprint(msg)\n\nresult = add(17, 25)\nprint(f"17 + 25 = {result}")`,
  },
  {
    title: '🔄 While Loop',
    desc: 'Countdown using while',
    code: `count = 5\nwhile count > 0:\n    print(f"T-minus {count}...")\n    count = count - 1\nprint("🚀 Liftoff!")`,
  },
  {
    title: '📋 Lists & Arrays',
    desc: 'Array operations with append and len',
    code: `fruits = ["apple", "banana", "cherry"]\nfruits.append("date")\nfruits.append("elderberry")\nprint(f"Total fruits: {len(fruits)}")\n\nfor i in range(len(fruits)):\n    print(f"  {i + 1}. {fruits[i]}")`,
  },
  {
    title: '🌳 Nested Loops',
    desc: 'Multiplication table',
    code: `# Multiplication table (1-5)\nfor i in range(1, 6):\n    row = ""\n    for j in range(1, 6):\n        row = row + f" {i * j}"\n    print(row)`,
  },
  {
    title: '🎯 Conditionals',
    desc: 'If / elif / else with boolean logic',
    code: `score = 85\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"\n\npassed = score >= 60 and True\nprint(f"Score: {score}, Grade: {grade}")\nprint(f"Passed: {passed}")`,
  },
];


// ═══════════════════════════════════════════════════════
// DOM Wiring
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // ── Initialize CodeMirror (Input) ────────────────────
  const inputEditor = CodeMirror(document.getElementById('editor-input'), {
    value: EXAMPLES[1].code, // Default to FizzBuzz
    mode: 'python',
    theme: 'material-ocean',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    viewportMargin: Infinity,
    placeholder: '# Write your Python code here...',
  });

  // ── Initialize CodeMirror (JS Output) ───────────────
  const jsEditor = CodeMirror(document.getElementById('output-js'), {
    value: '',
    mode: 'javascript',
    theme: 'material-ocean',
    lineNumbers: true,
    readOnly: true,
    lineWrapping: true,
    viewportMargin: Infinity,
  });

  // ── DOM references ──────────────────────────────────
  const btnRun       = document.getElementById('btn-run');
  const btnTranspile = document.getElementById('btn-transpile');
  const btnClear     = document.getElementById('btn-clear');
  const btnCopy      = document.getElementById('btn-copy');
  const btnExamples  = document.getElementById('btn-examples');
  const btnCloseEx   = document.getElementById('btn-close-examples');
  const exDropdown   = document.getElementById('examples-dropdown');
  const exList       = document.getElementById('examples-list');
  const outputConsole = document.getElementById('output-console');
  const outputJs     = document.getElementById('output-js');
  const tabOutput    = document.getElementById('tab-output');
  const tabJs        = document.getElementById('tab-js');
  const toastContainer = document.getElementById('toast-container');

  // ── Toast Utility ────────────────────────────────────
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ── Tab switching ────────────────────────────────────
  function switchTab(tab) {
    if (tab === 'output') {
      tabOutput.classList.add('active');
      tabJs.classList.remove('active');
      outputConsole.style.display = 'block';
      outputJs.style.display = 'none';
    } else {
      tabJs.classList.add('active');
      tabOutput.classList.remove('active');
      outputJs.style.display = 'block';
      outputConsole.style.display = 'none';
      jsEditor.refresh();
    }
  }

  tabOutput.addEventListener('click', () => switchTab('output'));
  tabJs.addEventListener('click', () => switchTab('js'));

  // ── Render output ────────────────────────────────────
  function renderOutput(result) {
    const placeholder = document.getElementById('output-placeholder');
    if (placeholder) placeholder.remove();

    // Console output
    outputConsole.innerHTML = '';

    if (result.output.length > 0) {
      result.output.forEach(line => {
        const div = document.createElement('div');
        div.className = 'output-line output-line-log';
        div.textContent = line;
        outputConsole.appendChild(div);
      });
    }

    if (result.error) {
      const div = document.createElement('div');
      div.className = 'output-line output-line-error';
      div.textContent = `❌ ${result.error.message}`;
      outputConsole.appendChild(div);
      showToast('Execution error', 'error');
    } else {
      showToast('Executed successfully ✓');
    }

    // JS tab
    jsEditor.setValue(result.js);
  }

  // ── Run button ───────────────────────────────────────
  function handleRun() {
    const pyCode = inputEditor.getValue();
    const result = runCode(pyCode);
    renderOutput(result);
    switchTab('output');

    btnRun.classList.add('running');
    setTimeout(() => btnRun.classList.remove('running'), 800);
  }

  btnRun.addEventListener('click', handleRun);

  // ── Transpile button ─────────────────────────────────
  btnTranspile.addEventListener('click', () => {
    const pyCode = inputEditor.getValue();
    const js = compile(pyCode);
    jsEditor.setValue(js);
    switchTab('js');
    showToast('Transpiled successfully ✓');
  });

  // ── Clear ────────────────────────────────────────────
  btnClear.addEventListener('click', () => {
    inputEditor.setValue('');
    inputEditor.focus();
  });

  // ── Copy output ──────────────────────────────────────
  btnCopy.addEventListener('click', () => {
    const activeTab = tabJs.classList.contains('active') ? 'js' : 'output';
    let text;

    if (activeTab === 'js') {
      text = jsEditor.getValue();
    } else {
      text = Array.from(outputConsole.querySelectorAll('.output-line'))
        .map(el => el.textContent)
        .join('\n');
    }

    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard ✓');
      });
    }
  });

  // ── Keyboard shortcut: Ctrl+Enter ────────────────────
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  });

  // ── Examples dropdown ────────────────────────────────
  function populateExamples() {
    exList.innerHTML = '';
    EXAMPLES.forEach((ex, i) => {
      const item = document.createElement('div');
      item.className = 'example-item';
      item.innerHTML = `
        <div class="example-item-title">${ex.title}</div>
        <div class="example-item-desc">${ex.desc}</div>
      `;
      item.addEventListener('click', () => {
        inputEditor.setValue(ex.code);
        exDropdown.classList.remove('open');
        showToast(`Loaded: ${ex.title}`);
      });
      exList.appendChild(item);
    });
  }

  populateExamples();

  btnExamples.addEventListener('click', (e) => {
    e.stopPropagation();
    exDropdown.classList.toggle('open');
  });

  btnCloseEx.addEventListener('click', () => {
    exDropdown.classList.remove('open');
  });

  document.addEventListener('click', (e) => {
    if (!exDropdown.contains(e.target) && e.target !== btnExamples) {
      exDropdown.classList.remove('open');
    }
  });

  // ── Initial sizing ───────────────────────────────────
  setTimeout(() => {
    inputEditor.refresh();
    jsEditor.refresh();
  }, 100);
});
