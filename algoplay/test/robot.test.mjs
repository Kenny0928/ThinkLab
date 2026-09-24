import test from 'node:test';
import assert from 'node:assert/strict';
import { compile, runRobot, judgeRobot, toPython, secretsFor, STARTER, AI_PROGRAM, VARIABLES, RobotError } from '../modules/binary-search/robot-core.js';

const v = id => ({ VAR: { id } });
const get = id => ({ block: { type: 'variables_get', fields: v(id) } });
const num = n => ({ shadow: { type: 'math_number', fields: { NUM: n } } });
const answer = key => ({ block: { type: 'robot_answer', fields: { ANS: key } } });
const set = (id, value, next) => ({ type: 'variables_set', fields: v(id), inputs: { VALUE: { block: value } }, ...(next ? { next: { block: next } } : {}) });
const arith = (op, a, b) => ({ type: 'math_arithmetic', fields: { OP: op }, inputs: { A: a, B: b } });
const compare = (op, a, b) => ({ type: 'logic_compare', fields: { OP: op }, inputs: { A: a, B: b } });
const program = first => ({ blocks: { languageVersion: 0, blocks: [{ type: 'robot_start', id: 'start', next: { block: first } }] }, variables: VARIABLES });

// 參考解法：二分搜尋
const SOLUTION = program(
  set('v_low', { type: 'robot_min' },
    set('v_high', { type: 'robot_max' }, {
      type: 'controls_whileUntil', fields: { MODE: 'WHILE' },
      inputs: {
        BOOL: { block: compare('LTE', get('v_low'), get('v_high')) },
        DO: { block: set('v_mid', { type: 'robot_floordiv', inputs: { A: { block: arith('ADD', get('v_low'), get('v_high')) }, B: num(2) } },
          set('v_ans', { type: 'robot_guess', inputs: { NUM: get('v_mid') } }, {
            type: 'controls_if', extraState: { elseIfCount: 1 },
            inputs: {
              IF0: { block: compare('EQ', get('v_ans'), answer('SMALL')) },
              DO0: { block: set('v_low', arith('ADD', get('v_mid'), num(1))) },
              IF1: { block: compare('EQ', get('v_ans'), answer('BIG')) },
              DO1: { block: set('v_high', arith('MINUS', get('v_mid'), num(1))) }
            }
          })) }
      }
    })));

test('binary search robot earns every star', () => {
  const small = judgeRobot(SOLUTION, { min: 1, max: 100, budget: 7, maxGuesses: 200 });
  assert.equal(small.pass, true);
  assert.equal(small.tested, 100);
  assert.equal(small.most, 7);
  assert.equal(small.withinBudget, true);
  const big = judgeRobot(SOLUTION, { min: 1, max: 1_000_000, budget: 20, maxGuesses: 1000 });
  assert.equal(big.pass, true);
  assert.ok(big.most <= 20);
});

test('linear AI program works on 1..100 but not within budget, and fails on a million', () => {
  const small = judgeRobot(AI_PROGRAM, { min: 1, max: 100, budget: 7, maxGuesses: 200 });
  assert.equal(small.pass, true);
  assert.equal(small.most, 100);
  assert.equal(small.worst, 100);
  assert.equal(small.withinBudget, false);
  const big = judgeRobot(AI_PROGRAM, { min: 1, max: 1_000_000, budget: 20, maxGuesses: 1000 });
  assert.equal(big.pass, false);
  assert.match(big.failure.error.message, /1,000 次還沒猜中/);
});

test('starter program ends without guessing', () => {
  const result = runRobot(compile(STARTER), { min: 1, max: 100, secret: 42 });
  assert.equal(result.found, false);
  assert.match(result.error.message, /一次都沒有猜/);
});

test('missing start block, empty sockets, unset variables and non-integers give readable errors', () => {
  assert.throws(() => compile({ blocks: { blocks: [] } }), RobotError);
  const empty = runRobot(compile(program(set('v_ans', { type: 'robot_guess', id: 'g' })) ), { min: 1, max: 100, secret: 5 });
  assert.match(empty.error.message, /空格/);
  assert.equal(empty.error.blockId, 'g');
  const unset = runRobot(compile(program(set('v_ans', { type: 'robot_guess', inputs: { NUM: get('v_mid') } }))), { min: 1, max: 100, secret: 5 });
  assert.match(unset.error.message, /mid/);
  const half = runRobot(compile(program(set('v_ans', { type: 'robot_guess', inputs: { NUM: { block: arith('DIVIDE', { block: { type: 'robot_max' } }, num(3)) } } }))), { min: 1, max: 100, secret: 5 });
  assert.match(half.error.message, /整數/);
});

test('infinite loops stop at the step limit', () => {
  const forever = program({ type: 'controls_whileUntil', id: 'w', fields: { MODE: 'WHILE' }, inputs: { BOOL: { block: { type: 'logic_boolean', fields: { BOOL: 'TRUE' } } } } });
  const result = runRobot(compile(forever), { min: 1, max: 100, secret: 5, maxSteps: 5000 });
  assert.equal(result.found, false);
  assert.match(result.error.message, /停不下來/);
});

test('break leaves only the innermost loop and guesses keep variable snapshots', () => {
  const prog = program(set('v_low', { type: 'robot_min' }, {
    type: 'controls_repeat_ext', inputs: { TIMES: num(3), DO: { block: set('v_ans', { type: 'robot_guess', inputs: { NUM: get('v_low') } }, { type: 'controls_flow_statements', fields: { FLOW: 'BREAK' } }) } },
    next: { block: set('v_ans', { type: 'robot_guess', inputs: { NUM: num(50) } }) }
  }));
  const result = runRobot(compile(prog), { min: 1, max: 100, secret: 50 });
  assert.equal(result.found, true);
  assert.deepEqual(result.guesses.map(g => g.x), [1, 50]);
  assert.equal(result.guesses[1].vars.low, 1);
});

test('secret samples are deterministic and include the edges', () => {
  const a = secretsFor(1, 1_000_000);
  assert.deepEqual(a, secretsFor(1, 1_000_000));
  assert.equal(a.length, 60);
  for (const edge of [1, 2, 999_999, 1_000_000]) assert.ok(a.includes(edge));
  assert.equal(secretsFor(1, 100).length, 100);
});

test('python output matches the blocks', () => {
  const py = toPython(SOLUTION);
  const body = py.split('\n').filter(line => line && !line.startsWith('#')).join('\n');
  assert.equal(body, [
    'low = MIN_NUM',
    'high = MAX_NUM',
    'while low <= high:',
    '    mid = (low + high) // 2',
    '    ans = guess(mid)',
    "    if ans == '太小':",
    '        low = mid + 1',
    "    elif ans == '太大':",
    '        high = mid - 1'
  ].join('\n'));
  assert.match(toPython(AI_PROGRAM), /while True:\n {4}ans = guess\(low\)\n {4}low \+= 1/);
  assert.match(toPython({ blocks: { blocks: [] } }), /^# 找不到/);
});
