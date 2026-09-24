// 🤖 教機器人：Blockly 工作區、測試評分、重播。第一次打開分頁才載入 Blockly。
import { $, h, fmt, stars, aiSay } from '../../core/ui.js';
import { Player } from '../../core/player.js';
import { saveModule } from '../../core/progress.js';
import { codeBlock } from '../../core/python.js';
import { compile, runRobot, judgeRobot, toPython, STARTER, AI_PROGRAM, RobotError } from './robot-core.js';

const VENDOR = '../../../assets/vendor/blockly/';
const STORAGE = 'thinklab_algoplay_robot_v1';
const ROBOT_COLOUR = '#2f6fd6';
const RANGES = {
  small: { key: 'small', label: '1～100', min: 1, max: 100, budget: 7, maxGuesses: 200 },
  big: { key: 'big', label: '1～1,000,000', min: 1, max: 1_000_000, budget: 20, maxGuesses: 1000 }
};
const GOALS = [
  ['s1', '1～100：每個答案都猜得中'],
  ['s2', '1～100：最多 7 次就猜中'],
  ['s3', '1～1,000,000：每個答案都在 20 次內猜中']
];
const HINTS = [
  '先用「重複，當」積木讓機器人一直猜。條件是 low ≤ high，也就是範圍裡還有數字。',
  '每一輪先算中間：把 mid 設定為「(low ＋ high) ÷ 2 取整數」，再把 ans 設定為「猜 mid 的回答」。',
  '如果 ans ＝ 太小，答案比 mid 大，把 low 設定為 mid ＋ 1；否則如果 ans ＝ 太大，把 high 設定為 mid − 1。',
  '用「範圍最小值」「範圍最大值」積木，不要直接寫 1 和 100，換成一百萬時才會對。'
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`無法載入 ${src}`));
    document.head.append(script);
  });
}

function defineBlocks(Blockly) {
  // 只在 AlgoPlay 改寫幾個比較難懂的中文標籤。
  Object.assign(Blockly.Msg, {
    VARIABLES_SET: '設定 %1 為 %2',
    MATH_CHANGE_TITLE: '把 %1 增加 %2',
    CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: '跳出迴圈',
    CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: '直接進入下一輪'
  });
  Blockly.defineBlocksWithJsonArray([
    { type: 'robot_start', message0: '🤖 機器人開始玩', nextStatement: null, colour: ROBOT_COLOUR, tooltip: '機器人從這裡開始，依序執行接在下面的積木。' },
    {
      type: 'robot_guess', message0: '猜 %1 的回答', args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
      output: 'String', inputsInline: true, colour: ROBOT_COLOUR,
      tooltip: '猜一個數字。回答會是「太大」、「太小」或「猜中」；猜中時遊戲就結束。'
    },
    {
      type: 'robot_answer', message0: '%1', args0: [{ type: 'field_dropdown', name: 'ANS', options: [['太小', 'SMALL'], ['太大', 'BIG'], ['猜中', 'HIT']] }],
      output: 'String', colour: ROBOT_COLOUR, tooltip: '拿來和猜的回答比較。'
    },
    { type: 'robot_min', message0: '範圍最小值', output: 'Number', colour: ROBOT_COLOUR, tooltip: '這一局最小可能的答案，例如 1。' },
    { type: 'robot_max', message0: '範圍最大值', output: 'Number', colour: ROBOT_COLOUR, tooltip: '這一局最大可能的答案，例如 100 或 1,000,000。' },
    {
      type: 'robot_floordiv', message0: '%1 ÷ %2 取整數',
      args0: [{ type: 'input_value', name: 'A', check: 'Number' }, { type: 'input_value', name: 'B', check: 'Number' }],
      output: 'Number', inputsInline: true, colour: '%{BKY_MATH_HUE}', tooltip: '除完之後只留整數（無條件捨去），Python 寫成 a // b。'
    }
  ]);
}

