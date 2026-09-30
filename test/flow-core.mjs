/* Framework-free teaching language, graph validation and deterministic interpreter. */
export const FORMAT_VERSION = 1;
export const DEFAULT_LIMITS = Object.freeze({maxSteps: 10000, maxOutput: 65536, maxTraceBytes: 8 * 1024 * 1024, maxTimeMs: 3000, maxString: 8192, maxVariables: 128});
const TYPES = new Set(['start', 'end', 'input', 'output', 'process', 'decision']);
const INPUT_TYPES = new Set(['integer', 'number', 'text', 'boolean']);
const OUTPUT_MODES = new Set(['expression', 'text']);
// 變數名稱可用中文（漢字）、英文字母與底線開頭；長度以 UTF-16 碼元計算。
const NAME = /^[A-Za-z_\p{Script=Han}][A-Za-z0-9_\p{Script=Han}]{0,63}$/u;
const RESERVED = new Set(['True', 'False', 'true', 'false', 'and', 'or', 'not', 'None', 'null', 'undefined', 'NaN', 'Infinity', '__proto__', 'prototype', 'constructor', 'eval', 'Function', 'globalThis', 'window', 'document', 'self', 'import', 'new', 'this', 'return', 'let', 'var', 'const', 'function', 'while', 'for', 'if', 'else', 'class', 'delete', 'in', 'is', 'await', 'yield', 'toString', 'valueOf', 'hasOwnProperty']);
Object.getOwnPropertyNames(Object.prototype).forEach(name => RESERVED.add(name));
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const byteLength = value => new TextEncoder().encode(value).length;
const now = () => globalThis.performance?.now?.() ?? Date.now();

export class FlowError extends Error {
  constructor(message, code = 'INVALID_EXPRESSION', nodeId) { super(message); this.name = 'FlowError'; this.code = code; if (nodeId) this.nodeId = nodeId; }
}
const fail = (message, code, nodeId) => { throw new FlowError(message, code, nodeId); };
const record = value => value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const isVariableName = name => typeof name === 'string' && NAME.test(name) && !RESERVED.has(name) && !name.startsWith('__');
const requireVariable = name => { if (!isVariableName(name)) fail('變數名稱可用中文、英文字母或底線開頭，之後可接中文、英數字與底線，且不可使用保留字。', 'INVALID_VARIABLE'); return name; };

