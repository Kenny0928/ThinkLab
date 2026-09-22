# 🤖 ThinkLab AI Agent 開發與維護工作流規範

本文件是所有 **AI Agent**（包含代碼生成、修改、審題與網頁維護代理）以及人類維護者在進行專案維護時的**最高遵循規約（SOP）**。  
任何 AI Agent 在接收到修改需求時，必須嚴格依循本文件的流程、原則與驗證要求，嚴禁跳步或擅自破壞架構契約。

---

## 一、 專案核心架構契約（不可違背的底線）

1. **純靜態部署（GitHub Pages）**：
   - 專案沒有後端 API、沒有 Node.js 運行環境、沒有資料庫。所有邏輯均透過瀏覽器端純靜態執行。
   - 評測引擎基於 WebAssembly **Pyodide**，直接在使用者瀏覽器中執行 Python 程式碼。
2. **標準 I/O 評測規範**：
   - 學生與參考解答**一律從標準輸入（`sys.stdin` / `input()`）讀取**，並**只向標準輸出（`print()`）輸出**。
   - 嚴禁輸出任何提示文字（如 `input("請輸入數字：")`），否則比對必然失敗。
   - 判定邏輯採用字串末尾抹除空白比對（`actual.trimEnd() === expected.trimEnd()`）；但**中間的空格、換行、大小寫與符號必須 100% 精準匹配**。
3. **無破壞性修改**：
   - 不得更改 `localStorage` 所使用的既有鍵值前綴（如 `pyjudge_code_`、`pyjudge_beginner_completed`）。
   - 不得破壞現有已通過驗證題目的測資與解答。

---

## 二、 場景一：題庫維護與新增題目工作流（Problem SOP）

當 Agent 需要「新增題目」或「修改現有題目」時，必須執行以下 5 步原子操作：

```
[步驟 1: 定位與規劃] ➔ [步驟 2: 建立題目 JSON] ➔ [步驟 3: 建立參考解答] ➔ [步驟 4: 更新清單與階梯] ➔ [步驟 5: 執行自動驗證]
```

### 步驟 1：定位與規劃
1. 查閱 `docs/題庫總覽與學習階梯.md`，確定該題歸屬於哪一個 Level（Level 1 至 Level 6）。
2. 指定學習階段（`stage`），不得只按年齡或單一數學知識判斷：
   - `Beginner`（LV.1）：國小、程式初學者或尚未熟悉操作；一題聚焦一個核心概念，包含基本輸入輸出、變數、四則運算、單層條件與單層迴圈，原則上可用 Scratch／Blockly 完成。
   - `Intermediate`（LV.2）：已掌握基礎語法，能組合 2～3 個概念；可能使用國中數學，並涵蓋多分支、巢狀迴圈、字串、清單、座標、簡單模擬與基礎數論。不能因只用到小學數學就自動降為LV.1。
   - `Advanced`（LV.3）：國中資優、高中及以上；需要選擇演算法、理解時間複雜度或進行較長的狀態推理，例如搜尋、排序、遞迴、二維資料、貪心與基礎動態規劃。
   - `Challenge`（挑戰）：APCS／競賽導向；資料範圍會使直觀暴力法超時，必須同時考慮正確性與效率，可能使用圖論、進階動態規劃、前綴和、二分搜尋或資料結構。
3. 指定明確的適齡分級代碼（`audienceLevel`）：
   - `E-MID`：國小中年級（生活情境、手算小數值、避免負數與複雜術語）。
   - `E-UPPER`：國小高年級（單一新概念、計數迴圈、累加、簡單字串）。
   - `M-7` / `M-8`：國中（分支巢狀、一維/二維陣列、字串走訪、簡單搜尋）。
   - `M-HS` / `A-HS`：高中（演算法思維、複雜度分析、雜湊表、遞推 DP）。
4. 指定同階段內的相對難度（`difficulty`），只能使用 `Easy`、`Medium`、`Hard`。`difficulty` 不得代替 `stage`：例如 `Intermediate + Easy` 表示LV.2中的入門題。
5. 指定 APCS 導向（`apcsLevel`）：`Beginner`、`Intermediate`、`Advanced` 一律填 `null`；`Challenge` 必須填 `APCS-Concept`、`APCS-Implementation` 或 `APCS-Advanced`。這是 ThinkLab 內部分類，不宣稱等同官方成績級分；若要對應特定年度官方標準，必須另行查核當期規則。
6. 取得最新可用的題目 ID（整數遞增，不可重複或插隊）。

