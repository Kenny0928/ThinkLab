// 小鎮的像素美術：全部用 canvas 的方塊畫出來，不需要圖檔。
// 畫布本身只有 384×256，再用 CSS 放大，所以每一筆都要落在整數像素上。

import { TILE, COLS, ROWS, MAP, LAMPS, BENCHES, FOUNTAIN, ENTRANCE_SIGN } from './world.js';

export const C = {
  grass: '#1a2a22', grassDark: '#16241d', grassLight: '#22342a', tuft: '#2e5138',
  road: '#2b3242', roadDark: '#252b39', roadLight: '#353d51', curb: '#404a61',
  water: '#16304a', waterLight: '#25577f', waterFoam: '#3f7fae',
  trunk: '#33261f', leaf: '#1b3327', leafLight: '#27482f',
  roofDark: '#1b2231', window: '#f1bd62', windowOff: '#2b3446', windowGlow: '#ffe3a6',
  door: '#2a1f18', doorGlow: '#f1bd62',
  lamp: '#424e68', lampHead: '#ffd68c',
  shadow: 'rgba(0, 0, 0, 0.38)',
  fence: '#6b5a33', fenceDark: '#3a3320', tape: '#f1bd62', tapeDark: '#2a2415',
  skin: '#ffd9ae', hair: '#4a4f72', hairDark: '#343855', bag: '#f1bd62', shirt: '#5aa0ff', shirtDark: '#3b82f6', pants: '#2b3242', shoe: '#181c26',
  board: '#3a2f22', boardEdge: '#5b4a33', paper: '#cfe0fb'
};

/** 每棟建築的配色與造型。 */
export const TONES = {
  school: { wall: '#27304a', wallDark: '#1e2639', roof: '#3b4a75', sign: '#3b82f6', chimney: true, tower: true },
  drink: { wall: '#332f28', wallDark: '#26231d', roof: '#574a33', sign: '#f1bd62', awning: true },
  shop: { wall: '#22323a', wallDark: '#1a262c', roof: '#2f4d56', sign: '#63d6ad', glass: true, awning: true },
  bag: { wall: '#2e2f3c', wallDark: '#23242f', roof: '#464859', sign: '#f1bd62', awning: true },
  fire: { wall: '#3a2630', wallDark: '#2b1c24', roof: '#5a3641', sign: '#ff8192', garage: true, tower: true },
  art: { wall: '#2b3340', wallDark: '#212733', roof: '#3f4a5e', sign: '#6dd5ed', skylight: true },
  travel: { wall: '#332a44', wallDark: '#272036', roof: '#4b3d66', sign: '#b69cff', globe: true }
};

const px = (ctx, x, y, w, h, colour) => { ctx.fillStyle = colour; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };

