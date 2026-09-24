// 教機器人玩終極密碼：解譯 Blockly 的 JSON 存檔、評分、轉成 Python。
// 只認得工具箱裡的積木，不使用 eval；每次執行都有步數與猜測次數上限。

export const ANSWERS = { BIG: '太大', SMALL: '太小', HIT: '猜中' };

export class RobotError extends Error {
  constructor(message, blockId = null) {
    super(message);
    this.blockId = blockId;
  }
}

const HIT = Symbol('hit');
const BREAK = Symbol('break');
const CONTINUE = Symbol('continue');

const LABELS = {
  variables_set: '設定變數', math_change: '變數增加', controls_if: '如果', controls_whileUntil: '重複',
  controls_repeat_ext: '重複幾次', math_arithmetic: '計算', robot_floordiv: '取整數', logic_compare: '比較',
  logic_operation: '且／或', logic_negate: '不是', robot_guess: '猜'
};

/** 整理存檔：找出「機器人開始玩」和變數名稱。 */
export function compile(json) {
  const tops = json?.blocks?.blocks || [];
  const starts = tops.filter(b => b.type === 'robot_start');
  if (!starts.length) throw new RobotError('找不到「🤖 機器人開始玩」積木。從「機器人」分類拖一個出來，把程式接在它下面。');
  const names = new Map((json.variables || []).map(v => [v.id, v.name]));
  return { entry: starts[0], names, loose: tops.length - 1, starts: starts.length };
}

function varName(program, block) {
  const field = block.fields?.VAR;
  const id = typeof field === 'object' ? field.id : field;
  return program.names.get(id) || field?.name || '（沒有名字的變數）';
}

function inputBlock(block, name) {
  const input = block.inputs?.[name];
  return input?.block || input?.shadow || null;
}

/**
 * 執行一局。回傳 { found, guesses, error }。
 * guesses 的每一筆：{ x, answer, blockId, vars }，可以拿來重播。
 */
