// 🎉 教室：終極密碼
import { h, fmt, toast, stars, lamps, aiSay, quiz, wait, reducedMotion } from '../core/ui.js';
import { gameShell } from './level-ui.js';
import { aiAvatar, teacherAvatar } from '../core/cast.js';
import { saveBuilding, unlockDex } from '../core/progress.js';
import { HELLO_ALGO } from '../core/catalog.js';
import { answerFor, maxGuesses, halvingChain } from './logic.js';

const STEPS = ['1～100', '誰先猜中', '1～100 萬', '結算'];
const STAR_RULES = [
  ['r1', '7 次內猜中 1～100'],
  ['perfect', '完美二分：每次都猜在正中間'],
  ['r3', '20 次內猜中 1～100 萬']
];
const ANSWER_TEXT = { small: '太小了', big: '太大了', hit: '猜中了！' };
const AI_STEP_MS = 110;     // 小 AI 每猜一個數字要花多久

let shell;
let stage;
let aiBox;
let meterBox;
let log;
let logCount;
let notifyProgress = () => {};
let exitLevel = () => {};
const earned = new Set();
let firstRoundCount = null;
let raceResult = null;

const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const parseNumber = text => Number(String(text).replace(/[,，\s]/g, ''));
const midpoints = (low, high) => [Math.floor((low + high) / 2), Math.ceil((low + high) / 2)];

function earn(key) {
  if (earned.has(key)) return;
  earned.add(key);
  shell.setStars(earned.size);
  saveBuilding('guess', { stars: [...earned], done: false });
}

/* ---------- 紀錄 ---------- */
function resetLog() {
  log.replaceChildren(h('li', { class: 'empty' }, '還沒有猜。'));
  logCount.textContent = '';
}

function addLog(count, x, ans) {
  if (count === 1) log.replaceChildren();
  log.append(h('li', { class: ans === 'hit' ? 'hit' : '' },
    h('span', { class: 'n' }, `#${count}`), h('span', { class: 'x' }, fmt(x)), h('span', { class: 'a' }, ANSWER_TEXT[ans])));
  log.scrollTop = log.scrollHeight;
  logCount.textContent = `${count} 次`;
}

/* ---------- 畫面零件 ---------- */
/** 老師：出題的人，會指上指下。 */
function teacherStrip(firstLine) {
  const avatar = teacherAvatar({ size: 44, label: '老師' });
  const line = h('p', { class: 'line' }, firstLine);
  const el = h('div', { class: 'teacher-strip', role: 'status' },
    avatar.el, h('div', {}, h('p', { class: 'who' }, '老師'), line));
  return {
    el,
    say(mood, html) {
      avatar.setMood(mood);
      el.dataset.tone = mood;
      line.innerHTML = html;
    }
  };
}

/** 剩下的範圍：一條會縮短的長條。 */
function rangeStrip(min, max) {
  const live = h('div', { class: 'range-live' });
  const text = h('p', { class: 'range-text' });
  const el = h('div', { class: 'range-strip' },
    h('div', { class: 'range-track' }, live), text);
  function set(low, high) {
    const size = max - min + 1;
    live.style.left = `${((low - min) / size) * 100}%`;
    live.style.width = `${((high - low + 1) / size) * 100}%`;
    text.innerHTML = `<span>還可能是 <b>${fmt(low)}</b> ～ <b>${fmt(high)}</b></span><span>剩 <b>${fmt(high - low + 1)}</b> 個數</span>`;
  }
  set(min, max);
  return { el, set };
}

function numberBoard(onPick) {
  const cells = [];
  const board = h('div', { class: 'number-board', role: onPick ? 'group' : null, 'aria-label': onPick ? '數字盤：點一個數字來猜' : '數字盤' });
  for (let n = 1; n <= 100; n++) {
    const cell = onPick
      ? h('button', { type: 'button', class: 'cell', 'aria-label': `猜 ${n}`, onclick: () => onPick(n) }, String(n))
      : h('span', { class: 'cell' }, String(n));
    cells.push(cell);
    board.append(cell);
  }
  return { board, cells, wrap: h('div', { class: 'board-wrap' }, board) };
}