/** Only copy the portable schema. Incomplete work is legal; execution validation is separate. */
export function normalizeGraph(raw) {
  let visited = 0;
  const seen = new WeakSet();
  const inspect = (value, depth = 0) => {
    if (++visited > 45000 || depth > 12) fail('檔案結構過大或過深。', 'INVALID_FILE');
    if (typeof value === 'number' && !Number.isFinite(value)) fail('檔案包含無效數字。', 'INVALID_FILE');
    if (typeof value === 'string' && value.length > 16384) fail('檔案中的文字過長。', 'INVALID_FILE');
    if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) return;
    if (typeof value !== 'object' || (!Array.isArray(value) && !record(value)) || seen.has(value) || Object.getOwnPropertySymbols(value).length) fail('檔案必須只包含 JSON 資料。', 'INVALID_FILE');
    seen.add(value);
    for (const key of Object.keys(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) fail('檔案包含不允許的屬性。', 'INVALID_FILE');
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor?.get || descriptor?.set) fail('檔案不可包含動態屬性。', 'INVALID_FILE');
      inspect(descriptor.value, depth + 1);
    }
  };
  inspect(raw);
  if (!record(raw) || raw.version !== FORMAT_VERSION) fail('不支援的檔案版本；目前只接受 version: 1。', 'INVALID_VERSION');
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges) || raw.nodes.length > 500 || raw.edges.length > 1500) fail('流程圖最多支援 500 個節點及 1500 條連線。', 'INVALID_FILE');
  const text = (value, fallback = '', max = 4096) => { if (value === undefined) return fallback; if (typeof value !== 'string' || value.length > max) fail(`文字欄位必須是字串，且不可超過 ${max} 字。`, 'INVALID_FILE'); return value; };
  const coord = (value, fallback) => { if (value === undefined) return fallback; if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > 1000000) fail('畫布座標不合法。', 'INVALID_FILE'); return value; };
  const id = value => { if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(value)) fail('節點或連線 ID 格式不合法。', 'INVALID_FILE'); return value; };
  const nodeIds = new Set(), edgeIds = new Set();
  const nodes = raw.nodes.map(node => {
    if (!record(node) || !TYPES.has(node.type)) fail('檔案包含不支援的節點類型。', 'INVALID_FILE');
    const nodeId = id(node.id);
    if (nodeIds.has(nodeId)) fail('節點 ID 不可重複。', 'INVALID_FILE'); nodeIds.add(nodeId);
    if (node.data !== undefined && !record(node.data)) fail('節點設定必須是物件。', 'INVALID_FILE');
    if (node.position !== undefined && !record(node.position)) fail('節點位置必須是物件。', 'INVALID_FILE');
    const source = node.data || {}, data = {};
    if (node.type === 'input') {
      data.variable = text(source.variable, '', 64); data.prompt = text(source.prompt, '');
      data.inputType = source.inputType ?? 'number';
      if (!INPUT_TYPES.has(data.inputType)) fail('輸入型別必須是 integer、number、text 或 boolean。', 'INVALID_FILE');
    } else if (['output', 'process', 'decision'].includes(node.type)) {
      data.expression = text(source.expression, '');
      if (node.type === 'output') { data.outputMode = source.outputMode ?? 'expression'; if (!OUTPUT_MODES.has(data.outputMode)) fail('輸出模式必須是 text 或 expression。', 'INVALID_FILE'); }
    }
    return {id: nodeId, type: node.type, title: text(node.title ?? source.title, '', 120), position: {x: coord(node.position?.x, 100), y: coord(node.position?.y, 100)}, data};
  });
  const edges = raw.edges.map(edge => {
    if (!record(edge)) fail('連線資料不合法。', 'INVALID_FILE');
    const edgeId = id(edge.id); if (edgeIds.has(edgeId)) fail('連線 ID 不可重複。', 'INVALID_FILE'); edgeIds.add(edgeId);
    const branch = edge.branch ?? null;
    if (![null, 'true', 'false'].includes(branch)) fail('分支必須是 true、false 或 null。', 'INVALID_FILE');
    return {id: edgeId, source: id(edge.source), target: id(edge.target), branch};
  });
  if (raw.viewport !== undefined && !record(raw.viewport)) fail('畫布視野格式不合法。', 'INVALID_FILE');
  const zoom = coord(raw.viewport?.zoom, 1); if (zoom < 0.1 || zoom > 4) fail('縮放比例必須介於 0.1 至 4。', 'INVALID_FILE');
  return {version: FORMAT_VERSION, title: text(raw.title, '未命名流程圖', 160), nodes, edges, viewport: {x: coord(raw.viewport?.x, 0), y: coord(raw.viewport?.y, 0), zoom}};
}

