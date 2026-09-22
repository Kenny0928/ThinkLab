#!/usr/bin/env python3
"""
SkillLab 題庫與解答自動化驗證工具
用途：
1. 檢核 problems/index.json 的格式、ID 唯一性與標籤。
2. 檢核各 problems/NNN.json 的欄位完整性與測資定義。
3. 自動以 Python 執行 solutions/NNN.py，驗證所有 testCases 輸出是否一致（末尾空白相容）。
4. 產生清晰的彩色報告，供 AI Agent 與開發者快速驗證。
"""

import os
import sys
import json
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
PROBLEMS_DIR = BASE_DIR / "problems"
SOLUTIONS_DIR = BASE_DIR / "solutions"
INDEX_FILE = PROBLEMS_DIR / "index.json"
VALID_STAGES = {"Beginner", "Intermediate", "Advanced", "Challenge"}
VALID_AUDIENCE_LEVELS = {"E-MID", "E-UPPER", "M-7", "M-8", "M-HS", "A-HS"}
VALID_APCS_LEVELS = {"APCS-Concept", "APCS-Implementation", "APCS-Advanced"}

# ANSI 色彩定義
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def log_pass(msg):
    print(f"{GREEN}✓ PASS{RESET} {msg}")

def log_fail(msg):
    print(f"{RED}✗ FAIL{RESET} {msg}")

def log_warn(msg):
    print(f"{YELLOW}⚠ WARN{RESET} {msg}")

def log_info(msg):
    print(f"{CYAN}ℹ INFO{RESET} {msg}")

