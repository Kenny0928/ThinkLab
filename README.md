# 🧪 ThinkLab — 從程式學習到實作專題的能力實驗室

ThinkLab 是一個面向國小、國高中、大專到社會人士的程式與實作學習平台，可直接部署到 **GitHub Pages**。目前已開放LV.1、LV.2、LV.3共 35 關、105 題講義，以及 Judge 題庫 214 題（LV.1 56 題、LV.2 110 題、LV.3 37 題、挑戰 11 題）。除LV.1「小數與格式化輸出」、LV.3 H01、H02 限用 Python 外，講義題都能自由選用 **Scratch、Blockly 或 Python** 作答。

三階段講義依照「讀懂任務 → 先猜結果 → 拆解步驟 → 動手測試」組成連續學習路徑：LV.1 15 關、LV.2 10 關、LV.3 10 關。每關包含 1 題核心題與 2 題變體；各作答方式共用題目、測資與通關紀錄，每題、每種語言的草稿則分別保存。

Python 與 Blockly 產生的 Python 由 **Pyodide**（Python in WebAssembly）執行；Scratch 使用官方 **Scratch Blocks** 編輯、**Scratch VM** 執行。所有程式都在學生的瀏覽器內判題，不需要後端、資料庫或部署時的 Node.js 服務。

https://kenny0928.github.io/ThinkLab/

分齡學習路徑與題庫全景請見：[題庫總覽與學習階梯](docs/題庫總覽與學習階梯.md)；演算法遊樂場的設計理念見 [AlgoPlay README](algoplay/README.md)。


## ✨ 功能特色

- 🧭 首頁整合講義、Judge、演算法遊樂場與流程圖實驗室入口
- 🎮 演算法遊樂場：不用寫程式的「演算法小鎮」與「會動的演算法」動畫模組
- 🌱 LV.1 15 關、LV.2 10 關、LV.3 10 關的自學講義，每關含核心題與變體 A、B
- 🧪 講義以多組隱藏測資核對程式輸出，支援不同的正確寫法
- 🧩 每題可選 Scratch、Blockly 或 Python，使用相同的標準輸入／輸出測資
- 🐍 Python 與 Blockly 共用頁面內延遲載入的 Pyodide 執行環境
- 🐱 Scratch 以獨立 Web Worker 執行，逾時可強制終止
- 📦 Blockly 積木可匯入／匯出 JSON 並查看產生的 Python；Scratch 可匯入／下載 `.sb3`
- 🎨 CodeMirror 程式碼編輯器（Dracula 深色主題）
- 📋 題目資料獨立為 JSON 檔，易於新增與維護
- 🧭 題庫列表可依LV.1／LV.2／LV.3／挑戰篩選，題目頁同步顯示適齡與 APCS 導向
- ✅ 自動評測所有測資，顯示 AC / WA / TLE / RE 結果
- 💾 各題、各語言的草稿獨立保存，並保留共用的通關紀錄（localStorage）
- 🚀 純靜態，可直接部署到 GitHub Pages

---

## 🧩 學生作答方式

在講義的核心題、變體練習板，或 Judge 的編輯區，使用「作答方式」選單切換語言，再按「執行並檢查」或 Judge 的試跑／送出按鈕。切換後會恢復該題、該語言的草稿；重設只恢復目前語言的起始內容。Blockly 從空白工作區開始，Scratch 預先放一個綠旗起始積木，解答由學生自行完成。LV.3 H01、H02 使用 `set`、`dict` 與自訂排序鍵等 Python 寫法，作答選單會限制為 Python。