function tokenize(source) {
  if (typeof source !== 'string' || !source.trim()) fail('請輸入運算式。', 'EMPTY_EXPRESSION');
  if (source.length > 4096) fail('運算式不可超過 4096 字。', 'EXPRESSION_LIMIT');
  const tokens = []; let offset = 0;
  while (offset < source.length) {
    if (/\s/.test(source[offset])) { offset++; continue; }
    if (tokens.length >= 1024) fail('運算式太複雜，請拆成多個處理節點。', 'EXPRESSION_LIMIT');
    const rest = source.slice(offset), character = source[offset];
    if (character === '"' || character === "'") {
      const quote = character; let value = ''; offset++; let closed = false;
      while (offset < source.length) {
        const current = source[offset++];
        if (current === quote) { closed = true; break; }
        if (current === '\n' || current === '\r') fail('字串內的換行請使用 \\n。', 'INVALID_STRING');
        if (current === '\\') {
          const escape = source[offset++];
          const escapes = {n: '\n', r: '\r', t: '\t', '\\': '\\', '"': '"', "'": "'"};
          if (own(escapes, escape)) value += escapes[escape];
          else if (escape === 'u' && /^[0-9a-fA-F]{4}/.test(source.slice(offset))) { value += String.fromCharCode(parseInt(source.slice(offset, offset + 4), 16)); offset += 4; }
          else fail('字串包含不支援的跳脫字元。', 'INVALID_STRING');
        } else value += current;
      }
      if (!closed) fail('字串缺少結尾引號。', 'INVALID_STRING'); tokens.push({type: 'literal', value}); continue;
    }
    const number = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (number) { const value = Number(number[0]); if (!Number.isFinite(value)) fail('數字超出可表示的範圍。', 'NUMBER_LIMIT'); tokens.push({type: 'literal', value}); offset += number[0].length; continue; }
    const identifier = rest.match(/^[A-Za-z_\p{Script=Han}][A-Za-z0-9_\p{Script=Han}]*/u);
    if (identifier) {
      const value = identifier[0]; offset += value.length;
      if (value === 'True' || value === 'False') tokens.push({type: 'literal', value: value === 'True'});
      else if (['and', 'or', 'not'].includes(value)) tokens.push({type: value});
      else { requireVariable(value); tokens.push({type: 'identifier', value}); } continue;
    }
    const operator = rest.match(/^(?:==|!=|<=|>=|\/\/|[+\-*/%<>()=])/);
    if (!operator) fail(`不支援「${character}」；${character.charCodeAt(0) > 127 ? '請改用半形符號，且' : ''}此語言不支援函式呼叫、屬性存取或原生程式碼。`, 'INVALID_TOKEN');
    tokens.push({type: operator[0]}); offset += operator[0].length;
  }
  tokens.push({type: 'eof'}); return tokens;
}

