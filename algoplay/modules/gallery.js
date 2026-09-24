// 會動的演算法：把模組畫成卡片，做完的玩法會打勾。
import { $, h } from '../core/ui.js';
import { loadProgress } from '../core/progress.js';
import { MODULES } from '../core/catalog.js';

const MODES = [['watch', '👀 看'], ['quiz', '🤔 猜'], ['play', '🕹️ 做'], ['robot', '🤖 教機器人']];

// catalog 的 href 是相對於 algoplay/，這一頁在 modules/ 底下，要往上一層。

const progress = loadProgress();

$('#module-grid').replaceChildren(...MODULES.map(module => {
  if (module.soon) {
    return h('div', { class: 'module-card soon' },
      h('span', { class: 'module-icon', 'aria-hidden': 'true' }, module.icon),
      h('h2', {}, module.name), h('p', {}, module.text), h('span', { class: 'tag' }, '🚧 製作中'));
  }
  const record = progress.modules[module.id] || {};
  return h('a', { class: 'module-card', href: `../${module.href}` },
    h('span', { class: 'module-icon', 'aria-hidden': 'true' }, module.icon),
    h('h2', {}, module.name), h('p', {}, module.text),
    h('div', { class: 'mode-chips' }, MODES.map(([key, label]) => h('span', { class: `tag${record[key] ? ' green' : ''}` }, label))));
}));
