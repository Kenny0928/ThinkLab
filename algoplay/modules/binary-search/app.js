// 二分搜尋模組：分頁、看／猜動畫、自己做、銜接卡。教機器人在 robot.js，第一次打開才載入。
import { $, $$, h, stars, quiz } from '../../core/ui.js';
import { Player, bindKeys } from '../../core/player.js';
import { saveModule } from '../../core/progress.js';
import { HELLO_ALGO } from '../../core/catalog.js';
import { highlightPython, codeBlock } from '../../core/python.js';
import { BINARY_CODE, LINEAR_CODE, binarySearch, linearSearch, collect, parseNumbers, randomCase } from './algo.js';

const MODULE_ID = 'binary-search';
const MODES = ['watch', 'quiz', 'play', 'robot', 'next'];
const INTRO = {
  watch: '按「播放」看二分搜尋怎麼找，也可以一步一步按。換成「線性搜尋」比一比：同一組數字，比較次數差多少？',
  quiz: '動畫會在關鍵的地方停下來，先猜猜看下一步，答完才會繼續。'
};

let data = { nums: [3, 8, 12, 17, 21, 26, 30, 35, 41, 47, 52, 58, 63, 70, 77, 84], target: 58 };
let algo = 'binary';
let mode = 'watch';
let quizTally = { first: 0, asked: 0 };
let robotLoaded = null;
let animLoaded = false;

/* ---------- 陣列畫面 ---------- */
function buildArray(container, nums, onPick) {
  const columns = nums.map((value, k) => {
    const cell = onPick
      ? h('button', { type: 'button', class: 'acell', onclick: () => onPick(k) }, '?')
      : h('span', { class: 'acell' }, String(value));
    return h('div', { class: 'acol' }, h('span', { class: 'ptr' }), cell, h('span', { class: 'aidx' }, String(k)));
  });
  container.replaceChildren(...columns);
  return columns;
}

function setPointers(cols, pointers) {
  cols.forEach((col, k) => {
    const labels = pointers.filter(([, at]) => at === k).map(([name]) => h('b', { class: `p-${name}` }, name));
    col.firstChild.replaceChildren(...labels);
  });
}

/* ---------- 👀 看 ／ 🤔 猜 ---------- */
let cols = [];
let lastVars = {};
const player = new Player({
  onRender: renderStep,
  onEnd() {
    if (mode === 'watch' && algo === 'binary') saveModule(MODULE_ID, 'watch', 1);
    if (mode === 'quiz') finishQuiz();
  }
});
player.bindBar($('#playback'));
bindKeys(() => (mode === 'watch' || mode === 'quiz' ? player : robotLoaded?.player ?? null));

function renderCode() {
  const lines = algo === 'binary' ? BINARY_CODE : LINEAR_CODE;
  $('#code-panel').replaceChildren(...lines.map((text, k) => h('div', { class: 'code-line', 'data-line': k + 1 },
    h('span', { class: 'ln' }, String(k + 1)), h('span', { html: highlightPython(text) || ' ' }))));
}

function renderStep(step) {
  const { nums, target } = data;
  cols.forEach((col, k) => {
    col.classList.toggle('out', step.range ? k < step.range[0] || k > step.range[1] : step.found !== k);
    col.classList.toggle('focus', step.focus === k && step.found === undefined);
    col.classList.toggle('found', step.found === k);
  });
  const { vars } = step;
  const pointers = algo === 'binary'
    ? [['i', vars.i], ['j', vars.j], ['m', vars.m]]
    : [['k', vars.k]];
  setPointers(cols, pointers);
  const focusCol = cols[step.focus ?? step.found];
  const scroller = $('#array-view').parentElement;
  if (focusCol && scroller.scrollWidth > scroller.clientWidth) {
    scroller.scrollLeft = focusCol.offsetLeft - scroller.clientWidth / 2 + focusCol.offsetWidth / 2;
  }
  $('#c-compares').textContent = step.compares;
  $('#c-left').textContent = step.range ? step.range[1] - step.range[0] + 1 : 0;
  $('#narration').textContent = step.say;
  $$('#code-panel .code-line').forEach(el => el.classList.toggle('active', Number(el.dataset.line) === step.line));

  const rows = algo === 'binary'
    ? [['i', vars.i], ['j', vars.j], ['m', vars.m ?? '—'], ['nums[m]', vars.m !== null && vars.m !== undefined ? nums[vars.m] : '—'], ['target', target]]
    : [['k', vars.k], ['nums[k]', nums[vars.k] ?? '—'], ['target', target]];
  $('#vars-body').replaceChildren(...rows.map(([name, value]) => h('tr', { class: lastVars[name] !== undefined && lastVars[name] !== value ? 'changed' : '' },
    h('td', {}, name), h('td', {}, String(value)))));
  lastVars = Object.fromEntries(rows);
}

