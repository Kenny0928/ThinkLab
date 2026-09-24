// 學習進度只存在學生自己的瀏覽器。讀不到或存不進去時照常運作，只是不保留進度。

const KEY = 'thinklab_algoplay_v1';

function empty() {
  return { town: {}, modules: {}, dex: {} };
}

export function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!data || typeof data !== 'object') return empty();
    return { town: data.town || {}, modules: data.modules || {}, dex: data.dex || {} };
  } catch {
    return empty();
  }
}

function save(progress) {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* 私密視窗等情況 */ }
}

/** 城鎮建築：記錄拿到的星星（保留最高紀錄）與是否破關。 */
export function saveBuilding(id, { stars, done }) {
  const progress = loadProgress();
  const old = progress.town[id] || { stars: [] };
  const merged = new Set([...(old.stars || []), ...stars]);
  progress.town[id] = { stars: [...merged].sort(), done: old.done || done };
  save(progress);
  return progress.town[id];
}

/** 模組的某個模式：value 越大越好，保留最高紀錄。 */
export function saveModule(id, mode, value) {
  const progress = loadProgress();
  const mod = progress.modules[id] || {};
  mod[mode] = Math.max(mod[mode] || 0, value);
  progress.modules[id] = mod;
  save(progress);
  return mod;
}

/** 解鎖圖鑑；回傳 true 表示這次是第一次解鎖。 */
export function unlockDex(id) {
  const progress = loadProgress();
  if (progress.dex[id]) return false;
  progress.dex[id] = new Date().toISOString().slice(0, 10);
  save(progress);
  return true;
}
