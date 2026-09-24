// 驗資說明頁：guide.html 的邏輯。
// 純 ESM，沒有任何外部套件；離線（file://）也要能完整運作，
// 所以 loadProblems() 一定要有寫死的備援資料。

'use strict';

/* ═══════════════════════════════════════════════
 *  題目資料：真的去 fetch problems/*.json，抓不到就用備援
 * ═══════════════════════════════════════════════ */

// 備援資料只在 fetch 失敗時使用（例如直接用 file:// 開啟這個頁面）。
// sampleInput / sampleOutput 必須和 problems/000,001,004,015.json 的內容完全一致，
// 因為下面「要讀幾次」的示範腳本是照這幾筆測資的內容手動寫的。
const FALLBACK_PROBLEMS = {
  '000': {
    id: 0,
    title: 'Hello World',
    inputFormat: '<p>沒有任何輸入。</p>',
    outputFormat: '<p>一行，輸出 hello world。</p>',
    sampleInput: '',
    sampleOutput: 'hello world'
  },
  '001': {
    id: 1,
    title: 'A+B 問題',
    inputFormat: '<p>一行，兩個整數 A 和 B，用一個半形空格分隔。</p>',
    outputFormat: '<p>一行，輸出 A + B 的值。</p>',
    sampleInput: '3 5',
    sampleOutput: '8'
  },
  '015': {
    id: 15,
    title: '清單中的最大值',
    inputFormat: '<p>第一行是正整數 N；第二行是 N 個整數，用半形空格分隔。</p>',
    outputFormat: '<p>輸出清單中的最大整數。</p>',
    sampleInput: '5\n12 35 7 89 24',
    sampleOutput: '89'
  },
  '004': {
    id: 4,
    title: '質數判斷',
    inputFormat: '<p>第一行是正整數 T（查詢數量）；接下來 T 行，每行一個正整數 N。</p>',
    outputFormat: '<p>共 T 行，是質數輸出 Yes，否則輸出 No。</p>',
    sampleInput: '5\n1\n2\n3\n4\n17',
    sampleOutput: 'No\nYes\nYes\nNo\nYes'
  }
};

const PROBLEM_IDS = ['000', '001', '015', '004'];

export async function loadProblems() {
  const results = await Promise.allSettled(
    PROBLEM_IDS.map(id => fetch(`problems/${id}.json`).then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }))
  );
  const problems = {};
  results.forEach((result, i) => {
    const id = PROBLEM_IDS[i];
    problems[id] = result.status === 'fulfilled' ? result.value : FALLBACK_PROBLEMS[id];
  });
  return problems;
}

/* ═══════════════════════════════════════════════
 *  小工具
 * ═══════════════════════════════════════════════ */

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

/* ═══════════════════════════════════════════════
 *  createFeeder：測資讀取的核心引擎
 *  ─ Scratch 的讀法照抄 assets/scratch-runner-worker.js:69-77：
 *    跳過所有空白字元，再吃到下一個空白為止。
 *  ─ Blockly（要求輸入文字＝input()）的讀法：吃到下一個 \n（含）為止。
 * ═══════════════════════════════════════════════ */