function loadAnimation() {
  const { nums, target } = data;
  cols = buildArray($('#array-view'), nums, null);
  renderCode();
  $('#viz-algo').textContent = algo === 'binary' ? '二分搜尋' : '線性搜尋';
  $('#ask-box').replaceChildren();
  $('#quiz-score').textContent = '';
  quizTally = { first: 0, asked: 0 };
  lastVars = {};
  const steps = collect(algo === 'binary' ? binarySearch(nums, target) : linearSearch(nums, target));
  player.onAsk = mode === 'quiz' ? askQuestion : null;
  player.load(steps);
}

async function askQuestion(ask) {
  $('#narration').textContent = '先猜猜看，再繼續。';
  const firstTry = await quiz($('#ask-box'), ask);
  quizTally.asked++;
  if (firstTry) quizTally.first++;
  $('#quiz-score').textContent = `一次答對 ${quizTally.first} / ${quizTally.asked} 題`;
}

function finishQuiz() {
  if (!quizTally.asked) return;
  saveModule(MODULE_ID, 'quiz', 1);
  const all = quizTally.first === quizTally.asked;
  $('#ask-box').replaceChildren(h('p', { class: 'feedback', 'data-tone': all ? 'good' : 'info' },
    `${all ? '🎉 全部一次答對！' : '完成了！'}一共 ${quizTally.asked} 題，一次就答對 ${quizTally.first} 題。按 ↻ 可以再玩一次，或按「隨機一組」換數字。`));
}

function showData() {
  $('#nums-input').value = data.nums.join(' ');
  $('#target-input').value = String(data.target);
}

function applyData() {
  const error = $('#data-error');
  error.replaceChildren();
  const parsed = parseNumbers($('#nums-input').value);
  const target = Number($('#target-input').value);
  if (parsed.error) {
    error.append(parsed.error);
    if (parsed.unsorted) {
      error.append(h('button', {
        type: 'button', class: 'text-button',
        onclick: () => { $('#nums-input').value = [...parsed.unsorted].sort((a, b) => a - b).join(' '); applyData(); }
      }, '幫我排好 →'));
    }
    return;
  }
  if (!Number.isInteger(target)) { error.append('要找的數請輸入整數。'); return; }
  data = { nums: parsed.nums, target };
  loadAnimation();
}

$('#apply-data').addEventListener('click', applyData);
$('#target-input').addEventListener('keydown', event => { if (event.key === 'Enter') applyData(); });
$('#nums-input').addEventListener('keydown', event => { if (event.key === 'Enter') applyData(); });
$('#random-data').addEventListener('click', () => { data = randomCase(16); showData(); $('#data-error').replaceChildren(); loadAnimation(); });
$$('#algo-switch button').forEach(button => button.addEventListener('click', () => {
  algo = button.dataset.algo;
  $$('#algo-switch button').forEach(b => b.setAttribute('aria-checked', String(b === button)));
  loadAnimation();
}));

/* ---------- 🕹️ 做 ---------- */
let game;
let playCols = [];

function newGame() {
  const { nums, target } = randomCase(16);
  game = { nums, target, i: 0, j: nums.length - 1, m: null, phase: 'pick', opened: new Set(), errors: 0 };
  playCols = buildArray($('#play-view'), nums, pickCell);
  $('#play-target').textContent = `要找的數：${target}`;
  $('#play-feedback').hidden = true;
  $('#play-result').replaceChildren();
  renderGame();
}

function playFeedback(tone, html) {
  const box = $('#play-feedback');
  box.dataset.tone = tone;
  box.innerHTML = html;
  box.hidden = false;
}

