#!/usr/bin/env node
// Optional development check: the app itself has no npm dependency.
// Use an isolated browser context so daily browser storage is never touched.
import assert from 'node:assert/strict';
import { access, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const url = process.argv[2] || 'http://127.0.0.1:8080/test/';
const artifactDir = process.env.FLOWLAB_ARTIFACTS || join(tmpdir(), 'flowlab-browser-qa-artifacts');
await mkdir(artifactDir, { recursive: true });

async function loadPlaywright() {
  const candidates = [
    process.env.FLOWLAB_PLAYWRIGHT,
    'playwright',
    'playwright-core',
    join(tmpdir(), 'flowlab-browser-qa/node_modules/playwright-core/index.mjs')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { return await import(candidate.startsWith('/') ? pathToFileURL(candidate).href : candidate); }
    catch (error) { if (!['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'].includes(error.code)) throw error; }
  }
  throw new Error('Install playwright-core outside the repository, then set FLOWLAB_PLAYWRIGHT to its index.mjs. See test/README.md.');
}

async function chromePath() {
  const candidates = [
    process.env.FLOWLAB_CHROME,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'
  ].filter(Boolean);
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try next known executable. */ }
  }
  return undefined; // A full Playwright install can provide its bundled Chromium.
}

const { chromium } = await loadPlaywright();
const executablePath = await chromePath();
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const failures = [];
let passed = 0;

async function check(name, run, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1512, height: 982 }, acceptDownloads: true, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('dialog', dialog => dialog.accept());
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.flowLab), { timeout: 10000 });
    await run(page, context);
    assert.deepEqual(errors, [], 'Browser console must have no errors');
    passed++;
    console.log(`PASS ${name}`);
  } catch (error) {
    const file = join(artifactDir, `failure-${name.replace(/[^a-z0-9]+/gi, '-')}.png`);
    await page.screenshot({ path: file, fullPage: true }).catch(() => {});
    failures.push({ name, error });
    console.error(`FAIL ${name}\n${error.stack}\nScreenshot: ${file}`);
  } finally {
    await context.close();
  }
}

const state = page => page.evaluate(() => window.flowLab.getState());
const graph = page => page.evaluate(() => window.flowLab.getGraph());

async function settleEngine(page) {
  await page.waitForFunction(() => ['completed', 'complete', 'error', 'stopped', 'waiting'].includes(window.flowLab.getState().engineStatus), { timeout: 15000 });
  return state(page);
}