export function createFeeder(root, { input, mode }) {
  if (mode !== 'scratch' && mode !== 'blockly') {
    throw new Error('createFeeder: mode 必須是 "scratch" 或 "blockly"');
  }
  const source = String(input ?? '').replace(/\r\n?/g, '\n');

  const state = {
    position: 0,
    lastStart: 0,
    lastEnd: 0,
    hasRead: false,
    log: [],       // 每次成功讀取的紀錄 { text }
    done: false,   // 上一次 step() 是否已經讀不到東西
    error: ''
  };

  function readScratchToken() {
    // 完全比照 scratch-runner-worker.js 的 read()：
    // 先跳過所有空白字元（含換行），再吃到下一個空白字元為止。
    let p = state.position;
    while (p < source.length && /\s/.test(source[p])) p++;
    if (p >= source.length) {
      throw new Error('輸入不足：程式詢問的資料超過題目提供的輸入。');
    }
    const begin = p;
    while (p < source.length && !/\s/.test(source[p])) p++;
    const text = source.slice(begin, p);
    return { text, begin, end: p };
  }

  function readBlocklyLine() {
    // 比照 Python input()：吃到下一個 \n（含）為止，已無資料就是 EOFError。
    if (state.position >= source.length) {
      throw new Error('EOFError: EOF when reading a line');
    }
    const begin = state.position;
    const nl = source.indexOf('\n', state.position);
    const contentEnd = nl === -1 ? source.length : nl;
    const consumedEnd = nl === -1 ? source.length : nl + 1;
    const text = source.slice(begin, contentEnd);
    return { text, begin, end: consumedEnd };
  }

  function render() {
    root.innerHTML = '';

    const tape = el('div', 'feeder-tape');
    if (source.length === 0) {
      tape.appendChild(el('span', 'feeder-empty', '（這一題沒有任何測資）'));
    } else {
      const dimmed = source.slice(0, state.lastStart);
      const current = state.hasRead ? source.slice(state.lastStart, state.lastEnd) : '';
      const rest = source.slice(state.hasRead ? state.lastEnd : 0);
      if (dimmed) tape.appendChild(el('span', 'feeder-consumed', markWhitespace(dimmed)));
      if (current) tape.appendChild(el('span', 'feeder-current', markWhitespace(current)));
      if (rest) tape.appendChild(el('span', 'feeder-pending', markWhitespace(rest)));
    }
    root.appendChild(tape);

    const foot = el('div', 'feeder-foot');
    if (state.error) {
      foot.appendChild(el('p', 'feeder-error', `程式這時候會壞掉：<code>${escapeHtml(state.error)}</code>`));
    } else if (state.hasRead) {
      const got = source.slice(state.lastStart, state.lastEnd).replace(/\n$/, '');
      foot.appendChild(el('p', 'feeder-got', `程式這一步拿到：<code>「${escapeHtml(got)}」</code>`));
    } else {
      foot.appendChild(el('p', 'feeder-got', '還沒開始讀。'));
    }
    root.appendChild(foot);
  }

  // 把不可見字元標出來，讓學生看得到「這裡有一個換行」「這裡有一個空格」。
  function markWhitespace(text) {
    return escapeHtml(text)
      .replace(/\n/g, '<span class="eol">⏎</span>\n')
      .replace(/ /g, '<span class="sp"> </span>');
  }

  function step() {
    state.error = '';
    try {
      const { text, begin, end } = mode === 'scratch' ? readScratchToken() : readBlocklyLine();
      state.lastStart = begin;
      state.lastEnd = end;
      state.hasRead = true;
      state.position = end;
      state.log.push({ text });
      render();
      return { ok: true, text };
    } catch (error) {
      state.done = true;
      state.error = error.message;
      render();
      return { ok: false, error: error.message };
    }
  }

  function reset() {
    state.position = 0;
    state.lastStart = 0;
    state.lastEnd = 0;
    state.hasRead = false;
    state.log = [];
    state.done = false;
    state.error = '';
    render();
  }

  render();

  return {
    step,
    reset,
    get done() { return state.done; }
  };
}

/* ═══════════════════════════════════════════════
 *  四種題型的示範腳本（要讀幾次）
 *  ─ 每個 problem id 都有 scratch / blockly 兩份腳本。
 *  ─ kind: 'read'（透過 feeder 真的吃一段測資）
 *          'derive'（不吃測資，只是把剛才讀到的資料做加工，例如拆開一行）
 *          'print'（不吃測資，把一行輸出接到輸出區）
 *  ─ 數字都是手算好的正確答案，跟 problems/*.json 的 testCases 對得起來。
 * ═══════════════════════════════════════════════ */

function isPrimeCN(n) {
  const num = Number(n);
  if (num < 2) return 'No';
  for (let d = 2; d * d <= num; d++) if (num % d === 0) return 'No';
  return 'Yes';
}