export function runRobot(program, { min, max, secret, maxGuesses = 1000, maxSteps = 100000 }) {
  const vars = new Map();
  const guesses = [];
  let steps = 0;

  const tick = block => {
    if (++steps > maxSteps) throw new RobotError(`積木已經執行超過 ${maxSteps.toLocaleString('zh-TW')} 步，可能是停不下來的迴圈。`, block.id);
  };
  const label = block => LABELS[block.type] || '積木';
  const need = (block, name) => {
    const child = inputBlock(block, name);
    if (!child) throw new RobotError(`「${label(block)}」積木還有空格沒有填。`, block.id);
    return evaluate(child);
  };
  const number = (value, block) => {
    if (typeof value !== 'number' || Number.isNaN(value)) throw new RobotError('這裡要放數字。', block.id);
    return value;
  };
  const truth = (value, block) => {
    if (typeof value !== 'boolean') throw new RobotError('條件的地方要放「比較」或「對／錯」積木。', block.id);
    return value;
  };

  function evaluate(block) {
    tick(block);
    switch (block.type) {
      case 'math_number': return Number(block.fields.NUM);
      case 'text': return String(block.fields.TEXT ?? '');
      case 'logic_boolean': return block.fields.BOOL === 'TRUE';
      case 'robot_min': return min;
      case 'robot_max': return max;
      case 'robot_answer': return ANSWERS[block.fields.ANS];
      case 'variables_get': {
        const name = varName(program, block);
        if (!vars.has(name)) throw new RobotError(`變數「${name}」還沒有設定值就被拿來用了。`, block.id);
        return vars.get(name);
      }
      case 'math_arithmetic': {
        const a = number(need(block, 'A'), block);
        const b = number(need(block, 'B'), block);
        switch (block.fields.OP) {
          case 'ADD': return a + b;
          case 'MINUS': return a - b;
          case 'MULTIPLY': return a * b;
          case 'DIVIDE':
            if (b === 0) throw new RobotError('不能除以 0。', block.id);
            return a / b;
          case 'POWER': return a ** b;
          default: throw new RobotError('不認得的計算。', block.id);
        }
      }
      case 'robot_floordiv': {
        const a = number(need(block, 'A'), block);
        const b = number(need(block, 'B'), block);
        if (b === 0) throw new RobotError('不能除以 0。', block.id);
        return Math.floor(a / b);
      }
      case 'logic_compare': {
        const a = need(block, 'A');
        const b = need(block, 'B');
        switch (block.fields.OP) {
          case 'EQ': return a === b;
          case 'NEQ': return a !== b;
          case 'LT': return a < b;
          case 'LTE': return a <= b;
          case 'GT': return a > b;
          case 'GTE': return a >= b;
          default: throw new RobotError('不認得的比較。', block.id);
        }
      }
      case 'logic_operation': {
        const a = truth(need(block, 'A'), block);
        if (block.fields.OP === 'AND') return a && truth(need(block, 'B'), block);
        return a || truth(need(block, 'B'), block);
      }
      case 'logic_negate': return !truth(need(block, 'BOOL'), block);
      case 'robot_guess': {
        const x = number(need(block, 'NUM'), block);
        if (!Number.isInteger(x)) throw new RobotError(`猜的數字要是整數，機器人猜了 ${x}。試試「取整數」積木。`, block.id);
        const key = x === secret ? 'HIT' : x < secret ? 'SMALL' : 'BIG';
        guesses.push({ x, answer: ANSWERS[key], blockId: block.id, vars: Object.fromEntries(vars) });
        if (key === 'HIT') throw HIT;
        if (guesses.length >= maxGuesses) throw new RobotError(`猜了 ${maxGuesses.toLocaleString('zh-TW')} 次還沒猜中。`, block.id);
        return ANSWERS[key];
      }
      default:
        throw new RobotError('這塊積木不能放在這裡。', block.id);
    }
  }

  function loop(block, body) {
    try { runChain(body); } catch (signal) {
      if (signal === BREAK) return false;
      if (signal !== CONTINUE) throw signal;
    }
    return true;
  }

  function exec(block) {
    tick(block);
    switch (block.type) {
      case 'robot_start': return;
      case 'variables_set':
        vars.set(varName(program, block), need(block, 'VALUE'));
        return;
      case 'math_change': {
        const name = varName(program, block);
        if (!vars.has(name)) throw new RobotError(`變數「${name}」還沒有設定值，不能增加。`, block.id);
        vars.set(name, number(vars.get(name), block) + number(need(block, 'DELTA'), block));
        return;
      }
      case 'controls_if': {
        const branches = (block.extraState?.elseIfCount || 0) + 1;
        for (let k = 0; k < branches; k++) {
          if (truth(need(block, `IF${k}`), block)) { runChain(inputBlock(block, `DO${k}`)); return; }
        }
        if (block.extraState?.hasElse) runChain(inputBlock(block, 'ELSE'));
        return;
      }
      case 'controls_whileUntil': {
        const until = block.fields.MODE === 'UNTIL';
        while (true) {
          tick(block);
          const condition = truth(need(block, 'BOOL'), block);
          if (until ? condition : !condition) return;
          if (!loop(block, inputBlock(block, 'DO'))) return;
        }
      }
      case 'controls_repeat_ext': {
        const times = number(need(block, 'TIMES'), block);
        for (let k = 0; k < times; k++) {
          tick(block);
          if (!loop(block, inputBlock(block, 'DO'))) return;
        }
        return;
      }
      case 'controls_flow_statements':
        throw block.fields.FLOW === 'BREAK' ? BREAK : CONTINUE;
      default:
        throw new RobotError('這塊積木不能單獨放著。', block.id);
    }
  }

  function runChain(block) {
    for (let current = block; current; current = current.next?.block) exec(current);
  }

  try {
    runChain(program.entry);
    return { found: false, guesses, error: new RobotError(guesses.length ? '程式跑完了，還沒猜中。' : '程式跑完了，機器人一次都沒有猜。', program.entry.id) };
  } catch (signal) {
    if (signal === HIT) return { found: true, guesses };
    if (signal === BREAK || signal === CONTINUE) return { found: false, guesses, error: new RobotError('「跳出迴圈」要放在迴圈裡面。', null) };
    if (signal instanceof RobotError) return { found: false, guesses, error: signal };
    throw signal;
  }
}

