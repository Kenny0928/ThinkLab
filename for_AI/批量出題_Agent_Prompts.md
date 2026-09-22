# ThinkLab 批量出題 Agent Prompts

本文件不是單一「靈感提示詞」，而是一套可重複執行的出題流程。建議一次只生成 5～10 題，依序執行：

1. 使用「Prompt A：題組規劃」產生題組藍圖。
2. 將核准的藍圖交給「Prompt B：題目生成與落檔」。
3. 用另一個 Agent 執行「Prompt C：獨立審題與修正」。

若只想使用一個 Agent，可以直接用「Prompt D：單一 Agent 完整工作流」。

---

## 專案事實（所有 Prompt 共用）

- 本專案是純靜態 Online Judge。
- `problems/index.json` 是題目清單。
- `problems/NNN.json` 是網站實際載入的完整題目。
- `solutions/NNN.py` 是教師用 Python 3 參考解答，不會由網站自動展示。
- 網站目前只執行 Python 3（Pyodide），以標準輸入、標準輸出逐筆比對。
- 比對規則只忽略輸出末尾空白；大小寫、行數、行內空格都必須完全一致。
- `difficulty` 只能是 `Easy`、`Medium`、`Hard`。
- `description`、`inputFormat`、`outputFormat`、`constraints` 使用簡單 HTML。
- 每題至少需要 1 組公開範例及 8 組測資。不要把全部測資寫在題目敘述中。
- 不要修改 `index.html` 內的備援題庫，除非使用者明確要求支援以 `file://` 直接開啟新題目。
- Scratch／Blockly 目前不能在網站中直接提交；標記為此類的題目，必須能用積木自然解出，同時仍提供等價 Python 解答供現有判題器驗證。

### 分級代碼

| 代碼 | 對象 | 建議概念上限 | 文字與資料規模 |
|---|---|---|---|
| `E-MID` | 小學中年級 | 順序、事件、變數、簡單輸入輸出、單一條件、固定次數重複 | 短句；數值通常 0～100；避免負數與抽象術語 |
| `E-UPPER` | 小學高年級 | 多分支、計數迴圈、累加、簡單字串／一維清單、座標與規律 | 一次只引入一個新概念；資料量小且可手算 |
| `M-7` | 國一 | 巢狀條件、while／for、一維陣列、字串走訪、基礎模擬 | 題意直接；清楚列出規則和邊界 |
| `M-8` | 國二 | 二維陣列、函式、搜尋、排序入門、較長模擬 | 可含 2～3 個相連步驟，但避免隱藏數學技巧 |
| `M-9` | 國三 | 前綴概念、基礎貪心、堆疊／佇列直觀應用、複雜度初步 | 要求辨認合適資料結構；限制能區分暴力法 |
| `M-HS` | 高中一般程度 | 二分搜尋、遞迴、DFS／BFS 入門、基礎 DP、集合與雜湊 | 可要求複雜度推理；避免競賽冷知識 |
| `A-HS` | 高中程度較好 | 圖論、DP、貪心證明、資料結構、組合與數論 | 可有多個觀察，需明確限制與可證明解法 |
| `A-UNI` | 大學以上 | 進階圖論、字串演算法、區間資料結構、進階 DP／數學 | 可要求嚴謹複雜度與正確性論證 |

### Scratch／Blockly 適用規則

- `E-MID` 預設 `platformMode = Scratch/Blockly`。
- `E-UPPER` 可用 `Scratch/Blockly` 或 `Python`。
- `M-7`、`M-8` 可用 `Blockly/Python`，但積木題應避免自訂類別、遞迴、檔案、第三方套件、位元操作及依賴 Python 語法糖。
- `M-9` 以上預設 `Python`。
- 積木相容題的解法只能依賴：變數、輸入、輸出、if/else、重複、while、清單、字串基本操作、自訂函式（Blockly 可用）。
- 不要生成依賴角色動畫、滑鼠或鍵盤事件才能判分的題目；目前 Judge 只能判斷文字輸入輸出。

---

## Prompt A：題組規劃 Agent

將下列 Prompt 貼給第一個 Agent，並替換 `{{...}}`。