/** 固定的假隨機：同一格永遠長一樣。 */
function noise(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

/* ---------- 地面 ---------- */
function drawGrass(ctx, x, y) {
  px(ctx, x, y, TILE, TILE, C.grass);
  for (let i = 0; i < 6; i++) {
    const r = noise(x + i * 7, y + i * 13);
    const dx = Math.floor(r * TILE);
    const dy = Math.floor(noise(y + i * 5, x + i * 3) * TILE);
    px(ctx, x + dx, y + dy, 1, 1, r > 0.55 ? C.grassLight : C.grassDark);
  }
  if (noise(x, y) > 0.86) {
    px(ctx, x + 5, y + 10, 1, 2, C.tuft);
    px(ctx, x + 6, y + 9, 1, 1, C.tuft);
    px(ctx, x + 9, y + 11, 1, 2, C.tuft);
    px(ctx, x + 10, y + 10, 1, 1, C.tuft);
  }
}

function drawRoad(ctx, x, y, tx, ty, isPath) {
  px(ctx, x, y, TILE, TILE, isPath ? C.roadDark : C.road);
  for (let i = 0; i < 5; i++) {
    const r = noise(tx * 31 + i, ty * 17 + i * 3);
    px(ctx, x + Math.floor(r * TILE), y + Math.floor(noise(ty + i, tx + i) * TILE), 1, 1, r > 0.5 ? C.roadLight : C.roadDark);
  }
  // 街道邊緣的淺色路緣
  const line = (nx, ny, w, h) => px(ctx, nx, ny, w, h, C.curb);
  if (MAP[ty - 1]?.[tx] === '.' || MAP[ty - 1]?.[tx] === 'T') line(x, y, TILE, 1);
  if (MAP[ty + 1]?.[tx] === '.' || MAP[ty + 1]?.[tx] === 'T') line(x, y + TILE - 1, TILE, 1);
  if (MAP[ty]?.[tx - 1] === '.' || MAP[ty]?.[tx - 1] === 'T') line(x, y, 1, TILE);
  if (MAP[ty]?.[tx + 1] === '.' || MAP[ty]?.[tx + 1] === 'T') line(x + TILE - 1, y, 1, TILE);
}

function drawWater(ctx, x, y, tx, ty, time) {
  px(ctx, x, y, TILE, TILE, C.water);
  for (let row = 2; row < TILE; row += 5) {
    const shift = Math.round(Math.sin(time / 700 + (y + row) / 6) * 3);
    px(ctx, x + 2 + shift, y + row, 6, 1, '#1f4468');
    px(ctx, x + 10 + shift, y + row + 2, 3, 1, C.waterFoam);
  }
  // 岸邊
  const bank = (nx, ny, w, h) => px(ctx, nx, ny, w, h, '#3b4a45');
  if (MAP[ty - 1]?.[tx] !== 'W') bank(x, y, TILE, 2);
  if (MAP[ty + 1]?.[tx] !== 'W') bank(x, y + TILE - 2, TILE, 2);
  if (MAP[ty]?.[tx - 1] !== 'W') bank(x, y, 2, TILE);
  if (MAP[ty]?.[tx + 1] !== 'W') bank(x + TILE - 2, y, 2, TILE);
  // 睡蓮
  if (noise(tx * 3, ty * 5) > 0.5) {
    px(ctx, x + 5, y + 6, 5, 3, '#2a5c3f');
    px(ctx, x + 6, y + 5, 3, 1, '#2a5c3f');
    px(ctx, x + 7, y + 7, 1, 1, '#d7e8b4');
  }
}

function drawTree(ctx, x, y) {
  px(ctx, x + 6, y + 10, 4, 6, C.trunk);
  px(ctx, x + 3, y + 3, 10, 9, C.leaf);
  px(ctx, x + 5, y + 1, 6, 3, C.leaf);
  px(ctx, x + 2, y + 6, 1, 4, C.leaf);
  px(ctx, x + 13, y + 6, 1, 4, C.leaf);
  px(ctx, x + 5, y + 4, 4, 3, C.leafLight);
  px(ctx, x + 4, y + 15, 8, 1, C.shadow);
}

export function drawGround(ctx, time) {
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      const tile = MAP[ty][tx];
      if (tile === '#' || tile === 'p') drawRoad(ctx, x, y, tx, ty, tile === 'p');
      else if (tile === 'W') drawWater(ctx, x, y, tx, ty, time);
      else drawGrass(ctx, x, y);
    }
  }
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) if (MAP[ty][tx] === 'T') drawTree(ctx, tx * TILE, ty * TILE);
  }
}

/* ---------- 街道上的東西 ---------- */
const CROSSINGS = [
  { x: 11, y: 6, dir: 'h' }, { x: 12, y: 6, dir: 'h' },
  { x: 11, y: 9, dir: 'h' }, { x: 12, y: 9, dir: 'h' },
  { x: 10, y: 7, dir: 'v' }, { x: 10, y: 8, dir: 'v' },
  { x: 13, y: 7, dir: 'v' }, { x: 13, y: 8, dir: 'v' }
];
const DRAINS = [{ x: 3, y: 8 }, { x: 8, y: 7 }, { x: 17, y: 8 }, { x: 20, y: 7 }, { x: 11, y: 3 }];

