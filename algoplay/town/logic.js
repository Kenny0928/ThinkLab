// 城鎮關卡的純邏輯：不碰 DOM，可用 node --test 檢查。

/* ---------- 🎉 終極密碼 ---------- */

/** 回答猜測：'small' 表示猜得太小、'big' 表示太大、'hit' 表示猜中。 */
export function answerFor(secret, guess) {
  if (guess === secret) return 'hit';
  return guess < secret ? 'small' : 'big';
}

/** 範圍內有 n 個數，每次猜中間，最多要猜幾次。 */
export function maxGuesses(n) {
  return Math.ceil(Math.log2(n + 1));
}

/** 每次猜中間、運氣最差時，每一次猜之前還剩幾個數。例如 100 → [100, 50, 25, 12, 6, 3, 1]。 */
export function halvingChain(n) {
  const chain = [];
  for (let left = n; left >= 1; left = Math.floor(left / 2)) chain.push(left);
  return chain;
}

/** 一個一個猜（從最小值開始）要猜幾次。 */
export function linearGuesses(min, secret) {
  return secret - min + 1;
}

/* ---------- 🏪 找零錢 ---------- */

/** 每次都先拿最大的硬幣。找不開時回傳 null。 */
export function greedyChange(coins, amount) {
  const sorted = [...coins].sort((a, b) => b - a);
  const picked = [];
  let left = amount;
  for (const coin of sorted) {
    while (left >= coin) { picked.push(coin); left -= coin; }
  }
  return left === 0 ? picked : null;
}

/** 用動態規劃算出最少硬幣的組合。找不開時回傳 null。 */
export function minChange(coins, amount) {
  const best = new Array(amount + 1).fill(Infinity);
  const last = new Array(amount + 1).fill(0);
  best[0] = 0;
  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (coin <= a && best[a - coin] + 1 < best[a]) {
        best[a] = best[a - coin] + 1;
        last[a] = coin;
      }
    }
  }
  if (best[amount] === Infinity) return null;
  const picked = [];
  for (let a = amount; a > 0; a -= last[a]) picked.push(last[a]);
  return picked.sort((x, y) => y - x);
}

/* ---------- 🧳 畢旅路線 ---------- */

/** 兩地距離（公里），畫面座標每 10 單位算 1 公里，四捨五入到整數。 */
export function distanceKm(a, b) {
  return Math.round(Math.hypot(a.x - b.x, a.y - b.y) / 10);
}

/** 從起點出發，依 order（景點索引）走完的總距離。 */
export function routeLength(start, spots, order) {
  let total = 0;
  let here = start;
  for (const index of order) {
    total += distanceKm(here, spots[index]);
    here = spots[index];
  }
  return total;
}

/** 依序產生 0..n-1 的所有排列。 */
export function* permutations(n) {
  const order = Array.from({ length: n }, (_, i) => i);
  function* walk(k) {
    if (k === n) { yield [...order]; return; }
    for (let i = k; i < n; i++) {
      [order[k], order[i]] = [order[i], order[k]];
      yield* walk(k + 1);
      [order[k], order[i]] = [order[i], order[k]];
    }
  }
  yield* walk(0);
}

/** 窮舉所有順序，找出最短路線。 */
export function bestRoute(start, spots) {
  let best = null;
  let count = 0;
  for (const order of permutations(spots.length)) {
    count++;
    const length = routeLength(start, spots, order);
    if (!best || length < best.length) best = { order, length };
  }
  return { ...best, count };
}

/** 每次都去最近、還沒去過的景點。 */
export function nearestRoute(start, spots) {
  const left = new Set(spots.map((_, i) => i));
  const order = [];
  let here = start;
  while (left.size) {
    let pick = null;
    for (const i of left) {
      if (pick === null || distanceKm(here, spots[i]) < distanceKm(here, spots[pick])) pick = i;
    }
    order.push(pick);
    left.delete(pick);
    here = spots[pick];
  }
  return { order, length: routeLength(start, spots, order) };
}

export function factorial(n) {
  let result = 1n;
  for (let i = 2n; i <= BigInt(n); i++) result *= i;
  return result;
}

const UNITS = [[10n ** 20n, '垓'], [10n ** 16n, '京'], [10n ** 12n, '兆'], [10n ** 8n, '億'], [10n ** 4n, '萬']];

/** 大數字轉成「約 243 京」這種說法；一萬以下直接顯示。 */
export function chineseAmount(value) {
  const big = BigInt(value);
  for (const [size, name] of UNITS) {
    if (big >= size) {
      const whole = big / size;
      if (whole >= 10000n) return `${chineseAmount(whole)}${name}`.replace(/^約 /, '約 ');
      return `約 ${whole.toLocaleString('zh-TW')} ${name}`;
    }
  }
  return big.toLocaleString('zh-TW');
}

const YEAR = 365.25 * 24 * 3600;

/** 把秒數換成孩子看得懂的時間。 */
export function humanDuration(seconds) {
  if (seconds < 1) return '不到 1 秒';
  if (seconds < 60) return `${Math.round(seconds)} 秒`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} 分鐘`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} 小時`;
  if (seconds < YEAR) return `${Math.round(seconds / 86400)} 天`;
  const years = seconds / YEAR;
  if (years < 10000) return `${Math.round(years).toLocaleString('zh-TW')} 年`;
  if (years < 1e8) return `${Math.round(years / 1e4).toLocaleString('zh-TW')} 萬年`;
  return `${Math.round(years / 1e8).toLocaleString('zh-TW')} 億年`;
}

/** n 個景點、電腦每秒檢查 speed 條路線，要花幾秒。 */
export function bruteForceSeconds(n, speed) {
  return Number(factorial(n)) / speed;
}

/** 在 speed 下，要算超過一年的最少景點數。 */
export function firstSpotsOverAYear(speed) {
  for (let n = 1; n < 40; n++) if (bruteForceSeconds(n, speed) > YEAR) return n;
  return null;
}
