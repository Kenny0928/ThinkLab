// 二分搜尋與線性搜尋：只負責演算法，每走一步就 yield 一個步驟快照，不碰 DOM。
// 程式碼面板的變數名稱（nums、target、i、j、m）和《Hello 演算法》一致，方便銜接。

export const BINARY_CODE = [
  'def binary_search(nums, target):',
  '    i, j = 0, len(nums) - 1',
  '    while i <= j:',
  '        m = (i + j) // 2',
  '        if nums[m] < target:',
  '            i = m + 1',
  '        elif nums[m] > target:',
  '            j = m - 1',
  '        else:',
  '            return m',
  '    return -1'
];

export const LINEAR_CODE = [
  'def linear_search(nums, target):',
  '    for k in range(len(nums)):',
  '        if nums[k] == target:',
  '            return k',
  '    return -1'
];

function midQuestion(i, j, m) {
  const options = [...new Set([m - 1, m, m + 1].filter(x => x >= i && x <= j))];
  if (options.length < 2) return null;
  return {
    question: `i = ${i}、j = ${j}。這一輪的中點 m 是多少？`,
    options: options.map(String),
    answer: String(m),
    explain: `m = (${i} + ${j}) // 2 = ${m}。// 是除完之後只取整數。`
  };
}

function directionQuestion(value, target) {
  const answer = value < target ? '往右半邊找' : value > target ? '往左半邊找' : '找到了！';
  const explain = value < target
    ? `${value} < ${target}，左半邊的數都更小，不可能是答案。`
    : value > target
      ? `${value} > ${target}，右半邊的數都更大，不可能是答案。`
      : `${value} 就是 ${target}。`;
  return {
    question: `nums[m] = ${value}，要找 ${target}。接下來呢？`,
    options: ['往左半邊找', '往右半邊找', '找到了！'],
    answer,
    explain
  };
}

export function* binarySearch(nums, target) {
  const n = nums.length;
  let i = 0;
  let j = n - 1;
  let m = null;
  let compares = 0;
  const checked = [];
  const base = () => ({ vars: { i, j, m }, range: i <= j ? [i, j] : null, checked: [...checked], compares });

  yield { ...base(), line: 2, focus: null, say: `一開始，搜尋範圍是整個陣列：i = 0，j = ${n - 1}。` };
  while (true) {
    if (i > j) {
      yield { ...base(), line: 3, focus: null, say: `i = ${i} 已經大於 j = ${j}，範圍空了。` };
      break;
    }
    yield { ...base(), line: 3, focus: null, say: `i = ${i} ≤ j = ${j}，範圍裡還有 ${j - i + 1} 個數，繼續找。` };
    m = Math.floor((i + j) / 2);
    yield { ...base(), line: 4, focus: m, say: `中點 m = (${i} + ${j}) // 2 = ${m}。`, ask: midQuestion(i, j, m) };
    const value = nums[m];
    checked.push(m);
    compares++;
    if (value < target) {
      yield { ...base(), line: 5, focus: m, say: `nums[${m}] = ${value} 比 ${target} 小，答案只可能在右半邊。`, ask: directionQuestion(value, target) };
      i = m + 1;
      yield { ...base(), line: 6, focus: m, say: `i 移到 m + 1 = ${i}，左半邊全部排除。` };
    } else if (value > target) {
      yield { ...base(), line: 7, focus: m, say: `nums[${m}] = ${value} 比 ${target} 大，答案只可能在左半邊。`, ask: directionQuestion(value, target) };
      j = m - 1;
      yield { ...base(), line: 8, focus: m, say: `j 移到 m − 1 = ${j}，右半邊全部排除。` };
    } else {
      yield { ...base(), line: 10, focus: m, found: m, say: `nums[${m}] = ${value}，找到了！回傳索引 ${m}，一共比較了 ${compares} 次。`, ask: directionQuestion(value, target) };
      return;
    }
  }
  yield { ...base(), line: 11, focus: null, found: -1, say: `${target} 不在陣列裡，回傳 -1。一共比較了 ${compares} 次。` };
}

export function* linearSearch(nums, target) {
  const n = nums.length;
  let compares = 0;
  const checked = [];
  for (let k = 0; k < n; k++) {
    const base = () => ({ vars: { k }, range: [k, n - 1], checked: [...checked], compares });
    yield { ...base(), line: 2, focus: k, say: `看第 ${k} 格。` };
    checked.push(k);
    compares++;
    if (nums[k] === target) {
      yield { ...base(), line: 4, focus: k, found: k, say: `nums[${k}] = ${target}，找到了！回傳索引 ${k}，一共比較了 ${compares} 次。` };
      return;
    }
    yield { ...base(), line: 3, focus: k, say: `nums[${k}] = ${nums[k]}，不是 ${target}，換下一格。` };
  }
  yield { vars: { k: n - 1 }, range: null, checked: [...checked], compares, line: 5, focus: null, found: -1, say: `全部看完都不是，${target} 不在陣列裡，回傳 -1。一共比較了 ${compares} 次。` };
}

export const collect = generator => [...generator];

/** 解析學生輸入的數列：整數、由小到大。 */
export function parseNumbers(text) {
  const parts = String(text).split(/[\s,，、]+/).filter(Boolean);
  if (!parts.length) return { error: '請輸入至少一個數字。' };
  if (parts.length > 32) return { error: '最多 32 個數字，畫面才放得下。' };
  const nums = parts.map(Number);
  if (nums.some(x => !Number.isInteger(x) || Math.abs(x) > 9999)) return { error: '請輸入 −9999～9999 的整數，用空白或逗號分開。' };
  for (let k = 1; k < nums.length; k++) {
    if (nums[k] < nums[k - 1]) return { error: '二分搜尋需要由小到大排好的數列。', unsorted: nums };
  }
  return { nums };
}

/** 隨機產生一組由小到大、不重複的數列與目標。present 為 false 時目標不在數列裡。 */
export function randomCase(size = 16, present = Math.random() < 0.7, random = Math.random) {
  const nums = [];
  let value = 1 + Math.floor(random() * 9);
  for (let k = 0; k < size; k++) {
    nums.push(value);
    value += 2 + Math.floor(random() * 7);
  }
  if (present) return { nums, target: nums[Math.floor(random() * size)] };
  const gaps = [nums[0] - 1, nums[size - 1] + 1];
  for (let k = 1; k < size; k++) if (nums[k] - nums[k - 1] > 1) gaps.push(nums[k - 1] + 1);
  return { nums, target: gaps[Math.floor(random() * gaps.length)] };
}