function toolbox() {
  const num = n => ({ shadow: { type: 'math_number', fields: { NUM: n } } });
  const block = (type, extra = {}) => ({ kind: 'block', type, ...extra });
  return {
    kind: 'categoryToolbox',
    contents: [
      { kind: 'category', name: '機器人', colour: ROBOT_COLOUR, contents: [
        block('robot_guess'), block('robot_answer', { fields: { ANS: 'SMALL' } }), block('robot_answer', { fields: { ANS: 'BIG' } }),
        block('robot_min'), block('robot_max')
      ] },
      { kind: 'category', name: '判斷', colour: '#5568a9', contents: [
        block('controls_if'), block('controls_if', { extraState: { hasElse: true } }), block('controls_if', { extraState: { elseIfCount: 1 } }),
        block('logic_compare'), block('logic_operation'), block('logic_negate'), block('logic_boolean')
      ] },
      { kind: 'category', name: '迴圈', colour: '#408f5a', contents: [
        block('controls_whileUntil'), block('controls_repeat_ext', { inputs: { TIMES: num(10) } }), block('controls_flow_statements')
      ] },
      { kind: 'category', name: '數學', colour: '#5663b0', contents: [
        block('math_number', { fields: { NUM: 1 } }), block('math_arithmetic', { inputs: { A: num(1), B: num(1) } }), block('robot_floordiv', { inputs: { B: num(2) } })
      ] },
      { kind: 'category', name: '變數', colour: '#a05f22', custom: 'VARIABLE' }
    ]
  };
}

function darkTheme(Blockly) {
  return Blockly.Theme.defineTheme('algoplay-dark', {
    base: Blockly.Themes.Classic,
    startHats: true,
    componentStyles: {
      workspaceBackgroundColour: '#10131b',
      toolboxBackgroundColour: '#141720',
      toolboxForegroundColour: '#d9e1ef',
      flyoutBackgroundColour: '#1a1e28',
      flyoutForegroundColour: '#d9e1ef',
      flyoutOpacity: 1,
      scrollbarColour: '#384359',
      scrollbarOpacity: 0.7,
      insertionMarkerColour: '#ffffff',
      insertionMarkerOpacity: 0.3,
      cursorColour: '#d0d0d0'
    },
    fontStyle: { family: '"Noto Sans TC", "Plus Jakarta Sans", system-ui, sans-serif', weight: '500', size: 12 }
  });
}