```text
你是 K-12 與大專程式教育課程設計師。請為 ThinkLab 規劃一組可自動判分的程式題，但此階段不要寫完整題目與程式碼。

專案與分級規則：
{{貼上本文件的「專案事實」「分級代碼」「Scratch／Blockly 適用規則」}}

任務參數：
- 題數：{{COUNT}}
- 對象代碼：{{AUDIENCE_LEVEL}}
- 平台：{{PLATFORM_MODE；Scratch/Blockly、Blockly/Python 或 Python}}
- 課程單元：{{UNIT}}
- 已學概念：{{LEARNED_CONCEPTS}}
- 本批新概念：{{NEW_CONCEPTS}}
- 禁止概念：{{FORBIDDEN_CONCEPTS}}
- 題號起點：{{START_ID}}
- 情境偏好：{{THEME；沒有則填「多元生活情境」}}

規劃要求：
1. 每題只有一個主要學習目標，其他知識只能作為已學先備。
2. 題目之間不可只是換故事、換變數名稱或換數字。
3. 難度須形成平滑坡度：基礎理解 → 單獨應用 → 綜合應用。
4. 不使用需要查百科、特定文化背景或成人生活經驗才能理解的情境。
5. 避免暴力列舉所有輸出、浮點誤差、多解輸出及互動題。
6. 每題必須有唯一且容易機器比對的標準輸出。
7. 對 Scratch/Blockly 題，列出會用到的積木種類，並檢查積木數量是否適齡。
8. 先比對我提供的既有題目摘要，避免重複：
{{EXISTING_PROBLEM_INDEX_JSON}}

只輸出一個 Markdown 表格，每題一列，欄位必須包含：
id、暫定標題、audienceLevel、difficulty、platformMode、主要學習目標、先備概念、核心解法一句話、輸入輸出摘要、關鍵邊界、預估積木數或 Python 行數、與同批其他題的差異。

表格後另列：
- 題組的概念覆蓋統計
- 難度排序理由
- 可能重複或不適齡的風險（若無，寫「無」）
```

---

## Prompt B：題目生成與落檔 Agent

此 Prompt 適合可讀寫專案、能執行 Python 與 Git 指令的 Coding Agent。

```text
你是資深 Online Judge 出題者、兒童程式教育教師與測試工程師。請依核准的題組藍圖，在目前 ThinkLab repository 中產生可直接上線的題目。

【專案契約】
{{貼上本文件的「專案事實」「分級代碼」「Scratch／Blockly 適用規則」}}

【核准題組藍圖】
{{APPROVED_BLUEPRINT}}

【不可違反】
1. 先讀 README.md、problems/index.json、至少 3 個相近 problems/*.json 與 solutions/*.py，再開始寫檔。
2. 保留使用者既有變更；只新增或修改本批題目需要的檔案。
3. 每題建立 problems/NNN.json 與 solutions/NNN.py，並更新 problems/index.json。
4. 不修改 index.html 內的 PROBLEMS_DATA 備援資料。
5. 題目使用繁體中文（台灣用語），句子符合目標年齡。先講任務，再講規則，不寫與解題無關的長故事。
6. 題意、輸入格式、輸出格式、限制、範例與測資必須完全一致。
7. 不洩漏完整解法；description 可給適齡提示，但提示不得直接貼出答案程式。
8. Python 參考解答只能用 Python 標準函式庫，必須從 stdin 讀取並只向 stdout 輸出答案。
9. 不使用隨機答案、網路、檔案、GUI、input prompt、eval 或 exec。
10. 禁止只有範例資料；每題至少 8 組 testCases，並涵蓋最小值、最大或大規模代表值、一般值、分支、相等／重複、零或空狀態（若合法）、容易出現 off-by-one 的情況。
11. 若輸出可能有多個合法答案，重新設計題目或明定唯一 tie-break 規則。
12. constraints 的上限必須和預期演算法相符，且能讓明顯錯誤或過慢解法失敗；LV.1題以教學適齡優先，不刻意設巨大資料。
13. Scratch/Blockly 題不得靠 Python 專屬捷徑才能在合理積木數內完成。solution 註解最前面要附「積木解法步驟」，每一步對應可用積木。

【完整題目 JSON 格式】
嚴格保留網站需要的既有欄位；可額外加入下列 metadata，網站會忽略但題庫工具可使用：
{
  "id": 整數,
  "title": "繁體中文標題",
  "difficulty": "Easy|Medium|Hard",
  "tags": ["2 到 5 個中文標籤"],
  "audienceLevel": "E-MID|E-UPPER|M-7|M-8|M-9|M-HS|A-HS|A-UNI",
  "platformMode": "Scratch/Blockly|Blockly/Python|Python",
  "learningObjectives": ["1 到 3 個可觀察目標"],
  "prerequisites": ["已學概念"],
  "description": "簡單且有效的 HTML，只用 p、ul、li、strong、code、br",
  "inputFormat": "HTML",
  "outputFormat": "HTML",
  "constraints": "以 ul/li 表示的 HTML",
  "timeLimit": 1 或合理秒數,
  "memoryLimit": 256,
  "sampleInput": "純文字",
  "sampleOutput": "純文字",
  "testCases": [
    {"input": "純文字", "output": "純文字"}
  ]
}

【生成後必做驗證】
A. 對每個 JSON 執行 JSON 語法檢查。
B. 檢查 index id、檔名、題內 id、title、difficulty、tags 完全一致，所有 id 唯一且按數字遞增。
C. 用本機 Python 對每一組 testCases 執行對應 solution，stdout 以 trimEnd 後和 expected 完全比較。
D. 再自行寫至少 2 個「常見錯誤解法」做心智 mutation test，確認測資能抓到它們；不必把錯誤解法存檔。
E. 對照分級規則做適齡審查；若超出概念上限，直接簡化或退回，不可只把 difficulty 改成 Easy。
F. 檢查題目是否可由範例硬編碼通過、是否有未規定的歧義、是否包含不合法 HTML。

最後只回報：新增檔案、修改檔案、驗證結果、每題的教學目標與測資覆蓋摘要、仍需人工決定的事項。不要聲稱未實際執行的驗證已通過。
```

