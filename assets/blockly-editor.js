/* Blockly 12.3.1 + the official Python generator. */
(() => {
  'use strict';
  const generator = python.pythonGenerator;
  const order = python.Order;
  const send = data => parent.postMessage({ channel: 'skilllab-editor', ...data }, location.origin === 'null' ? '*' : location.origin);
  const message = document.getElementById('message');
  let loading = true;
  const inputTypes = [
    {
      type: 'judge_read_integer', label: '拿下一個整數', output: 'Number', code: 'int(_skilllab_token())',
      tooltip: '最常用。每放一塊，就從測資依序拿下一個整數。例如輸入「3 5」，第一塊得到 3，第二塊得到 5。'
    },
    {
      type: 'judge_read_number', label: '拿下一個數字（可含小數）', output: 'Number', code: 'float(_skilllab_token())',
      tooltip: '每放一塊，就從測資依序拿下一個數字，例如 3.14。'
    },
    {
      type: 'judge_read_token', label: '拿下一段文字', output: 'String', code: '_skilllab_token()',
      tooltip: '讀到空格或換行為止。例如輸入「hello world」，第一塊得到 hello。'
    },
    {
      type: 'judge_read_line', label: '拿下一整行文字', output: 'String', code: '_skilllab_line()',
      tooltip: '讀取完整的一行，中間的空格會保留。例如輸入「hello world」，會得到 hello world。'
    },
    {
      type: 'judge_read_all', label: '拿剩下的全部文字', output: 'String', code: '_skilllab_stream.read()',
      tooltip: '一次讀取尚未使用的全部測資，包含其中的換行。'
    }
  ];
  const ioDefinitions = `import io as _skilllab_io\nimport sys as _skilllab_sys\n_skilllab_stream = _skilllab_io.StringIO(_skilllab_sys.stdin.read(), newline=None)\ndef _skilllab_line():\n    line = _skilllab_stream.readline()\n    if line == '':\n        raise EOFError('題目輸入已讀完')\n    return line.rstrip('\\n').rstrip('\\r')\ndef _skilllab_token():\n    token = ''\n    while True:\n        char = _skilllab_stream.read(1)\n        if not char:\n            if token: return token\n            raise EOFError('題目輸入已讀完')\n        if char.isspace():\n            if token: return token\n        else:\n            token += char\n`;
  Blockly.defineBlocksWithJsonArray([
    ...inputTypes.map(({type, label, output, tooltip}) => ({ type, message0: label, output, colour: 190, tooltip })),
    { type: 'judge_print', message0: '輸出答案 %1 %2', args0: [{ type: 'input_value', name: 'VALUE' }, { type: 'field_dropdown', name: 'END', options: [['然後換行', 'NEWLINE'], ['後面加空格', 'SPACE'], ['不換行', 'NONE']] }], previousStatement: null, nextStatement: null, colour: 190, tooltip: '把值寫到程式的輸出結果。通常保持「然後換行」即可。' },
    { type: 'judge_number', message0: '轉成 %1 %2', args0: [{ type: 'field_dropdown', name: 'KIND', options: [['整數', 'int'], ['小數', 'float']] }, { type: 'input_value', name: 'VALUE' }], output: 'Number', colour: 230 }
  ]);
  inputTypes.forEach(({type, code}) => {
    generator.forBlock[type] = () => { generator.definitions_['skilllab_io'] = ioDefinitions; return [code, order.FUNCTION_CALL]; };
  });
  generator.forBlock.judge_print = block => {
    const value = generator.valueToCode(block, 'VALUE', order.NONE) || "''";
    const end = { NEWLINE: '\\n', SPACE: ' ', NONE: '' }[block.getFieldValue('END')];
    return `print(${value}, end='${end}')\n`;
  };
  generator.forBlock.judge_number = block => [`${block.getFieldValue('KIND')}(${generator.valueToCode(block, 'VALUE', order.NONE) || '0'})`, order.FUNCTION_CALL];
  // Blockly's native prompt block is the beginner-facing equivalent of Python
  // input(). Its visible prompt makes the block readable, but is deliberately
  // omitted from generated code so judge output is not polluted.
  ['text_prompt_ext', 'text_prompt'].forEach(type => {
    generator.forBlock[type] = block => {
      return [block.getFieldValue('TYPE') === 'NUMBER' ? 'float(input())' : 'input()', order.FUNCTION_CALL];
    };
  });
  const block = type => ({ kind: 'block', type });
  const category = (name, colour, types) => ({ kind: 'category', name, colour, contents: types.map(block) });
  const ioCategory = {
    kind: 'category', name: '讀取／輸出', colour: '#167a88', contents: [
      { kind: 'label', text: '一次讀取一整行（Python input()）' },
      { kind: 'block', type: 'text_prompt', fields: { TYPE: 'TEXT', TEXT: '請輸入文字' } },
      { kind: 'label', text: '需要拆資料時，到「清單」選擇分隔積木' },
      { kind: 'label', text: '輸出答案' },
      block('judge_print'),
      { kind: 'label', text: '類型轉換' },
      block('judge_number')
    ]
  };
  const workspace = Blockly.inject('workspace', {
    toolbox: { kind: 'categoryToolbox', contents: [
      ioCategory,
      category('判斷', '#5568a9', ['controls_if', 'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean', 'logic_ternary']),
      category('迴圈', '#408f5a', ['controls_repeat_ext', 'controls_whileUntil', 'controls_for', 'controls_forEach', 'controls_flow_statements']),
      category('數學', '#5663b0', ['math_number', 'math_arithmetic', 'math_modulo', 'math_single', 'math_round', 'math_number_property', 'math_on_list', 'math_constrain']),
      category('文字', '#258878', ['text', 'text_join', 'text_append', 'text_length', 'text_isEmpty', 'text_indexOf', 'text_charAt', 'text_getSubstring', 'text_changeCase', 'text_trim', 'text_count', 'text_replace', 'text_reverse']),
      category('清單', '#805da8', ['lists_create_with', 'lists_repeat', 'lists_length', 'lists_isEmpty', 'lists_indexOf', 'lists_getIndex', 'lists_setIndex', 'lists_getSublist', 'lists_split', 'lists_sort', 'lists_reverse']),
      { kind: 'category', name: '變數', custom: 'VARIABLE', colour: '#a05f22' },
      { kind: 'category', name: '函式', custom: 'PROCEDURE', colour: '#975a97' }
    ] },
    media: 'vendor/blockly/media/', trashcan: true,
    oneBasedIndex: false,
    zoom: { controls: true, wheel: true, startScale: 0.85, maxScale: 1.5, minScale: 0.45 },
    move: { scrollbars: true, drag: true, wheel: true }
  });
  const serialize = () => ({ format: 'skilllab-blockly', version: 1, workspace: Blockly.serialization.workspaces.save(workspace) });
  const changed = () => { if (!loading) { send({ event: 'change', state: serialize() }); updatePreview(); } };
  function load(state) {
    if (state && (state.format !== 'skilllab-blockly' || state.version !== 1 || !state.workspace)) throw new Error('請選擇 ThinkLab 匯出的 Blockly 積木檔。');
    loading = true;
    const before = Blockly.serialization.workspaces.save(workspace);
    try { Blockly.serialization.workspaces.load(state?.workspace || {}, workspace); }
    catch (error) { Blockly.serialization.workspaces.load(before, workspace); throw error; }
    finally { loading = false; }
    Blockly.svgResize(workspace);
    changed();
  }
  function code() { return generator.workspaceToCode(workspace); }
  function updatePreview() {
    try { document.getElementById('preview').textContent = code() || '# 從左側拖入積木開始'; }
    catch (error) { document.getElementById('preview').textContent = error.message; }
  }
  workspace.addChangeListener(event => { if (!event.isUiEvent) changed(); });
  new ResizeObserver(() => Blockly.svgResize(workspace)).observe(document.body);
  window.addEventListener('resize', () => Blockly.svgResize(workspace));
  document.getElementById('preview-toggle').onclick = event => {
    const preview = document.getElementById('preview');
    preview.hidden = !preview.hidden;
    event.target.textContent = preview.hidden ? '查看 Python' : '回到積木';
    event.target.setAttribute('aria-expanded', String(!preview.hidden));
    updatePreview();
  };
  document.getElementById('export').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'thinklab-blockly.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  document.getElementById('import').onchange = async event => {
    const file = event.target.files[0];
    try {
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) throw new Error('積木檔案不能超過 2 MB。');
      const state = JSON.parse(await file.text());
      if (workspace.getAllBlocks(false).length && !confirm('匯入會取代目前 Blockly 積木，確定繼續？')) return;
      load(state); message.textContent = '積木已匯入並保存。';
    } catch (error) { message.textContent = '匯入失敗：' + error.message; }
    finally { event.target.value = ''; }
  };
  window.addEventListener('message', async event => {
    if (event.source !== parent || event.origin !== location.origin || event.data?.channel !== 'skilllab-editor') return;
    const { id, method, params = {} } = event.data;
    try {
      let result = null;
      if (method === 'init') load(params.state);
      else if (method === 'reset') load(null);
      else if (method === 'snapshot') { changed(); result = { code: code() }; }
      else if (method === 'disabled') { document.getElementById('tools').inert = params.value; document.getElementById('workspace').inert = params.value; }
      else throw new Error('未知的積木操作');
      send({ id, result });
    } catch (error) { send({ id, error: error.message }); }
  });
  send({ event: 'ready' });
})();