/** 從某一格飛出來的字。靠邊的格子要往內收，字才不會被裁掉。 */
function pop(wrap, cell, text, tone = '') {
  const x = cell.offsetLeft + cell.offsetWidth / 2;
  const el = h('span', {
    class: `pop ${tone}`,
    style: `left:${Math.min(Math.max(x, 72), Math.max(72, wrap.clientWidth - 72))}px;top:${cell.offsetTop}px`
  }, text);
  wrap.append(el);
  el.addEventListener('animationend', () => el.remove());
}

function feedbackBox() {
  return h('div', { class: 'feedback', role: 'status', hidden: true });
}

function say(box, tone, html) {
  box.dataset.tone = tone;
  box.innerHTML = html;
  box.hidden = false;
}

/**
 * 一局猜數字：只管規則與計數，畫面交給 onGuess。
 * onGuess 會收到猜之前的範圍（before），才能判斷有沒有猜在正中間。
 */
function guessGame({ min, max, budget, secret, onGuess, onHit, onFail }) {
  let low = min;
  let high = max;
  let count = 0;
  let over = false;
  return {
    get over() { return over; },
    stop() { over = true; },
    guess(x) {
      if (over) return;
      if (!Number.isInteger(x) || x < min || x > max) { toast(`請輸入 ${fmt(min)}～${fmt(max)} 的整數`); return; }
      if (x < low || x > high) { toast(`${fmt(x)} 已經排除了：答案在 ${fmt(low)}～${fmt(high)} 之間`); return; }
      const before = { low, high };
      count++;
      const ans = answerFor(secret, x);
      if (ans === 'small') low = x + 1;
      if (ans === 'big') high = x - 1;
      addLog(count, x, ans);
      onGuess({ x, ans, low, high, before, count });
      if (ans === 'hit') { over = true; onHit(count); }
      else if (count >= budget) { over = true; onFail(count); }
    }
  };
}

/** 把新排除掉的格子一格一格掃掉，回傳這次排除了幾個。 */
function sweepOut(cells, guessed, low, high, from) {
  let removed = 0;
  cells.forEach((cell, i) => {
    const n = i + 1;
    if (guessed.has(n) || cell.classList.contains('out') || (n >= low && n <= high)) return;
    cell.style.setProperty('--d', `${Math.min(220, Math.abs(n - from) * 5)}ms`);
    cell.classList.add('out');
    removed++;
  });
  return removed;
}

