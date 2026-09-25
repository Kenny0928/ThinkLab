// 🧳 旅行社：畢旅路線
// 這一關的重點不是「排出最短路線」，而是「比較方法」：
// 兩個看起來都很合理的規則都找不到最短路線，那只好全部試一遍——然後撞上組合爆炸。
import { h, fmt, toast, meter, aiSay, quiz, stars, wait, reducedMotion } from '../core/ui.js';
import { gameShell } from './level-ui.js';
import { saveBuilding, saveModule, loadProgress, unlockDex } from '../core/progress.js';
import { HELLO_ALGO } from '../core/catalog.js';
import {
  distanceKm, routeLength, bestRoute, nearestRoute, sweepRoute,
  bruteForceRunner, randomTripMap, factorial, chineseAmount, humanDuration,
  bruteForceSeconds, firstSpotsOverAYear
} from './logic.js';

const STEPS = ['比方法', '只有一次機會', '全部試一遍', '揭曉'];
const STAR_RULES = [
  ['r1', '只有一次機會時，排出比兩個方法都短的路線'],
  ['r3', '找出讓電腦算超過一年的景點數'],
  ['quiz', '最後一題一次答對']
];

const SCHOOL = { x: 70, y: 330, icon: '🏫', name: '學校' };
const MAP_AREA = { x0: 95, x1: 540, y0: 70, y1: 315, gap: 100 };

/** 練習地圖：最短 79 公里（唯一），每次去最近的 100，繞一圈 92。 */
const MAP_A = [
  { x: 124, y: 169, icon: '🦒', name: '動物園' },
  { x: 229, y: 299, icon: '🏮', name: '老街' },
  { x: 317, y: 141, icon: '⛰️', name: '山上' },
  { x: 323, y: 257, icon: '🏯', name: '古蹟' },
  { x: 540, y: 171, icon: '🎡', name: '遊樂園' }
];

/** 驗收地圖：最短 82 公里（唯一），每次去最近的 112，繞一圈 104。只能交一次。 */
const MAP_B = [
  { x: 344, y: 149, icon: '💧', name: '瀑布' },
  { x: 271, y: 278, icon: '♨️', name: '溫泉' },
  { x: 515, y: 312, icon: '🏖️', name: '海邊' },
  { x: 193, y: 214, icon: '🌃', name: '夜市' },
  { x: 96, y: 128, icon: '🐄', name: '牧場' }
];

/**
 * 第 3 關要把景點加到 15 個。景點多的時候只畫小圓點，所以間距只要 68 就夠。
 * 15 個景點有 1.3 兆種順序：進度條會卡在 0.0%，這一關要的就是這個。
 */
const EXTRA_SPOTS = [
  { x: 392, y: 308 }, { x: 481, y: 80 }, { x: 237, y: 166 }, { x: 478, y: 259 }, { x: 141, y: 295 },
  { x: 389, y: 229 }, { x: 211, y: 229 }, { x: 391, y: 154 }, { x: 126, y: 101 }, { x: 472, y: 184 }
];
const spotsFor = n => [...MAP_A, ...EXTRA_SPOTS].slice(0, n);
const COUNT_LADDER = [5, 8, 11, 13, 15];

/** 隨機挑戰地圖用的名字。 */
const PLACE_POOL = [
  { icon: '🦒', name: '動物園' }, { icon: '🏮', name: '老街' }, { icon: '⛰️', name: '山上' },
  { icon: '🏯', name: '古蹟' }, { icon: '🎡', name: '遊樂園' }, { icon: '💧', name: '瀑布' },
  { icon: '♨️', name: '溫泉' }, { icon: '🏖️', name: '海邊' }, { icon: '🌃', name: '夜市' },
  { icon: '🐄', name: '牧場' }, { icon: '🛕', name: '廟口' }, { icon: '🌳', name: '森林' }
];

/**
 * 兩個聽起來都很合理的方法。學生要親手看它們跑，才會知道它們的極限在哪裡。
 * describe 是每一步的旁白：規則正在想什麼。
 */
const RULES = [
  {
    id: 'near', icon: '🎯', name: '每次去最近的',
    hint: '站在哪裡，就去還沒去過的裡面離現在最近的那一個。',
    solve: nearestRoute,
    describe: (spots, order, step) => {
      const to = spots[order[step]];
      const km = step === 0 ? distanceKm(SCHOOL, to) : distanceKm(spots[order[step - 1]], to);
      const from = step === 0 ? '學校' : spots[order[step - 1]].name;
      return `在${from}，還沒去的裡面 <b>${to.name}</b> 最近（${km} 公里），就去那裡。`;
    }
  },
  {
    id: 'loop', icon: '🔄', name: '照地圖繞一圈',
    hint: '照著地圖上的位置繞一圈，不走回頭路。',
    solve: sweepRoute,
    describe: (spots, order, step) => {
      const to = spots[order[step]];
      const km = step === 0 ? distanceKm(SCHOOL, to) : distanceKm(spots[order[step - 1]], to);
      return `繞下去，下一個是 <b>${to.name}</b>（${km} 公里）。`;
    }
  }
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
let myBest = null;      // 學生在練習地圖上排出的最短距離
let myGuess = null;     // 第 1 關押的注
let measuredRate = 0;   // 這台電腦實測每秒能試幾條路線
let biggestRun = 0;     // 學生實際讓小 AI 跑過最多幾個景點

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

const routeIcons = (spots, order) => order.map(i => spots[i].icon).join('→');
const routeNames = (spots, order) => ['學校', ...order.map(i => spots[i].name)].join(' → ');

let logUnit = '條';

/** 紀錄欄的一列。value 已經含單位，因為每一關記的東西不一樣。 */
function addLog(text, value, good) {
  if (log.querySelector('.empty')) log.replaceChildren();
  log.append(h('li', { class: good ? 'hit' : '' },
    h('span', { class: 'n' }, `#${log.children.length + 1}`),
    h('span', { class: 'x' }, text),
    h('span', { class: 'a' }, value)));
  log.scrollTop = log.scrollHeight;
  logCount.textContent = `${log.children.length} ${logUnit}`;
}

function resetLog(empty = '還沒有排路線。', unit = '條') {
  logUnit = unit;
  log.replaceChildren(h('li', { class: 'empty' }, empty));
  logCount.textContent = '';
}

/* ---------- 地圖 ---------- */
const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) if (value !== null && value !== undefined) el.setAttribute(key, value);
  for (const child of children) el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return el;
}

