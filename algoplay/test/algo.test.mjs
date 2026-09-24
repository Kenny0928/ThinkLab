import test from 'node:test';
import assert from 'node:assert/strict';
import { binarySearch, linearSearch, collect, parseNumbers, randomCase, BINARY_CODE, LINEAR_CODE } from '../modules/binary-search/algo.js';

const reference = (nums, target) => nums.indexOf(target);

test('binary and linear search agree with indexOf on random cases', () => {
  let seed = 1;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let t = 0; t < 300; t++) {
    const size = 1 + (t % 32);
    const { nums, target } = randomCase(size, t % 3 !== 0, random);
    for (const search of [binarySearch, linearSearch]) {
      const steps = collect(search(nums, target));
      const last = steps.at(-1);
      assert.equal(last.found, reference(nums, target), `${search.name} ${nums} ${target}`);
      for (const step of steps) assert.ok(step.line >= 1 && step.line <= (search === binarySearch ? BINARY_CODE : LINEAR_CODE).length);
    }
  }
});

test('binary search compares at most ceil(log2(n+1)) times', () => {
  for (let n = 1; n <= 64; n++) {
    const nums = Array.from({ length: n }, (_, k) => k * 3);
    for (const target of [...nums, -1, n * 3]) {
      const last = collect(binarySearch(nums, target)).at(-1);
      assert.ok(last.compares <= Math.ceil(Math.log2(n + 1)), `n=${n} target=${target}`);
    }
  }
});

test('questions always contain their answer', () => {
  const { nums } = randomCase(16, true);
  for (const target of [...nums, nums[0] - 1, nums.at(-1) + 1]) {
    for (const step of collect(binarySearch(nums, target))) {
      if (step.ask) assert.ok(step.ask.options.includes(step.ask.answer));
    }
  }
});

test('parseNumbers validates input', () => {
  assert.deepEqual(parseNumbers('1, 3 5，7').nums, [1, 3, 5, 7]);
  assert.match(parseNumbers('5 3 1').error, /由小到大/);
  assert.match(parseNumbers('a b').error, /整數/);
  assert.match(parseNumbers('').error, /至少/);
});
