#!/usr/bin/env python3
"""Rebuild and independently verify original LV3 problems 179–203.

Usage: python3 scripts/problem_expansion_154_213/lv3.py [--write]
Expected outputs come from independent oracles below, never from solutions.
Each problem additionally gets 60 deterministic small random differential tests.
"""
import argparse
import contextlib
import functools
import io
import itertools
import json
import math
from pathlib import Path
import random
import sys
import textwrap

ROOT = Path(__file__).resolve().parents[2]
RNG = random.Random(179203)
SPECS = []


def line(values):
    return " ".join(map(str, values))


def array(values):
    return f"{len(values)}\n{line(values)}"


def matrix(rows):
    return f"{len(rows)} {len(rows[0])}\n" + "\n".join(line(row) for row in rows)


def add(pid, title, tags, goal, prereq, lead, detail, hint, infmt, outfmt,
        limits, solution, encode, oracle, cases, random_case, difficulty="Medium", audience="M-HS"):
    inputs = set()
    tests = []
    for data in cases:
        inp = encode(data)
        assert inp not in inputs, (pid, "duplicate fixed case")
        inputs.add(inp)
        tests.append({"input": inp, "output": str(oracle(data))})
    while len(tests) < 12:
        data = random_case()
        inp = encode(data)
        if inp not in inputs:
            inputs.add(inp)
            tests.append({"input": inp, "output": str(oracle(data))})
    samples = tests[:3]
    problem = dict(id=pid, title=title, stage="Advanced", difficulty=difficulty,
                   tags=tags, audienceLevel=audience, apcsLevel=None, platformMode="Python",
                   learningObjectives=[goal], prerequisites=prereq,
                   description=f"<p class='problem-lead'>{lead}</p><p>{detail}</p>",
                   hint=f"<p>{hint}</p>", inputFormat=f"<p>{infmt}</p>",
                   outputFormat=f"<p>{outfmt}</p>",
                   constraints="<ul>" + "".join(f"<li>{x}</li>" for x in limits) + "</ul>",
                   timeLimit=2, memoryLimit=256, sampleInput=samples[0]["input"],
                   sampleOutput=samples[0]["output"], samples=samples, testCases=tests)
    source = textwrap.dedent(solution).lstrip()
    differential = []
    for _ in range(60):
        data = random_case()
        differential.append({"input": encode(data), "output": str(oracle(data))})
    SPECS.append((problem, source, differential))


