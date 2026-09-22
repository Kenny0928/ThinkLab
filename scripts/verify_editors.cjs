#!/usr/bin/env node
// No npm installation needed. Tests the production controller and the vendored
// Blockly generator; only iframe transport and drawing are replaced for Node.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const problemClassification = require(path.join(root, 'assets/problem-classification.js'));
const turn = () => new Promise(resolve => setImmediate(resolve));
const timers = { setTimeout: (...args) => setTimeout(...args).unref(), clearTimeout };
const tests = [];
const test = (name, run) => tests.push({ name, run });

test('Judge stage filters combine with difficulty, search and completion status', () => {
  const manifest = JSON.parse(read('problems/index.json'));
  const counts = manifest.reduce((result, problem) => {
    result[problem.stage] = (result[problem.stage] || 0) + 1;
    return result;
  }, {});
  assert.deepEqual(counts, { Beginner: 56, Intermediate: 85, Advanced: 12, Challenge: 1 });

  const filter = (filters, solvedIds = []) => {
    const solved = new Set(solvedIds);
    return manifest
      .filter(problem => problemClassification.matches(problem, filters, solved.has(problem.id)))
      .map(problem => problem.id);
  };
  assert.deepEqual(filter({ stage: 'Challenge' }), [7]);
  assert.deepEqual(filter({ stage: 'Advanced', difficulty: 'Medium' }), [4, 145, 148, 151]);
  assert.deepEqual(filter({ search: 'APCS 實作' }), [7]);
  assert.deepEqual(filter({ stage: 'Beginner', status: 'solved' }, [0, 2, 11]), [0, 11]);
  assert.ok(filter({ stage: 'Intermediate', tag: '字串' }).every(id => manifest[id].stage === 'Intermediate'));
});

test('Judge file-mode fallback keeps classification metadata for core problems', () => {
  const html = read('judge.html');
  assert.match(html, /id="stage-filter"/);
  assert.match(html, /PROBLEM_CLASSIFICATION\.matches/);
  const literal = html.match(/const PROBLEMS_DATA = (\{[\s\S]*?\n    \});/);
  assert.ok(literal, 'Embedded fallback data must remain readable');
  const fallback = vm.runInNewContext(`(${literal[1]})`);
  const manifest = JSON.parse(read('problems/index.json'));
  for (let id = 0; id <= 10; id++) {
    for (const field of ['stage', 'audienceLevel', 'apcsLevel']) {
      assert.equal(fallback[id][field], manifest[id][field], `Fallback ${id} ${field} must match index`);
    }
  }
});

test('Judge inline scripts remain syntactically valid', () => {
  const html = read('judge.html');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, 'Judge must contain an inline controller script');
  scripts.forEach((match, index) => {
    new vm.Script(match[1], { filename: `judge.html:inline-script-${index + 1}` });
  });
});

function controller(initial = {}) {
  const storage = new Map(Object.entries(initial));
  const listeners = new Set();
  const elements = [];
  const messages = [];
  class Element {
    constructor(tag) {
      this.tag = tag; this.style = {}; this.children = []; this.hidden = false;
      this.classList = { add() {} };
      if (tag === 'iframe') this.contentWindow = { postMessage: data => messages.push({ element: this, data }) };
      elements.push(this);
    }
    setAttribute(name, value) { this[name] = value; }
    append(...items) { this.children.push(...items); }
    add(option) { this.append(option); }
    remove() { this.removed = true; }
    replaceChildren(...items) { this.children = items; }
  }
  const wrapper = new Element('python');
  const python = {
    value: '', callbacks: new Set(),
    on(_, fn) { this.callbacks.add(fn); }, off(_, fn) { this.callbacks.delete(fn); },
    getValue() { return this.value; },
    setValue(value) { this.value = value; this.callbacks.forEach(fn => fn()); },
    clearHistory() {}, refresh() {}, setOption() {}, getWrapperElement() { return wrapper; }
  };
  const window = { addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  const context = vm.createContext({
    URL, console, ...timers, window, location: { origin: 'http://localhost:8000' },
    document: { currentScript: { src: 'http://localhost:8000/assets/programming-editor.js' }, createElement: tag => new Element(tag) },
    Option: function(text, value) { return { text, value }; },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: key => storage.delete(key) }
  });
  vm.runInContext(read('assets/programming-editor.js'), context);
  const editor = new window.SkillLabEditor({ mount: new Element('mount'), pythonEditor: python });
  const emit = (element, data, origin = 'http://localhost:8000') => listeners.forEach(fn => fn({ source: element.contentWindow, origin, data: { channel: 'skilllab-editor', ...data } }));
  const reply = (item, result = null) => emit(item.element, { id: item.data.id, result });
  const flush = async () => {
    for (let i = 0; i < 8; i++) {
      for (const frame of elements.filter(el => el.tag === 'iframe' && !el.removed && !el.announced)) {
        frame.announced = true; emit(frame, { event: 'ready' });
      }
      for (const item of messages.filter(item => !item.answered)) {
        item.answered = true;
        if (item.data.method === 'reset') emit(item.element, { event: 'change', state: { empty: true } });
        reply(item, item.data.method === 'snapshot' ? { code: 'print(42)' } : null);
      }
      await turn();
    }
  };
  return { editor, python, storage, elements, messages, emit, reply, flush };
}