const DEMO_SCRIPTS = {
  '000': {
    scratch: [
      { kind: 'print', label: '說出', text: () => 'hello world' }
    ],
    blockly: [
      { kind: 'print', label: '輸出答案', text: () => 'hello world' }
    ]
  },
  '001': {
    blockly: [
      { kind: 'read', label: '要求輸入文字（input()）→ 讀一整行', assign: 'raw', varLabel: '整行文字' },
      { kind: 'derive', label: '從文本製作清單，用分隔符「空格」', assign: 'parts', varLabel: '拆開後的清單',
        compute: v => v.raw.split(' ') },
      { kind: 'derive', label: '索引 0 → A', assign: 'A', varLabel: 'A（索引 0）', compute: v => v.parts[0] },
      { kind: 'derive', label: '索引 1 → B', assign: 'B', varLabel: 'B（索引 1）', compute: v => v.parts[1] },
      { kind: 'derive', label: '兩個都「轉成 整數」再相加', assign: 'sum', varLabel: 'A + B',
        compute: v => Number(v.A) + Number(v.B) },
      { kind: 'print', label: '輸出答案（然後換行）', text: v => String(v.sum) }
    ],
    scratch: [
      { kind: 'read', label: '詢問「第一個數字？」並等待 → 存進變數 A', assign: 'A', varLabel: 'A' },
      { kind: 'read', label: '詢問「第二個數字？」並等待 → 存進變數 B', assign: 'B', varLabel: 'B' },
      { kind: 'derive', label: 'A + B（運算子積木自動把文字當數字算）', assign: 'sum', varLabel: 'A + B',
        compute: v => Number(v.A) + Number(v.B) },
      { kind: 'print', label: '說出', text: v => String(v.sum) }
    ]
  },
  '015': {
    blockly: [
      { kind: 'read', label: '要求輸入文字 → 讀第一行（N）', assign: 'nLine', varLabel: 'N（文字）' },
      { kind: 'read', label: '要求輸入文字 → 讀第二行（所有數字）', assign: 'numLine', varLabel: '整行數字' },
      { kind: 'derive', label: '從文本製作清單，用分隔符「空格」', assign: 'parts', varLabel: '拆開後的清單',
        compute: v => v.numLine.split(' ') },
      { kind: 'derive', label: '逐一比較，找出最大值', assign: 'max', varLabel: '目前最大值',
        compute: v => Math.max(...v.parts.map(Number)) },
      { kind: 'print', label: '輸出答案', text: v => String(v.max) }
    ],
    scratch: [
      { kind: 'read', label: '詢問「幾個數字？」→ 存進 N', assign: 'n', varLabel: 'N' },
      { kind: 'read', label: '詢問「第 1 個數字？」→ 存進清單', assign: 'v1', varLabel: '清單第 1 筆' },
      { kind: 'read', label: '詢問「第 2 個數字？」→ 存進清單', assign: 'v2', varLabel: '清單第 2 筆' },
      { kind: 'read', label: '詢問「第 3 個數字？」→ 存進清單', assign: 'v3', varLabel: '清單第 3 筆' },
      { kind: 'read', label: '詢問「第 4 個數字？」→ 存進清單', assign: 'v4', varLabel: '清單第 4 筆' },
      { kind: 'read', label: '詢問「第 5 個數字？」→ 存進清單', assign: 'v5', varLabel: '清單第 5 筆' },
      { kind: 'derive', label: '逐一比較，找出最大值', assign: 'max', varLabel: '目前最大值',
        compute: v => Math.max(Number(v.v1), Number(v.v2), Number(v.v3), Number(v.v4), Number(v.v5)) },
      { kind: 'print', label: '說出', text: v => String(v.max) }
    ]
  },
  '004': {
    blockly: [
      { kind: 'read', label: '要求輸入文字 → 讀第一行（T）', assign: 't', varLabel: 'T' },
      { kind: 'read', label: '要求輸入文字 → 讀第 1 筆 N', assign: 'n1', varLabel: '這筆 N' },
      { kind: 'print', label: '判斷並輸出', text: v => isPrimeCN(v.n1) },
      { kind: 'read', label: '要求輸入文字 → 讀第 2 筆 N', assign: 'n2', varLabel: '這筆 N' },
      { kind: 'print', label: '判斷並輸出', text: v => isPrimeCN(v.n2) },
      { kind: 'read', label: '要求輸入文字 → 讀第 3 筆 N', assign: 'n3', varLabel: '這筆 N' },
      { kind: 'print', label: '判斷並輸出', text: v => isPrimeCN(v.n3) },
      { kind: 'read', label: '要求輸入文字 → 讀第 4 筆 N', assign: 'n4', varLabel: '這筆 N' },
      { kind: 'print', label: '判斷並輸出', text: v => isPrimeCN(v.n4) },
      { kind: 'read', label: '要求輸入文字 → 讀第 5 筆 N', assign: 'n5', varLabel: '這筆 N' },
      { kind: 'print', label: '判斷並輸出', text: v => isPrimeCN(v.n5) }
    ],
    scratch: [
      { kind: 'read', label: '詢問「幾筆？」→ 存進 T', assign: 't', varLabel: 'T' },
      { kind: 'read', label: '詢問「N？」→ 存進 n', assign: 'n1', varLabel: '這筆 N' },
      { kind: 'print', label: '說出', text: v => isPrimeCN(v.n1) },
      { kind: 'read', label: '詢問「N？」→ 存進 n', assign: 'n2', varLabel: '這筆 N' },
      { kind: 'print', label: '說出', text: v => isPrimeCN(v.n2) },
      { kind: 'read', label: '詢問「N？」→ 存進 n', assign: 'n3', varLabel: '這筆 N' },
      { kind: 'print', label: '說出', text: v => isPrimeCN(v.n3) },
      { kind: 'read', label: '詢問「N？」→ 存進 n', assign: 'n4', varLabel: '這筆 N' },
      { kind: 'print', label: '說出', text: v => isPrimeCN(v.n4) },
      { kind: 'read', label: '詢問「N？」→ 存進 n', assign: 'n5', varLabel: '這筆 N' },
      { kind: 'print', label: '說出', text: v => isPrimeCN(v.n5) }
    ]
  }
};