| 作答方式 | 操作與執行方式 |
|----------|----------------|
| Python | 使用原有 CodeMirror 編輯器，透過 `input()`／`sys.stdin` 讀取資料，`print()` 輸出答案。LV.1保留 Python 填空教材。 |
| Blockly | 從分類拖曳並組合積木；原生「要求輸入文字」直接對應 Python `input()`，一次讀取完整一行，再用清單分隔積木拆解。清單索引和 Python 一樣從 0 開始。按「查看 Python」可檢視生成程式，使用「匯出積木」與「匯入積木」保存、還原本站 JSON 格式。 |
| Scratch | 將程式接在「當綠旗被點擊」下方，以官方 Scratch 分類與積木編寫運算、條件、迴圈、變數、清單、廣播與函式積木。可匯入或下載 `.sb3` 作品。這是文字演算法編輯器，沒有舞台動畫預覽。 |

Scratch 的判題 I/O 約定：

- 每個原生「詢問 … 並等待」會依序讀取一筆以空白或換行分隔的資料，再用「詢問的答案」取得內容；詢問的提示文字不會成為答案輸出。
- 同一行有多個輸入值時，可連續使用多個「詢問 … 並等待」。例如測資 `3 5`，前兩次詢問會依序得到 `3`、`5`，不需要特殊提示文字。
- 「說出」每次輸出一行；同一行的多個值應先以字串組合積木加入指定空格。Scratch 清單從第 1 項開始。
- 匯入作品的造型、音效可隨 `.sb3` 保留，但文字判題不執行舞台圖形或擴充套件。使用不支援的積木或擴充套件會顯示錯誤，請改用文字演算法支援的積木。

三種方式不會自動互相翻譯。Blockly 的 Python 預覽是積木生成的結果；切換到 Python 時仍使用獨立的 Python 草稿。答案只忽略末尾空白，中間的空格、換行、大小寫與符號仍須符合題目。

### 草稿與相容性

| 資料 | localStorage 鍵值 |
|------|-------------------|
| Judge Python 草稿 | `pyjudge_code_<題目 id>` |
| 講義 Python 草稿 | `pyjudge_<beginner/intermediate/advanced>_draft_<關卡 id>_<core/a/b>` |
| Blockly 草稿 | 對應 Python 鍵值加上 `_blockly` |
| Scratch 草稿 | 對應 Python 鍵值加上 `_scratch` |
| 最近使用的作答方式 | `pyjudge_language`，未設定時預設 Python |
| 講義通關與分題進度 | 各階段分別使用 `pyjudge_<階段>_completed`、`pyjudge_<階段>_task_progress_<版本>` |

舊版LV.1 `pyjudge_beginner_draft_<關卡 id>` 草稿會在核心題讀取，既有 Python 草稿與進度鍵值保持相容。資料只存於目前瀏覽器與網站來源，不會跨裝置同步；積木作品可另外匯出備份。

## 📁 專案結構