#### 四個分級欄位不可混用

| 欄位 | 回答的問題 | 範例 |
|---|---|---|
| `stage` | 學習者需要哪一階段的程式解題能力？ | `Intermediate` |
| `audienceLevel` | 題目敘述與先備知識適合哪個年齡層？ | `M-7` |
| `difficulty` | 在同一 `stage` 中，這題相對多難？ | `Easy` |
| `apcsLevel` | 是否為 APCS／競賽導向，以及主要面向？ | `null` |

分級時依序檢查：需要組合多少概念、是否必須選擇演算法、資料範圍是否淘汰暴力法、實作是否容易出錯，最後才參考數學年級。核心原則為：**LV.1學語法，LV.2組合概念，LV.3選擇演算法，挑戰處理效率與競賽限制。**

### 步驟 2：建立題目檔案（`problems/NNN.json`）
- 檔名必須補零至三位數，例如 `011.json`。
- 必須遵循以下標準 JSON 格式：

```json
{
  "id": 11,
  "title": "繁體中文標題",
  "stage": "Beginner",
  "difficulty": "Easy",
  "tags": ["條件判斷", "數學"],
  "audienceLevel": "E-MID",
  "apcsLevel": null,
  "platformMode": "Python",
  "learningObjectives": ["掌握 % 2 取餘數與 if/else 判斷奇偶數"],
  "prerequisites": ["變數", "算術運算"],
  "description": "<p class='problem-lead'>用一句話說明核心任務。</p><p>只保留完成題目所需的條件與精確輸出要求。</p>",
  "hint": "<p>選填。只提示一個關鍵概念，不提供完整解答。</p>",
  "inputFormat": "<p>詳細說明輸入規格，例如：一行包含一個整數 N。</p>",
  "outputFormat": "<p>詳細說明輸出規格，例如：若是奇數輸出 Odd，若是偶數輸出 Even。</p>",
  "constraints": "<ul><li>1 ≤ N ≤ 1000</li></ul>",
  "timeLimit": 1,
  "memoryLimit": 256,
  "sampleInput": "7",
  "sampleOutput": "Odd",
  "testCases": [
    { "input": "7", "output": "Odd" },
    { "input": "4", "output": "Even" }
  ]
}
```

#### 題目說明風格與顯示順序

1. `description` 第一段使用一句簡短的任務摘要，接著直接說明學生要完成什麼；刪除歡迎詞、重複敘述與不影響解題的背景資訊。
2. 大小寫、空格、換行或指定文字需要完全一致時，必須在說明中明確寫出，並使用 `code` 標示固定內容。
3. 提示必須獨立放在選填的 `hint` 欄位，不得混入 `description`。介面會將提示放在限制之後並預設收合。
4. 顯示順序固定為：題目說明、輸入格式、輸出格式、範例、限制、收合提示。
5. 若題目沒有額外數值或資料範圍限制，`constraints` 應填空字串 `""`；不得填入「無」、`None` 或其他沒有資訊量的佔位文字。時間與記憶體限制仍由介面顯示。
6. 說明與提示不使用 emoji；提示只提供足以啟動思考的一個方向，不能貼出完整答案。

> ⚠️ **測資設計黃金八律（必檢項目）**：
> 1. **公開範例必含**：`sampleInput` / `sampleOutput` 必須收錄在 `testCases` 之中。
> 2. **數量充足**：正式評測測資**至少 8 組**（不含純範例）。
> 3. **極小與極大邊界**：必須包含限制允許的最小值（如 0, 1, 最小負數）與最大值。
> 4. **路徑全覆蓋**：程式所有 `if`、`elif`、`else` 分支都有對應測資可觸發。
> 5. **特殊狀態**：如 0、空、相等、並列、平手（依題目 tie-break 規則判定）。
> 6. **防硬編碼（Anti-Cheat）**：測資不可只有範例，防止學生寫 `if input == '7': print('Odd')` 過關。
> 7. **輸出唯一確定**：禁止有歧義的多解題目；浮點數若有精度問題必須明定四捨五入位數。
> 8. **禁止洩露完整代碼**：`description` 可提供思路或提示，但嚴禁直接貼出解答代碼。

### 步驟 3：建立參考解答（`solutions/NNN.py`）
- 檔名對應 `solutions/011.py`。
- 必須只能使用 **Python 3 標準函式庫**。
- 解答頂部必須包含簡要註解，說明解題核心思路。
- 若為 Scratch/Blockly 適用題（`E-MID` / `E-UPPER`），註解中需附帶「積木對照解法步驟」。