---

## Prompt C：獨立審題與修正 Agent

最好使用沒有參與生成的另一個 Agent。

```text
你是獨立的 Online Judge 審題員、兒童發展適齡審查員與 adversarial tester。請審查目前 git diff 中新增的 ThinkLab 題目；不要相信生成者的自我檢查。

目標對象與課程範圍：
- audienceLevel：{{AUDIENCE_LEVEL}}
- 已學概念：{{LEARNED_CONCEPTS}}
- 禁止概念：{{FORBIDDEN_CONCEPTS}}
- 平台：{{PLATFORM_MODE}}

依序完成：
1. 讀取 README.md、problems/index.json、所有新增 problems/NNN.json 與 solutions/NNN.py。
2. 建立每題規格清單：合法輸入集合、唯一輸出規則、邊界、預期演算法與複雜度。
3. 實際執行每個參考解答對所有 testCases；不得只閱讀推測。
4. 額外產生至少 10 個有效輸入，以獨立 oracle 或手算規則交叉檢查參考解答。
5. 嘗試找出：空輸入／0／1、上下界、重複值、並列、負數、換行、索引起點、大小寫、off-by-one、溢位觀念、排序前後對應等錯誤。
6. 檢查 sample 是否包含於 testCases，description、格式、constraints 是否互相矛盾。
7. 寫至少 3 種常見錯誤解法並執行 mutation test。若錯誤解法全部通過，補強測資。
8. 檢查題目是否與既有題庫或同批其他題目高度同構。
9. 依 audienceLevel 檢查閱讀負擔、數學先備、抽象程度和解法步數。
10. Scratch/Blockly 題要把參考解法逐步翻成積木操作；若做不到、需隱藏語法捷徑或積木量不適齡，判定不通過。
11. 對可明確修正的問題直接修改檔案並重新跑驗證；涉及教學方向選擇時不要猜，列為人工決策。

評級：
- BLOCKER：答案錯、規格矛盾、無唯一輸出、參考解答無法執行。
- MAJOR：核心測資缺漏、難度或先備不適齡、積木不可實作。
- MINOR：文字、標籤、提示或格式可改善。

完成標準：BLOCKER 與 MAJOR 都為 0，所有參考解答通過全部測資。最後輸出每題 PASS/FAIL、發現與已修正項目、執行過的驗證命令摘要、尚存人工決策。
```

---

## Prompt D：單一 Agent 完整工作流

不方便分三個 Agent 時使用。品質通常略低於獨立審題，但比「請幫我出幾題」穩定許多。

