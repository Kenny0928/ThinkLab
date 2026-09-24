import test from 'node:test';
import assert from 'node:assert/strict';
import { answerFor, maxGuesses, halvingChain, greedyChange, minChange, bestRoute, nearestRoute, factorial, chineseAmount, humanDuration, firstSpotsOverAYear } from '../town/logic.js';

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

test('trip map has a unique best route that nearest-neighbour misses', () => {
  const school = { x: 70, y: 330 };
  const spots = [{ x: 160, y: 180 }, { x: 419, y: 88 }, { x: 252, y: 295 }, { x: 248, y: 91 }, { x: 540, y: 193 }];
  const best = bestRoute(school, spots);
  assert.equal(best.count, 120);
  assert.equal(best.length, 80);
  assert.equal(nearestRoute(school, spots).length, 94);
});

test('explosion numbers', () => {
  assert.equal(factorial(6), 720n);
  assert.equal(chineseAmount(factorial(10)), '約 362 萬');
  assert.equal(chineseAmount(factorial(20)), '約 243 京');
  assert.equal(humanDuration(0.5), '不到 1 秒');
  assert.equal(firstSpotsOverAYear(1e8), 18);
  assert.equal(firstSpotsOverAYear(1e11), 21);
});
