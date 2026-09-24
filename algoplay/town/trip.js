// 🧳 旅行社：畢旅路線
import { h, fmt, toast, meter, aiSay, quiz, stars, wait, reducedMotion } from '../core/ui.js';
import { gameShell } from './level-ui.js';
import { saveBuilding, unlockDex } from '../core/progress.js';
import { HELLO_ALGO } from '../core/catalog.js';
import { distanceKm, routeLength, permutations, bestRoute, nearestRoute, factorial, chineseAmount, humanDuration, bruteForceSeconds, firstSpotsOverAYear } from './logic.js';

const STEPS = ['排路線', '小 AI 的方法', '景點變多', '揭曉'];
const STAR_RULES = [['r1', '自己排出最短路線'], ['r3', '找出兩台電腦的極限'], ['quiz', '最後一題一次答對']];
const SCHOOL = { x: 70, y: 330, icon: '🏫', name: '學校' };
const SPOTS = [
  { x: 160, y: 180, icon: '🦒', name: '動物園' },
  { x: 419, y: 88, icon: '⛰️', name: '山上' },
  { x: 252, y: 295, icon: '🏮', name: '老街' },
  { x: 248, y: 91, icon: '🏯', name: '古蹟' },
  { x: 540, y: 193, icon: '🎡', name: '遊樂園' }
];
const NORMAL = 1e8;   // 普通電腦：每秒檢查 1 億條路線
const SUPER = 1e11;   // 超級電腦：再快 1000 倍
const BEST = bestRoute(SCHOOL, SPOTS);

let shell;
let stage;
let aiBox;
let meterBox;
let log;
let logCount;
let notifyProgress = () => {};
let exitLevel = () => {};
const earned = new Set();
let myBest = null;

function earn(key) {
  if (earned.has(key)) return;
  earned.add(key);
  shell.setStars(earned.size);
  saveBuilding('trip', { stars: [...earned], done: false });
}

const goStep = index => shell.setStep(index);

function say(box, tone, html) {
  box.dataset.tone = tone;
  box.innerHTML = html;
  box.hidden = false;
}

const routeIcons = order => order.map(i => SPOTS[i].icon).join('→');
const routeNames = order => ['學校', ...order.map(i => SPOTS[i].name)].join(' → ');

/* ---------- 地圖 ---------- */
const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) if (value !== null && value !== undefined) el.setAttribute(key, value);
  for (const child of children) el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return el;
}

function tripMap(onPick) {
  const roads = s('g');
  const places = [SCHOOL, ...SPOTS];
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      roads.append(s('line', { class: 'road', x1: places[i].x, y1: places[i].y, x2: places[j].x, y2: places[j].y }));
    }
  }
  const aiLayer = s('g');
  const routeLayer = s('g');
  const badgeLayer = s('g');
  const spotEls = SPOTS.map((spot, i) => {
    const g = s('g', { class: 'spot', transform: `translate(${spot.x} ${spot.y})` },
      s('circle', { r: 24 }), s('text', {}, spot.icon), s('text', { class: 'name', y: 40 }, spot.name));
    if (onPick) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', `去${spot.name}`);
      g.addEventListener('click', () => onPick(i));
      g.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPick(i); }
      });
    } else {
      g.style.cursor = 'default';
    }
    return g;
  });
  const home = s('g', { class: 'home', transform: `translate(${SCHOOL.x} ${SCHOOL.y})` },
    s('circle', { r: 22 }), s('text', { class: 'icon' }, SCHOOL.icon), s('text', { class: 'name', y: 38 }, '學校（出發）'));
  const svg = s('svg', { viewBox: '0 0 620 390', class: 'trip-map', role: onPick ? 'group' : 'img', 'aria-label': '畢旅地圖：學校和 5 個景點' },
    roads, aiLayer, routeLayer, home, ...spotEls, badgeLayer);

  function path(order, cls) {
    const points = [SCHOOL, ...order.map(i => SPOTS[i])].map(p => `${p.x},${p.y}`).join(' ');
    return s('polyline', { class: `route ${cls}`, points });
  }

  return {
    svg,
    /** 畫出一條路線，每一段標上公里數。 */
    drawRoute(order, cls = '') {
      routeLayer.replaceChildren();
      badgeLayer.replaceChildren();
      if (!order.length) { spotEls.forEach(g => g.classList.remove('visited')); return; }
      routeLayer.append(path(order, cls));
      let here = SCHOOL;
      order.forEach((index, n) => {
        const spot = SPOTS[index];
        routeLayer.append(s('text', { class: 'edge-km', x: (here.x + spot.x) / 2, y: (here.y + spot.y) / 2 }, `${distanceKm(here, spot)}`));
        badgeLayer.append(s('g', { class: 'order-badge', transform: `translate(${spot.x + 19} ${spot.y - 19})` }, s('circle', { r: 10 }), s('text', {}, n + 1)));
        here = spot;
      });
      spotEls.forEach((g, i) => g.classList.toggle('visited', order.includes(i)));
    },
    drawGhost(order) {
      aiLayer.replaceChildren(order ? path(order, 'ai') : '');
    }
  };
}

