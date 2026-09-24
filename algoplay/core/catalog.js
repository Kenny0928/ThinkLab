// 城鎮建築、演算法圖鑑與模組清單。首頁與各關卡共用。

export const HELLO_ALGO = 'https://www.hello-algo.com/zh-hant/';

export const BUILDINGS = [
  {
    id: 'guess', icon: '🎉', place: '教室', title: '終極密碼',
    question: '1～100 萬，最少幾次能猜中？', resource: '猜的次數',
    href: 'town/index.html#guess', dex: 'binary-search', tone: 'school',
    why: '同一個問題，方法不同，花的資源差很多。'
  },
  {
    id: 'coins', icon: '🏪', place: '便利商店', title: '找零錢',
    question: '找零時，怎樣用最少的硬幣？', resource: '硬幣數量',
    href: 'town/index.html#coins', dex: 'greedy', tone: 'shop',
    why: '直覺的方法不一定對，要能找出反例。'
  },
  {
    id: 'trip', icon: '🧳', place: '旅行社', title: '畢旅路線',
    question: '景點全部走一遍，哪條路最短？', resource: '計算時間',
    href: 'town/index.html#trip', dex: 'brute-force', tone: 'travel',
    why: '電腦再快，也救不了太笨的方法。'
  }
];

export const COMING_SOON = [
  { id: 'fire', icon: '🚒', place: '消防隊', title: '逃生路線', tone: 'fire' },
  { id: 'bag', icon: '🎒', place: '畢旅行李', title: '行李箱', tone: 'bag' },
  { id: 'art', icon: '🎨', place: '美術教室', title: '油漆桶', tone: 'art' },
  { id: 'drink', icon: '🧋', place: '飲料店', title: '排隊叫號', tone: 'drink' }
];

export const DEX = [
  { id: 'binary-search', icon: '🔍', name: '二分搜尋', text: '每次看中間，範圍就少一半。', from: '🎉 教室' },
  { id: 'greedy', icon: '🪙', name: '貪婪演算法', text: '每一步都先拿眼前最好的，但不一定對。', from: '🏪 便利商店' },
  { id: 'brute-force', icon: '🧮', name: '窮舉', text: '把所有可能都試一遍，保證找到，但可能算不完。', from: '🧳 旅行社' },
  { id: 'bfs', icon: '🌊', name: '廣度優先搜尋', from: '🚒 消防隊' },
  { id: 'dp', icon: '📋', name: '動態規劃', from: '🎒 畢旅行李' },
  { id: 'flood-fill', icon: '🪣', name: '連通區塊', from: '🎨 美術教室' },
  { id: 'queue', icon: '🎫', name: '佇列', from: '🧋 飲料店' }
];

export const MODULES = [
  {
    id: 'binary-search', icon: '🔍', name: '二分搜尋', href: 'modules/binary-search/index.html',
    text: '看指標怎麼移動、猜下一步、自己找，最後教機器人玩終極密碼。',
    judge: ['016', '180', '204']
  },
  { id: 'basic-sort', icon: '📶', name: '基礎排序', text: '氣泡、選擇、插入排序，比一比誰比較省。', soon: true },
  { id: 'bfs-maze', icon: '🌊', name: 'BFS 走迷宮', text: '在地圖上一層一層往外找最近的出口。', soon: true }
];