class Parser {
  constructor(source) { this.tokens = tokenize(source); this.index = 0; this.depth = 0; }
  peek(type) { return this.tokens[this.index].type === type; }
  take(type) { if (this.peek(type)) return this.tokens[this.index++]; return null; }
  require(type) { const token = this.take(type); if (!token) fail(`運算式格式錯誤：預期「${type}」。`, 'SYNTAX_ERROR'); return token; }
  nest(callback) { if (++this.depth > 64) fail('括號或運算巢狀過深。', 'EXPRESSION_LIMIT'); const result = callback(); this.depth--; return result; }
  expression() { return this.or(); }
  or() { let left = this.and(); while (this.take('or')) left = {kind: 'binary', op: 'or', left, right: this.and()}; return left; }
  and() { let left = this.not(); while (this.take('and')) left = {kind: 'binary', op: 'and', left, right: this.not()}; return left; }
  not() { return this.take('not') ? this.nest(() => ({kind: 'unary', op: 'not', right: this.not()})) : this.comparison(); }
  comparison() {
    const operands = [this.add()], operators = [];
    while (['==', '!=', '<', '>', '<=', '>='].includes(this.tokens[this.index].type)) { operators.push(this.tokens[this.index++].type); operands.push(this.add()); }
    return operators.length ? {kind: 'comparison', operands, operators} : operands[0];
  }
  add() { let left = this.multiply(); while (['+', '-'].includes(this.tokens[this.index].type)) { const op = this.tokens[this.index++].type; left = {kind: 'binary', op, left, right: this.multiply()}; } return left; }
  multiply() { let left = this.unary(); while (['*', '/', '//', '%'].includes(this.tokens[this.index].type)) { const op = this.tokens[this.index++].type; left = {kind: 'binary', op, left, right: this.unary()}; } return left; }
  unary() { if (this.peek('+') || this.peek('-')) { const op = this.tokens[this.index++].type; return this.nest(() => ({kind: 'unary', op, right: this.unary()})); } return this.primary(); }
  primary() {
    const literal = this.take('literal'); if (literal) return {kind: 'literal', value: literal.value};
    const identifier = this.take('identifier'); if (identifier) return {kind: 'variable', name: identifier.value};
    if (this.take('(')) return this.nest(() => { const value = this.expression(); this.require(')'); return value; });
    fail('運算式不完整，請檢查數值、變數與括號。', 'SYNTAX_ERROR');
  }
}
export function parseExpression(source) { const parser = new Parser(source), result = parser.expression(); parser.require('eof'); return result; }
/** 文字輸出：整段照字面輸出，{變數} 換成目前的值；要印出大括號本身請寫 {{ 或 }}。 */
export function parseTextTemplate(source) {
  if (typeof source !== 'string' || !source.trim()) fail('請輸入要輸出的文字。', 'EMPTY_EXPRESSION');
  if (source.length > 4096) fail('輸出文字不可超過 4096 字。', 'EXPRESSION_LIMIT');
  const parts = []; let literal = '', offset = 0;
  const flush = () => { if (literal) { parts.push({kind: 'text', value: literal}); literal = ''; } };
  while (offset < source.length) {
    const character = source[offset];
    if ((character === '{' || character === '}') && source[offset + 1] === character) { literal += character; offset += 2; continue; }
    if (character === '}') fail('文字裡單獨的「}」請寫成 }}。', 'SYNTAX_ERROR');
    if (character === '{') {
      const end = source.indexOf('}', offset + 1);
      if (end < 0) fail('文字裡的「{」少了對應的「}」。', 'SYNTAX_ERROR');
      const name = source.slice(offset + 1, end).trim();
      if (!name) fail('「{ }」裡請填入變數名稱。', 'SYNTAX_ERROR');
      requireVariable(name); flush(); parts.push({kind: 'variable', name}); offset = end + 1;
      if (parts.length > 256) fail('輸出文字太複雜，請拆成多個輸出節點。', 'EXPRESSION_LIMIT');
      continue;
    }
    literal += character; offset++;
  }
  flush(); return parts;
}
function renderTemplate(parts, variables, limits) {
  let text = '';
  for (const part of parts) {
    text += part.kind === 'text' ? part.value : formatValue(evaluate({kind: 'variable', name: part.name}, variables, limits));
    if (text.length > limits.maxString) fail(`輸出文字超過 ${limits.maxString} 字的限制。`, 'STRING_LIMIT');
  }
  return text;
}
export function templateVariables(source) { return new Set(parseTextTemplate(source).filter(part => part.kind === 'variable').map(part => part.name)); }
export function parseAssignment(source) {
  const parser = new Parser(source), variable = parser.require('identifier').value; parser.require('=');
  const expression = parser.expression(); parser.require('eof'); return {variable, expression};
}
function checkedValue(value, limits) {
  if (typeof value === 'number' && !Number.isFinite(value)) fail('計算結果超出可表示的數字範圍。', 'NUMBER_LIMIT');
  if (typeof value === 'string' && value.length > limits.maxString) fail(`字串超過 ${limits.maxString} 字的限制。`, 'STRING_LIMIT');
  if (!['number', 'string', 'boolean'].includes(typeof value)) fail('只支援數字、文字與布林值。', 'TYPE_ERROR'); return value;
}
function boolean(value) { if (typeof value !== 'boolean') fail('此處需要 True 或 False；請使用比較運算式。', 'TYPE_ERROR'); return value; }
function numeric(value) { if (typeof value !== 'number') fail('此運算需要數字，請檢查輸入型別。', 'TYPE_ERROR'); return value; }
function compare(left, right, operator) {
  if (typeof left !== typeof right) fail('比較兩側的資料型別必須相同。', 'TYPE_ERROR');
  if (!['==', '!='].includes(operator) && typeof left === 'boolean') fail('布林值只支援 == 與 != 比較。', 'TYPE_ERROR');
  switch (operator) { case '==': return left === right; case '!=': return left !== right; case '<': return left < right; case '<=': return left <= right; case '>': return left > right; case '>=': return left >= right; }
}
function evaluate(ast, variables, limits) {
  if (ast.kind === 'literal') return checkedValue(ast.value, limits);
  if (ast.kind === 'variable') { if (!own(variables, ast.name)) fail(`變數「${ast.name}」尚未設定，請先使用輸入或處理節點。`, 'UNDEFINED_VARIABLE'); return checkedValue(variables[ast.name], limits); }
  if (ast.kind === 'unary') { const value = evaluate(ast.right, variables, limits); return ast.op === 'not' ? !boolean(value) : checkedValue(ast.op === '-' ? -numeric(value) : numeric(value), limits); }
  if (ast.kind === 'comparison') { let left = evaluate(ast.operands[0], variables, limits); for (let index = 0; index < ast.operators.length; index++) { const right = evaluate(ast.operands[index + 1], variables, limits); if (!compare(left, right, ast.operators[index])) return false; left = right; } return true; }
  const left = evaluate(ast.left, variables, limits);
  if (ast.op === 'and') return boolean(left) ? boolean(evaluate(ast.right, variables, limits)) : false;
  if (ast.op === 'or') return boolean(left) ? true : boolean(evaluate(ast.right, variables, limits));
  const right = evaluate(ast.right, variables, limits); let result;
  if (ast.op === '+' && typeof left === 'string' && typeof right === 'string') { if (left.length + right.length > limits.maxString) fail(`字串超過 ${limits.maxString} 字的限制。`, 'STRING_LIMIT'); return left + right; }
  numeric(left); numeric(right);
  if (['/', '//', '%'].includes(ast.op) && right === 0) fail('不可除以零，請檢查除數。', 'DIVISION_BY_ZERO');
  switch (ast.op) { case '+': result = left + right; break; case '-': result = left - right; break; case '*': result = left * right; break; case '/': result = left / right; break; case '//': result = Math.floor(left / right); break; case '%': { const remainder = left % right; result = remainder !== 0 && Math.sign(remainder) !== Math.sign(right) ? remainder + right : remainder; break; } }
  return checkedValue(Object.is(result, -0) ? 0 : result, limits);
}
export function evaluateExpression(source, variables = {}) { return evaluate(parseExpression(source), variables, DEFAULT_LIMITS); }
function references(ast, names = new Set()) { if (ast.kind === 'variable') names.add(ast.name); if (ast.left) references(ast.left, names); if (ast.right) references(ast.right, names); if (ast.operands) ast.operands.forEach(item => references(item, names)); return names; }

