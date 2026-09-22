/* Genuine Scratch 3 blocks and VM, kept in an iframe to avoid Blockly globals. */
(() => {
  'use strict';
  const CHANNEL = 'skilllab-editor';
  const origin = location.origin;
  const status = document.getElementById('status');
  const targetSelect = document.getElementById('target');
  const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"></svg>';
  // MD5 of SVG, used by Scratch's standard asset naming convention.
  const ASSET = '0ac33de9d7138a386563727540d10055';
  let workspace;
  let vm;
  let assets = {};
  let loading = false;
  let disabled = false;
  let activeRun = null;
  let queue = Promise.resolve();

  function post(message) {
    if (window.parent !== window) window.parent.postMessage({channel: CHANNEL, ...message}, origin === 'null' ? '*' : origin);
  }
  function say(message, error = false) {
    status.textContent = message;
    status.classList.toggle('error', error);
  }
  function costume() {
    return {name: '空白', assetId: ASSET, md5ext: ASSET + '.svg', dataFormat: 'svg', bitmapResolution: 1, rotationCenterX: 240, rotationCenterY: 180};
  }
  function blank() {
    return {
      targets: [{isStage: true, name: 'Stage', variables: {'skilllab-variable': ['變數', 0]}, lists: {'skilllab-list': ['清單', []]}, broadcasts: {'skilllab-message': '訊息1'}, blocks: {
        'skilllab-start': {opcode: 'event_whenflagclicked', next: null, parent: null, inputs: {}, fields: {}, shadow: false, topLevel: true, x: 45, y: 45}
      }, comments: {}, currentCostume: 0, costumes: [costume()], sounds: [], volume: 100, layerOrder: 0, tempo: 60, videoTransparency: 50, videoState: 'off', textToSpeechLanguage: null}],
      monitors: [], extensions: [], meta: {semver: '3.0.0', vm: '5.0.300', agent: 'SkillLab'}
    };
  }
  function textInput(name, value = '') {
    return '<value name="' + name + '"><shadow type="text"><field name="TEXT">' + value + '</field></shadow></value>';
  }
  function numberInput(name, value = 1) {
    return '<value name="' + name + '"><shadow type="math_number"><field name="NUM">' + value + '</field></shadow></value>';
  }
  function block(type, content = '') { return '<block type="' + type + '">' + content + '</block>'; }
  function toolbox() {
    const xml = '<xml>' +
      '<category name="外觀" id="looks" colour="#9966ff">' +
      block('looks_say', textInput('MESSAGE', 'Hello, World!')) +
      block('looks_sayforsecs', textInput('MESSAGE', 'Hello!') + numberInput('SECS', 2)) +
      block('looks_think', textInput('MESSAGE', '嗯……')) +
      block('looks_thinkforsecs', textInput('MESSAGE', '嗯……') + numberInput('SECS', 2)) + '</category>' +
      '<category name="事件" id="event" colour="#ffbf00">' +
      block('event_whenflagclicked') +
      block('event_broadcast', '<value name="BROADCAST_INPUT"><shadow type="event_broadcast_menu"><field name="BROADCAST_OPTION" variabletype="broadcast_msg" id="skilllab-message">訊息1</field></shadow></value>') +
      block('event_broadcastandwait', '<value name="BROADCAST_INPUT"><shadow type="event_broadcast_menu"><field name="BROADCAST_OPTION" variabletype="broadcast_msg" id="skilllab-message">訊息1</field></shadow></value>') +
      block('event_whenbroadcastreceived', '<field name="BROADCAST_OPTION" variabletype="broadcast_msg" id="skilllab-message">訊息1</field>') + '</category>' +
      '<category name="控制" id="control" colour="#ffab19">' +
      block('control_repeat', numberInput('TIMES', 10)) + block('control_if') + block('control_if_else') +
      block('control_repeat_until') + block('control_forever') + block('control_stop') + '</category>' +
      '<category name="偵測" id="sensing" colour="#5cb1d6">' +
      block('sensing_askandwait', textInput('QUESTION', '請輸入資料')) +
      block('sensing_answer') + block('sensing_timer') + block('sensing_resettimer') + '</category>' +
      '<category name="運算" id="operators" colour="#59c059">' +
      ['add', 'subtract', 'multiply', 'divide', 'mod'].map(op => block('operator_' + op, numberInput('NUM1') + numberInput('NUM2'))).join('') +
      ['lt', 'equals', 'gt'].map(op => block('operator_' + op, textInput('OPERAND1') + textInput('OPERAND2'))).join('') +
      block('operator_and') + block('operator_or') + block('operator_not') +
      block('operator_join', textInput('STRING1') + textInput('STRING2')) +
      block('operator_letter_of', numberInput('LETTER') + textInput('STRING')) +
      block('operator_length', textInput('STRING')) + block('operator_contains', textInput('STRING1') + textInput('STRING2')) +
      block('operator_round', numberInput('NUM')) + block('operator_mathop', numberInput('NUM')) +
      block('operator_random', numberInput('FROM', 1) + numberInput('TO', 10)) + '</category>' +
      '<category name="變數" id="data" colour="#ff8c1a" custom="VARIABLE"></category>' +
      '<category name="函式積木" id="procedures" colour="#ff6680" custom="PROCEDURE"></category></xml>';
    // Scratch's category implementation requires both colours (unlike Blockly).
    return xml.replace(/colour="(#[a-f0-9]+)"/gi, 'colour="$1" secondaryColour="$1"');
  }

  // Use an in-page dialog: window.prompt is blocked by a sandboxed iframe.
  function promptText(message, initial, callback, confirmation = false) {
    const dialog = document.createElement('dialog');
    dialog.style.cssText = 'border:1px solid #ddd;border-radius:12px;max-width:90%;padding:20px;color:#292438';
    const form = document.createElement('form');
    form.method = 'dialog';
    const label = document.createElement('label');
    label.textContent = message;
    label.style.cssText = 'display:block;white-space:pre-line;font-size:14px;line-height:1.7';
    const input = document.createElement('input');
    input.value = initial || '';
    input.style.cssText = 'display:block;width:100%;margin:12px 0;padding:8px';
    input.maxLength = 120;
    input.hidden = confirmation;
    label.append(input);
    const cancel = document.createElement('button');
    cancel.textContent = '取消'; cancel.type = 'submit'; cancel.value = 'cancel'; cancel.style.marginRight = '8px';
    const ok = document.createElement('button');
    ok.textContent = '確定'; ok.type = 'submit'; ok.value = 'ok';
    form.append(label, cancel, ok); dialog.append(form); document.body.append(dialog);
    dialog.addEventListener('close', () => {
      const accepted = dialog.returnValue === 'ok';
      dialog.remove();
      callback(confirmation ? accepted : accepted ? input.value : null);
    }, {once: true});
    dialog.showModal();
    if (!confirmation) { input.focus(); input.select(); }
  }

  function flush() {
    if (Blockly.Events.fireNow_) Blockly.Events.fireNow_();
  }
  function serialize() {
    return {project: JSON.parse(vm.toJSON()), assets: {...assets}};
  }
  function snapshot() {
    flush();
    const state = serialize();
    post({event: 'change', state});
    return state;
  }
  function changed() {
    if (loading) return;
    // Blockly delivers a group of changes on its next event tick. Persist each
    // delivered change immediately, without recursively draining that queue.
    try { post({event: 'change', state: serialize()}); }
    catch (error) { say('儲存積木失敗：' + error.message, true); }
  }
  function targetOptions() {
    targetSelect.replaceChildren();
    for (const target of vm.runtime.targets.filter(item => item.isOriginal)) {
      const option = document.createElement('option');
      option.value = target.id;
      option.textContent = (target.isStage ? '舞台：' : '角色：') + target.getName();
      targetSelect.append(option);
    }
    if (vm.editingTarget) targetSelect.value = vm.editingTarget.id;
  }
  function renderWorkspace(event) {
    const previous = loading;
    loading = true;
    Blockly.Events.disable();
    try {
      workspace.clear();
      Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(event.xml), workspace);
      workspace.clearUndo();
    } finally {
      Blockly.Events.enable();
      loading = previous;
    }
    Blockly.svgResize(workspace);
  }
  async function load(state) {
    flush();
    loading = true;
    if (state != null && (!state || typeof state !== 'object' || !state.project)) throw new Error('Scratch 草稿格式錯誤，已保留原始草稿。');
    const data = state == null ? blank() : state.project;
    if (!Array.isArray(data.targets) || !data.targets.length) throw new Error('Scratch 專案必須包含舞台。');
    if ((data.extensions || []).length) throw new Error('此文字編輯器尚不支援含擴充套件的 .sb3。');
    if (data.targets.length > 100) throw new Error('專案角色過多，請匯入文字題目的程式。');
    let count = 0;
    for (const target of data.targets) {
      for (const definition of Object.values(target.blocks || {})) {
        if (++count > 10000) throw new Error('專案超過 10,000 個積木。');
        if (!Array.isArray(definition) && !Blockly.Blocks[definition.opcode]) throw new Error('編輯器不支援此積木：' + definition.opcode);
      }
    }
    try {
      vm.stopAll();
      await vm.loadProject(data);
      assets = state && state.assets ? {...state.assets} : {};
      if (!Object.hasOwn(assets, ASSET + '.svg')) assets[ASSET + '.svg'] = btoa(SVG);
      targetOptions();
      say('Scratch 已就緒');
      Blockly.svgResize(workspace);
    } finally { loading = false; }
  }

  async function run(params) {
    if (activeRun) throw new Error('Scratch 正在執行，請稍候。');
    return new Promise(resolve => {
      const worker = new Worker(new URL('scratch-runner-worker.js', location.href));
      const limit = Math.max(100, Math.min(30000, Number(params.timeLimit) || 5000));
      let timeout;
      let finished = false;
      activeRun = worker;
      const finish = result => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        worker.terminate();
        activeRun = null;
        resolve(result);
      };
      timeout = setTimeout(() => finish({output: '', errout: 'Scratch 執行環境載入逾時，請檢查網路後重試。', elapsed: 0}), 45000);
      worker.onerror = event => finish({output: '', errout: 'Scratch 執行環境錯誤：' + (event.message || '無法啟動 Worker'), elapsed: 0});
      worker.onmessage = event => {
        if (event.data.event === 'ready') {
          worker.postMessage({project: params.project, input: params.input || '', timeLimit: limit});
        } else if (event.data.event === 'started') {
          clearTimeout(timeout);
          timeout = setTimeout(() => finish({output: '', errout: 'TLE：執行逾時，請檢查是否有無窮迴圈。', elapsed: limit}), limit + 250);
        } else if (typeof event.data.output === 'string') finish(event.data);
      };
    });
  }

  function setDisabled(value) {
    disabled = Boolean(value);
    document.body.classList.toggle('busy', disabled);
    document.querySelectorAll('.tools button,.tools select').forEach(element => { element.disabled = disabled; });
    return true;
  }

  async function encodeSb3() {
    const state = snapshot();
    const zip = new JSZip();
    zip.file('project.json', JSON.stringify(state.project));
    for (const [name, data] of Object.entries(state.assets)) {
      if (/^[a-f0-9]{32}\.[a-z0-9]+$/i.test(name)) zip.file(name, data, {base64: true});
    }
    return zip.generateAsync({type: 'arraybuffer', compression: 'DEFLATE'});
  }

  async function decodeSb3(buffer) {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength > 10 * 1024 * 1024) throw new Error('請匯入 10 MB 以下的 Scratch 文字程式。');
    const zip = await JSZip.loadAsync(buffer);
    const jsonFile = zip.file('project.json');
    if (!jsonFile) throw new Error('.sb3 檔案缺少 project.json。');
    const jsonText = await jsonFile.async('string');
    if (jsonText.length > 5 * 1024 * 1024) throw new Error('Scratch 程式資料過大。');
    const state = {project: JSON.parse(jsonText), assets: {}};
    let total = 0;
    for (const [name, entry] of Object.entries(zip.files)) {
      if (entry.dir || name === 'project.json') continue;
      if (!/^[a-f0-9]{32}\.[a-z0-9]+$/i.test(name)) continue;
      const data = await entry.async('base64');
      total += data.length;
      if (total > 12 * 1024 * 1024) throw new Error('解壓縮後的素材過大，請減少造型與音效。');
      state.assets[name] = data;
    }
    return state;
  }

  async function importState(state) {
    const backup = snapshot();
    try {
      await load(state);
      changed();
      return true;
    } catch (error) {
      await load(backup).catch(() => {});
      throw error;
    }
  }

  const methods = {
    async init(params) { await load(params.state); return true; },
    snapshot,
    async reset() { await load(null); changed(); return true; },
    disabled(params) { return setDisabled(params.value); },
    run,
    exportSb3: encodeSb3,
    async importSb3(params) { return importState(await decodeSb3(params.data)); }
  };
  window.addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== origin) return;
    const data = event.data;
    if (!data || data.channel !== CHANNEL || !Object.hasOwn(data, 'id')) return;
    const method = Object.hasOwn(methods, data.method) && methods[data.method];
    if (!method) { post({id: data.id, error: '未知的 Scratch 編輯器操作。'}); return; }
    queue = queue.then(async () => {
      try { post({id: data.id, result: await method(data.params || {})}); }
      catch (error) { loading = false; say(error.message || String(error), true); post({id: data.id, error: error.message || String(error)}); }
    });
  });

  async function boot() {
    if (!window.Blockly || !window.VirtualMachine || !window.JSZip) throw new Error('Scratch 載入失敗，請檢查網路並重新切換語言。');
    Blockly.ScratchMsgs.setLocale('zh-tw');
    Blockly.prompt = (message, value, callback) => promptText(message, value, callback);
    Blockly.confirm = (message, callback) => promptText(message, '', callback, true);
    Blockly.Procedures.externalProcedureDefCallback = (mutation, callback) => {
      promptText('自訂積木名稱（%s 為文字／數字參數，%b 為布林參數）', mutation.getAttribute('proccode') || '我的積木', name => {
        if (!name || !name.trim()) return callback(null);
        const types = name.match(/%[sb]/g) || [];
        const oldIds = JSON.parse(mutation.getAttribute('argumentids') || '[]');
        const oldNames = JSON.parse(mutation.getAttribute('argumentnames') || '[]');
        mutation.setAttribute('proccode', name.trim());
        mutation.setAttribute('argumentids', JSON.stringify(types.map((_, i) => oldIds[i] || 'arg-' + Date.now() + '-' + i)));
        mutation.setAttribute('argumentnames', JSON.stringify(types.map((_, i) => oldNames[i] || '參數' + (i + 1))));
        mutation.setAttribute('argumentdefaults', JSON.stringify(types.map(type => type === '%b' ? 'false' : '')));
        mutation.setAttribute('warp', mutation.getAttribute('warp') || 'false');
        callback(mutation);
      });
    };
    workspace = Blockly.inject('workspace', {
      toolbox: toolbox(), media: 'https://cdn.jsdelivr.net/npm/scratch-blocks@1.3.0/media/',
      sounds: false, comments: true, scrollbars: true, trashcan: true,
      zoom: {controls: true, wheel: true, startScale: 0.8, maxScale: 2, minScale: 0.3, scaleSpeed: 1.2},
      grid: {spacing: 20, length: 2, colour: '#ddd6eb', snap: false}
    });
    vm = new VirtualMachine();
    vm.on('workspaceUpdate', renderWorkspace);
    workspace.addChangeListener(event => {
      if (loading || event.isUiEvent || event.type === 'ui') return;
      // A block click normally starts a Scratch script. This editor is only a
      // model; all actual execution is done by the judge worker.
      vm.blockListener(event);
      if (event.type.startsWith('var_')) vm.variableListener(event);
      changed();
    });
    if (workspace.getFlyout()) workspace.getFlyout().getWorkspace().addChangeListener(vm.flyoutBlockListener);
    targetSelect.addEventListener('change', () => { flush(); vm.setEditingTarget(targetSelect.value); changed(); });
    document.getElementById('variable').onclick = () => Blockly.Variables.createVariable(workspace, null, '');
    document.getElementById('list').onclick = () => Blockly.Variables.createVariable(workspace, null, Blockly.LIST_VARIABLE_TYPE);
    document.getElementById('toggle-palette').onclick = event => {
      const flyout = workspace.getFlyout();
      const visible = !flyout.isVisible();
      flyout.setVisible(visible);
      event.currentTarget.textContent = visible ? '收合積木選單' : '展開積木選單';
      event.currentTarget.setAttribute('aria-expanded', String(visible));
      Blockly.svgResize(workspace);
      if (!visible) {
        const first = workspace.getTopBlocks(true)[0];
        if (first) requestAnimationFrame(() => {
          const bounds = first.getSvgRoot().getBoundingClientRect();
          const area = workspace.getParentSvg().getBoundingClientRect();
          const metrics = workspace.getMetrics();
          const center = area.left + (area.width + workspace.getToolbox().getWidth()) / 2;
          workspace.scrollbar.set(
            metrics.viewLeft - metrics.contentLeft + bounds.left + bounds.width / 2 - center,
            metrics.viewTop - metrics.contentTop
          );
        });
      }
    };
    document.getElementById('import').onclick = () => document.getElementById('file').click();
    document.getElementById('file').onchange = async event => {
      const file = event.target.files[0];
      event.target.value = '';
      if (!file || disabled) return;
      setDisabled(true);
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error('請匯入 10 MB 以下的 Scratch 文字程式。');
        let state;
        if (/\.json$/i.test(file.name)) state = {project: JSON.parse(await file.text()), assets: {}};
        else state = await decodeSb3(await file.arrayBuffer());
        await importState(state);
        say('已匯入 ' + file.name);
      } catch (error) {
        say('匯入失敗：' + (error.message || String(error)), true);
      } finally { setDisabled(false); }
    };
    document.getElementById('export').onclick = async () => {
      try {
        const url = URL.createObjectURL(new Blob([await encodeSb3()], {type: 'application/x.scratch.sb3'}));
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = 'thinklab-scratch.sb3'; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { say('下載失敗：' + error.message, true); }
    };
    new ResizeObserver(() => Blockly.svgResize(workspace)).observe(document.getElementById('workspace'));
    await load(null);
    post({event: 'ready'});
  }
  boot().catch(error => { console.error(error); say(error.message || String(error), true); post({event: 'error', error: error.message || String(error)}); });
})();
