// 🏪 便利商店：找零錢
import { h, meter, aiSay, quiz, stars, wait, reducedMotion } from '../core/ui.js';
import { gameShell } from './level-ui.js';
import { aiAvatar } from '../core/cast.js';
import { saveBuilding, unlockDex } from '../core/progress.js';
import { HELLO_ALGO } from '../core/catalog.js';
import { greedyChange, minChange } from './logic.js';

const STEPS = ['當店員', '小 AI 的祕訣', '夜市代幣', '揭曉'];
const STAR_RULES = [['r1', '台幣找零都用最少的硬幣'], ['r3', '在夜市找出小 AI 的反例'], ['quiz', '最後一題一次答對']];
const NT_COINS = [50, 10, 5, 1];
const CUSTOMERS = [
  { who: '🧑‍🎓', what: '飯糰和牛奶', price: 13, paid: 100 },
  { who: '👵', what: '報紙和口香糖', price: 64, paid: 100 }
];
const PUZZLES = [
  { tokens: [4, 3, 1], target: 6 },
  { tokens: [9, 6, 5, 1], target: 11 }
];

let shell;
let stage;
let aiBox;
let meterBox;
let log;
let logCount;
let notifyProgress = () => {};
let exitLevel = () => {};
const earned = new Set();

function earn(key) {
  if (earned.has(key)) return;
  earned.add(key);
  shell.setStars(earned.size);
  saveBuilding('coins', { stars: [...earned], done: false });
}

const goStep = index => shell.setStep(index);

function say(box, tone, html) {
  box.dataset.tone = tone;
  box.innerHTML = html;
  box.hidden = false;
}

function addLog(text, good) {
  if (log.querySelector('.empty')) log.replaceChildren();
  log.append(h('li', { class: good ? 'hit' : '' }, h('span', { class: 'n' }, `#${log.children.length + 1}`), h('span', { class: 'x' }, text), h('span', { class: 'a' }, good ? '最少 ✓' : '')));
  log.scrollTop = log.scrollHeight;
  logCount.textContent = `${log.children.length} 次`;
}

function coinEl(value, kind, attrs = {}) {
  const cls = kind === 'token' ? 'coin token' : value === 5 || value === 10 ? 'coin silver' : 'coin';
  return h(attrs.onclick ? 'button' : 'span', { type: attrs.onclick ? 'button' : null, class: cls, ...attrs },
    String(value), h('small', {}, kind === 'token' ? '點' : '元'));
}

const joinCoins = list => list.join('＋');

/**
 * 湊零錢的操作區：點上方硬幣放進托盤，點托盤裡的硬幣拿回來。
 * onDone(picked) 在按下「找好了」且金額剛好時呼叫。
 */
function changeMaker({ coins, target, kind, updateMeter, onDone }) {
  const unit = kind === 'token' ? '點' : '元';
  let picked = [];
  const tray = h('div', { class: 'tray', 'aria-label': '托盤：點硬幣可以拿回來' });
  const sum = h('div', { class: 'tray-sum', role: 'status' });
  const done = h('button', { class: 'primary', onclick: () => onDone([...picked]) }, '找好了');
  const clear = h('button', { onclick: () => { picked = []; render(); } }, '清空');
  const palette = h('div', { class: 'coin-row', role: 'group', 'aria-label': '可以用的硬幣' },
    coins.map(value => coinEl(value, kind, { 'aria-label': `放入 ${value} ${unit}`, onclick: () => { picked.push(value); render(); } })));

  function render() {
    picked.sort((a, b) => b - a);
    tray.replaceChildren(...(picked.length
      ? picked.map((value, i) => coinEl(value, kind, { 'aria-label': `拿回 ${value} ${unit}`, onclick: () => { picked.splice(i, 1); render(); } }))
      : [h('span', { class: 'tray-empty' }, '點上面的硬幣，放進托盤')]));
    const total = picked.reduce((a, b) => a + b, 0);
    const over = total > target;
    sum.innerHTML = `<span>已經湊了 <b class="${over ? 'over' : ''}">${total}</b> / ${target} ${unit}${over ? '（超過了！）' : ''}</span><span>用了 <b>${picked.length}</b> 枚</span>`;
    done.disabled = total !== target;
    updateMeter?.(picked.length);
  }
  render();
  const root = h('div', { style: 'display:grid;gap:14px' }, palette, tray, sum, h('div', { class: 'stage-actions' }, done, clear));
  return { root, reset: () => { picked = []; render(); }, lock: () => { root.querySelectorAll('button').forEach(b => { b.disabled = true; }); } };
}