test('Python legacy drafts migrate without losing either lesson or judge work', async () => {
  const h = controller({ old_lesson: 'print("old lesson")', pyjudge_code_2: 'print("judge two")' });
  await h.editor.setTask({ key: 'pyjudge_beginner_code_1', legacyKeys: ['old_lesson'], starter: '____' });
  assert.equal(h.python.value, 'print("old lesson")');
  h.python.setValue('print("lesson edited")');
  await h.editor.setTask({ key: 'pyjudge_code_2', starter: '# new' });
  assert.equal(h.python.value, 'print("judge two")');
  h.python.setValue('print("judge edited")');
  await h.editor.setTask({ key: 'pyjudge_beginner_code_1', legacyKeys: ['old_lesson'], starter: '____' });
  assert.equal(h.python.value, 'print("lesson edited")');
  assert.equal(h.storage.get('pyjudge_code_2'), 'print("judge edited")');
  assert.equal(h.storage.get('old_lesson'), 'print("old lesson")');
  h.editor.dispose();
});

test('Switching language during pending frame initialization keeps Python active', async () => {
  const h = controller();
  await h.editor.setTask({ key: 'pyjudge_code_1', starter: 'print(1)' });
  const pending = h.editor.switchLanguage('blockly');
  await h.editor.switchLanguage('python');
  await h.flush(); await pending;
  assert.equal(h.editor.language, 'python');
  assert.equal(h.editor.host.hidden, true);
  assert.equal(h.python.getWrapperElement().style.display, '');
  assert.equal(h.python.value, 'print(1)');
  h.editor.dispose();
});

test('Switching questions discards stale frame replies without cross-task writes', async () => {
  const h = controller();
  await h.editor.setTask({ key: 'pyjudge_code_1', starter: 'first' });
  const pendingFirst = h.editor.switchLanguage('blockly');
  const oldFrame = h.editor.frames.get('blockly').element;
  const pendingSecond = h.editor.setTask({ key: 'pyjudge_code_2', starter: 'second' });
  h.emit(oldFrame, { event: 'ready' });
  h.emit(oldFrame, { event: 'change', state: { leaked: true } });
  await h.flush(); await Promise.all([pendingFirst, pendingSecond]);
  assert.equal(h.storage.has('pyjudge_code_1_blockly'), false);
  assert.equal(h.storage.has('pyjudge_code_2_blockly'), false);
  assert.equal(h.storage.get('pyjudge_code_1'), 'first');
  assert.equal(h.storage.get('pyjudge_code_2'), 'second');
  assert.equal(h.messages.filter(item => item.element === oldFrame).length, 0);
  h.editor.dispose();
});