function renderGame() {
  const { nums, i, j, m, phase, opened } = game;
  const over = phase === 'done';
  playCols.forEach((col, k) => {
    const cell = col.children[1];
    cell.textContent = opened.has(k) || over ? String(nums[k]) : '?';
    cell.disabled = phase !== 'pick';
    cell.setAttribute('aria-label', opened.has(k) ? `第 ${k} 格：${nums[k]}` : `打開第 ${k} 格`);
    col.classList.toggle('out', !over && (i > j || k < i || k > j));
    col.classList.toggle('closed', !opened.has(k) && !over);
    col.classList.toggle('opened', opened.has(k) && game.found !== k);
    col.classList.toggle('focus', phase === 'decide' && k === m);
    col.classList.toggle('found', game.found === k);
  });
  setPointers(playCols, over ? [] : [['i', i], ['j', j], ...(phase === 'decide' ? [['m', m]] : [])]);
  $('#p-open').textContent = opened.size;
  $('#p-errors').textContent = game.errors;
  $('#play-vars').textContent = over ? '' : `i = ${i}，j = ${j}${phase === 'decide' ? `，m = ${m}` : ''}`;

  const prompt = $('#play-prompt');
  const choices = $('#play-choices');
  choices.replaceChildren();
  if (phase === 'pick') {
    prompt.textContent = `範圍是第 ${i}～${j} 格。點出這一輪要打開的格子：中點 m。`;
  } else if (phase === 'decide') {
    prompt.innerHTML = `打開了！nums[${m}] = <b>${nums[m]}</b>，要找 <b>${game.target}</b>。接下來呢？`;
    choices.append(
      h('button', { type: 'button', onclick: () => decide('left') }, '往左找：j = m − 1'),
      h('button', { type: 'button', onclick: () => decide('right') }, '往右找：i = m + 1'),
      h('button', { type: 'button', onclick: () => decide('found') }, '找到了！'));
  } else if (phase === 'empty') {
    prompt.textContent = `現在 i = ${i}，j = ${j}。接下來呢？`;
    choices.append(
      h('button', { type: 'button', onclick: () => decideEmpty(false) }, '再打開一格看看'),
      h('button', { type: 'button', onclick: () => decideEmpty(true) }, '找不到，回傳 −1'));
  } else {
    prompt.textContent = '';
  }
}

function pickCell(k) {
  if (game.phase !== 'pick') return;
  const { i, j } = game;
  const mid = Math.floor((i + j) / 2);
  if (k < i || k > j) { playFeedback('bad', `第 ${k} 格已經排除了，範圍是第 ${i}～${j} 格。`); return; }
  if (k !== mid) {
    game.errors++;
    playFeedback('bad', `不是這格。中點 m = (i + j) // 2 = (${i} + ${j}) // 2 = <b>${mid}</b>。`);
    renderGame();
    return;
  }
  game.m = k;
  game.opened.add(k);
  game.phase = 'decide';
  $('#play-feedback').hidden = true;
  renderGame();
}

function decide(choice) {
  const { nums, m, target } = game;
  const value = nums[m];
  const correct = value < target ? 'right' : value > target ? 'left' : 'found';
  if (choice !== correct) {
    game.errors++;
    const why = correct === 'found' ? `${value} 就是 ${target}！`
      : correct === 'right' ? `${value} < ${target}，左半邊的數都更小，答案只可能在右邊。`
        : `${value} > ${target}，右半邊的數都更大，答案只可能在左邊。`;
    playFeedback('bad', `再想想：${why}`);
    renderGame();
    return;
  }
  $('#play-feedback').hidden = true;
  if (correct === 'found') { game.found = m; finishGame(true); return; }
  if (correct === 'right') game.i = m + 1;
  else game.j = m - 1;
  game.phase = game.i > game.j ? 'empty' : 'pick';
  renderGame();
}

function decideEmpty(giveUp) {
  if (!giveUp) {
    game.errors++;
    playFeedback('bad', `i = ${game.i} 已經大於 j = ${game.j}，範圍空了：剩下的格子都排除了，再找也不會有。`);
    renderGame();
    return;
  }
  $('#play-feedback').hidden = true;
  finishGame(false);
}