/**
 * 一張畢旅地圖。onPick 給了才能點景點。
 * bare 用在景點很多的時候：只畫圓點，不畫名字，不然會糊成一團。
 */
function tripMap(spots, { onPick = null, bare = false } = {}) {
  const roads = s('g');
  if (!bare) {
    const places = [SCHOOL, ...spots];
    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        roads.append(s('line', { class: 'road', x1: places[i].x, y1: places[i].y, x2: places[j].x, y2: places[j].y }));
      }
    }
  }
  const ghostLayer = s('g');
  const routeLayer = s('g');
  const badgeLayer = s('g');

  const spotEls = spots.map((spot, i) => {
    const g = s('g', { class: bare ? 'spot bare' : 'spot', transform: `translate(${spot.x} ${spot.y})` },
      s('circle', { r: bare ? 13 : 24 }),
      bare ? '' : s('text', {}, spot.icon),
      bare ? '' : s('text', { class: 'name', y: 40 }, spot.name));
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
    s('circle', { r: 22 }), s('text', { class: 'icon' }, SCHOOL.icon),
    bare ? '' : s('text', { class: 'name', y: 38 }, '學校（出發）'));

  const svg = s('svg', {
    viewBox: '0 0 620 390', class: 'trip-map',
    role: onPick ? 'group' : 'img',
    'aria-label': `畢旅地圖：學校和 ${spots.length} 個景點`
  }, roads, ghostLayer, routeLayer, home, ...spotEls, badgeLayer);

  const polyline = (order, cls) => s('polyline', {
    class: `route ${cls}`,
    points: [SCHOOL, ...order.map(i => spots[i])].map(p => `${p.x},${p.y}`).join(' ')
  });

  return {
    svg,
    /** 畫一條路線，每一段標上公里數、每個景點標上第幾站。 */
    drawRoute(order, cls = '', { km = true } = {}) {
      routeLayer.replaceChildren();
      badgeLayer.replaceChildren();
      if (!order.length) { spotEls.forEach(g => g.classList.remove('visited')); return; }
      routeLayer.append(polyline(order, cls));
      let here = SCHOOL;
      order.forEach((index, n) => {
        const spot = spots[index];
        if (km && !bare) {
          routeLayer.append(s('text', {
            class: 'edge-km', x: (here.x + spot.x) / 2, y: (here.y + spot.y) / 2
          }, `${distanceKm(here, spot)}`));
        }
        if (!bare) {
          badgeLayer.append(s('g', { class: 'order-badge', transform: `translate(${spot.x + 19} ${spot.y - 19})` },
            s('circle', { r: 10 }), s('text', {}, n + 1)));
        }
        here = spot;
      });
      spotEls.forEach((g, i) => g.classList.toggle('visited', order.includes(i)));
    },
    /** 淡淡的第二條線，用來把兩個方法擺在一起比。 */
    drawGhost(order, cls = 'ai') {
      ghostLayer.replaceChildren(order && order.length ? polyline(order, cls) : '');
    },
    /** 標出「角色現在站在哪裡」。 */
    standAt(index) {
      spotEls.forEach((g, i) => g.classList.toggle('now', i === index));
    }
  };
}