```
ThinkLab/
├── index.html          ← 學習選單首頁
├── beginner.html       ← 三階段共用講義頁（由 `?course=` 選擇課程）
├── judge.html          ← Judge 主程式（UI 邏輯，不含題目資料）
├── guide.html          ← 驗資說明頁（怎麼讀範例輸入／輸出、Scratch 與 Blockly 的輸入輸出）
│
├── algoplay/           ← 演算法遊樂場（首頁兩個選單：演算法小鎮、會動的演算法）
│   ├── core/           ← 共用底色樣式、進度、角色、Pyodide 與預覽畫布
│   ├── town/           ← 2D 像素小鎮與生活情境關卡
│   ├── modules/        ← 演算法動畫模組（目前：二分搜尋）
│   └── test/           ← 小鎮地圖、關卡邏輯與機器人程式的 node 測試
│
├── test/               ← 流程圖實驗室（拖曳式流程圖執行器）與其 node 測試
│
├── assets/
│   ├── programming-editor.js/.css ← 共用語言切換、草稿與判題介面
│   ├── course-catalog.js           ← LV.2 10 關課程資料
│   ├── advanced-course.js          ← LV.3 10 關課程資料
│   ├── problem-classification.js  ← 題目分級名稱、顯示與篩選邏輯
│   ├── blockly-editor.html/.js    ← Blockly 工作區、I/O 積木、Python 生成
│   ├── scratch-editor.html/.js    ← Scratch Blocks 工作區與 .sb3 匯入／匯出
│   ├── scratch-runner-worker.js  ← Scratch VM 文字判題與逾時隔離
│   └── vendor/blockly/           ← 固定版本 Blockly 與授權、媒體檔案
│
├── docs/
│   ├── 題庫總覽與學習階梯.md    ← 六大循序漸進階梯與題庫全景對照
│   ├── 題庫擴充審查_154-213.md  ← 原創 60 題的審查與驗證紀錄
│   └── 課程內容草稿/            ← LV.2／LV.3 講義與擴充題庫的內容母稿
│
├── for_AI/
│   ├── AI_AGENT_工作流與開發規範.md ← AI Agent 題庫與網頁維護最高規約 (SOP)
│   └── google-sites題庫匯入/       ← Google Sites 題庫目錄與已審匯入紀錄
│
├── scripts/
│   ├── verify_problems.py      ← 自動化題庫與測資全量檢核工具
│   ├── problem_expansion_154_213/ ← 原創 60 題規格、獨立解法對拍與重建工具
│   ├── verify_courses.mjs      ← 三階段講義結構、測資與參考解答檢核
│   ├── sync_google_sites_catalog.py ← 整理封存題庫並偵測已匯入來源變更
│   ├── verify_editors.cjs       ← 編輯器草稿、切換與 Blockly 生成程式測試
│   ├── verify-scratch.html      ← Scratch 真實瀏覽器測試頁
│   ├── verify-integration.html  ← Judge 與講義三語言整頁測試
│   └── fixtures/               ← 可匯入的積木測試作品
│
├── problems/
│   ├── index.json      ← 題目清單（id、標題、難度、標籤）
│   ├── 001.json        ← 題目 001 完整資料（含測資）
│   ├── 002.json
│   └── ...
│
└── solutions/
    ├── 001.py          ← 題目 001 參考解答（不會自動載入）
    ├── 002.py
    └── ...
```

> **分工說明**
> - **`docs/題庫總覽與學習階梯.md`** — 題庫架構藍圖、學習階梯與缺漏過渡題規劃
> - **`for_AI/AI_AGENT_工作流與開發規範.md`** — AI Agent 與協作者修改題庫與網頁的 SOP
> - **`scripts/verify_problems.py`** — 驗證題庫格式與 Python 解答是否全部通過測資
> - **`problems/*.json`** — 維護者只需編輯這裡就能新增或修改題目
> - **`solutions/*.py`** — 參考解答，不會自動顯示給學生
> - **`beginner.html`** — 三階段共用講義引擎與LV.1課程資料；中、LV.3資料由 `assets/` 載入
> - **`judge.html`** — 除非要改評測功能，否則不需要動

---

## 🧭 題目分級標準

ThinkLab 將「學習階段、適齡、同階段難度、APCS 導向」分開記錄，避免只以學生年級或數學內容判斷程式題難度。

| 學習階段 | `stage` | 適合對象與判定依據 | 常見內容 |
|---|---|---|---|
| LV.1 | `Beginner` | 國小、初學者、尚未熟悉程式操作；一題聚焦一個核心概念，原則上可用 Scratch／Blockly 完成 | 輸入輸出、變數、四則運算、單層條件、單層迴圈 |
| LV.2 | `Intermediate` | 已掌握基礎語法，能組合 2～3 個概念；可能用到國中數學，但不以數學年級作為唯一判準 | 多分支、巢狀迴圈、字串、清單、座標、簡單模擬、基礎數論 |
| LV.3 | `Advanced` | 國中資優、高中及以上；需要選擇演算法、理解複雜度或進行較長的狀態推理 | 搜尋、排序、遞迴、二維資料、貪心、基礎動態規劃 |
| 挑戰 | `Challenge` | APCS／競賽導向；資料規模會淘汰直觀暴力法，必須兼顧正確性與執行效率 | 圖論、進階動態規劃、前綴和、二分搜尋、資料結構 |

