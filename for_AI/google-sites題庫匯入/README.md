# Google Sites 題庫匯入工作流

這個目錄追蹤 `selenium/output/normalized` 內 200 題 Google Sites 封存資料，供後續人工審題與匯入 ThinkLab 使用。來源資料的 `candidate_test_cases` 只是從原站判題格式轉出的候選案例，不能直接當成完整測資。

## 檔案

- `catalog.json`：由腳本產生的完整題庫目錄；列出分類、標籤、候選案例數、內容雜湊及匯入狀態。
- `imports.json`：人工維護的匯入登錄；只有完成題意、輸入輸出、測資、解答與學習階梯審核後才能加入。
- `../../scripts/sync_google_sites_catalog.py`：重建目錄並檢查來源改版與追溯資料。

## 更新流程

1. 依 `selenium/README.md` 更新封存並執行 crawler 的離線測試與 export。
2. 在 Pyjudge 根目錄執行：

   ```bash
   python3 scripts/sync_google_sites_catalog.py --write
   ```

3. 審閱 `catalog.json` 差異：
   - `unreviewed`：尚未匯入。
   - `imported`：來源雜湊與已審版本相同。
   - `source_changed`：來源在匯入後有變動，需重新審題，不可直接覆蓋正式題目。
4. 匯入題目時遵循 `for_AI/AI_AGENT_工作流與開發規範.md`：配置最新連續 ID、分別判定 `stage`／`audienceLevel`／`difficulty`／`apcsLevel`、重寫明確的 stdin/stdout 規格、至少 3 組公開範例與 8 組正式測資、建立參考解答並更新學習階梯。
5. 在正式題目 JSON 保留 `source.site`、`source.sourceId`、`source.sourceUrl` 與改編說明；把 catalog 的 `sourceContentHash` 登錄到 `imports.json`。
6. 若要讓 `selenium/output/normalized` 保持為「待審佇列」，只能在正式題目已通過全部檢查後移除來源檔。移除前必須在 `imports.json` 保留 `sourceTitle`、`categories`、`tags`、`candidateCaseCount` 與 `sourceRemovedAt`；目錄中的 `sourceAvailable: false` 表示來源已從待審佇列移除，但正式題目與來源雜湊仍可追溯。
7. 執行完整檢查：

   ```bash
   python3 scripts/sync_google_sites_catalog.py --check
   python3 scripts/verify_problems.py
   node scripts/verify_editors.cjs
   ```

## 重要界線

- 不把來源公開案例視為足夠的隱藏測資，也不自動產生未審核答案。
- 不以 crawler 建議 ID 覆蓋目前 `problems/index.json`；每次匯入都重新讀取最新 ID。
- 原站採「最後一個非空輸出值」的型別化比對，ThinkLab 採 stdout 末尾空白相容的完整字串比對；布林、浮點、清單、空字串及多行輸出必須逐題確認。
- `imports.json` 的雜湊只代表已審來源版本，不代表來源授權或題目品質已自動確認。
- 已登錄 `sourceRemovedAt` 的來源可以不再存在於 Selenium 的 `normalized` 目錄；若沒有此欄位而來源消失，目錄檢查仍會失敗，以防誤刪。