/* ---------- 第 1 關：當店員（台幣） ---------- */
function roundShop(index = 0, allBest = true) {
  goStep(0);
  if (index === 0) { log.replaceChildren(h('li', { class: 'empty' }, '還沒有找零。')); logCount.textContent = ''; }
  const customer = CUSTOMERS[index];
  const target = customer.paid - customer.price;
  const best = minChange(NT_COINS, target);
  const updateMeter = meter(meterBox, { label: '硬幣數量', budget: best.length, unit: '枚', note: `目標：用最少的硬幣。最少可以只用 ${best.length} 枚。` });
  aiSay(aiBox, index === 0 ? '我在旁邊看你找錢。等一下，我要告訴你<b>我的祕訣</b>！' : '再一位客人！', 'idle');

  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const maker = changeMaker({
    coins: NT_COINS, target, kind: 'nt', updateMeter,
    onDone(picked) {
      const good = picked.length === best.length;
      addLog(`${target} 元：${joinCoins(picked)}`, good);
      if (good) {
        maker.lock();
        say(feedback, 'good', `✓ 用了 ${picked.length} 枚，就是最少！`);
        next(allBest);
      } else {
        say(feedback, 'bad', `湊對了，但用了 ${picked.length} 枚。最少只要 <b>${best.length}</b> 枚喔，再試試看？`);
        actions.replaceChildren(
          h('button', { class: 'primary', onclick: () => { maker.reset(); feedback.hidden = true; actions.replaceChildren(); } }, '再試一次'),
          h('button', { onclick: () => { maker.lock(); say(feedback, 'info', `最少的找法：${joinCoins(best)}（${best.length} 枚）`); next(false); } }, '看答案'));
      }
    }
  });

  function next(stillBest) {
    const last = index === CUSTOMERS.length - 1;
    if (last && stillBest) earn('r1');
    actions.replaceChildren(last
      ? h('button', { class: 'primary', onclick: roundGreedy }, '下一步：聽小 AI 的祕訣 →')
      : h('button', { class: 'primary', onclick: () => roundShop(index + 1, stillBest) }, '下一位客人 →'));
  }

  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, `第 1 關：當店員（第 ${index + 1} / ${CUSTOMERS.length} 位客人）`), h('span', { class: 'tag accent' }, '資源：硬幣數量')),
    h('div', { class: 'shop-scene' }, h('span', { class: 'who', 'aria-hidden': 'true' }, customer.who),
      h('p', { html: `客人買了${customer.what} <b>${customer.price}</b> 元，付了 <b>${customer.paid}</b> 元。<br>要找 <b>${target}</b> 元。` })),
    maker.root, feedback, actions);
}