四個欄位各自代表不同事情：

- `stage`：主要學習階段，只能填 `Beginner`、`Intermediate`、`Advanced`、`Challenge`。
- `audienceLevel`：建議適齡，沿用 `E-MID`、`E-UPPER`、`M-7`、`M-8`、`M-HS`、`A-HS`。
- `difficulty`：同一 `stage` 內的相對難度，只能填 `Easy`、`Medium`、`Hard`；例如 `Intermediate + Easy` 是「LV.2中的入門題」。
- `apcsLevel`：`Beginner`、`Intermediate`、`Advanced` 一律填 `null`；`Challenge` 必須填 `APCS-Concept`、`APCS-Implementation` 或 `APCS-Advanced`。這是站內分類，不直接等同官方成績級分。

分級的核心原則是：**LV.1學語法，LV.2組合概念，LV.3選擇演算法，挑戰處理效率與競賽限制。**數學年級只是參考；概念組合數量、演算法選擇、資料範圍與實作陷阱才是主要依據。

現有題庫已完成第一輪逐題補標；所有新題與實質修改的舊題也必須包含 `stage`、`audienceLevel`、`difficulty` 與 `apcsLevel`，並通過自動檢查。

2026-09-22 新增 60 題原創練習：154–178 為 LV.2、179–203 為 LV.3、204–213 為 APCS 導向挑戰題。每題提供 3 組公開範例，另有至少 8 組非範例測資與 Python 參考解答。題組規劃、舊題審查與驗證方式見 [題庫擴充審查](docs/題庫擴充審查_154-213.md)。

---

## ➕ 新增題目（不需要 AI，3 步驟完成）

### 步驟 1：在 `problems/index.json` 加入清單項目

```json
[
  {
    "id": 1,
    "title": "A+B 問題",
    "stage": "Beginner",
    "audienceLevel": "E-MID",
    "apcsLevel": null,
    "difficulty": "Easy",
    "tags": ["數學"]
  }
]
```

索引中的 `stage`、`audienceLevel`、`apcsLevel`、`difficulty` 必須和完整題目 JSON 相同。`difficulty` 只能填 `"Easy"`、`"Medium"`、`"Hard"` 三種；它只表示同一 `stage` 內的相對難度。

### 步驟 2：建立 `problems/008.json`

（檔名要和 `id` 對應，補零到三位數）

```json
{
  "id": 8,
  "title": "你的新題目",
  "stage": "Beginner",
  "difficulty": "Easy",
  "tags": ["字串"],
  "audienceLevel": "E-UPPER",
  "apcsLevel": null,
  "learningObjectives": ["讀取字串並反轉輸出"],
  "prerequisites": ["字串輸入"],
  "description": "<p>題目說明，支援 HTML 標籤。</p>",
  "inputFormat": "<p>輸入格式說明。</p>",
  "outputFormat": "<p>輸出格式說明。</p>",
  "constraints": "<ul><li>1 ≤ N ≤ 100</li></ul>",
  "timeLimit": 1,
  "memoryLimit": 256,
  "sampleInput": "hello",
  "sampleOutput": "olleh",
  "samples": [
    { "input": "hello", "output": "olleh" },
    { "input": "world", "output": "dlrow" },
    { "input": "12345", "output": "54321" }
  ],
  "testCases": [
    { "input": "hello",  "output": "olleh"  },
    { "input": "world",  "output": "dlrow"  },
    { "input": "12345",  "output": "54321"  }
  ]
}
```

`samples` 是題目頁會公開顯示並由「測試範例」按鈕執行的範例，一般題目至少需要 3 組；`testCases` 是正式提交時使用的完整測資。固定輸出且沒有輸入的題目可以只提供 1 組公開範例。`sampleInput` 與 `sampleOutput` 暫時保留，供舊版頁面相容使用。

### 步驟 3：（可選）建立 `solutions/008.py`