/* ═══════════════════════════════════════════════
 *  程式狀態面板：變數卡 + 輸出區（給「要讀幾次」示範用）
 * ═══════════════════════════════════════════════ */

function createProgramPanel(root) {
  const varsBox = el('div', 'program-vars');
  const varsTitle = el('p', 'program-subtitle', '變數');
  const varsList = el('div', 'program-var-list');
  varsBox.append(varsTitle, varsList);

  const outBox = el('div', 'program-output');
  const outTitle = el('p', 'program-subtitle', '輸出');
  const outList = el('pre', 'program-output-lines', '');
  outBox.append(outTitle, outList);

  root.append(varsBox, outBox);

  const vars = new Map();
  let outputLines = [];

  function renderVars() {
    varsList.innerHTML = '';
    if (vars.size === 0) {
      varsList.appendChild(el('p', 'program-empty', '（還沒有變數）'));
      return;
    }
    for (const [key, entry] of vars) {
      const card = el('div', 'var-card');
      card.appendChild(el('span', 'var-card-label', escapeHtml(entry.label)));
      card.appendChild(el('span', 'var-card-value', escapeHtml(formatValue(entry.value))));
      varsList.appendChild(card);
    }
  }

  function formatValue(value) {
    if (Array.isArray(value)) return `[${value.join(', ')}]`;
    return String(value);
  }

  function renderOutput() {
    outList.textContent = outputLines.length ? outputLines.join('\n') : '（還沒有輸出）';
  }

  return {
    setVar(key, label, value) {
      vars.set(key, { label, value });
      renderVars();
    },
    addOutput(text) {
      outputLines.push(text);
      renderOutput();
    },
    reset() {
      vars.clear();
      outputLines = [];
      renderVars();
      renderOutput();
    }
  };
}

/* ═══════════════════════════════════════════════
 *  「要讀幾次」雙欄示範（Scratch vs Blockly）
 * ═══════════════════════════════════════════════ */