```text
請在目前 ThinkLab repository 中批量設計、實作並驗證 {{COUNT}} 題程式題。

參數：
- 題號起點：{{START_ID}}
- audienceLevel：{{AUDIENCE_LEVEL}}
- platformMode：{{PLATFORM_MODE}}
- 課程單元：{{UNIT}}
- 已學概念：{{LEARNED_CONCEPTS}}
- 本批新概念：{{NEW_CONCEPTS}}
- 禁止概念：{{FORBIDDEN_CONCEPTS}}
- 情境偏好：{{THEME}}

完整規則：
{{貼上本文件的「專案事實」「分級代碼」「Scratch／Blockly 適用規則」}}
{{貼上 Prompt B 的「不可違反」「完整題目 JSON 格式」「生成後必做驗證」}}

工作順序：
1. 先理解 repository 與既有題目，提出簡短題組藍圖。
2. 自己檢查題目間是否重複、是否適齡；需要調整時直接調整。
3. 建立 problems/NNN.json、solutions/NNN.py，更新 problems/index.json。
4. 完成全部自動驗證。
5. 暫時切換為反方審題員，先假設每題有錯，做規格、邊界、隨機／窮舉交叉檢查和 mutation test。
6. 修正後重新執行全部驗證，直到沒有 BLOCKER 或 MAJOR。

若任何必要參數缺少，先從現有課程脈絡作最保守且適齡的假設，並在回報中明示；只有會改變整批教學方向的缺項才詢問使用者。
```

---

## 可直接複製的批次範例

### 小學中年級：Scratch／Blockly

```text
題數：6
題號起點：011
audienceLevel：E-MID
platformMode：Scratch/Blockly
課程單元：變數、輸入輸出與固定次數重複
已學概念：角色說出內容、詢問並等待、變數、加減法、重複指定次數
本批新概念：累加器
禁止概念：清單、巢狀迴圈、負數、餘數、函式、遞迴
情境偏好：校園、文具、動物、簡單遊戲計分；每題故事不超過 120 字
```

### 小學高年級：Blockly／Python 過渡

```text
題數：8
題號起點：017
audienceLevel：E-UPPER
platformMode：Blockly/Python
課程單元：條件、迴圈與簡單清單
已學概念：變數、四則運算、if/else、固定次數迴圈
本批新概念：最大／最小值、計數器、清單逐項處理
禁止概念：巢狀清單、遞迴、雜湊、排序演算法、浮點數
情境偏好：生活資料與簡單闖關，不使用金錢利息或成人職場情境
```

### 國一：Python 基礎

```text
題數：10
題號起點：025
audienceLevel：M-7
platformMode：Blockly/Python
課程單元：條件、迴圈、字串與一維陣列
已學概念：輸入輸出、整數運算、if/elif/else、for、while
本批新概念：字串逐字走訪、一維陣列累加與搜尋
禁止概念：二維陣列、遞迴、dict/set、排序、類別
情境偏好：多元；避免所有題目都包裝成競賽或遊戲
```

### 國二至國三：演算法銜接

```text
題數：10
題號起點：035
audienceLevel：M-8（下一批改為 M-9，不要在同批混級）
platformMode：Python
課程單元：二維陣列、函式、搜尋與模擬
已學概念：一維陣列、字串、迴圈、條件、簡單函式
本批新概念：二維走訪、規則模擬、線性搜尋
禁止概念：遞迴、圖論、動態規劃、進階資料結構
情境偏好：科學觀察、交通、校園資料、棋盤
```

### 高中較好至大學：演算法題

```text
題數：8
題號起點：045
audienceLevel：A-HS（大學批次改為 A-UNI）
platformMode：Python
課程單元：圖搜尋與動態規劃
已學概念：函式、遞迴、集合、佇列、複雜度、二維陣列
本批新概念：BFS 最短步數、狀態定義與轉移
禁止概念：超出課程的進階定理、第三方套件
情境偏好：以清楚模型為主，故事簡短；限制必須能區分錯誤複雜度
```

---

## 使用建議

- 每一批只放一個 `audienceLevel`，不要在同批混合小學與高中題。
- 先建立「概念 × 年級 × 題型」課程矩陣，再讓 Agent 填題，能避免題庫大量重複。
- 生成 10 題時，測試與審查通常比寫題面更耗時；寧可小批次通過審查後再擴增。
- 目前 `testCases` 會隨 JSON 下載到瀏覽器，嚴格來說不是隱藏測資。若未來要防止學生讀取答案，需要後端判題服務。
- 若要讓學生直接拖 Scratch／Blockly 積木並提交，網站需新增積木編輯器與「積木 → Python／JavaScript」執行層；本文件只保證題目在教學概念上可用積木解出。
