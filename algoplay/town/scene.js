// 小鎮場景：遊戲迴圈、角色走路、燈光與鏡頭。
import { TILE, WIDTH, HEIGHT, PLACES, BOARD, SPOTS, START, LAMPS, FOUNTAIN, AI_SPOT, findPath, spotById, walkable } from './world.js';
import { drawGround, drawProps, drawBuilding, drawBoard, drawCharacter, drawNight, drawFireflies, drawMarker, TONES } from './sprites.js';
import { drawAI } from '../core/cast.js';

const SPEED = 4.2;          // 每秒走幾格
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const centre = tile => ({ px: tile.x * TILE + TILE / 2, py: tile.y * TILE + TILE / 2 });

export function createScene(canvas, { onTile } = {}) {
  const ctx = canvas.getContext('2d');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  ctx.imageSmoothingEnabled = false;

  const player = { ...centre(START), tile: { ...START }, dir: 'up', path: [], phase: 0, stepTime: 0 };
  const flies = Array.from({ length: 16 }, (_, i) => ({
    x: 20 + ((i * 97) % (WIDTH - 40)), y: 30 + ((i * 53) % (HEIGHT - 60)), seed: i * 1.7, speed: 900 + i * 90
  }));
  let states = new Map();
  let arrive = null;
  let last = performance.now();
  let time = 0;
  let running = true;

  /* ---------- 走路 ---------- */
  function walkTo(target, facing) {
    return new Promise(resolve => {
      const path = findPath(player.tile, target);
      if (!path || path.length <= 1 || reduced()) {
        player.tile = { ...target };
        Object.assign(player, centre(target));
        player.dir = facing || player.dir;
        player.path = [];
        resolve();
        return;
      }
      player.path = path.slice(1);
      arrive = { resolve, facing };
    });
  }

  function update(dt) {
    if (!player.path.length) {
      if (arrive) { player.dir = arrive.facing || player.dir; arrive.resolve(); arrive = null; }
      return;
    }
    const next = player.path[0];
    const goal = centre(next);
    const step = SPEED * TILE * dt;
    const dx = goal.px - player.px;
    const dy = goal.py - player.py;
    const dist = Math.hypot(dx, dy);
    if (Math.abs(dx) > Math.abs(dy)) player.dir = dx > 0 ? 'right' : 'left';
    else player.dir = dy > 0 ? 'down' : 'up';
    if (dist <= step) {
      player.px = goal.px;
      player.py = goal.py;
      player.tile = { ...next };
      player.path.shift();
      onTile?.(player.tile);
    } else {
      player.px += (dx / dist) * step;
      player.py += (dy / dist) * step;
    }
    player.stepTime += dt;
    if (player.stepTime > 0.14) { player.stepTime = 0; player.phase = (player.phase + 1) % 4; }
  }

  /* ---------- 畫面 ---------- */
  function lights() {
    const list = LAMPS.map(lamp => ({ x: lamp.x * TILE + 7, y: lamp.y * TILE + 4, r: 30, colour: 'rgba(255, 206, 128, 0.30)' }));
    for (const place of PLACES) {
      const info = states.get(place.id);
      if (!info || info.state === 'soon') continue;
      const tone = TONES[info.tone] || TONES.school;
      list.push({ x: (place.col + place.w / 2) * TILE, y: place.row * TILE + 20, r: 26, colour: `${tone.sign}44` });
      list.push({ x: (place.col + place.w / 2) * TILE, y: (place.row + place.h) * TILE - 6, r: 22, colour: 'rgba(255, 196, 120, 0.26)' });
    }
    list.push({ x: FOUNTAIN.x * TILE + 8, y: FOUNTAIN.y * TILE + 8, r: 22, colour: 'rgba(99, 180, 214, 0.22)' });
    list.push({ x: AI_SPOT.x * TILE + 8, y: AI_SPOT.y * TILE + 8, r: 21, colour: 'rgba(109, 213, 237, 0.3)' });
    list.push({ x: player.px, y: player.py - 2, r: 18, colour: 'rgba(150, 190, 255, 0.16)' });
    return list;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawGround(ctx, time);
    drawProps(ctx, time);
    const board = states.get('dex');
    drawBoard(ctx, BOARD, { time, found: board?.found || 0 });
    PLACES.forEach((place, index) => {
      const info = states.get(place.id) || { state: 'soon', tone: 'school' };
      drawBuilding(ctx, place, { tone: info.tone, state: info.state, time, index });
    });
    // 小 AI 站在公園裡；你走近它就轉頭看你
    const aiX = AI_SPOT.x * TILE;
    const aiY = AI_SPOT.y * TILE;
    const dx = player.px - (aiX + 8);
    const near = Math.hypot(dx, player.py - (aiY + 8)) < 64;
    drawAI(ctx, aiX, aiY, { time, mood: near ? 'happy' : 'idle', look: near ? Math.sign(dx) : 0 });
    drawCharacter(ctx, player.px, player.py, player.dir, player.phase, player.path.length > 0);
    drawNight(ctx, WIDTH, HEIGHT, lights(), time);
    if (!reduced()) drawFireflies(ctx, flies, time);
    for (const place of PLACES) {
      const info = states.get(place.id);
      if (!info || info.state === 'soon') continue;
      const cx = (place.col + place.w / 2) * TILE;
      // 名牌在建築的另一邊，提示就放在門口這一側，才不會被擋住
      const y = place.facing === 'south' ? (place.row + place.h) * TILE + 1 : place.row * TILE - 12;
      if (info.state === 'done') drawMarker(ctx, cx, y, 'stars', info.stars, time);
      else if (!info.visited) drawMarker(ctx, cx, y, 'new', 0, time);
    }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- 對外的介面 ---------- */
  const scale = () => canvas.getBoundingClientRect().width / WIDTH;

  return {
    /** states：{ id: { state: 'open'|'done'|'soon', tone, stars, visited } } */
    setStates(next) { states = new Map(Object.entries(next)); },
    walkTo,
    /** 走到某個地點的門口。 */
    goTo(id) {
      const spot = spotById(id);
      return walkTo(spot.door, spot.facing === 'south' ? 'up' : 'down');
    },
    /** 走到地圖上任何一格路面。 */
    walkToTile(tile) {
      if (!walkable(tile.x, tile.y)) return Promise.resolve(false);
      return walkTo(tile).then(() => true);
    },
    playerTile: () => ({ ...player.tile }),
    placeAt(id) {
      const spot = spotById(id);
      player.tile = { ...spot.door };
      Object.assign(player, centre(spot.door));
      player.path = [];
      player.dir = spot.facing === 'south' ? 'up' : 'down';
    },
    /** 某個地點在畫面上的位置（相對於 canvas 元素，單位 px）。 */
    screenBox(id) {
      const spot = spotById(id);
      const s = scale();
      return {
        left: spot.col * TILE * s,
        top: spot.row * TILE * s,
        width: spot.w * TILE * s,
        height: spot.h * TILE * s,
        centreX: (spot.col + spot.w / 2) * TILE * s,
        doorX: spot.door.x * TILE * s,
        doorY: spot.door.y * TILE * s
      };
    },
    /** 把畫面座標換成格子座標。 */
    tileAtPoint(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const s = scale();
      return { x: Math.floor((clientX - rect.left) / s / TILE), y: Math.floor((clientY - rect.top) / s / TILE) };
    },
    stop() { running = false; },
    resume() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  };
}

export { SPOTS, PLACES, BOARD };