async function seek(page, value = 'last') {
  await page.locator('#timeline').evaluate((element, next) => {
    element.value = next === 'last' ? element.max : String(next);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
}

async function loadExample(page, key, input = '') {
  await page.locator('#example-select').selectOption(key);
  await page.locator('#load-example-btn').click();
  await acceptConfirm(page);
  await page.locator('#input-data').fill(input);
}

async function acceptConfirm(page) {
  const button = page.locator('#confirm-dialog[open] #confirm-ok');
  // File.text() is async: wait for the review dialog instead of racing the file read.
  await button.waitFor({state:'visible',timeout:5000});
  await button.click();
}

async function runToEnd(page) {
  await page.locator('#run-btn').click();
  const result = await settleEngine(page);
  assert.ok(['completed', 'complete'].includes(result.engineStatus), `Expected successful computation, got ${JSON.stringify(result)}`);
  await seek(page);
  return state(page);
}

async function dragBetween(page, source, target) {
  const from = await source.boundingBox(), to = await target.boundingBox();
  assert.ok(from && to, 'Both drag targets must be visible');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
}

function simpleGraph() {
  return {
    version: 1, title: '畫布互動測試', viewport: { x: 0, y: 0, zoom: 1 },
    nodes: [
      { id: 'start', type: 'start', title: '開始', position: { x: 90, y: 45 }, data: {} },
      { id: 'work', type: 'process', title: '設定數字', position: { x: 90, y: 205 }, data: { expression: 'value = 1' } },
      { id: 'end', type: 'end', title: '結束', position: { x: 90, y: 365 }, data: {} }
    ], edges: []
  };
}

const node = (page, id) => page.locator(`.fc-node[data-node-id="${id}"]`);
const port = (page, id, direction, branch = '') => node(page, id).locator(`.fc-port[data-port="${direction}"][data-branch="${branch}"] .fc-port-dot`);

// Test cases are kept sequential: each one receives a fresh browser and storage context.

try {
  await check('initial layout and semantic controls', async page => {
    assert.ok(await page.locator('h1').isVisible());
    assert.deepEqual((await graph(page)).nodes, []);
    assert.deepEqual((await graph(page)).edges, []);
    assert.equal(await page.locator('#input-data').inputValue(), '');
    for (const id of ['canvas', 'run-btn', 'pause-btn', 'step-back-btn', 'step-next-btn', 'stop-btn', 'restart-btn', 'speed', 'timeline', 'graph-title', 'validate-btn', 'example-select']) {
      assert.equal(await page.locator(`#${id}`).count(), 1, `Expected #${id}`);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Desktop must not overflow horizontally');
    await page.screenshot({ path: join(artifactDir, 'desktop.png'), fullPage: true });
  });

  await check('greeting with real worker and synchronized rewind', async page => {
    await loadExample(page, 'greeting', '小明');
    const result = await runToEnd(page);
    assert.ok(result.trace.length >= 4);
    const stdout = await page.locator('#output-content').innerText();
    assert.match(stdout, /小明/);
    assert.match(stdout, /你好/);
    assert.match(await page.locator('#variables-body').innerText(), /小明/);
    await page.locator('#step-back-btn').click();
    await page.locator('#step-back-btn').click();
    assert.doesNotMatch(await page.locator('#output-content').innerText(), /小明/);
    await page.locator('#step-next-btn').click();
    assert.equal(await page.locator('#output-content').innerText(), stdout);
    await page.screenshot({ path: join(artifactDir, 'greeting-replay.png'), fullPage: true });
  });

  await check('parity takes true and false branches including negatives', async page => {
    for (const [input, expected] of [['8', '偶數'], ['7', '奇數'], ['-3', '奇數'], ['0', '偶數']]) {
      await loadExample(page, 'parity', input);
      const result = await runToEnd(page);
      assert.match(await page.locator('#output-content').innerText(), new RegExp(expected));
      assert.ok(result.trace.some(event => event.type === 'condition' || event.type === 'decision'), 'A conditional event must be recorded');
    }
  });

  await check('sum loop and playback controls preserve computation', async page => {
    await loadExample(page, 'sum', '10');
    await page.locator('#speed').selectOption('4');
    const result = await runToEnd(page);
    assert.match(await page.locator('#output-content').innerText(), /\b55\b/);
    const before = structuredClone(result.trace);
    await page.locator('#step-back-btn').click();
    await page.locator('#speed').selectOption('0.25');
    assert.deepEqual((await state(page)).trace, before, 'Playback speed must not recompute trace');
    await seek(page);
    assert.match(await page.locator('#variables-body').innerText(), /55/);
    await page.screenshot({ path: join(artifactDir, 'sum-complete.png'), fullPage: true });
  });

  await check('automatic playback can pause step and resume independently', async page => {
    await loadExample(page, 'greeting', '播放測試');
    await page.locator('#run-btn').click();
    await page.waitForFunction(() => window.flowLab.getState().cursor >= 1);
    await page.locator('#pause-btn').click();
    const paused = await state(page);
    assert.equal(paused.playing, false);
    await page.waitForTimeout(750);
    assert.equal((await state(page)).cursor, paused.cursor);
    await page.locator('#step-next-btn').click();
    assert.equal((await state(page)).cursor, paused.cursor + 1);
    await page.locator('#pause-btn').click();
    await page.waitForFunction(() => {
      const state = window.flowLab.getState();
      return state.cursor === state.trace.length && state.engineStatus === 'completed';
    });
    assert.match(await page.locator('#output-content').innerText(), /播放測試/);
  });

  await check('interactive input waits then resumes without duplicate answers', async page => {
    await loadExample(page, 'greeting', '');
    await page.locator('#run-btn').click();
    const pending = await settleEngine(page);
    assert.equal(pending.engineStatus, 'waiting');
    await seek(page);
    await page.locator('#input-value').fill('小華');
    await page.locator('#input-form').evaluate(form => form.requestSubmit());
    const completed = await settleEngine(page);
    assert.ok(['completed', 'complete'].includes(completed.engineStatus));
    await seek(page);
    assert.match(await page.locator('#output-content').innerText(), /小華/);
    await page.locator('#step-back-btn').click();
    await page.locator('#step-back-btn').click();
    await page.locator('#step-next-btn').click();
    assert.match(await page.locator('#output-content').innerText(), /小華/);
    assert.deepEqual((await state(page)).trace, completed.trace);
  });

  await check('invalid input can be corrected and waiting excludes computation timeout', async page => {
    await loadExample(page, 'parity', '');
    await page.locator('#run-btn').click();
    assert.equal((await settleEngine(page)).engineStatus, 'waiting');
    await seek(page);
    await page.locator('#input-value').fill('hello');
    await page.locator('#input-form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => Boolean(document.querySelector('#input-error').textContent.trim()));
    assert.match(await page.locator('#input-error').innerText(), /整數/);
    assert.equal((await state(page)).engineStatus, 'waiting');
    // Longer than the default 3 s calculation limit: human thinking time is excluded.
    await page.waitForTimeout(3200);
    await page.locator('#input-value').fill('7');
    await page.locator('#input-form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => window.flowLab.getState().engineStatus === 'completed');
    await seek(page);
    assert.match(await page.locator('#output-content').innerText(), /奇數/);
    assert.equal((await state(page)).trace.filter(event => event.type === 'input').length, 1);
  });

  await check('editing an earlier input recomputes and asks later inputs again', async page => {
    await loadExample(page, 'max', '12\n7');
    await runToEnd(page);
    assert.match(await page.locator('#output-content').innerText(), /12/);
    await page.locator('.input-history-section summary').click();
    await page.locator('#input-history .history-item button').first().click();
    await page.locator('#edit-input-value').fill('3');
    await page.locator('#edit-input-form button[type="submit"]').click();
    assert.equal((await settleEngine(page)).engineStatus, 'waiting');
    await seek(page);
    await page.locator('#input-value').fill('9');
    await page.locator('#input-form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => window.flowLab.getState().engineStatus === 'completed');
    await seek(page);
    assert.equal((await page.locator('#output-content').innerText()).trim(), '9');
    assert.deepEqual((await state(page)).trace.filter(event => event.input).map(event => event.input.raw), ['3', '9']);
  });

  await check('stop preserves recorded prefix and restart creates a clean execution', async page => {
    await loadExample(page, 'greeting', '');
    await page.locator('#run-btn').click();
    const pending = await settleEngine(page);
    assert.equal(pending.engineStatus, 'waiting');
    await page.locator('#stop-btn').click();
    assert.equal((await state(page)).engineStatus, 'stopped');
    assert.deepEqual((await state(page)).trace, pending.trace);
    await seek(page);
    await page.locator('#restart-btn').click();
    assert.equal((await settleEngine(page)).engineStatus, 'waiting');
    await seek(page);
    await page.locator('#input-value').fill('重新開始');
    await page.locator('#input-form').evaluate(form => form.requestSubmit());
    await page.waitForFunction(() => window.flowLab.getState().engineStatus === 'completed');
    await seek(page);
    assert.equal((await state(page)).trace.filter(event => event.type === 'start').length, 1);
    assert.match(await page.locator('#output-content').innerText(), /重新開始/);
  });

  await check('test input edits invalidate an old execution', async page => {
    await loadExample(page, 'parity', '8');
    await runToEnd(page);
    await page.locator('#input-data').fill('9');
    assert.equal((await state(page)).trace.length, 0, 'An input change must discard old trace');
    await runToEnd(page);
    assert.match(await page.locator('#output-content').innerText(), /奇數/);
  });

  await check('opening stays empty with a saved draft and JSON export round-trips', async page => {
    await loadExample(page, 'parity', '8');
    await page.locator('#graph-title').fill('測試作品：奇偶判斷');
    await page.locator('#graph-title').blur();
    await page.locator('#save-btn').click();
    const saved = await graph(page);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-btn').click();
    const download = await downloadPromise;
    const exported = JSON.parse(await readFile(await download.path(), 'utf8'));
    assert.equal(exported.version, 1);
    assert.equal(exported.title, saved.title);
    assert.deepEqual(exported.nodes, saved.nodes);
    assert.deepEqual(exported.edges, saved.edges);
    assert.equal(Object.hasOwn(exported, 'trace'), false);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.flowLab));
    assert.deepEqual((await graph(page)).nodes, []);
    assert.deepEqual((await graph(page)).edges, []);
    assert.equal(await page.locator('#input-data').inputValue(), '');
    assert.equal((await state(page)).trace.length, 0);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem(window.flowLab.storageKey)).graph), saved, 'Opening must preserve stored work without displaying it');
    await page.locator('#new-btn').click();
    await acceptConfirm(page);
    assert.deepEqual((await graph(page)).nodes, []);
    await page.locator('#import-file').setInputFiles({ name: 'saved-flow.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await acceptConfirm(page);
    await page.waitForFunction(title => window.flowLab.getGraph().title === title, saved.title);
    assert.deepEqual((await graph(page)).nodes, saved.nodes);
    assert.deepEqual((await graph(page)).edges, saved.edges);
  });

  await check('invalid JSON and unsupported versions preserve current work', async page => {
    const before = await graph(page);
    for (const source of ['{broken', JSON.stringify({ ...before, version: 999 })]) {
      await page.locator('#import-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(source) });
      await page.waitForTimeout(150);
      assert.deepEqual(await graph(page), before);
    }
  });

  await check('title undo keeps execution and imported extreme zoom is preserved', async page => {
    await loadExample(page, 'greeting', '小明');
    const completed = await runToEnd(page);
    const title = (await graph(page)).title;
    await page.locator('#graph-title').fill('新的作品名稱');
    await page.locator('#graph-title').blur();
    assert.deepEqual((await state(page)).trace, completed.trace);
    await page.locator('#undo-btn').click();
    assert.equal((await graph(page)).title, title);
    assert.deepEqual((await state(page)).trace, completed.trace);
    for (const zoom of [0.12, 3.8]) {
      const imported = await graph(page); imported.viewport.zoom = zoom;
      await page.evaluate(value => window.flowLab.loadGraph(value), imported);
      assert.equal((await graph(page)).viewport.zoom, zoom);
    }
  });

  await check('node dragging preserves replay but editing expression invalidates it', async page => {
    await loadExample(page, 'greeting', '小明');
    const completed = await runToEnd(page);
    const before = (await graph(page)).nodes.find(item => item.id === 'hello').position;
    const shape = await node(page, 'hello').locator('.fc-shape').boundingBox();
    await page.mouse.move(shape.x + shape.width / 2, shape.y + shape.height / 2);
    await page.mouse.down();
    await page.mouse.move(shape.x + shape.width / 2 + 44, shape.y + shape.height / 2 + 18, { steps: 12 });
    await page.mouse.up();
    assert.notDeepEqual((await graph(page)).nodes.find(item => item.id === 'hello').position, before);
    assert.deepEqual((await state(page)).trace, completed.trace, 'Dragging layout must preserve all execution events');
    await page.locator('#zoom-in-btn').click();
    assert.deepEqual((await state(page)).trace, completed.trace, 'Zoom must preserve all execution events');
    await node(page, 'hello').locator('.fc-shape').click();
    await page.locator('#node-expression').fill('name + "，歡迎！"');
    await page.locator('#property-form .apply-button').click();
    assert.equal((await state(page)).trace.length, 0);
    await page.locator('#observe-tab').click();
    await runToEnd(page);
    assert.match(await page.locator('#output-content').innerText(), /小明，歡迎！/);
  });

  await check('real canvas links palette drag copy delete undo and pan', async page => {
    await page.evaluate(value => window.flowLab.loadGraph(value), simpleGraph());
    await dragBetween(page, port(page, 'start', 'out'), port(page, 'work', 'in'));
    await dragBetween(page, port(page, 'work', 'out'), port(page, 'end', 'in'));
    assert.deepEqual((await graph(page)).edges.map(edge => [edge.source, edge.target]), [['start', 'work'], ['work', 'end']]);
    // A normal node cannot silently gain a second successor.
    await dragBetween(page, port(page, 'start', 'out'), port(page, 'end', 'in'));
    assert.equal((await graph(page)).edges.length, 2);
    const area = await page.locator('#canvas').boundingBox();
    await page.locator('.palette-node[data-node-type="output"]').dragTo(page.locator('#canvas'), { targetPosition: { x: area.width - 100, y: 240 } });
    assert.equal((await graph(page)).nodes.length, 4, 'Palette native drag must add a node');
    const added = (await graph(page)).nodes.find(item => !['start', 'work', 'end'].includes(item.id));
    await node(page, added.id).locator('.fc-shape').click();
    await page.keyboard.press('Delete');
    assert.equal((await graph(page)).nodes.length, 3);
    await node(page, 'work').locator('.fc-shape').click();
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');
    assert.equal((await graph(page)).nodes.length, 4);
    await page.locator('#undo-btn').click();
    assert.equal((await graph(page)).nodes.length, 3);
    await page.locator('#redo-btn').click();
    assert.equal((await graph(page)).nodes.length, 4);
    await page.locator('#undo-btn').click();
    const before = (await graph(page)).viewport;
    await page.locator('#pan-tool').click();
    await page.mouse.move(area.x + area.width - 60, area.y + 90);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width - 120, area.y + 125, { steps: 10 });
    await page.mouse.up();
    assert.notDeepEqual((await graph(page)).viewport, before);
    await page.locator('#fit-btn').click();
    assert.equal(await node(page, 'work').isVisible(), true);
  });

  await check('missing branch and undefined variable stop execution at validation', async page => {
    await loadExample(page, 'parity', '8');
    const broken = await graph(page);
    broken.edges = broken.edges.filter(edge => edge.branch !== 'false');
    await page.evaluate(value => window.flowLab.loadGraph(value), broken);
    await page.locator('#validate-btn').click();
    assert.match(await page.locator('#diagnostics').innerText(), /False/);
    await page.locator('#run-btn').click();
    assert.equal((await state(page)).trace.length, 0);
    await loadExample(page, 'greeting', '小明');
    const undefinedVariable = await graph(page);
    undefinedVariable.nodes.find(item => item.type === 'output').data.expression = 'missing';
    await page.evaluate(value => window.flowLab.loadGraph(value), undefinedVariable);
    await page.locator('#validate-btn').click();
    assert.match(await page.locator('#diagnostics').innerText(), /missing/);
    await page.locator('#run-btn').click();
    assert.equal((await state(page)).trace.length, 0);
    assert.equal(await page.locator('.fc-node.fc-invalid').count() > 0, true);
  });

  await check('marquee and additive selection copy multiple nodes', async page => {
    await page.evaluate(value => window.flowLab.loadGraph(value), simpleGraph());
    const area = await page.locator('#canvas').boundingBox();
    await page.mouse.move(area.x + 60, area.y + 20);
    await page.mouse.down();
    await page.mouse.move(area.x + 295, area.y + 300, { steps: 12 });
    await page.mouse.up();
    assert.equal(await page.locator('.fc-node.fc-selected').count(), 2);
    await node(page, 'end').locator('.fc-shape').click({ modifiers: ['Shift'] });
    assert.equal(await page.locator('.fc-node.fc-selected').count(), 3);
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');
    const after = await graph(page);
    assert.equal(after.nodes.length, 5);
    assert.equal(after.nodes.filter(item => item.type === 'start').length, 1, 'Copy must preserve a unique Start');
  });

  await check('200 nodes remain editable and execute without replacing SVG nodes', async page => {
    const large = simpleGraph();
    large.title = '200 節點效能驗證';
    large.nodes = Array.from({ length: 200 }, (_, index) => ({
      id: `node-${index}`, type: index === 0 ? 'start' : index === 199 ? 'end' : 'process',
      title: `步驟 ${index}`, position: { x: 30 + index % 10 * 220, y: 30 + Math.floor(index / 10) * 100 },
      data: index > 0 && index < 199 ? { expression: `value = ${index}` } : {}
    }));
    large.edges = large.nodes.slice(1).map((item, index) => ({ id: `edge-${index}`, source: `node-${index}`, target: item.id, branch: null }));
    await page.evaluate(value => window.flowLab.loadGraph(value), large);
    await page.locator('#fit-btn').click();
    assert.equal(await page.locator('.fc-node').count(), 200);
    await page.evaluate(() => { window.__qaFirstNode = document.querySelector('.fc-node'); });
    const result = await runToEnd(page);
    assert.equal(result.trace.length, 200);
    assert.equal(await page.evaluate(() => window.__qaFirstNode === document.querySelector('.fc-node')), true, 'Playback must update classes without rebuilding SVG nodes');
    await page.locator('#zoom-in-btn').click();
    await page.locator('#zoom-out-btn').click();
    assert.equal((await graph(page)).nodes.length, 200);
    const shape = await node(page, 'node-44').locator('.fc-shape').boundingBox();
    const before = (await graph(page)).nodes[44].position;
    await page.mouse.move(shape.x + shape.width / 2, shape.y + shape.height / 2);
    await page.mouse.down();
    await page.mouse.move(shape.x + shape.width / 2 + 24, shape.y + shape.height / 2 + 16, {steps: 30});
    await page.mouse.up();
    assert.notDeepEqual((await graph(page)).nodes[44].position, before);
    assert.equal(await page.evaluate(() => window.__qaFirstNode === document.querySelector('.fc-node')), true, 'Dragging must preserve existing SVG elements');
    assert.deepEqual((await state(page)).trace, result.trace);
    await page.screenshot({ path: join(artifactDir, '200-nodes.png'), fullPage: true });
  });

  await check('runtime error stops playback and points to failing node', async page => {
    await loadExample(page, 'greeting', '小明');
    const broken = await graph(page);
    broken.nodes.find(node => node.id === 'hello').data.expression = '1 / 0';
    await page.evaluate(value => window.flowLab.loadGraph(value), broken);
    await page.locator('#run-btn').click();
    assert.equal((await settleEngine(page)).engineStatus, 'error');
    assert.equal((await state(page)).playing, false);
    assert.match(await page.locator('#runtime-error-card').innerText(), /零/);
    await page.locator('#show-error-btn').click();
    assert.equal(await page.locator('.fc-node.fc-error').getAttribute('data-node-id'), 'hello');
    assert.equal((await page.locator('#output-content').innerText()).trim(), '');
    await page.locator('#step-back-btn').click();
    assert.equal(await page.locator('.fc-node.fc-error').count(), 0);
  });

  await check('infinite loop reaches bounded error and remains inspectable', async page => {
    await loadExample(page, 'infinite', '');
    const started = Date.now();
    await page.locator('#run-btn').click();
    const result = await settleEngine(page);
    assert.equal(result.engineStatus, 'error');
    assert.ok(Date.now() - started < 10000, 'Infinite loop must stop promptly');
    assert.ok(result.trace.length <= 10001);
    assert.ok(result.trace.length > 0);
    await seek(page);
    assert.match(await page.locator('#runtime-status').innerText(), /錯誤|限制|停止/);
    await page.locator('#step-back-btn').click();
    assert.ok((await state(page)).cursor < result.trace.length);
  });

  await check('Chinese variables and the text output mode work in the real app', async page => {
    const chinese = {
      version: 1, title: '中文變數測試', viewport: { x: 0, y: 0, zoom: 1 },
      nodes: [
        { id: 'start', type: 'start', title: '開始', position: { x: 320, y: 60 }, data: {} },
        { id: 'ask', type: 'input', title: '請輸入分數', position: { x: 320, y: 180 }, data: { variable: '分數', prompt: '請輸入分數', inputType: 'integer' } },
        { id: 'twice', type: 'process', title: '加倍', position: { x: 320, y: 300 }, data: { expression: '總分 = 分數 * 2' } },
        { id: 'say', type: 'output', title: '輸出總分', position: { x: 320, y: 420 }, data: { expression: '總分是 {總分} 分', outputMode: 'text' } },
        { id: 'end', type: 'end', title: '結束', position: { x: 320, y: 540 }, data: {} }
      ],
      edges: [
        { id: 'e0', source: 'start', target: 'ask', branch: null },
        { id: 'e1', source: 'ask', target: 'twice', branch: null },
        { id: 'e2', source: 'twice', target: 'say', branch: null },
        { id: 'e3', source: 'say', target: 'end', branch: null }
      ]
    };
    await page.evaluate(value => window.flowLab.loadGraph(value), chinese);
    await page.locator('#input-data').fill('40');
    assert.deepEqual((await state(page)).validation.errors, []);
    await runToEnd(page);
    assert.equal((await page.locator('#output-content').innerText()).trim(), '總分是 80 分');
    assert.match(await page.locator('#variables-body').innerText(), /總分[\s\S]*80/);
    // The panel round-trips the mode, and switching to expression makes the same text invalid.
    await node(page, 'say').locator('.fc-shape').click();
    assert.equal(await page.locator('#node-output-mode').inputValue(), 'text');
    assert.equal(await page.locator('#expression-label').innerText(), '輸出文字');
    await page.screenshot({ path: join(artifactDir, 'text-output-mode.png'), fullPage: true });
    await page.locator('#node-output-mode').selectOption('expression');
    assert.equal(await page.locator('#expression-label').innerText(), '輸出運算式');
    await page.locator('#property-form .apply-button').click();
    assert.ok((await state(page)).validation.errors.some(issue => issue.nodeId === 'say'));
    await page.locator('#node-output-mode').selectOption('text');
    await page.locator('#property-form .apply-button').click();
    assert.deepEqual((await state(page)).validation.errors, []);
    // A freshly dragged output node starts in text mode.
    const area = await page.locator('#canvas').boundingBox();
    await page.locator('.palette-node[data-node-type="output"]').dragTo(page.locator('#canvas'), { targetPosition: { x: area.width - 110, y: 150 } });
    const added = (await graph(page)).nodes.find(item => !chinese.nodes.some(original => original.id === item.id));
    assert.equal(added.data.outputMode, 'text');
    await node(page, added.id).locator('.fc-shape').click();
    assert.equal(await page.locator('#node-output-mode').inputValue(), 'text');
  });

  await check('compact desktop remains usable without page overflow', async page => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.locator('#run-btn').isVisible(), true);
    assert.equal(await page.locator('#canvas').isVisible(), true);
    await page.screenshot({ path: join(artifactDir, 'compact-desktop.png'), fullPage: true });
  }, { viewport: { width: 1024, height: 768 } });
} finally {
  await browser.close();
}

console.log(`${passed} browser checks passed; ${failures.length} failed. Artifacts: ${artifactDir}`);
if (failures.length) process.exitCode = 1;
