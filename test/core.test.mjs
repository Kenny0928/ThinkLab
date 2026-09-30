import test from 'node:test';
import assert from 'node:assert/strict';
import {createExecution, evaluateExpression, parseAssignment, normalizeGraph, validateGraph} from './flow-core.mjs';
import {EXAMPLES} from './examples.mjs';

const copy = value => structuredClone(value);
function chain(steps) {
  const nodes = [{id: 'start', type: 'start'}, ...steps.map((step, index) => ({id: `n${index}`, ...step})), {id: 'end', type: 'end'}].map(node => ({title: '', position: {x: 0, y: 0}, data: {}, ...node}));
  return {version: 1, title: 'Test', nodes, edges: nodes.slice(1).map((node, index) => ({id: `e${index}`, source: nodes[index].id, target: node.id, branch: null})), viewport: {x: 0, y: 0, zoom: 1}};
}
const output = expression => ({type: 'output', data: {expression}});
const outputText = expression => ({type: 'output', data: {expression, outputMode: 'text'}});
const process = expression => ({type: 'process', data: {expression}});
function run(graph, inputs = [], limits) {
  const execution = createExecution(graph, limits), events = []; let result;
  for (let attempts = 0; attempts < 11000; attempts++) {
    result = execution.step(); if (result.waiting && inputs.length) result = execution.step(inputs.shift());
    if (result.event) events.push(result.event);
    if (result.waiting || result.done) return {events, result, execution, output: events.filter(event => 'output' in event).map(event => event.output)};
  }
  throw new Error('Interpreter did not stop');
}

