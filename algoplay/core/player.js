// 步驟播放器：所有步驟事先算好放在陣列裡，上一步只是換一個索引。

export class Player {
  /**
   * @param {object} options
   * @param {(step: object, index: number, total: number) => void} options.onRender
   * @param {(ask: object, index: number) => Promise<void>} [options.onAsk] 進入有 ask 的步驟前呼叫（猜模式）
   * @param {() => void} [options.onEnd] 播到最後一步時呼叫
   */
  constructor({ onRender, onAsk = null, onEnd = null }) {
    this.onRender = onRender;
    this.onAsk = onAsk;
    this.onEnd = onEnd;
    this.steps = [];
    this.index = 0;
    this.maxReached = 0;
    this.speed = 1;
    this.playing = false;
    this.busy = false;
    this.bar = null;
  }

  load(steps) {
    this.pause();
    this.steps = steps;
    this.index = 0;
    this.maxReached = 0;
    this.render();
  }

  get atEnd() { return this.index >= this.steps.length - 1; }

  render() {
    if (!this.steps.length) return;
    this.maxReached = Math.max(this.maxReached, this.index);
    this.onRender(this.steps[this.index], this.index, this.steps.length);
    this.syncBar();
    if (this.atEnd) this.onEnd?.();
  }

  /** 前進一步；遇到提問會先等學生回答。回傳是否真的前進。 */
  async next() {
    if (this.busy || this.atEnd) return false;
    const target = this.index + 1;
    const ask = this.steps[target].ask;
    if (this.onAsk && ask && target > this.maxReached) {
      this.busy = true;
      const wasPlaying = this.playing;
      this.playing = false;
      this.syncBar();
      try { await this.onAsk(ask, target); } finally { this.busy = false; }
      if (wasPlaying) this.playing = true;
    }
    this.index = target;
    this.render();
    return true;
  }

  prev() {
    if (this.busy || this.index === 0) return;
    this.pause();
    this.index--;
    this.render();
  }

  seek(index) {
    if (this.busy) return;
    this.pause();
    const limit = this.onAsk ? this.maxReached : this.steps.length - 1;
    this.index = Math.max(0, Math.min(index, limit));
    this.render();
  }

  restart() {
    this.pause();
    this.index = 0;
    if (this.onAsk) this.maxReached = 0;
    this.render();
  }

  async play() {
    if (this.playing || this.busy) return;
    if (this.atEnd) { this.index = 0; this.render(); }
    this.playing = true;
    this.syncBar();
    while (this.playing && !this.atEnd) {
      await new Promise(resolve => setTimeout(resolve, 1100 / this.speed));
      if (!this.playing) break;
      await this.next();
    }
    this.playing = false;
    this.syncBar();
  }

  pause() {
    this.playing = false;
    this.syncBar();
  }

  toggle() { if (this.playing) this.pause(); else this.play(); }

  /** 綁定播放控制列：root 裡放 data-act 按鈕、range 與速度選單。 */
  bindBar(root) {
    this.bar = {
      play: root.querySelector('[data-act="play"]'),
      prev: root.querySelector('[data-act="prev"]'),
      next: root.querySelector('[data-act="next"]'),
      restart: root.querySelector('[data-act="restart"]'),
      timeline: root.querySelector('input[type="range"]'),
      speed: root.querySelector('select'),
      label: root.querySelector('[data-role="step-label"]')
    };
    const { play, prev, next, restart, timeline, speed } = this.bar;
    play.addEventListener('click', () => this.toggle());
    prev.addEventListener('click', () => this.prev());
    next.addEventListener('click', () => { this.pause(); this.next(); });
    restart.addEventListener('click', () => this.restart());
    timeline.addEventListener('input', () => this.seek(Number(timeline.value)));
    speed.addEventListener('change', () => { this.speed = Number(speed.value); });
    this.syncBar();
  }

  syncBar() {
    if (!this.bar) return;
    const { play, prev, next, timeline, label } = this.bar;
    play.textContent = this.playing ? '❚❚ 暫停' : '▶ 播放';
    play.setAttribute('aria-pressed', String(this.playing));
    prev.disabled = this.busy || this.index === 0;
    next.disabled = this.busy || this.atEnd;
    play.disabled = this.busy;
    timeline.max = Math.max(0, this.steps.length - 1);
    timeline.value = this.index;
    label.textContent = `第 ${this.steps.length ? this.index + 1 : 0} / ${this.steps.length} 步`;
  }
}

/** 空白鍵播放／暫停，← → 單步。輸入框、Blockly 裡不攔截。 */
export function bindKeys(getPlayer) {
  window.addEventListener('keydown', event => {
    const player = getPlayer();
    if (!player || event.altKey || event.ctrlKey || event.metaKey) return;
    const el = event.target;
    if (el.closest?.('input, textarea, select, [contenteditable], [role="tab"], .blocklyDiv, .injectionDiv')) return;
    if (event.key === ' ') {
      if (el.closest?.('button, a, summary')) return;
      event.preventDefault();
      player.toggle();
    }
    else if (event.key === 'ArrowRight') { event.preventDefault(); player.pause(); player.next(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); player.prev(); }
  });
}