/* ---------- 第 1 關：自己排路線 ---------- */
function roundPlan() {
  goStep(0);
  const updateMeter = meter(meterBox, { label: '總距離', budget: BEST.length, unit: '公里', warnAt: 2, note: `最短的路線是 ${BEST.length} 公里，你排得出來嗎？` });
  aiSay(aiBox, '你先排排看。等一下換我，我有<b>一定找得到最短路線</b>的方法！', 'idle');
  let order = [];
  const map = tripMap(pick);
  const status = h('p', { class: 'range-now' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const undo = h('button', { onclick: () => { order.pop(); render(); } }, '↶ 退一步');
  const reset = h('button', { onclick: () => { order = []; feedback.hidden = true; actions.replaceChildren(); render(); } }, '重排');
  const actions = h('div', { class: 'stage-actions' });

  function render() {
    map.drawRoute(order);
    const km = routeLength(SCHOOL, SPOTS, order);
    updateMeter(km);
    const next = SPOTS.length - order.length;
    status.innerHTML = order.length
      ? `${routeNames(order)}，走了 <b>${km}</b> 公里${next ? `，還有 <b>${next}</b> 個景點` : ''}`
      : '從學校出發：依序點景點，排出你的路線。線上的數字是每一段的公里數。';
    undo.disabled = !order.length || order.length === SPOTS.length;
  }

  function pick(index) {
    if (order.length === SPOTS.length) return;
    if (order.includes(index)) { toast(`${SPOTS[index].name}已經去過了`); return; }
    order.push(index);
    render();
    if (order.length === SPOTS.length) finish();
  }

  function finish() {
    const km = routeLength(SCHOOL, SPOTS, order);
    if (myBest === null || km < myBest) myBest = km;
    const good = km === BEST.length;
    if (log.querySelector('.empty')) log.replaceChildren();
    log.append(h('li', { class: good ? 'hit' : '' }, h('span', { class: 'n' }, `#${log.children.length + 1}`), h('span', { class: 'x' }, routeIcons(order)), h('span', { class: 'a' }, `${km} 公里`)));
    logCount.textContent = `${log.children.length} 條`;
    if (good) {
      earn('r1');
      say(feedback, 'good', `🎉 ${km} 公里，就是最短的路線！`);
    } else {
      say(feedback, 'info', `你的路線是 ${km} 公里，最短的是 <b>${BEST.length}</b> 公里。再排排看？`);
    }
    actions.replaceChildren(
      h('button', { class: good ? 'primary' : '', onclick: roundBrute }, '下一步：看小 AI 的方法 →'),
      h('button', { class: good ? '' : 'primary', onclick: () => reset.click() }, '再排一次'));
  }

  log.replaceChildren(h('li', { class: 'empty' }, '還沒有排路線。'));
  logCount.textContent = '';
  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 1 關：排出最短的畢旅路線'), h('span', { class: 'tag accent' }, '資源：距離')),
    map.svg, status, h('div', { class: 'stage-actions' }, undo, reset), feedback, actions);
  render();
}

/* ---------- 第 2 關：小 AI 全部試一遍 ---------- */
function roundBrute() {
  goStep(1);
  const total = Number(factorial(SPOTS.length));
  const updateMeter = meter(meterBox, { label: '小 AI 試過的路線', budget: total, unit: '條', warnAt: 2, note: '5 個景點一共有幾種順序？' });
  aiSay(aiBox, '我的方法一定找得到最短的：<b>把所有順序都試一遍</b>！', 'proud');
  const map = tripMap(null);
  const status = h('p', { class: 'range-now' }, '灰色是小 AI 正在試的路線，藍色是目前找到最短的。');
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const play = h('button', { class: 'primary', onclick: run }, '▶ 讓小 AI 試');
  actions.append(play);
  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 2 關：小 AI 把每種順序都試一遍'), h('span', { class: 'tag' }, '全部試一遍')),
    map.svg, status, actions, feedback);

  async function run() {
    play.disabled = true;
    const delay = reducedMotion() ? 0 : 30;
    let best = null;
    let count = 0;
    for (const order of permutations(SPOTS.length)) {
      count++;
      const km = routeLength(SCHOOL, SPOTS, order);
      if (!best || km < best.km) { best = { order, km }; map.drawRoute(order); }
      map.drawGhost(order);
      updateMeter(count);
      status.innerHTML = `試到第 <b>${count}</b> 條：${routeIcons(order)} ${km} 公里　｜　目前最短 <b>${best.km}</b> 公里`;
      if (delay) await wait(delay);
    }
    map.drawGhost(null);
    map.drawRoute(best.order, 'best');
    status.innerHTML = `最短路線：${routeNames(best.order)}，<b>${best.km}</b> 公里。`;
    const mine = myBest === null ? '' : myBest === best.km ? '和你排的一樣短！' : `你剛剛最短排到 ${myBest} 公里。`;
    say(feedback, 'info', `小 AI 試了 <b>${count}</b> 條路線，保證找到最短的 ${best.km} 公里。${mine}`);
    aiSay(aiBox, `5 個景點只有 ${count} 種順序，一下子就試完了！<br>我的方法<b>保證</b>找到最短的。`, 'proud');
    actions.replaceChildren(h('button', { class: 'primary', onclick: roundExplode }, '下一關：如果景點變多呢？ →'));
  }
}