function createHowManyDemo(container, problemId, problem) {
  const scripts = DEMO_SCRIPTS[problemId];
  container.innerHTML = '';

  const grid = el('div', 'howmany-grid');

  function buildColumn(mode, label, colourClass) {
    const col = el('div', `howmany-col ${colourClass}`);
    col.appendChild(el('div', 'howmany-col-head', `<span class="howmany-dot"></span><h4>${label}</h4><span class="howmany-count" data-role="count"></span>`));
    const feederRoot = el('div', 'feeder');
    col.appendChild(feederRoot);
    const programRoot = el('div', 'program-panel');
    col.appendChild(programRoot);
    grid.appendChild(col);
    return { col, feederRoot, programRoot, countEl: col.querySelector('[data-role="count"]') };
  }

  const scratchUI = buildColumn('scratch', 'Scratch：詢問並等待', 'is-scratch');
  const blocklyUI = buildColumn('blockly', 'Blockly：要求輸入文字', 'is-blockly');

  container.appendChild(grid);

  const controls = el('div', 'demo-controls');
  const btnNext = el('button', 'primary', '下一步 →');
  const btnAll = el('button', '', '全部跑完');
  const btnReset = el('button', 'ghost', '重來一次');
  const btnAskMore = el('button', 'ghost', '兩邊都再多問一次看看');
  controls.append(btnNext, btnAll, btnReset, btnAskMore);
  container.appendChild(controls);

  const reCallout = el('div', 're-callout');
  container.appendChild(reCallout);

  const state = {
    scratch: { feeder: null, panel: null, script: scripts.scratch, index: 0, vars: {} },
    blockly: { feeder: null, panel: null, script: scripts.blockly, index: 0, vars: {} }
  };

  state.scratch.feeder = createFeeder(scratchUI.feederRoot, { input: problem.sampleInput, mode: 'scratch' });
  state.scratch.panel = createProgramPanel(scratchUI.programRoot);
  state.blockly.feeder = createFeeder(blocklyUI.feederRoot, { input: problem.sampleInput, mode: 'blockly' });
  state.blockly.panel = createProgramPanel(blocklyUI.programRoot);

  function updateCounts() {
    scratchUI.countEl.textContent = `第 ${Math.min(state.scratch.index, state.scratch.script.length)} / ${state.scratch.script.length} 步`;
    blocklyUI.countEl.textContent = `第 ${Math.min(state.blockly.index, state.blockly.script.length)} / ${state.blockly.script.length} 步`;
    const bothDone = state.scratch.index >= state.scratch.script.length && state.blockly.index >= state.blockly.script.length;
    btnNext.disabled = bothDone;
    btnAll.disabled = bothDone;
    btnAskMore.disabled = !bothDone;
  }

  function runOneStep(key) {
    const s = state[key];
    if (s.index >= s.script.length) return;
    const step = s.script[s.index];
    if (step.kind === 'read') {
      const result = s.feeder.step();
      if (result.ok) {
        s.vars[step.assign] = result.text;
        s.panel.setVar(step.assign, step.varLabel || step.assign, result.text);
      }
      // 讀失敗理論上不會在腳本內發生（腳本跟測資是算好配對的），
      // 但保留這條分支，避免資料改過之後這裡靜靜壞掉。
    } else if (step.kind === 'derive') {
      const value = step.compute(s.vars);
      s.vars[step.assign] = value;
      s.panel.setVar(step.assign, step.varLabel || step.assign, value);
    } else if (step.kind === 'print') {
      s.panel.addOutput(step.text(s.vars));
    }
    s.index++;
  }

  btnNext.addEventListener('click', () => {
    runOneStep('scratch');
    runOneStep('blockly');
    updateCounts();
  });

  btnAll.addEventListener('click', () => {
    while (state.scratch.index < state.scratch.script.length || state.blockly.index < state.blockly.script.length) {
      runOneStep('scratch');
      runOneStep('blockly');
    }
    updateCounts();
  });

  btnReset.addEventListener('click', () => {
    state.scratch.feeder.reset();
    state.scratch.panel.reset();
    state.scratch.index = 0;
    state.scratch.vars = {};
    state.blockly.feeder.reset();
    state.blockly.panel.reset();
    state.blockly.index = 0;
    state.blockly.vars = {};
    reCallout.innerHTML = '';
    updateCounts();
  });

  btnAskMore.addEventListener('click', () => {
    const scratchResult = state.scratch.feeder.step();
    const blocklyResult = state.blockly.feeder.step();
    reCallout.innerHTML = `
      <div class="feedback" data-tone="bad">
        <strong>Scratch 再多問一次：</strong>
        <code>${escapeHtml(scratchResult.error || '（沒有錯，代表這筆測資還有剩）')}</code>
      </div>
      <div class="feedback" data-tone="bad">
        <strong>Blockly 再多讀一行：</strong>
        <code>${escapeHtml(blocklyResult.error || '（沒有錯，代表這筆測資還有剩）')}</code>
      </div>
    `;
  });

  updateCounts();
}