export function drawProps(ctx, time) {
  for (const cross of CROSSINGS) {
    const x = cross.x * TILE;
    const y = cross.y * TILE;
    for (let i = 2; i < TILE - 1; i += 5) {
      if (cross.dir === 'h') px(ctx, x + i, y + 3, 3, TILE - 6, '#55607a');
      else px(ctx, x + 3, y + i, TILE - 6, 3, '#55607a');
    }
  }
  for (const drain of DRAINS) {
    const x = drain.x * TILE + 5;
    const y = drain.y * TILE + 6;
    px(ctx, x, y, 6, 5, '#1d222d');
    px(ctx, x + 1, y + 1, 4, 1, '#3a4358');
    px(ctx, x + 1, y + 3, 4, 1, '#3a4358');
  }
  for (const lamp of LAMPS) {
    const x = lamp.x * TILE + 6;
    const y = lamp.y * TILE;
    px(ctx, x, y + 4, 2, 11, C.lamp);
    px(ctx, x - 2, y + 1, 6, 4, C.lamp);
    px(ctx, x - 1, y + 3, 4, 2, C.lampHead);
    px(ctx, x - 2, y + 15, 6, 1, C.shadow);
  }
  for (const bench of BENCHES) {
    const x = bench.x * TILE + 2;
    const y = bench.y * TILE + 6;
    px(ctx, x, y, 12, 3, '#4a3b2a');
    px(ctx, x + 1, y + 3, 2, 3, '#33261f');
    px(ctx, x + 9, y + 3, 2, 3, '#33261f');
  }
  // 公園的噴水池
  const fx = FOUNTAIN.x * TILE;
  const fy = FOUNTAIN.y * TILE;
  px(ctx, fx + 1, fy + 4, 14, 9, '#39435c');
  px(ctx, fx + 3, fy + 6, 10, 5, C.water);
  const spray = Math.round(Math.sin(time / 320) * 1);
  px(ctx, fx + 7, fy + 1 + spray, 2, 5, C.waterFoam);
  px(ctx, fx + 6, fy + 3 + spray, 4, 1, C.waterFoam);

  // 小鎮入口的招牌
  const sx = ENTRANCE_SIGN.x * TILE;
  const sy = ENTRANCE_SIGN.y * TILE;
  px(ctx, sx + 2, sy + 8, 2, 7, C.boardEdge);
  px(ctx, sx, sy + 2, 15, 7, C.board);
  px(ctx, sx + 1, sy + 3, 13, 5, '#241d15');
  px(ctx, sx + 3, sy + 5, 9, 1, C.paper);
}