/* ---------- 第 1 關：1～100，限 7 次 ---------- */
function roundHundred() {
  shell.setStep(0);
  const budget = 7;
  const secret = randomInt(1, 100);
  const updateLamps = lamps(meterBox, { label: '剩下的次數', budget, note: '用完 7 次還沒猜中就輸了。' });
  resetLog();
  aiSay(aiBox, '我先在旁邊看你怎麼猜。<br>等一下換我下場，<b>跟你比比看</b>！', 'idle');

  let perfect = true;
  const guessed = new Set();
  const { board, cells, wrap } = numberBoard(n => game.guess(n));
  const range = rangeStrip(1, 100);
  const teacher = teacherStrip('我想好一個 1～100 的數字了。開始吧！');
  const feedback = feedbackBox();
  const actions = h('div', { class: 'stage-actions' });
  const input = h('input', { type: 'number', min: 1, max: 100, inputmode: 'numeric', placeholder: '輸入 1～100', 'aria-label': '要猜的數字' });
  const form = h('form', {
    class: 'input-row',
    onsubmit: event => { event.preventDefault(); game.guess(parseNumber(input.value)); input.value = ''; input.focus(); }
  }, input, h('button', { class: 'primary', type: 'submit' }, '猜！'));

  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 1 關：猜 1～100'), h('span', { class: 'tag accent' }, '資源：猜的次數')),
    range.el, wrap,
    h('p', { class: 'board-legend' }, h('span', {}, '↑ 答案比它大'), h('span', {}, '↓ 答案比它小'), h('span', {}, '變暗＝已經排除')),
    form, teacher.el, feedback, actions);

  function lockBoard() {
    cells.forEach(cell => { cell.disabled = true; });
    form.hidden = true;
  }

  const game = guessGame({
    min: 1, max: 100, budget, secret,
    onGuess({ x, ans, low, high, before, count }) {
      guessed.add(x);
      if (!midpoints(before.low, before.high).includes(x)) perfect = false;
      cells[x - 1].classList.add(ans);
      updateLamps(count);
      if (ans === 'hit') return;
      const removed = sweepOut(cells, guessed, low, high, x);
      range.set(low, high);
      if (removed) pop(wrap, cells[x - 1], `排除了 ${removed} 個！`);
      teacher.say(ans, `${ANSWER_TEXT[ans]}！答案比 <b>${x}</b> ${ans === 'small' ? '大' : '小'}。`);
    },
    onHit(count) {
      firstRoundCount = count;
      if (count <= budget) earn('r1');
      if (perfect) earn('perfect');
      lockBoard();
      range.set(secret, secret);
      teacher.say('hit', `答對了，就是 <b>${secret}</b>！`);
      pop(wrap, cells[secret - 1], `🎉 ${count} 次`, 'good');
      say(feedback, 'good', perfect
        ? `🎉 ${count} 次就猜中，而且每一次都猜在正中間——這就是最省的猜法！`
        : `🎉 ${count} 次就猜中了！你每次是怎麼決定要猜哪個數字的？`);
      aiSay(aiBox, '好厲害！換我下場，<b>我們比比看誰先猜中</b>。', 'proud');
      actions.replaceChildren(
        h('button', { class: 'primary', onclick: roundRace }, '下一關：跟小 AI 比 →'),
        h('button', { onclick: roundHundred }, '再玩一次'));
    },
    onFail() {
      lockBoard();
      cells[secret - 1].classList.remove('out');
      cells[secret - 1].classList.add('secret');
      teacher.say('out', `7 次用完囉，答案是 <b>${secret}</b>。`);
      say(feedback, 'bad', '想一想：猜哪個數字，不管老師說「太大」還是「太小」，都能排除最多數字？');
      actions.replaceChildren(
        h('button', { class: 'primary', onclick: roundHundred }, '再挑戰一次'),
        h('button', { onclick: roundRace }, '跳過，去跟小 AI 比 →'));
    }
  });
  input.focus({ preventScroll: true });
}