/** 要測試的答案：範圍小就全部測，範圍大就測兩端加上固定的抽樣。 */
export function secretsFor(min, max, samples = 60) {
  if (max - min + 1 <= 1000) return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const set = new Set([min, min + 1, max - 1, max, Math.floor((min + max) / 2), Math.floor((min + max) / 2) + 1]);
  let seed = 20260922;
  while (set.size < samples) {
    seed = (seed * 16807) % 2147483647;
    set.add(min + (seed % (max - min + 1)));
  }
  return [...set];
}

/** 用很多個答案測試機器人；遇到第一個失敗就停下來。 */
export function judgeRobot(json, { min, max, budget, maxGuesses }) {
  const program = compile(json);
  const secrets = secretsFor(min, max);
  let most = 0;
  let worst = null;
  let total = 0;
  let tested = 0;
  for (const secret of secrets) {
    const result = runRobot(program, { min, max, secret, maxGuesses });
    tested++;
    if (!result.found) {
      return { min, max, budget, tested, total: secrets.length, pass: false, failure: { secret, error: result.error, count: result.guesses.length } };
    }
    const used = result.guesses.length;
    total += used;
    if (used > most) { most = used; worst = secret; }
  }
  return { min, max, budget, tested, total: secrets.length, pass: true, most, worst, average: total / secrets.length, withinBudget: most <= budget };
}

/* ---------- 積木 → Python ---------- */

const PY_KEYWORDS = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));

function pyName(name) {
  let safe = String(name).replace(/[^\p{L}\p{N}_]/gu, '_');
  if (!safe || /^\p{N}/u.test(safe)) safe = `_${safe}`;
  return PY_KEYWORDS.has(safe) ? `${safe}_` : safe;
}

const OPS = {
  ADD: ['+', 5], MINUS: ['-', 5], MULTIPLY: ['*', 6], DIVIDE: ['/', 6], POWER: ['**', 8],
  EQ: ['==', 4], NEQ: ['!=', 4], LT: ['<', 4], LTE: ['<=', 4], GT: ['>', 4], GTE: ['>=', 4],
  AND: ['and', 2], OR: ['or', 1]
};

