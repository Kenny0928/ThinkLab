import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP, COLS, ROWS, PLACES, BOARD, SPOTS, START, LAMPS, findPath, walkable, tileAt } from '../town/world.js';

test('the map is a rectangle of known tiles', () => {
  assert.equal(MAP.length, ROWS);
  for (const row of MAP) {
    assert.equal(row.length, COLS);
    for (const tile of row) assert.ok('.TWB#p'.includes(tile), tile);
  }
});

test('every building sits on building tiles and none overlap', () => {
  const taken = new Set();
  for (const place of PLACES) {
    for (let y = place.row; y < place.row + place.h; y++) {
      for (let x = place.col; x < place.col + place.w; x++) {
        assert.equal(tileAt(x, y), 'B', `${place.id} (${x},${y})`);
        assert.ok(!taken.has(`${x},${y}`), `${place.id} 重疊`);
        taken.add(`${x},${y}`);
      }
    }
  }
});

test('the player can walk from the entrance to every door', () => {
  assert.ok(walkable(START.x, START.y));
  for (const spot of SPOTS) {
    assert.ok(walkable(spot.door.x, spot.door.y), `${spot.id} 的門口不能站`);
    const path = findPath(START, spot.door);
    assert.ok(path, `走不到 ${spot.id}`);
    assert.deepEqual(path[0], START);
    assert.deepEqual(path.at(-1), spot.door);
    for (const step of path) assert.ok(walkable(step.x, step.y));
    for (let i = 1; i < path.length; i++) {
      assert.equal(Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y), 1, '每一步只能走一格');
    }
  }
});

test('the door is right next to its building', () => {
  for (const spot of [...PLACES, BOARD]) {
    const insideX = spot.door.x >= spot.col && spot.door.x < spot.col + spot.w;
    const above = spot.door.y === spot.row - 1;
    const below = spot.door.y === spot.row + spot.h;
    assert.ok(insideX && (above || below), `${spot.id} 的門口位置怪怪的`);
    assert.equal(spot.facing, above ? 'north' : 'south');
  }
});

test('BFS finds the shortest path', () => {
  const from = { x: 11, y: 14 };
  const to = { x: 4, y: 6 };
  const path = findPath(from, to);
  const shortest = Math.abs(from.x - to.x) + Math.abs(from.y - to.y) + 1;
  assert.equal(path.length, shortest);   // 街道剛好讓它不用繞路
  assert.equal(findPath(START, { x: 0, y: 0 }), null);
});
