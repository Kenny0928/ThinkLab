/* Shared language editor. Python draft keys remain compatible with older pages. */
(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const languages = { python: 'Python', blockly: 'Blockly', scratch: 'Scratch' };
  let sequence = 0;
  class SkillLabEditor {
    constructor({ mount, pythonEditor, onChange = () => {}, onLanguageChange = () => {} }) {
      this.mount = mount;
      this.python = pythonEditor;
      this.onChange = onChange;
      this.onLanguageChange = onLanguageChange;
      this.frames = new Map();
      this.disabled = false;
      this.loading = false;
      this.task = null;
      this.version = 0;
      this.language = 'python';
      this.allowedLanguages = Object.keys(languages);
      try { this.language = localStorage.getItem('pyjudge_language') || 'python'; } catch (_) {}
      if (!languages[this.language]) this.language = 'python';
      mount.classList.add('programming-editor');
      this.toolbar = document.createElement('div');
      this.toolbar.className = 'programming-toolbar';
      const label = document.createElement('label');
      label.textContent = '作答方式 ';
      this.select = document.createElement('select');
      this.select.setAttribute('aria-label', '作答方式');
      this.languageOptions = Object.entries(languages).map(([value, name]) => new Option(name, value));
      this.languageOptions.forEach(option => this.select.add(option));
      this.select.value = this.language;
      label.append(this.select);
      this.status = document.createElement('span');
      this.status.className = 'programming-status';
      this.status.setAttribute('role', 'status');
      this.retry = document.createElement('button');
      this.retry.type = 'button';
      this.retry.textContent = '重新載入積木';
      this.retry.hidden = true;
      this.retry.onclick = () => {
        const frame = this.frames.get(this.language);
        if (frame) { frame.dispose(); this.frames.delete(this.language); }
        this.switchLanguage(this.language);
      };
      this.toolbar.append(label, this.status, this.retry);
      this.help = document.createElement('p');
      this.help.className = 'programming-help';
      this.host = document.createElement('div');
      this.host.className = 'programming-frames';
      mount.append(this.toolbar, this.help, this.host);
      this.select.onchange = () => {
        if (this.disabled) { this.select.value = this.language; return; }
        this.switchLanguage(this.select.value);
      };
      this.changeListener = () => { if (!this.loading) this.save(); };
      this.python.on('change', this.changeListener);
    }
    read(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
    write(key, value) {
      try { localStorage.setItem(key, value); return true; }
      catch (_) { this.status.textContent = '瀏覽器無法保存草稿，請先匯出作品。'; return false; }
    }
    save() {
      if (!this.task || this.loading) return;
      if (this.write(this.task.key, this.python.getValue())) this.onChange();
    }
    async flush() {
      this.save();
      // Await final workspace edits before a page disposes its task frames.
      await Promise.all([...this.frames.values()].filter(frame => frame.initialized).map(async frame => {
        try { await frame.request('snapshot', {}, 5000); }
        catch (error) { this.status.textContent = '草稿保存失敗：' + error.message; }
      }));
    }
    async setTask(task) {
      this.save();
      const version = ++this.version;
      this.frames.forEach(frame => frame.dispose());
      this.frames.clear();
      this.task = task;
      this.allowedLanguages = Array.isArray(task.allowedLanguages) && task.allowedLanguages.length
        ? task.allowedLanguages.filter(language => languages[language])
        : Object.keys(languages);
      this.languageOptions.forEach(option => {
        option.disabled = !this.allowedLanguages.includes(option.value);
        option.hidden = option.disabled;
      });
      if (!this.allowedLanguages.includes(this.language)) this.language = this.allowedLanguages[0] || 'python';
      this.loading = true;
      let draft = this.read(task.key);
      for (const key of task.legacyKeys || []) { if (draft === null) draft = this.read(key); }
      this.python.setValue(draft ?? task.starter ?? '');
      this.python.clearHistory();
      this.loading = false;
      await this.switchLanguage(this.language);
      if (version !== this.version) return;
    }
    async switchLanguage(language) {
      if (!languages[language] || !this.allowedLanguages.includes(language)) return;
      this.save();
      this.language = language;
      this.select.value = language;
      this.write('pyjudge_language', language);
      const python = language === 'python';
      this.python.getWrapperElement().style.display = python ? '' : 'none';
      this.host.hidden = python;
      this.help.hidden = python;
      this.help.textContent = language === 'scratch'
        ? '接在綠旗下面開始。每個「詢問」依序讀取一筆資料，空格或換行都能分隔；用「詢問的答案」取得輸入，「說出」輸出一行。'
        : '「要求輸入文字」一次讀取完整一行；再用「清單」的分隔積木拆解。清單索引與 Python 相同，從 0 開始。';
      this.status.textContent = python ? '草稿自動保存' : '載入積木編輯器…';
      this.retry.hidden = true;
      this.frames.forEach((frame, mode) => { frame.element.hidden = mode !== language; });
      this.onLanguageChange(language);
      if (python) { this.python.refresh(); return; }
      if (!this.task) return;
      const version = this.version;
      try {
        const frame = this.frames.get(language) || this.createFrame(language);
        frame.element.hidden = false;
        await frame.ready;
        if (this.version === version && this.language === language) {
          this.status.textContent = '草稿自動保存';
          frame.request('disabled', { value: this.disabled }).catch(() => {});
        }
      } catch (error) {
        if (this.version === version && this.language === language) {
          this.status.textContent = error.message;
          this.retry.hidden = false;
        }
      }
    }
    createFrame(language) {
      const element = document.createElement('iframe');
      element.title = languages[language] + ' 積木編輯器';
      element.src = new URL(language + '-editor.html', base).href;
      const key = this.task.key + '_' + language;
      const pending = new Map();
      let disposed = false;
      let resolveReady, rejectReady;
      const loaded = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
      const loadTimer = setTimeout(() => rejectReady(new Error('積木載入逾時，請重新載入。')), 45000);
      const request = (method, params = {}, timeout = 60000) => new Promise((resolve, reject) => {
        if (disposed) { reject(new Error('編輯器已切換')); return; }
        const id = ++sequence;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error('積木操作逾時，請重試。')); }, timeout);
        pending.set(id, { resolve, reject, timer });
        element.contentWindow.postMessage({ channel: 'skilllab-editor', id, method, params }, location.origin === 'null' ? '*' : location.origin);
      });
      const listener = event => {
        if (event.source !== element.contentWindow || event.origin !== location.origin || event.data?.channel !== 'skilllab-editor') return;
        const data = event.data;
        if (data.event === 'ready') { clearTimeout(loadTimer); resolveReady(); }
        else if (data.event === 'error') { clearTimeout(loadTimer); rejectReady(new Error(data.error || '積木載入失敗')); }
        else if (data.event === 'change') { if (this.write(key, JSON.stringify(data.state))) this.onChange(); }
        else if (pending.has(data.id)) {
          const item = pending.get(data.id);
          clearTimeout(item.timer);
          pending.delete(data.id);
          data.error ? item.reject(new Error(data.error)) : item.resolve(data.result);
        }
      };
      window.addEventListener('message', listener);
      const frame = { element, request, loaded, ready: null, dispose: () => {
        disposed = true;
        clearTimeout(loadTimer);
        rejectReady(new Error('編輯器已切換'));
        window.removeEventListener('message', listener);
        pending.forEach(item => { clearTimeout(item.timer); item.reject(new Error('編輯器已切換')); });
        element.remove();
      } };
      frame.ready = loaded.then(() => {
        let state = null;
        const stored = this.read(key);
        if (stored !== null) {
          try { state = JSON.parse(stored); }
          catch (_) { throw new Error('積木草稿格式損壞。請先備份瀏覽器資料，再重置本題積木。'); }
        }
        return request('init', { state }).then(result => { frame.initialized = true; return result; });
      });
      this.frames.set(language, frame);
      this.host.append(element);
      return frame;
    }
    async snapshot() {
      this.save();
      const language = this.language;
      if (language === 'python') return { language, code: this.python.getValue() };
      const frame = this.frames.get(language);
      if (!frame) throw new Error('請先等待積木載入完成。');
      await frame.ready;
      return { language, ...await frame.request('snapshot') };
    }
    async run(snapshot, input, timeLimit, pythonRunner) {
      if (snapshot.language !== 'scratch') {
        const result = await pythonRunner(snapshot.code, input, timeLimit);
        return { ...result, errout: result.errout ?? result.error ?? '' };
      }
      const frame = this.frames.get('scratch');
      if (!frame) throw new Error('Scratch 編輯器已切換，請重新執行。');
      return frame.request('run', { project: snapshot.project, input, timeLimit }, timeLimit + 60000);
    }
    async reset() {
      if (this.disabled || !this.task) return;
      if (this.language === 'python') {
        this.python.setValue(this.task.starter || '');
        this.python.clearHistory();
        this.save();
      } else {
        const frame = this.frames.get(this.language);
        if (frame) {
          try {
            await frame.loaded;
            // A bad saved document must remain recoverable through explicit reset.
            await frame.ready.catch(() => {});
            await frame.request('reset');
            frame.ready = Promise.resolve();
            this.status.textContent = '草稿已重置';
            this.retry.hidden = true;
          }
          catch (error) { this.status.textContent = error.message; }
        }
      }
    }
    setDisabled(value) {
      this.disabled = value;
      this.select.disabled = value;
      this.retry.disabled = value;
      this.python.setOption('readOnly', value);
      this.host.inert = value;
      this.frames.forEach(frame => frame.ready.then(() => frame.request('disabled', { value })).catch(() => {}));
    }
    refresh() { this.python.refresh(); }
    dispose() {
      this.save();
      this.version++;
      this.python.off('change', this.changeListener);
      this.frames.forEach(frame => frame.dispose());
      this.frames.clear();
      this.mount.replaceChildren();
    }
  }
  window.SkillLabEditor = SkillLabEditor;
})();