/* ---------- 建築 ---------- */
export function drawBuilding(ctx, place, { tone, state, time, index = 0 }) {
  const t = TONES[tone] || TONES.school;
  const x = place.col * TILE;
  const y = place.row * TILE;
  const w = place.w * TILE;
  const h = place.h * TILE;
  const soon = state === 'soon';
  const lit = !soon;

  px(ctx, x + 2, y + h - 3, w - 4, 4, C.shadow);
  // 牆
  px(ctx, x + 2, y + 14, w - 4, h - 16, t.wall);
  px(ctx, x + 2, y + h - 8, w - 4, 6, t.wallDark);
  px(ctx, x + 3, y + 15, 1, h - 20, '#ffffff10');
  // 屋頂
  px(ctx, x, y + 8, w, 8, t.roof);
  px(ctx, x + 3, y + 4, w - 6, 5, t.roof);
  px(ctx, x + 6, y + 2, w - 12, 3, t.roof);
  px(ctx, x + 6, y + 2, w - 12, 1, '#ffffff18');
  px(ctx, x, y + 15, w, 2, C.roofDark);

  if (t.chimney) {
    px(ctx, x + w - 16, y - 2, 6, 10, t.wallDark);
    px(ctx, x + w - 17, y - 3, 8, 2, C.roofDark);
    if (lit) {
      for (let i = 0; i < 3; i++) {
        const drift = Math.sin(time / 600 + i) * 2;
        ctx.globalAlpha = 0.18 - i * 0.05;
        px(ctx, x + w - 15 + drift, y - 6 - i * 4, 3, 3, '#c9d5e8');
        ctx.globalAlpha = 1;
      }
    }
  }
  if (t.tower) {
    px(ctx, x + 6, y - 6, 10, 20, t.wallDark);
    px(ctx, x + 4, y - 9, 14, 4, t.roof);
    px(ctx, x + 9, y - 3, 4, 4, lit ? C.window : C.windowOff);
  }

  // 窗戶
  const windows = t.glass
    ? [[6, 22, 20, 12], [30, 22, 12, 12]]
    : [[7, 20, 10, 8], [w - 17, 20, 10, 8], [7, 32, 10, 7], [w - 17, 32, 10, 7]];
  windows.forEach(([wx, wy, ww, wh], i) => {
    if (wy + wh > h - 4) return;
    px(ctx, x + wx, y + wy, ww, wh, soon ? C.windowOff : C.window);
    if (!soon) {
      const flicker = Math.sin(time / (700 + i * 230) + index) > 0.93;
      if (flicker) px(ctx, x + wx, y + wy, ww, wh, C.windowGlow);
      px(ctx, x + wx, y + wy, ww, 1, '#00000030');
      px(ctx, x + wx + Math.floor(ww / 2), y + wy, 1, wh, '#00000040');
    }
    px(ctx, x + wx - 1, y + wy - 1, ww + 2, 1, t.wallDark);
  });
  if (t.skylight && !soon) px(ctx, x + w - 24, y + 5, 10, 4, C.window);

  // 門
  const doorX = x + (w >> 1) - (t.garage ? 12 : 6);
  const doorW = t.garage ? 24 : 12;
  const doorY = y + h - 18;
  px(ctx, doorX - 1, doorY - 1, doorW + 2, 15, t.wallDark);
  px(ctx, doorX, doorY, doorW, 14, C.door);
  if (t.garage) for (let i = 2; i < 14; i += 3) px(ctx, doorX, doorY + i, doorW, 1, '#1a1410');
  else {
    px(ctx, doorX + doorW - 4, doorY + 7, 2, 2, C.doorGlow);
    if (lit) { ctx.globalAlpha = 0.5; px(ctx, doorX, doorY + 12, doorW, 2, C.doorGlow); ctx.globalAlpha = 1; }
  }

  // 門口灑出來的光
  if (lit) {
    ctx.globalAlpha = 0.16;
    px(ctx, doorX - 3, y + h - 4, doorW + 6, 4, C.doorGlow);
    ctx.globalAlpha = 0.1;
    px(ctx, doorX - 6, y + h, doorW + 12, 4, C.doorGlow);
    ctx.globalAlpha = 1;
  }

  // 招牌
  const signW = Math.min(30, w - 16);
  const signX = x + ((w - signW) >> 1);
  const signY = y + 17;
  px(ctx, signX - 1, signY - 1, signW + 2, 8, '#11151f');
  if (soon) {
    px(ctx, signX, signY, signW, 6, '#2b3446');
  } else {
    const pulse = 0.72 + Math.sin(time / 520 + index) * 0.28;
    ctx.globalAlpha = pulse;
    px(ctx, signX, signY, signW, 6, t.sign);
    ctx.globalAlpha = 1;
    px(ctx, signX + 2, signY + 1, signW - 4, 1, '#ffffff55');
  }
  if (t.awning && !soon) {
    for (let i = 0; i < w - 12; i += 6) {
      px(ctx, x + 6 + i, y + 26, 3, 4, t.sign);
      px(ctx, x + 9 + i, y + 26, 3, 4, '#ffffff22');
    }
  }
  if (t.globe && !soon) {
    px(ctx, x + w - 14, y + 30, 7, 7, '#2b62bd');
    px(ctx, x + w - 13, y + 32, 5, 1, '#8fc6ff');
    px(ctx, x + w - 12, y + 34, 3, 1, '#8fc6ff');
  }

  if (soon) drawScaffolding(ctx, x, y, w, h, time);
}

