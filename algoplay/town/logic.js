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

/** 路線上每一段的距離，用來說明「哪一段特別長」。 */
export function routeLegs(start, spots, order) {
  const legs = [];
  let here = start;
  for (const index of order) {
    legs.push(distanceKm(here, spots[index]));
    here = spots[index];
  }
  return legs;
}

/**
 * 「照地圖繞一圈」：以所有地點的重心當圓心，從學校的方位開始一路繞過去，不走回頭路。
 * 兩個方向都算，回傳比較短的那一邊——人也會挑順手的方向繞。
 */
export function sweepRoute(start, spots) {
  const all = [start, ...spots];
  const cx = all.reduce((sum, p) => sum + p.x, 0) / all.length;
  const cy = all.reduce((sum, p) => sum + p.y, 0) / all.length;
  const from = Math.atan2(start.y - cy, start.x - cx);
  const oneWay = dir => {
    const angle = point => {
      let a = (Math.atan2(point.y - cy, point.x - cx) - from) * dir;
      while (a < 0) a += Math.PI * 2;
      return a;
    };
    const order = spots.map((_, i) => i).sort((i, j) => angle(spots[i]) - angle(spots[j]));
    return { order, length: routeLength(start, spots, order) };
  };
  const clockwise = oneWay(1);
  const anti = oneWay(-1);
  return clockwise.length <= anti.length ? clockwise : anti;
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

/**
 * 把所有順序試一遍，但可以分批做：每次呼叫 step(limit) 最多檢查 limit 條，
 * UI 才不會整個卡住，學生也才看得到進度條爬不動的樣子。
 *
 * 用 Heap 演算法就地交換產生排列，不另外配置陣列，
 * 所以量到的速度就是這台電腦真正的速度，不是假的。
 */
export function bruteForceRunner(start, spots) {
  const n = spots.length;
  const order = Array.from({ length: n }, (_, i) => i);
  const counters = new Array(n).fill(0);
  let level = 1;
  let firstOne = true;
  let done = n === 0;
  let checked = 0;
  let best = null;

  /** 就地換成下一個排列；已經沒有下一個時回傳 false。 */
  function advance() {
    if (firstOne) { firstOne = false; return true; }
    while (level < n) {
      if (counters[level] < level) {
        const swap = level % 2 === 0 ? 0 : counters[level];
        [order[swap], order[level]] = [order[level], order[swap]];
        counters[level]++;
        level = 1;
        return true;
      }
      counters[level] = 0;
      level++;
    }
    return false;
  }

  return {
    total: factorial(n),
    get checked() { return checked; },
    get best() { return best; },
    get done() { return done; },
    /** 檢查最多 limit 條路線，回傳這一批實際檢查了幾條。 */
    step(limit) {
      let count = 0;
      while (count < limit) {
        if (!advance()) { done = true; break; }
        count++;
        checked++;
        const length = routeLength(start, spots, order);
        if (!best || length < best.length) best = { order: [...order], length };
      }
      return count;
    }
  };
}

/**
 * 隨機抽一張「有教學意義」的地圖給破關後的無上限挑戰：
 * 最短路線唯一、兩個規則都找不到它、最短路線的第一站不是離學校最近的那個，
 * 而且要留下夠多條比規則更短的路線，學生才贏得了。
 * 抽不到就回傳 null，呼叫端再試一次。
 */
export function randomTripMap({ start, count = 5, area, rng = Math.random, tries = 300 }) {
  const { x0, x1, y0, y1, gap = 100 } = area;
  for (let attempt = 0; attempt < tries; attempt++) {
    const spots = [];
    let placed = true;
    for (let i = 0; i < count; i++) {
      let point = null;
      for (let t = 0; t < 60; t++) {
        const candidate = { x: Math.round(x0 + rng() * (x1 - x0)), y: Math.round(y0 + rng() * (y1 - y0)) };
        if ([start, ...spots].every(other => Math.hypot(candidate.x - other.x, candidate.y - other.y) >= gap)) {
          point = candidate;
          break;
        }
      }
      if (!point) { placed = false; break; }
      spots.push(point);
    }
    if (!placed) continue;

    const lengths = [];
    for (const order of permutations(count)) lengths.push(routeLength(start, spots, order));
    lengths.sort((a, b) => a - b);
    const shortest = lengths[0];
    if (lengths[1] === shortest) continue;                       // 最短的要唯一

    const best = bestRoute(start, spots);
    const near = nearestRoute(start, spots);
    const sweep = sweepRoute(start, spots);
    const ruleBest = Math.min(near.length, sweep.length);
    if (near.length < shortest * 1.15) continue;                 // 最近優先要明顯輸
    if (sweep.length < shortest * 1.05) continue;                // 繞一圈也不能剛好最短
    if (best.order[0] === near.order[0]) continue;               // 最短的第一站 ≠ 最近的那個
    if (lengths.filter(km => km < ruleBest).length < 5) continue; // 要留得下贏的空間

    return { spots, best, nearest: near, sweep, ruleBest };
  }
  return null;
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
