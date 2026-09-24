// 小鎮與關卡共用的像素角色：小 AI 和老師。
// 畫法跟 town/sprites.js 一樣：16×16 的格子、純 fillRect、整數座標，再用 CSS 放大。
// 同一份程式碼同時畫在小鎮的畫布上和關卡的頭像裡，兩邊才會是同一隻。

export const CAST = 16;

const px = (ctx, x, y, w, h, colour) => { ctx.fillStyle = colour; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };

const AI = {
  outline: '#0c1018',
  shell: '#2b3446', shellLight: '#3d4a63', shellDark: '#1e2431',
  visor: '#0e1420',
  eye: '#6dd5ed', eyeDim: '#3f7f92', eyeHot: '#ff8192',
  mouth: '#8fe3f5', mouthDim: '#4a5570',
  chest: '#f1bd62',
  antenna: '#6dd5ed'
};

const TEACHER = {
  outline: '#0c1018',
  skin: '#ffd9ae', skinDark: '#d9a97e',
  hair: '#453247', hairLight: '#5b4460',
  shirt: '#63d6ad', shirtDark: '#3f9e80',
  glass: '#cfe0fb', glassDark: '#8fa6c6',
  eye: '#1b1d2b', mouth: '#b4586a'
};

/**
 * 小 AI：浮在空中的小機器人。
 * mood：idle 平常｜think 思考｜happy 開心｜proud 得意｜shock 傻眼｜sad 洩氣
 * look：眼睛往哪邊看（-1 左、0 前、1 右），小鎮裡用來「轉頭看你」。
 */
export function drawAI(ctx, ox, oy, { mood = 'idle', time = 0, look = 0 } = {}) {
  const bob = Math.round(Math.sin(time / 520) * 1);
  const y = oy + bob;
  const sad = mood === 'sad';
  const shock = mood === 'shock';

  // 浮在空中，所以影子會跟著脹縮
  ctx.globalAlpha = 0.3 - bob * 0.07;
  px(ctx, ox + 4 + (bob > 0 ? 1 : 0), oy + 15, 8 - (bob > 0 ? 2 : 0), 1, '#000000');
  ctx.globalAlpha = 1;

  // 天線：傻眼會變紅，思考會閃，洩氣會垂下來
  const ball = shock ? AI.eyeHot : mood === 'think' && Math.sin(time / 170) > 0 ? '#ffffff' : AI.antenna;
  if (sad) {
    px(ctx, ox + 8, y + 3, 1, 1, AI.shellLight);
    px(ctx, ox + 9, y + 2, 2, 2, ball);
  } else {
    px(ctx, ox + 8, y + 2, 1, 2, AI.shellLight);
    px(ctx, ox + 7, y, 2, 2, ball);
  }

  // 頭（外框在外圈，圓角是靠上下兩排縮排做出來的）
  px(ctx, ox + 4, y + 3, 8, 1, AI.outline);
  px(ctx, ox + 2, y + 4, 12, 8, AI.outline);
  px(ctx, ox + 4, y + 4, 8, 1, AI.shellLight);
  px(ctx, ox + 3, y + 5, 10, 6, AI.shell);
  px(ctx, ox + 4, y + 11, 8, 1, AI.shellDark);
  // 兩側的螺絲
  px(ctx, ox + 2, y + 7, 1, 2, AI.shellLight);
  px(ctx, ox + 13, y + 7, 1, 2, AI.shellLight);

  // 面板
  px(ctx, ox + 4, y + 6, 8, 4, AI.visor);
  drawEyes(ctx, ox + look, y, mood, time);
  drawMouth(ctx, ox, y, mood);

  // 身體與手
  px(ctx, ox + 3, y + 12, 10, 3, AI.outline);
  px(ctx, ox + 4, y + 12, 8, 2, AI.shell);
  px(ctx, ox + 4, y + 14, 8, 1, AI.shellDark);
  px(ctx, ox + 2, y + 12, 1, 2, AI.shellDark);
  px(ctx, ox + 13, y + 12, 1, 2, AI.shellDark);
  // 胸口的燈會呼吸
  ctx.globalAlpha = sad ? 0.3 : 0.55 + Math.sin(time / (mood === 'proud' ? 220 : 430)) * 0.45;
  px(ctx, ox + 7, y + 12, 2, 2, shock ? AI.eyeHot : AI.chest);
  ctx.globalAlpha = 1;
}

function drawEyes(ctx, ox, y, mood, time) {
  if (mood === 'shock') {
    px(ctx, ox + 4, y + 6, 3, 3, AI.eye);
    px(ctx, ox + 5, y + 7, 1, 1, AI.visor);
    px(ctx, ox + 9, y + 6, 3, 3, AI.eye);
    px(ctx, ox + 10, y + 7, 1, 1, AI.visor);
    return;
  }
  if (mood === 'happy' || mood === 'proud') {           // ^ ^
    px(ctx, ox + 5, y + 7, 2, 1, AI.eye);
    px(ctx, ox + 4, y + 8, 1, 1, AI.eye);
    px(ctx, ox + 7, y + 8, 1, 1, AI.eye);
    px(ctx, ox + 9, y + 7, 2, 1, AI.eye);
    px(ctx, ox + 8, y + 8, 1, 1, AI.eye);
    px(ctx, ox + 11, y + 8, 1, 1, AI.eye);
    return;
  }
  if (mood === 'sad') {
    px(ctx, ox + 5, y + 8, 2, 1, AI.eyeDim);
    px(ctx, ox + 9, y + 8, 2, 1, AI.eyeDim);
    return;
  }
  if (mood === 'think') {
    px(ctx, ox + 5, y + 7, 2, 2, AI.eye);
    px(ctx, ox + 9, y + 8, 2, 1, AI.eye);
    return;
  }
  const blink = time % 3600 < 130;                      // 偶爾眨一下眼
  px(ctx, ox + 5, y + (blink ? 8 : 7), 2, blink ? 1 : 2, AI.eye);
  px(ctx, ox + 9, y + (blink ? 8 : 7), 2, blink ? 1 : 2, AI.eye);
}