/* ---------- 第 2 關：小 AI 的祕訣 ---------- */
function roundGreedy() {
  goStep(1);
  const target = CUSTOMERS[0].paid - CUSTOMERS[0].price;
  const updateMeter = meter(meterBox, { label: '小 AI 用的硬幣', budget: minChange(NT_COINS, target).length, unit: '枚', note: '和最少的比一比。' });
  aiSay(aiBox, '我發現祕訣了：<b>每次都先拿最大的硬幣</b>，拿不下了，再換小一點的！', 'proud');

  const tray = h('div', { class: 'tray' }, h('span', { class: 'tray-empty' }, '小 AI 的托盤'));
  const thinking = h('ol', { class: 'guess-log', 'aria-label': '小 AI 的想法' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const play = h('button', { class: 'primary', onclick: run }, `▶ 讓小 AI 找 ${target} 元`);
  actions.append(play);
  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 2 關：小 AI 的祕訣'), h('span', { class: 'tag' }, '每次拿最大的')),
    h('div', { class: 'shop-scene' }, aiAvatar({ size: 46, mood: 'proud' }).el, h('p', { html: `一樣是找 <b>${target}</b> 元，看小 AI 怎麼找。` })),
    tray, thinking, actions, feedback);

  async function run() {
    play.disabled = true;
    tray.replaceChildren();
    let left = target;
    const delay = reducedMotion() ? 0 : 450;
    for (const coin of greedyChange(NT_COINS, target)) {
      const before = left;
      left -= coin;
      tray.append(coinEl(coin, 'nt'));
      thinking.append(h('li', {}, h('span', { class: 'n' }, `${before}`), h('span', { class: 'x' }, `還要 ${before} 元，最大能拿 ${coin} 元`), h('span', { class: 'a' }, `剩 ${left}`)));
      updateMeter(tray.children.length);
      if (delay) await wait(delay);
    }
    say(feedback, 'info', `小 AI 用了 <b>${tray.children.length}</b> 枚，和最少的一樣！`);
    aiSay(aiBox, '看吧！我的方法<b>永遠</b>都是最少的！', 'proud');
    actions.replaceChildren(
      h('p', { class: 'quiz-q', style: 'width:100%' }, '你相信小 AI 說的「永遠」嗎？'),
      h('button', { onclick: () => roundNightMarket('那我們去夜市試試看，看它是不是永遠都對。') }, '相信'),
      h('button', { onclick: () => roundNightMarket('好，我們去夜市找找看，有沒有它會出錯的時候。') }, '不一定'));
  }
}

/* ---------- 第 3 關：夜市代幣，找出反例 ---------- */
function roundNightMarket(intro, index = 0) {
  goStep(2);
  const { tokens, target } = PUZZLES[index];
  const ai = greedyChange(tokens, target);
  const best = minChange(tokens, target);
  const updateMeter = meter(meterBox, { label: '你用的代幣', budget: ai.length - 1, unit: '枚', note: `要比小 AI 的 ${ai.length} 枚更少。` });
  aiSay(aiBox, index === 0
    ? `${intro ? intro + '<br>' : ''}夜市的代幣我也會！每次拿最大的：${joinCoins(ai)}，<b>${ai.length} 枚</b>，一定最少！`
    : `換一攤試試。每次拿最大的：${joinCoins(ai)}，<b>${ai.length} 枚</b>。這次一定最少了吧！`);

  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const maker = changeMaker({
    coins: tokens, target, kind: 'token', updateMeter,
    onDone(picked) {
      addLog(`${target} 點：${joinCoins(picked)}`, picked.length < ai.length);
      if (picked.length < ai.length) {
        maker.lock();
        say(feedback, 'good', `🎉 你只用了 ${picked.length} 枚，比小 AI 的 ${ai.length} 枚還少！你找到<b>反例</b>了。`);
        finish(true);
      } else {
        say(feedback, 'bad', `用了 ${picked.length} 枚，${picked.length === ai.length ? '和小 AI 一樣多' : '比小 AI 還多'}。有沒有不從最大的開始拿的湊法？`);
        actions.replaceChildren(
          h('button', { class: 'primary', onclick: () => { maker.reset(); feedback.hidden = true; actions.replaceChildren(); } }, '再試一次'),
          h('button', { onclick: () => { maker.lock(); say(feedback, 'info', `更少的湊法：${joinCoins(best)}（${best.length} 枚）。小 AI 一開始就拿了最大的 ${ai[0]}，反而湊不漂亮。`); finish(false); } }, '看答案'));
      }
    }
  });

  function finish(found) {
    const last = index === PUZZLES.length - 1;
    if (found && last) earn('r3');
    if (last) aiSay(aiBox, '……我說得那麼有自信，結果<b>是錯的</b>。', 'shock');
    actions.replaceChildren(last
      ? h('button', { class: 'primary', onclick: reveal }, '揭曉：小 AI 錯在哪裡？ →')
      : h('button', { class: 'primary', onclick: () => roundNightMarket('', index + 1) }, '再一攤 →'));
  }

  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, `第 3 關：夜市代幣（第 ${index + 1} / ${PUZZLES.length} 攤）`), h('span', { class: 'tag amber' }, '找出反例')),
    h('div', { class: 'shop-scene' }, h('span', { class: 'who', 'aria-hidden': 'true' }, '🎯'),
      h('p', { html: `這攤的代幣只有 <b>${tokens.join('、')}</b> 點。你贏了 <b>${target}</b> 點，要換成代幣。<br>你能用<strong>比小 AI 更少</strong>的代幣湊出 ${target} 點嗎？` })),
    h('div', { class: 'vs-row' },
      h('div', { class: 'vs-card' }, h('h3', {}, aiAvatar({ size: 26, mood: 'proud' }).el, '小 AI：每次拿最大的'), h('div', { class: 'coins-inline' }, ai.map(v => coinEl(v, 'token'))), h('p', { class: 'count' }, `${ai.length} 枚`)),
      h('div', { class: 'vs-card' }, h('h3', {}, '🙋 你的湊法'), maker.root)),
    feedback, actions);
}