/* ---------- 第 3 關：景點變多 ---------- */
function roundExplode() {
  goStep(2);
  meterBox.replaceChildren(h('div', { class: 'meter' },
    h('div', { class: 'meter-head' }, h('span', { class: 'meter-label' }, '資源：計算時間')),
    h('p', { class: 'meter-note' }, '普通電腦每秒能檢查 1 億條路線；超級電腦再快 1000 倍。')));
  aiSay(aiBox, '景點多一點也沒關係，我算很快的！<br>……吧？', 'think');

  const slider = h('input', { type: 'range', min: 3, max: 25, value: 5, 'aria-label': '景點數量' });
  const nLabel = h('b', { class: 'big-number' }, '5');
  const routes = h('div', { class: 'v' });
  const routesNote = h('div', { class: 's' });
  const normal = h('div', { class: 'v' });
  const fast = h('div', { class: 'v' });
  const task = h('div', { class: 'quiz' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });

  function render() {
    const n = Number(slider.value);
    nLabel.textContent = n;
    const count = factorial(n);
    routes.textContent = count.toLocaleString('zh-TW');
    routes.classList.toggle('long', routes.textContent.length > 12);
    routesNote.textContent = count >= 10000n ? `${chineseAmount(count)}（${count.toString().length} 位數）` : '';
    const tNormal = bruteForceSeconds(n, NORMAL);
    const tFast = bruteForceSeconds(n, SUPER);
    normal.textContent = humanDuration(tNormal);
    fast.textContent = humanDuration(tFast);
    normal.classList.toggle('hot', tNormal > 3600 * 24 * 365);
    fast.classList.toggle('hot', tFast > 3600 * 24 * 365);
  }
  slider.addEventListener('input', render);

  const goals = [
    { speed: NORMAL, name: '普通電腦' },
    { speed: SUPER, name: '超級電腦' }
  ];
  let goal = 0;
  let allFound = true;
  function showTask() {
    const { name } = goals[goal];
    task.replaceChildren(
      h('p', { class: 'quiz-q' }, `任務 ${goal + 1}：景點至少要幾個，${name}就要算超過 1 年？拉動上面的滑桿，找到後按下按鈕。`),
      h('div', { class: 'quiz-options' }, h('button', { class: 'primary', onclick: check }, '就是這個數字！'), h('button', { onclick: giveUp }, '看答案')));
  }
  function check() {
    const { speed, name } = goals[goal];
    const answer = firstSpotsOverAYear(speed);
    const n = Number(slider.value);
    if (n === answer) {
      say(feedback, 'good', `✓ 對！${n} 個景點，${name}要算 ${humanDuration(bruteForceSeconds(n, speed))}；少一個只要 ${humanDuration(bruteForceSeconds(n - 1, speed))}。`);
      advance();
    } else if (n < answer) {
      say(feedback, 'bad', `${n} 個景點，${name}只要 ${humanDuration(bruteForceSeconds(n, speed))}，還不到 1 年。再多加幾個景點。`);
    } else {
      say(feedback, 'bad', `${n} 個景點確實超過 1 年，但更少的景點數也已經超過了。往回拉一點，找「剛好超過」的那一個。`);
    }
  }
  function giveUp() {
    allFound = false;
    const { speed, name } = goals[goal];
    const answer = firstSpotsOverAYear(speed);
    slider.value = answer;
    render();
    say(feedback, 'info', `答案是 ${answer} 個景點：${name}要算 ${humanDuration(bruteForceSeconds(answer, speed))}。`);
    advance();
  }
  function advance() {
    goal++;
    if (goal < goals.length) { showTask(); return; }
    if (allFound) earn('r3');
    const a = firstSpotsOverAYear(NORMAL);
    const b = firstSpotsOverAYear(SUPER);
    task.replaceChildren();
    aiSay(aiBox, `電腦快了 1000 倍……也只從 ${a} 個景點多撐到 ${b} 個。`, 'shock');
    actions.replaceChildren(h('button', { class: 'primary', onclick: reveal }, '揭曉：問題出在哪裡？ →'));
  }

  stage.replaceChildren(
    h('div', { class: 'stage-top' }, h('h2', {}, '第 3 關：景點變多了'), h('span', { class: 'tag amber' }, '資源：計算時間')),
    h('div', { class: 'explode' },
      h('div', { class: 'explode-controls' }, h('label', {}, '景點數量', slider, nLabel, '個')),
      h('div', { class: 'explode-stats' },
        h('div', { class: 'stat' }, h('div', { class: 'k' }, '路線有幾種順序'), routes, routesNote),
        h('div', { class: 'stat' }, h('div', { class: 'k' }, '普通電腦要算'), normal, h('div', { class: 's' }, '每秒 1 億條')),
        h('div', { class: 'stat' }, h('div', { class: 'k' }, '超級電腦要算'), fast, h('div', { class: 's' }, '再快 1000 倍')))),
    task, feedback, actions);
  render();
  showTask();
}

