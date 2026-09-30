import {normalizeGraph, validateGraph, formatValue, DEFAULT_LIMITS} from './flow-core.mjs';
import {FlowCanvas} from './flow-canvas.mjs';
import {EXAMPLES} from './examples.mjs';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'skilllab_flowlab_draft_v1';
const BACKUP_KEY = 'skilllab_flowlab_recovery_v1';
const labels = {start:'開始', end:'結束', input:'輸入', output:'輸出', process:'處理', decision:'判斷'};
const types = {integer:'整數',number:'數字',text:'文字',boolean:'布林值'};
const clone = value => structuredClone(value);
const emptyGraph = () => ({version:1,title:'未命名流程圖',nodes:[],edges:[],viewport:{x:0,y:0,zoom:1}});
let worker = null, generation = 0, watchdog = null;
let trace = [], cursor = 0, engineStatus = 'idle', playing = false, waiting = null, runError = null;
let lastFrame = 0, pendingSteps = 0, pendingSeek = null, validationTimer = null, saveTimer = null, toastTimer = null;
let selectedId = null, selected = {nodeIds:[],edgeIds:[]}, lastStateKey = '', lastTraceWindow = '', lastHistoryKey = '';
let suppressChange = false, persisted = true, initialLoad = true, inputEditIndex = null, validation = {errors:[],warnings:[]};

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function toast(message, duration=3500) {
  $('toast').textContent = message; $('toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; },duration);
}
function showTab(name) {
  for (const tab of ['observe','properties']) {
    const active = tab === name;
    $(tab+'-tab').classList.toggle('active',active);
    $(tab+'-tab').setAttribute('aria-selected',String(active));
    $(tab+'-tab').tabIndex = active ? 0 : -1;
    $(tab+'-panel').hidden = !active;
  }
}

const canvas = new FlowCanvas($('canvas'), {
  onChange(graph, meta={}) {
    if (suppressChange) return;
    if (meta.semantic) { invalidate('流程已修改，請重新執行。'); scheduleValidation(); }
    if (!meta.semantic && meta.reason==='edit-node') {lastStateKey='';lastTraceWindow='';renderPlayback();}
    $('graph-title').value = graph.title;
    updateCanvasMeta(); scheduleSave();
    if (selectedId && !graph.nodes.some(n=>n.id===selectedId)) { selectedId=null; renderProperties(); }
  },
  onSelect(selection) {
    selected = selection;
    selectedId = selection.nodeIds?.length === 1 ? selection.nodeIds[0] : null;
    renderProperties();
    if ((selection.nodeIds?.length || 0) + (selection.edgeIds?.length || 0) > 0) showTab('properties');
  },
  onEdit(nodeId) { selectedId = nodeId; showTab('properties'); renderProperties(); (['input'].includes(getNode(nodeId)?.type) ? $('node-variable') : $('node-expression')).focus(); },
  onMessage: message => toast(message),
});
function getNode(id) { return canvas.getNode(id); }
function updateCanvasMeta() {
  const graph = canvas.getGraph();
  $('node-count').textContent = `${graph.nodes.length} 個節點`;
  $('zoom-label').textContent = Math.round(graph.viewport.zoom*100)+'%';
  $('undo-btn').disabled = !canvas.canUndo; $('redo-btn').disabled = !canvas.canRedo;
}
function scheduleSave() {
  persisted = false; $('save-status').textContent = '保存中…';
  clearTimeout(saveTimer); saveTimer = setTimeout(()=>saveDraft(),500);
}
function saveDraft(announce=false) {
  clearTimeout(saveTimer);
  if (!announce && persisted) return true;
  try {
    const payload = {version:1,graph:canvas.getGraph(),input:$('input-data').value,exampleId:$('example-select').value,savedAt:Date.now()};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(payload));
    persisted = true; $('save-status').textContent = '已自動保存於此瀏覽器';
    if (announce) toast('作品已保存於此瀏覽器。下次開啟會從空白開始，請匯出 JSON 以便繼續編輯。');
    return true;
  } catch {
    persisted = false; $('save-status').textContent = '保存失敗，請匯出備份';
    if (announce) toast('瀏覽器無法保存作品，請使用「匯出 JSON」備份。',6000);
    return false;
  }
}
function scheduleValidation() { clearTimeout(validationTimer); validationTimer = setTimeout(()=>validate(),220); }
function validate(announce=false) {
  clearTimeout(validationTimer); validation = validateGraph(canvas.getGraph());
  canvas.setValidation(validation);
  const {errors,warnings} = validation;
  $('validate-btn').textContent = errors.length ? `${errors.length} 個問題` : warnings.length ? `${warnings.length} 個提醒` : '✓ 流程就緒';
  $('validate-btn').classList.toggle('has-errors',!!errors.length);
  $('validate-btn').classList.toggle('is-valid',!errors.length);
  $('diagnostics-section').hidden = !errors.length && !warnings.length;
  $('diagnostics-count').textContent = `${errors.length} 錯誤 · ${warnings.length} 提醒`;
  $('diagnostics').replaceChildren();
  for (const [list,severity] of [[errors,'error'],[warnings,'warning']]) for (const issue of list) {
    const button = element('button','diagnostic '+severity,issue.message);
    button.type = 'button';
    const node = issue.nodeId && getNode(issue.nodeId);
    if (node) { button.append(element('small','',node.title || labels[node.type])); button.onclick=()=>{canvas.selectNode(node.id);}; }
    $('diagnostics').append(button);
  }
  if (announce) toast(errors.length ? `有 ${errors.length} 個問題需要修正，請查看節點上的標示。` : warnings.length ? '可以執行，另有提醒可在側邊查看。' : '流程結構與運算式檢查通過，可以執行。');
  return validation;
}
function killWorker() { clearTimeout(watchdog); if (worker) {worker.terminate();worker=null;} }
function resetWatchdog() {
  clearTimeout(watchdog);
  // This is an emergency responsiveness deadline, not the interpreter's CPU budget.
  if (engineStatus==='computing') watchdog=setTimeout(()=>{
    killWorker(); engineStatus='error';runError={message:'執行未能及時回應，已安全中止。請檢查迴圈。',code:'WORKER_TIMEOUT'};
    waiting=null;renderPlayback();toast(runError.message,6000);
  },8000);
}
function invalidate(message) {
  const hadTrace = trace.length>0 || engineStatus!=='idle';
  generation++;killWorker();trace=[];cursor=0;playing=false;waiting=null;runError=null;
  engineStatus='idle';pendingSteps=0;pendingSeek=null;lastStateKey='';lastHistoryKey='';lastTraceWindow='';
  $('input-error').textContent='';renderPlayback();
  if (hadTrace && message) toast(message);
}
function parseInputs(text) {
  if (text === '') return [];
  const lines=text.replace(/\r\n?/g,'\n').split('\n');
  if (lines.at(-1)==='') lines.pop();
  return lines;
}
function begin({play=true,inputs=null,seek=null,oneStep=false}={}) {
  if (location.protocol==='file:') {toast('請透過本機 HTTP 伺服器開啟此頁，讓 Worker 正常執行。',6000);return;}
  if (validate().errors.length) {toast('先修正標示的節點或連線，再執行流程。');return;}
  invalidate();showTab('observe');
  const runId=++generation;engineStatus='computing';playing=play;pendingSeek=seek;pendingSteps=oneStep?1:0;
  lastFrame=performance.now();
  try {
    worker=new Worker(new URL('./flow-worker.js',import.meta.url),{type:'module'});
    worker.onmessage=({data})=>{
      if (data.runId!==generation) return;
      if (data.type==='events') {
        trace.push(...data.events);
        if (pendingSeek!==null) {cursor=Math.min(pendingSeek,trace.length);if(cursor===pendingSeek)pendingSeek=null;}
        if (pendingSteps) {const amount=Math.min(pendingSteps,trace.length-cursor);cursor+=amount;pendingSteps-=amount;}
        resetWatchdog();
      } else if (data.type==='waiting') {
        engineStatus='waiting';waiting=data.waiting;clearTimeout(watchdog);
        $('input-value').disabled=false;$('input-form').querySelector('button').disabled=false;
      } else if (data.type==='input-error') {
        $('input-error').textContent=data.error?.message || '輸入格式不正確，請再試一次。';
        $('input-value').disabled=false;$('input-form').querySelector('button').disabled=false;
        toast($('input-error').textContent);
      } else if (data.type==='done') {
        engineStatus=data.status;runError=data.error || null;waiting=null;pendingSteps=0;pendingSeek=null;killWorker();
        if (runError) {playing=false;toast(runError.message,6500);}
      }
      renderPlayback();
    };
    worker.onerror=event=>{if(runId!==generation)return;event.preventDefault();killWorker();engineStatus='error';runError={message:'執行環境載入失敗。請重新執行，並確認透過 HTTP 開啟頁面。'};waiting=null;renderPlayback();toast(runError.message,6000);};
    worker.postMessage({type:'start',runId,graph:canvas.getGraph(),inputs:inputs??parseInputs($('input-data').value),limits:DEFAULT_LIMITS});
    resetWatchdog();renderPlayback();
  } catch(error) {killWorker();engineStatus='error';playing=false;runError={message:error.message};renderPlayback();toast(error.message);}
}
function seekTo(value) {playing=false;pendingSteps=0;cursor=Math.max(0,Math.min(trace.length,Number(value)||0));lastFrame=performance.now();renderPlayback();}
function statusInfo() {
  if (engineStatus==='idle') return ['idle','準備就緒'];
  if (waiting && cursor===trace.length) return ['waiting','等待輸入'];
  if (cursor<trace.length) return playing ? ['playing','播放中'] : ['paused','已暫停 · 可逐步觀察'];
  if (engineStatus==='computing') return ['playing',playing?'正在計算…':'已暫停 · 背景計算中'];
  if (engineStatus==='error') return ['error',runError?.message || '執行發生錯誤'];
  if (engineStatus==='stopped') return ['stopped','已停止 · 保留執行紀錄'];
  if (engineStatus==='completed') return ['completed','執行完成'];
  return ['paused','已暫停'];
}
function renderPlayback() {
  const atEnd=cursor===trace.length;
  if (atEnd && ['completed','error','stopped'].includes(engineStatus)) playing=false;
  const [status,message]=statusInfo();
  $('runtime-status').dataset.state=status;
  $('runtime-status').replaceChildren(element('i','status-dot'),document.createTextNode(message));
  $('runtime-status').title=message;
  const knownTotal=['completed','error','stopped','idle'].includes(engineStatus);
  $('step-label').textContent=`第 ${cursor} / ${knownTotal?trace.length:'…'} 步`;
  $('timeline').max=String(trace.length);$('timeline').value=String(cursor);$('timeline').disabled=!trace.length;
  $('trace-count').textContent=`${trace.length} 步`;
  $('runtime-error-card').hidden=!runError;
  $('runtime-error-message').textContent=runError?.message||'';
  $('pause-btn').textContent=playing?'暫停':'繼續';
  $('pause-btn').disabled=engineStatus==='idle' || (atEnd && !['computing','waiting'].includes(engineStatus));
  $('step-back-btn').disabled=cursor===0;
  $('step-next-btn').disabled=atEnd && ['completed','error','stopped'].includes(engineStatus);
  $('stop-btn').disabled=engineStatus==='idle'||(engineStatus==='stopped')||(!worker&&!playing);
  $('waiting-card').hidden=!(waiting&&atEnd);
  if (waiting&&atEnd) {
    $('waiting-prompt').textContent=waiting.prompt || `請輸入 ${waiting.variable}`;
    $('input-label').textContent=`${waiting.variable} · ${types[waiting.inputType] || waiting.inputType}`;
  }
  const key=[generation,cursor,trace.length,status,runError?.message||''].join('|');
  if (lastStateKey!==key) {
    const event=trace[cursor-1];
    const visited=trace.slice(0,cursor);
    canvas.setExecution({currentNodeId:waiting&&atEnd?waiting.nodeId:runError&&atEnd?runError.nodeId||event?.nodeId:event?.nodeId || null,nextNodeId:runError&&atEnd?null:event?.nextNodeId || null,visitedNodeIds:[...new Set(visited.map(e=>e.nodeId))],visitedEdgeIds:[...new Set(visited.map(e=>e.edgeId).filter(Boolean))],activeEdgeId:runError&&atEnd?null:event?.edgeId||null,status});
    renderVariables(event);
    renderEvent(event,status);
    renderOutput(visited);
    renderInputHistory(visited);
    renderTraceHistory();
    lastStateKey=key;
  }
}
function renderVariables(event) {
  const after=event?.variablesAfter||{},before=event?.variablesBefore||{};
  const rows=[];
  for(const [name,value] of Object.entries(after)) {
    const changed=!Object.hasOwn(before,name)||!Object.is(before[name],value);
    const row=element('tr',changed?'changed':'');
    const nameCell=element('td','',name);
    nameCell.append(element('small','',typeof value==='string'?'文字':typeof value==='boolean'?'布林':Number.isInteger(value)?'整數':'小數'));
    const valueCell=element('td','',displayValue(value));valueCell.title=displayValue(value);
    row.append(nameCell,valueCell,element('td','',Object.hasOwn(before,name)?displayValue(before[name]):'—'));
    rows.push(row);
  }
  $('variables-body').replaceChildren(...rows);
  $('variables-empty').hidden=!!rows.length;$('variable-count').textContent=rows.length+' 個';
}
function displayValue(value) {return typeof value==='string'?JSON.stringify(value):formatValue(value);}
function renderEvent(event,status) {
  $('event-type').textContent=event?labels[event.type]||event.type:'尚未開始';
  const card=$('condition-content');card.replaceChildren();
  if (runError && cursor===trace.length) {card.textContent=runError.message;return;}
  if (waiting&&cursor===trace.length) {card.append(document.createTextNode(`流程走到輸入節點，等待 ${waiting.variable} 的值。`));return;}
  if (!event) {card.textContent=status==='error'?(runError?.message||'無法執行。'):'先猜猜看，流程會走向哪裡？';return;}
  if (event.error) {card.textContent=event.error.message;return;}
  if (event.expression) card.append(element('code','',event.expression));
  if (event.type==='decision') card.append(element('strong',event.result?'':'false-result',`${event.result?'True · 條件成立':'False · 條件不成立'} → ${getNode(event.nextNodeId)?.title||'下一個節點'}`));
  else if (event.type==='process') card.append(document.createTextNode(`完成指定，結果是 ${displayValue(event.result)}。`));
  else if (event.type==='input') card.append(document.createTextNode(`${event.input?.variable} 取得 ${displayValue(event.input?.value)}。`));
  else if (event.type==='output') card.append(document.createTextNode('將結果輸出為一行文字。'));
  else card.append(document.createTextNode(event.type==='start'?'從這裡開始，沿著箭頭探索流程。':'已抵達結束節點。'));
}
function renderOutput(visited) {
  const outputEvents=visited.filter(e=>Object.hasOwn(e,'output'));
  const text=outputEvents.map(e=>e.output+'\n').join('');
  if ($('output-content').textContent!==text) $('output-content').textContent=text;
  $('output-count').textContent=(text?text.split('\n').length-1:0)+' 行';$('output-empty').hidden=!!outputEvents.length;
}
function renderInputHistory(visited) {
  const inputs=visited.filter(e=>e.input);
  $('input-count').textContent=inputs.length+' 筆';
  const key=inputs.map(e=>`${e.step}:${e.input.raw}`).join('|');
  if (key===lastHistoryKey) return;
  lastHistoryKey=key;
  $('input-history').replaceChildren();
  inputs.forEach((event,index)=>{
    const row=element('div','history-item');
    row.append(element('span','',`#${index+1}`),element('code','',`${event.input.variable} = ${displayValue(event.input.value)}`));
    const edit=element('button','','修改');edit.type='button';edit.title='修改這筆輸入並重新計算';
    edit.onclick=()=>{playing=false;renderPlayback();inputEditIndex=index;$('edit-input-value').value=event.input.raw;$('edit-input-dialog').showModal();};
    row.append(edit);$('input-history').append(row);
  });
}
function renderTraceHistory() {
  const from=Math.max(0,cursor-30),to=Math.min(trace.length,from+65);
  const key=`${generation}|${cursor}|${from}|${to}`;
  if (key===lastTraceWindow) return;
  lastTraceWindow=key;
  const fragment=document.createDocumentFragment();
  if (from>0) fragment.append(element('p','field-hint',`顯示附近步驟；使用底部時間軸可前往全部 ${trace.length} 步。`));
  for(let i=from;i<to;i++) {
    const event=trace[i];const button=element('button','trace-item'+(i+1===cursor?' active':''));
    button.type='button';button.append(element('small','',String(event.step).padStart(3,'0')),element('span','',getNode(event.nodeId)?.title||labels[event.type]));
    button.title=event.expression||labels[event.type];button.onclick=()=>seekTo(i+1);fragment.append(button);
  }
  $('trace-history').replaceChildren(fragment);
}
function animate(now) {
  if(playing && cursor<trace.length) {
    const interval=650/Number($('speed').value);
    if(now-lastFrame>=interval) {cursor=Math.min(trace.length,cursor+Math.min(8,Math.floor((now-lastFrame)/interval)));lastFrame=now;renderPlayback();}
  } else if(cursor===trace.length) lastFrame=now;
  requestAnimationFrame(animate);
}
function renderProperties() {
  const node=selectedId&&getNode(selectedId);
  $('property-empty').hidden=!!node;$('property-form').hidden=!node;
  $('selection-actions').hidden=!((selected.nodeIds?.length||0)+(selected.edgeIds?.length||0));
  $('copy-btn').disabled=!(selected.nodeIds?.length);
  if(!node)return;
  $('property-type').textContent=`${labels[node.type]} / ${node.type}`;$('node-title').value=node.title;
  $('expression-fields').hidden=!['process','decision','output'].includes(node.type);
  $('output-mode-field').hidden=node.type!=='output';
  $('input-fields').hidden=node.type!=='input';
  $('node-expression').value=node.data.expression||'';
  if(node.type==='output')$('node-output-mode').value=node.data.outputMode||'expression';
  describeExpressionField(node.type);
  $('node-variable').value=node.data.variable||'';$('node-input-type').value=node.data.inputType||'integer';$('node-prompt').value=node.data.prompt||'';
}
function describeExpressionField(type) {
  const mode=$('node-output-mode').value;
  $('expression-label').textContent=type==='process'?'指定運算式':type==='decision'?'判斷條件':mode==='text'?'輸出文字':'輸出運算式';
  $('expression-hint').textContent=type==='process'?'例如：i = i + 1。每個節點只放一個指定。'
    :type==='decision'?'例如：score >= 60。結果必須是 True 或 False。'
    :mode==='text'?'照字面輸出一行，{變數} 會換成當下的值，例如：總分是 {總分} 分。要印出大括號請寫 {{ 或 }}。'
    :'輸出計算結果，例如：total 或 name + "，你好"。每次輸出一行。';
}
async function confirmReplace(title,message) {
  $('confirm-title').textContent=title;$('confirm-message').textContent=message;$('confirm-dialog').showModal();
  return new Promise(resolve=>{
    const finish=result=>{$('confirm-dialog').close();$('confirm-ok').onclick=null;$('confirm-cancel').onclick=null;$('confirm-dialog').oncancel=null;resolve(result);};
    $('confirm-ok').onclick=()=>finish(true);$('confirm-cancel').onclick=()=>finish(false);$('confirm-dialog').oncancel=event=>{event.preventDefault();finish(false);};
  });
}
function backupCurrent() {
  try {localStorage.setItem(BACKUP_KEY,JSON.stringify({graph:canvas.getGraph(),input:$('input-data').value,savedAt:Date.now()}));return true;}catch{return false;}
}
function loadGraph(raw,{fit=false,input=null}={}) {
  const graph=normalizeGraph(raw);
  invalidate();selectedId=null;selected={nodeIds:[],edgeIds:[]};
  suppressChange=true;canvas.setGraph(graph,{fit});suppressChange=false;
  $('graph-title').value=graph.title;
  if(input!==null)$('input-data').value=input;
  renderProperties();showTab('observe');validate();updateCanvasMeta();renderPlayback();
  if(!initialLoad)scheduleSave();
}