function finishGame(found) {
  game.phase = 'done';
  renderGame();
  const earned = game.errors === 0 ? 3 : game.errors <= 2 ? 2 : 1;
  saveModule(MODULE_ID, 'play', earned);
  $('#play-result').replaceChildren(h('div', { class: 'result-card' },
    h('h3', {}, found ? `🎉 找到了：第 ${game.found} 格` : `✓ 正確：${game.target} 不在數列裡`, stars(earned)),
    h('p', {}, `打開了 ${game.opened.size} 格，錯誤 ${game.errors} 次。一個一個打開，最多要開 ${game.nums.length} 格。`),
    h('button', { type: 'button', class: 'primary', onclick: newGame }, '再玩一局')));
}

$('#play-new').addEventListener('click', newGame);

/* ---------- 📚 下一步 ---------- */
const BRIDGES = [
  ['「每次猜中間」', '中點 m = ⌊(i + j) / 2⌋，程式寫成 m = (i + j) // 2。', '二分搜尋', 'chapter_searching/binary_search/'],
  ['「100 個數最多 7 次，100 萬個數 20 次」', '時間複雜度 O(log n)，叫做「對數階」；一個一個找的線性搜尋是 O(n)。', '時間複雜度', 'chapter_computational_complexity/time_complexity/'],
  ['「範圍空了就找不到」', '搜尋區間 [i, j] 變成空的（i > j）時，回傳 −1。', '二分搜尋', 'chapter_searching/binary_search/'],
  ['「數列要先排好」', '二分搜尋靠的是資料有序；沒排序的資料要先排序，或改用其他方法。', '排序', 'chapter_sorting/']
];

function renderBridge() {
  $('#bridge-list').replaceChildren(...BRIDGES.map(([from, to, name, path]) => h('div', { class: 'bridge-item' },
    h('div', { class: 'from' }, `你玩過：${from}`),
    h('div', { class: 'arrow', 'aria-hidden': 'true' }, '→'),
    h('div', { class: 'to' }, `書上：${to} 見`, h('a', { href: HELLO_ALGO + path, target: '_blank', rel: 'noopener' }, `《Hello 演算法》〈${name}〉↗`)))));
  codeBlock($('#book-python'), BINARY_CODE.join('\n'));
  import('./robot-core.js').then(({ toPython }) => {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('thinklab_algoplay_robot_v1') || 'null'); } catch { /* 讀不到就當作還沒寫 */ }
    const text = saved ? toPython(saved).split('\n').filter(line => !line.startsWith('#')).join('\n').trim() : '';
    codeBlock($('#my-python'), text || '# 還沒有寫積木？\n# 到「🤖 教機器人」試試看');
  });
}

/* ---------- 分頁 ---------- */
function setMode(next, { focus = false } = {}) {
  if (!MODES.includes(next)) next = 'watch';
  const changed = mode !== next || !animLoaded;
  mode = next;
  $$('.tabs [role="tab"]').forEach(tab => {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  const panel = mode === 'watch' || mode === 'quiz' ? 'panel-anim' : `panel-${mode}`;
  $$('[role="tabpanel"]').forEach(p => { p.hidden = p.id !== panel; });
  $('#panel-anim').setAttribute('aria-labelledby', `tab-${mode === 'quiz' ? 'quiz' : 'watch'}`);
  if (mode === 'watch' || mode === 'quiz') {
    $('#anim-intro').textContent = INTRO[mode];
    $('#algo-switch').hidden = mode === 'quiz';
    if (mode === 'quiz' && algo !== 'binary') {
      algo = 'binary';
      $$('#algo-switch button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.algo === 'binary')));
    }
    if (changed) { loadAnimation(); animLoaded = true; }
  } else {
    player.pause();
  }
  if (mode === 'play' && !game) newGame();
  if (mode === 'robot' && robotLoaded?.resize) robotLoaded.resize();
  if (mode === 'robot' && !robotLoaded) {
    robotLoaded = { player: null };
    import('./robot.js').then(module => module.initRobot()).then(robot => { robotLoaded = robot; });
  }
  if (mode === 'next') renderBridge();
  history.replaceState(null, '', `#${mode}`);
}

$$('.tabs [role="tab"]').forEach((tab, index, tabs) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    setMode(tabs[(index + step + tabs.length) % tabs.length].dataset.mode, { focus: true });
  });
});

showData();
setMode(location.hash.slice(1) || 'watch');
