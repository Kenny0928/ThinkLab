"""bDesigner 題庫改編匯入的共用工具。

每題規格包含：題意、參考解答（落檔成 solutions/NNN.py）、獨立 oracle、測資輸入、
隨機對拍資料，以及原站公開範例／原站測資（source_checks）。

驗證時會：
1. 以參考解答執行所有測資，與 oracle 結果比對；
2. 以參考解答執行原站範例與測資，確認改編後的題意與原站答案一致；
3. 以固定種子隨機資料對拍參考解答與 oracle。

只有加上 --write 才會覆寫 problems/NNN.json 與 solutions/NNN.py；
problems/index.json 由 --write 同步追加或更新同 id 的索引項目。
"""
from __future__ import annotations

import argparse
import contextlib
import io
import json
from pathlib import Path
import random
import sys
import textwrap

ROOT = Path(__file__).resolve().parents[2]
SOURCE_BASE = "https://bdesigner.star-kids.info/blockly2/index34.php?value="
RECORDS: list[dict] = []


def lines(*rows) -> str:
    return "\n".join(" ".join(map(str, r)) if isinstance(r, (list, tuple)) else str(r) for r in rows)


def run(code: str, data: str) -> str:
    """在記憶體中以 stdin/stdout 執行參考解答。"""
    stdin, stdout = sys.stdin, sys.stdout
    sys.stdin, sys.stdout = io.StringIO(data if data.endswith("\n") else data + "\n"), io.StringIO()
    try:
        exec(compile(code, "<solution>", "exec"), {"__name__": "__main__"})
        return sys.stdout.getvalue()
    finally:
        sys.stdin, sys.stdout = stdin, stdout


def html_list(items):
    return "<ul>" + "".join(f"<li>{x}</li>" for x in items) + "</ul>" if items else ""


def add(pid, title, *, stage, difficulty, audience, tags, objectives, prerequisites,
        lead, body, input_format, output_format, constraints, hint, solution, oracle,
        cases, fuzz=(), source_ids, source_title, categories, source_checks, adaptation,
        time_limit=1):
    solution = textwrap.dedent(solution).strip() + "\n"
    cases = list(dict.fromkeys(c.strip("\n") for c in cases))
    assert len(cases) >= 10, (pid, len(cases))
    tests = [{"input": c, "output": str(oracle(c)).rstrip()} for c in cases]
    body_html = "".join(f"<p>{p}</p>" for p in ([body] if isinstance(body, str) else body))
    problem = {
        "id": pid, "title": title, "stage": stage, "difficulty": difficulty,
        "audienceLevel": audience, "apcsLevel": None, "platformMode": "Python",
        "tags": tags, "learningObjectives": objectives, "prerequisites": prerequisites,
        "description": f"<p class='problem-lead'>{lead}</p>{body_html}",
        "inputFormat": f"<p>{input_format}</p>", "outputFormat": f"<p>{output_format}</p>",
        "constraints": html_list(constraints), "hint": f"<p>{hint}</p>",
        "timeLimit": time_limit, "memoryLimit": 256,
        "samples": tests[:3], "sampleInput": tests[0]["input"], "sampleOutput": tests[0]["output"],
        "testCases": tests,
        "source": {
            "site": "bdesigner",
            "sourceId": [str(s) for s in source_ids],
            "sourceTitle": source_title,
            "sourceUrl": [SOURCE_BASE + str(s) for s in source_ids],
            "categories": categories,
            "adaptation": adaptation,
        },
    }
    RECORDS.append({"problem": problem, "solution": solution, "oracle": oracle,
                    "fuzz": list(fuzz), "source_checks": source_checks})


def verify(rec) -> list[str]:
    p, code, oracle = rec["problem"], rec["solution"], rec["oracle"]
    errors = []
    for i, tc in enumerate(p["testCases"], 1):
        got = run(code, tc["input"]).rstrip()
        if got != tc["output"]:
            errors.append(f"測資#{i} 解答={got!r} oracle={tc['output']!r}\n{tc['input']}")
    for data, expected in rec["source_checks"]:
        got = run(code, data).rstrip()
        # 原站比對忽略所有空白，因此改編後的多行輸出只需在去除空白後與原站答案相同。
        if "".join(got.split()) != "".join(expected.split()):
            errors.append(f"原站資料不符 解答={got!r} 原站={expected!r}\n{data}")
    for data in rec["fuzz"]:
        got, want = run(code, data).rstrip(), str(oracle(data)).rstrip()
        if got != want:
            errors.append(f"對拍不符 解答={got!r} oracle={want!r}\n{data}")
            break
    if len(p["testCases"]) < 10:
        errors.append("測資少於 10 組")
    if len({(s["input"], s["output"]) for s in p["samples"]}) != len(p["samples"]):
        errors.append("公開範例重複")
    return errors


def write(rec):
    p = rec["problem"]
    pid = p["id"]
    (ROOT / "problems" / f"{pid:03d}.json").write_text(
        json.dumps(p, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (ROOT / "solutions" / f"{pid:03d}.py").write_text(rec["solution"], encoding="utf-8")
    index_path = ROOT / "problems" / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    entry = {k: p[k] for k in ("id", "title", "stage", "audienceLevel", "apcsLevel", "difficulty", "tags")}
    index = [e for e in index if e["id"] != pid] + [entry]
    index.sort(key=lambda e: e["id"])
    index_path.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="驗證通過後覆寫題目、解答與索引")
    args = ap.parse_args()
    failed = 0
    for rec in RECORDS:
        p = rec["problem"]
        errs = verify(rec)
        mark = "PASS" if not errs else "FAIL"
        print(f"[{mark}] {p['id']:03d} {p['title']}（{len(p['testCases'])} 組測資，"
              f"原站核對 {len(rec['source_checks'])}，對拍 {len(rec['fuzz'])}）")
        for e in errs[:3]:
            print("   ", e.replace("\n", "\n    "))
        failed += bool(errs)
    if failed:
        print(f"失敗 {failed} 題，未寫入。")
        sys.exit(1)
    if args.write:
        for rec in RECORDS:
            write(rec)
        print(f"已寫入 {len(RECORDS)} 題。")


__all__ = ["add", "lines", "main", "random"]