test('Independent language drafts load correctly, reject foreign events, and reset only active language', async () => {
  const h = controller({ pyjudge_code_7_blockly: '{"answer":"blocks"}', pyjudge_code_7_scratch: '{"answer":"scratch"}' });
  await h.editor.setTask({ key: 'pyjudge_code_7', starter: 'print("python")' });
  let pending = h.editor.switchLanguage('blockly'); await h.flush(); await pending;
  const blockFrame = h.editor.frames.get('blockly').element;
  assert.equal(h.messages.find(item => item.element === blockFrame && item.data.method === 'init').data.params.state.answer, 'blocks');
  h.emit(blockFrame, { event: 'change', state: { answer: 'updated blocks' } });
  pending = h.editor.switchLanguage('scratch'); await h.flush(); await pending;
  const scratchFrame = h.editor.frames.get('scratch').element;
  assert.equal(h.messages.find(item => item.element === scratchFrame && item.data.method === 'init').data.params.state.answer, 'scratch');
  h.emit(scratchFrame, { event: 'change', state: { malicious: true } }, 'https://foreign.example');
  assert.equal(h.storage.get('pyjudge_code_7_scratch'), '{"answer":"scratch"}');
  pending = h.editor.reset(); await h.flush(); await pending;
  assert.equal(h.storage.get('pyjudge_code_7_scratch'), '{"empty":true}');
  assert.equal(h.storage.get('pyjudge_code_7_blockly'), '{"answer":"updated blocks"}');
  assert.equal(h.storage.get('pyjudge_code_7'), 'print("python")');
  await h.editor.switchLanguage('python');
  h.python.setValue('changed'); await h.editor.reset();
  assert.equal(h.python.value, 'print("python")');
  assert.equal(h.storage.get('pyjudge_code_7_blockly'), '{"answer":"updated blocks"}');
  h.editor.dispose();
});

test('A corrupt block draft can be reset and then snapshotted', async () => {
  const h = controller({ pyjudge_code_8_blockly: '{broken' });
  await h.editor.setTask({ key: 'pyjudge_code_8', starter: 'saved python' });
  let pending = h.editor.switchLanguage('blockly'); await h.flush(); await pending;
  assert.equal(h.editor.retry.hidden, false);
  pending = h.editor.reset(); await h.flush(); await pending;
  pending = h.editor.snapshot(); await h.flush();
  assert.equal((await pending).code, 'print(42)');
  assert.equal(h.storage.get('pyjudge_code_8'), 'saved python');
  h.editor.dispose();
});

test('Python-only lessons disable block languages and restore them on the next lesson', async () => {
  const h = controller({ pyjudge_language: 'scratch' });
  await h.editor.setTask({ key: 'pyjudge_advanced_draft_H01_core', starter: 'print(1)', allowedLanguages: ['python'] });
  assert.equal(h.editor.language, 'python');
  assert.equal(h.editor.languageOptions.find(option => option.value === 'python').disabled, false);
  assert.equal(h.editor.languageOptions.find(option => option.value === 'blockly').disabled, true);
  assert.equal(h.editor.languageOptions.find(option => option.value === 'scratch').hidden, true);
  await h.editor.switchLanguage('scratch');
  assert.equal(h.editor.language, 'python', 'Disallowed language switch must be ignored');

  await h.editor.setTask({ key: 'pyjudge_advanced_draft_H03_core', starter: 'print(3)' });
  assert.ok(h.editor.languageOptions.every(option => !option.disabled && !option.hidden));
  const pending = h.editor.switchLanguage('scratch');
  await h.flush(); await pending;
  assert.equal(h.editor.language, 'scratch');
  h.editor.dispose();
});