/* ---------- 第 2 關：跟小 AI 同時比 ---------- */
function roundRace() {
  shell.setStep(1);
  const budget = 7;
  const secret = randomInt(58, 92);
  const updateLamps = lamps(meterBox, { label: '剩下的次數', budget, note: '你有 7 次；小 AI 沒有限制，但它一次只前進一個數字。' });
  resetLog();
  aiSay(aiBox, '我的方法最保險：<b>從 1 開始，一個一個猜</b>，一定猜得到。<br>準備好就開始！', 'think');

  let perfectRun = true;
  const guessed = new Set();
  const { cells, wrap } = numberBoard(n => game.guess(n));
  const range = rangeStrip(1, 100);
  const teacher = teacherStrip('這次我出一個新的數字。兩邊同時開始！');
  const feedback = feedbackBox();
  const quizBox = h('div');
  const actions = h('div', { class: 'stage-actions' });

  const crawlFill = h('div', { class: 'crawl-fill' });
  const crawlNow = h('div', { class: 'crawl-now', style: 'left:0' });
  const aiCount = h('span', { class: 'count' }, '第 0 次');
  const race = h('div', { class: 'race' },
    h('span', { class: 'who' }, aiAvatar({ size: 24, mood: 'think' }).el, '小 AI'),
    h('div', { class: 'crawl' }, crawlFill, crawlNow),
    aiCount);

  const input = h('input', { type: 'number', min: 1, max: 100, inputmode: 'numeric', placeholder: '輸入 1～100', 'aria-label': '要猜的數字', disabled: true });
  const submit = h('button', { class: 'primary', type: 'submit', disabled: true }, '猜！');
  const form = h('form', {
    class: 'input-row',
    onsubmit: event => { event.preventDefault(); game.guess(parseNumber(input.value)); input.value = ''; input.focus(); }
  }, input, submit);
  const start = h('button', { class: 'primary', onclick: begin }, '▶ 開始比賽');
  actions.append(start);

  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 2 關：誰先猜中？'), h('span', { class: 'tag amber' }, '同時進行')),
    range.el, wrap, race, form, teacher.el, feedback, quizBox, actions);

  let aiAt = 0;
  let racing = false;

  function drawAiProgress() {
    crawlFill.style.width = `${aiAt}%`;
    crawlNow.style.left = `${aiAt}%`;
    aiCount.textContent = `第 ${aiAt} 次`;
    cells[aiAt - 1]?.classList.add('ai-now');
    cells[aiAt - 2]?.classList.remove('ai-now');
  }

  async function begin() {
    start.remove();
    await shell.flash(['3', '2', '1', '開始！']);
    input.disabled = false;
    submit.disabled = false;
    input.focus({ preventScroll: true });
    racing = true;
    let last = performance.now();
    let carry = 0;
    requestAnimationFrame(function tick(now) {
      if (!racing || !race.isConnected) return;
      carry += now - last;
      last = now;
      while (carry >= AI_STEP_MS && aiAt < secret) { carry -= AI_STEP_MS; aiAt++; }
      drawAiProgress();
      if (aiAt >= secret) { aiWins(); return; }
      requestAnimationFrame(tick);
    });
  }

  function stopRace() {
    racing = false;
    cells.forEach(cell => cell.classList.remove('ai-now'));
  }

  function afterRace(retry) {
    quiz(quizBox, {
      question: '用小 AI 的方法（從 1 開始一個一個猜），1～100 最多要猜幾次？',
      options: ['7 次', '50 次', '100 次'],
      answer: '100 次',
      explain: '如果答案剛好是 100，就要從 1 一路猜到 100。'
    }).then(() => {
      actions.replaceChildren(...[
        h('button', { class: 'primary', onclick: roundMillion }, '下一關：1～100 萬 →'),
        retry ? h('button', { onclick: roundRace }, '再比一次') : null
      ].filter(Boolean));
    });
  }

  function youWin(count) {
    stopRace();
    race.classList.add('is-lost');
    raceResult = { you: count, ai: aiAt };
    teacher.say('hit', `答對了，就是 <b>${secret}</b>！`);
    say(feedback, 'good', `🎉 你猜 <b>${count}</b> 次就中了，小 AI 才爬到 <b>${aiAt}</b>。`);
    aiSay(aiBox, `你才猜 ${count} 次？我還在第 ${aiAt} 個……<br>我的方法沒有錯，只是<b>太花次數了</b>。`, 'sad');
    afterRace(false);
  }

  function aiWins() {
    stopRace();
    game.stop();
    race.classList.add('is-win');
    raceResult = { you: null, ai: secret };
    teacher.say('out', `小 AI 先猜到了，答案是 <b>${secret}</b>。`);
    say(feedback, 'bad', `小 AI 數了 <b>${secret}</b> 次，慢慢也數到了。它的方法很笨，但只要肯數就一定會中。`);
    aiSay(aiBox, '我贏了！雖然……我猜了好多次。😅', 'proud');
    form.hidden = true;
    actions.replaceChildren(h('button', { class: 'primary', onclick: roundRace }, '再比一次'));
    afterRace(true);
  }

  const game = guessGame({
    min: 1, max: 100, budget, secret,
    onGuess({ x, ans, low, high, before, count }) {
      guessed.add(x);
      if (!midpoints(before.low, before.high).includes(x)) perfectRun = false;
      cells[x - 1].classList.add(ans);
      updateLamps(count);
      if (ans === 'hit') return;
      const removed = sweepOut(cells, guessed, low, high, x);
      range.set(low, high);
      if (removed) pop(wrap, cells[x - 1], `排除了 ${removed} 個！`);
      teacher.say(ans, `${ANSWER_TEXT[ans]}！答案比 <b>${x}</b> ${ans === 'small' ? '大' : '小'}。`);
    },
    onHit(count) {
      if (perfectRun) earn('perfect');
      form.hidden = true;
      cells.forEach(cell => { cell.disabled = true; });
      youWin(count);
    },
    onFail() {
      stopRace();
      form.hidden = true;
      cells.forEach(cell => { cell.disabled = true; });
      teacher.say('out', `你的 7 次用完了，答案是 <b>${secret}</b>。`);
      say(feedback, 'bad', `小 AI 還在第 ${aiAt} 個，但你的次數先用完了。再比一次？`);
      actions.replaceChildren(h('button', { class: 'primary', onclick: roundRace }, '再比一次'));
      afterRace(true);
    }
  });
}

