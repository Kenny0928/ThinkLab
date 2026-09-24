// 小鎮頁面：把場景、建築名牌、關卡與圖鑑接在一起。
import { $, h, toast, wait, reducedMotion } from '../core/ui.js';
import { loadProgress } from '../core/progress.js';
import { BUILDINGS, COMING_SOON, DEX } from '../core/catalog.js';
import { createScene } from './scene.js';
import { PLACES, BOARD, COLS, ROWS } from './world.js';

const LEVELS = {
  guess: () => import('./guess.js').then(module => module.startGuess),
  coins: () => import('./coins.js').then(module => module.startCoins),
  trip: () => import('./trip.js').then(module => module.startTrip)
};
const INFO = new Map([...BUILDINGS.map(b => [b.id, { ...b, open: true }]), ...COMING_SOON.map(b => [b.id, { ...b, open: false }])]);

const sceneEl = $('#scene');
const hud = $('#hud');
const fade = $('#fade');
const sheet = $('#level-sheet');
const titleCard = $('#title-card');
const scene = createScene($('#map'));

let current = null;
let busy = false;
let closeToken = 0;

/* ---------- 進度 ---------- */
function readProgress() {
  const progress = loadProgress();
  const states = {};
  for (const building of BUILDINGS) {
    const record = progress.town[building.id];
    states[building.id] = {
      tone: building.tone,
      state: record?.done ? 'done' : 'open',
      stars: record?.stars?.length || 0,
      visited: Boolean(record)
    };
  }
  for (const building of COMING_SOON) states[building.id] = { tone: building.tone, state: 'soon' };
  states.dex = { found: DEX.filter(entry => progress.dex[entry.id]).length };
  return states;
}

function refresh() {
  const states = readProgress();
  scene.setStates(states);
  renderPlates(states);
  const found = states.dex.found;
  $('#dex-count').textContent = `${found} / ${DEX.length}`;
  $('#dex-progress').textContent = `${found} / ${DEX.length}`;
  return states;
}

/* ---------- 建築名牌 ---------- */
function plate(place, states) {
  const info = INFO.get(place.id);
  const state = states[place.id];
  const above = place.facing === 'south';
  const classes = ['plate', above ? 'plate-above' : 'plate-below'];
  if (!info.open) classes.push('is-soon');
  else if (state.state === 'done') classes.push('is-done');
  else if (!state.visited) classes.push('is-new');

  const el = h('button', {
    type: 'button',
    class: classes.join(' '),
    style: `left:${((place.col + place.w / 2) / COLS) * 100}%;top:${((above ? place.row : place.row + place.h) / ROWS) * 100}%`,
    'aria-label': info.open
      ? `${info.place}：${info.title}，${state.state === 'done' ? `已完成，${state.stars} 顆星` : '還沒完成'}`
      : `${info.place}：施工中`,
    onclick: () => (info.open ? enter(place.id) : toast(`${info.place}還在蓋，敬請期待。`))
  },
    h('span', { class: 'p-icon', 'aria-hidden': 'true' }, info.icon),
    h('span', { class: 'p-name' }, info.place),
    h('span', { class: 'p-sub' }, info.open ? info.title : '🚧 施工中'));

  if (info.open) {
    el.append(h('span', { class: 'p-stars', 'aria-hidden': 'true' },
      h('b', {}, '★'.repeat(state.stars)), '★'.repeat(3 - state.stars)));
  }
  return el;
}

function renderPlates(states) {
  const board = h('button', {
    type: 'button',
    class: 'plate plate-below is-board',
    style: `left:${((BOARD.col + 0.5) / COLS) * 100}%;top:${((BOARD.row + 1) / ROWS) * 100}%`,
    onclick: () => scene.goTo('dex').then(openDex),
    'aria-label': `演算法圖鑑，已收集 ${states.dex.found} 個`
  },
    h('span', { class: 'p-icon', 'aria-hidden': 'true' }, '📔'),
    h('span', { class: 'p-name' }, '圖鑑'),
    h('span', { class: 'p-sub' }, `${states.dex.found} / ${DEX.length}`));
  hud.replaceChildren(...PLACES.map(place => plate(place, states)), board);
}

