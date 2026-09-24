// 關卡的遊戲外框：固定一個視窗高，玩的時候不用捲動。
// 長說明改成進場的任務卡，揭曉改成結算畫面，兩個都在同一個框裡換。
import { h, wait, reducedMotion } from '../core/ui.js';

export function gameShell(root, { icon, place, title, steps = 4, logTitle = '紀錄', onExit }) {
  const dots = h('ol', { class: 'step-dots', 'aria-label': '關卡進度' },
    Array.from({ length: steps }, () => h('li', {})));
  const starBox = h('span', { class: 'bar-stars', 'aria-label': '這一關的星星：0 顆' });

  const stage = h('section', { class: 'panel stage', 'aria-label': '遊戲區' });
  const meterBox = h('div', { class: 'panel panel-pad side-meter' });
  const aiBox = h('div', { class: 'panel panel-pad side-ai', 'aria-live': 'polite' });
  const logCount = h('span');
  const log = h('ol', { class: 'guess-log' });
  const logBox = h('section', { class: 'panel panel-pad side-log' },
    h('div', { class: 'panel-title' }, h('h2', {}, logTitle), logCount), log);

  const body = h('div', { class: 'game-body' },
    stage,
    h('aside', { class: 'game-side' }, meterBox, aiBox, logBox));
  const result = h('div', { class: 'result-screen', hidden: true });
  const briefLayer = h('div', { class: 'brief-layer' });

  root.replaceChildren(h('div', { class: 'game' },
    h('div', { class: 'game-bar' },
      h('button', { class: 'icon-back', type: 'button', 'aria-label': '回小鎮', onclick: onExit }, '←'),
      h('span', { class: 'bar-name' }, `${icon} ${place}`),
      h('span', { class: 'bar-title' }, title),
      dots, starBox),
    body, result, briefLayer));

  return {
    stage, meterBox, aiBox, log, logCount,

    /** 頂條上的小圓點。 */
    setStep(index) {
      [...dots.children].forEach((dot, i) => {
        dot.className = i < index ? 'done' : '';
        if (i === index) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
    },

    setStars(count, max = 3) {
      starBox.replaceChildren(h('b', {}, '★'.repeat(count)), '★'.repeat(max - count));
      starBox.setAttribute('aria-label', `這一關的星星：${count} 顆`);
    },

    /** 進場的任務卡：說明放這裡，玩的畫面就不用擠。 */
    briefing({ lines = [], goal, action = '開始' } = {}) {
      return new Promise(resolve => {
        const button = h('button', { class: 'primary brief-go', type: 'button', onclick: close }, action);
        briefLayer.replaceChildren(h('div', { class: 'brief-card', role: 'dialog', 'aria-label': `${place}：${title}` },
          h('p', { class: 'eyebrow' }, `${icon} ${place}`),
          h('h1', {}, title),
          lines.map(line => h('p', { class: 'brief-line', html: line })),
          goal ? h('p', { class: 'brief-goal' }, goal) : null,
          button));
        briefLayer.classList.add('on');
        button.focus({ preventScroll: true });
        function close() {
          briefLayer.classList.remove('on');
          setTimeout(() => briefLayer.replaceChildren(), 320);
          resolve();
        }
      });
    },

    /** 舞台中央的大字提示，例如比賽前的倒數。 */
    async flash(texts) {
      if (reducedMotion()) return;
      const el = h('div', { class: 'stage-flash', 'aria-hidden': 'true' });
      stage.append(el);
      for (const text of texts) {
        el.replaceChildren(h('span', {}, text));
        el.classList.remove('go');
        void el.offsetWidth;                 // 重新觸發動畫
        el.classList.add('go');
        await wait(620);
      }
      el.remove();
    },

    /** 把玩的畫面換成結算畫面，回傳可以填內容的容器。 */
    finish() {
      body.hidden = true;
      result.hidden = false;
      result.scrollTop = 0;
      return result;
    }
  };
}