```python
# 008. 你的新題目（參考解答）
s = input()
print(s[::-1])
```

這個檔案**不會自動載入**到編輯器，只做為題目出題者的參考。

### 從 Google Sites 封存題庫新增題目

`../selenium/output/normalized` 內的 Google Sites 題目已整理為可追蹤的審題目錄。候選案例不能直接當成完整測資；請依 [Google Sites 題庫匯入工作流](for_AI/google-sites題庫匯入/README.md) 逐題重寫規格、補齊測資與解答。

```bash
python3 scripts/sync_google_sites_catalog.py --write
python3 scripts/sync_google_sites_catalog.py --check
```

`catalog.json` 會標示 `unreviewed`、`imported` 或 `source_changed`。若已匯入題目的來源雜湊改變，檢查會失敗，必須重新審題後才能更新正式題目。

---

## 🚀 部署到 GitHub Pages（5 分鐘完成）

### 步驟 1：建立 GitHub Repository

1. 前往 [github.com](https://github.com) 並登入
2. 點擊右上角 **+** → **New repository**
3. 輸入倉庫名稱，例如：`ThinkLab`，選擇 **Public**
4. 點擊 **Create repository**

### 步驟 2：上傳所有檔案

**方法 A：在 GitHub 網頁上傳（最簡單）**

1. 在倉庫頁面點擊 **Add file** → **Upload files**
2. 上傳所有頁面及完整 `assets/`、`problems/`、`solutions/`、`scripts/` 資料夾；保留檔案相對路徑
3. 點擊 **Commit changes**

**方法 B：使用 Git**

```bash
git init
git add .
git commit -m "Initial ThinkLab"
git branch -M main
git remote add origin https://github.com/你的帳號/ThinkLab.git
git push -u origin main
```

### 步驟 3：啟用 GitHub Pages

1. 倉庫頁面 → **Settings** → **Pages**
2. Source 選 **Deploy from a branch**，Branch 選 **main / (root)**
3. 點擊 **Save**，等待 1～3 分鐘

你的網站網址：`https://你的帳號.github.io/ThinkLab/`

---

## 💡 本機預覽（開發用）

因為 `fetch()` 在 `file://` 協定下受瀏覽器限制，本機測試需要啟動簡易 HTTP 伺服器：

```bash
# 在 ThinkLab/ 資料夾下執行
python3 -m http.server 8080
# 然後開啟瀏覽器前往 http://localhost:8080
```

請透過 HTTP／HTTPS 開啟網站。積木編輯器使用 iframe 通訊與 Web Worker，不支援直接以 `file://` 開啟檔案。

### 修改後驗證

> 快速查表見 [測試入口](測試入口.md)：該跑哪個指令、兩個瀏覽器測試頁怎麼開、增減關卡時的連動清單。

在專案根目錄執行：

```bash
python3 scripts/verify_problems.py
node scripts/verify_editors.cjs
node scripts/verify_courses.mjs
node --test "test/*.test.mjs" "algoplay/test/*.test.mjs"
```

第一個指令驗證 Judge 題庫與 Python 參考解答；第二個使用 Node.js 內建模組與本機 Python 3，檢查語言切換、草稿相容性、重設、過期訊息處理，以及實際 Blockly 生成程式的輸入／輸出；第三個檢查三階段 35 關、105 題的資料結構，並將每題參考解答跑過全部測資；第四個跑流程圖實驗室與演算法遊樂場的 48 個單元測試（路徑要加引號，讓 node 自己展開）。四個指令全部正常時離開碼都是 0，可以用 `&&` 串起來。Node.js 只用於開發驗證，網站不需要 Node.js 執行環境或建置步驟。

啟動上述 HTTP 伺服器後，開啟 [Scratch 瀏覽器測試頁](http://localhost:8080/scripts/verify-scratch.html)，依頁面操作執行測試並確認全部通過。此頁載入真實 Scratch Blocks、Scratch VM 與 Worker，補足終端測試沒有涵蓋的瀏覽器執行流程。

完整作答流程另使用測試專用來源：執行 `python3 -m http.server 8081 --bind 127.0.0.1`，開啟 [整頁測試](http://127.0.0.1:8081/scripts/verify-integration.html)，按下 **Run tests**。它會在真正的 Judge 與講義頁面匯入本倉庫測試作品，驗證三種作答方式、AC／WA／RE、切題還原與講義進度，完成後還原觸及的測試來源草稿。不要在測試途中關閉頁面。

也請在 `beginner.html`、`beginner.html?course=intermediate`、`beginner.html?course=advanced` 與 `judge.html` 各自確認：允許的作答方式可編輯與判題、切題及重新整理能還原草稿、重設不影響其他語言、積木匯出後可重新匯入；執行途中不能切換題目或重設。Blockly 範例作品可使用 `scripts/fixtures/blockly-sum-range.json` 與 `blockly-sum-list.json`，並選擇符合範例演算法的題目或自訂試跑輸入。

---

## ⚠️ 現階段已知限制

| 限制 | 說明 |
|------|------|
| Python／Blockly 的強制逾時 | 仍在主執行緒執行 Pyodide。Judge 會檢查執行耗時，但 Python 無窮迴圈無法強制中止，可能使頁面無回應；Blockly 生成程式有相同限制。Scratch 在 Worker 中執行，逾時可強制終止。 |
| Scratch 文字判題範圍 | 提供演算法積木與標準 I/O；沒有舞台動畫、硬體或網路擴充執行。不支援的積木會被拒絕。 |
| 首次載入需要網路 | Pyodide、CodeMirror、Scratch Blocks、Scratch VM、JSZip 由外部 CDN 載入，首次載入時間視網路與裝置而定。Blockly 程式庫與媒體檔已包含在倉庫。 |
| 本地保存 | 草稿存於 localStorage；清除網站資料或更換瀏覽器／網站來源後不會自動還原。 |
| 講義範圍 | 已開放LV.1 15 關、LV.2 10 關、LV.3 10 關，共 105 題；LV.1「小數與格式化輸出」、LV.3 H01、H02 僅支援 Python。 |

---

## 🛠 技術棧與參考資料

| 元件 | 本專案版本與用途 |
|------|------------------|
| [Blockly](https://docs.blockly.com/) | `12.3.1`，隨倉庫提供於 `assets/vendor/blockly/`，包含 Python 生成器與繁體中文訊息。草稿採用官方 [JSON 工作區序列化](https://docs.blockly.com/guides/configure/serialization/)。 |
| [Scratch Blocks](https://github.com/scratchfoundation/scratch-blocks) | `1.3.0`，由 jsDelivr 載入，提供 Scratch 積木編輯介面。 |
| [Scratch VM](https://github.com/scratchfoundation/scratch-vm) | `5.0.300`，由 jsDelivr 載入，管理並執行 Scratch 專案。 |
| [JSZip](https://stuk.github.io/jszip/) | `3.10.1`，由 jsDelivr 載入，用於 `.sb3` 檔案讀寫。 |
| [Pyodide](https://pyodide.org/) | `0.26.4`，在瀏覽器執行 Python 3 與 Blockly 生成的 Python。 |
| [CodeMirror 5](https://codemirror.net/5/) | `5.65.16`，Python 編輯器與 Dracula 深色主題。 |
| GitHub Pages | 純靜態網站託管。 |

`參考倉庫.txt` 中的 [scratch-www](https://github.com/scratchfoundation/scratch-www) 是 Scratch 網站前端，含專案頁、首頁與其他網站頁面，且依賴 Scratch 的後端服務。本專案直接整合負責積木介面與程式執行的 Scratch Blocks／Scratch VM，以維持既有純靜態部署；Blockly 的整合方式則參考 [Blockly 官方文件](https://docs.blockly.com/)。