/* ═══════════════════════════════════════════════
 *  Section 2：看懂輸入範例（行號 + ⏎ 記號）
 * ═══════════════════════════════════════════════ */

function renderLineNumbered(root, sampleInput) {
  root.innerHTML = '';
  if (!sampleInput) {
    root.appendChild(el('p', 'feeder-empty', '（這一題沒有任何輸入）'));
    return;
  }
  const lines = sampleInput.split('\n');
  lines.forEach((line, i) => {
    const row = el('div', 'code-line');
    row.appendChild(el('span', 'ln', String(i + 1)));
    // 最後一行不標 ⏎：測資字串結尾本來就沒有換行，題目頁也是這樣顯示的。
    const eol = i < lines.length - 1 ? '<span class="eol">⏎</span>' : '';
    const content = el('span', '', `${escapeHtml(line)}${eol}`);
    row.appendChild(content);
    root.appendChild(row);
  });
}

/* ═══════════════════════════════════════════════
 *  初始化
 * ═══════════════════════════════════════════════ */

function setupChipNav() {
  const chips = document.querySelectorAll('.guide-chipnav a');
  chips.forEach(chip => {
    chip.addEventListener('click', event => {
      const id = chip.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      history.replaceState(null, '', `#${id}`);
    });
  });
}

function setupTabs(tabRoot, onSelect) {
  const buttons = Array.from(tabRoot.querySelectorAll('[data-problem]'));
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.toggle('active', b === btn));
      onSelect(btn.dataset.problem);
    });
  });
  return buttons;
}

async function init() {
  const problems = await loadProblems();

  setupChipNav();

  // ── Section 2：看懂範例 ──────────────────────────
  const samplesTabs = document.getElementById('samples-tabs');
  const sampleLineBox = document.getElementById('sample-linebox');
  const sampleFormatBox = document.getElementById('sample-format');
  const sampleTitle = document.getElementById('sample-title');

  function showSample(id) {
    const p = problems[id];
    sampleTitle.textContent = `${id} ${p.title}`;
    renderLineNumbered(sampleLineBox, p.sampleInput);
    sampleFormatBox.innerHTML = p.inputFormat || '<p>（沒有輸入格式說明）</p>';
  }

  if (samplesTabs) {
    setupTabs(samplesTabs, showSample);
    showSample('001');
  }

  // ── Section 3：要讀幾次 ──────────────────────────
  const howmanyTabs = document.getElementById('howmany-tabs');
  const howmanyStage = document.getElementById('howmany-stage');

  function showHowMany(id) {
    createHowManyDemo(howmanyStage, id, problems[id]);
  }

  if (howmanyTabs) {
    setupTabs(howmanyTabs, showHowMany);
    showHowMany('001');
  }
}

/* ═══════════════════════════════════════════════
 *  捷徑列：捲到哪一章，就亮哪一顆（純顯示，不影響內容）
 * ═══════════════════════════════════════════════ */
function setupChipNavSpy() {
  const links = [...document.querySelectorAll('.guide-chipnav a')];
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map();
  links.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section) byId.set(section, link);
  });
  if (!byId.size) return;

  const visible = new Set();
  const highlight = () => {
    const current = [...byId.keys()]
      .filter(section => visible.has(section))
      .sort((a, b) => a.offsetTop - b.offsetTop)[0];
    links.forEach(link => link.classList.remove('is-current'));
    if (current) {
      const link = byId.get(current);
      link.classList.add('is-current');
      link.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    });
    highlight();
  }, { rootMargin: '-110px 0px -55% 0px' });

  byId.forEach((_, section) => observer.observe(section));
}

document.addEventListener('DOMContentLoaded', () => {
  setupChipNavSpy();
  init().catch(error => {
    console.error('guide.js 初始化失敗：', error);
  });
});
