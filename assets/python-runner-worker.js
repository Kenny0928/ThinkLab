/* Pyodide runs here instead of on the page, so a slow or endless program can be
 * stopped with worker.terminate() without freezing the tab.
 */
'use strict';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

// Each test receives fresh globals and an exact stdin stream. Errors are
// reported with only the student's frames, so Pyodide internals stay hidden.
const RUNNER = `
import sys as _sl_sys, io as _sl_io, linecache as _sl_linecache, traceback as _sl_traceback
_sl_old = (_sl_sys.stdin, _sl_sys.stdout, _sl_sys.stderr)
_sl_out, _sl_err = _sl_io.StringIO(), _sl_io.StringIO()
_sl_sys.stdin = _sl_io.StringIO(_skilllab_input)
_sl_sys.stdout, _sl_sys.stderr = _sl_out, _sl_err
_sl_linecache.cache['<student>'] = (len(_skilllab_code), None, _skilllab_code.splitlines(True), '<student>')
try:
    exec(compile(_skilllab_code, '<student>', 'exec'), {'__name__': '__main__'})
except Exception as _sl_error:
    _sl_tb = _sl_error.__traceback__
    while _sl_tb and _sl_tb.tb_frame.f_code.co_filename != '<student>':
        _sl_tb = _sl_tb.tb_next
    _sl_err.write(''.join(_sl_traceback.format_exception(type(_sl_error), _sl_error, _sl_tb)))
finally:
    _sl_sys.stdin, _sl_sys.stdout, _sl_sys.stderr = _sl_old
`;

let runtimePromise = null;
try {
  importScripts(PYODIDE_URL + 'pyodide.js');
  runtimePromise = loadPyodide({ indexURL: PYODIDE_URL });
  runtimePromise.then(() => self.postMessage({ event: 'ready' }),
    error => self.postMessage({ event: 'error', error: 'Python 環境載入失敗：' + error.message }));
} catch (error) {
  self.postMessage({ event: 'error', error: 'Python 環境載入失敗：' + error.message });
}

self.onmessage = async event => {
  const { id, code, input } = event.data;
  try {
    const runtime = await runtimePromise;
    runtime.globals.set('_skilllab_code', code);
    runtime.globals.set('_skilllab_input', input);
    self.postMessage({ event: 'started', id });
    const t0 = performance.now();
    try {
      await runtime.runPythonAsync(RUNNER);
      const elapsed = performance.now() - t0;
      self.postMessage({ event: 'done', id, output: runtime.runPython('_sl_out.getvalue()'), errout: runtime.runPython('_sl_err.getvalue()'), elapsed });
    } finally {
      runtime.globals.delete('_skilllab_code');
      runtime.globals.delete('_skilllab_input');
    }
  } catch (error) {
    self.postMessage({ event: 'done', id, output: '', errout: String(error.message || error), elapsed: 0 });
  }
};