/** Structural errors block execution. Potentially undefined paths remain teachable warnings. */
export function validateGraph(raw) {
  const errors = [], warnings = []; let graph;
  const issue = (collection, message, code, nodeId, edgeId) => collection.push({...nodeId && {nodeId}, ...edgeId && {edgeId}, message, code});
  try { graph = normalizeGraph(raw); } catch (error) { issue(errors, error.message, error.code || 'INVALID_FILE'); return {errors, warnings}; }
  const nodes = new Map(graph.nodes.map(node => [node.id, node])), outgoing = new Map(), incoming = new Map();
  graph.nodes.forEach(node => { outgoing.set(node.id, []); incoming.set(node.id, []); });
  const starts = graph.nodes.filter(node => node.type === 'start');
  if (starts.length !== 1) issue(errors, '流程圖必須有且只有一個開始節點。', 'START_COUNT');
  if (!graph.nodes.some(node => node.type === 'end')) issue(errors, '請加入至少一個結束節點。', 'END_MISSING');
  for (const edge of graph.edges) {
    if (!nodes.has(edge.source) || !nodes.has(edge.target)) { issue(errors, '連線的起點或終點不存在。', 'DANGLING_EDGE', undefined, edge.id); continue; }
    outgoing.get(edge.source).push(edge); incoming.get(edge.target).push(edge);
    if (nodes.get(edge.target).type === 'start') issue(errors, '開始節點不能接收連線；迴圈請連回處理或判斷節點。', 'START_INCOMING', edge.target, edge.id);
    if (nodes.get(edge.source).type !== 'decision' && edge.branch !== null) issue(errors, '只有判斷節點可以使用 True／False 分支。', 'INVALID_BRANCH', edge.source, edge.id);
  }
  const reachable = new Set(), queue = starts.length === 1 ? [starts[0].id] : [];
  while (queue.length) { const id = queue.pop(); if (reachable.has(id)) continue; reachable.add(id); outgoing.get(id).forEach(edge => queue.push(edge.target)); }
  const reads = new Map(), writes = new Map(), allDefinitions = new Set();
  for (const node of graph.nodes) {
    const outputs = outgoing.get(node.id);
    if (node.type === 'end' && outputs.length) issue(errors, '結束節點不可有下一個節點。', 'END_OUTGOING', node.id);
    else if (node.type === 'decision') { if (outputs.length !== 2 || outputs.filter(edge => edge.branch === 'true').length !== 1 || outputs.filter(edge => edge.branch === 'false').length !== 1) issue(errors, '判斷節點需要各一條 True 與 False 連線。', 'DECISION_BRANCHES', node.id); }
    else if (node.type !== 'end' && outputs.length !== 1) issue(errors, outputs.length ? '此節點只能有一條輸出連線。' : '請將此節點連接到下一個節點。', 'OUTGOING_COUNT', node.id);
    if (starts.length === 1 && !reachable.has(node.id)) issue(warnings, '此節點無法從開始節點抵達；執行時會略過。', 'UNREACHABLE', node.id);
    if (node.type !== 'start' && node.type !== 'end' && !incoming.get(node.id).length) issue(warnings, '此節點尚未接上前一個節點。', 'NO_INCOMING', node.id);
    try {
      if (node.type === 'input') { const variable = requireVariable(node.data.variable); writes.set(node.id, variable); allDefinitions.add(variable); }
      if (node.type === 'process') { const assignment = parseAssignment(node.data.expression); writes.set(node.id, assignment.variable); allDefinitions.add(assignment.variable); reads.set(node.id, references(assignment.expression)); }
      if (node.type === 'output') reads.set(node.id, node.data.outputMode === 'text' ? templateVariables(node.data.expression) : references(parseExpression(node.data.expression)));
      if (node.type === 'decision') reads.set(node.id, references(parseExpression(node.data.expression)));
    } catch (error) { issue(errors, error.message, error.code || 'INVALID_EXPRESSION', node.id); }
  }
  // Greatest fixed point of definitely assigned variables, anchored at the empty Start state.
  const definiteIn = new Map(), definiteOut = new Map();
  graph.nodes.forEach(node => { const initial = node.type === 'start' || !reachable.has(node.id) ? new Set() : new Set(allDefinitions); definiteIn.set(node.id, initial); definiteOut.set(node.id, new Set([...initial, ...writes.has(node.id) ? [writes.get(node.id)] : []])); });
  const pending = [...reachable], queued = new Set(pending);
  for (let index = 0; index < pending.length; index++) {
    const node = nodes.get(pending[index]); queued.delete(node.id);
    const predecessors = incoming.get(node.id).filter(edge => reachable.has(edge.source));
    let input = node.type === 'start' || !predecessors.length ? new Set() : new Set(definiteOut.get(predecessors[0].source));
    for (const predecessor of predecessors.slice(1)) input = new Set([...input].filter(name => definiteOut.get(predecessor.source).has(name)));
    const output = new Set(input); if (writes.has(node.id)) output.add(writes.get(node.id));
    const previous = definiteOut.get(node.id), changed = output.size !== previous.size || [...output].some(name => !previous.has(name));
    definiteIn.set(node.id, input); definiteOut.set(node.id, output);
    if (changed) for (const edge of outgoing.get(node.id)) if (!queued.has(edge.target)) { queued.add(edge.target); pending.push(edge.target); }
  }
  for (const [nodeId, names] of reads) for (const name of names) {
    if (!allDefinitions.has(name)) issue(errors, `變數「${name}」尚未設定，請先加入輸入或指定。`, 'UNDEFINED_VARIABLE', nodeId);
    else if (reachable.has(nodeId) && !definiteIn.get(nodeId).has(name)) issue(warnings, `某些路徑可能尚未設定變數「${name}」；執行時會再次檢查。`, 'MAYBE_UNDEFINED_VARIABLE', nodeId);
  }
  return {errors, warnings};
}