/* ---------- 第 3 關：1～1,000,000，限 20 次 ---------- */
function roundMillion() {
  shell.setStep(2);
  const MAX = 1_000_000;
  const budget = maxGuesses(MAX);
  const secret = randomInt(1, MAX);
  const chain = halvingChain(MAX);
  const updateLamps = lamps(meterBox, { label: '剩下的次數', budget, note: '一百萬個數字，只給你 20 次。' });
  resetLog();
  aiSay(aiBox, '一百萬個數字……用我的方法，最多要猜<b>一百萬次</b>。<br>你有辦法在 20 次內猜中嗎？', 'shock');

  const liveAll = h('div', { class: 'range-live', style: 'left:0;width:100%' });
  const liveZoom = h('div', { class: 'range-live', style: 'left:0;width:100%' });
  const zoomCaption = h('div', { class: 'range-caption' }, h('span', {}, '放大看：上一次的範圍'), h('span', {}, '1 ～ 1,000,000'));
  const status = h('p', { class: 'range-now' });
  const teacher = teacherStrip('這次的數字在 1 到 100 萬之間。');
  const feedback = feedbackBox();
  const actions = h('div', { class: 'stage-actions' });
  const input = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '輸入 1～1,000,000', 'aria-label': '要猜的數字' });
  const form = h('form', {
    class: 'input-row',
    onsubmit: event => { event.preventDefault(); game.guess(parseNumber(input.value)); input.value = ''; input.focus(); }
  }, input, h('button', { class: 'primary', type: 'submit' }, '猜！'));
  const showRange = (low, high) => { status.innerHTML = `答案在 <b>${fmt(low)}</b> ～ <b>${fmt(high)}</b> 之間，還剩 <b>${fmt(high - low + 1)}</b> 個數`; };
  let hinted = false;

  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 3 關：猜 1～1,000,000'), h('span', { class: 'tag accent' }, '限 20 次')),
    h('div', { class: 'stage-mid' },
      h('div', { class: 'range-viz' },
        h('div', { class: 'range-row' }, h('div', { class: 'range-caption' }, h('span', {}, '全部'), h('span', {}, '1 ～ 1,000,000')), h('div', { class: 'range-track' }, liveAll)),
        h('div', { class: 'range-row' }, zoomCaption, h('div', { class: 'range-track' }, liveZoom))),
      status),
    form, teacher.el, feedback, actions);
  showRange(1, MAX);

  const place = (el, low, high, from, to) => {
    const size = to - from + 1;
    el.style.left = `${((low - from) / size) * 100}%`;
    el.style.width = `${((high - low + 1) / size) * 100}%`;
  };

  const game = guessGame({
    min: 1, max: MAX, budget, secret,
    onGuess({ x, ans, low, high, before, count }) {
      updateLamps(count);
      if (ans === 'hit') return;
      place(liveAll, low, high, 1, MAX);
      place(liveZoom, low, high, before.low, before.high);
      zoomCaption.lastChild.textContent = `${fmt(before.low)} ～ ${fmt(before.high)}`;
      showRange(low, high);
      teacher.say(ans, `${ANSWER_TEXT[ans]}！答案比 <b>${fmt(x)}</b> ${ans === 'small' ? '大' : '小'}。`);
      const left = high - low + 1;
      if (!hinted && count >= 2 && left > chain[count] * 1.5) {
        hinted = true;
        aiSay(aiBox, '提示：猜<b>範圍的正中間</b>，不管老師說太大還是太小，都能排除一半。<br>中間 ＝（最小 ＋ 最大）÷ 2', 'think');
      }
    },
    onHit(count) {
      earn('r3');
      form.hidden = true;
      place(liveAll, secret, secret, 1, MAX);
      status.innerHTML = `答案就是 <b>${fmt(secret)}</b>！`;
      teacher.say('hit', `答對了，就是 <b>${fmt(secret)}</b>！`);
      say(feedback, 'good', `🎉 ${count} 次就猜中了一百萬個數字裡的一個！`);
      aiSay(aiBox, `我要猜 ${fmt(secret)} 次，你只用了 ${count} 次？！<br>你用的到底是什麼方法？`, 'shock');
      actions.replaceChildren(h('button', { class: 'primary', onclick: reveal }, '揭曉：這個方法叫什麼？ →'));
    },
    onFail() {
      form.hidden = true;
      teacher.say('out', `20 次用完了，答案是 <b>${fmt(secret)}</b>。`);
      say(feedback, 'bad', '秘訣：每次都猜範圍的正中間。');
      actions.replaceChildren(
        h('button', { class: 'primary', onclick: roundMillion }, '再挑戰一次'),
        h('button', { onclick: reveal }, '直接看揭曉 →'));
    }
  });
  input.focus({ preventScroll: true });
}