function blocklyHarness() {
  const listeners = [];
  const sent = [];
  const elements = new Map();
  const parent = { postMessage: data => sent.push(data) };
  const context = vm.createContext({ console, ...timers, URL, Blob,
    parent, location: { origin: 'http://localhost:8000' },
    window: { addEventListener: (type, fn) => { if (type === 'message') listeners.push(fn); } },
    document: { body: {}, getElementById: id => {
      if (!elements.has(id)) elements.set(id, { textContent: '', setAttribute() {} });
      return elements.get(id);
    } },
    ResizeObserver: class { observe() {} }
  });
  for (const name of ['blockly_compressed.js', 'blocks_compressed.js', 'python_compressed.js', 'zh-hant.js']) {
    vm.runInContext(read('assets/vendor/blockly/' + name), context, { filename: name });
  }
  // Disable drawing events (which serialize SVG/XML), leaving the actual blocks,
  // workspace serializer, connection validation, and generator untouched.
  context.Blockly.Events.disable();
  const workspace = new context.Blockly.Workspace();
  context.Blockly.inject = (_, options) => {
    workspace.options.oneBasedIndex = options.oneBasedIndex;
    return workspace;
  };
  context.Blockly.svgResize = () => {};
  vm.runInContext(read('assets/blockly-editor.js'), context, { filename: 'blockly-editor.js' });
  let nextId = 0;
  const request = async (method, params = {}) => {
    const id = ++nextId;
    await listeners[0]({ source: parent, origin: 'http://localhost:8000', data: { channel: 'skilllab-editor', id, method, params } });
    const response = sent.find(item => item.id === id);
    assert.ok(response, 'Editor must respond to request');
    if (response.error) throw new Error(response.error);
    return response.result;
  };
  return { request, workspace, generator: context.python.pythonGenerator };
}

function execute(code, input) {
  const result = spawnSync('python3', ['-I', '-c', code], { input, encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, 'Generated Python failed:\n' + result.stderr + '\n' + code);
  return result.stdout;
}

for (const [fixture, cases] of [
  ['blockly-sum-range.json', [['1\n', '1\n'], ['10\n', '55\n'], ['1000\n', '500500\n']]],
  ['blockly-sum-list.json', [['1 2 3\n', '6\n'], ['-10 0 30 -2\r\n', '18\n'], ['999', '999\n']]]
]) test('Actual Blockly generator executes ' + fixture, async () => {
  const h = blocklyHarness();
  await h.request('init', { state: JSON.parse(read('scripts/fixtures/' + fixture)) });
  const first = (await h.request('snapshot')).code;
  for (const [input, expected] of cases) assert.equal(execute(first, input), expected);
  await assert.rejects(h.request('init', { state: { format: 'wrong' } }), /ThinkLab/);
  assert.equal((await h.request('snapshot')).code, first, 'Invalid import must preserve work');
  await h.request('reset');
  assert.equal((await h.request('snapshot')).code.trim(), '');
  h.workspace.dispose();
});

test('Blockly standard I/O handles token whitespace, CRLF lines and exact output separators', async () => {
  const h = blocklyHarness();
  const output = (type, end) => ({ type: 'judge_print', fields: { END: end }, inputs: { VALUE: { block: { type } } } });
  const first = output('judge_read_integer', 'SPACE');
  first.next = { block: output('judge_read_integer', 'NEWLINE') };
  first.next.block.next = { block: output('judge_read_line', 'NONE') };
  await h.request('init', { state: { format: 'skilllab-blockly', version: 1, workspace: { blocks: { languageVersion: 0, blocks: [first] } } } });
  const code = (await h.request('snapshot')).code;
  assert.equal(execute(code, ' \t12 34\nhello world\r\n'), '12 34\nhello world');
  assert.equal(execute(code, ' \t12 34\r\nhello world\r\n'), '12 34\nhello world');
  h.workspace.dispose();
});

test('Blockly native prompt block maps directly to Python input without printing its hint', async () => {
  const h = blocklyHarness();
  assert.equal(h.workspace.options.oneBasedIndex, false, 'Blockly list indexes must match Python and start at 0');
  const [expression] = h.generator.forBlock.text_prompt({ getFieldValue: () => 'TEXT' });
  const code = `print(${expression})\n`;
  assert.equal(expression, 'input()');
  assert.equal(execute(code, 'hello world\n'), 'hello world\n');
  h.workspace.dispose();
});

(async () => {
  let failed = 0;
  for (const { name, run } of tests) {
    try { await run(); console.log('PASS ' + name); }
    catch (error) { failed++; console.error('FAIL ' + name + '\n' + error.stack); }
  }
  console.log(`${tests.length - failed} passed; ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
})();
