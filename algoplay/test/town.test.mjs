import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFor, maxGuesses, halvingChain, greedyChange, minChange, bestRoute, nearestRoute, sweepRoute, routeLegs, routeLength, permutations, bruteForceRunner, randomTripMap, factorial, chineseAmount, humanDuration, firstSpotsOverAYear } from '../town/logic.js';

test('guessing game numbers', () => {
  assert.equal(answerFor(50, 30), 'small');
  assert.equal(answerFor(50, 70), 'big');
  assert.equal(answerFor(50, 50), 'hit');
  assert.equal(maxGuesses(100), 7);
  assert.equal(maxGuesses(1000), 10);
  assert.equal(maxGuesses(1_000_000), 20);
  assert.deepEqual(halvingChain(100), [100, 50, 25, 12, 6, 3, 1]);
  assert.equal(halvingChain(1_000_000).length, 20);
});

test('greedy change matches the minimum for NT coins but not for the night-market tokens', () => {
  for (let amount = 1; amount <= 200; amount++) {
    assert.equal(greedyChange([50, 10, 5, 1], amount).length, minChange([50, 10, 5, 1], amount).length);
  }
  assert.deepEqual(greedyChange([4, 3, 1], 6), [4, 1, 1]);
  assert.deepEqual(minChange([4, 3, 1], 6), [3, 3]);
  assert.deepEqual(minChange([9, 6, 5, 1], 11), [6, 5]);
  assert.equal(greedyChange([9, 6, 5, 1], 11).length, 3);
  assert.deepEqual(minChange([5, 4, 1], 8), [4, 4]);
  assert.equal(greedyChange([5, 4, 1], 8).length, 4);
});

const SCHOOL = { x: 70, y: 330 };
// 這兩張地圖的座標要跟 town/trip.js 一致
const MAP_A = [{ x: 124, y: 169 }, { x: 229, y: 299 }, { x: 317, y: 141 }, { x: 323, y: 257 }, { x: 540, y: 171 }];
const MAP_B = [{ x: 344, y: 149 }, { x: 271, y: 278 }, { x: 515, y: 312 }, { x: 193, y: 214 }, { x: 96, y: 128 }];

/**
 * 這一關的教學全靠地圖撐著，所以地圖的性質要鎖起來：
 * 兩個規則都必須找不到最短路線，而且最短路線的第一站不是離學校最近的那個
 * ——「差 1 公里的第一步，整趟差 20 幾公里」就是這一關要學生看到的東西。
 */
for (const [name, spots, want] of [
  ['A（練習）', MAP_A, { best: 79, near: 100, sweep: 92 }],
  ['B（驗收）', MAP_B, { best: 82, near: 112, sweep: 104 }]
]) {
  test(`trip map ${name}: both rules miss the shortest route`, () => {
    const best = bestRoute(SCHOOL, spots);
    const near = nearestRoute(SCHOOL, spots);
    const sweep = sweepRoute(SCHOOL, spots);
    assert.equal(best.count, 120);
    assert.equal(best.length, want.best);
    assert.equal(near.length, want.near);
    assert.equal(sweep.length, want.sweep);

    // 最短的只有一條，不然「排出最短」就沒有唯一答案
    const lengths = [...permutations(spots.length)].map(order => routeLength(SCHOOL, spots, order));
    assert.equal(lengths.filter(km => km === best.length).length, 1);

    // 兩個規則都要輸，而且不能剛好走出最短的那一條
    assert.ok(near.length > best.length && sweep.length > best.length);
    assert.notDeepEqual(near.order, best.order);
    assert.notDeepEqual(sweep.order, best.order);
    assert.notDeepEqual(near.order, sweep.order);

    // 教學點：最短路線的第一站，不是離學校最近的那個景點
    assert.notEqual(best.order[0], near.order[0]);

    // 「每次去最近的」最後一段要是全程最長：先貪小便宜，最後被迫拉回來
    const legs = routeLegs(SCHOOL, spots, near.order);
    assert.equal(legs[legs.length - 1], Math.max(...legs));

    // 學生要贏得了：比兩個規則都短的路線要留下夠多條
    const target = Math.min(near.length, sweep.length);
    assert.ok(lengths.filter(km => km < target).length >= 5);
  });
}

test('the step-by-step brute force finds the same answer as bestRoute', () => {
  for (const spots of [MAP_A, MAP_B]) {
    const runner = bruteForceRunner(SCHOOL, spots);
    while (!runner.done) runner.step(7);     // 故意用奇怪的批次大小
    assert.equal(runner.checked, 120);
    assert.equal(runner.total, 120n);
    assert.equal(runner.best.length, bestRoute(SCHOOL, spots).length);
  }
  // 六個景點也要對，而且每一條都只會被算到一次
  const six = [...MAP_A, { x: 430, y: 300 }];
  const runner = bruteForceRunner(SCHOOL, six);
  const seen = new Set();
  while (!runner.done) runner.step(100);
  assert.equal(runner.checked, 720);
  assert.equal(runner.best.length, bestRoute(SCHOOL, six).length);
  for (const order of permutations(6)) seen.add(order.join());
  assert.equal(seen.size, 720);
});

test('the endless challenge only deals maps that teach the same thing', () => {
  const area = { x0: 95, x1: 540, y0: 70, y1: 315, gap: 100 };
  for (let i = 0; i < 40; i++) {
    const map = randomTripMap({ start: SCHOOL, count: 5, area });
    assert.ok(map, '抽不到地圖');
    const lengths = [...permutations(5)].map(order => routeLength(SCHOOL, map.spots, order));
    lengths.sort((a, b) => a - b);
    assert.equal(lengths.filter(km => km === lengths[0]).length, 1);
    assert.ok(map.nearest.length > map.best.length);
    assert.ok(map.sweep.length > map.best.length);
    assert.notEqual(map.best.order[0], map.nearest.order[0]);
    assert.ok(lengths.filter(km => km < map.ruleBest).length >= 5, '贏不了的地圖');
    // 景點不能疊在一起，不然點不到
    for (let a = 0; a < map.spots.length; a++) {
      for (let b = a + 1; b < map.spots.length; b++) {
        assert.ok(Math.hypot(map.spots[a].x - map.spots[b].x, map.spots[a].y - map.spots[b].y) >= 100);
      }
    }
  }
});

test('explosion numbers', () => {
  assert.equal(factorial(6), 720n);
  assert.equal(chineseAmount(factorial(10)), '約 362 萬');
  assert.equal(chineseAmount(factorial(20)), '約 243 京');
  assert.equal(humanDuration(0.5), '不到 1 秒');
  assert.equal(firstSpotsOverAYear(1e8), 18);
  assert.equal(firstSpotsOverAYear(1e11), 21);
});
