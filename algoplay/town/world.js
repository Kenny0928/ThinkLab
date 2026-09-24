// 小鎮的世界資料：地圖格子、建築位置、找路。不碰 DOM，可以用 node --test 檢查。

export const TILE = 16;
export const COLS = 24;
export const ROWS = 16;
export const WIDTH = COLS * TILE;
export const HEIGHT = ROWS * TILE;

/**
 * 每個字元是一格：
 * `.` 草地　`T` 樹　`W` 池塘　`B` 建築　`#` 大街　`p` 門前小徑
 */
export const MAP = [
  'TT....................TT',
  'T..........##..........T',
  '......T....##T..........',
  '..BBBB.BBBB##.BBBB.BBBB.',
  '..BBBB.BBBB##.BBBB.BBBB.',
  '..BBBB.BBBB##.BBBB.BBBB.',
  '....p....p.##...p....p..',
  '.######################.',
  '.######################.',
  '....p....p.##...p...p...',
  '..BBBB.BBBB##.BBBB......',
  '..BBBB.BBBB##.BBBB......',
  '..BBBB.BBBB##.BBBB......',
  '......T....##.........T.',
  '..WWWW...T.##....T......',
  '..WWWW.....##.......T..T'
];

export const tileAt = (x, y) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? MAP[y][x] : 'T');
export const walkable = (x, y) => tileAt(x, y) === '#' || tileAt(x, y) === 'p';

/** 建築的位置：col/row 是左上角，w/h 是幾格，door 是站在門口的那一格。 */
export const PLACES = [
  { id: 'guess', col: 2, row: 3, w: 4, h: 3, door: { x: 4, y: 6 }, facing: 'south' },
  { id: 'drink', col: 7, row: 3, w: 4, h: 3, door: { x: 9, y: 6 }, facing: 'south' },
  { id: 'coins', col: 14, row: 3, w: 4, h: 3, door: { x: 16, y: 6 }, facing: 'south' },
  { id: 'bag', col: 19, row: 3, w: 4, h: 3, door: { x: 21, y: 6 }, facing: 'south' },
  { id: 'fire', col: 2, row: 10, w: 4, h: 3, door: { x: 4, y: 9 }, facing: 'north' },
  { id: 'art', col: 7, row: 10, w: 4, h: 3, door: { x: 9, y: 9 }, facing: 'north' },
  { id: 'trip', col: 14, row: 10, w: 4, h: 3, door: { x: 16, y: 9 }, facing: 'north' }
];

/** 公園裡的圖鑑佈告欄，也是一個可以走過去的地點。 */
export const BOARD = { id: 'dex', col: 20, row: 10, w: 1, h: 1, door: { x: 20, y: 9 }, facing: 'north' };

export const SPOTS = [...PLACES, BOARD];
export const spotById = id => SPOTS.find(place => place.id === id);

/** 路燈與裝飾（格子座標）。 */
export const LAMPS = [
  { x: 1, y: 6 }, { x: 6, y: 6 }, { x: 13, y: 6 }, { x: 18, y: 6 }, { x: 22, y: 6 },
  { x: 1, y: 9 }, { x: 6, y: 9 }, { x: 13, y: 9 }, { x: 18, y: 9 }, { x: 22, y: 9 },
  { x: 10, y: 13 }, { x: 13, y: 13 }
];
export const BENCHES = [{ x: 19, y: 12 }, { x: 22, y: 12 }];
export const FOUNTAIN = { x: 21, y: 11 };

/** 小 AI 站的地方：鎮口的路燈下，一進小鎮就會遇到它，走近它會轉頭看你。 */
export const AI_SPOT = { x: 10, y: 14 };

/** 小鎮入口，也是角色的起點。 */
export const START = { x: 11, y: 14 };
export const ENTRANCE_SIGN = { x: 13, y: 15 };

/**
 * 廣度優先搜尋：一層一層往外找，找到的一定是最少步數的路。
 * 回傳從起點到終點的每一格（含起點）；走不到時回傳 null。
 */
export function findPath(from, to) {
  if (!walkable(to.x, to.y)) return null;
  const key = p => `${p.x},${p.y}`;
  const queue = [from];
  const cameFrom = new Map([[key(from), null]]);
  while (queue.length) {
    const here = queue.shift();
    if (here.x === to.x && here.y === to.y) {
      const path = [];
      for (let step = here; step; step = cameFrom.get(key(step))) path.unshift(step);
      return path;
    }
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const next = { x: here.x + dx, y: here.y + dy };
      if (!walkable(next.x, next.y) || cameFrom.has(key(next))) continue;
      cameFrom.set(key(next), here);
      queue.push(next);
    }
  }
  return null;
}