### 步驟 4：更新清單與階梯文檔
1. 在 `problems/index.json` 中追加該題物件：
   ```json
   {
     "id": 11,
     "title": "奇數與偶數",
     "stage": "Beginner",
     "audienceLevel": "E-MID",
     "apcsLevel": null,
     "difficulty": "Easy",
     "tags": ["條件判斷", "數學"]
   }
   ```
   索引與完整題目 JSON 的 `stage`、`audienceLevel`、`apcsLevel`、`difficulty` 必須一致。
2. 在 `docs/題庫總覽與學習階梯.md` 的對照表與階梯位置中加入該題。

所有題目都必須包含 `stage`、`audienceLevel`、`difficulty` 與 `apcsLevel`。實質修改題目時必須重新檢查分級，不得只靠關鍵字或年齡自動猜測。

### 步驟 5：執行本地自動化驗證（強制執行）
在交付任何代碼之前，Agent 必須在本機終端執行：
```bash
python3 scripts/verify_problems.py
```
- 確認該題顯示 `✓ PASS`，且無任何語法錯誤或答案比對失敗。
- 只有當報告顯示 `失敗: 0` 時，任務才算完成。

---

## 三、 場景二：網頁前端修改工作流（Web Frontend SOP）

專案包含三個核心前端頁面，修改時各有其保護規範：

### 1. 修改 `judge.html`（評測核心頁）
- **核心職責**：題目導覽、題目載入展示、CodeMirror 編輯器、Pyodide 執行與比對。
- **不可更動的邏輯**：
  - 題庫載入邏輯：`fetch('problems/index.json')` 與 `fetch('problems/${idStr}.json')`。
  - 答案比對邏輯：`actual.trimEnd() === expected.trimEnd()`。
  - Pyodide 載入機制：全域單例與延遲初始化。
- **UI/UX 規範**：
  - 維持 Dracula 深色主題與響應式雙欄佈局（左側題目、右側代碼與結果）。
  - 所有新加入的 UI 元素必須支援鍵盤無障礙操作與行動端折疊。

### 2. 修改 `beginner.html`（LV.1講義頁）
- **核心職責**：零基礎 10 關自學講義、教學引導、填空練習板。
- **資料規範**：
  - 題目定義於內嵌的 `LESSONS` 陣列。
  - 每個關卡結構包含：`id`, `title`, `badge`, `kicker`, `goal`, `mission`, `predict`, `predictAnswer`, `steps`, `starter`, `solution`, `hint`, `checkpoint`, `tests`, `variants`。
  - 填空題樣板 `starter` 應使用四個底線 `____` 提示學生填入代碼。
- **執行環境**：共用同一個 Pyodide 執行實例，每次執行後需清理變數空間，防止前後題變數互相污染。

### 3. 修改 `index.html`（首頁學習選單）
- **核心職責**：學習入口導覽、通關進度視覺化。
- **邏輯連動**：
  - 讀取 `localStorage.getItem('pyjudge_beginner_completed')` 顯示LV.1講義進度條。
  - 當新增講義（如LV.2、LV.3講義）或開放新功能時，方可將 `card-state` 由「準備中」改為「可以開始」，並補上有效連結。

---

## 四、 AI Agent 交付前自檢清單（Pre-flight Checklist）

在回覆使用者「已完成修改」之前，請在心中或回應中逐一查核：

### 題目品質檢查
- [ ] 題目 ID 唯一且檔名 `NNN.json` / `NNN.py` 正確補零。
- [ ] `stage`、`audienceLevel`、`difficulty` 與 `apcsLevel` 已分別依程式能力、適齡、同階段難度與 APCS 導向判定。
- [ ] `description` 與格式說明使用乾淨 HTML，無語法截斷或未閉合標籤。
- [ ] `constraints` 與題意相符，測資未超出限制範圍。
- [ ] 測資數量足夠（至少 8 組），且包含邊界條件（0、極大、極小、相等）。
- [ ] 題目輸出為唯一確定解，無多解或無定義狀況。

### 程式與檔案檢查
- [ ] `solutions/NNN.py` 無使用第三方套件，僅使用標準庫。
- [ ] `problems/index.json` 已正確登錄該題。
- [ ] `docs/題庫總覽與學習階梯.md` 已同步更新。

### 自動驗證檢查
- [ ] 終端已執行 `python3 scripts/verify_problems.py` 且回傳碼為 0。
- [ ] 所有題目解答均為 `PASS`，無 `FAIL` 或未捕獲的例外錯誤。