export function formatValue(value) { return typeof value === 'boolean' ? value ? 'True' : 'False' : String(value); }
function inputValue(raw, type, limits) {
  if (typeof raw !== 'string') fail('輸入值必須是文字。', 'INVALID_INPUT');
  if (raw.length > limits.maxString) fail(`輸入不可超過 ${limits.maxString} 字。`, 'STRING_LIMIT');
  if (type === 'text') return raw;
  const clean = raw.trim();
  if (type === 'boolean') { if (clean === 'True') return true; if (clean === 'False') return false; fail('布林輸入請填寫 True 或 False（注意大小寫）。', 'INVALID_INPUT'); }
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(clean)) fail(type === 'integer' ? '請輸入有效整數。' : '請輸入有效數字。', 'INVALID_INPUT');
  const value = Number(clean);
  if (!Number.isFinite(value) || type === 'integer' && (!Number.isSafeInteger(value) || !/^[+-]?\d+$/.test(clean))) fail(type === 'integer' ? '請輸入安全範圍內的整數（不可包含小數點）。' : '數字超出可表示的範圍。', 'INVALID_INPUT');
  return Object.is(value, -0) ? 0 : value;
}
function boundedLimits(options) {
  const result = {};
  for (const [name, maximum] of Object.entries(DEFAULT_LIMITS)) {
    const value = options[name] ?? (name === 'maxTimeMs' ? options.maxTime : undefined) ?? maximum;
    result[name] = typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(maximum, Math.floor(value))) : maximum;
  }
  return result;
}