/* ---------- 結算 ---------- */
function reveal() {
  shell.setStep(3);
  const fresh = unlockDex('binary-search');
  saveBuilding('guess', { stars: [...earned], done: true });
  notifyProgress();

  const chain = halvingChain(1_000_000);
  const rows = [100, 1000, 1_000_000, 1_000_000_000].map(n => h('tr', {},
    h('td', {}, `1～${fmt(n)}`), h('td', { class: 'bad' }, `${fmt(n)} 次`), h('td', { class: 'good' }, `${maxGuesses(n)} 次`)));

  const quizBox = h('div');
  const starBox = h('span');
  const starList = h('ul', { class: 'star-list' });
  const refreshStars = () => {
    starBox.replaceChildren(stars(earned.size));
    starList.replaceChildren(...STAR_RULES.map(([key, text]) => h('li', { class: earned.has(key) ? 'got' : '' }, `${earned.has(key) ? '★' : '☆'} ${text}`)));
  };
  refreshStars();

  const scoreLine = [
    firstRoundCount ? `1～100 猜 ${firstRoundCount} 次` : null,
    raceResult?.you ? `比小 AI 少猜 ${raceResult.ai - raceResult.you} 次` : null,
    earned.has('r3') ? '一百萬也猜中了' : null
  ].filter(Boolean).join('　·　');

  shell.finish().replaceChildren(
    h('div', { class: 'result-head' },
      h('div', {},
        h('p', { class: 'eyebrow' }, '過關'),
        h('h2', {}, '教室：終極密碼'),
        scoreLine ? h('p', { class: 'result-score' }, scoreLine) : null),
      starBox),
    h('article', { class: 'reveal' },
      h('p', { class: 'eyebrow' }, '你發現了'),
      h('h2', {}, '每次猜中間，範圍就少一半'),
      h('p', { html: '不管老師說「太大」還是「太小」，猜中間都能排除一半的數字。100 個數最多猜 7 次；100 萬個數，也只要 20 次。這個方法叫做 <strong>二分搜尋（binary search）</strong>。' }),
      h('div', { class: 'chain', 'aria-label': '一百萬個數，每猜一次少一半，猜 20 次前只剩 1 個' },
        chain.flatMap((n, i) => (i ? [h('i', { 'aria-hidden': 'true' }, '→'), h('span', {}, fmt(n))] : [h('span', {}, fmt(n))]))),
      h('div', { class: 'table-scroll' }, h('table', { class: 'compare-table' },
        h('thead', {}, h('tr', {}, h('th', {}, '範圍'), h('th', {}, '小 AI：一個一個猜（最多）'), h('th', {}, '二分搜尋：每次猜中間（最多）'))),
        h('tbody', {}, rows))),
      h('div', { class: 'why' },
        h('p', { class: 'eyebrow' }, '為什麼要學演算法'),
        h('p', { html: '同一個問題，<strong>方法不同，花的資源差很多</strong>。小 AI 的方法沒有錯，只是太浪費。會判斷哪個方法比較省，就算做法是 AI 提出來的，你也知道該不該用。' }))),
    h('div', { class: 'reveal-extra' },
      h('section', { class: 'panel panel-pad' },
        h('div', { class: 'panel-title' }, h('h3', {}, '最後一題'), h('span', {}, '想一想再答')),
        quizBox),
      h('section', { class: 'panel panel-pad' },
        h('div', { class: 'dex-unlock' },
          h('span', { class: 'dex-icon', 'aria-hidden': 'true' }, '🔍'),
          h('div', {}, h('h3', {}, fresh ? '圖鑑解鎖：二分搜尋' : '圖鑑：二分搜尋'), h('p', {}, '每次看中間，範圍就少一半。'))),
        h('div', { class: 'panel-title', style: 'margin:18px 0 0' }, h('h3', {}, '這一關的星星'), h('span', {}, `${earned.size} / 3`)),
        starList,
        h('div', { class: 'action-row' },
          h('a', { class: 'button primary', href: '../modules/binary-search/index.html' }, '會動的演算法：看懂二分搜尋 →'),
          h('button', { type: 'button', onclick: () => exitLevel() }, '← 回小鎮')),
        h('p', { class: 'fine-print' }, '想深入讀：',
          h('a', { href: `${HELLO_ALGO}chapter_searching/binary_search/`, target: '_blank', rel: 'noopener' }, '《Hello 演算法》二分搜尋 ↗')))));

  quiz(quizBox, {
    question: '如果範圍是 1～1,000，用二分搜尋最多要猜幾次？',
    options: ['10 次', '100 次', '500 次'],
    answer: '10 次',
    explain: '1,000 → 500 → 250 → … 砍 10 次一半就剩 1 個（2 的 10 次方是 1,024）。'
  }).then(() => {
    saveBuilding('guess', { stars: [...earned], done: true });
    refreshStars();
    notifyProgress();
  });
}

/** 在小鎮頁面裡展開這一關。 */
export function startGuess(root, { onExit, onProgress } = {}) {
  shell = gameShell(root, {
    icon: '🎉', place: '教室', title: '終極密碼：最少幾次能猜中？',
    steps: STEPS.length, logTitle: '猜的紀錄', onExit
  });
  ({ stage, aiBox, meterBox, log, logCount } = shell);
  notifyProgress = onProgress || (() => {});
  exitLevel = onExit || (() => {});
  earned.clear();
  firstRoundCount = null;
  raceResult = null;
  shell.setStars(0);
  shell.setStep(0);
  shell.briefing({
    lines: [
      '老師心裡想了一個 1～100 的數字。',
      '每猜一次，老師只會回答<b>太大</b>或<b>太小</b>。'
    ],
    goal: '🎯 7 次以內猜中',
    action: '進教室'
  }).then(roundHundred);
}
