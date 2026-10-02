/* Independent SVG editor. Graph coordinates always describe a node's top-left. */
import {createRouting,routeEdge,shapeAnchor} from './flow-routing.mjs';
const NS = 'http://www.w3.org/2000/svg';
const TYPES = {
  start: { title: '開始', label: 'START', color: '#94a3b8', width: 180, height: 56 },
  end: { title: '結束', label: 'END', color: '#94a3b8', width: 180, height: 56 },
  input: { title: '輸入', label: 'INPUT', color: '#38bdf8', width: 180, height: 76 },
  output: { title: '輸出', label: 'OUTPUT', color: '#34d399', width: 180, height: 76 },
  process: { title: '處理', label: 'PROCESS', color: '#a78bfa', width: 180, height: 76 },
  decision: { title: '判斷', label: 'DECISION', color: '#fbbf24', width: 200, height: 116 },
};
const clone = (value) => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const uid = (prefix) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`}`;
const svgElement = (name, attrs = {}, text) => {
  const el = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  if (text !== undefined) el.textContent = text;
  return el;
};
const editable = (target) => target instanceof Element && Boolean(target.closest('input,textarea,select,[contenteditable="true"]'));
const STYLE = `
.fc-svg{display:block;width:100%;height:100%;min-height:240px;touch-action:none;user-select:none;outline:none;background:#0c0d12;font-family:"Plus Jakarta Sans","Noto Sans TC",system-ui,sans-serif;overflow:hidden}
.fc-svg:focus-visible{box-shadow:inset 0 0 0 2px #3b82f6}.fc-svg.fc-mode-pan{cursor:grab}.fc-svg.fc-dragging{cursor:grabbing!important}
.fc-backdrop{fill:url(#PATTERN)}.fc-node{cursor:grab;outline:none}.fc-node:active{cursor:grabbing}.fc-node .fc-shape{fill:#141720;stroke:var(--node-color);stroke-width:1.4;stroke-opacity:.58;transition:fill .15s,stroke-opacity .15s;filter:drop-shadow(0 4px 8px #0003)}
.fc-node:hover .fc-shape{fill:#1b202b;stroke-opacity:1}.fc-node.fc-selected .fc-shape,.fc-node:focus-visible .fc-shape{stroke:#60a5fa;stroke-width:2.6;stroke-opacity:1;fill:#17243a}
.fc-node.fc-visited .fc-shape{fill:#172330;stroke-opacity:.8}.fc-node.fc-next .fc-shape{stroke:#93c5fd;stroke-dasharray:5 4;stroke-opacity:1}.fc-node.fc-current .fc-shape{fill:#172b49;stroke:#60a5fa;stroke-width:3;stroke-opacity:1;filter:drop-shadow(0 0 9px #3b82f65c)}
.fc-node.fc-paused .fc-shape{stroke:#fbbf24;fill:#302717}.fc-node.fc-waiting .fc-shape{stroke:#38bdf8;fill:#102c3c}.fc-node.fc-invalid .fc-shape,.fc-node.fc-error .fc-shape{stroke:#fb7185;stroke-opacity:1}.fc-node.fc-error .fc-shape{fill:#321b27;stroke-width:3}
.fc-node.fc-connectable .fc-shape{stroke:#34d399;stroke-opacity:1}.fc-node.fc-connectable:hover .fc-shape{fill:#123329;stroke-width:3}.fc-title{font-size:14px;font-weight:600;fill:#c5cfdd;letter-spacing:.3px;pointer-events:none}.fc-title.fc-terminal{font-size:14px;fill:#e2e8f0;letter-spacing:1px}.fc-expression{font-family:"JetBrains Mono","SFMono-Regular",Consolas,monospace;font-size:14px;fill:#f5f7fa;pointer-events:none}.fc-kind{font-size:8px;font-weight:700;letter-spacing:1.25px;fill:var(--node-color);pointer-events:none}.fc-port{cursor:crosshair;outline:none}.fc-port .fc-port-dot{fill:#111621;stroke:#708196;stroke-width:1.6;transition:r .1s,fill .1s}.fc-port:hover .fc-port-dot,.fc-port:focus-visible .fc-port-dot{fill:#60a5fa;stroke:#bfdbfe;r:6}.fc-port[data-branch="true"] .fc-port-dot{stroke:#34d399}.fc-port[data-branch="false"] .fc-port-dot{stroke:#fb7185}.fc-port.fc-port-active .fc-port-dot{fill:#60a5fa;stroke:#bfdbfe;r:6}.fc-branch-label{font-size:10px;font-weight:600;pointer-events:none}.fc-validation-dot{fill:#fb7185;stroke:#141720;stroke-width:2;pointer-events:none}.fc-warning-dot{fill:#fbbf24}.fc-validation-glyph{fill:#0c0d12;font-size:10px;font-weight:800;pointer-events:none}
.fc-edge{cursor:pointer;outline:none}.fc-edge-line{fill:none;stroke:#526075;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;pointer-events:none;transition:stroke .12s,stroke-width .12s}.fc-edge[data-branch="true"] .fc-edge-line{stroke:#31927c}.fc-edge[data-branch="false"] .fc-edge-line{stroke:#ae6175}.fc-edge-hit{fill:none;stroke:transparent;stroke-width:16;pointer-events:stroke}.fc-edge:hover .fc-edge-line{stroke:#94a3b8;stroke-width:2.6}.fc-edge.fc-selected .fc-edge-line,.fc-edge:focus-visible .fc-edge-line{stroke:#60a5fa;stroke-width:3}.fc-edge.fc-visited .fc-edge-line{stroke:#4b91d6;stroke-width:2.1}.fc-edge.fc-active .fc-edge-line{stroke:#60a5fa;stroke-width:3;stroke-dasharray:7 4;animation:fc-flow .65s linear infinite}.fc-edge.fc-invalid .fc-edge-line{stroke:#fb7185;stroke-dasharray:4 4}.fc-temp-edge{fill:none;stroke:#60a5fa;stroke-width:2;stroke-dasharray:6 4;pointer-events:none}.fc-marquee{fill:#3b82f622;stroke:#60a5fa;stroke-width:1;stroke-dasharray:5 3;pointer-events:none}.fc-empty{fill:#64748b;text-anchor:middle;font-size:14px;pointer-events:none}.fc-empty-detail{font-size:11px;fill:#475569}.fc-link-hint{pointer-events:none;fill:#94a3b8;font-size:11px}
@keyframes fc-flow{to{stroke-dashoffset:-22}}@media(prefers-reduced-motion:reduce){.fc-edge.fc-active .fc-edge-line{animation:none}.fc-node .fc-shape{transition:none}}
`;