test('all supplied examples are structurally valid', () => {
  for (const example of EXAMPLES) assert.deepEqual(validateGraph(example.graph).errors, [], example.id);
});
test('six acceptance examples compute their expected outputs', () => {
  const expected = {greeting: ['小明，你好！'], parity: ['偶數'], pass: ['及格'], max: ['12'], sum: ['15'], count: Array.from({length: 10}, (_, index) => String(index + 1))};
  for (const example of EXAMPLES.filter(item => item.id !== 'infinite')) {
    const result = run(example.graph, example.input ? example.input.split('\n') : []);
    assert.deepEqual(result.output, expected[example.id], example.id); assert.equal(result.execution.status, 'completed');
  }
});
test('both decision branches work with negative numbers and boundary conditions', () => {
  for (const [id, input, expected] of [['parity', '-3', '奇數'], ['pass', '59', '繼續加油'], ['pass', '60', '及格'], ['sum', '0', '0'], ['max', '3\n9', '9']]) assert.deepEqual(run(EXAMPLES.find(item => item.id === id).graph, input.split('\n')).output, [expected]);
});
test('precedence, numeric notation, floor division and Python modulo', () => {
  for (const [expression, value] of [['2 + 3 * 4', 14], ['(2 + 3) * 4', 20], ['-7 // 3', -3], ['-7 % 3', 2], ['7 % -3', -2], ['-6 % 3', 0], ['1.5e2 + .5', 150.5], ['not 1 > 2', true], ['1 < 2 <= 2', true], ['1 < 0 < 1 / 0', false], ['"你" + "好"', '你好'], ['"a\\n\\t\\u4f60"', 'a\n\t你']]) assert.equal(evaluateExpression(expression), value, expression);
});
test('boolean operators short circuit and reject implicit truthiness', () => {
  assert.equal(evaluateExpression('False and 1 / 0 > 3'), false);
  assert.equal(evaluateExpression('True or missing > 3'), true);
  assert.equal(evaluateExpression('True and not False'), true);
  for (const expression of ['1 and True', 'not 1', 'False or "x"', '"3" + 2', 'True + 1', '1 == "1"', 'True < False']) assert.throws(() => evaluateExpression(expression), {code: 'TYPE_ERROR'}, expression);
});
test('forbidden JS syntax, prototype names, calls and multiple statements never execute', () => {
  for (const expression of ['globalThis', 'constructor', '__proto__', 'x.constructor', 'x[0]', 'alert(1)', 'import("x")', 'new Function("return 1")()', '(() => 1)()', 'this', 'undefined', 'true', '1; 2', '`hello`']) assert.throws(() => evaluateExpression(expression), expression);
  for (const expression of ['x = 1; y = 2', 'x = y = 1', '__proto__ = 1', 'True = 1', 'x += 1', 'x == 1']) assert.throws(() => parseAssignment(expression), expression);
  assert.deepEqual(parseAssignment('x = 2').variable, 'x');
});
test('parser rejects excessive nesting and oversized expressions', () => {
  assert.throws(() => evaluateExpression('('.repeat(70) + '1' + ')'.repeat(70)), {code: 'EXPRESSION_LIMIT'});
  assert.throws(() => evaluateExpression('1+'.repeat(2200) + '1'), {code: 'EXPRESSION_LIMIT'});
  assert.throws(() => evaluateExpression('1e999'), {code: 'NUMBER_LIMIT'});
  assert.throws(() => evaluateExpression('"unterminated'), {code: 'INVALID_STRING'});
});
test('division, overflow and string limits are clear runtime errors', () => {
  for (const [expression, code] of [['1 / 0', 'DIVISION_BY_ZERO'], ['1 // 0', 'DIVISION_BY_ZERO'], ['1 % 0', 'DIVISION_BY_ZERO'], ['1e308 * 10', 'NUMBER_LIMIT']]) assert.equal(run(chain([output(expression)])).result.error.code, code);
  assert.equal(run(chain([process('s = "abcd"'), process('s = s + s')]), [], {maxString: 6}).result.error.code, 'STRING_LIMIT');
});
test('missing decision branch and invalid Start/End connections block execution', () => {
  const graph = copy(EXAMPLES.find(example => example.id === 'parity').graph); graph.edges = graph.edges.filter(edge => edge.branch !== 'false');
  assert.ok(validateGraph(graph).errors.some(error => error.code === 'DECISION_BRANCHES' && error.nodeId === 'even'));
  assert.throws(() => createExecution(graph), {code: 'DECISION_BRANCHES'});
  const invalid = chain([]); invalid.edges.push({id: 'back', source: 'end', target: 'start', branch: null});
  const codes = validateGraph(invalid).errors.map(error => error.code); assert.ok(codes.includes('START_INCOMING')); assert.ok(codes.includes('END_OUTGOING'));
});
test('unreachable nodes warn without preventing execution', () => {
  const graph = chain([]); graph.nodes.push({id: 'spare', type: 'end', data: {}, position: {x: 300, y: 300}});
  assert.deepEqual(validateGraph(graph).errors, []); assert.ok(validateGraph(graph).warnings.some(error => error.code === 'UNREACHABLE')); assert.equal(run(graph).execution.status, 'completed');
});
test('variables nowhere defined are errors; missing branch definitions warn then fail at runtime', () => {
  assert.equal(validateGraph(chain([output('missing')])).errors[0].code, 'UNDEFINED_VARIABLE');
  const graph = copy(EXAMPLES.find(example => example.id === 'parity').graph);
  graph.nodes.find(node => node.id === 'yes').type = 'process'; graph.nodes.find(node => node.id === 'yes').data.expression = 'message = "even"';
  graph.nodes.find(node => node.id === 'no').type = 'process'; graph.nodes.find(node => node.id === 'no').data.expression = 'other = 0';
  graph.nodes.push({id: 'show', type: 'output', position: {x: 0, y: 0}, data: {expression: 'message'}});
  graph.edges.filter(edge => edge.target === 'end').forEach(edge => { edge.target = 'show'; }); graph.edges.push({id: 'last', source: 'show', target: 'end', branch: null});
  const validation = validateGraph(graph); assert.deepEqual(validation.errors, []); assert.ok(validation.warnings.some(error => error.nodeId === 'show' && error.code === 'MAYBE_UNDEFINED_VARIABLE'));
  assert.equal(run(graph, ['3']).result.error.code, 'UNDEFINED_VARIABLE'); assert.deepEqual(run(graph, ['2']).output, ['even']);
});
test('loop initialization is definitely assigned and self-assignment before definition warns', () => {
  assert.deepEqual(validateGraph(EXAMPLES.find(example => example.id === 'sum').graph).warnings, []);
  const graph = chain([process('x = x + 1')]); assert.ok(validateGraph(graph).warnings.some(issue => issue.code === 'MAYBE_UNDEFINED_VARIABLE')); assert.equal(run(graph).result.error.code, 'UNDEFINED_VARIABLE');
});
test('waiting for input adds no event or step and empty text is valid', () => {
  const execution = createExecution(EXAMPLES[0].graph); assert.equal(execution.step().event.step, 1);
  const first = execution.step(), second = execution.step(); assert.deepEqual(first, second); assert.equal(execution.state.step, 1); assert.equal(execution.status, 'waiting');
  const input = execution.step('').event; assert.equal(input.step, 2); assert.equal(input.input.value, ''); assert.deepEqual(input.variablesAfter, {name: ''}); assert.equal(execution.step().event.output, '，你好！');
});
test('typed input conversion is strict and invalid input can be corrected', () => {
  const graph = chain([{type: 'input', data: {variable: 'value', prompt: '', inputType: 'integer'}}, output('value')]);
  const execution = createExecution(graph); execution.step(); execution.step();
  for (const invalid of ['', '2.5', '0x10', 'Infinity', '1e3', '9007199254740992']) { const result = execution.step(invalid); assert.equal(result.inputError.code, 'INVALID_INPUT'); assert.ok(result.waiting); assert.equal(execution.state.step, 1); }
  assert.equal(execution.step('-12').event.input.value, -12); assert.equal(execution.step().event.output, '-12');
  graph.nodes[1].data.inputType = 'boolean'; assert.equal(run(graph, ['True']).output[0], 'True'); assert.equal(run(graph, ['false']).result.inputError.code, 'INVALID_INPUT');
});
test('events are deeply immutable and later steps do not change earlier snapshots', () => {
  const result = run(chain([process('x = 1'), process('x = x + 1'), output('x')]));
  assert.deepEqual(result.events[1].variablesBefore, {}); assert.deepEqual(result.events[1].variablesAfter, {x: 1}); assert.deepEqual(result.events[2].variablesBefore, {x: 1}); assert.deepEqual(result.events[2].variablesAfter, {x: 2});
  assert.ok(Object.isFrozen(result.events[1])); assert.ok(Object.isFrozen(result.events[1].variablesAfter)); assert.throws(() => { result.events[1].variablesAfter.x = 10; }, TypeError);
  assert.equal(result.events.at(-1).type, 'end'); assert.equal(result.events.at(-1).nextNodeId, null);
});
test('failed node produces an event preserving before and after with no partial output', () => {
  const result = run(chain([process('x = 4'), process('x = 1 / 0'), output('x')])); const failed = result.events.at(-1);
  assert.equal(result.execution.status, 'error'); assert.equal(failed.nodeId, 'n1'); assert.equal(failed.error.code, 'DIVISION_BY_ZERO'); assert.deepEqual(failed.variablesBefore, {x: 4}); assert.deepEqual(failed.variablesAfter, {x: 4}); assert.deepEqual(result.output, []);
});
test('infinite loops stop at the exact maximum step count', () => {
  const result = run(EXAMPLES.find(example => example.id === 'infinite').graph, [], {maxSteps: 25});
  assert.equal(result.result.error.code, 'STEP_LIMIT'); assert.equal(result.events.length, 25); assert.equal(result.execution.state.step, 25); assert.equal(result.execution.status, 'error');
});
test('output, variables, trace and stop are bounded independently', () => {
  assert.equal(run(chain([output('"你好"')]), [], {maxOutput: 6}).result.error.code, 'OUTPUT_LIMIT');
  assert.equal(run(chain([process('a = 1'), process('b = 2')]), [], {maxVariables: 1}).result.error.code, 'VARIABLE_LIMIT');
  const trace = run(chain([process('a = 1')]), [], {maxTraceBytes: 1}); assert.equal(trace.result.error.code, 'TRACE_LIMIT'); assert.equal(trace.events.length, 0);
  const execution = createExecution(chain([])); execution.step(); execution.stop(); assert.equal(execution.status, 'stopped'); assert.deepEqual(execution.step(), {done: true});
});
test('time budget measures active computation and excludes time spent awaiting input', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'performance'); let clock = 0;
  Object.defineProperty(globalThis, 'performance', {configurable: true, value: {now: () => clock}});
  try {
    const execution = createExecution(EXAMPLES[0].graph, {maxTimeMs: 10}); execution.step(); execution.step();
    clock += 600000; assert.ok(execution.step('小明').event); assert.equal(execution.step().event.output, '小明，你好！');
    Object.defineProperty(globalThis, 'performance', {configurable: true, value: {now: () => { clock += 2; return clock; }}});
    const limited = createExecution(chain([]), {maxTimeMs: 1}); assert.equal(limited.step().error.code, 'TIME_LIMIT'); assert.equal(limited.status, 'error');
  } finally { Object.defineProperty(globalThis, 'performance', descriptor); }
});
test('execution and replay are deterministic, isolated from original graph mutations', () => {
  const graph = copy(EXAMPLES[0].graph), execution = createExecution(graph); graph.nodes.find(node => node.type === 'output').data.expression = '"changed"';
  const events = []; for (const input of [undefined, 'Alice', undefined, undefined]) { const result = execution.step(input); if (result.event) events.push(result.event); }
  assert.equal(events.find(event => event.type === 'output').output, 'Alice，你好！');
  assert.deepEqual(run(EXAMPLES[0].graph, ['Bob']).events, run(EXAMPLES[0].graph, ['Bob']).events);
});
test('variables may be named in Chinese and mix with ASCII names', () => {
  const graph = chain([{type: 'input', data: {variable: '分數', prompt: '請輸入分數', inputType: 'integer'}}, process('總分 = 分數 * 2'), output('總分')]);
  assert.deepEqual(validateGraph(graph).errors, []);
  assert.deepEqual(run(graph, ['40']).output, ['80']);
  assert.equal(evaluateExpression('數量 * 價格', {數量: 3, 價格: 25}), 75);
  assert.deepEqual(parseAssignment('平均 = 總分 / 3'), {variable: '平均', expression: {kind: 'binary', op: '/', left: {kind: 'variable', name: '總分'}, right: {kind: 'literal', value: 3}}});
  for (const name of ['2分', '分 數', 'True', '__x', '分數。']) assert.equal(validateGraph(chain([{type: 'input', data: {variable: name, prompt: '', inputType: 'integer'}}])).errors.some(issue => issue.code === 'INVALID_VARIABLE'), true, name);
  assert.equal(validateGraph(chain([output('總分（元）')])).errors[0].code, 'INVALID_TOKEN');
  assert.match(validateGraph(chain([output('總分（元）')])).errors[0].message, /半形/);
});
test('text output prints literally and substitutes variables in braces', () => {
  assert.deepEqual(run(chain([outputText('及格')])).output, ['及格']);
  assert.deepEqual(run(chain([process('分數 = 87'), outputText('總分是 {分數} 分')])).output, ['總分是 87 分']);
  assert.deepEqual(run(chain([process('x = 1'), outputText('{{x}} 是 {x}')])).output, ['{x} 是 1']);
  assert.deepEqual(run(chain([process('ok = True'), process('rate = 0.5'), outputText('{ok} {rate}')])).output, ['True 0.5']);
  assert.equal(validateGraph(chain([outputText('{沒有這個變數}')])).errors[0].code, 'UNDEFINED_VARIABLE');
  for (const [expression, code] of [['', 'EMPTY_EXPRESSION'], ['{分數', 'SYNTAX_ERROR'], ['分數}', 'SYNTAX_ERROR'], ['{}', 'SYNTAX_ERROR'], ['{2分}', 'INVALID_VARIABLE']]) assert.equal(validateGraph(chain([outputText(expression)])).errors[0].code, code, expression);
  // 文字模式只影響輸出節點；同一份檔案裡兩種寫法可以並存。
  const mixed = chain([process('n = 3'), outputText('n = {n}'), output('n')]);
  assert.deepEqual(run(mixed).output, ['n = 3', '3']);
  assert.equal(normalizeGraph(mixed).nodes[2].data.outputMode, 'text');
  assert.equal(normalizeGraph(mixed).nodes[3].data.outputMode, 'expression');
  assert.throws(() => normalizeGraph({...mixed, nodes: mixed.nodes.map(node => node.type === 'output' ? {...node, data: {...node.data, outputMode: 'markdown'}} : node)}), {code: 'INVALID_FILE'});
});
test('portable graph round-trip keeps position, viewport, content and title', () => {
  const original = copy(EXAMPLES[0].graph); original.viewport = {x: -22, y: 700, zoom: 0.5}; original.nodes[0].position = {x: -50, y: 8};
  assert.deepEqual(normalizeGraph(JSON.parse(JSON.stringify(original))), original); assert.notEqual(normalizeGraph(original), original);
});
test('import rejects unsupported versions, duplicate ids, huge data, invalid numbers and prototype data', () => {
  const good = chain([]);
  for (const mutate of [graph => { graph.version = 2; }, graph => { graph.nodes.push(copy(graph.nodes[0])); }, graph => { graph.nodes = Array.from({length: 501}, (_, index) => ({...graph.nodes[0], id: `x${index}`})); }, graph => { graph.nodes[0].position.x = Infinity; }, graph => { graph.viewport.zoom = 50; }, graph => { graph.title = 'x'.repeat(17000); }, graph => { graph.extra = () => {}; }]) { const value = copy(good); mutate(value); assert.throws(() => normalizeGraph(value)); }
  assert.throws(() => normalizeGraph(JSON.parse('{"version":1,"nodes":[],"edges":[],"__proto__":{"polluted":true}}')), {code: 'INVALID_FILE'}); assert.equal({}.polluted, undefined);
  const accessor = copy(good); let called = false; Object.defineProperty(accessor, 'evil', {enumerable: true, get() { called = true; return 1; }}); assert.throws(() => normalizeGraph(accessor)); assert.equal(called, false);
});