/* ---------- 第 1 關：比方法 ---------- */
function roundCompare() {
  goStep(0);
  resetLog();
  const results = new Map();
  const map = tripMap(MAP_A);
  const caption = h('p', { class: 'range-now' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const board = h('div', { class: 'rule-board' });

  meterBox.replaceChildren(h('div', { class: 'meter' },
    h('div', { class: 'meter-head' }, h('span', { class: 'meter-label' }, '資源：距離')),
    h('p', { class: 'meter-note' }, '同樣走完 5 個景點，方法不同，坐車的距離差很多。')));

  const head = h('div', { class: 'stage-top' },
    h('h2', {}, '第 1 關：兩個方法，哪一個比較短？'),
    h('span', { class: 'tag accent' }, '先押注'));
  stage.replaceChildren(head, map.svg, caption, board, feedback, actions);

  /* -- 先押注，再看答案 -- */
  function askGuess() {
    aiSay(aiBox, '排路線我有兩個方法，聽起來都很有道理。<br><b>你先猜猜看哪一個比較短</b>，我再跑給你看。', 'idle');
    caption.innerHTML = '兩個方法都會走完 5 個景點，但順序不一樣，總距離也就不一樣。';
    board.replaceChildren(...RULES.map(rule => h('button', {
      class: 'rule-card', type: 'button', onclick: () => takeGuess(rule.id)
    }, h('span', { class: 'r-icon' }, rule.icon), h('b', {}, rule.name), h('span', { class: 'r-hint' }, rule.hint))),
      h('button', { class: 'rule-card plain', type: 'button', onclick: () => takeGuess('same') },
        h('span', { class: 'r-icon' }, '🤝'), h('b', {}, '兩個一樣短'), h('span', { class: 'r-hint' }, '猜它們會走出一樣的距離。')));
  }

  function takeGuess(id) {
    myGuess = id;
    const label = id === 'same' ? '兩個一樣短' : RULES.find(r => r.id === id).name;
    say(feedback, 'info', `你押「<b>${label}</b>」。跑跑看對不對。`);
    head.lastChild.textContent = '跑跑看';
    runRules();
  }

  /* -- 兩個方法各跑一遍，一步一步跑，看得到它在想什麼 -- */
  async function runRules() {
    board.replaceChildren();
    actions.replaceChildren();
    for (const rule of RULES) {
      const { order, length } = rule.solve(SCHOOL, MAP_A);
      results.set(rule.id, { order, length });
      aiSay(aiBox, `${rule.icon} <b>${rule.name}</b><br>${rule.hint}`, 'think');
      map.drawGhost(null);
      map.drawRoute([]);
      const delay = reducedMotion() ? 0 : 620;
      for (let step = 0; step < order.length; step++) {
        caption.innerHTML = rule.describe(MAP_A, order, step);
        map.drawRoute(order.slice(0, step + 1));
        map.standAt(order[step]);
        if (delay) await wait(delay);
      }
      map.standAt(-1);
      caption.innerHTML = `${rule.icon} ${rule.name}：${routeNames(MAP_A, order)}，<b>${length}</b> 公里。`;
      addLog(`${rule.icon} ${routeIcons(MAP_A, order)}`, `${length} 公里`, false);
      showBoard();
      if (delay) await wait(900);
    }
    judgeGuess();
  }

  function showBoard() {
    board.replaceChildren(...RULES.map(rule => {
      const got = results.get(rule.id);
      return h('div', { class: got ? 'rule-card done' : 'rule-card waiting' },
        h('span', { class: 'r-icon' }, rule.icon), h('b', {}, rule.name),
        h('span', { class: 'r-km' }, got ? `${got.length} 公里` : '還沒跑'));
    }));
  }

  /* -- 回頭對照押注，然後把問題丟回給學生 -- */
  function judgeGuess() {
    const near = results.get('near').length;
    const loop = results.get('loop').length;
    const winner = near === loop ? 'same' : near < loop ? 'near' : 'loop';
    const right = myGuess === winner;
    const winnerName = winner === 'same' ? '兩個一樣短' : RULES.find(r => r.id === winner).name;
    const best = Math.min(near, loop);

    map.drawRoute(results.get(winner === 'loop' ? 'loop' : 'near').order);
    map.drawGhost(results.get(winner === 'loop' ? 'near' : 'loop').order);
    say(feedback, right ? 'good' : 'info',
      `${right ? '🎉 你押對了！' : `你押的是「${myGuess === 'same' ? '兩個一樣短' : RULES.find(r => r.id === myGuess).name}」，`}`
      + `比較短的是「<b>${winnerName}</b>」，${best} 公里。`);
    aiSay(aiBox, `兩個方法都跑完了。比較短的是 ${winnerName}，${best} 公里。<br>這樣……應該就是最短的了吧？`, 'proud');
    caption.innerHTML = `藍線是${winnerName}（${best} 公里），灰線是另一個（${Math.max(near, loop)} 公里）。`;
    actions.replaceChildren(h('button', { class: 'primary', onclick: () => freePlay(best) }, '換我排排看 →'));
  }

  /* -- 自己排：可以一直重排，這一關不給星，目的是建立直覺 -- */
  function freePlay(target) {
    head.firstChild.textContent = '第 1 關：你排得比它們更短嗎？';
    head.lastChild.textContent = '可以重排';
    const updateMeter = meter(meterBox, {
      label: '你的總距離', budget: target, unit: '公里', warnAt: 2,
      note: `要比 ${target} 公里更短。這一關可以一直重排。`
    });
    aiSay(aiBox, '換你排。<br>提醒你：<b>第一站選哪裡</b>，後面會差很多喔。', 'idle');

    let order = [];
    const picker = tripMap(MAP_A, { onPick: pick });
    const undo = h('button', { onclick: () => { order.pop(); render(); } }, '↶ 退一步');
    const reset = h('button', { onclick: () => { order = []; feedback.hidden = true; render(); } }, '重排');
    stage.replaceChildren(head, picker.svg, caption,
      h('div', { class: 'stage-actions' }, undo, reset), feedback, actions);

    function render() {
      picker.drawRoute(order);
      const km = routeLength(SCHOOL, MAP_A, order);
      updateMeter(km);
      const left = MAP_A.length - order.length;
      caption.innerHTML = order.length
        ? `${routeNames(MAP_A, order)}，走了 <b>${km}</b> 公里${left ? `，還有 <b>${left}</b> 個景點` : ''}`
        : '依序點景點，排出你的路線。線上的數字是每一段的公里數。';
      undo.disabled = !order.length;
    }

    function pick(index) {
      if (order.length === MAP_A.length) return;
      if (order.includes(index)) { toast(`${MAP_A[index].name}已經去過了`); return; }
      order.push(index);
      render();
      if (order.length === MAP_A.length) settle();
    }

    function settle() {
      const km = routeLength(SCHOOL, MAP_A, order);
      if (myBest === null || km < myBest) myBest = km;
      const beat = km < target;
      addLog(`🙋 ${routeIcons(MAP_A, order)}`, `${km} 公里`, beat);
      say(feedback, beat ? 'good' : 'info', beat
        ? `🎉 <b>${km}</b> 公里，比兩個方法都短！所以那兩個方法都<b>不保證</b>找到最短的路線。`
        : `你排出 ${km} 公里，還沒贏過 ${target} 公里。換一個第一站試試看？`);
      actions.replaceChildren(
        h('button', { class: beat ? 'primary' : '', onclick: roundOneShot }, '下一關：只有一次機會 →'),
        h('button', { class: beat ? '' : 'primary', onclick: () => reset.click() }, '再排一次'));
    }

    actions.replaceChildren();
    render();
  }

  askGuess();
}

/* ---------- 第 2 關：只有一次機會 ---------- */
function roundOneShot() {
  goStep(1);
  resetLog('這張地圖只能交一次。');
  const near = nearestRoute(SCHOOL, MAP_B);
  const loop = sweepRoute(SCHOOL, MAP_B);
  const target = Math.min(near.length, loop.length);
  const best = bestRoute(SCHOOL, MAP_B);

  const updateMeter = meter(meterBox, {
    label: '你的總距離', budget: target, unit: '公里', warnAt: 2,
    note: `要比 ${target} 公里更短。只有一次機會。`
  });
  aiSay(aiBox, `新的地圖！我兩個方法都跑過了，最好的是 <b>${target}</b> 公里。<br>這次你<b>只能交一次</b>，想清楚再按。`, 'proud');

  let order = [];
  let locked = false;
  let firstTry = true;      // 只有第一次交出去才算星星
  const map = tripMap(MAP_B, { onPick: pick });
  const caption = h('p', { class: 'range-now' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const undo = h('button', { onclick: () => { order.pop(); render(); } }, '↶ 退一步');
  const clear = h('button', { onclick: () => { order = []; render(); } }, '清空');
  const submit = h('button', { class: 'primary', onclick: commit }, '就這條，出發！');

  map.drawGhost(near.order);
  stage.replaceChildren(
    h('div', { class: 'stage-top' },
      h('h2', {}, '第 2 關：新地圖，只能交一次'),
      h('span', { class: 'tag amber' }, '一次定案')),
    map.svg, caption,
    h('div', { class: 'rule-board small' }, RULES.map(rule => {
      const got = rule.id === 'near' ? near : loop;
      return h('div', { class: 'rule-card done' },
        h('span', { class: 'r-icon' }, rule.icon), h('b', {}, rule.name),
        h('span', { class: 'r-km' }, `${got.length} 公里`));
    })),
    h('div', { class: 'stage-actions' }, undo, clear, submit), feedback, actions);

  function render() {
    map.drawRoute(order);
    const km = routeLength(SCHOOL, MAP_B, order);
    updateMeter(km);
    const left = MAP_B.length - order.length;
    caption.innerHTML = order.length
      ? `${routeNames(MAP_B, order)}，走了 <b>${km}</b> 公里${left ? `，還有 <b>${left}</b> 個景點` : ''}`
      : `灰線是小 AI 的「每次去最近的」（${near.length} 公里）。依序點景點，排出你的路線。`;
    undo.disabled = !order.length || locked;
    clear.disabled = !order.length || locked;
    submit.disabled = order.length !== MAP_B.length || locked;
  }

  function pick(index) {
    if (locked || order.length === MAP_B.length) return;
    if (order.includes(index)) { toast(`${MAP_B[index].name}已經去過了`); return; }
    order.push(index);
    render();
  }

  function commit() {
    locked = true;
    render();
    const km = routeLength(SCHOOL, MAP_B, order);
    const won = km < target;
    const wasFirst = firstTry;
    firstTry = false;
    addLog(`🙋 ${routeIcons(MAP_B, order)}`, `${km} 公里`, won);
    map.drawGhost(null);
    if (won && wasFirst) earn('r1');
    say(feedback, won ? 'good' : 'bad', won
      ? `🎉 <b>${km}</b> 公里，${wasFirst ? '一次就贏過兩個方法！' : '贏過兩個方法了！不過星星只算第一次交出去的那一條。'}最短的是 ${best.length} 公里。`
      : `你排出 ${km} 公里，沒有贏過 ${target} 公里。最短的是 <b>${best.length}</b> 公里：${routeNames(MAP_B, best.order)}。`);
    aiSay(aiBox, won
      ? '你只排一次就贏過我兩個方法……<br>那我的方法到底<b>什麼時候</b>才是對的？'
      : `最短的其實是 ${best.length} 公里。<br>看來<b>光靠一個規則是不夠的</b>。`, won ? 'shock' : 'think');
    actions.replaceChildren(
      h('button', { class: 'primary', onclick: roundBrute }, '下一關：那就全部試一遍 →'),
      h('button', {
        onclick: () => {
          locked = false; order = []; feedback.hidden = true;
          map.drawGhost(near.order); render();
        }
      }, '再排排看（不算星星）'));
  }

  render();
}

/* ---------- 第 3 關：全部試一遍，讓瀏覽器真的跑 ---------- */
function roundBrute() {
  goStep(2);
  resetLog('還沒開始試。', '次');
  aiSay(aiBox, '既然一個規則不夠好，那我就<b>把所有順序都試一遍</b>！<br>這樣一定找得到最短的。', 'proud');

  let runner = null;
  let spots = [];
  let timer = 0;
  let startedAt = 0;
  let elapsed = 0;
  let current = 0;
  let reachedBig = false;

  const caption = h('p', { class: 'range-now' }, '先從 5 個景點開始。選一個數量，看小 AI 要試幾條路線。');
  const ladder = h('div', { class: 'count-ladder' });
  const readout = h('div', { class: 'explode-stats' });
  const barFill = h('div', { class: 'meter-fill' });
  const bar = h('div', { class: 'meter-track', role: 'presentation' }, barFill);
  const mapBox = h('div', { class: 'brute-map' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  const stopButton = h('button', { class: 'stop-run', onclick: stop }, '■ 停，不要跑了');

  meterBox.replaceChildren(h('div', { class: 'meter' },
    h('div', { class: 'meter-head' }, h('span', { class: 'meter-label' }, '資源：計算時間')),
    h('p', { class: 'meter-note' }, '這是你的瀏覽器真的在跑，不是動畫。')));

  stage.replaceChildren(
    h('div', { class: 'stage-top' },
      h('h2', {}, '第 3 關：把所有順序都試一遍'),
      h('span', { class: 'tag' }, '真的在跑')),
    ladder, mapBox, bar, readout, caption, feedback, actions);

  function drawLadder() {
    ladder.replaceChildren(h('span', { class: 'ladder-label' }, '景點數量'),
      ...COUNT_LADDER.map(n => h('button', {
        class: n === current ? 'count-pick on' : 'count-pick',
        type: 'button', disabled: !!timer,
        onclick: () => run(n)
      }, `${n} 個`)));
  }

  function stat(key, value, sub) {
    return h('div', { class: 'stat' }, h('div', { class: 'k' }, key),
      h('div', { class: 'v' }, value), sub ? h('div', { class: 's' }, sub) : null);
  }

  function showReadout(total, rate, done) {
    const pct = (runner.checked / total) * 100;
    barFill.style.width = `${Math.min(100, pct)}%`;
    readout.replaceChildren(
      stat('試過的路線', fmt(runner.checked), `共 ${fmt(total)} 條`),
      stat('進度', pct >= 1 ? `${pct.toFixed(1)}%` : `${pct.toFixed(4)}%`, `已經跑了 ${elapsed.toFixed(1)} 秒`),
      stat('全部跑完還要', done ? '跑完了' : humanDuration((total - runner.checked) / rate),
        runner.checked >= 200000 ? `每秒試 ${fmt(Math.round(rate))} 條` : ''));
  }

  function run(n) {
    stop();
    current = n;
    biggestRun = Math.max(biggestRun, n);
    reachedBig = reachedBig || n >= 13;
    spots = spotsFor(n);
    runner = bruteForceRunner(SCHOOL, spots);
    const preview = tripMap(spots, { bare: n > 5 });
    mapBox.replaceChildren(preview.svg);
    startedAt = performance.now();
    elapsed = 0;
    feedback.hidden = true;
    drawLadder();
    actions.replaceChildren(stopButton);
    aiSay(aiBox, `${n} 個景點，一共有 <b>${fmt(Number(runner.total))}</b> 種順序。我開始試了！`, 'think');
    caption.innerHTML = `小 AI 正在把 <b>${n}</b> 個景點的每一種順序都試一遍。綠線是目前找到最短的那一條。`;

    const total = Number(runner.total);
    let lastDraw = 0;

    const tick = () => {
      // 每一幀只跑 12 毫秒，畫面才不會凍住——但跑的是真的窮舉
      const frameStart = performance.now();
      while (performance.now() - frameStart < 12 && !runner.done) runner.step(20000);
      elapsed = (performance.now() - startedAt) / 1000;
      const rate = runner.checked / Math.max(elapsed, 0.001);
      if (runner.checked > 200000) measuredRate = rate;

      barFill.style.width = `${Math.min(100, (runner.checked / total) * 100)}%`;
      if (performance.now() - lastDraw > 120) {
        lastDraw = performance.now();
        if (runner.best) preview.drawRoute(runner.best.order, 'best', { km: false });
        showReadout(total, rate, runner.done);
      }
      if (runner.done) { finishRun(total, rate); return; }
      timer = requestAnimationFrame(tick);
    };
    timer = requestAnimationFrame(tick);
  }

  function finishRun(total, rate) {
    cancelAnimationFrame(timer);
    timer = 0;
    drawLadder();
    addLog(`${current} 個景點`, `試完 ${fmt(total)} 條`, true);
    showReadout(total, rate, true);
    caption.innerHTML = `${current} 個景點的 ${fmt(total)} 種順序，<b>全部試完了</b>。`;
    say(feedback, 'good', `✓ ${current} 個景點：試完 <b>${fmt(total)}</b> 條，花了 ${elapsed.toFixed(2)} 秒，最短 ${runner.best.length} 公里。`);
    const same = current === 5 && myBest !== null && myBest === runner.best.length;
    aiSay(aiBox, current <= 8
      ? `${fmt(total)} 條一下子就試完了，而且<b>保證</b>是最短的${same ? '——跟你剛剛排的一樣！' : '。'}<br>再多幾個景點試試看？`
      : '試完了。再往上加幾個景點看看……', current <= 8 ? 'proud' : 'think');
    offerNext();
  }

  function stop() {
    if (!timer) return;
    cancelAnimationFrame(timer);
    timer = 0;
    drawLadder();
    const total = Number(runner.total);
    const rate = runner.checked / Math.max(elapsed, 0.001);
    const pct = (runner.checked / total) * 100;
    addLog(`${current} 個景點`, `只跑了 ${pct < 1 ? pct.toFixed(4) : pct.toFixed(1)}%`, false);
    showReadout(total, rate, false);
    caption.innerHTML = pct < 1
      ? `停在這裡了。${current} 個景點的順序，小 AI <b>連 1% 都還沒試完</b>。`
      : `停在這裡了。${current} 個景點的順序，小 AI 才試完 <b>${pct.toFixed(1)}%</b>。`;
    say(feedback, 'bad',
      `跑了 ${elapsed.toFixed(1)} 秒，只試完 <b>${pct < 1 ? pct.toFixed(4) : pct.toFixed(1)}%</b>。`
      + `照這個速度，全部跑完要 <b>${humanDuration((total - runner.checked) / rate)}</b>。`);
    aiSay(aiBox, `${current} 個景點……我的方法<b>跑不完</b>。<br>多幾個景點而已，怎麼會差這麼多？`, 'shock');
    offerNext();
  }

  function offerNext() {
    actions.replaceChildren(reachedBig
      ? h('button', { class: 'primary', onclick: () => { stop(); roundExplode(); } }, '算給你看：問題出在哪 →')
      : h('span', { class: 'hint-line' }, '再往上選一個更大的數量試試看。'));
  }

  drawLadder();
  mapBox.replaceChildren(tripMap(MAP_A).svg);
  readout.replaceChildren(stat('試過的路線', '0'), stat('進度', '0%'), stat('全部跑完還要', '—'));
  actions.replaceChildren(h('span', { class: 'hint-line' }, '選一個景點數量，讓小 AI 開始試。'));
}

/* ---------- 第 3 關後半：用自己電腦的速度算給你看 ---------- */
function roundExplode() {
  const speed = measuredRate > 0 ? measuredRate : 3e6;
  const superSpeed = speed * 1000;
  const answer = firstSpotsOverAYear(speed);

  meterBox.replaceChildren(h('div', { class: 'meter' },
    h('div', { class: 'meter-head' }, h('span', { class: 'meter-label' }, '你的電腦實測')),
    h('p', { class: 'meter-note' }, `每秒試 ${fmt(Math.round(speed))} 條路線。`)));
  aiSay(aiBox, '我把景點數量拉大一點算給你看……<br>應該不會差太多吧？', 'think');

  const slider = h('input', { type: 'range', min: 3, max: 25, value: 5, 'aria-label': '景點數量' });
  const nLabel = h('b', { class: 'big-number' }, '5');
  const routes = h('div', { class: 'v' });
  const routesNote = h('div', { class: 's' });
  const mine = h('div', { class: 'v' });
  const fast = h('div', { class: 'v' });
  const task = h('div', { class: 'quiz' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });
  let missed = false;       // 按錯過或看過答案，就拿不到這顆星

  function render() {
    const n = Number(slider.value);
    nLabel.textContent = n;
    const count = factorial(n);
    routes.textContent = count.toLocaleString('zh-TW');
    routes.classList.toggle('long', routes.textContent.length > 12);
    routesNote.textContent = count >= 10000n ? `${chineseAmount(count)}（${count.toString().length} 位數）` : '';
    const tMine = bruteForceSeconds(n, speed);
    const tFast = bruteForceSeconds(n, superSpeed);
    mine.textContent = humanDuration(tMine);
    fast.textContent = humanDuration(tFast);
    mine.classList.toggle('hot', tMine > 3600 * 24 * 365);
    fast.classList.toggle('hot', tFast > 3600 * 24 * 365);
  }
  slider.addEventListener('input', render);

  function showTask() {
    task.replaceChildren(
      h('p', { class: 'quiz-q' }, '景點至少要幾個，你的電腦就要算超過 1 年？拉動滑桿，找到那個數字再按下去。'),
      h('div', { class: 'quiz-options' },
        h('button', { class: 'primary', onclick: check }, '就是這個數字！'),
        h('button', { onclick: giveUp }, '看答案')));
  }

  function check() {
    const n = Number(slider.value);
    if (n === answer) {
      if (!missed) earn('r3');
      say(feedback, 'good', `✓ 對！${n} 個景點要算 ${humanDuration(bruteForceSeconds(n, speed))}；少一個只要 ${humanDuration(bruteForceSeconds(n - 1, speed))}。`);
      done();
    } else if (n < answer) {
      missed = true;
      say(feedback, 'bad', `${n} 個景點只要 ${humanDuration(bruteForceSeconds(n, speed))}，還不到 1 年。再多加幾個。`);
    } else {
      missed = true;
      say(feedback, 'bad', `${n} 個確實超過 1 年，但更少的景點數也已經超過了。往回拉一點，找「剛好超過」的那一個。`);
    }
  }

  function giveUp() {
    missed = true;
    slider.value = answer;
    render();
    say(feedback, 'info', `答案是 ${answer} 個景點：要算 ${humanDuration(bruteForceSeconds(answer, speed))}。`);
    done();
  }

  function done() {
    const superAnswer = firstSpotsOverAYear(superSpeed);
    task.replaceChildren();
    aiSay(aiBox, `就算電腦快 1000 倍……也只從 ${answer} 個景點多撐到 ${superAnswer} 個。`, 'shock');
    say(feedback, 'info',
      `你的電腦在 <b>${answer}</b> 個景點就要算超過一年；快 1000 倍的超級電腦，也只撐到 <b>${superAnswer}</b> 個。`
      + `快 1000 倍，只多了 ${superAnswer - answer} 個景點。`);
    actions.replaceChildren(h('button', { class: 'primary', onclick: reveal }, '揭曉：問題出在哪裡？ →'));
  }

  stage.replaceChildren(
    h('div', { class: 'stage-top' },
      h('h2', {}, '景點再多一點會怎樣？'),
      h('span', { class: 'tag amber' }, '用你電腦的速度算')),
    h('div', { class: 'explode' },
      h('div', { class: 'explode-controls' }, h('label', {}, '景點數量', slider, nLabel, '個')),
      h('div', { class: 'explode-stats' },
        h('div', { class: 'stat' }, h('div', { class: 'k' }, '路線有幾種順序'), routes, routesNote),
        h('div', { class: 'stat' }, h('div', { class: 'k' }, '你的電腦要算'), mine, h('div', { class: 's' }, `每秒 ${fmt(Math.round(speed))} 條`)),
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
  const speed = measuredRate > 0 ? measuredRate : 3e6;

  const rows = [5, 8, 11, 13, 15, 20].map(n => h('tr', {},
    h('td', {}, `${n} 個景點`),
    h('td', {}, factorial(n) >= 10000n ? chineseAmount(factorial(n)) : fmt(Number(factorial(n)))),
    h('td', { class: bruteForceSeconds(n, speed) > 3.15e7 ? 'bad' : '' }, humanDuration(bruteForceSeconds(n, speed))),
    h('td', { class: bruteForceSeconds(n, speed * 1000) > 3.15e7 ? 'bad' : '' }, humanDuration(bruteForceSeconds(n, speed * 1000)))));

  const quizBox = h('div');
  const starBox = h('span');
  const countBox = h('span');
  const starList = h('ul', { class: 'star-list' });
  const challengeBox = h('div', { class: 'challenge-box' });
  const refreshStars = () => {
    starBox.replaceChildren(stars(earned.size));
    countBox.textContent = `${earned.size} / ${STAR_RULES.length}`;
    starList.replaceChildren(...STAR_RULES.map(([key, text]) =>
      h('li', { class: earned.has(key) ? 'got' : '' }, `${earned.has(key) ? '★' : '☆'} ${text}`)));
  };
  refreshStars();

  shell.finish().replaceChildren(
    h('div', { class: 'result-head' },
      h('div', {}, h('p', { class: 'eyebrow' }, '過關'), h('h2', {}, '旅行社：畢旅路線')),
      starBox),
    h('article', { class: 'reveal' },
      h('p', { class: 'eyebrow' }, '你發現了'),
      h('h2', {}, '電腦再快，也救不了太笨的方法'),
      h('p', { html: '你試過的兩個方法——「每次去最近的」和「照地圖繞一圈」——都只看眼前一步，所以都會漏掉最短的路線。像這種每一步都先拿眼前最好的做法，叫做<strong>貪婪</strong>。' }),
      h('p', { html: `小 AI 的做法是把所有順序都試一遍，叫做<strong>窮舉</strong>（也叫暴力搜尋）。它<strong>保證</strong>找到最短的，但 n 個景點有 n × (n − 1) × … × 1 種順序。你剛剛親眼看到：${biggestRun} 個景點就要 ${humanDuration(bruteForceSeconds(biggestRun, speed))}。書上把這種成長寫成 <strong>O(n!)</strong>，叫做「階乘階」。` }),
      h('p', { html: `這種「走遍所有地點」的問題，到現在都還沒有人找到<strong>又快、又保證最短</strong>的方法，是電腦科學最有名的難題之一。` }),
      h('div', { class: 'table-scroll' }, h('table', { class: 'compare-table' },
        h('thead', {}, h('tr', {}, h('th', {}, '景點'), h('th', {}, '順序有幾種'),
          h('th', {}, '你的電腦'), h('th', {}, '超級電腦（快 1000 倍）'))),
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
          h('div', {}, h('h3', {}, fresh ? '圖鑑解鎖：窮舉' : '圖鑑：窮舉'),
            h('p', {}, '把所有可能都試一遍，保證找到，但可能算不完。'))),
        h('div', { class: 'panel-title', style: 'margin:18px 0 0' }, h('h3', {}, '這一關的星星'), countBox),
        starList,
        h('div', { class: 'action-row' },
          h('button', { class: 'primary', type: 'button', onclick: () => exitLevel() }, '← 回小鎮'),
          h('button', { disabled: true, title: '模組製作中' }, '會動的演算法：窮舉與回溯（製作中）')),
        h('p', { class: 'fine-print' }, '想深入讀：',
          h('a', { href: `${HELLO_ALGO}chapter_computational_complexity/time_complexity/`, target: '_blank', rel: 'noopener' }, '《Hello 演算法》時間複雜度 ↗'),
          '、',
          h('a', { href: `${HELLO_ALGO}chapter_backtracking/permutations_problem/`, target: '_blank', rel: 'noopener' }, '全排列問題 ↗')))),
    h('section', { class: 'panel panel-pad' },
      h('div', { class: 'panel-title' }, h('h3', {}, '連續挑戰'), h('span', {}, '沒有上限')),
      challengeBox));

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

  challenge(challengeBox);
  notifyProgress();
}

/* ---------- 破關之後：沒有上限的連續挑戰 ---------- */
function challenge(box) {
  const record = loadProgress().modules?.trip?.streak || 0;
  let streak = 0;
  const bestBox = h('span', { class: 'streak-best' }, record ? `最佳連勝 ${record}` : '');
  const streakBox = h('b', { class: 'big-number' }, '0');
  const mapBox = h('div');
  const caption = h('p', { class: 'range-now' });
  const feedback = h('div', { class: 'feedback', role: 'status', hidden: true });
  const actions = h('div', { class: 'stage-actions' });

  box.replaceChildren(
    h('p', {}, '每一張都是隨機的新地圖，兩個方法都找不到最短的那一條。',
      h('b', {}, '排得比兩個方法都短就算贏，一張只能交一次。')),
    h('div', { class: 'streak-head' }, h('span', {}, '目前連勝'), streakBox, bestBox),
    mapBox, caption, feedback, actions);

  function deal() {
    let data = null;
    for (let tries = 0; tries < 8 && !data; tries++) {
      data = randomTripMap({ start: SCHOOL, count: 5, area: MAP_AREA });
    }
    if (!data) { caption.textContent = '抽不到地圖，請再按一次。'; return; }

    const shuffled = [...PLACE_POOL].sort(() => Math.random() - 0.5);
    const spots = data.spots.map((point, i) => ({ ...point, ...shuffled[i] }));
    const target = data.ruleBest;

    let order = [];
    let locked = false;
    const map = tripMap(spots, { onPick: pick });
    mapBox.replaceChildren(map.svg);
    feedback.hidden = true;

    const undo = h('button', { onclick: () => { order.pop(); render(); } }, '↶ 退一步');
    const submit = h('button', { class: 'primary', onclick: commit }, '就這條，出發！');
    actions.replaceChildren(undo, submit);

    function render() {
      map.drawRoute(order);
      const km = routeLength(SCHOOL, spots, order);
      const left = spots.length - order.length;
      caption.innerHTML = order.length
        ? `${km} 公里${left ? `，還有 ${left} 個景點` : ''}　｜　要比 <b>${target}</b> 公里更短`
        : `兩個方法最好走 <b>${target}</b> 公里。你排得更短嗎？`;
      undo.disabled = !order.length || locked;
      submit.disabled = order.length !== spots.length || locked;
    }

    function pick(index) {
      if (locked || order.includes(index)) return;
      order.push(index);
      render();
    }

    function commit() {
      locked = true;
      render();
      const km = routeLength(SCHOOL, spots, order);
      const won = km < target;
      if (won) {
        streak++;
        streakBox.textContent = streak;
        if (streak > record) { saveModule('trip', 'streak', streak); bestBox.textContent = `最佳連勝 ${streak}`; }
        say(feedback, 'good', `🎉 ${km} 公里，贏了！（最短的是 ${data.best.length} 公里）`);
      } else {
        streak = 0;
        streakBox.textContent = '0';
        say(feedback, 'bad', `${km} 公里，沒有贏過 ${target} 公里。最短的是 ${data.best.length} 公里。連勝歸零。`);
      }
      actions.replaceChildren(h('button', { class: 'primary', onclick: deal }, '下一張地圖 →'));
    }

    render();
  }

  actions.replaceChildren(h('button', { class: 'primary', onclick: deal }, '開始挑戰'));
  caption.textContent = '';
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
  myGuess = null;
  measuredRate = 0;
  biggestRun = 0;
  shell.setStars(0);
  shell.setStep(0);
  shell.briefing({
    lines: [
      '畢業旅行要從學校出發，把 5 個景點都走一遍。',
      '小 AI 有兩個排路線的方法，聽起來都很有道理。',
      '你的工作不是背答案，是<b>看穿它們什麼時候會出錯</b>。'
    ],
    goal: '🎯 找出兩個方法的極限',
    action: '出發'
  }).then(() => roundCompare());
}