/* ---------- 揭曉 ---------- */
function reveal() {
  goStep(3);
  const fresh = unlockDex('greedy');
  saveBuilding('coins', { stars: [...earned], done: true });
  notifyProgress();

  const cases = [
    ['台幣找 87 元', NT_COINS, 87],
    ['代幣 1、3、4 點，找 6 點', PUZZLES[0].tokens, 6],
    ['代幣 1、5、6、9 點，找 11 點', PUZZLES[1].tokens, 11]
  ].map(([name, coins, amount]) => {
    const g = greedyChange(coins, amount);
    const b = minChange(coins, amount);
    const same = g.length === b.length;
    return h('tr', {}, h('td', {}, name),
      h('td', { class: same ? 'good' : 'bad' }, `${g.length} 枚（${joinCoins(g)}）`),
      h('td', { class: 'good' }, `${b.length} 枚（${joinCoins(b)}）`));
  });

  const quizBox = h('div');
  const starBox = h('span');
  const countBox = h('span');
  const starList = h('ul', { class: 'star-list' });
  const refreshStars = () => {
    starBox.replaceChildren(stars(earned.size));
    countBox.textContent = `${earned.size} / ${STAR_RULES.length}`;
    starList.replaceChildren(...STAR_RULES.map(([key, text]) => h('li', { class: earned.has(key) ? 'got' : '' }, `${earned.has(key) ? '★' : '☆'} ${text}`)));
  };
  refreshStars();

  shell.finish().replaceChildren(
    h('div', { class: 'result-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, '過關'), h('h2', {}, '便利商店：找零錢')),
      starBox),
    h('article', { class: 'reveal' },
      h('p', { class: 'eyebrow' }, '你發現了'),
      h('h2', {}, '直覺的方法，不一定對'),
      h('p', { html: '「每次都先拿最大的」這種<strong>每一步只挑眼前最好的</strong>做法，叫做<strong>貪婪演算法（greedy）</strong>。它又快又簡單，台灣的硬幣（1、5、10、50 元）剛好每次都對；換一組代幣，就可能出錯。' }),
      h('p', { html: '要確定答案真的最少，不能只靠「聽起來很有道理」：要能<strong>證明</strong>它是對的，或改用更仔細的方法，例如之後會學到的<strong>動態規劃</strong>。' }),
      h('div', { class: 'table-scroll' }, h('table', { class: 'compare-table' },
        h('thead', {}, h('tr', {}, h('th', {}, '情況'), h('th', {}, '小 AI：每次拿最大的'), h('th', {}, '最少的找法'))),
        h('tbody', {}, cases))),
      h('div', { class: 'why' },
        h('p', { class: 'eyebrow' }, '為什麼要學演算法'),
        h('p', { html: '「聽起來很有道理」不等於「是對的」。小 AI 說得很有自信，但<strong>一個反例就能推翻它</strong>。懂演算法，你才有能力檢查別人（包括 AI）給你的答案。' }))),
    h('div', { class: 'reveal-extra' },
      h('section', { class: 'panel panel-pad' },
        h('div', { class: 'panel-title' }, h('h3', {}, '最後一題'), h('span', {}, '一次答對可以拿一顆星')),
        quizBox),
      h('section', { class: 'panel panel-pad' },
        h('div', { class: 'dex-unlock' },
          h('span', { class: 'dex-icon', 'aria-hidden': 'true' }, '🪙'),
          h('div', {}, h('h3', {}, fresh ? '圖鑑解鎖：貪婪演算法' : '圖鑑：貪婪演算法'), h('p', {}, '每一步都先拿眼前最好的，但不一定對。'))),
        h('div', { class: 'panel-title', style: 'margin:18px 0 0' }, h('h3', {}, '這一關的星星'), countBox),
        starList,
        h('div', { class: 'action-row' },
          h('button', { class: 'primary', type: 'button', onclick: () => exitLevel() }, '← 回小鎮'),
          h('button', { disabled: true, title: '模組製作中' }, '會動的演算法：貪婪演算法（製作中）')),
        h('p', { class: 'fine-print' }, '想深入讀：',
          h('a', { href: `${HELLO_ALGO}chapter_greedy/greedy_algorithm/`, target: '_blank', rel: 'noopener' }, '《Hello 演算法》貪婪演算法 ↗'),
          '、',
          h('a', { href: `${HELLO_ALGO}chapter_dynamic_programming/unbounded_knapsack_problem/`, target: '_blank', rel: 'noopener' }, '零錢兌換問題 ↗'),
          h('br'), '想練習：', h('a', { href: '../../judge.html' }, 'ThinkLab 題目列表'), ' 搜尋「192 最少硬幣數」'))));

  quiz(quizBox, {
    question: '代幣有 1、4、5 點，要找 8 點。小 AI（每次拿最大的）會用幾枚？',
    options: ['2 枚', '4 枚', '8 枚'],
    answer: '4 枚',
    explain: '5＋1＋1＋1，一共 4 枚；但其實 4＋4 只要 2 枚。又一個反例！'
  }).then(firstTry => {
    if (firstTry) earn('quiz');
    saveBuilding('coins', { stars: [...earned], done: true });
    refreshStars();
    notifyProgress();
  });
}

/** 在小鎮頁面裡展開這一關。 */
export function startCoins(root, { onExit, onProgress } = {}) {
  shell = gameShell(root, {
    icon: '🏪', place: '便利商店', title: '找零錢：怎樣用最少的硬幣？',
    steps: STEPS.length, logTitle: '找零紀錄', onExit
  });
  ({ stage, aiBox, meterBox, log, logCount } = shell);
  notifyProgress = onProgress || (() => {});
  exitLevel = onExit || (() => {});
  earned.clear();
  shell.setStars(0);
  shell.setStep(0);
  shell.briefing({
    lines: [
      '你今天在便利商店打工。',
      '客人付錢後要找零給他：<b>硬幣越少越好</b>，客人的錢包才不會塞滿零錢。'
    ],
    goal: '🎯 每一筆都用最少的硬幣',
    action: '開店'
  }).then(() => roundShop());
}