function drawScaffolding(ctx, x, y, w, h, time) {
  // 鷹架
  for (const bx of [x + 3, x + w - 6]) {
    px(ctx, bx, y + 10, 2, h - 14, C.fence);
    px(ctx, bx, y + 10, 2, 1, C.tape);
  }
  px(ctx, x + 3, y + 24, w - 6, 2, C.fence);
  px(ctx, x + 3, y + 38, w - 6, 2, C.fenceDark);
  // 警示帶
  for (let i = 0; i < w - 8; i += 6) {
    px(ctx, x + 4 + i, y + h - 10, 3, 3, C.tape);
    px(ctx, x + 7 + i, y + h - 10, 3, 3, C.tapeDark);
  }
  // 三角錐
  const cx = x + w - 14;
  const cy = y + h - 6;
  px(ctx, cx + 1, cy - 5, 3, 2, '#e07a3c');
  px(ctx, cx, cy - 3, 5, 2, '#f1bd62');
  px(ctx, cx - 1, cy - 1, 7, 2, '#e07a3c');
  if (Math.sin(time / 500) > 0) px(ctx, cx + 1, cy - 7, 2, 2, '#f1bd62');
}

/** 公園裡的圖鑑佈告欄。 */
export function drawBoard(ctx, place, { time, found }) {
  const x = place.col * TILE;
  const y = place.row * TILE;
  px(ctx, x + 3, y + 12, 2, 4, C.boardEdge);
  px(ctx, x + 11, y + 12, 2, 4, C.boardEdge);
  px(ctx, x, y + 2, 16, 11, C.board);
  px(ctx, x + 1, y + 3, 14, 9, '#1d1710');
  for (let i = 0; i < 3; i++) {
    const on = i < found;
    px(ctx, x + 3 + i * 4, y + 5, 3, 4, on ? C.paper : '#3a3128');
    if (on && Math.sin(time / 600 + i) > 0.8) px(ctx, x + 3 + i * 4, y + 5, 3, 1, '#ffffff');
  }
  px(ctx, x, y + 2, 16, 1, C.boardEdge);
}

