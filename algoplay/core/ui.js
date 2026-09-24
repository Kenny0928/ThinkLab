// 各頁共用的小工具。
import { aiAvatar } from './cast.js';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/** 建立元素：h('button', { class: 'primary', onclick }, '文字', child) */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
    else if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const fmt = n => Number(n).toLocaleString('zh-TW');

let toastTimer;
export function toast(message) {
  let el = $('#toast');
  if (!el) {
    el = h('div', { id: 'toast', class: 'toast', role: 'status' });
    document.body.append(el);
  }
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

/** 星星：圖形之外也提供文字給螢幕閱讀器。 */
export function stars(count, max = 3) {
  const el = h('span', { class: 'stars', role: 'img', 'aria-label': `${count} / ${max} 顆星` });
  for (let i = 0; i < max; i++) el.append(h('span', { class: i < count ? 'on' : '' }, '★'));
  return el;
}

/** 資源計量條。回傳 update(used) 函式。 */
export function meter(container, { label, budget, unit = '次', note = '', warnAt = 0.75 }) {
  const value = h('span', { class: 'meter-value' });
  const fill = h('div', { class: 'meter-fill' });
  const noteEl = h('p', { class: 'meter-note' }, note);
  const root = h('div', { class: 'meter' },
    h('div', { class: 'meter-head' }, h('span', { class: 'meter-label' }, label), value),
    h('div', { class: 'meter-track', role: 'presentation' }, fill),
    noteEl);
  container.replaceChildren(root);
  function update(used, message) {
    value.innerHTML = `${fmt(used)}<small> / ${fmt(budget)} ${unit}</small>`;
    fill.style.width = `${Math.min(100, (used / budget) * 100)}%`;
    root.dataset.state = used > budget ? 'over' : used >= budget * warnAt ? 'warn' : 'ok';
    if (message !== undefined) noteEl.textContent = message;
  }
  update(0);
  return update;
}

/**
 * 剩餘資源的燈號：一顆一顆熄掉，比數字有壓力。
 * 回傳 update(used, message) 函式。
 */
export function lamps(container, { label, budget, unit = '次', note = '' }) {
  const value = h('span', { class: 'meter-value' });
  const row = h('div', { class: budget > 12 ? 'lamp-row is-many' : 'lamp-row', 'aria-hidden': 'true' },
    Array.from({ length: budget }, () => h('i', { class: 'on' })));
  const noteEl = h('p', { class: 'meter-note' }, note);
  const root = h('div', { class: 'meter lamps' },
    h('div', { class: 'meter-head' }, h('span', { class: 'meter-label' }, label), value),
    row, noteEl);
  container.replaceChildren(root);
  const bulbs = [...row.children];
  function update(used, message) {
    const left = Math.max(0, budget - used);
    value.innerHTML = `${fmt(left)}<small> / ${fmt(budget)} ${unit}</small>`;
    bulbs.forEach((bulb, i) => { bulb.className = i < left ? 'on' : 'off'; });
    root.dataset.state = left === 0 ? 'over' : left <= Math.max(1, budget * 0.25) ? 'warn' : 'ok';
    if (message !== undefined) noteEl.textContent = message;
  }
  update(0);
  return update;
}

const bubbles = new WeakMap();

/**
 * 小 AI 說話。avatar 是像素角色，換心情時同一隻會換表情，不會整個重畫。
 * mood：idle｜think｜happy｜proud｜shock｜sad
 */
export function aiSay(container, html, mood = 'idle') {
  let bubble = bubbles.get(container);
  if (!bubble || !container.contains(bubble.root)) {
    const avatar = aiAvatar({ size: 46, label: '小 AI' });
    const text = h('div', { class: 'ai-text' });
    const root = h('div', { class: 'ai-bubble' },
      h('div', { class: 'ai-avatar' }, avatar.el),
      h('div', {}, h('div', { class: 'ai-name' }, '小 AI'), text));
    container.replaceChildren(root);
    bubble = { root, avatar, text };
    bubbles.set(container, bubble);
  }
  bubble.text.innerHTML = html;
  bubble.avatar.setMood(mood);
  return bubble.avatar;
}

/**
 * 選擇題。答錯可以再選，直到答對為止。
 * 回傳 Promise，resolve 為 true 表示第一次就答對。
 */
export function quiz(container, { question, options, answer, explain }) {
  return new Promise(resolve => {
    let firstTry = true;
    const feedback = h('p', { class: 'feedback', hidden: true, role: 'status' });
    const buttons = options.map(option => h('button', {
      type: 'button',
      onclick: event => {
        const button = event.currentTarget;
        if (option === answer) {
          button.classList.add('correct');
          buttons.forEach(b => { b.disabled = b !== button; });
          feedback.dataset.tone = 'good';
          feedback.innerHTML = `✓ 答對了！${explain ? ' ' + explain : ''}`;
          feedback.hidden = false;
          resolve(firstTry);
        } else {
          firstTry = false;
          button.classList.add('wrong');
          button.disabled = true;
          feedback.dataset.tone = 'bad';
          feedback.textContent = '✗ 再想想看。';
          feedback.hidden = false;
        }
      }
    }, option));
    container.replaceChildren(h('div', { class: 'quiz' },
      h('p', { class: 'quiz-q' }, question),
      h('div', { class: 'quiz-options' }, buttons),
      feedback));
  });
}

/** 關卡進度條：steps 為名稱陣列，current 為目前索引。 */
export function renderStepper(container, steps, current) {
  container.replaceChildren(...steps.map((name, i) => h('li', {
    class: i < current ? 'done' : '',
    'aria-current': i === current ? 'step' : null
  }, h('b', {}, i < current ? '✓' : String(i + 1)), name)));
}

/** 等待一小段時間（動畫用）。 */
export const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