$('property-form').onsubmit=event=>{
  event.preventDefault();const node=selectedId&&getNode(selectedId);if(!node)return;
  const data=node.type==='input'?{variable:$('node-variable').value.trim(),inputType:$('node-input-type').value,prompt:$('node-prompt').value}:node.type==='output'?{expression:$('node-expression').value.trim(),outputMode:$('node-output-mode').value}:['process','decision'].includes(node.type)?{expression:$('node-expression').value.trim()}:{};
  canvas.updateNode(node.id,{title:$('node-title').value.trim()||labels[node.type],data});
  validate();toast('節點設定已套用。');
};
$('node-output-mode').onchange=()=>describeExpressionField(getNode(selectedId)?.type||'output');
$('graph-title').onchange=()=>{
  const title=$('graph-title').value.trim()||'未命名流程圖';
  canvas.updateTitle(title);$('graph-title').value=title;
};
$('input-data').addEventListener('input',()=>{invalidate('測試資料已修改，請重新執行。');scheduleSave();});
$('run-btn').onclick=()=>begin();$('restart-btn').onclick=()=>begin();
$('pause-btn').onclick=()=>{playing=!playing;lastFrame=performance.now();renderPlayback();};
$('step-back-btn').onclick=()=>seekTo(cursor-1);
$('step-next-btn').onclick=()=>{
  if(engineStatus==='idle'){begin({play:false,oneStep:true});return;}
  playing=false;
  if(cursor<trace.length)seekTo(cursor+1);
  else if(waiting){showTab('observe');$('input-value').focus();}
  else if(engineStatus==='computing'){pendingSteps=1;renderPlayback();}
};
$('stop-btn').onclick=()=>{generation++;killWorker();engineStatus='stopped';playing=false;waiting=null;pendingSteps=0;pendingSeek=null;renderPlayback();toast('已停止，仍可回看已產生的執行紀錄。');};
$('timeline').addEventListener('input',event=>seekTo(event.target.value));
$('show-error-btn').onclick=()=>{seekTo(trace.length);if(runError?.nodeId){canvas.selectNode(runError.nodeId);showTab('observe');}};
$('speed').onchange=()=>{lastFrame=performance.now();};
$('input-form').onsubmit=event=>{
  event.preventDefault();if(!waiting||cursor!==trace.length||!worker||engineStatus!=='waiting')return;
  const value=$('input-value').value;$('input-error').textContent='';
  $('input-value').disabled=true;$('input-form').querySelector('button').disabled=true;
  worker.postMessage({type:'input',runId:generation,value});
  engineStatus='computing';waiting=null;playing=true;lastFrame=performance.now();resetWatchdog();renderPlayback();
  $('input-value').value='';
};
$('edit-input-cancel').onclick=()=>$('edit-input-dialog').close();
$('edit-input-form').onsubmit=event=>{
  event.preventDefault();if(inputEditIndex===null)return;
  const inputEvents=trace.filter(e=>e.input);const eventToEdit=inputEvents[inputEditIndex];if(!eventToEdit)return;
  const inputs=inputEvents.slice(0,inputEditIndex+1).map(e=>e.input.raw);inputs[inputEditIndex]=$('edit-input-value').value;
  $('edit-input-dialog').close();$('input-data').value=inputs.join('\n');
  begin({play:false,inputs,seek:eventToEdit.step});scheduleSave();toast('已用新輸入重新計算；後續輸入會重新詢問。');
};
for(const button of $('node-palette').querySelectorAll('[data-node-type]')) {
  button.onclick=()=>canvas.addNode(button.dataset.nodeType);
  button.ondragstart=event=>{event.dataTransfer.setData('text/flow-node',button.dataset.nodeType);event.dataTransfer.setData('text/plain',button.dataset.nodeType);event.dataTransfer.effectAllowed='copy';};
}
$('copy-btn').onclick=()=>canvas.copySelection();$('paste-btn').onclick=()=>canvas.paste();$('delete-btn').onclick=()=>canvas.deleteSelection();
$('undo-btn').onclick=()=>{canvas.undo();updateCanvasMeta();};$('redo-btn').onclick=()=>{canvas.redo();updateCanvasMeta();};
function setTool(mode){canvas.setInteraction(mode);for(const tool of ['select','pan']){$(tool+'-tool').classList.toggle('active',tool===mode);$(tool+'-tool').setAttribute('aria-pressed',String(tool===mode));}}
$('select-tool').onclick=()=>setTool('select');$('pan-tool').onclick=()=>setTool('pan');
$('zoom-out-btn').onclick=()=>{canvas.zoomBy(.85);updateCanvasMeta();};$('zoom-in-btn').onclick=()=>{canvas.zoomBy(1.18);updateCanvasMeta();};$('fit-btn').onclick=()=>{canvas.fit();updateCanvasMeta();};
$('validate-btn').onclick=()=>validate(true);
for(const tab of ['observe','properties']){
  $(tab+'-tab').onclick=()=>showTab(tab);
  $(tab+'-tab').onkeydown=event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const next=tab==='observe'?'properties':'observe';showTab(next);$(next+'-tab').focus();}};
}
for(const example of EXAMPLES)$('example-select').add(new Option(example.title,example.id));
function updateExampleDescription(){$('example-description').textContent=EXAMPLES.find(e=>e.id===$('example-select').value)?.description||'';}
$('example-select').onchange=updateExampleDescription;
$('load-example-btn').onclick=async()=>{
  const example=EXAMPLES.find(e=>e.id===$('example-select').value);if(!example)return;
  if(!await confirmReplace('載入範例',`目前作品會換成「${example.title}」。需要長期保留目前作品時，請先匯出 JSON。`))return;
  backupCurrent();loadGraph(example.graph,{fit:true,input:example.input});toast('範例已載入。可以先猜結果，再按執行。');
};
$('new-btn').onclick=async()=>{
  if(!await confirmReplace('建立新作品','將清空目前畫布。需要保留目前作品時，請先匯出 JSON。'))return;
  backupCurrent();loadGraph(emptyGraph(),{input:''});toast('從左側加入節點，開始建立你的流程。');
};
$('save-btn').onclick=()=>saveDraft(true);
$('export-btn').onclick=()=>{
  const graph=canvas.getGraph(),blob=new Blob([JSON.stringify(graph,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);
  const link=element('a');link.href=url;link.download=(graph.title.replace(/[\\/:*?"<>|]/g,'_')||'flowchart')+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('已匯出流程圖 JSON。');
};
$('import-btn').onclick=()=>$('import-file').click();
$('import-file').onchange=async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  try{
    if(file.size>2*1024*1024)throw new Error('流程圖檔案不能超過 2 MB。');
    const graph=normalizeGraph(JSON.parse(await file.text()));
    if(!await confirmReplace('匯入流程圖',`準備載入「${graph.title}」，共 ${graph.nodes.length} 個節點。需要保留目前作品時，請先匯出 JSON。`))return;
    backupCurrent();loadGraph(graph,{input:''});toast('流程圖已匯入，節點位置與畫布視角已還原。');
  }catch(error){toast(`匯入失敗：${error.message}`,6500);}
};
const help=()=>$('help-dialog').showModal();$('help-btn').onclick=help;$('shortcuts-btn').onclick=help;
for(const button of document.querySelectorAll('.close-dialog'))button.onclick=()=>$('help-dialog').close();
document.addEventListener('keydown',event=>{
  if(/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)||document.querySelector('dialog[open]')||event.metaKey||event.ctrlKey||event.altKey)return;
  if(event.key.toLowerCase()==='v')setTool('select');if(event.key.toLowerCase()==='h')setTool('pan');
});
window.addEventListener('pagehide',()=>{saveDraft();killWorker();});
window.addEventListener('beforeunload',event=>{saveDraft();if(!persisted){event.preventDefault();event.returnValue='';}});

// 每次開啟都從空白開始；範例與作品只在使用者手動載入時顯示。
$('example-select').value='parity';
loadGraph(emptyGraph(),{input:''});
initialLoad=false;updateExampleDescription();renderPlayback();updateCanvasMeta();
$('save-status').textContent='下次繼續編輯，請先匯出 JSON';
requestAnimationFrame(animate);
window.flowLab={getGraph:()=>canvas.getGraph(),getState:()=>({trace:clone(trace),cursor,engineStatus,playing,waiting:clone(waiting),runError:clone(runError),generation,validation:clone(validation)}),loadGraph,canvas,validate,storageKey:STORAGE_KEY};