/* ---------- 角色 ---------- */
export function drawCharacter(ctx, worldX, worldY, dir, phase, moving) {
  const x = Math.round(worldX) - 5;
  const y = Math.round(worldY) - 16;
  const step = moving ? phase % 4 : 0;
  const bob = moving ? (step === 1 || step === 3 ? 1 : 0) : (Math.sin(Date.now() / 700) > 0.6 ? 1 : 0);
  const top = y + bob;
  const outline = '#0c1018';

  ctx.globalAlpha = 0.5;
  px(ctx, x + 1, y + 15, 8, 2, '#000000');
  ctx.globalAlpha = 1;

  // 腳
  const legA = step === 1 ? 1 : 0;
  const legB = step === 3 ? 1 : 0;
  px(ctx, x + 2, top + 12 - legA, 3, 4, C.pants);
  px(ctx, x + 5, top + 12 - legB, 3, 4, C.pants);
  px(ctx, x + 2, top + 15 - legA, 3, 1, C.shoe);
  px(ctx, x + 5, top + 15 - legB, 3, 1, C.shoe);

  // 身體（含描邊）
  px(ctx, x, top + 6, 10, 7, outline);
  px(ctx, x + 1, top + 7, 8, 5, C.shirt);
  px(ctx, x + 1, top + 11, 8, 1, C.shirtDark);
  px(ctx, x + 2, top + 7, 6, 1, '#a8d0ff');
  // 書包：背面看得到，正面只露出肩帶
  if (dir === 'up') { px(ctx, x + 2, top + 7, 6, 5, C.bag); px(ctx, x + 3, top + 8, 4, 1, '#c9922f'); }
  else if (dir === 'down') { px(ctx, x + 2, top + 7, 1, 4, C.bag); px(ctx, x + 7, top + 7, 1, 4, C.bag); }
  else { px(ctx, dir === 'left' ? x + 6 : x + 3, top + 8, 2, 4, C.bag); }
  // 手
  const swing = moving ? (step === 1 ? 1 : step === 3 ? -1 : 0) : 0;
  px(ctx, x, top + 8 + swing, 1, 3, C.skin);
  px(ctx, x + 9, top + 8 - swing, 1, 3, C.skin);

  // 頭（含描邊）
  px(ctx, x, top - 1, 10, 8, outline);
  px(ctx, x + 1, top, 8, 6, C.skin);
  px(ctx, x + 1, top, 8, 2, C.hair);
  px(ctx, x + 1, top, 8, 1, C.hairDark);
  px(ctx, x + 1, top + 2, 1, 1, C.hair);
  px(ctx, x + 8, top + 2, 1, 1, C.hair);
  if (dir === 'down') {
    px(ctx, x + 3, top + 3, 1, 2, '#1b1d2b');
    px(ctx, x + 6, top + 3, 1, 2, '#1b1d2b');
    px(ctx, x + 4, top + 5, 2, 1, '#d08a6a');
  } else if (dir === 'left') {
    px(ctx, x + 2, top + 3, 1, 2, '#1b1d2b');
    px(ctx, x + 1, top + 2, 2, 1, C.hair);
  } else if (dir === 'right') {
    px(ctx, x + 7, top + 3, 1, 2, '#1b1d2b');
    px(ctx, x + 7, top + 2, 2, 1, C.hair);
  } else {
    px(ctx, x + 1, top, 8, 5, C.hair);
    px(ctx, x + 2, top + 1, 6, 1, C.hairDark);
    px(ctx, x + 3, top + 4, 4, 1, C.skin);
  }
}

/* ---------- 燈光與氣氛 ---------- */
export function drawNight(ctx, width, height, lights, time) {
  ctx.fillStyle = 'rgba(9, 12, 24, 0.42)';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';
  for (const light of lights) {
    const pulse = 1 + Math.sin(time / 900 + light.x) * 0.06;
    const radius = light.r * pulse;
    const glow = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, radius);
    glow.addColorStop(0, light.colour);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(light.x - radius, light.y - radius, radius * 2, radius * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function drawFireflies(ctx, flies, time) {
  for (const fly of flies) {
    const x = fly.x + Math.sin(time / fly.speed + fly.seed) * 12;
    const y = fly.y + Math.cos(time / (fly.speed * 1.4) + fly.seed) * 8;
    ctx.globalAlpha = 0.35 + Math.sin(time / 400 + fly.seed) * 0.35;
    px(ctx, x, y, 1, 1, '#ffe9a8');
    ctx.globalAlpha = 1;
  }
}

/** 建築上方的提示：沒去過是「!」，破關是星星。 */
export function drawMarker(ctx, cx, y, kind, stars, time) {
  const bob = Math.round(Math.sin(time / 420) * 2);
  if (kind === 'new') {
    const x = cx - 4;
    const top = y + bob;
    px(ctx, x, top, 8, 10, '#0f1420');
    px(ctx, x + 1, top + 1, 6, 8, '#3b82f6');
    px(ctx, x + 3, top + 2, 2, 4, '#ffffff');
    px(ctx, x + 3, top + 7, 2, 1, '#ffffff');
    px(ctx, x + 3, top + 10, 2, 2, '#0f1420');
  } else if (kind === 'stars') {
    for (let i = 0; i < 3; i++) {
      const x = cx - 10 + i * 7;
      const top = y + bob + (i === 1 ? -1 : 0);
      const colour = i < stars ? '#f1bd62' : '#39425a';
      px(ctx, x + 2, top, 1, 5, colour);
      px(ctx, x, top + 2, 5, 1, colour);
      px(ctx, x + 1, top + 1, 3, 3, colour);
    }
  }
}
