// Python 程式碼的簡易上色（只處理教學會用到的語法）。

const escapeHtml = text => text.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const KEYWORDS = new Set(['def', 'while', 'if', 'elif', 'else', 'return', 'for', 'in', 'and', 'or', 'not', 'True', 'False', 'break', 'continue', 'pass']);
const FUNCS = new Set(['len', 'range', 'guess', 'binary_search', 'linear_search', 'print']);

export function highlightPython(line) {
  const comment = line.indexOf('#');
  const code = comment >= 0 ? line.slice(0, comment) : line;
  const html = code.replace(/('[^']*'|"[^"]*"|[A-Za-z_]\w*|\d+|[^\w'"]+)/g, token => {
    if (/^['"]/.test(token)) return `<span class="tok-str">${escapeHtml(token)}</span>`;
    if (KEYWORDS.has(token)) return `<span class="tok-kw">${token}</span>`;
    if (FUNCS.has(token)) return `<span class="tok-fn">${token}</span>`;
    if (/^\d+$/.test(token)) return `<span class="tok-num">${token}</span>`;
    return escapeHtml(token);
  });
  return comment >= 0 ? `${html}<span class="tok-com">${escapeHtml(line.slice(comment))}</span>` : html;
}

export function codeBlock(pre, text) {
  pre.innerHTML = text.split('\n').map(highlightPython).join('\n');
}
