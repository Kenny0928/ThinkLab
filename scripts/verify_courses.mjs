import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const window = {};
const context = vm.createContext({ window });

for (const file of ['assets/course-catalog.js', 'assets/advanced-course.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const beginnerHtml = fs.readFileSync(path.join(root, 'beginner.html'), 'utf8');
const beginnerStart = beginnerHtml.indexOf('const BEGINNER_LESSONS =');
const beginnerEnd = beginnerHtml.indexOf('const BEGINNER_COURSE =', beginnerStart);
if (beginnerStart < 0 || beginnerEnd < 0) throw new Error('無法找到 BEGINNER_LESSONS 資料區段。');
const beginnerSource = beginnerHtml
  .slice(beginnerStart, beginnerEnd)
  .replace('const BEGINNER_LESSONS =', 'window.BEGINNER_LESSONS =');
vm.runInContext(beginnerSource, context, { filename: 'beginner.html#BEGINNER_LESSONS' });

const courses = {
  beginner: window.BEGINNER_LESSONS,
  intermediate: window.SKILLLAB_COURSES?.intermediate?.lessons,
  advanced: window.SKILLLAB_COURSES?.advanced?.lessons
};
const expectedCounts = { beginner: 15, intermediate: 14, advanced: 16 };
const failures = [];
let taskCount = 0;
let testCount = 0;

function fail(message) {
  failures.push(message);
}

for (const [courseKey, lessons] of Object.entries(courses)) {
  if (!Array.isArray(lessons)) {
    fail(`${courseKey}: 課程資料不存在。`);
    continue;
  }
  if (lessons.length !== expectedCounts[courseKey]) {
    fail(`${courseKey}: 應有 ${expectedCounts[courseKey]} 關，實際為 ${lessons.length}。`);
  }
  const ids = new Set();
  for (const lesson of lessons) {
    const label = `${courseKey}/${lesson.id}`;
    if (ids.has(String(lesson.id))) fail(`${label}: 關卡 id 重複。`);
    ids.add(String(lesson.id));
    for (const field of ['id', 'title', 'badge', 'goal', 'mission', 'predict', 'predictAnswer', 'steps', 'starter', 'solution', 'hint', 'checkpoint', 'tests']) {
      if (lesson[field] === undefined || lesson[field] === null || lesson[field] === '') fail(`${label}: 缺少 ${field}。`);
    }
    if (!Array.isArray(lesson.variants) || lesson.variants.length !== 2) fail(`${label}: 必須有兩題變體。`);
    const tasks = [lesson, ...(lesson.variants || [])];
    for (const [index, task] of tasks.entries()) {
      taskCount += 1;
      const taskLabel = `${label}/${index === 0 ? 'core' : index === 1 ? 'A' : 'B'}`;
      for (const field of ['mission', 'sampleInput', 'sampleOutput', 'starter', 'solution', 'hint', 'tests']) {
        if (task[field] === undefined || task[field] === null || task[field] === '') fail(`${taskLabel}: 缺少 ${field}。`);
      }
      if (!Array.isArray(task.tests) || task.tests.length < 3) {
        fail(`${taskLabel}: 至少需要 3 組測試。`);
        continue;
      }
      for (const [testIndex, test] of task.tests.entries()) {
        testCount += 1;
        const result = spawnSync('python3', ['-c', task.solution], {
          cwd: root,
          input: `${test.input}${test.input.endsWith('\n') ? '' : '\n'}`,
          encoding: 'utf8',
          timeout: 5000
        });
        const actual = String(result.stdout || '').replace(/\r\n?/g, '\n').trimEnd();
        const expected = String(test.output).replace(/\r\n?/g, '\n').trimEnd();
        if (result.error || result.status !== 0) {
          fail(`${taskLabel} 測試 ${testIndex + 1}: Python 執行失敗：${result.error?.message || result.stderr.trim()}`);
        } else if (actual !== expected) {
          fail(`${taskLabel} 測試 ${testIndex + 1}: 預期 ${JSON.stringify(expected)}，實際 ${JSON.stringify(actual)}。`);
        }
      }
    }
  }
}

if (failures.length) {
  console.error(`課程驗證失敗（${failures.length} 項）：`);
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`課程驗證通過：${Object.values(courses).reduce((sum, lessons) => sum + lessons.length, 0)} 關、${taskCount} 題、${testCount} 組測試。`);