def build():
    # 179: oracle compares candidates pairwise, rather than using a tuple sort key.
    def ranking_oracle(rows):
        def better(a, b):
            if sum(a[1:]) != sum(b[1:]):
                return sum(a[1:]) > sum(b[1:])
            if a[1] != b[1]:
                return a[1] > b[1]
            return a[0] < b[0]
        placed = [None] * len(rows)
        for a in rows:
            placed[sum(better(b, a) for b in rows)] = a[0]
        return line(placed)
    add(179, "競賽成績排序", ["排序", "多重排序鍵"], "依總分、單科與編號建立一致的多鍵排序規則", ["清單", "排序", "元組"],
        "依指定的三層規則排列參賽者編號。",
        "每人有不重複的編號、筆試分數與實作分數。先依兩科總分由高到低排列；總分相同時，筆試分數高者在前；仍相同時，編號小者在前。輸入順序不代表排名。",
        "把每一層優先規則依序放入排序鍵。",
        "第一行為人數 <code>N</code>。接下來 N 行各有 <code>編號 筆試分數 實作分數</code>。",
        "一行依排名輸出所有編號，以單一空格分隔。",
        ["1 ≤ N ≤ 2000", "1 ≤ 編號 ≤ 10000，編號互不相同", "0 ≤ 各科分數 ≤ 100"],
        '''
        # 核心：依總分降冪、筆試降冪、編號升冪排序。時間 O(N log N)，空間 O(N)。
        import sys
        tokens = list(map(int, sys.stdin.read().split()))
        n = tokens[0]
        records = [tuple(tokens[i:i + 3]) for i in range(1, len(tokens), 3)]
        records.sort(key=lambda r: (-(r[1] + r[2]), -r[1], r[0]))
        print(*(r[0] for r in records))
        ''', lambda rows: str(len(rows)) + "\n" + "\n".join(line(r) for r in rows), ranking_oracle,
        [[(3, 80, 90), (1, 90, 80), (2, 90, 80)], [(9, 0, 0)], [(7, 100, 0), (4, 40, 70), (2, 0, 100)],
         [(1, 100, 100)], [(10000, 0, 100), (1, 100, 0)], [(5, 0, 0), (2, 0, 0)],
         [(i, i % 101, (i * 7) % 101) for i in range(2000, 0, -1)]],
        lambda: [(i, RNG.randint(0, 100), RNG.randint(0, 100)) for i in RNG.sample(range(1, 60), RNG.randint(1, 12))],
        difficulty="Easy", audience="M-8")

    # 180: linear counting is independent of binary-search boundaries.
    add(180, "商品價格上限查詢", ["二分搜尋", "排序"], "排序後使用二分搜尋回答多次小於等於上限的計數查詢", ["排序", "清單索引"],
        "回答每個預算能買得起多少項商品。",
        "共有 N 項商品，每項各算一項，即使價格相同也分別計算。每次查詢給定預算 B，請計算價格小於或等於 B 的商品項數；各次查詢互不影響，不必扣除商品。",
        "排序後，第一個大於預算的位置就是答案。",
        "第一行為 <code>N Q</code>。第二行為 N 個商品價格。接下來 Q 行各有一個預算 B。",
        "共 Q 行，每行輸出該次查詢的商品項數。",
        ["1 ≤ N, Q ≤ 2000", "0 ≤ 商品價格, B ≤ 1000000"],
        '''
        # 核心：排序後用 bisect_right 找到每個上限右側的位置。時間 O(N log N + Q log N)，空間 O(N + Q)。
        import sys
        from bisect import bisect_right
        data = list(map(int, sys.stdin.read().split()))
        n, q = data[:2]
        prices = sorted(data[2:2 + n])
        print("\\n".join(str(bisect_right(prices, b)) for b in data[2 + n:]))
        ''', lambda d: f"{len(d[0])} {len(d[1])}\n{line(d[0])}\n" + "\n".join(map(str, d[1])),
        lambda d: "\n".join(str(sum(x <= b for x in d[0])) for b in d[1]),
        [([40, 10, 40, 90], [0, 40, 100]), ([0], [0]), ([5, 5, 5], [4, 5, 6]),
         ([1000000], [0, 999999, 1000000]), ([0, 1000000], [1, 999999]),
         (list(range(2000)), [i * 500 for i in range(1999)] + [1000000])],
        lambda: ([RNG.randint(0, 30) for _ in range(RNG.randint(1, 20))], [RNG.randint(0, 35) for _ in range(RNG.randint(1, 12))]),
        difficulty="Easy", audience="M-8")

    # 181: direct summation oracle.
    def enc_range(d):
        a, queries = d
        return f"{len(a)} {len(queries)}\n{line(a)}\n" + "\n".join(line(q) for q in queries)
    def rand_range():
        a = [RNG.randint(-20, 20) for _ in range(RNG.randint(1, 20))]
        queries = [sorted(RNG.choices(range(1, len(a) + 1), k=2)) for _ in range(RNG.randint(1, 12))]
        return a, queries
    add(181, "連續帳目總額", ["前綴和", "區間查詢"], "用前綴和將多次區間加總轉為兩次查表", ["清單", "累加"],
        "計算指定起訖編號之間的帳目總額。",
        "N 筆帳目依序編號 1 到 N，正數代表收入，負數代表支出。每次給定 L 與 R，求第 L 筆到第 R 筆的總和，包含兩端。帳目不會被修改。",
        "在最前面補上總額 0，區間就能表示為兩段前綴之差。",
        "第一行為 <code>N Q</code>，第二行為 N 個帳目金額。接下來 Q 行各有 <code>L R</code>。",
        "共 Q 行，依序輸出每個區間的總額。",
        ["1 ≤ N, Q ≤ 2000", "-1000000 ≤ 金額 ≤ 1000000", "1 ≤ L ≤ R ≤ N"],
        '''
        # 核心：prefix[i] 保存前 i 筆總額。時間 O(N + Q)，空間 O(N + Q)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n, q = data[:2]
        prefix = [0]
        for amount in data[2:2 + n]:
            prefix.append(prefix[-1] + amount)
        answers = []
        for i in range(2 + n, len(data), 2):
            left, right = data[i:i + 2]
            answers.append(str(prefix[right] - prefix[left - 1]))
        print("\\n".join(answers))
        ''', enc_range, lambda d: "\n".join(str(sum(d[0][l - 1:r])) for l, r in d[1]),
        [([5, -2, 8, -4], [(1, 3), (2, 4), (4, 4)]), ([0], [(1, 1)]), ([-5, -3, -1], [(1, 3), (2, 2)]),
         ([1000000], [(1, 1)]), ([-1000000], [(1, 1)]), ([0] * 2000, [(1, i) for i in range(1, 2001)]),
         ([1000000] * 2000, [(1, 2000), (2000, 2000)]), ([9, -9, 9, -9], [(1, 4), (2, 3)])], rand_range,
        difficulty="Easy", audience="M-8")

    # 182: direct rectangular enumeration oracle.
    def enc_rect(d):
        a, qs = d
        return f"{len(a)} {len(a[0])} {len(qs)}\n" + "\n".join(line(row) for row in a) + "\n" + "\n".join(line(q) for q in qs)
    def rand_rect():
        h, w = RNG.randint(1, 7), RNG.randint(1, 7)
        a = [[RNG.randint(-10, 10) for _ in range(w)] for _ in range(h)]
        qs = []
        for _ in range(RNG.randint(1, 8)):
            r1, r2 = sorted(RNG.choices(range(1, h + 1), k=2))
            c1, c2 = sorted(RNG.choices(range(1, w + 1), k=2))
            qs.append((r1, c1, r2, c2))
        return a, qs
    add(182, "矩形區域總和", ["二維前綴和", "二維陣列"], "利用二維前綴和與容斥回答矩形加總查詢", ["二維清單", "前綴和"],
        "計算每個指定矩形內所有格子的總和。",
        "方格有 R 列、C 欄；列由上往下、欄由左往右，皆從 1 編號。每次指定左上角 (r1, c1) 與右下角 (r2, c2)，加總包含邊界的所有格子。",
        "取大矩形扣除上方與左方時，左上角被重複扣掉了。",
        "第一行為 <code>R C Q</code>。接下來 R 行各有 C 個整數。再接下來 Q 行各有 <code>r1 c1 r2 c2</code>。",
        "共 Q 行，依序輸出每個矩形的總和。",
        ["1 ≤ R, C ≤ 50", "1 ≤ Q ≤ 500", "-1000 ≤ 格子值 ≤ 1000", "1 ≤ r1 ≤ r2 ≤ R；1 ≤ c1 ≤ c2 ≤ C"],
        '''
        # 核心：二維前綴和用容斥去掉重疊區。時間 O(RC + Q)，空間 O(RC + Q)。
        import sys
        it = iter(map(int, sys.stdin.read().split()))
        rows, cols, q = next(it), next(it), next(it)
        prefix = [[0] * (cols + 1) for _ in range(rows + 1)]
        for r in range(1, rows + 1):
            for c in range(1, cols + 1):
                prefix[r][c] = next(it) + prefix[r - 1][c] + prefix[r][c - 1] - prefix[r - 1][c - 1]
        answers = []
        for _ in range(q):
            r1, c1, r2, c2 = next(it), next(it), next(it), next(it)
            answers.append(str(prefix[r2][c2] - prefix[r1 - 1][c2] - prefix[r2][c1 - 1] + prefix[r1 - 1][c1 - 1]))
        print("\\n".join(answers))
        ''', enc_rect, lambda d: "\n".join(str(sum(d[0][r][c] for r in range(r1 - 1, r2) for c in range(c1 - 1, c2))) for r1, c1, r2, c2 in d[1]),
        [([[1, 2, 3], [4, 5, 6]], [(1, 2, 2, 3), (2, 1, 2, 1)]), ([[0]], [(1, 1, 1, 1)]), ([[-1, 2], [3, -4]], [(1, 1, 2, 2), (1, 2, 2, 2)]),
         ([[1000] * 50 for _ in range(50)], [(1, 1, 50, 50)] * 500), ([[-1000]], [(1, 1, 1, 1)]),
         ([list(range(50))], [(1, 1, 1, 50), (1, 50, 1, 50)]), ([[i] for i in range(50)], [(1, 1, 50, 1)]),
         ([[0] * 50 for _ in range(50)], [(25, 25, 26, 26)])], rand_rect)

    # 183: oracle checks all candidate subarrays.
    def unique_oracle(a):
        best = 0
        for i in range(len(a)):
            for j in range(i + 1, len(a) + 1):
                if len(set(a[i:j])) == j - i:
                    best = max(best, j - i)
                else:
                    break
        return best
    add(183, "最長不重複片段", ["滑動視窗", "雜湊表"], "維護每種編號最近位置並移動連續視窗左界", ["字典", "清單走訪"],
        "找出所有編號皆不重複的最長連續片段。",
        "給定 N 個依序排列的整數編號。片段必須保留原順序且連續，不能跳過元素。輸出片段內沒有任何重複編號時，可能的最大長度。",
        "遇到重複編號時，左界只需要向右移到上次出現位置之後。",
        "第一行為 N，第二行為 N 個整數編號。", "一行輸出最大長度。",
        ["1 ≤ N ≤ 2000", "0 ≤ 編號 ≤ 1000000"],
        '''
        # 核心：用最近出現位置維護沒有重複值的視窗。時間 O(N)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        last = {}
        left = best = 0
        for right, value in enumerate(data[1:]):
            left = max(left, last.get(value, -1) + 1)
            last[value] = right
            best = max(best, right - left + 1)
        print(best)
        ''', array, unique_oracle,
        [[1, 2, 1, 3, 4, 3], [5], [7, 7, 7, 7], [0, 1000000], [0] * 2000,
         list(range(80)), [1, 2, 3, 2, 4, 5], [1, 2, 2, 1, 3], list(range(10)) * 200],
        lambda: [RNG.randint(0, 10) for _ in range(RNG.randint(1, 25))])

    # 184: independent exhaustive start/end summation.
    def min_segment(d):
        a, target = d
        best = len(a) + 1
        for start in range(len(a)):
            total = 0
            for end in range(start, len(a)):
                total += a[end]
                if total >= target:
                    best = min(best, end - start + 1)
                    break
        return 0 if best > len(a) else best
    add(184, "達標的最短連續日數", ["雙指標", "滑動視窗"], "利用資料為正數的性質維護達標的最短連續區段", ["清單", "while 迴圈"],
        "找出銷售總量達到目標的最短連續日數。",
        "每天銷售量皆為正整數。從 N 天中選取一段非空的連續日子，使總銷售量至少為 S，求最少需要幾天。若所有日子的總量仍不足，輸出 0。",
        "視窗總量達標後，試著從左側縮短它。",
        "第一行為 <code>N S</code>，第二行為 N 個每日銷售量。", "一行輸出最短日數；不存在符合條件的片段時輸出 <code>0</code>。",
        ["1 ≤ N ≤ 2000", "1 ≤ 每日銷售量 ≤ 1000", "1 ≤ S ≤ 2000001"],
        '''
        # 核心：正數視窗向右擴大、達標後縮小左端。時間 O(N)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n, target = data[:2]
        values = data[2:]
        left = total = 0
        best = n + 1
        for right, value in enumerate(values):
            total += value
            while total >= target:
                best = min(best, right - left + 1)
                total -= values[left]
                left += 1
        print(0 if best == n + 1 else best)
        ''', lambda d: f"{len(d[0])} {d[1]}\n{line(d[0])}", min_segment,
        [([2, 3, 1, 2, 4, 3], 7), ([1, 2, 3], 8), ([9, 1, 1], 9), ([1], 1), ([1], 2000001),
         ([1000] * 2000, 2000000), ([1000] * 2000, 2000001), ([1] * 2000, 1), ([1, 1, 8, 1, 1], 10)],
        lambda: ([RNG.randint(1, 10) for _ in range(RNG.randint(1, 20))], RNG.randint(1, 100)))

    # 185: repeated adjacent-pair cancellation instead of a stack.
    def bracket_oracle(s):
        while True:
            reduced = s.replace("()", "").replace("[]", "").replace("{}", "")
            if reduced == s:
                return "YES" if not s else "NO"
            s = reduced
    add(185, "三種括號配對", ["堆疊", "字串"], "用後進先出的結構檢查括號種類與巢狀順序", ["字串走訪", "清單新增與移除"],
        "判斷括號字串是否完整且正確地配對。",
        "字串只包含 <code>()[]{}</code>。每個右括號都必須和最近尚未配對、種類相同的左括號配對，且最後不能留下未配對括號。空字串也視為正確。",
        "目前遇到的右括號必須對應最後一個尚未配對的左括號。",
        "一行括號字串；長度為 0 時輸入一個空行。", "正確時輸出 <code>YES</code>，否則輸出 <code>NO</code>。",
        ["0 ≤ 字串長度 ≤ 2000", "字元只可能是 (、)、[、]、{、}"],
        '''
        # 核心：左括號入堆疊，右括號核對堆疊頂端。時間 O(N)，空間 O(N)。
        import sys
        text = sys.stdin.readline().rstrip("\\r\\n")
        matching = {')': '(', ']': '[', '}': '{'}
        stack = []
        valid = True
        for ch in text:
            if ch in '([{':
                stack.append(ch)
            elif not stack or stack.pop() != matching[ch]:
                valid = False
                break
        print('YES' if valid and not stack else 'NO')
        ''', lambda s: s + "\n", bracket_oracle,
        ["([]){}", "([)]", "", ")(", "(((", "}}}", "[{}({})]", "()" * 1000, "(" * 1000 + ")" * 1000, "(" * 999 + "]" + ")" * 1000],
        lambda: "".join(RNG.choices("()[]{}", k=RNG.randint(0, 30))), difficulty="Easy", audience="M-8")

    # 186: oracle replays the surviving sequence of deltas after UNDO.
    def inventory_oracle(d):
        initial, ops = d
        history = []
        results = []
        for op in ops:
            if op[0] == "ADD":
                history.append(op[1])
            elif op[0] == "UNDO":
                history = history[:-1]
            else:
                results.append(str(initial + sum(history)))
        return "\n".join(results)
    def enc_inventory(d):
        initial, ops = d
        return f"{initial} {len(ops)}\n" + "\n".join(line(op) for op in ops)
    def rand_inventory():
        ops = []
        for _ in range(RNG.randint(0, 20)):
            kind = RNG.choice(["ADD", "UNDO", "ASK"])
            ops.append((kind, RNG.randint(-20, 20)) if kind == "ADD" else (kind,))
        ops.append(("ASK",))
        return RNG.randint(-20, 20), ops
    add(186, "可復原的庫存紀錄", ["堆疊", "操作模擬"], "保存可逆操作的歷史並正確處理連續復原與空歷史", ["清單", "分支", "字串分割"],
        "依序執行庫存增減、復原與查詢指令。",
        "初始庫存值為 V，可為負數。<code>ADD x</code> 將庫存加上 x，並保留這筆操作；<code>UNDO</code> 復原最近一筆尚未被復原的 ADD，若沒有可復原操作則不變；<code>ASK</code> 輸出目前庫存。ASK 與 UNDO 本身不會加入可復原紀錄。",
        "只把尚未復原的 ADD 放進後進先出的紀錄。",
        "第一行為 <code>V Q</code>，接下來 Q 行各為一條指令。至少有一條 ASK。",
        "每遇到一條 ASK 就輸出一行目前庫存。", ["-1000000 ≤ V, x ≤ 1000000", "1 ≤ Q ≤ 2000"],
        '''
        # 核心：儲存 ADD 的增減量，UNDO 時撤回堆疊頂端。時間 O(Q)，空間 O(Q)。
        import sys
        lines = sys.stdin.read().splitlines()
        value, q = map(int, lines[0].split())
        history = []
        answers = []
        for text in lines[1:]:
            op = text.split()
            if op[0] == 'ADD':
                delta = int(op[1])
                value += delta
                history.append(delta)
            elif op[0] == 'UNDO':
                if history:
                    value -= history.pop()
            else:
                answers.append(str(value))
        print('\\n'.join(answers))
        ''', enc_inventory, inventory_oracle,
        [(10, [("ADD", 5), ("ASK",), ("ADD", -8), ("UNDO",), ("ASK",)]), (0, [("UNDO",), ("ASK",)]), (4, [("ADD", 3), ("ADD", 2), ("UNDO",), ("UNDO",), ("ASK",)]),
         (-1000000, [("ASK",)]), (1000000, [("ADD", -1000000), ("ASK",)]),
         (0, [("ADD", 1000000)] * 1999 + [("ASK",)]), (7, [("ADD", 0), ("UNDO",), ("UNDO",), ("ASK",)]),
         (9, [("ADD", 2), ("UNDO",), ("ADD", 6), ("ASK",), ("UNDO",), ("ASK",)])], rand_inventory,
        difficulty="Easy", audience="M-8")

    # 187: oracle simulates complete passes over a list, no deque.
    def round_oracle(d):
        times, quantum = d
        left = times[:]
        order = []
        while len(order) < len(left):
            for i in range(len(left)):
                if left[i] > 0:
                    left[i] -= min(quantum, left[i])
                    if left[i] == 0:
                        order.append(i + 1)
        return line(order)
    add(187, "輪流執行任務", ["佇列", "模擬"], "以佇列模擬執行後未完成任務重新排隊的循環", ["while 迴圈", "清單"],
        "模擬輪流執行的任務，輸出完成順序。",
        "任務依編號 1 到 N 排隊，各有需要的執行時間。每次取出隊首任務，最多執行 K 單位時間；若剩餘時間不超過 K，任務立即完成並離開，否則執行 K 單位後回到隊尾。切換任務不耗時間。",
        "每次只需處理隊首，尚未完成的任務再放回隊尾。",
        "第一行為 <code>N K</code>，第二行為 N 個任務所需時間。", "一行依完成順序輸出任務編號，以空格分隔。",
        ["1 ≤ N ≤ 200", "1 ≤ K ≤ 100", "1 ≤ 每個任務所需時間 ≤ 1000"],
        '''
        # 核心：deque 保存編號與剩餘時間。時間 O(N + Σ ceil(Ti/K))，空間 O(N)。
        import sys
        from collections import deque
        data = list(map(int, sys.stdin.read().split()))
        n, quantum = data[:2]
        queue = deque(enumerate(data[2:], 1))
        answer = []
        while queue:
            task, remaining = queue.popleft()
            if remaining <= quantum:
                answer.append(task)
            else:
                queue.append((task, remaining - quantum))
        print(*answer)
        ''', lambda d: f"{len(d[0])} {d[1]}\n{line(d[0])}", round_oracle,
        [([5, 2, 7], 3), ([8], 2), ([3, 3, 3], 3), ([1], 1), ([1000] * 200, 1),
         ([1000, 1, 1000, 1], 100), ([100, 101, 99], 100), ([1, 2, 3, 4, 5], 2)],
        lambda: ([RNG.randint(1, 30) for _ in range(RNG.randint(1, 15))], RNG.randint(1, 10)), difficulty="Easy", audience="M-8")

    # 188: longest compatible chain DP is independent of greedy earliest finish.
    def activity_oracle(intervals):
        ordered = sorted(intervals)
        dp = [1] * len(ordered)
        for i, (start, _) in enumerate(ordered):
            dp[i] += max((dp[j] for j in range(i) if ordered[j][1] <= start), default=0)
        return max(dp)
    def enc_intervals(a):
        return str(len(a)) + "\n" + "\n".join(line(x) for x in a)
    def rand_intervals():
        return [(s := RNG.randint(0, 20), s + RNG.randint(1, 10)) for _ in range(RNG.randint(1, 12))]
    add(188, "最多不重疊活動", ["貪心", "區間排序"], "選擇最早結束的活動以保留後續可選空間", ["排序", "條件判斷"],
        "選出最多場時間不重疊的活動。",
        "每場活動有開始時間 S 與結束時間 E，且 S 小於 E。同一時間只能參加一場；若前一場的結束時間等於下一場的開始時間，可以接著參加。每場活動價值相同，請輸出最多能參加的場數，不必輸出活動編號。",
        "先結束的活動會留下較多時間安排後面的活動。",
        "第一行為活動數 N，接下來 N 行各為 <code>S E</code>。", "一行輸出最多能參加的活動場數。",
        ["1 ≤ N ≤ 2000", "0 ≤ S &lt; E ≤ 1000000", "不同活動的時間可以完全相同"],
        '''
        # 核心：依結束時間排序，每次選最早可完成的活動。時間 O(N log N)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        intervals = list(zip(data[1::2], data[2::2]))
        intervals.sort(key=lambda p: (p[1], p[0]))
        finish = -1
        count = 0
        for start, end in intervals:
            if start >= finish:
                finish = end
                count += 1
        print(count)
        ''', enc_intervals, activity_oracle,
        [[(0, 3), (1, 2), (2, 4), (4, 5)], [(0, 10), (2, 8), (3, 7)], [(1, 2), (2, 3), (3, 4)],
         [(0, 1)], [(0, 1000000)], [(i, i + 1) for i in range(2000)], [(0, 1)] * 2000,
         [(5, 7), (0, 4), (4, 7), (7, 9)], [(0, 2), (0, 1), (1, 2), (2, 3)]], rand_intervals)

    # 189: exhaustive bitmask pairing; large fixtures have uniform weights and known formula.
    def boats_oracle(d):
        weights, cap = d
        if len(set(weights)) == 1:
            return (len(weights) + 1) // 2 if 2 * weights[0] <= cap else len(weights)
        @functools.lru_cache(None)
        def visit(mask):
            if not mask:
                return 0
            i = (mask & -mask).bit_length() - 1
            rest = mask ^ (1 << i)
            result = 1 + visit(rest)
            for j in range(i + 1, len(weights)):
                if rest >> j & 1 and weights[i] + weights[j] <= cap:
                    result = min(result, 1 + visit(rest ^ (1 << j)))
            return result
        return visit((1 << len(weights)) - 1)
    def rand_boats():
        cap = RNG.randint(1, 20)
        return [RNG.randint(1, cap) for _ in range(RNG.randint(1, 10))], cap
    add(189, "雙人救生艇", ["貪心", "排序", "雙指標"], "分析最重者的搭配並以雙指標求最少船數", ["排序", "清單索引"],
        "安排所有人搭救生艇，求最少需要幾艘。",
        "每艘船最多載兩人，總重量不可超過 W。每人重量皆不超過 W，因此一定能安排上船。每人恰好搭一艘船，請計算最少船數。",
        "先替目前最重的人安排船，再判斷最輕的人能否一起搭乘。",
        "第一行為 <code>N W</code>，第二行為 N 個人的重量。", "一行輸出最少船數。",
        ["1 ≤ N ≤ 2000", "1 ≤ W ≤ 1000", "1 ≤ 每人重量 ≤ W"],
        '''
        # 核心：最重者一定需要一艘船，若可行就配最輕者。時間 O(N log N)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n, capacity = data[:2]
        weights = sorted(data[2:])
        left, right = 0, n - 1
        boats = 0
        while left <= right:
            if left < right and weights[left] + weights[right] <= capacity:
                left += 1
            right -= 1
            boats += 1
        print(boats)
        ''', lambda d: f"{len(d[0])} {d[1]}\n{line(d[0])}", boats_oracle,
        [([3, 2, 2, 1], 3), ([1, 1, 1], 2), ([5, 5], 5), ([1], 1), ([1000], 1000),
         ([1] * 2000, 2), ([1000] * 2000, 1000), ([4, 1, 3, 2], 5), ([2, 2, 2, 3, 3], 5)], rand_boats)

    # 190: partition at every endpoint; sum each elementary segment if covered.
    def coverage_oracle(intervals):
        endpoints = sorted({x for pair in intervals for x in pair})
        return sum(b - a for a, b in zip(endpoints, endpoints[1:]) if any(l <= a and b <= r for l, r in intervals))
    add(190, "路段塗色總長", ["區間合併", "排序"], "排序並合併相交區間以避免重複計算長度", ["排序", "最值"],
        "計算直線道路被塗色的總長度。",
        "每次將位置 L 到 R 之間的路段塗色，其中 L 小於 R。一段的長度為 R−L，不是整數座標點的個數。重疊部分只計一次；端點相接的路段可以合併。",
        "依左端點排序後，持續延伸目前尚未結算的右端點。",
        "第一行為路段數 N，接下來 N 行各為 <code>L R</code>。", "一行輸出被塗色的總長度。",
        ["1 ≤ N ≤ 2000", "-1000000 ≤ L &lt; R ≤ 1000000"],
        '''
        # 核心：排序後合併重疊或相接路段。時間 O(N log N)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        intervals = sorted(zip(data[1::2], data[2::2]))
        left, right = intervals[0]
        total = 0
        for start, end in intervals[1:]:
            if start <= right:
                right = max(right, end)
            else:
                total += right - left
                left, right = start, end
        print(total + right - left)
        ''', enc_intervals, coverage_oracle,
        [[(1, 5), (3, 7), (10, 12)], [(0, 1), (1, 3)], [(-5, 5), (-2, 2)], [(-1000000, 1000000)],
         [(0, 1)], [(0, 1)] * 2000, [(i * 2, i * 2 + 1) for i in range(2000)],
         [(8, 10), (-5, -3), (0, 4), (3, 8)], [(-10, 0), (-3, 8), (8, 9)]],
        lambda: [(s := RNG.randint(-20, 20), s + RNG.randint(1, 15)) for _ in range(RNG.randint(1, 12))])

    # 191: independent enumeration of all starts with rolling end sums.
    def max_segment(a):
        best = -math.inf
        for i in range(len(a)):
            total = 0
            for j in range(i, len(a)):
                total += a[j]
                best = max(best, total)
        return best
    add(191, "最大連續區段和", ["動態規劃", "連續區段"], "決定每個位置要延續前段或重新開始並追蹤最大值", ["清單", "最大值"],
        "選取一段非空的連續整數，使總和最大。",
        "給定 N 個可正可負的整數，必須選擇至少一個元素，且選取位置必須連續。輸出所有合法片段之中最大的總和。即使全部為負數，也不能選擇空片段。",
        "思考以目前元素結尾的最佳片段，是否應捨棄前面的累積值。",
        "第一行為 N，第二行為 N 個整數。", "一行輸出最大總和。",
        ["1 ≤ N ≤ 2000", "-1000000 ≤ 每個整數 ≤ 1000000"],
        '''
        # 核心：維護以目前位置結尾的最佳和與全域最佳和。時間 O(N)，讀入空間 O(N)。
        import sys
        values = list(map(int, sys.stdin.read().split()))[1:]
        ending = best = values[0]
        for value in values[1:]:
            ending = max(value, ending + value)
            best = max(best, ending)
        print(best)
        ''', array, max_segment,
        [[-2, 1, -3, 4, -1, 2, 1, -5, 4], [-8, -2, -7], [0, 0, 0], [-1000000], [1000000],
         [1000000] * 2000, [-1000000] * 2000, [5, -10, 6], [-3, 8, -1, -1], [2, -2, 2]],
        lambda: [RNG.randint(-20, 20) for _ in range(RNG.randint(1, 25))])

    # 192: breadth-first state exploration by number of coins, not amount-order DP.
    def coins_oracle(d):
        coins, target = d
        frontier = {0}
        seen = {0}
        depth = 0
        while frontier:
            if target in frontier:
                return depth
            frontier = {amount + coin for amount in frontier for coin in coins if amount + coin <= target} - seen
            seen.update(frontier)
            depth += 1
        return -1
    def rand_coins():
        return RNG.sample(range(1, 16), RNG.randint(1, 7)), RNG.randint(0, 50)
    add(192, "最少硬幣數", ["動態規劃", "最小化"], "建立每個金額的最少硬幣狀態並辨識無法湊出的金額", ["清單", "巢狀迴圈"],
        "用給定面額恰好湊出目標金額，求最少硬幣枚數。",
        "每種面額有無限多枚硬幣。必須恰好湊出金額 S；若無法湊出，輸出 -1。S 為 0 時不需要任何硬幣，答案為 0。面額不保證適合由大到小貪心選取。",
        "湊出某個金額的最後一枚硬幣，會連到更小金額的最佳答案。",
        "第一行為 <code>K S</code>，第二行為 K 種互不相同的正整數面額。",
        "一行輸出最少枚數，無法恰好湊出時輸出 <code>-1</code>。",
        ["1 ≤ K ≤ 20", "0 ≤ S ≤ 10000", "1 ≤ 面額 ≤ 1000，面額互不相同"],
        '''
        # 核心：dp[x] 表示恰好湊出 x 的最少枚數。時間 O(KS)，空間 O(K + S)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        count, target = data[:2]
        coins = data[2:]
        unreachable = target + 1
        dp = [0] + [unreachable] * target
        for amount in range(1, target + 1):
            for coin in coins:
                if coin <= amount:
                    dp[amount] = min(dp[amount], dp[amount - coin] + 1)
        print(-1 if dp[target] == unreachable else dp[target])
        ''', lambda d: f"{len(d[0])} {d[1]}\n{line(d[0])}", coins_oracle,
        [([1, 3, 4], 6), ([4, 6], 7), ([5], 0), ([1], 10000), ([1000], 10000),
         (list(range(981, 1001)), 10000), ([1000], 1), ([2, 7, 9], 14), ([2], 3), ([6, 4], 8)], rand_coins)

    # 193: memoized top-down path counting; solution propagates forward.
    def stair_oracle(d):
        n, blocked = d
        closed = set(blocked)
        @functools.lru_cache(None)
        def ways(pos):
            if pos in closed or pos > n:
                return 0
            if pos == n:
                return 1
            return sum(ways(pos + step) for step in (1, 2, 3)) % 1000000007
        return ways(0)
    def enc_stair(d):
        n, closed = d
        return f"{n} {len(closed)}\n" + line(closed)
    def rand_stair():
        n = RNG.randint(1, 20)
        return n, sorted(RNG.sample(range(n + 1), RNG.randint(0, n + 1)))
    add(193, "避開封閉階梯", ["動態規劃", "路徑計數"], "處理不可到達狀態並累計多種步長的走法", ["清單", "餘數", "遞推"],
        "每次上 1、2 或 3 階，計算避開封閉階梯的走法。",
        "起點是第 0 階，終點是第 N 階。每次可向上 1、2 或 3 階，不能超過 N，且不能站在封閉的階梯上；可以直接跨過封閉階梯。若起點或終點封閉，答案為 0。步長序列不同就算不同走法，答案取除以 1000000007 的餘數。",
        "封閉位置的走法固定為 0，其他位置由可能的前一步累加。",
        "第一行為 <code>N M</code>，第二行為 M 個互不相同的封閉階梯編號；M 為 0 時第二行可為空行。",
        "一行輸出走法數除以 <code>1000000007</code> 的餘數。",
        ["1 ≤ N ≤ 300", "0 ≤ M ≤ N + 1", "0 ≤ 封閉階梯編號 ≤ N，編號互不相同"],
        '''
        # 核心：由起點向前推進，封閉階梯不接收走法。時間 O(N + M)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n, m = data[:2]
        closed = set(data[2:])
        mod = 1000000007
        ways = [0] * (n + 1)
        ways[0] = int(0 not in closed)
        for pos in range(1, n + 1):
            if pos not in closed:
                ways[pos] = sum(ways[max(0, pos - 3):pos]) % mod
        print(ways[n])
        ''', enc_stair, stair_oracle,
        [(4, [2]), (3, []), (5, [5]), (1, []), (1, [0]), (1, [0, 1]),
         (300, []), (300, list(range(301))), (8, [2, 3, 4]), (8, [1, 2, 4, 5, 7])], rand_stair)

    # 194: top-down search from destination with memoization; solution uses rolling rows.
    def toll_oracle(a):
        @functools.lru_cache(None)
        def best(r, c):
            if r == 0 and c == 0:
                return a[0][0]
            return a[r][c] + min(best(r - 1, c) if r else math.inf, best(r, c - 1) if c else math.inf)
        return best(len(a) - 1, len(a[0]) - 1)
    add(194, "最低通行費路徑", ["動態規劃", "二維陣列"], "根據向右或向下移動限制設計格點最佳成本狀態", ["二維清單", "最小值"],
        "從左上角走到右下角，求最少通行費。",
        "地圖有 R 列、C 欄，每格標示非負通行費。從第 1 列第 1 欄出發，每步只能向右或向下移動一格，到達第 R 列第 C 欄。經過的每格費用都需支付，包含起點與終點。",
        "到達一格的前一格只可能在上方或左方。",
        "第一行為 <code>R C</code>，接下來 R 行各有 C 個通行費。", "一行輸出最少通行費。",
        ["1 ≤ R, C ≤ 50", "0 ≤ 每格通行費 ≤ 1000"],
        '''
        # 核心：逐列更新從上方或左方抵達的最小費用。時間 O(RC)，讀入空間 O(RC)。
        import sys
        it = iter(map(int, sys.stdin.read().split()))
        rows, cols = next(it), next(it)
        dp = [float('inf')] * cols
        dp[0] = 0
        for r in range(rows):
            for c in range(cols):
                toll = next(it)
                dp[c] = toll + min(dp[c], dp[c - 1] if c else float('inf'))
        print(dp[-1])
        ''', matrix, toll_oracle,
        [[[1, 9, 1], [2, 1, 2]], [[7]], [[0, 0], [0, 0]], [[1000] * 50 for _ in range(50)],
         [[0]], [[1] * 50], [[1] for _ in range(50)], [[1, 2], [2, 1]], [[0, 9, 0], [0, 9, 0], [0, 0, 0]]],
        lambda: [[RNG.randint(0, 20) for _ in range(w)] for _ in range(RNG.randint(1, 7))] if (w := RNG.randint(1, 7)) else [], audience="M-8")

    # 195: small exhaustive subsequences; monotone large fixtures have known formulas.
    def lis_oracle(a):
        if a == sorted(a):
            return len(set(a))
        if a == sorted(a, reverse=True):
            return 1
        best = 0
        for mask in range(1 << len(a)):
            sub = [a[i] for i in range(len(a)) if mask >> i & 1]
            if all(x < y for x, y in zip(sub, sub[1:])):
                best = max(best, len(sub))
        return best
    add(195, "最長嚴格遞增子序列", ["動態規劃", "子序列"], "以結尾位置定義狀態並區分連續片段與子序列", ["清單", "巢狀迴圈", "最大值"],
        "求保留相對順序的最長嚴格遞增子序列長度。",
        "可以刪掉任意個元素，也可以一個都不刪，但剩餘元素的順序不能交換。相鄰保留值必須嚴格變大，相等不算遞增。子序列不必在原清單中連續。",
        "把狀態設為「必須以第 i 個元素結尾」的最佳長度。",
        "第一行為 N，第二行為 N 個整數。", "一行輸出最長嚴格遞增子序列的長度。",
        ["1 ≤ N ≤ 500", "-1000000 ≤ 每個整數 ≤ 1000000"],
        '''
        # 核心：dp[i] 從前方比自己小的元素延伸。時間 O(N²)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n = data[0]
        values = data[1:]
        dp = [1] * n
        for i in range(n):
            for j in range(i):
                if values[j] < values[i]:
                    dp[i] = max(dp[i], dp[j] + 1)
        print(max(dp))
        ''', array, lis_oracle,
        [[3, 1, 2, 2, 5, 4], [7, 7, 7], [5, 4, 3, 2], [-1000000], [1000000],
         list(range(500)), list(range(500, 0, -1)), [0] * 500, [-1000000, 0, 1000000], [1, 9, 2, 8, 3, 7]],
        lambda: [RNG.randint(-8, 8) for _ in range(RNG.randint(1, 11))])

    # 196: enumerate subsequences of the shorter string; large fixtures have known identities.
    def lcs_oracle(d):
        a, b = sorted(d, key=len)
        if a == b:
            return len(a)
        if not a or not (set(a) & set(b)):
            return 0
        if len(set(a)) == 1:
            return min(len(a), b.count(a[0]))
        assert len(a) <= 12
        result = 0
        for mask in range(1 << len(a)):
            sub = "".join(a[i] for i in range(len(a)) if mask >> i & 1)
            pos = 0
            for ch in b:
                if pos < len(sub) and ch == sub[pos]:
                    pos += 1
            if pos == len(sub):
                result = max(result, len(sub))
        return result
    add(196, "最長共同子序列", ["動態規劃", "字串", "子序列"], "設計兩字串前綴的最佳狀態並處理跳過字元的選擇", ["二維狀態", "字串索引"],
        "找出兩個字串都能保留的最長子序列長度。",
        "子序列可以刪去任意字元，但不能交換保留字元的先後順序。例如 <code>ace</code> 是 <code>abcde</code> 的子序列。求 A 與 B 的最長共同子序列長度，字元不必連續；空字串的答案為 0。",
        "比較兩個前綴的最後字元，思考可以配對或必須跳過的情況。",
        "第一行是字串 A，第二行是字串 B；字串為空時仍保留該行。", "一行輸出最長共同子序列長度。",
        ["0 ≤ A、B 的長度 ≤ 200", "字串只含英文小寫字母 a 到 z"],
        '''
        # 核心：dp[j] 記錄目前 A 前綴與 B 前 j 字元的 LCS 長度。時間 O(|A||B|)，空間 O(|A| + |B|)。
        import sys
        a = sys.stdin.readline().rstrip('\\r\\n')
        b = sys.stdin.readline().rstrip('\\r\\n')
        previous = [0] * (len(b) + 1)
        for ca in a:
            current = [0]
            for j, cb in enumerate(b, 1):
                if ca == cb:
                    current.append(previous[j - 1] + 1)
                else:
                    current.append(max(previous[j], current[-1]))
            previous = current
        print(previous[-1])
        ''', lambda d: d[0] + "\n" + d[1] + "\n", lcs_oracle,
        [("abcde", "ace"), ("abc", "def"), ("", "abc"), ("", ""), ("abc", ""),
         ("a" * 200, "a" * 200), ("a" * 200, "z" * 200), ("z" * 200, "z" * 199 + "a"),
         ("abac", "baca"), ("aaaa", "aa"), ("xyz", "zyx")],
        lambda: ("".join(RNG.choices("abcd", k=RNG.randint(0, 8))), "".join(RNG.choices("abcd", k=RNG.randint(0, 8)))), difficulty="Hard")

    # 197: independent union-of-components oracle, rather than flood fill.
    def island_oracle(a):
        h, w = len(a), len(a[0])
        groups = [{(r, c)} for r in range(h) for c in range(w) if a[r][c] == '1']
        for r in range(h):
            for c in range(w):
                if a[r][c] != '1':
                    continue
                for rr, cc in [(r - 1, c), (r, c - 1)]:
                    if rr < 0 or cc < 0 or a[rr][cc] != '1':
                        continue
                    first = next(group for group in groups if (r, c) in group)
                    second = next(group for group in groups if (rr, cc) in group)
                    if first is not second:
                        first.update(second)
                        groups.remove(second)
        return f"{len(groups)} {max(map(len, groups), default=0)}"
    def enc_grid(a):
        return f"{len(a)} {len(a[0])}\n" + "\n".join(a)
    def rand_grid():
        h, w = RNG.randint(1, 7), RNG.randint(1, 7)
        return ["".join(RNG.choices("01", k=w)) for _ in range(h)]
    add(197, "地圖連通區", ["深度優先搜尋", "網格", "連通性"], "以走訪標記辨識四方向連通區並統計大小", ["二維清單", "堆疊", "邊界判斷"],
        "計算陸地連通區的數量，以及最大連通區的格數。",
        "地圖的 <code>1</code> 是陸地，<code>0</code> 是水域。只有上、下、左、右相鄰的陸地相連，對角線接觸不算。能沿陸地互相到達的格子屬於同一區。若沒有陸地，兩個答案皆為 0。",
        "每找到尚未走訪的陸地，就完整探索一次它所屬的連通區。",
        "第一行為 <code>R C</code>。接下來 R 行各有一個長度為 C、只含 0 與 1 的字串，字元間沒有空格。",
        "一行輸出 <code>連通區數 最大連通區格數</code>，以一個空格分隔。",
        ["1 ≤ R, C ≤ 50", "每格只可能為 0 或 1"],
        '''
        # 核心：從未走訪陸地啟動迭代 DFS，走訪時立即標記。時間 O(RC)，空間 O(RC)。
        import sys
        lines = sys.stdin.read().split()
        rows, cols = map(int, lines[:2])
        grid = [list(row) for row in lines[2:]]
        regions = largest = 0
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] != '1':
                    continue
                regions += 1
                stack = [(r, c)]
                grid[r][c] = '0'
                size = 0
                while stack:
                    x, y = stack.pop()
                    size += 1
                    for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == '1':
                            grid[nx][ny] = '0'
                            stack.append((nx, ny))
                largest = max(largest, size)
        print(regions, largest)
        ''', enc_grid, island_oracle,
        [["1100", "0101", "0001"], ["10", "01"], ["000", "000"], ["0"], ["1"],
         ["1" * 50] * 50, ["0" * 50] * 50, ["".join(str((r + c) % 2) for c in range(50)) for r in range(50)],
         ["10101"], ["1", "0", "1"], ["111", "101", "111"]], rand_grid)

    # 198: repeated relaxation (Bellman-style) oracle, independent of BFS.
    def distance_oracle(d):
        n, edges, source, target = d
        dist = [math.inf] * (n + 1)
        dist[source] = 0
        for _ in range(n - 1):
            changed = False
            for u, v in edges:
                if dist[v] > dist[u] + 1:
                    dist[v] = dist[u] + 1
                    changed = True
                if dist[u] > dist[v] + 1:
                    dist[u] = dist[v] + 1
                    changed = True
            if not changed:
                break
        return -1 if math.isinf(dist[target]) else dist[target]
    def enc_graph_path(d):
        n, edges, s, t = d
        return f"{n} {len(edges)} {s} {t}\n" + "\n".join(line(e) for e in edges)
    def rand_graph_path():
        n = RNG.randint(1, 10)
        all_edges = list(itertools.combinations(range(1, n + 1), 2))
        edges = RNG.sample(all_edges, RNG.randint(0, len(all_edges)))
        return n, edges, RNG.randint(1, n), RNG.randint(1, n)
    add(198, "最少經過幾條路", ["廣度優先搜尋", "圖論", "最短路徑"], "以 BFS 求無權無向圖的最少邊數並處理不可達情況", ["佇列", "相鄰串列"],
        "求兩個地點之間最少需要經過的道路數。",
        "共有 N 個地點，編號 1 到 N。每條道路連接兩個不同地點，可以雙向通行，每條道路都算一步。求從 S 到 T 最少要走幾步；若無法抵達輸出 -1。若 S 等於 T，答案為 0。",
        "使用佇列依照距離由近到遠探索地點。",
        "第一行為 <code>N M S T</code>。接下來 M 行各為一條道路的兩端 <code>u v</code>。",
        "一行輸出最少步數，不可達時輸出 <code>-1</code>。",
        ["1 ≤ N ≤ 200", "0 ≤ M ≤ min(2000, N(N−1)/2)", "1 ≤ S, T, u, v ≤ N；u ≠ v", "同一對地點不會有重複道路"],
        '''
        # 核心：BFS 第一次到達節點時即可確定最少邊數。時間 O(N + M)，空間 O(N + M)。
        import sys
        from collections import deque
        data = list(map(int, sys.stdin.read().split()))
        n, m, source, target = data[:4]
        graph = [[] for _ in range(n + 1)]
        for i in range(4, len(data), 2):
            u, v = data[i:i + 2]
            graph[u].append(v)
            graph[v].append(u)
        distance = [-1] * (n + 1)
        distance[source] = 0
        queue = deque([source])
        while queue:
            u = queue.popleft()
            for v in graph[u]:
                if distance[v] == -1:
                    distance[v] = distance[u] + 1
                    queue.append(v)
        print(distance[target])
        ''', enc_graph_path, distance_oracle,
        [(5, [(1, 2), (2, 3), (1, 4), (4, 5), (5, 3)], 1, 3), (3, [(1, 2)], 1, 3), (2, [(1, 2)], 2, 2),
         (1, [], 1, 1), (200, [], 1, 200), (200, [(i, i + 1) for i in range(1, 200)], 200, 1),
         (200, list(itertools.combinations(range(1, 201), 2))[:2000], 199, 200),
         (4, [(1, 2), (2, 3), (3, 4), (1, 4)], 2, 4), (4, [(2, 3), (3, 4)], 4, 2)], rand_graph_path)

    # 199: doubled-node union constraints oracle; solution uses graph coloring.
    def bipartite_oracle(d):
        n, edges = d
        parent = list(range(2 * n))
        def find(x):
            while parent[x] != x:
                x = parent[x]
            return x
        def join(x, y):
            parent[find(x)] = find(y)
        for u, v in edges:
            u -= 1
            v -= 1
            join(u, v + n)
            join(v, u + n)
        return "YES" if all(find(i) != find(i + n) for i in range(n)) else "NO"
    def enc_graph(d):
        return f"{d[0]} {len(d[1])}\n" + "\n".join(line(e) for e in d[1])
    def rand_coloring():
        n = RNG.randint(1, 10)
        return n, [(RNG.randint(1, n), RNG.randint(1, n)) for _ in range(RNG.randint(0, 20))]
    add(199, "能否分成兩組", ["圖論", "二分圖", "廣度優先搜尋"], "將不同組限制視為兩色圖並檢查所有連通分量", ["相鄰串列", "佇列", "條件判斷"],
        "判斷是否能把所有人分成兩組，滿足每一條不同組限制。",
        "N 個人編號 1 到 N，每人必須被安排到 A 組或 B 組其中之一，允許其中一組為空。每條限制 <code>u v</code> 要求兩人分在不同組。限制可以重複，也可能出現 u 等於 v；自己必須與自己不同組是無法滿足的限制。只要有任一限制無法滿足，就輸出 NO。",
        "每個互不連通的部分都要重新選一個起點，沿限制交替安排兩組。",
        "第一行為 <code>N M</code>，接下來 M 行各為 <code>u v</code>。", "存在合法分組時輸出 <code>YES</code>，否則輸出 <code>NO</code>。",
        ["1 ≤ N ≤ 200", "0 ≤ M ≤ 2000", "1 ≤ u, v ≤ N，允許重複限制與 u = v"],
        '''
        # 核心：逐一對每個連通分量 BFS 染兩色，相鄰同色即矛盾。時間 O(N + M)，空間 O(N + M)。
        import sys
        from collections import deque
        data = list(map(int, sys.stdin.read().split()))
        n, m = data[:2]
        graph = [[] for _ in range(n)]
        for i in range(2, len(data), 2):
            u, v = data[i] - 1, data[i + 1] - 1
            graph[u].append(v)
            graph[v].append(u)
        color = [-1] * n
        valid = True
        for start in range(n):
            if color[start] != -1:
                continue
            color[start] = 0
            queue = deque([start])
            while queue:
                u = queue.popleft()
                for v in graph[u]:
                    if color[v] == -1:
                        color[v] = 1 - color[u]
                        queue.append(v)
                    elif color[v] == color[u]:
                        valid = False
        print('YES' if valid else 'NO')
        ''', enc_graph, bipartite_oracle,
        [(4, [(1, 2), (2, 3), (3, 4), (4, 1)]), (3, [(1, 2), (2, 3), (3, 1)]), (4, [(1, 2)]),
         (1, []), (1, [(1, 1)]), (200, [(i, j) for i in range(1, 101) for j in range(101, 201)][:2000]),
         (200, [(1, 2)] * 1999 + [(200, 200)]), (6, [(1, 2), (4, 5), (5, 6), (6, 4)]),
         (2, [(1, 2), (2, 1), (1, 2)]), (200, [])], rand_coloring)

    # 200: remove each candidate vertex; nodes disconnected from root form its subtree.
    def subtree_oracle(d):
        n, edges = d
        graph = [[] for _ in range(n + 1)]
        for u, v in edges:
            graph[u].append(v)
            graph[v].append(u)
        sizes = [n]
        for removed in range(2, n + 1):
            reached = {1}
            todo = [1]
            while todo:
                u = todo.pop()
                for v in graph[u]:
                    if v != removed and v not in reached:
                        reached.add(v)
                        todo.append(v)
            sizes.append(n - len(reached))
        return line(sizes)
    def rand_tree():
        n = RNG.randint(1, 20)
        edges = [(i, RNG.randrange(1, i)) for i in range(2, n + 1)]
        RNG.shuffle(edges)
        return n, edges
    add(200, "樹的子樹大小", ["樹", "遍歷", "狀態累加"], "先確立父子關係再由葉節點向根累加子樹大小", ["相鄰串列", "清單", "圖的走訪"],
        "以 1 號節點為根，計算每個節點的子樹大小。",
        "輸入是一棵樹：所有 N 個節點互相連通，且沒有環。指定 1 號為根後，每個非根節點朝根方向的相鄰節點就是父節點。節點的子樹包含它自己，以及所有以它為祖先的後代。輸出各節點子樹的節點數。",
        "先記錄由根走訪的順序，反過來處理時孩子的結果已經完成。",
        "第一行為 N，接下來 N−1 行各為一條邊的兩端 <code>u v</code>，邊可雙向通行。", "一行依節點 1 到 N 的順序輸出子樹大小，以空格分隔。",
        ["1 ≤ N ≤ 500", "1 ≤ u, v ≤ N；u ≠ v", "保證輸入為連通、無環且無重複邊的樹"],
        '''
        # 核心：建立父節點與走訪序，逆序將子樹大小加給父節點。時間 O(N)，空間 O(N)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n = data[0]
        graph = [[] for _ in range(n + 1)]
        for i in range(1, len(data), 2):
            u, v = data[i:i + 2]
            graph[u].append(v)
            graph[v].append(u)
        parent = [0] * (n + 1)
        order = [1]
        for u in order:
            for v in graph[u]:
                if v != parent[u]:
                    parent[v] = u
                    order.append(v)
        size = [1] * (n + 1)
        for u in reversed(order[1:]):
            size[parent[u]] += size[u]
        print(*size[1:])
        ''', lambda d: str(d[0]) + "\n" + "\n".join(line(e) for e in d[1]), subtree_oracle,
        [(5, [(1, 2), (1, 3), (3, 4), (3, 5)]), (1, []), (4, [(4, 3), (2, 1), (3, 2)]),
         (500, [(i, i + 1) for i in range(1, 500)]), (500, [(1, i) for i in range(2, 501)]),
         (2, [(2, 1)]), (7, [(i // 2, i) for i in range(2, 8)]), (5, [(5, 1), (5, 2), (5, 3), (5, 4)])], rand_tree)

    # 201: direct quadratic enumeration avoids prefix-remainder counting.
    def divisible_oracle(d):
        a, k = d
        count = 0
        for i in range(len(a)):
            total = 0
            for j in range(i, len(a)):
                total += a[j]
                count += total % k == 0
        return count
    add(201, "可整除的連續區段", ["前綴和", "餘數", "計數"], "利用兩個前綴餘數相同的條件計算區間數量", ["餘數", "前綴和", "計數清單"],
        "計算總和能被 K 整除的非空連續區段數。",
        "給定 N 個可正可負的整數。每一組位置 L、R（1 ≤ L ≤ R ≤ N）代表一個區段；即使元素內容相同，只要位置不同就分開計算。請計算其中總和除以正整數 K 餘數為 0 的區段有多少個。",
        "兩個前綴和除以 K 的餘數相同時，它們之間的差可被 K 整除。",
        "第一行為 <code>N K</code>，第二行為 N 個整數。", "一行輸出符合條件的區段數。",
        ["1 ≤ N ≤ 2000", "1 ≤ K ≤ 2000", "-1000000 ≤ 每個整數 ≤ 1000000"],
        '''
        # 核心：累計相同前綴餘數先前出現的次數，包含空前綴。時間 O(N + K)，空間 O(N + K)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n, k = data[:2]
        counts = [0] * k
        counts[0] = 1
        remainder = answer = 0
        for value in data[2:]:
            remainder = (remainder + value) % k
            answer += counts[remainder]
            counts[remainder] += 1
        print(answer)
        ''', lambda d: f"{len(d[0])} {d[1]}\n{line(d[0])}", divisible_oracle,
        [([1, 2, 3, 4], 3), ([-1, 1, -1], 2), ([5], 2), ([0], 1), ([-1000000], 2000),
         ([1000000], 2000), ([0] * 2000, 2000), ([1] * 2000, 1), ([1, 2, 4, 8], 2000), ([3, -3, 0, 6], 3)],
        lambda: ([RNG.randint(-15, 15) for _ in range(RNG.randint(1, 25))], RNG.randint(1, 12)), difficulty="Hard")

    # 202: direct range modification oracle, independent of differences.
    def add_ranges_oracle(d):
        n, operations = d
        values = [0] * n
        for left, right, delta in operations:
            for i in range(left - 1, right):
                values[i] += delta
        return line(values)
    def rand_add_ranges():
        n = RNG.randint(1, 20)
        operations = []
        for _ in range(RNG.randint(0, 15)):
            l, r = sorted(RNG.choices(range(1, n + 1), k=2))
            operations.append((l, r, RNG.randint(-20, 20)))
        return n, operations
    add(202, "批次區間加值", ["差分陣列", "前綴和"], "將區間加值拆成邊界變化並在所有操作後還原結果", ["清單", "前綴和"],
        "完成所有連續區間加值後，輸出每個位置的最終數值。",
        "有 N 個位置，編號 1 到 N，起始值都是 0。每筆操作給定 L、R、D，將第 L 到第 R 個位置的數值都加上 D，包含兩端。D 可以為負數或 0。只需要在全部操作完成後輸出一次結果。",
        "一段區間的變化只會在開始位置與結束位置之後切換。",
        "第一行為 <code>N Q</code>，接下來 Q 行各為 <code>L R D</code>。",
        "一行依序輸出 N 個位置的最終值，以空格分隔。",
        ["1 ≤ N ≤ 2000", "0 ≤ Q ≤ 2000", "1 ≤ L ≤ R ≤ N", "-1000000 ≤ D ≤ 1000000"],
        '''
        # 核心：在 L 加 D、R+1 減 D，最後前綴累加還原。時間 O(N + Q)，空間 O(N + Q)。
        import sys
        data = list(map(int, sys.stdin.read().split()))
        n, q = data[:2]
        diff = [0] * (n + 2)
        for i in range(2, len(data), 3):
            left, right, delta = data[i:i + 3]
            diff[left] += delta
            diff[right + 1] -= delta
        current = 0
        answer = []
        for pos in range(1, n + 1):
            current += diff[pos]
            answer.append(current)
        print(*answer)
        ''', lambda d: f"{d[0]} {len(d[1])}\n" + "\n".join(line(op) for op in d[1]), add_ranges_oracle,
        [(5, [(1, 3, 2), (2, 5, -1)]), (3, []), (1, [(1, 1, 5), (1, 1, -5)]), (1, []),
         (2000, [(1, 2000, 1000000)] * 2000), (2000, [(1, 2000, -1000000)]),
         (5, [(2, 4, 0)]), (4, [(1, 1, 3), (4, 4, 7)]), (5, [(2, 4, -8), (3, 3, 9)])], rand_add_ranges)

    # 203: independent bottom-up block merging; solution recursively splits top-down.
    def quadtree_oracle(a):
        blocks = [[(int(ch), int(ch == '0'), int(ch == '1')) for ch in row] for row in a]
        while len(blocks) > 1:
            new = []
            for r in range(0, len(blocks), 2):
                row = []
                for c in range(0, len(blocks), 2):
                    children = [blocks[r + dr][c + dc] for dr in (0, 1) for dc in (0, 1)]
                    if children[0][0] in (0, 1) and all(x[0] == children[0][0] for x in children):
                        color = children[0][0]
                        row.append((color, int(color == 0), int(color == 1)))
                    else:
                        row.append((-1, sum(x[1] for x in children), sum(x[2] for x in children)))
                new.append(row)
            blocks = new
        _, white, black = blocks[0][0]
        return f"{white} {black}"
    def rand_quadtree():
        n = RNG.choice([1, 2, 4, 8])
        return ["".join(RNG.choices("01", k=n)) for _ in range(n)]
    add(203, "方格遞迴切分", ["遞迴", "分治", "二維陣列"], "設計同色終止條件並合併四個子區域的結果", ["函式", "二維清單", "遞迴"],
        "依規則切分黑白方格，計算最後的白色與黑色區塊數。",
        "輸入 N×N 方格，N 是 2 的整數次方，0 表示白色、1 表示黑色。若目前正方形內全部同色，就保留為一塊；否則沿中線切成左上、右上、左下、右下四個等大的正方形，再對各塊套用相同規則。1×1 格必定同色。只計算最後保留下來的區塊，不計算已被切開的父區域。",
        "遞迴函式可以回傳目前區域最後產生的兩種顏色區塊數。",
        "第一行為 N，接下來 N 行各有長度 N 的 01 字串，字元間沒有空格。",
        "一行輸出 <code>白色區塊數 黑色區塊數</code>，以一個空格分隔。",
        ["N ∈ {1, 2, 4, 8, 16, 32}", "每格只可能為 0 或 1"],
        '''
        # 核心：同色正方形直接計數，否則切為四個子區域遞迴。時間 O(N² log N)，空間 O(N²)。
        import sys
        lines = sys.stdin.read().split()
        n = int(lines[0])
        grid = lines[1:]
        counts = [0, 0]
        def split(row, col, size):
            color = grid[row][col]
            same = all(grid[r][c] == color for r in range(row, row + size) for c in range(col, col + size))
            if same:
                counts[int(color)] += 1
                return
            half = size // 2
            for dr in (0, half):
                for dc in (0, half):
                    split(row + dr, col + dc, half)
        split(0, 0, n)
        print(*counts)
        ''', lambda a: str(len(a)) + "\n" + "\n".join(a), quadtree_oracle,
        [["0011", "0011", "1100", "1100"], ["11", "11"], ["01", "10"], ["0"], ["1"],
         ["0" * 32] * 32, ["1" * 32] * 32, ["".join(str((r + c) % 2) for c in range(32)) for r in range(32)],
         ["0000", "0000", "0000", "0001"], ["0000", "0000", "1111", "1111"]], rand_quadtree,
        difficulty="Hard")


def run_source(source, inp):
    old_stdin = sys.stdin
    capture = io.StringIO()
    try:
        sys.stdin = io.StringIO(inp)
        with contextlib.redirect_stdout(capture):
            exec(compile(source, '<reference>', 'exec'), {"__name__": "__main__"})
    finally:
        sys.stdin = old_stdin
    return capture.getvalue().rstrip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Explicitly rebuild owned JSON and solution files.')
    args = parser.parse_args()
    build()
    total_static = total_random = 0
    for generated, generated_source, differential in SPECS:
        pid = generated['id']
        problem_path = ROOT / 'problems' / f'{pid:03d}.json'
        solution_path = ROOT / 'solutions' / f'{pid:03d}.py'
        if args.write:
            problem_path.write_text(json.dumps(generated, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            solution_path.write_text(generated_source, encoding='utf-8')
        problem = json.loads(problem_path.read_text(encoding='utf-8'))
        source = solution_path.read_text(encoding='utf-8')
        assert problem['id'] == pid and problem['stage'] == 'Advanced'
        assert problem['audienceLevel'] in {'M-8', 'M-HS'} and problem['apcsLevel'] is None
        assert problem['platformMode'] == 'Python'
        assert len(problem['samples']) == 3
        assert len({x['input'] for x in problem['samples']}) == 3
        assert all(x in problem['testCases'] for x in problem['samples'])
        assert len(problem['testCases']) - len(problem['samples']) >= 8
        assert problem['sampleInput'] == problem['samples'][0]['input']
        assert problem['sampleOutput'] == problem['samples'][0]['output']
        # Recompute every original fixture independently, even in read-only mode.
        oracle_outputs = {x['input']: x['output'] for x in generated['testCases']}
        for case in problem['testCases']:
            assert case['input'] in oracle_outputs, (pid, 'new fixture needs an independent oracle')
            assert case['output'] == oracle_outputs[case['input']], (pid, 'oracle mismatch')
        for label, cases in [('static', problem['testCases']), ('random', differential)]:
            for i, case in enumerate(cases, 1):
                result = run_source(source, case['input'])
                assert result == case['output'].rstrip(), (pid, label, i, case, result)
        total_static += len(problem['testCases'])
        total_random += len(differential)
        print(f'{pid}: PASS {len(problem["testCases"])} fixtures + {len(differential)} random oracle comparisons')
    print(f'LV3 PASS: {len(SPECS)} problems, {total_static} fixtures, {total_random} random comparisons')


if __name__ == '__main__':
    main()