export function toPython(json) {
  let program;
  try { program = compile(json); } catch (error) { return `# ${error.message}`; }

  const expr = block => {
    if (!block) return ['___', 10];
    const input = name => expr(inputBlock(block, name));
    const wrap = ([code, prec], min) => (prec < min ? `(${code})` : code);
    const binary = (op, a, b) => {
      const [symbol, prec] = OPS[op];
      return [`${wrap(input(a), prec)} ${symbol} ${wrap(input(b), prec + 1)}`, prec];
    };
    switch (block.type) {
      case 'math_number': return [String(Number(block.fields.NUM)), 10];
      case 'text': return [JSON.stringify(String(block.fields.TEXT ?? '')).replace(/^"|"$/g, "'"), 10];
      case 'logic_boolean': return [block.fields.BOOL === 'TRUE' ? 'True' : 'False', 10];
      case 'robot_min': return ['MIN_NUM', 10];
      case 'robot_max': return ['MAX_NUM', 10];
      case 'robot_answer': return [`'${ANSWERS[block.fields.ANS]}'`, 10];
      case 'variables_get': return [pyName(varName(program, block)), 10];
      case 'math_arithmetic': return binary(block.fields.OP, 'A', 'B');
      case 'robot_floordiv': return [`${wrap(input('A'), 6)} // ${wrap(input('B'), 7)}`, 6];
      case 'logic_compare': {
        const [symbol, prec] = OPS[block.fields.OP];
        return [`${wrap(input('A'), prec + 1)} ${symbol} ${wrap(input('B'), prec + 1)}`, prec];
      }
      case 'logic_operation': return binary(block.fields.OP, 'A', 'B');
      case 'logic_negate': return [`not ${wrap(input('BOOL'), 3)}`, 3];
      case 'robot_guess': return [`guess(${input('NUM')[0]})`, 10];
      default: return ['___', 10];
    }
  };

  const lines = [];
  const emitChain = (block, depth) => {
    const start = lines.length;
    for (let current = block; current; current = current.next?.block) emit(current, depth);
    if (lines.length === start) lines.push(`${'    '.repeat(depth)}pass`);
  };
  const emit = (block, depth) => {
    const pad = '    '.repeat(depth);
    const input = name => expr(inputBlock(block, name))[0];
    switch (block.type) {
      case 'robot_start': return;
      case 'variables_set': lines.push(`${pad}${pyName(varName(program, block))} = ${input('VALUE')}`); return;
      case 'math_change': lines.push(`${pad}${pyName(varName(program, block))} += ${input('DELTA')}`); return;
      case 'controls_if': {
        const branches = (block.extraState?.elseIfCount || 0) + 1;
        for (let k = 0; k < branches; k++) {
          lines.push(`${pad}${k ? 'elif' : 'if'} ${input(`IF${k}`)}:`);
          emitChain(inputBlock(block, `DO${k}`), depth + 1);
        }
        if (block.extraState?.hasElse) {
          lines.push(`${pad}else:`);
          emitChain(inputBlock(block, 'ELSE'), depth + 1);
        }
        return;
      }
      case 'controls_whileUntil': {
        const condition = expr(inputBlock(block, 'BOOL'));
        const code = block.fields.MODE === 'UNTIL' ? `not ${condition[1] < 3 ? `(${condition[0]})` : condition[0]}` : condition[0];
        lines.push(`${pad}while ${code}:`);
        emitChain(inputBlock(block, 'DO'), depth + 1);
        return;
      }
      case 'controls_repeat_ext':
        lines.push(`${pad}for _ in range(${input('TIMES')}):`);
        emitChain(inputBlock(block, 'DO'), depth + 1);
        return;
      case 'controls_flow_statements': lines.push(`${pad}${block.fields.FLOW === 'BREAK' ? 'break' : 'continue'}`); return;
      default: lines.push(`${pad}# （這塊積木沒辦法轉成 Python）`);
    }
  };

  emitChain(program.entry.next?.block, 0);
  const header = [
    "# guess(x) 會回答 '太大'、'太小' 或 '猜中'；猜中時遊戲就結束",
    '# MIN_NUM、MAX_NUM 是這一局的範圍',
    ''
  ];
  if (program.loose) header.push(`# 注意：有 ${program.loose} 塊積木沒有接在「機器人開始玩」下面，不會執行`, '');
  return [...header, ...lines].join('\n');
}

/* ---------- 起始程式與範例 ---------- */

const v = id => ({ VAR: { id } });
const get = id => ({ block: { type: 'variables_get', fields: v(id) } });
export const VARIABLES = [
  { name: 'low', id: 'v_low' }, { name: 'high', id: 'v_high' }, { name: 'mid', id: 'v_mid' }, { name: 'ans', id: 'v_ans' }
];

export const STARTER = {
  blocks: {
    languageVersion: 0,
    blocks: [{
      type: 'robot_start', id: 'start', x: 30, y: 30,
      next: { block: {
        type: 'variables_set', fields: v('v_low'), inputs: { VALUE: { block: { type: 'robot_min' } } },
        next: { block: { type: 'variables_set', fields: v('v_high'), inputs: { VALUE: { block: { type: 'robot_max' } } } } }
      } }
    }]
  },
  variables: VARIABLES
};

/** 小 AI 的程式：從最小值開始一個一個猜。 */
export const AI_PROGRAM = {
  blocks: {
    languageVersion: 0,
    blocks: [{
      type: 'robot_start', id: 'start', x: 30, y: 30,
      next: { block: {
        type: 'variables_set', fields: v('v_low'), inputs: { VALUE: { block: { type: 'robot_min' } } },
        next: { block: {
          type: 'controls_whileUntil', fields: { MODE: 'WHILE' },
          inputs: {
            BOOL: { block: { type: 'logic_boolean', fields: { BOOL: 'TRUE' } } },
            DO: { block: {
              type: 'variables_set', fields: v('v_ans'),
              inputs: { VALUE: { block: { type: 'robot_guess', inputs: { NUM: get('v_low') } } } },
              next: { block: { type: 'math_change', fields: v('v_low'), inputs: { DELTA: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } } }
            } }
          }
        } }
      } }
    }]
  },
  variables: VARIABLES
};