/* ---------- 進出關卡 ---------- */
async function enter(id) {
  if (busy || current) return;
  busy = true;
  hideTitle();
  hud.classList.add('is-hidden');
  await scene.goTo(id);
  await zoomIn(id);
  history.pushState({ level: id }, '', `#${id}`);
  await openLevel(id);
  busy = false;
}

function zoomIn(id) {
  if (reducedMotion()) { fade.classList.add('on'); return wait(0); }
  const box = scene.screenBox(id);
  sceneEl.style.transformOrigin = `${box.doorX}px ${box.doorY}px`;
  sceneEl.style.transform = 'scale(2.6)';
  fade.classList.add('on');
  return wait(520);
}

async function openLevel(id) {
  const start = await LEVELS[id]();
  sheet.hidden = false;
  sheet.classList.remove('is-closing');
  sheet.scrollTop = 0;
  start(sheet, { onExit: exitLevel, onProgress: refresh });
  current = id;
  document.body.classList.add('level-open');
  // 有任務卡時先讓焦點停在「開始」，沒有才回到返回鍵
  (sheet.querySelector('.brief-card button') || sheet.querySelector('button'))?.focus({ preventScroll: true });
  scene.stop();
}

function closeLevel() {
  if (!current) return;
  sheet.classList.add('is-closing');
  const closing = current;
  current = null;
  document.body.classList.remove('level-open');
  // 收起動畫還沒跑完就又開了別關時，不要把新的關卡清掉
  const token = ++closeToken;
  setTimeout(() => {
    if (token !== closeToken || current) return;
    sheet.hidden = true;
    sheet.replaceChildren();
    sheet.classList.remove('is-closing');
  }, 240);
  scene.resume();
  scene.placeAt(closing);
  sceneEl.style.transform = '';
  fade.classList.remove('on');
  hud.classList.remove('is-hidden');
  refresh();
  hud.querySelector(`.plate[aria-label^="${INFO.get(closing).place}"]`)?.focus({ preventScroll: true });
}

function exitLevel() {
  if (location.hash) history.back();
  else closeLevel();
}

/* ---------- 圖鑑 ---------- */
function openDex() {
  const progress = loadProgress();
  $('#dex-grid').replaceChildren(...DEX.map(entry => progress.dex[entry.id]
    ? h('div', { class: 'dex-card' },
      h('span', { class: 'dex-icon', 'aria-hidden': 'true' }, entry.icon),
      h('h3', {}, entry.name),
      h('p', {}, entry.text))
    : h('div', { class: 'dex-card locked' },
      h('span', { class: 'dex-icon', 'aria-hidden': 'true' }, entry.icon),
      h('h3', {}, '？？？'),
      h('p', {}, `到${entry.from}找找看。`))));
  $('#dex-dialog').showModal();
}

$('#dex-open').addEventListener('click', openDex);
$('#dex-close').addEventListener('click', () => $('#dex-dialog').close());

/* ---------- 在地圖上點來點去 ---------- */
$('#map').addEventListener('click', event => {
  if (busy || current) return;
  const tile = scene.tileAtPoint(event.clientX, event.clientY);
  const place = PLACES.find(p => tile.x >= p.col && tile.x < p.col + p.w && tile.y >= p.row && tile.y < p.row + p.h);
  if (place) {
    if (INFO.get(place.id).open) enter(place.id);
    else toast(`${INFO.get(place.id).place}還在蓋，敬請期待。`);
    return;
  }
  hideTitle();
  scene.walkToTile(tile);
});

/* ---------- 開場 ---------- */
function hideTitle() {
  titleCard.classList.add('is-gone');
}

async function intro() {
  if (reducedMotion()) { hideTitle(); return; }
  await wait(1200);
  await scene.walkToTile({ x: 11, y: 11 });
  hideTitle();
}

/* ---------- 網址與返回鍵 ---------- */
async function syncFromHash() {
  const id = location.hash.slice(1);
  if (id && LEVELS[id]) {
    if (current === id) return;
    if (current) closeLevel();
    scene.placeAt(id);
    hud.classList.add('is-hidden');
    hideTitle();
    await openLevel(id);
  } else if (current) {
    closeLevel();
  }
}

// popstate 管返回鍵；hashchange 管直接改網址列或站內換連結（pushState 不會觸發 hashchange）
window.addEventListener('popstate', syncFromHash);
window.addEventListener('hashchange', syncFromHash);

refresh();
if (location.hash.slice(1) in LEVELS) syncFromHash();
else intro();