function drawMouth(ctx, ox, y, mood) {
  if (mood === 'happy') px(ctx, ox + 6, y + 10, 4, 1, AI.mouth);
  else if (mood === 'proud') px(ctx, ox + 7, y + 10, 3, 1, AI.mouth);
  else if (mood === 'shock') px(ctx, ox + 7, y + 10, 2, 1, AI.eyeHot);
  else if (mood === 'sad') px(ctx, ox + 6, y + 10, 4, 1, AI.mouthDim);
}

/**
 * 老師：終極密碼的出題者，半身像。
 * mood：idle 平常｜small 答案更大（往上指）｜big 答案更小（往下指）｜hit 猜中了｜out 次數用完
 */
export function drawTeacher(ctx, ox, oy, { mood = 'idle', time = 0 } = {}) {
  const nod = mood === 'hit' && Math.sin(time / 180) > 0 ? 1 : 0;
  const y = oy + nod;

  // 肩膀
  px(ctx, ox + 1, y + 12, 14, 4, TEACHER.outline);
  px(ctx, ox + 2, y + 12, 12, 4, TEACHER.shirt);
  px(ctx, ox + 2, y + 15, 12, 1, TEACHER.shirtDark);
  px(ctx, ox + 6, y + 12, 4, 2, TEACHER.skin);          // 脖子與領口
  px(ctx, ox + 6, y + 13, 4, 1, TEACHER.shirtDark);

  // 頭髮（包含頭頂的髮髻）
  px(ctx, ox + 6, y, 4, 2, TEACHER.hair);
  px(ctx, ox + 3, y + 1, 10, 3, TEACHER.outline);
  px(ctx, ox + 3, y + 2, 10, 2, TEACHER.hair);
  px(ctx, ox + 4, y + 2, 8, 1, TEACHER.hairLight);
  px(ctx, ox + 2, y + 4, 2, 7, TEACHER.hair);
  px(ctx, ox + 12, y + 4, 2, 7, TEACHER.hair);

  // 臉
  px(ctx, ox + 4, y + 4, 8, 8, TEACHER.outline);
  px(ctx, ox + 4, y + 4, 8, 7, TEACHER.skin);
  px(ctx, ox + 4, y + 10, 8, 1, TEACHER.skinDark);

  // 眼鏡
  px(ctx, ox + 4, y + 6, 3, 3, TEACHER.glass);
  px(ctx, ox + 9, y + 6, 3, 3, TEACHER.glass);
  px(ctx, ox + 7, y + 7, 2, 1, TEACHER.glassDark);
  const wink = mood === 'hit';
  px(ctx, ox + 5, y + 7, 1, wink ? 1 : 2, TEACHER.eye);
  px(ctx, ox + 10, y + 7, 1, wink ? 1 : 2, TEACHER.eye);

  // 嘴巴
  if (mood === 'hit') { px(ctx, ox + 6, y + 10, 4, 1, TEACHER.mouth); px(ctx, ox + 5, y + 9, 1, 1, TEACHER.mouth); px(ctx, ox + 10, y + 9, 1, 1, TEACHER.mouth); }
  else if (mood === 'out') px(ctx, ox + 6, y + 10, 4, 1, TEACHER.mouth);
  else px(ctx, ox + 7, y + 10, 2, 1, TEACHER.mouth);

  // 手：往上指＝答案更大，往下指＝答案更小
  if (mood === 'small' || mood === 'big') {
    const up = mood === 'small';
    px(ctx, ox + 13, y + 11, 2, 3, TEACHER.shirt);
    px(ctx, ox + 13, y + (up ? 7 : 12), 2, 4, TEACHER.skin);
    const tip = up ? y + 5 : y + 15;
    px(ctx, ox + 13, tip, 2, 2, TEACHER.skin);
    const blink = Math.sin(time / 260) > 0 ? 1 : 0;
    px(ctx, ox + 12, tip + (up ? -1 - blink : 2 + blink), 4, 1, TEACHER.glass);
  }
}

/**
 * 把上面的角色做成會動的頭像元素。
 * 元素從畫面上被移掉時會自己停下來，不用手動清理。
 */
export function pixelAvatar(draw, { size = 48, mood = 'idle', label = '' } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = CAST;
  canvas.height = CAST;
  canvas.className = 'pixel-avatar';
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  if (label) { canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', label); }
  else canvas.setAttribute('aria-hidden', 'true');

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let current = mood;
  let running = true;
  let seen = false;

  function frame(now) {
    if (!running) return;
    if (canvas.isConnected) seen = true;
    else if (seen) { running = false; return; }
    ctx.clearRect(0, 0, CAST, CAST);
    draw(ctx, 0, 0, { mood: current, time: now });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    el: canvas,
    setMood(next) { current = next; },
    get mood() { return current; },
    stop() { running = false; }
  };
}

export const aiAvatar = (options = {}) => pixelAvatar(drawAI, { label: '小 AI', ...options });
export const teacherAvatar = (options = {}) => pixelAvatar(drawTeacher, { label: '老師', ...options });