export class FlowCanvas {
  constructor(container, callbacks = {}) {
    if (!(container instanceof Element)) throw new TypeError('FlowCanvas 需要有效的畫布容器。');
    this.container = container;
    this.callbacks = callbacks;
    this.graph = { version: 1, title: '未命名流程圖', nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } };
    this.nodeElements = new Map();
    this.edgeElements = new Map();
    this.edgeIndex = new Map();
    this.nodeIndex = new Map();
    this.selectedNodes = new Set();
    this.selectedEdges = new Set();
    this.undoStack = [];
    this.redoStack = [];
    this.clipboard = null;
    this.pasteOffset = 0;
    this.execution = {};
    this.validation = { errors: [], warnings: [] };
    this.mode = 'select';
    this.spaceDown = false;
    this.gesture = null;
    this.pendingLink = null;
    this.destroyed = false;
    this.patternId = uid('fc-grid');
    this.markerId = uid('fc-arrow');
    this.activeMarkerId = uid('fc-active-arrow');
    this.svg = svgElement('svg', { class: 'fc-svg', role: 'group', 'aria-label': '流程圖畫布。拖曳節點移動，雙擊編輯；由出口連到入口建立流程。', tabindex: '0' });
    const defs = svgElement('defs');
    const style = svgElement('style', {}, STYLE.replace('PATTERN', this.patternId));
    this.pattern = svgElement('pattern', { id: this.patternId, width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
    this.pattern.append(svgElement('circle', { cx: 1, cy: 1, r: 1, fill: '#252b38' }));
    defs.append(style, this.pattern);
    for (const [id, color] of [[this.markerId, '#64748b'], [this.activeMarkerId, '#60a5fa']]) {
      const marker = svgElement('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' });
      marker.append(svgElement('path', { d: 'M 1 1 L 9 5 L 1 9 z', fill: color }));
      defs.append(marker);
    }
    this.backdrop = svgElement('rect', { class: 'fc-backdrop', width: '100%', height: '100%' });
    this.world = svgElement('g', { class: 'fc-world' });
    this.edgeLayer = svgElement('g', { class: 'fc-edges' });
    this.nodeLayer = svgElement('g', { class: 'fc-nodes' });
    this.overlayLayer = svgElement('g', { class: 'fc-overlays' });
    this.world.append(this.edgeLayer, this.nodeLayer, this.overlayLayer);
    this.emptyLabel = svgElement('text', { class: 'fc-empty', x: '50%', y: '45%' }, '從左側加入第一個節點');
    this.emptyDetail = svgElement('text', { class: 'fc-empty fc-empty-detail', x: '50%', y: '45%', dy: 26 }, '拖曳排列邏輯，從連接點拉線建立流程');
    this.svg.append(defs, this.backdrop, this.world, this.emptyLabel, this.emptyDetail);
    container.append(this.svg);
    this.listeners = [];
    this.listen(this.svg, 'pointerdown', (e) => this.pointerDown(e));
    this.listen(this.svg, 'pointermove', (e) => this.pointerMove(e));
    this.listen(this.svg, 'pointerup', (e) => this.pointerUp(e));
    this.listen(this.svg, 'pointercancel', (e) => this.pointerCancel(e));
    this.listen(this.svg, 'dblclick', (e) => {
      const node = e.target.closest('[data-node-id]');
      if (node && !e.target.closest('.fc-port')) this.callbacks.onEdit?.(node.dataset.nodeId);
    });
    this.listen(this.svg, 'wheel', (e) => this.wheel(e), { passive: false });
    this.listen(this.svg, 'keydown', (e) => this.keyDown(e));
    this.listen(this.svg, 'keyup', (e) => { if (e.code === 'Space') { this.spaceDown = false; this.updateCursor(); } });
    this.listen(this.svg, 'blur', () => { this.spaceDown = false; this.updateCursor(); }, true);
    this.listen(window, 'blur', () => { this.spaceDown = false; this.pointerCancel(); this.updateCursor(); });
    this.listen(this.svg, 'dragover', (e) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; });
    this.listen(this.svg, 'drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer?.getData('text/flow-node') || e.dataTransfer?.getData('text/plain');
      if (TYPES[type]) {
        const point = this.toWorld(e.clientX, e.clientY);
        this.addNode(type, { x: point.x - TYPES[type].width / 2, y: point.y - TYPES[type].height / 2 });
      }
    });
    this.resizeObserver = new ResizeObserver(() => this.updateViewport());
    this.resizeObserver.observe(container);
    this.render();
  }

  listen(target, event, handler, options) { target.addEventListener(event, handler, options); this.listeners.push([target, event, handler, options]); }
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }
  get selection() {
    const nodeIds = [...this.selectedNodes], edgeIds = [...this.selectedEdges];
    return { nodeIds, edgeIds, nodeId: nodeIds.length === 1 && !edgeIds.length ? nodeIds[0] : null, edgeId: edgeIds.length === 1 && !nodeIds.length ? edgeIds[0] : null };
  }
  getGraph() { return clone(this.graph); }
  getNode(id) { const node = this.nodeIndex.get(id); return node ? clone(node) : null; }
  updateTitle(title) {
    if (this.graph.title === title) return;
    this.remember(false);
    this.graph.title = title;
    this.changed(false, 'edit-title');
  }
  setGraph(graph, { fit = false } = {}) {
    this.stopReveal(); this.pointerCancel();
    this.cancelLink();
    this.graph = clone(graph);
    this.graph.viewport = { x: 0, y: 0, zoom: 1, ...graph.viewport };
    this.graph.viewport.zoom = clamp(Number(this.graph.viewport.zoom) || 1, .1, 4);
    for (const coordinate of ['x', 'y']) if (!Number.isFinite(this.graph.viewport[coordinate])) this.graph.viewport[coordinate] = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.selectedNodes.clear(); this.selectedEdges.clear();
    this.execution = {}; this.validation = { errors: [], warnings: [] };
    this.render();
    if (fit) this.fit(false);
    this.selectionChanged();
  }
  remember(semantic = true, previous = null) {
    this.undoStack.push({ graph: previous ?? this.getGraph(), semantic });
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }
  changed(semantic, reason) {
    this.callbacks.onChange?.(this.getGraph(), { semantic, reason, canUndo: this.canUndo, canRedo: this.canRedo });
  }
  scheduleLayoutChange(reason) {
    clearTimeout(this.layoutTimer);
    this.layoutTimer = setTimeout(() => { if (!this.destroyed) this.changed(false, reason); }, 160);
  }
  selectionChanged() { this.updateSelection(); this.callbacks.onSelect?.(this.selection); }
  message(text) { this.callbacks.onMessage?.(text); }

  addNode(type, position) {
    if (!TYPES[type]) return null;
    if (this.graph.nodes.length >= 500) { this.message('這份流程圖已達 500 個節點上限。請拆成較小的流程圖。'); return null; }
    if (type === 'start' && this.graph.nodes.some((node) => node.type === 'start')) { this.message('每個流程圖只能有一個開始節點。'); return null; }
    const def = TYPES[type];
    if (!position) {
      const rect = this.svg.getBoundingClientRect();
      const center = this.toWorld(rect.left + rect.width / 2, rect.top + rect.height / 2);
      position = { x: center.x - def.width / 2, y: center.y - def.height / 2 };
      let attempt = 0;
      while (attempt++ < 15 && this.graph.nodes.some((node) => Math.abs(node.position.x - position.x) < 25 && Math.abs(node.position.y - position.y) < 25)) { position.x += 28; position.y += 28; }
    }
    const defaults = { input: { variable: 'value', prompt: '請輸入數值', inputType: 'integer' }, output: { expression: '{value}', outputMode: 'text' }, process: { expression: 'value = 0' }, decision: { expression: 'value > 0' }, start: {}, end: {} };
    const node = { id: uid(type), type, title: def.title, position: { x: Math.round(position.x), y: Math.round(position.y) }, data: defaults[type] };
    this.remember(true);
    this.graph.nodes.push(node);
    this.render(); this.selectNode(node.id); this.changed(true, 'add-node');
    this.message(`已新增「${def.title}」。雙擊節點可編輯內容。`);
    return node.id;
  }
  updateNode(id, patch) {
    const node = this.nodeIndex.get(id);
    if (!node) return false;
    const semantic = Boolean(patch.data && JSON.stringify({ ...node.data, ...patch.data }) !== JSON.stringify(node.data));
    const titleChanged = patch.title !== undefined && node.title !== patch.title;
    if (!semantic && !titleChanged) return false;
    this.remember(semantic);
    if (patch.title !== undefined) node.title = String(patch.title);
    if (patch.data) node.data = { ...node.data, ...clone(patch.data) };
    this.render(); this.changed(semantic, 'edit-node'); this.selectionChanged();
    return true;
  }
  deleteSelection() {
    if (!this.selectedNodes.size && !this.selectedEdges.size) return false;
    this.cancelLink(); this.remember(true);
    this.graph.nodes = this.graph.nodes.filter((node) => !this.selectedNodes.has(node.id));
    this.graph.edges = this.graph.edges.filter((edge) => !this.selectedEdges.has(edge.id) && !this.selectedNodes.has(edge.source) && !this.selectedNodes.has(edge.target));
    this.selectedNodes.clear(); this.selectedEdges.clear();
    this.render(); this.selectionChanged(); this.changed(true, 'delete');
    return true;
  }
  copySelection() {
    if (!this.selectedNodes.size) { this.message('請先選取要複製的節點。'); return false; }
    this.clipboard = clone({ nodes: this.graph.nodes.filter((node) => this.selectedNodes.has(node.id)), edges: this.graph.edges.filter((edge) => this.selectedNodes.has(edge.source) && this.selectedNodes.has(edge.target)) });
    this.pasteOffset = 0;
    this.message(`已複製 ${this.clipboard.nodes.length} 個節點；按 Ctrl / ⌘ V 貼上。`);
    return true;
  }
  paste() {
    if (!this.clipboard?.nodes.length) { this.message('請先複製畫布上的節點。'); return false; }
    const hasStart = this.graph.nodes.some((node) => node.type === 'start');
    const sourceNodes = this.clipboard.nodes.filter((node) => !(hasStart && node.type === 'start'));
    if (!sourceNodes.length) { this.message('流程圖已有開始節點，無法再貼上另一個開始。'); return false; }
    if (this.graph.nodes.length + sourceNodes.length > 500) { this.message('貼上後會超過 500 個節點上限。'); return false; }
    this.remember(true);
    this.pasteOffset += 32;
    const idMap = new Map(sourceNodes.map((node) => [node.id, uid(node.type)]));
    const nodes = sourceNodes.map((source) => ({ ...clone(source), id: idMap.get(source.id), position: { x: source.position.x + this.pasteOffset, y: source.position.y + this.pasteOffset } }));
    const edges = this.clipboard.edges.filter((edge) => idMap.has(edge.source) && idMap.has(edge.target)).map((edge) => ({ ...clone(edge), id: uid('edge'), source: idMap.get(edge.source), target: idMap.get(edge.target) }));
    this.graph.nodes.push(...nodes); this.graph.edges.push(...edges);
    this.selectedNodes = new Set(nodes.map((node) => node.id)); this.selectedEdges.clear();
    this.render(); this.selectionChanged(); this.changed(true, 'paste');
    this.message(`已貼上 ${nodes.length} 個節點${sourceNodes.length < this.clipboard.nodes.length ? '（略過既有的開始節點）' : ''}。`);
    return true;
  }
  undo() {
    const previous = this.undoStack.pop(); if (!previous) return false;
    this.cancelLink(); this.redoStack.push({ graph: this.getGraph(), semantic: previous.semantic });
    this.graph = previous.graph; this.selectedNodes.clear(); this.selectedEdges.clear();
    this.render(); this.selectionChanged(); this.changed(previous.semantic, 'undo'); return true;
  }
  redo() {
    const next = this.redoStack.pop(); if (!next) return false;
    this.cancelLink(); this.undoStack.push({ graph: this.getGraph(), semantic: next.semantic });
    this.graph = next.graph; this.selectedNodes.clear(); this.selectedEdges.clear();
    this.render(); this.selectionChanged(); this.changed(next.semantic, 'redo'); return true;
  }
  selectNode(id) {
    this.selectedNodes.clear(); this.selectedEdges.clear();
    if (this.nodeIndex.has(id)) this.selectedNodes.add(id);
    this.selectionChanged();
  }
  // Pan (never zoom) so an off-screen node lands in the middle; nodes already in view stay put.
  revealNode(id) {
    const node = this.nodeIndex.get(id); if (!node) return;
    const type = TYPES[node.type] ?? TYPES.process, rect = this.svg.getBoundingClientRect(), { x, y, zoom } = this.graph.viewport, margin = 24;
    const left = x + node.position.x * zoom, top = y + node.position.y * zoom;
    if (left >= margin && top >= margin && left + type.width * zoom <= rect.width - margin && top + type.height * zoom <= rect.height - margin) return;
    const from = { x, y }, to = { x: rect.width / 2 - (node.position.x + type.width / 2) * zoom, y: rect.height / 2 - (node.position.y + type.height / 2) * zoom };
    this.stopReveal();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { Object.assign(this.graph.viewport, to); this.updateViewport(); this.changed(false, 'reveal'); return; }
    const start = performance.now(), duration = 320;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration), ease = 1 - (1 - t) ** 3;
      this.graph.viewport.x = from.x + (to.x - from.x) * ease; this.graph.viewport.y = from.y + (to.y - from.y) * ease;
      this.updateViewport();
      if (t < 1) this.revealFrame = requestAnimationFrame(step); else { this.revealFrame = null; this.changed(false, 'reveal'); }
    };
    this.revealFrame = requestAnimationFrame(step);
  }
  stopReveal() { if (this.revealFrame) { cancelAnimationFrame(this.revealFrame); this.revealFrame = null; } }
  clearSelection() { this.selectedNodes.clear(); this.selectedEdges.clear(); this.selectionChanged(); }
  setInteraction(mode) { this.mode = mode === 'pan' ? 'pan' : 'select'; this.updateCursor(); }
  updateCursor() { this.svg.classList.toggle('fc-mode-pan', this.mode === 'pan' || this.spaceDown); }

  render() {
    this.nodeIndex = new Map(this.graph.nodes.map((node) => [node.id, node]));
    this.edgeIndex = new Map(this.graph.edges.map((edge) => [edge.id, edge]));
    this.rebuildRouting();
    this.nodeElements.clear(); this.edgeElements.clear();
    this.edgeLayer.replaceChildren(); this.nodeLayer.replaceChildren();
    for (const edge of this.graph.edges) {
      if (!this.nodeIndex.has(edge.source) || !this.nodeIndex.has(edge.target)) continue;
      const group = svgElement('g', { class: 'fc-edge', 'data-edge-id': edge.id, 'data-branch': edge.branch ?? '', tabindex: '-1', role: 'button', 'aria-label': `連線：${this.nodeIndex.get(edge.source).title || TYPES[this.nodeIndex.get(edge.source).type]?.title} 到 ${this.nodeIndex.get(edge.target).title || TYPES[this.nodeIndex.get(edge.target).type]?.title}${edge.branch ? `，${edge.branch === 'true' ? '是' : '否'}` : ''}` });
      const path = this.edgePath(edge);
      group.append(svgElement('path', { class: 'fc-edge-hit', d: path }), svgElement('path', { class: 'fc-edge-line', d: path, 'marker-end': `url(#${this.markerId})` }));
      this.edgeLayer.append(group); this.edgeElements.set(edge.id, group);
    }
    for (const node of this.graph.nodes) {
      if (!TYPES[node.type]) continue;
      const group = this.createNode(node);
      this.nodeLayer.append(group); this.nodeElements.set(node.id, group);
    }
    this.emptyLabel.style.display = this.emptyDetail.style.display = this.graph.nodes.length ? 'none' : '';
    this.updateViewport(); this.updateSelection(); this.setExecution(this.execution); this.setValidation(this.validation);
  }
  createNode(node) {
    const def = TYPES[node.type], { width: w, height: h } = def;
    const group = svgElement('g', { class: `fc-node fc-${node.type}`, 'data-node-id': node.id, transform: `translate(${node.position.x},${node.position.y})`, style: `--node-color:${def.color}`, tabindex: '0', role: 'button', 'aria-label': `${node.title || def.title}，${this.expression(node)}。按 Enter 編輯。` });
    group.append(svgElement('title', {}, `${node.title || def.title}${this.expression(node) ? `\n${this.expression(node)}` : ''}`));
    if (node.type === 'decision') group.append(svgElement('path', { class: 'fc-shape', d: `M ${w / 2} 0 L ${w} ${h / 2} L ${w / 2} ${h} L 0 ${h / 2} Z` }));
    else if (node.type === 'input' || node.type === 'output') group.append(svgElement('path', { class: 'fc-shape', d: `M 18 0 H ${w} L ${w - 18} ${h} H 0 Z` }));
    else group.append(svgElement('rect', { class: 'fc-shape', width: w, height: h, rx: node.type === 'start' || node.type === 'end' ? h / 2 : 10 }));
    if (node.type === 'start' || node.type === 'end') {
      group.append(svgElement('text', { class: 'fc-title fc-terminal', x: w / 2, y: h / 2 + 5, 'text-anchor': 'middle' }, truncate(node.title || def.title, 16)));
    } else if (node.type === 'decision') {
      group.append(svgElement('text', { class: 'fc-title', x: w / 2, y: 43, 'text-anchor': 'middle' }, truncate(node.title || def.title, 20)), svgElement('text', { class: 'fc-expression', x: w / 2, y: 65, 'text-anchor': 'middle' }, truncate(this.expression(node), 26)));
    } else {
      group.append(svgElement('text', { class: 'fc-title', x: w / 2, y: 28, 'text-anchor': 'middle' }, truncate(node.title || def.title, 18)), svgElement('text', { class: 'fc-expression', x: w / 2, y: 52, 'text-anchor': 'middle' }, truncate(this.expression(node), 22)));
    }
    this.updateNodePorts(node,group);
    const bx = node.type === 'decision' ? 169 : w - 9, by = node.type === 'decision' ? 24 : 7;
    const badge = svgElement('g', { class: 'fc-validation-badge', display: 'none' });
    badge.append(svgElement('circle', { class: 'fc-validation-dot', cx: bx, cy: by, r: 8 }), svgElement('text', { class: 'fc-validation-glyph', x: bx, y: by + 3.5, 'text-anchor': 'middle' }, '!'));
    group.append(badge);
    return group;
  }
  createPort(nodeId, direction, branch, x, y, label, side) {
    const port = svgElement('g', { class: 'fc-port', 'data-node-id': nodeId, 'data-port': direction, 'data-branch': branch ?? '', 'data-side':side, transform: `translate(${x},${y})`, tabindex: '0', role: 'button', 'aria-label': label });
    port.append(svgElement('circle', { r: 12, fill: 'transparent' }), svgElement('circle', { class: 'fc-port-dot', r: 4.2 }), svgElement('title', {}, `${label}：點擊或拖曳以連線`));
    return port;
  }
  expression(node) {
    if (node.type === 'input') return `${node.data?.variable || 'value'} ← 輸入`;
    return node.data?.expression || '';
  }
  portPosition(node, direction, branch) {
    const side=direction==='in'?'top':node.type==='decision'?this.routing?.decisionSides.get(node.id)?.[branch]||(branch==='false'?'right':'left'):this.routing?.outputSides.get(node.id)||'bottom';
    return shapeAnchor(node,side);
  }
  rebuildRouting(){
    this.routing=createRouting(this.graph);
    this.inputSides=new Map(this.graph.nodes.map(n=>[n.id,new Set(['top'])]));
    for(const edge of this.graph.edges){const route=routeEdge(edge,this.routing);if(route)this.inputSides.get(edge.target)?.add(route.targetPort);}
  }
  updateNodePorts(node,group){
    const outputSide=this.routing?.outputSides.get(node.id)||'bottom';
    const branches=this.routing?.decisionSides.get(node.id)||{true:'left',false:'right'};
    const inputs=node.type==='start'?[]:[...this.inputSides.get(node.id)||['top']].filter(side=>node.type==='end'||node.type==='decision'||side!==outputSide);
    const signature=outputSide+'|'+inputs.join('|')+'|'+branches.true;
    if(group.dataset.ports===signature)return;
    group.dataset.ports=signature;
    for(const child of group.querySelectorAll('.fc-port,.fc-branch-label'))child.remove();
    const add=(direction,branch,side,label)=>{const p=shapeAnchor(node,side);group.append(this.createPort(node.id,direction,branch,p.x-node.position.x,p.y-node.position.y,label,side));};
    for(const side of inputs)add('in',null,side,node.type==='decision'&&side==='bottom'?'迴圈回到判斷的入口':'輸入連接點');
    if(node.type==='decision'){
      for(const [branch,side] of Object.entries(branches)){
        const label=branch==='true'?'是 True':'否 False';add('out',branch,side,label+' 出口');
        group.append(svgElement('text',{class:'fc-branch-label',x:side==='left'?-12:212,y:44,'text-anchor':side==='left'?'end':'start',fill:branch==='true'?'#34d399':'#fb7185'},label));
      }
    }else if(node.type!=='end')add('out',null,outputSide,'輸出連接點');
  }
  edgePath(edge) {
    return routeEdge(edge,this.routing)?.path||'';
  }
  updateEdges() {
    // A moved node may obstruct a non-incident connection, so refresh derived
    // geometry for all edges while preserving the SVG elements and execution.
    this.rebuildRouting();
    for (const id of this.edgeElements.keys()) {
      const edge = this.edgeIndex.get(id), el = this.edgeElements.get(id);
      if (edge && el) { const d = this.edgePath(edge); for (const path of el.children) path.setAttribute('d', d); }
    }
    for(const [id,el] of this.nodeElements)this.updateNodePorts(this.nodeIndex.get(id),el);
  }
  updateSelection() {
    for (const [id, el] of this.nodeElements) { el.classList.toggle('fc-selected', this.selectedNodes.has(id)); el.setAttribute('aria-pressed', String(this.selectedNodes.has(id))); }
    for (const [id, el] of this.edgeElements) { el.classList.toggle('fc-selected', this.selectedEdges.has(id)); el.setAttribute('aria-pressed', String(this.selectedEdges.has(id))); }
  }
  setExecution(state = {}) {
    this.execution = state || {};
    const visitedNodes = new Set(state?.visitedNodeIds || []), visitedEdges = new Set(state?.visitedEdgeIds || []);
    for (const [id, el] of this.nodeElements) {
      const current = id === state?.currentNodeId;
      el.classList.toggle('fc-current', current);
      el.classList.toggle('fc-next', id === state?.nextNodeId && !current);
      el.classList.toggle('fc-visited', visitedNodes.has(id));
      el.classList.toggle('fc-paused', current && state?.status === 'paused');
      el.classList.toggle('fc-waiting', current && ['waiting', 'waiting-input', 'awaiting-input'].includes(state?.status));
      el.classList.toggle('fc-error', current && state?.status === 'error');
    }
    for (const [id, el] of this.edgeElements) {
      const active = id === state?.activeEdgeId;
      el.classList.toggle('fc-active', active);
      el.classList.toggle('fc-visited', visitedEdges.has(id));
      el.querySelector('.fc-edge-line').style.animationPlayState = state?.status === 'playing' ? 'running' : 'paused';
      el.querySelector('.fc-edge-line').setAttribute('marker-end', `url(#${active || visitedEdges.has(id) ? this.activeMarkerId : this.markerId})`);
    }
  }
  setValidation(validation = {}) {
    this.validation = validation || { errors: [], warnings: [] };
    const errors = validation.errors || [], warnings = validation.warnings || [];
    for (const [id, el] of this.nodeElements) {
      const nodeErrors = errors.filter((item) => item.nodeId === id || item.nodeIds?.includes(id));
      const nodeWarnings = warnings.filter((item) => item.nodeId === id || item.nodeIds?.includes(id));
      const badge = el.querySelector('.fc-validation-badge');
      el.classList.toggle('fc-invalid', nodeErrors.length > 0);
      badge.setAttribute('display', nodeErrors.length || nodeWarnings.length ? '' : 'none');
      badge.querySelector('circle').classList.toggle('fc-warning-dot', !nodeErrors.length);
      const node = this.nodeIndex.get(id);
      el.querySelector('title').textContent = [node.title || TYPES[node.type].title, this.expression(node), ...nodeErrors.map((item) => item.message), ...nodeWarnings.map((item) => item.message)].filter(Boolean).join('\n');
    }
    for (const [id, el] of this.edgeElements) el.classList.toggle('fc-invalid', errors.some((item) => item.edgeId === id || item.edgeIds?.includes(id)));
  }

  updateViewport() {
    const { x, y, zoom } = this.graph.viewport;
    this.world.setAttribute('transform', `translate(${x},${y}) scale(${zoom})`);
    this.pattern.setAttribute('patternTransform', `translate(${x},${y}) scale(${zoom})`);
    this.svg.dataset.zoom = String(Math.round(zoom * 100));
  }
  toWorld(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect(), { x, y, zoom } = this.graph.viewport;
    return { x: (clientX - rect.left - x) / zoom, y: (clientY - rect.top - y) / zoom };
  }
  zoomAt(factor, clientX, clientY) {
    this.stopReveal();
    const point = this.toWorld(clientX, clientY), rect = this.svg.getBoundingClientRect();
    const viewport = this.graph.viewport;
    viewport.zoom = clamp(viewport.zoom * factor, .1, 4);
    viewport.x = clientX - rect.left - point.x * viewport.zoom;
    viewport.y = clientY - rect.top - point.y * viewport.zoom;
    this.updateViewport(); this.scheduleLayoutChange('zoom');
  }
  zoomBy(factor) {
    const rect = this.svg.getBoundingClientRect();
    this.zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
  fit(notify = true) {
    this.stopReveal();
    const rect = this.svg.getBoundingClientRect();
    if (!this.graph.nodes.length) this.graph.viewport = { x: 0, y: 0, zoom: 1 };
    else {
      const minX = Math.min(...this.graph.nodes.map((node) => node.position.x)) - 65;
      const minY = Math.min(...this.graph.nodes.map((node) => node.position.y)) - 45;
      const maxX = Math.max(...this.graph.nodes.map((node) => node.position.x + (TYPES[node.type]?.width ?? 180))) + 65;
      const maxY = Math.max(...this.graph.nodes.map((node) => node.position.y + (TYPES[node.type]?.height ?? 76))) + 45;
      const zoom = clamp(Math.min((rect.width - 36) / (maxX - minX), (rect.height - 36) / (maxY - minY), 1.1), .1, 4);
      this.graph.viewport = { zoom, x: (rect.width - (maxX - minX) * zoom) / 2 - minX * zoom, y: (rect.height - (maxY - minY) * zoom) / 2 - minY * zoom };
    }
    this.updateViewport(); if (notify) this.changed(false, 'fit');
  }
  wheel(event) {
    event.preventDefault(); this.stopReveal();
    if (event.shiftKey && !event.ctrlKey) {
      this.graph.viewport.x -= event.deltaY || event.deltaX;
      this.updateViewport(); this.scheduleLayoutChange('pan');
    } else this.zoomAt(Math.exp(-event.deltaY * .0015), event.clientX, event.clientY);
  }

  connectionProblem(sourceId, targetId, branch) {
    const source = this.nodeIndex.get(sourceId), target = this.nodeIndex.get(targetId);
    if (!source || !target) return '找不到連線節點。';
    if (source.type === 'end') return '結束節點不能再連接下一步。';
    if (target.type === 'start') return '開始節點不能作為連線目標。';
    if (source.type === 'decision' && !['true', 'false'].includes(branch)) return '請選擇「是 True」或「否 False」出口。';
    if (source.type !== 'decision' && branch != null) return '只有判斷節點可以設定條件分支。';
    if (this.graph.edges.some((edge) => edge.source === sourceId && (edge.branch ?? null) === (branch ?? null))) return '這個出口已經有連線。請先選取並刪除原連線，再接到新目標。';
    return null;
  }
  connect(sourceId, targetId, branch = null) {
    const problem = this.connectionProblem(sourceId, targetId, branch);
    if (problem) { this.message(problem); return false; }
    this.remember(true);
    const edge = { id: uid('edge'), source: sourceId, target: targetId, branch };
    this.graph.edges.push(edge); this.cancelLink(); this.render(); this.changed(true, 'connect');
    this.message('已建立連線。'); return true;
  }
  beginLink(nodeId, branch, point) {
    const node = this.nodeIndex.get(nodeId);
    if (!node || node.type === 'end') return false;
    if (this.graph.edges.some((edge) => edge.source === nodeId && (edge.branch ?? null) === branch)) { this.message('這個出口已有連線。選取原連線後按 Delete 即可重新連接。'); return false; }
    this.cancelLink();
    this.pendingLink = { nodeId, branch };
    this.tempEdge = svgElement('path', { class: 'fc-temp-edge', 'marker-end': `url(#${this.activeMarkerId})` });
    this.overlayLayer.append(this.tempEdge);
    this.updateTempEdge(point || this.portPosition(node, 'out', branch));
    for (const [id, el] of this.nodeElements) el.classList.toggle('fc-connectable', !this.connectionProblem(nodeId, id, branch));
    const selector = `[data-port="out"][data-branch="${branch ?? ''}"]`;
    this.nodeElements.get(nodeId)?.querySelector(selector)?.classList.add('fc-port-active');
    this.message('點擊另一個節點的入口完成連線，或按 Esc 取消。');
    return true;
  }
  updateTempEdge(point) {
    if (!this.pendingLink || !this.tempEdge) return;
    const source = this.nodeIndex.get(this.pendingLink.nodeId);
    const start = this.portPosition(source, 'out', this.pendingLink.branch);
    const offset = Math.max(30,Math.min(100,Math.hypot(point.x-start.x,point.y-start.y)/2));
    this.tempEdge.setAttribute('d', `M ${start.x} ${start.y} C ${start.x+start.normal.x*offset} ${start.y+start.normal.y*offset},${point.x} ${point.y-20},${point.x} ${point.y}`);
  }
  cancelLink() {
    this.pendingLink = null; this.tempEdge?.remove(); this.tempEdge = null;
    for (const el of this.nodeElements.values()) { el.classList.remove('fc-connectable'); el.querySelector('.fc-port-active')?.classList.remove('fc-port-active'); }
  }
  pointerDown(event) {
    if (event.button !== 0 && event.button !== 1) return;
    if (this.gesture) return;
    this.stopReveal();
    const point = this.toWorld(event.clientX, event.clientY);
    const port = event.target.closest('.fc-port'), nodeEl = event.target.closest('.fc-node'), edgeEl = event.target.closest('.fc-edge');
    this.svg.focus({ preventScroll: true });
    if (this.pendingLink && event.button === 0 && !this.spaceDown && this.mode !== 'pan') {
      if (nodeEl && (!port || port.dataset.port === 'in')) {
        const { nodeId, branch } = this.pendingLink;
        this.connect(nodeId, nodeEl.dataset.nodeId, branch); event.preventDefault(); return;
      }
      if (!port) { this.cancelLink(); this.message('已取消連線。'); }
    }
    const common = { pointerId: event.pointerId, initialClient: { x: event.clientX, y: event.clientY }, moved: false };
    if (event.button === 1 || this.spaceDown || this.mode === 'pan') {
      this.gesture = { ...common, type: 'pan', origin: { ...this.graph.viewport } };
      this.svg.classList.add('fc-dragging');
    } else if (port) {
      event.preventDefault();
      if (port.dataset.port === 'out') {
        const branch = port.dataset.branch || null;
        if (this.beginLink(port.dataset.nodeId, branch, point)) this.gesture = { ...common, type: 'link' };
      } else this.message('請先從節點的出口開始連線；判斷節點請選擇 True 或 False。');
    } else if (nodeEl) {
      const id = nodeEl.dataset.nodeId;
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        if (this.selectedNodes.has(id)) this.selectedNodes.delete(id); else this.selectedNodes.add(id);
      } else if (!this.selectedNodes.has(id)) { this.selectedNodes = new Set([id]); this.selectedEdges.clear(); }
      this.selectionChanged();
      if (this.selectedNodes.has(id)) {
        const origins = new Map([...this.selectedNodes].map((selectedId) => [selectedId, { ...this.nodeIndex.get(selectedId).position }]));
        this.gesture = { ...common, type: 'nodes', origins, previous: this.getGraph(), zoom: this.graph.viewport.zoom };
        this.svg.classList.add('fc-dragging');
      }
    } else if (edgeEl) {
      const id = edgeEl.dataset.edgeId;
      if (!event.shiftKey && !event.metaKey && !event.ctrlKey) { this.selectedNodes.clear(); this.selectedEdges.clear(); }
      if (this.selectedEdges.has(id)) this.selectedEdges.delete(id); else this.selectedEdges.add(id);
      this.selectionChanged();
    } else {
      if (!event.shiftKey && !event.metaKey && !event.ctrlKey) this.clearSelection();
      const marquee = svgElement('rect', { class: 'fc-marquee', x: point.x, y: point.y, width: 0, height: 0 });
      this.overlayLayer.append(marquee);
      this.gesture = { ...common, type: 'marquee', start: point, marquee, previousNodes: new Set(this.selectedNodes) };
    }
    if (this.gesture) { event.preventDefault(); this.svg.setPointerCapture(event.pointerId); }
  }
  pointerMove(event) {
    const point = this.toWorld(event.clientX, event.clientY), gesture = this.gesture;
    if (this.pendingLink) this.updateTempEdge(point);
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    const dx = event.clientX - gesture.initialClient.x, dy = event.clientY - gesture.initialClient.y;
    if (Math.hypot(dx, dy) > 3) gesture.moved = true;
    if (!gesture.moved) return;
    if (gesture.type === 'pan') {
      this.graph.viewport.x = gesture.origin.x + dx; this.graph.viewport.y = gesture.origin.y + dy;
      this.updateViewport();
    } else if (gesture.type === 'nodes') {
      for (const [id, origin] of gesture.origins) {
        const node = this.nodeIndex.get(id);
        node.position.x = Math.round(origin.x + dx / gesture.zoom); node.position.y = Math.round(origin.y + dy / gesture.zoom);
        this.nodeElements.get(id).setAttribute('transform', `translate(${node.position.x},${node.position.y})`);
      }
      this.updateEdges();
    } else if (gesture.type === 'marquee') {
      const box = { x: Math.min(point.x, gesture.start.x), y: Math.min(point.y, gesture.start.y), width: Math.abs(point.x - gesture.start.x), height: Math.abs(point.y - gesture.start.y) };
      for (const [name, value] of Object.entries(box)) gesture.marquee.setAttribute(name, value);
      this.selectedNodes = new Set(gesture.previousNodes);
      for (const node of this.graph.nodes) {
        const def = TYPES[node.type] ?? TYPES.process;
        if (node.position.x + def.width >= box.x && node.position.x <= box.x + box.width && node.position.y + def.height >= box.y && node.position.y <= box.y + box.height) this.selectedNodes.add(node.id);
      }
      this.updateSelection();
    }
  }
  pointerUp(event) {
    const gesture = this.gesture;
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    this.gesture = null;
    this.svg.classList.remove('fc-dragging');
    if (this.svg.hasPointerCapture(event.pointerId)) this.svg.releasePointerCapture(event.pointerId);
    if (gesture.type === 'nodes' && gesture.moved) { this.remember(false, gesture.previous); this.changed(false, 'move-nodes'); }
    else if (gesture.type === 'pan' && gesture.moved) this.changed(false, 'pan');
    else if (gesture.type === 'marquee') { gesture.marquee.remove(); this.selectionChanged(); }
    else if (gesture.type === 'link' && gesture.moved && this.pendingLink) {
      const hit = document.elementFromPoint(event.clientX, event.clientY), target = hit?.closest('.fc-node');
      if (target && this.svg.contains(target)) {
        const { nodeId, branch } = this.pendingLink;
        if (!this.connect(nodeId, target.dataset.nodeId, branch)) this.cancelLink();
      } else { this.cancelLink(); this.message('未連到節點。請從出口拉到另一個節點的入口。'); }
    }
  }
  pointerCancel(event) {
    const gesture = this.gesture;
    if (!gesture || (event && gesture.pointerId !== event.pointerId)) return;
    this.gesture = null;
    if (this.svg.hasPointerCapture(gesture.pointerId)) this.svg.releasePointerCapture(gesture.pointerId);
    this.svg.classList.remove('fc-dragging');
    gesture.marquee?.remove();
    if (gesture.type === 'nodes' && gesture.moved) {
      for (const [id, origin] of gesture.origins) { const node = this.nodeIndex.get(id); if (node) node.position = origin; }
      this.render();
    } else if (gesture.type === 'pan') { this.graph.viewport = gesture.origin; this.updateViewport(); }
    if (gesture.type === 'link') this.cancelLink();
  }
  keyDown(event) {
    if (editable(event.target)) return;
    const command = event.ctrlKey || event.metaKey, key = event.key.toLowerCase();
    if (event.code === 'Space' && !command) { event.preventDefault(); this.spaceDown = true; this.updateCursor(); return; }
    if (key === 'escape') { event.preventDefault(); this.pointerCancel(); this.cancelLink(); this.clearSelection(); return; }
    if (command && key === 'a') { event.preventDefault(); this.selectedNodes = new Set(this.graph.nodes.map((node) => node.id)); this.selectedEdges.clear(); this.selectionChanged(); return; }
    if (command && key === 'c') { event.preventDefault(); this.copySelection(); return; }
    if (command && key === 'v') { event.preventDefault(); this.paste(); return; }
    if (command && key === 'z') { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); return; }
    if (command && key === 'y') { event.preventDefault(); this.redo(); return; }
    if (key === 'delete' || key === 'backspace') { event.preventDefault(); this.deleteSelection(); return; }
    if (key === '+' || key === '=') { event.preventDefault(); this.zoomBy(1.15); return; }
    if (key === '-') { event.preventDefault(); this.zoomBy(1 / 1.15); return; }
    if (key === '0') { event.preventDefault(); this.fit(); return; }
    if (key === 'enter') {
      const port = event.target.closest('.fc-port'), node = event.target.closest('.fc-node');
      if (port) {
        event.preventDefault();
        if (port.dataset.port === 'out') this.beginLink(port.dataset.nodeId, port.dataset.branch || null);
        else if (this.pendingLink) { const { nodeId, branch } = this.pendingLink; this.connect(nodeId, port.dataset.nodeId, branch); }
        else this.message('請先選擇上一步節點的出口，再連到此入口。');
      } else if (node) { event.preventDefault(); this.selectNode(node.dataset.nodeId); this.callbacks.onEdit?.(node.dataset.nodeId); }
      else if (this.selection.nodeId) { event.preventDefault(); this.callbacks.onEdit?.(this.selection.nodeId); }
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key) && this.selectedNodes.size) {
      event.preventDefault(); this.remember(false);
      const amount = event.shiftKey ? 20 : 5, dx = key === 'arrowleft' ? -amount : key === 'arrowright' ? amount : 0, dy = key === 'arrowup' ? -amount : key === 'arrowdown' ? amount : 0;
      for (const id of this.selectedNodes) {
        const node = this.nodeIndex.get(id); node.position.x += dx; node.position.y += dy;
        this.nodeElements.get(id).setAttribute('transform', `translate(${node.position.x},${node.position.y})`);
      }
      this.updateEdges(); this.changed(false, 'nudge-nodes');
    }
  }
  destroy() {
    this.destroyed = true; clearTimeout(this.layoutTimer); this.stopReveal(); this.pointerCancel();
    this.resizeObserver.disconnect();
    for (const [target, event, handler, options] of this.listeners) target.removeEventListener(event, handler, options);
    this.svg.remove();
  }
}

function truncate(text, maxUnits) {
  const chars = Array.from(String(text || '')), result = [];
  let units = 0;
  for (const char of chars) { units += /[\u2e80-\uffef]/u.test(char) ? 1.65 : 1; if (units > maxUnits) return `${result.join('')}…`; result.push(char); }
  return result.join('');
}