def verify_all():
    print(f"\n{BOLD}{CYAN}==================================================={RESET}")
    print(f"{BOLD}{CYAN}      ThinkLab 題庫與測資全量自動化驗證工具          {RESET}")
    print(f"{BOLD}{CYAN}==================================================={RESET}\n")

    if not INDEX_FILE.exists():
        log_fail(f"找不到題庫清單檔案: {INDEX_FILE}")
        return False

    try:
        with open(INDEX_FILE, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as e:
        log_fail(f"解析 {INDEX_FILE} 失敗 (JSON 格式錯誤): {e}")
        return False

    if not isinstance(manifest, list):
        log_fail(f"{INDEX_FILE} 頂層必須是陣列 (Array)")
        return False

    log_pass(f"成功讀取題目清單: 共 {len(manifest)} 題\n")

    total_problems = len(manifest)
    passed_problems = 0
    failed_problems = 0
    seen_ids = set()

    for idx, item in enumerate(manifest):
        pid = item.get("id")
        title = item.get("title", "未命名")
        stage = item.get("stage")
        audience_level = item.get("audienceLevel")
        difficulty = item.get("difficulty")
        apcs_level = item.get("apcsLevel")
        tags = item.get("tags", [])

        print(f"{BOLD}--- [題目 #{idx+1}] ID: {pid} | {title} ({difficulty}) ---{RESET}")

        # 1. 檢查 Index 中的基本資訊
        if pid is None or not isinstance(pid, int):
            log_fail(f"題目索引中 'id' 無效: {pid}")
            failed_problems += 1
            continue

        if pid in seen_ids:
            log_fail(f"發現重複的題目 ID: {pid}")
            failed_problems += 1
            continue
        seen_ids.add(pid)

        if difficulty not in ["Easy", "Medium", "Hard"]:
            log_fail(f"題目索引中的 difficulty 無效: {difficulty}")
            failed_problems += 1
            continue
        if stage not in VALID_STAGES:
            log_fail(f"題目索引中的 stage 無效: {stage}")
            failed_problems += 1
            continue
        if audience_level not in VALID_AUDIENCE_LEVELS:
            log_fail(f"題目索引中的 audienceLevel 無效: {audience_level}")
            failed_problems += 1
            continue
        if apcs_level is not None and apcs_level not in VALID_APCS_LEVELS:
            log_fail(f"題目索引中的 apcsLevel 無效: {apcs_level}")
            failed_problems += 1
            continue

        # 2. 檢查對應的 problems/NNN.json
        prob_filename = f"{pid:03d}.json"
        prob_file = PROBLEMS_DIR / prob_filename
        if not prob_file.exists():
            log_fail(f"找不到題目內容檔案: {prob_file}")
            failed_problems += 1
            continue

        try:
            with open(prob_file, "r", encoding="utf-8") as f:
                prob_data = json.load(f)
        except Exception as e:
            log_fail(f"解析 {prob_filename} 失敗 (JSON 語法錯誤): {e}")
            failed_problems += 1
            continue

        # 檢查內部欄位
        required_fields = [
            "id", "title", "stage", "audienceLevel", "difficulty", "apcsLevel",
            "description", "inputFormat", "outputFormat", "samples", "testCases"
        ]
        missing_fields = [rf for rf in required_fields if rf not in prob_data]
        if missing_fields:
            log_fail(f"{prob_filename} 缺少必要欄位: {missing_fields}")
            failed_problems += 1
            continue

        if prob_data["id"] != pid:
            log_fail(f"{prob_filename} 內部 id ({prob_data['id']}) 與 index id ({pid}) 不符")
            failed_problems += 1
            continue

        problem_stage = prob_data["stage"]
        problem_audience_level = prob_data["audienceLevel"]
        problem_apcs_level = prob_data["apcsLevel"]
        if problem_stage not in VALID_STAGES:
            log_fail(f"{prob_filename} 的 stage 無效: {problem_stage}")
            failed_problems += 1
            continue
        if problem_audience_level not in VALID_AUDIENCE_LEVELS:
            log_fail(f"{prob_filename} 的 audienceLevel 無效: {problem_audience_level}")
            failed_problems += 1
            continue
        if problem_apcs_level is not None and problem_apcs_level not in VALID_APCS_LEVELS:
            log_fail(f"{prob_filename} 的 apcsLevel 無效: {problem_apcs_level}")
            failed_problems += 1
            continue
        if prob_data["difficulty"] not in ["Easy", "Medium", "Hard"]:
            log_fail(f"{prob_filename} 的 difficulty 無效: {prob_data['difficulty']}")
            failed_problems += 1
            continue
        if problem_stage == "Challenge" and problem_apcs_level is None:
            log_fail(f"{prob_filename} 為 Challenge，但缺少 APCS 導向分類")
            failed_problems += 1
            continue
        if problem_stage != "Challenge" and problem_apcs_level is not None:
            log_fail(f"{prob_filename} 非 Challenge，apcsLevel 應為 null")
            failed_problems += 1
            continue
        classification = (problem_stage, problem_audience_level, problem_apcs_level)
        manifest_classification = (stage, audience_level, apcs_level)
        if classification != manifest_classification:
            log_fail(
                f"{prob_filename} 的 stage/audienceLevel/apcsLevel 與 index.json 不一致"
            )
            failed_problems += 1
            continue
        if prob_data["difficulty"] != difficulty:
            log_fail(f"{prob_filename} 的 difficulty 與 index.json 不一致")
            failed_problems += 1
            continue

        test_cases = prob_data.get("testCases", [])
        if not isinstance(test_cases, list) or len(test_cases) == 0:
            log_fail(f"{prob_filename} 的 testCases 必須是非空陣列")
            failed_problems += 1
            continue

        samples = prob_data.get("samples", [])
        fixed_output_problem = len(test_cases) == 1 and test_cases[0].get("input", "") == ""
        minimum_samples = 1 if fixed_output_problem else 3
        if not isinstance(samples, list) or len(samples) < minimum_samples:
            log_fail(f"{prob_filename} 的 samples 至少需要 {minimum_samples} 組公開範例")
            failed_problems += 1
            continue
        if any(not isinstance(sample, dict) or not isinstance(sample.get("input"), str) or not isinstance(sample.get("output"), str) for sample in samples):
            log_fail(f"{prob_filename} 的每組公開範例都必須包含字串型別的 input 與 output")
            failed_problems += 1
            continue
        if len({(sample["input"], sample["output"]) for sample in samples}) != len(samples):
            log_fail(f"{prob_filename} 包含重複的公開範例")
            failed_problems += 1
            continue

        if len(test_cases) < 4:
            log_warn(f"{prob_filename} 測資數量偏少 ({len(test_cases)} 組)，建議至少 8 組涵蓋邊界")
        else:
            log_info(f"包含 {len(test_cases)} 組測資")

        # 3. 檢查對應解答 solutions/NNN.py
        sol_filename = f"{pid:03d}.py"
        sol_file = SOLUTIONS_DIR / sol_filename
        if not sol_file.exists():
            log_warn(f"未找到參考解答檔案: {sol_file} (跳過執行期驗證)")
            passed_problems += 1
            print()
            continue

        # 4. 執行解答並比對所有 testCases
        all_tests_passed = True
        timeout_seconds = prob_data.get("timeLimit", 2) + 2  # 給予充裕執行緩衝

        for case_idx, tc in enumerate(test_cases, start=1):
            inp = tc.get("input", "")
            expected = tc.get("output", "")

            try:
                proc = subprocess.run(
                    [sys.executable, str(sol_file)],
                    input=inp,
                    text=True,
                    capture_output=True,
                    timeout=timeout_seconds
                )
            except subprocess.TimeoutExpired:
                log_fail(f"測資 #{case_idx} 超時 (>{timeout_seconds}s)")
                all_tests_passed = False
                break
            except Exception as e:
                log_fail(f"執行解答失敗: {e}")
                all_tests_passed = False
                break

            if proc.returncode != 0:
                log_fail(f"測資 #{case_idx} 執行出錯 (Runtime Error):\n{proc.stderr.strip()}")
                all_tests_passed = False
                break

            actual = proc.stdout
            # 依照 SkillLab 規定：忽略輸出末尾的所有空白與換行，進行精準比對
            if actual.rstrip() != expected.rstrip():
                log_fail(f"測資 #{case_idx} 答案不一致 (Wrong Answer)")
                print(f"   輸入:\n{inp.strip() if inp.strip() else '(無)'}")
                print(f"   預期輸出:\n{expected.strip()}")
                print(f"   實際輸出:\n{actual.strip()}")
                all_tests_passed = False
                break

        if all_tests_passed:
            log_pass(f"參考解答通過全部 {len(test_cases)} 組測資驗證")
            passed_problems += 1
        else:
            failed_problems += 1

        print()

    print(f"{BOLD}{CYAN}==================================================={RESET}")
    print(f"驗證總結: 共 {total_problems} 題 | {GREEN}通過: {passed_problems}{RESET} | {RED if failed_problems > 0 else ''}失敗: {failed_problems}{RESET}")
    print(f"{BOLD}{CYAN}==================================================={RESET}\n")

    return failed_problems == 0

if __name__ == "__main__":
    success = verify_all()
    sys.exit(0 if success else 1)
