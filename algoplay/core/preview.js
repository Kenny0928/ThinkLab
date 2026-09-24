// 首頁「會動的演算法」選單上的預覽：一直跑的排序動畫。
// 像素風格、配色都跟小鎮同一套，只是畫面小、沒有互動。

const W = 384, H = 256;
const N = 11, BAR_W = 24, GAP = 6;
const LEFT = Math.round((W - (N * (BAR_W + GAP) - GAP)) / 2);
const BASE = 222, TOP = 44;
const STEP = 150;    // 比一次要多久
const REST = 1400;   // 排好之後停多久再重來一輪

const COLOURS = {
  idle: ['#2a4c85', '#4b7de7'],
  active: ['#7a5a22', '#f1bd62'],
  sorted: ['#215347', '#63d6ad']
};

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = p => (p < 0.5 ? 2 * p * p : 1 - ((-2 * p + 2) ** 2) / 2);
const xAt = index => LEFT + index * (BAR_W + GAP);

export function createBarsPreview(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  let values = [];
  let cursor = 0;      // 正在比第 cursor 和第 cursor + 1 根
  let pass = 0;        // 已經跑完幾輪，最後 pass 根就排好了
  let swapping = false;
  let moved = false;   // 這一輪有沒有換過，都沒換就是排好了
  let done = false;
  let tickStart = 0;
  let restUntil = 0;
  let running = true;

  function shuffle() {
    values = Array.from({ length: N }, (_, k) => k + 1);
    for (let k = values.length - 1; k > 0; k--) {
      const r = Math.floor(Math.random() * (k + 1));
      [values[k], values[r]] = [values[r], values[k]];
    }
    cursor = 0;
    pass = 0;
    moved = false;
    done = false;
    swapping = values[0] > values[1];
  }

  function advance() {
    if (swapping) {
      [values[cursor], values[cursor + 1]] = [values[cursor + 1], values[cursor]];
      moved = true;
    }
    cursor++;
    if (cursor >= N - 1 - pass) {
      cursor = 0;
      pass++;
      if (!moved || pass >= N - 1) done = true;
      moved = false;
    }
    swapping = !done && values[cursor] > values[cursor + 1];
  }

  /* ---------- 畫面 ---------- */
  function bar(x, value, kind) {
    const [body, cap] = COLOURS[kind];
    const height = Math.round((value / N) * (BASE - TOP));
    const y = BASE - height;
    ctx.fillStyle = body;
    ctx.fillRect(x, y, BAR_W, height);
    ctx.fillStyle = cap;
    ctx.fillRect(x, y, BAR_W, 4);
  }

  /** 正在比的兩根底下畫一條底線，眼睛才跟得上。 */
  function pointer(x) {
    const width = BAR_W * 2 + GAP + 8;
    ctx.fillStyle = COLOURS.active[1];
    for (let row = 0; row < 4; row++) ctx.fillRect(x + row * 3, BASE + 10 + row * 2, width - row * 6, 2);
  }

  function draw(progress) {
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let y = TOP; y < BASE; y += 26) ctx.fillRect(LEFT - 10, y, W - (LEFT - 10) * 2, 1);
    ctx.fillStyle = '#1b2331';
    ctx.fillRect(LEFT - 10, BASE, W - (LEFT - 10) * 2, 2);

    const eased = ease(progress);
    for (let k = 0; k < N; k++) {
      const settled = done || k >= N - pass;
      const active = !settled && (k === cursor || k === cursor + 1);
      if (active && swapping) continue;   // 交換中的兩根等一下再畫
      bar(xAt(k), values[k], settled ? 'sorted' : active ? 'active' : 'idle');
    }
    if (!done && swapping) {
      // 交換中：兩根就地長高、變矮，換過去。不用交錯走位，才不會疊在一起看不懂
      const [left, right] = [values[cursor], values[cursor + 1]];
      bar(xAt(cursor), left + (right - left) * eased, 'active');
      bar(xAt(cursor + 1), right + (left - right) * eased, 'active');
    }
    if (!done) pointer(xAt(cursor) - 2);
  }

  function frame(now) {
    if (!running) return;
    if (done) {
      if (!restUntil) restUntil = now + REST;
      else if (now >= restUntil) { restUntil = 0; shuffle(); tickStart = now; }
    } else if (now - tickStart >= STEP) {
      advance();
      tickStart = now;
    }
    draw(done ? 1 : Math.min(1, (now - tickStart) / STEP));
    requestAnimationFrame(frame);
  }

  shuffle();
  if (reduced()) {
    // 不播動畫：直接畫一張排到一半的靜態圖
    for (let step = 0; step < 24 && !done; step++) advance();
    draw(1);
  } else {
    tickStart = performance.now();
    requestAnimationFrame(frame);
  }

  return { stop() { running = false; } };
}