export function createExecution(raw, options = {}) {
  const graph = normalizeGraph(raw), validation = validateGraph(graph);
  if (validation.errors.length) { const error = validation.errors[0]; throw new FlowError(error.message, error.code, error.nodeId); }
  const limits = boundedLimits(options), nodes = new Map(graph.nodes.map(node => [node.id, node])), outgoing = new Map(), compiled = new Map();
  for (const node of graph.nodes) {
    outgoing.set(node.id, graph.edges.filter(edge => edge.source === node.id));
    if (node.type === 'process') compiled.set(node.id, parseAssignment(node.data.expression));
    else if (node.type === 'output') compiled.set(node.id, node.data.outputMode === 'text' ? {template: parseTextTemplate(node.data.expression)} : parseExpression(node.data.expression));
    else if (node.type === 'decision') compiled.set(node.id, parseExpression(node.data.expression));
  }
  let currentId = graph.nodes.find(node => node.type === 'start').id, variables = {}, step = 0, outputBytes = 0, traceBytes = 0, computeMs = 0, status = 'running';
  const execution = {
    get status() { return status; },
    get state() { return freeze({nodeId: currentId, variables: {...variables}, step, outputBytes, traceBytes, computeMs}); },
    step(rawInput) {
      if (status === 'completed' || status === 'error' || status === 'stopped') return {done: true};
      const started = now(), node = nodes.get(currentId), before = {...variables};
      let event;
      try {
        if (step >= limits.maxSteps) fail(`已達 ${limits.maxSteps} 步限制，可能有無限迴圈。請檢查條件與變數更新。`, 'STEP_LIMIT');
        if (computeMs >= limits.maxTimeMs) fail('計算時間超過限制，請檢查迴圈或縮小輸入。', 'TIME_LIMIT');
        if (node.type === 'input' && rawInput === undefined) { status = 'waiting'; return {waiting: {nodeId: node.id, ...node.data}}; }
        let convertedInput;
        if (node.type === 'input') {
          try { convertedInput = inputValue(rawInput, node.data.inputType, limits); }
          catch (cause) { status = 'waiting'; return {waiting: {nodeId: node.id, ...node.data}, inputError: {nodeId: node.id, message: cause.message, code: cause.code || 'INVALID_INPUT'}}; }
        }
        status = 'running';
        event = {step: step + 1, nodeId: node.id, type: node.type, expression: node.data.expression ?? '', result: null, variablesBefore: before, variablesAfter: {...before}, nextNodeId: null, edgeId: null};
        const after = {...before}; let result = null, addedOutputBytes = 0;
        if (node.type === 'input') { result = convertedInput; after[node.data.variable] = result; event.input = {variable: node.data.variable, value: result, raw: rawInput}; }
        if (node.type === 'process') { const assignment = compiled.get(node.id); result = evaluate(assignment.expression, before, limits); after[assignment.variable] = result; }
        if (node.type === 'output') { const program = compiled.get(node.id); result = program.template ? renderTemplate(program.template, before, limits) : evaluate(program, before, limits); event.output = formatValue(result); addedOutputBytes = byteLength(event.output + '\n'); if (outputBytes + addedOutputBytes > limits.maxOutput) fail(`輸出量超過 ${limits.maxOutput} 位元組，已停止執行。`, 'OUTPUT_LIMIT'); }
        if (node.type === 'decision') result = boolean(evaluate(compiled.get(node.id), before, limits));
        if (Object.keys(after).length > limits.maxVariables) fail(`變數數量超過 ${limits.maxVariables} 個的限制。`, 'VARIABLE_LIMIT');
        event.result = result; event.variablesAfter = after;
        const edge = node.type === 'decision' ? outgoing.get(node.id).find(item => item.branch === String(result)) : outgoing.get(node.id)[0];
        if (edge) { event.nextNodeId = edge.target; event.edgeId = edge.id; }
        const size = byteLength(JSON.stringify(event));
        if (traceBytes + size > limits.maxTraceBytes) fail('執行軌跡超過容量限制，請減少步數或字串長度。', 'TRACE_LIMIT');
        if (computeMs + now() - started > limits.maxTimeMs) fail('計算時間超過限制，請檢查迴圈或縮小輸入。', 'TIME_LIMIT');
        variables = after; step++; outputBytes += addedOutputBytes; traceBytes += size; currentId = event.nextNodeId;
        if (node.type === 'end') status = 'completed';
        return {event: freeze(event), ...status === 'completed' && {done: true}};
      } catch (cause) {
        status = 'error'; const error = {nodeId: node?.id, message: cause instanceof FlowError ? cause.message : '執行發生錯誤，請檢查節點設定。', code: cause.code || 'EXECUTION_ERROR'};
        const failedEvent = {step: step + 1, nodeId: node?.id, type: node?.type, expression: node?.data.expression ?? '', result: null, variablesBefore: before, variablesAfter: {...before}, nextNodeId: null, edgeId: null, error};
        const size = byteLength(JSON.stringify(failedEvent));
        if (step < limits.maxSteps && traceBytes + size <= limits.maxTraceBytes) { step++; traceBytes += size; return {event: freeze(failedEvent), done: true, error}; }
        return {done: true, error};
      } finally { computeMs += now() - started; }
    },
    stop() { if (status !== 'completed' && status !== 'error') status = 'stopped'; },
  };
  return execution;
}