export async function initRobot() {
  try {
    for (const file of ['blockly_compressed.js', 'blocks_compressed.js', 'zh-hant.js']) await loadScript(VENDOR + file);
  } catch {
    $('#blockly-loading').textContent = '積木載入失敗，請重新整理頁面再試一次。';
    return { player: null, resize() {} };
  }
  const { Blockly } = window;
  defineBlocks(Blockly);
  $('#blockly-loading').remove();
  const workspace = Blockly.inject($('#blockly'), {
    toolbox: toolbox(),
    theme: darkTheme(Blockly),
    media: `${VENDOR}media/`,
    trashcan: true,
    grid: { spacing: 22, length: 1, colour: '#2e374b', snap: true },
    zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 1.6, minScale: 0.5 },
    move: { scrollbars: true, drag: true, wheel: false }
  });

  /* ---------- 存檔與 Python ---------- */
  function load(json) {
    workspace.clear();
    Blockly.serialization.workspaces.load(json, workspace);
    workspace.getBlocksByType('robot_start', false).forEach(block => block.setDeletable(false));
  }
  function save() {
    const json = Blockly.serialization.workspaces.save(workspace);
    try { localStorage.setItem(STORAGE, JSON.stringify(json)); } catch { /* 存不進去就只留在畫面上 */ }
    codeBlock($('#python-out'), toPython(json));
    return json;
  }
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE) || 'null'); } catch { /* 讀不到就用起始程式 */ }
  try { load(saved || STARTER); } catch { load(STARTER); }
  save();
  workspace.addChangeListener(event => { if (!event.isUiEvent) save(); });

  function clearMarks() {
    workspace.getAllBlocks(false).forEach(block => block.setWarningText(null));
    workspace.highlightBlock(null);
  }
  function markError(error) {
    const block = error?.blockId && workspace.getBlockById(error.blockId);
    if (!block) return;
    block.setWarningText(error.message);
    workspace.centerOnBlock(block.id);
    block.select();
  }

  /* ---------- 任務與提示 ---------- */
  function renderGoals(got) {
    $('#goal-list').replaceChildren(...GOALS.map(([key, text]) => h('li', { class: got.has(key) ? 'got' : '' }, text)));
    $('#robot-stars').replaceChildren(stars(got.size));
  }
  renderGoals(new Set());

  let hintCount = 1;
  function renderHints() {
    $('#hint-list').replaceChildren(...HINTS.slice(0, hintCount).map(text => h('li', {}, text)));
    $('#hint-more').hidden = hintCount >= HINTS.length;
  }
  $('#hint-more').addEventListener('click', () => { hintCount++; renderHints(); });
  renderHints();

  /* ---------- 測試 ---------- */
  function resultRow(range, result) {
    const replay = secret => h('button', { type: 'button', class: 'text-button', onclick: () => showReplay(range, secret) }, '重播這一局 →');
    if (!result.pass) {
      const { secret, error } = result.failure;
      return h('div', { class: 'result-row', 'data-tone': 'bad' },
        h('h3', {}, h('span', {}, `✗ ${range.label}`), h('span', {}, `測到第 ${result.tested} 個答案`)),
        h('p', {}, `答案是 ${fmt(secret)} 的時候：${error.message}`),
        replay(secret));
    }
    const sample = range.key === 'big' ? `抽測 ${result.total} 個答案（含最小和最大）` : `${result.total} 個答案`;
    if (!result.withinBudget) {
      return h('div', { class: 'result-row', 'data-tone': 'warn' },
        h('h3', {}, h('span', {}, `△ ${range.label}`), h('span', {}, `平均 ${result.average.toFixed(1)} 次`)),
        h('p', {}, `${sample}全部猜中，但答案是 ${fmt(result.worst)} 時要猜 ${fmt(result.most)} 次，超過 ${range.budget} 次。`),
        replay(result.worst));
    }
    return h('div', { class: 'result-row', 'data-tone': 'good' },
      h('h3', {}, h('span', {}, `✓ ${range.label}`), h('span', {}, `平均 ${result.average.toFixed(1)} 次`)),
      h('p', {}, `${sample}全部猜中，最多 ${result.most} 次。`),
      replay(result.worst));
  }

  $('#robot-test').addEventListener('click', () => {
    clearMarks();
    const json = save();
    const box = $('#robot-results');
    let small;
    try {
      small = judgeRobot(json, RANGES.small);
    } catch (error) {
      if (!(error instanceof RobotError)) throw error;
      box.replaceChildren(h('div', { class: 'result-block' }, h('div', { class: 'result-row', 'data-tone': 'bad' }, h('p', {}, error.message))));
      return;
    }
    const big = small.pass ? judgeRobot(json, RANGES.big) : null;
    const got = new Set();
    if (small.pass) got.add('s1');
    if (small.pass && small.withinBudget) got.add('s2');
    if (big?.pass && big.withinBudget) got.add('s3');
    renderGoals(got);
    saveModule('binary-search', 'robot', got.size);

    const ai = h('div');
    const message = got.size === 3 ? '你的機器人比我厲害多了！一百萬個數字也只要 20 次。🤖✨'
      : got.has('s2') ? '1～100 很厲害！可是一百萬的時候……是不是有地方直接寫了 1 或 100？試試「範圍最大值」積木。'
        : got.has('s1') ? '每次都猜得中，跟我的方法一樣……但是太花次數了。每次猜「中間」試試看？'
          : '機器人還沒辦法每次都猜中。按「重播這一局」看看它在哪裡卡住。';
    aiSay(ai, message);
    box.replaceChildren(h('div', { class: 'result-block' },
      resultRow(RANGES.small, small),
      big ? resultRow(RANGES.big, big) : h('div', { class: 'result-row' }, h('p', {}, '先讓 1～100 全部猜中，再挑戰一百萬。')),
      ai));

    const failed = !small.pass ? [RANGES.small, small.failure] : big && !big.pass ? [RANGES.big, big.failure] : null;
    if (failed) {
      markError(failed[1].error);
      showReplay(failed[0], failed[1].secret);
    } else {
      showReplay(RANGES.small, small.worst);
    }
  });

  $('#robot-ai').addEventListener('click', () => {
    if (!confirm('會換成小 AI 的程式（一個一個猜），你現在的積木會被取代。確定嗎？')) return;
    load(AI_PROGRAM);
    save();
    aiSay($('#robot-results'), '這是我的程式：從最小值開始，一個一個猜。按「▶ 測試機器人」看看它能拿幾顆星？');
  });
  $('#robot-reset').addEventListener('click', () => {
    if (!confirm('確定要清空，從起始程式重新開始嗎？')) return;
    load(STARTER);
    save();
    clearMarks();
    $('#robot-results').replaceChildren();
    $('#replay-panel').hidden = true;
  });
  ['#robot-test', '#robot-ai', '#robot-reset'].forEach(id => { $(id).disabled = false; });

  /* ---------- 重播 ---------- */
  let replay = null;
  const live = $('#replay-live');
  const player = new Player({ onRender: renderReplay });
  player.bindBar($('#replay-bar'));

  function showReplay(range, secret) {
    $('#replay-panel').hidden = false;
    $('#replay-range').value = String(range.max);
    $('#replay-secret').value = String(secret);
    playReplay();
  }

  function playReplay() {
    const range = Number($('#replay-range').value) === 100 ? RANGES.small : RANGES.big;
    const secret = Number(String($('#replay-secret').value).replace(/[,，\s]/g, ''));
    const info = $('#replay-info');
    if (!Number.isInteger(secret) || secret < range.min || secret > range.max) {
      info.textContent = `答案要是 ${range.min}～${fmt(range.max)} 的整數`;
      return;
    }
    let program;
    try { program = compile(save()); } catch (error) { info.textContent = error.message; return; }
    const result = runRobot(program, { ...range, secret });
    let low = range.min;
    let high = range.max;
    const steps = [{ n: 0, low, high }];
    result.guesses.forEach((guess, k) => {
      if (guess.answer === '太小') low = Math.max(low, guess.x + 1);
      if (guess.answer === '太大') high = Math.min(high, guess.x - 1);
      steps.push({ n: k + 1, ...guess, low, high });
    });
    if (!result.found) steps.push({ n: result.guesses.length, low, high, error: result.error });
    replay = { steps, range, secret };
    info.textContent = result.found ? `猜 ${result.guesses.length} 次就猜中` : '沒有猜中';
    player.load(steps);
  }

  function renderReplay(step, index) {
    const { range, steps, secret } = replay;
    const size = range.max - range.min + 1;
    live.style.left = `${((step.low - range.min) / size) * 100}%`;
    live.style.width = `${(Math.max(0, step.high - step.low + 1) / size) * 100}%`;
    const now = $('#replay-now');
    if (step.error) {
      now.innerHTML = '';
      now.append(`⚠ ${step.error.message}`);
    } else if (step.x === undefined) {
      now.innerHTML = `答案是 <b>${fmt(secret)}</b>，機器人還不知道。按 ▶ 看它怎麼猜。`;
    } else {
      const vars = Object.entries(step.vars).map(([name, value]) => `${name} = ${typeof value === 'number' ? fmt(value) : value}`).join('、');
      now.innerHTML = `第 ${step.n} 次：猜 <b>${fmt(step.x)}</b> → ${step.answer}${step.answer === '猜中' ? ' 🎉' : `，答案在 <b>${fmt(step.low)}</b>～<b>${fmt(step.high)}</b> 之間`}`;
      if (vars) now.append(h('br'), h('small', { style: 'color:var(--subtle)' }, `猜之前的變數：${vars}`));
    }
    const guesses = steps.slice(1, index + 1).filter(s => s.x !== undefined).slice(-40);
    $('#replay-log').replaceChildren(...guesses.map(s => h('li', { class: `${s.answer === '猜中' ? 'hit' : ''}${s === step ? ' now' : ''}` },
      h('span', { class: 'n' }, `#${s.n}`), h('span', { class: 'x' }, fmt(s.x)), h('span', { class: 'a' }, s.answer))));
    const log = $('#replay-log');
    log.scrollTop = log.scrollHeight;
    workspace.highlightBlock(step.blockId || step.error?.blockId || null);
  }

  $('#replay-form').addEventListener('submit', event => { event.preventDefault(); playReplay(); });

  return { player, resize: () => Blockly.svgResize(workspace) };
}
