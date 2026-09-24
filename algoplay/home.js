// 演算法遊樂場首頁：兩個選單，各配一張會動的預覽圖。
import { $, h } from './core/ui.js';
import { loadProgress } from './core/progress.js';
import { BUILDINGS, COMING_SOON, DEX, MODULES, HELLO_ALGO } from './core/catalog.js';
import { createScene } from './town/scene.js';
import { createBarsPreview } from './core/preview.js';

const TEACHER_ROWS = [
  ['🎉 教室', '終極密碼', '方法不同，花的資源差很多', '二分搜尋、O(log n)',
    [['二分搜尋', 'chapter_searching/binary_search/'], ['時間複雜度', 'chapter_computational_complexity/time_complexity/']], '016、180、204'],
  ['🏪 便利商店', '找零錢', '直覺的方法不一定對', '貪婪演算法與反例、動態規劃',
    [['貪婪演算法', 'chapter_greedy/greedy_algorithm/'], ['零錢兌換問題', 'chapter_dynamic_programming/unbounded_knapsack_problem/']], '192、188、189'],
  ['🧳 旅行社', '畢旅路線', '電腦再快，也救不了太笨的方法', '窮舉、組合爆炸、O(n!)',
    [['時間複雜度', 'chapter_computational_complexity/time_complexity/'], ['全排列問題', 'chapter_backtracking/permutations_problem/']], '—']
];

const town = createScene($('#town-preview'));
createBarsPreview($('#motion-preview'));

/** 兩個選單下面那一行小字：只寫進度，不寫說明。 */
function renderMeta() {
  const progress = loadProgress();

  const states = {};
  for (const building of BUILDINGS) {
    const record = progress.town[building.id];
    states[building.id] = {
      tone: building.tone,
      state: record?.done ? 'done' : 'open',
      stars: record?.stars?.length || 0,
      visited: Boolean(record)
    };
  }
  for (const building of COMING_SOON) states[building.id] = { tone: building.tone, state: 'soon' };
  const found = DEX.filter(entry => progress.dex[entry.id]).length;
  states.dex = { found };
  town.setStates(states);

  const cleared = BUILDINGS.filter(b => progress.town[b.id]?.done).length;
  $('#town-meta').replaceChildren(
    cleared ? h('span', { class: 'on' }, `已破 ${cleared} / ${BUILDINGS.length} 關`) : `${BUILDINGS.length} 關`,
    ` · 圖鑑 ${found} / ${DEX.length}`);

  const ready = MODULES.filter(m => !m.soon);
  const played = ready.filter(m => progress.modules[m.id]).length;
  $('#motion-meta').textContent = played
    ? `${ready.length} 個模組 · 玩過 ${played} 個`
    : `${ready.length} 個模組 · 陸續增加中`;
}

/* ---------- 給老師 ---------- */
const dialog = $('#teacher-dialog');

$('#teacher-rows').replaceChildren(...TEACHER_ROWS.map(([place, title, why, algo, reads, judge]) => h('tr', {},
  h('td', {}, place), h('td', {}, title), h('td', {}, why), h('td', {}, algo),
  h('td', {}, reads.flatMap(([name, path], i) => [i ? '、' : '', h('a', { href: HELLO_ALGO + path, target: '_blank', rel: 'noopener' }, name)])),
  h('td', {}, judge))));

$('#teacher-open').addEventListener('click', () => dialog.showModal());
$('#teacher-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

$('#reset-progress').addEventListener('click', () => {
  if (!confirm('確定要清除這台電腦上的進度嗎？星星和圖鑑都會重來。')) return;
  try {
    localStorage.removeItem('thinklab_algoplay_v1');
    localStorage.removeItem('thinklab_algoplay_robot_v1');
  } catch { /* 無法存取時沒有東西要清 */ }
  $('#reset-note').textContent = '已清除。';
  renderMeta();
});

renderMeta();
