# 154–213 原創題組的可重現驗證

這些工具保存題目規格、邊界測資及獨立 oracle，供維護者檢查本批 60 題。它們只供本機開發使用，網站不需要執行這些腳本。

在儲存庫根目錄執行：

```bash
python3 scripts/problem_expansion_154_213/lv2.py
python3 scripts/problem_expansion_154_213/lv3.py
python3 scripts/problem_expansion_154_213/apcs.py
python3 scripts/verify_problems.py
```

前三個指令預設只驗證已落檔題目與解答，不寫入檔案。除正式測資外，也用固定亂數種子產生小資料，對拍暴力枚舉、不同資料表示、標準函式庫或不同演算法所得答案。大型挑戰測資採可推導的期望值，另核對輸入範圍、圖的形狀及道路限制。

APCS 題組可使用 `--rounds 200` 增加每題隨機對拍次數；預設每題 80 次。

只有明確加上 `--write` 才會依腳本內規格重建該組 `problems/NNN.json` 與 `solutions/NNN.py`，並覆蓋同題號檔案。若要修改題目，請同步更新腳本內規格與 oracle，再重建、重跑驗證。重建不會更新 `problems/index.json` 或教學文件，這兩者仍需一起維護。

題組分工與分級：

| 腳本 | 題號 | 階段 | 題數 |
|---|---|---|---:|
| `lv2.py` | 154–178 | Intermediate / LV.2 | 25 |
| `lv3.py` | 179–203 | Advanced / LV.3 | 25 |
| `apcs.py` | 204–213 | Challenge / APCS 導向 | 10 |

詳細題單、舊題審查與本次驗證結果見 [擴充審查紀錄](../../docs/題庫擴充審查_154-213.md)。