/* ---------- 揭曉 ---------- */
function reveal() {
  goStep(3);
  const fresh = unlockDex('brute-force');
  saveBuilding('trip', { stars: [...earned], done: true });
  const nearest = nearestRoute(SCHOOL, SPOTS);

  const rows = [5, 10, 15, 20, 25].map(n => h('tr', {},
    h('td', {}, `${n} 個景點`),
    h('td', {}, factorial(n) >= 10000n ? chineseAmount(factorial(n)) : fmt(Number(factorial(n)))),
    h('td', { class: bruteForceSeconds(n, NORMAL) > 3.15e7 ? 'bad' : '' }, humanDuration(bruteForceSeconds(n, NORMAL))),
    h('td', { class: bruteForceSeconds(n, SUPER) > 3.15e7 ? 'bad' : '' }, humanDuration(bruteForceSeconds(n, SUPER)))));

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
      h('div', {}, h('p', { class: 'eyebrow' }, '過關'), h('h2', {}, '旅行社：畢旅路線')),
      starBox),
    h('article', { class: 'reveal' },
      h('p', { class: 'eyebrow' }, '你發現了'),
      h('h2', {}, '電腦再快，也救不了太笨的方法'),
      h('p', { html: '小 AI 把所有順序都試一遍，這種方法叫做<strong>窮舉</strong>（也叫暴力搜尋）。它保證找到最好的答案，但 n 個景點有 n × (n − 1) × … × 1 種順序，景點一多，數量就爆炸了。書上把這種成長寫成 <strong>O(n!)</strong>，叫做「階乘階」。' }),
      h('p', { html: `所以我們需要更聰明的方法。像「每次都去最近的景點」就快多了，但它是貪婪的做法：在這張地圖上它會走 ${nearest.length} 公里，不是最短的 ${BEST.length} 公里。這種「走遍所有地點」的路線問題，到現在都還沒有人找到<strong>又快、又保證最短</strong>的方法，是電腦科學最有名的難題之一。` }),
      h('div', { class: 'table-scroll' }, h('table', { class: 'compare-table' },
        h('thead', {}, h('tr', {}, h('th', {}, '景點'), h('th', {}, '順序有幾種'), h('th', {}, '普通電腦'), h('th', {}, '超級電腦（快 1000 倍）'))),
        h('tbody', {}, rows))),
      h('div', { class: 'why' },
        h('p', { class: 'eyebrow' }, '為什麼要學演算法'),
        h('p', { html: '<strong>好的方法，比更快的電腦更重要。</strong>AI 也是跑在電腦上，一樣逃不過組合爆炸。知道哪些問題會爆炸，才知道什麼時候該換方法。' }))),
    h('div', { class: 'reveal-extra' },
      h('section', { class: 'panel panel-pad' },
        h('div', { class: 'panel-title' }, h('h3', {}, '最後一題'), h('span', {}, '一次答對可以拿一顆星')),
        quizBox),
      h('section', { class: 'panel panel-pad' },
        h('div', { class: 'dex-unlock' },
          h('span', { class: 'dex-icon', 'aria-hidden': 'true' }, '🧮'),
          h('div', {}, h('h3', {}, fresh ? '圖鑑解鎖：窮舉' : '圖鑑：窮舉'), h('p', {}, '把所有可能都試一遍，保證找到，但可能算不完。'))),
        h('div', { class: 'panel-title', style: 'margin:18px 0 0' }, h('h3', {}, '這一關的星星'), countBox),
        starList,
        h('div', { class: 'action-row' },
          h('button', { class: 'primary', type: 'button', onclick: () => exitLevel() }, '← 回小鎮'),
          h('button', { disabled: true, title: '模組製作中' }, '會動的演算法：窮舉與回溯（製作中）')),
        h('p', { class: 'fine-print' }, '想深入讀：',
          h('a', { href: `${HELLO_ALGO}chapter_computational_complexity/time_complexity/`, target: '_blank', rel: 'noopener' }, '《Hello 演算法》時間複雜度 ↗'),
          '、',
          h('a', { href: `${HELLO_ALGO}chapter_backtracking/permutations_problem/`, target: '_blank', rel: 'noopener' }, '全排列問題 ↗')))));

  quiz(quizBox, {
    question: '6 個景點，一共有幾種順序？',
    options: ['36 種', '720 種', '6 種'],
    answer: '720 種',
    explain: '第 1 站有 6 種選法，第 2 站剩 5 種……6 × 5 × 4 × 3 × 2 × 1 ＝ 720。'
  }).then(firstTry => {
    if (firstTry) earn('quiz');
    saveBuilding('trip', { stars: [...earned], done: true });
    refreshStars();
    notifyProgress();
  });
}

/** 在小鎮頁面裡展開這一關。 */
export function startTrip(root, { onExit, onProgress } = {}) {
  shell = gameShell(root, {
    icon: '🧳', place: '旅行社', title: '畢旅路線：哪條路最短？',
    steps: STEPS.length, logTitle: '路線紀錄', onExit
  });
  ({ stage, aiBox, meterBox, log, logCount } = shell);
  notifyProgress = onProgress || (() => {});
  exitLevel = onExit || (() => {});
  earned.clear();
  myBest = null;
  shell.setStars(0);
  shell.setStep(0);
  shell.briefing({
    lines: [
      '畢業旅行要從學校出發，把 5 個景點都走一遍。',
      '順序由你決定：<b>路線越短</b>，坐車的時間就越少，玩的時間就越多。'
    ],
    goal: '🎯 排出最短的那一條路線',
    action: '出發'
  }).then(() => roundPlan());
}
