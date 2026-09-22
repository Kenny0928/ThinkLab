#!/usr/bin/env python3
"""重建／驗證原創 LV2 154–178：expected 來自獨立 oracle，非參考解答。

python3 scripts/problem_expansion_154_213/lv2.py --write
python3 scripts/problem_expansion_154_213/lv2.py
固定種子隨機對拍以記憶體 stdin/stdout 執行正式解答，另驗證已落地 JSON。
"""
import argparse
from collections import Counter
import contextlib
import datetime
from html.parser import HTMLParser
import io
import itertools
import json
import math
from pathlib import Path
import random
import re
import sys
import textwrap

ROOT = Path(__file__).resolve().parents[2]
RNG = random.Random(154213)
RECORDS = []


def lines(*rows):
    return "\n".join(" ".join(map(str, row)) if isinstance(row, (list, tuple)) else str(row) for row in rows)


def seq(values):
    return lines(len(values), values)


def records(header, rows):
    return lines(header, *rows)


def add(pid, title, difficulty, audience, tags, objective, prereq, description,
        input_format, output_format, constraints, hint, solution, oracle, cases, fuzz):
    solution = textwrap.dedent(solution).strip() + "\n"
    cases = list(dict.fromkeys(cases))
    assert len(cases) >= 12, (pid, len(cases))
    tests = [{"input": data, "output": str(oracle(data)).rstrip()} for data in cases]
    problem = dict(id=pid, title=title, stage="Intermediate", difficulty=difficulty,
                   tags=tags, audienceLevel=audience, apcsLevel=None, platformMode="Python",
                   learningObjectives=objective, prerequisites=prereq,
                   description="<p class='problem-lead'>" + description[0] + "</p><p>" + description[1] + "</p>",
                   hint="<p>" + hint + "</p>", inputFormat="<p>" + input_format + "</p>",
                   outputFormat="<p>" + output_format + "</p>",
                   constraints="<ul>" + "".join("<li>" + x + "</li>" for x in constraints) + "</ul>",
                   timeLimit=1, memoryLimit=256, sampleInput=tests[0]["input"],
                   sampleOutput=tests[0]["output"], samples=tests[:3], testCases=tests)
    RECORDS.append((problem, solution, oracle, fuzz))


# 154：oracle 使用 datetime 的時間差；正式解答使用分鐘與分支。
def oracle154(s):
    a, b = [datetime.datetime.strptime(v, "%H:%M") for v in s.split()]
    return int((b - a).total_seconds() // 60) % 1440


def clock_min(m):
    return f"{m // 60:02}:{m % 60:02}"


add(154, "跨午夜的經過分鐘", "Easy", "M-7", ["字串解析", "時間", "條件判斷"],
    ["將時分字串轉為分鐘", "用條件分支處理跨午夜的時間差"], ["字串分割", "整數運算", "條件判斷"],
    ("計算從開始時刻走到結束時刻經過幾分鐘。", "時刻皆採 24 小時制。若結束時刻早於開始時刻，表示結束於隔天；兩個時刻相同則經過 0 分鐘，並非一天。"),
    "一行包含開始及結束時刻，格式皆為 <code>HH:MM</code>，中間以一個空白分隔。",
    "輸出經過的整數分鐘數。", ["00 ≤ HH ≤ 23", "00 ≤ MM ≤ 59", "兩段數字皆固定兩位"],
    "先把每個時刻換成從當天午夜起算的分鐘。",
    '''
    # 思路：解析時分後相減，負數表示跨午夜；時間 O(1)，額外空間 O(1)。
    start, end = input().split()
    sh, sm = map(int, start.split(':'))
    eh, em = map(int, end.split(':'))
    elapsed = eh * 60 + em - sh * 60 - sm
    if elapsed < 0:
        elapsed += 1440
    print(elapsed)
    ''', oracle154,
    ["09:15 10:05", "23:50 00:10", "12:30 12:30", "00:00 23:59", "23:59 00:00", "00:00 00:00", "23:59 23:59", "01:00 00:59", "00:59 01:00", "13:59 14:00", "06:30 06:29", "18:00 05:00", "00:00 00:01", "23:58 23:59"],
    [f"{clock_min(RNG.randrange(1440))} {clock_min(RNG.randrange(1440))}" for _ in range(80)])


def playlist(start, durations):
    return records([start, len(durations)], [f"{x // 60}:{x % 60:02}" for x in durations])


def oracle155(s):
    tokens = s.split()
    start = datetime.datetime.strptime(tokens[0], "%H:%M:%S")
    total = sum(int(x.split(':')[0]) * 60 + int(x.split(':')[1]) for x in tokens[2:])
    end = start + datetime.timedelta(seconds=total)
    return f"{(end.date() - start.date()).days} {end:%H:%M:%S}"


add(155, "播放清單結束時間", "Medium", "M-7", ["時間", "累加", "字串解析"],
    ["累加多筆分秒長度", "拆分跨日的秒數並補零輸出"], ["迴圈", "整除與餘數", "字串分割"],
    ("求播放清單連續播放完畢後的日期偏移與時刻。", "清單從指定時刻開始，歌曲之間沒有間隔。起始日編為第 0 天；每跨過午夜，天數增加 1。每首歌曲長度以分與秒表示，允許 0 秒歌曲。"),
    "第一行為起始時刻 <code>HH:MM:SS</code> 與歌曲數 <code>N</code>。接著 N 行各有一個 <code>M:SS</code> 長度，M 不補零，SS 固定兩位。",
    "輸出 <code>D HH:MM:SS</code>；D 為非負整數天數，時、分、秒皆固定兩位，D 與時刻間以一個空白分隔。",
    ["1 ≤ N ≤ 100", "起始時刻介於 00:00:00 與 23:59:59", "0 ≤ M ≤ 59，00 ≤ SS ≤ 59"],
    "累加為總秒數後，再依一天、時、分的秒數依序拆分。",
    '''
    # 思路：把所有時間轉成秒後累加，再用整除與餘數拆回；時間 O(N)，額外空間 O(1)。
    start, count = input().split()
    h, m, s = map(int, start.split(':'))
    total = h * 3600 + m * 60 + s
    for _ in range(int(count)):
        minutes, seconds = map(int, input().split(':'))
        total += minutes * 60 + seconds
    days, remain = divmod(total, 86400)
    hours, remain = divmod(remain, 3600)
    minutes, seconds = divmod(remain, 60)
    print(f'{days} {hours:02}:{minutes:02}:{seconds:02}')
    ''', oracle155,
    [playlist("09:00:00", [90, 120]), playlist("23:59:30", [30]), playlist("00:00:00", [0]), playlist("23:59:59", [3599] * 100), playlist("00:00:00", [0] * 100), playlist("00:00:00", [3599]), playlist("23:59:59", [1]), playlist("12:34:56", [4]), playlist("00:00:59", [1]), playlist("22:00:00", [1800] * 4), playlist("01:02:03", [1, 59, 60, 61]), playlist("23:00:00", [3599, 1]), playlist("05:00:00", [3599] * 25)],
    [playlist(f"{RNG.randrange(24):02}:{RNG.randrange(60):02}:{RNG.randrange(60):02}", [RNG.randrange(3600) for _ in range(RNG.randint(1, 15))]) for _ in range(60)])


def walk(x, y, commands):
    return records([x, y, len(commands)], commands)


def oracle156(s):
    rows = s.splitlines()
    x, y, _ = map(int, rows[0].split())
    deltas = {'N': 1j, 'S': -1j, 'E': 1, 'W': -1}
    positions = [complex(x, y)]
    for row in rows[1:]:
        d, a = row.split()
        positions.append(positions[-1] + deltas[d] * int(a))
    z = positions[-1]
    return f"{int(z.real)} {int(z.imag)} {int(max(abs(p.real) + abs(p.imag) for p in positions))}"


add(156, "座標步行與最遠距離", "Medium", "M-7", ["座標", "簡單模擬", "最值"],
    ["依方向更新座標", "追蹤起點與指令完成時的最大曼哈頓距離"], ["條件分支", "絕對值", "迴圈"],
    ("依指令移動，回報終點與距離原點最遠的紀錄。", "北 N 讓 y 增加，南 S 讓 y 減少，東 E 讓 x 增加，西 W 讓 x 減少。距離定義為 <code>|x| + |y|</code>。只比較起點與每道指令完成後的位置。"),
    "第一行是起點 <code>x y</code> 與指令數 N。接著 N 行各為方向字母與移動長度。",
    "依序輸出終點 x、終點 y、最大距離，整數間以一個空白分隔。",
    ["1 ≤ N ≤ 100", "-1000 ≤ 起點 x、y ≤ 1000", "0 ≤ 每次移動長度 ≤ 1000", "方向為 N、S、E、W 其中之一"],
    "最大距離要從起點初始化，因為後續移動可能一直靠近原點。",
    '''
    # 思路：按方向更新兩座標，每次移動後更新最遠距離；時間 O(N)，額外空間 O(1)。
    x, y, n = map(int, input().split())
    farthest = abs(x) + abs(y)
    for _ in range(n):
        direction, amount = input().split()
        amount = int(amount)
        if direction == 'N':
            y += amount
        elif direction == 'S':
            y -= amount
        elif direction == 'E':
            x += amount
        else:
            x -= amount
        farthest = max(farthest, abs(x) + abs(y))
    print(x, y, farthest)
    ''', oracle156,
    [walk(0, 0, [('N', 3), ('E', 4), ('S', 3)]), walk(5, -2, [('W', 5), ('N', 2)]), walk(0, 0, [('E', 0)]), walk(-1000, -1000, [('S', 1000)] * 100), walk(1000, 1000, [('N', 1000)] * 100), walk(0, 0, [('W', 1000)]), walk(0, 0, [('E', 1000)]), walk(0, 0, [('N', 1), ('S', 2)]), walk(-1, 1, [('E', 2), ('S', 2)]), walk(1, 0, [('W', 2)] * 100), walk(0, 0, [('N', 0)] * 100), walk(10, 20, [('N', 10), ('S', 10), ('E', 10), ('W', 10)]), walk(0, -1, [('N', 2)])],
    [walk(RNG.randint(-5, 5), RNG.randint(-5, 5), [(RNG.choice('NSEW'), RNG.randrange(6)) for _ in range(RNG.randint(1, 15))]) for _ in range(60)])


def points(rect, ps):
    return records([*rect, len(ps)], ps)


def oracle157(s):
    rows = [list(map(int, line.split())) for line in s.splitlines()]
    l, b, r, t, _ = rows[0]
    inside = sum(l < x < r and b < y < t for x, y in rows[1:])
    closed = sum(l <= x <= r and b <= y <= t for x, y in rows[1:])
    return f"{inside} {closed - inside} {len(rows) - 1 - closed}"


add(157, "矩形內外與邊界點", "Medium", "M-7", ["座標", "邏輯判斷", "分類統計"],
    ["區分嚴格內部與含邊界的座標條件", "使用多個計數器分類資料"], ["比較運算", "and 與 or", "迴圈"],
    ("將每個點分為矩形內部、邊界或外部。", "矩形的邊平行於座標軸，由左下角與右上角定義。角落屬於邊界；內部不含任何邊。重複出現的點視為不同筆資料，分別計數。"),
    "第一行為 <code>x1 y1 x2 y2 N</code>，前四數是左下角與右上角。接著 N 行各為一個點的 <code>x y</code>。",
    "輸出內部、邊界、外部的點數，三數間以一個空白分隔。",
    ["1 ≤ N ≤ 100", "所有座標皆為 -1000 至 1000 的整數", "x1 &lt; x2，y1 &lt; y2"],
    "先判斷是否落在含邊界的矩形中，再區分邊界與內部。",
    '''
    # 思路：先排除外部，再看是否碰到任一邊界；時間 O(N)，額外空間 O(1)。
    x1, y1, x2, y2, n = map(int, input().split())
    inside = boundary = outside = 0
    for _ in range(n):
        x, y = map(int, input().split())
        if not (x1 <= x <= x2 and y1 <= y <= y2):
            outside += 1
        elif x == x1 or x == x2 or y == y1 or y == y2:
            boundary += 1
        else:
            inside += 1
    print(inside, boundary, outside)
    ''', oracle157,
    [points((0, 0, 4, 3), [(2, 1), (4, 1), (5, 2)]), points((-1, -1, 1, 1), [(0, 0)]), points((0, 0, 1, 1), [(0, 0), (0, 1), (1, 0), (1, 1)]), points((-1000, -1000, 1000, 1000), [(0, 0)] * 100), points((-1000, -1000, -999, -999), [(1000, 1000)] * 100), points((-1000, -1000, 1000, 1000), [(-1000, -1000), (1000, 1000)] * 50), points((0, 0, 2, 2), [(1, 0), (1, 2), (0, 1), (2, 1)]), points((0, 0, 2, 2), [(-1, 0), (3, 0), (0, -1), (0, 3)]), points((0, 0, 1, 1), [(0, 0)]), points((-2, -2, 2, 2), [(-1, -1), (1, 1)]), points((999, 999, 1000, 1000), [(999, 1000)]), points((-2, -2, -1, -1), [(0, 0)]), points((-3, -3, 3, 3), [(0, 0), (3, 3), (4, 3), (-3, 0)])],
    [points((-3, -2, 4, 5), [(RNG.randint(-5, 6), RNG.randint(-4, 7)) for _ in range(RNG.randint(1, 20))]) for _ in range(60)])


def oracle158(s):
    a = list(map(int, s.split()))[1:]
    groups = [(k, len(list(g))) for k, g in itertools.groupby(a)]
    score = sum(3 * n * (n + 1) if k == 6 else k * n for k, n in groups)
    return f"{score} {max([n for k, n in groups if k == 6] or [0])}"


add(158, "擲骰連段獎分", "Medium", "M-7", ["簡單模擬", "連續紀錄", "累加"],
    ["遇到特定值時延長連段，其餘值重設", "同時追蹤總分與最長連段"], ["迴圈", "條件判斷", "計數器"],
    ("依骰子點數與連續六點的長度計算得分。", "非 6 點的一次得分就是該點數，且中斷六點連段。連續擲出 6 時，這段的第 k 次六點得 <code>6 × k</code> 分；下一段重新由 k=1 開始。另回報最長六點連段長度，若沒有六點則為 0。"),
    "第一行為擲骰次數 N；第二行為 N 個空白分隔的點數。",
    "輸出總分與最長六點連段長度，中間以一個空白分隔。",
    ["1 ≤ N ≤ 100", "每次點數為 1 至 6 的整數"], "一個計數器記錄目前連續出現幾個六點。",
    '''
    # 思路：非六點重設連段，六點以目前連段長度計分；時間 O(N)，空間 O(N)（輸入清單）。
    n = int(input())
    dice = list(map(int, input().split()))
    total = run = longest = 0
    for value in dice:
        if value == 6:
            run += 1
            total += 6 * run
            longest = max(longest, run)
        else:
            run = 0
            total += value
    print(total, longest)
    ''', oracle158,
    [seq([6, 6, 2, 6]), seq([1, 2, 3]), seq([6]), seq([1]), seq([6] * 100), seq([1] * 100), seq([6, 1] * 50), seq([5] * 100), seq([1, 6, 6, 6]), seq([6, 6, 6, 1]), seq([6, 6, 1, 6, 6]), seq([1, 6, 2, 6, 3, 6, 4, 6, 5, 6]), seq([2, 3, 4, 5])],
    [seq([RNG.randint(1, 6) for _ in range(RNG.randint(1, 30))]) for _ in range(60)])


def water(c, initial, commands):
    return records([c, initial, len(commands)], commands)


def oracle159(s):
    rows = s.splitlines()
    c, initial, _ = map(int, rows[0].split())
    units = [1] * initial
    rejected = 0
    for row in rows[1:]:
        op, a = row.split()
        amount = int(a)
        if op == 'F':
            units = (units + [1] * amount)[:c]
        elif amount <= len(units):
            units = units[amount:]
        else:
            rejected += 1
    return f"{len(units)} {rejected}"


add(159, "飲水機容量模擬", "Medium", "M-7", ["簡單模擬", "條件判斷", "狀態更新"],
    ["依容量上限截斷加水量", "區分成功取水與不改變狀態的失敗操作"], ["迴圈", "條件分支", "變數更新"],
    ("依加水與取水紀錄計算最後水量和失敗次數。", "容量為 C。<code>F a</code> 表示加入 a 單位水，超過容量的部分溢出。<code>D a</code> 表示取出 a 單位水；若現有水量不足，這次取水完全不執行，失敗次數增加 1。水量足夠或 a=0 都算成功。"),
    "第一行為 <code>C V N</code>，分別是容量、初始水量與操作數。接著 N 行各為一個操作。",
    "輸出最後水量與取水失敗次數，中間以一個空白分隔。",
    ["1 ≤ C ≤ 1000", "0 ≤ V ≤ C", "1 ≤ N ≤ 100", "0 ≤ a ≤ 1000"],
    "取水失敗時只更新失敗次數，不能扣除原有水量。",
    '''
    # 思路：逐筆更新水量，加水受容量限制，取水不足則拒絕；時間 O(N)，額外空間 O(1)。
    capacity, volume, n = map(int, input().split())
    failures = 0
    for _ in range(n):
        op, amount = input().split()
        amount = int(amount)
        if op == 'F':
            volume = min(capacity, volume + amount)
        elif amount <= volume:
            volume -= amount
        else:
            failures += 1
    print(volume, failures)
    ''', oracle159,
    [water(10, 3, [('F', 9), ('D', 4), ('D', 7)]), water(1, 0, [('D', 0)]), water(5, 5, [('D', 5)]), water(1000, 1000, [('F', 1000)] * 100), water(1, 0, [('D', 1000)] * 100), water(1000, 0, [('F', 1000), ('D', 1000)] * 50), water(1, 1, [('F', 0)]), water(2, 1, [('D', 2), ('D', 1)]), water(10, 0, [('F', 0)] * 100), water(1000, 999, [('F', 1)]), water(10, 10, [('F', 1), ('D', 10), ('D', 1)]), water(10, 5, [('D', 6), ('F', 1), ('D', 6)]), water(1, 0, [('F', 1000)])],
    [water(c, RNG.randint(0, c), [(RNG.choice('FD'), RNG.randrange(11)) for _ in range(RNG.randint(1, 20))]) for c in [RNG.randint(1, 10) for _ in range(60)]])


def signals(green, red, ts):
    return lines([green, red, len(ts)], ts)


def oracle160(s):
    g, r, _, *ts = map(int, s.split())
    pattern = ['GREEN'] * g + ['RED'] * r
    return '\n'.join(pattern[t % len(pattern)] for t in ts)


add(160, "週期號誌查詢", "Easy", "M-7", ["餘數", "條件判斷", "週期"],
    ["以餘數定位週期內的時間", "正確處理紅綠燈切換端點"], ["迴圈", "餘數", "比較運算"],
    ("判斷多個指定秒數的號誌顏色。", "從第 0 秒起先亮 G 秒綠燈，再亮 R 秒紅燈，持續循環。例如 G=3、R=2 時，第 0、1、2 秒為綠燈，第 3、4 秒為紅燈，第 5 秒又為綠燈。"),
    "第一行為 <code>G R Q</code>；第二行為 Q 個查詢時間 t，以空白分隔。查詢時間不保證遞增，也可能重複。",
    "按輸入順序，每個查詢輸出一行 <code>GREEN</code> 或 <code>RED</code>。",
    ["1 ≤ G、R ≤ 60", "1 ≤ Q ≤ 100", "0 ≤ t ≤ 10000，皆為整數"],
    "完整循環長度是綠燈與紅燈秒數的總和。",
    '''
    # 思路：取時間對週期的餘數，比較是否小於綠燈秒數；時間 O(Q)，空間 O(Q)（輸入清單）。
    green, red, q = map(int, input().split())
    times = list(map(int, input().split()))
    for time in times:
        print('GREEN' if time % (green + red) < green else 'RED')
    ''', oracle160,
    [signals(3, 2, [0, 2, 3, 4, 5]), signals(1, 1, [1]), signals(2, 3, [10, 7, 7, 0]), signals(60, 60, [10000] * 100), signals(1, 1, [0] * 100), signals(1, 60, [0, 1, 60, 61]), signals(60, 1, [59, 60, 61, 62]), signals(60, 60, [59, 60, 119, 120]), signals(7, 11, [10000]), signals(1, 1, [10000]), signals(2, 2, list(range(100))), signals(5, 5, [5] * 10), signals(3, 4, [6, 7, 8, 9, 10])],
    [signals(RNG.randint(1, 60), RNG.randint(1, 60), [RNG.randrange(10001) for _ in range(RNG.randint(1, 30))]) for _ in range(60)])


def passwords(values):
    return records(len(values), values)


def oracle161(s):
    def good(p):
        return (8 <= len(p) <= 20 and re.search('[A-Z]', p) and re.search('[a-z]', p)
                and re.search('[0-9]', p) and not re.search(r'(.)\1', p))
    return '\n'.join('YES' if good(p) else 'NO' for p in s.splitlines()[1:])


add(161, "密碼格式檢查", "Medium", "M-7", ["字串", "條件組合", "相鄰比較"],
    ["累積字元種類的出現旗標", "檢查相鄰字元與長度條件"], ["字串走訪", "布林運算", "索引"],
    ("逐筆判斷密碼是否符合全部格式規則。", "合法密碼長度為 8 至 20 個字元，至少包含一個大寫英文字母、一個小寫英文字母及一個數字，而且不能有兩個相鄰字元完全相同。底線可以出現，但不算英文字母或數字。大小寫視為不同字元。"),
    "第一行是密碼數 N，接著 N 行各有一組不含空白的密碼。",
    "每組密碼依序輸出一行；符合全部規則輸出 <code>YES</code>，否則輸出 <code>NO</code>。",
    ["1 ≤ N ≤ 30", "每組輸入長度為 1 至 100", "字元僅為 A–Z、a–z、0–9、底線 _"],
    "檢查過程中保留是否看過各種字元的旗標。",
    '''
    # 思路：逐字累積種類旗標並檢查相鄰重複，最後合併規則；時間 O(總字元數)，空間 O(L)。
    n = int(input())
    for _ in range(n):
        password = input()
        upper = lower = digit = False
        repeated = False
        for i, char in enumerate(password):
            upper = upper or 'A' <= char <= 'Z'
            lower = lower or 'a' <= char <= 'z'
            digit = digit or '0' <= char <= '9'
            if i > 0 and char == password[i - 1]:
                repeated = True
        valid = 8 <= len(password) <= 20 and upper and lower and digit and not repeated
        print('YES' if valid else 'NO')
    ''', oracle161,
    [passwords(['Abc123_x', 'Abc112_x', 'abcdefgh']), passwords(['Aa1_bcde']), passwords(['A']), passwords(['Aa1_' * 25] * 30), passwords(['Aa1_' * 5]), passwords(['Aa1_' * 5 + 'x']), passwords(['Aa1_bcd']), passwords(['ABC123_X']), passwords(['abc123_x']), passwords(['Abcdef_x']), passwords(['Aa1__bcd']), passwords(['aA0aA0aA', 'Aa1_bcdd']), passwords(['Aa1_bcde'] * 30), passwords(['_', '0', 'z', 'Z', 'Aa0_Ab1_'])],
    [passwords([''.join(RNG.choice('AaBb01_') for _ in range(RNG.randint(1, 25))) for _ in range(RNG.randint(1, 15))]) for _ in range(60)])


def oracle162(s):
    ds = list(map(int, s.strip()))
    weighted = sum(ds[::2]) + 3 * sum(ds[1::2])
    return next(str(c) for c in range(10) if (weighted + c) % 10 == 0)


add(162, "交替權重校驗碼", "Easy", "M-7", ["字串", "索引", "餘數"],
    ["依位置奇偶採用不同權重", "處理字串前導零與模數補數"], ["字串走訪", "餘數", "累加"],
    ("為數字字串計算一位校驗碼。", "從左至右的位置編號由 1 開始。奇數位置數字乘以 1，偶數位置乘以 3，將所有乘積加總為 S。校驗碼 c 是 0 至 9 中唯一讓 <code>S + c</code> 為 10 的倍數的數字。校驗碼本身不再乘權重；輸入的前導零也占位置。"),
    "一行數字字串。", "輸出一個 0 至 9 的整數校驗碼。",
    ["字串長度為 1 至 100", "每個字元皆為 0–9，可有前導零"],
    "先計算加權總和除以 10 的餘數。",
    '''
    # 思路：依索引奇偶累加權重，再補至下一個十的倍數；時間 O(L)，空間 O(L)。
    digits = input()
    total = 0
    for i, char in enumerate(digits):
        total += int(char) * (1 if i % 2 == 0 else 3)
    print((10 - total % 10) % 10)
    ''', oracle162,
    ['12345', '0', '0009', '9' * 100, '0' * 100, '9', '1', '10', '01', '11111', '999', '1234567890', '09' * 50, '90' * 50],
    [''.join(RNG.choice('0123456789') for _ in range(RNG.randint(1, 100))) for _ in range(80)])


def oracle163(s):
    return ' '.join(k + str(len(list(g))) for k, g in itertools.groupby(s.strip()))


add(163, "連續字元壓縮", "Medium", "M-7", ["字串", "連續紀錄", "格式化輸出"],
    ["以相鄰字元的改變切分連段", "在掃描結束後輸出最後一段"], ["字串索引", "迴圈", "計數器"],
    ("將每段連續相同字元改寫為字母與次數。", "依原順序處理每個最長的相同字元連段，例如 <code>aaabb</code> 變成 <code>a3 b2</code>。只有一個字元的段也要寫出次數 1；被其他字元隔開的相同字母不能合併。"),
    "一行只含小寫英文字母的字串。", "輸出壓縮結果，每段之間以一個空白分隔，段內不加空白。",
    ["1 ≤ 字串長度 ≤ 1000", "字元僅為 a–z"], "遇到字元改變時，就可以輸出上一段的字母與長度。",
    '''
    # 思路：追蹤目前字母及次數，遇不同字母就結算連段；時間 O(L)，空間 O(L)。
    text = input()
    result = []
    current = text[0]
    count = 1
    for char in text[1:]:
        if char == current:
            count += 1
        else:
            result.append(current + str(count))
            current, count = char, 1
    result.append(current + str(count))
    print(' '.join(result))
    ''', oracle163,
    ['aaabbcaa', 'z', 'abcd', 'a' * 1000, 'az' * 500, 'a' * 999 + 'b', 'a' + 'b' * 999, 'aaa', 'aba', 'aabbccdd', 'zzzzaaaazzzz', 'abcdefghijklmnopqrstuvwxyz', 'a' * 10 + 'b' * 100],
    [''.join(RNG.choice('abcz') for _ in range(RNG.randint(1, 100))) for _ in range(80)])


def encoded(groups):
    return ''.join(char + str(count) for char, count in groups)


def oracle164(s):
    return ''.join(letter * int(count) for letter, count in re.findall(r'([A-Z])(\d+)', s.strip()))


add(164, "重複指令展開", "Medium", "M-7", ["字串解析", "迴圈", "累積輸出"],
    ["讀取位數不固定的次數", "依字母與次數還原字串"], ["字串索引", "while 迴圈", "整數轉換"],
    ("將字母後的重複次數展開為完整指令。", "輸入由一或多組「大寫字母＋正整數」直接串接而成。例如 <code>A3B12</code> 表示先輸出 3 個 A，再輸出 12 個 B。相鄰兩組可使用相同字母，每一組仍按順序展開。"),
    "一行編碼字串，不含空白；每組的次數沒有前導零。",
    "輸出展開後的字串，不加任何空白。",
    ["1 ≤ 組數 ≤ 100", "每組字母為 A–Z，每組次數為 1 至 20", "輸入保證符合編碼格式；展開後長度最多 2000"],
    "遇到字母後，持續讀取數字直到下一個字母或字串結尾。",
    '''
    # 思路：用索引讀字母與其後完整數字段，依次數展開；時間 O(L + K)，空間 O(K)，K 為輸出長度。
    code = input()
    result = []
    i = 0
    while i < len(code):
        letter = code[i]
        i += 1
        count = 0
        while i < len(code) and '0' <= code[i] <= '9':
            count = count * 10 + int(code[i])
            i += 1
        result.append(letter * count)
    print(''.join(result))
    ''', oracle164,
    ['A3B2A1', 'Z1', 'A10B1', 'Z20' * 100, 'A1' * 100, 'A20', 'A1A2', 'Z9Y10X11', 'B19C20', 'A1Z20A1', 'M12N13O14', 'X2Y2Z2', 'A20Z1' * 50],
    [encoded([(RNG.choice('ABCXYZ'), RNG.randint(1, 20)) for _ in range(RNG.randint(1, 25))]) for _ in range(80)])


def grade_rows(rows):
    return records([len(rows), len(rows[0][1])], [name + ';' + ';'.join(map(str, scores)) for name, scores in rows])


def oracle165(s):
    output = []
    for row in s.splitlines()[1:]:
        name, *marks = row.split(';')
        present = [int(x) for x in marks if x != '-']
        # 各分數分配至總分刻度，再取平均下界；不執行正式解答。
        average = str(sum(present) // len(present)) if present else 'NA'
        output.append(f"{name} {average} {marks.count('-')}")
    return '\n'.join(output)


add(165, "分號成績紀錄解析", "Medium", "M-7", ["字串解析", "統計", "缺漏資料"],
    ["解析分號欄位並區分缺考與零分", "依有效筆數計算整數平均"], ["字串分割", "條件判斷", "累加"],
    ("讀取分號分隔的成績，計算每位學生的平均與缺考次數。", "每筆紀錄的第一欄是姓名，後面 K 欄是成績。<code>-</code> 代表缺考，不納入平均；數字 0 是有效成績。有效成績的平均只取整數部分；全部缺考時，平均欄輸出 <code>NA</code>。依原始紀錄順序輸出。"),
    "第一行為學生數 N 與每位學生的成績欄數 K。接著 N 行格式為 <code>name;score1;score2;...</code>，分號兩側沒有空白。",
    "每位學生輸出一行 <code>name average absent</code>，欄位間以一個空白分隔；absent 是缺考次數。",
    ["1 ≤ N ≤ 100，1 ≤ K ≤ 20", "姓名為 1 至 10 個小寫英文字母，不保證互異", "每個成績欄為 - 或 0 至 100 的整數，數字無多餘前導零"],
    "用有效成績的筆數當分母，而非固定的欄位總數。",
    '''
    # 思路：逐列解析欄位，只累加非缺考分數，另計缺考數；時間 O(NK)，空間 O(K)。
    n, k = map(int, input().split())
    for _ in range(n):
        fields = input().split(';')
        name = fields[0]
        total = count = absent = 0
        for mark in fields[1:]:
            if mark == '-':
                absent += 1
            else:
                total += int(mark)
                count += 1
        average = str(total // count) if count else 'NA'
        print(name, average, absent)
    ''', oracle165,
    [grade_rows([('amy', [80, '-', 91]), ('bo', [0, 60, 60])]), grade_rows([('a', ['-'])]), grade_rows([('zed', [0])]), grade_rows([('abcdefghij', [100] * 20)] * 100), grade_rows([('a', ['-'] * 20)] * 100), grade_rows([('b', [0] * 20)] * 100), grade_rows([('c', [99, 100])]), grade_rows([('amy', [1]), ('amy', [2])]), grade_rows([('d', ['-', 100, '-'])]), grade_rows([('e', [1, 2, 2])]), grade_rows([('f', [100])]), grade_rows([('g', [0, '-', 100])]), grade_rows([('h', list(range(20)))])],
    [grade_rows([(RNG.choice(['a', 'amy', 'student']), [RNG.choice(['-', 0, 1, 59, 60, 99, 100]) for _ in range(k)]) for _ in range(RNG.randint(1, 10))]) for k in [RNG.randint(1, 10) for _ in range(60)]])


def oracle166(s):
    a = list(map(int, s.split()))[1:]
    counts = [a.count(x) for x in range(10)]
    best = min(a, key=lambda x: (-a.count(x), x))
    return ' '.join(map(str, counts)) + '\n' + str(best)


add(166, "點數分布與眾數", "Medium", "M-7", ["次數統計", "清單", "並列規則"],
    ["以點數為索引累積次數", "依最小點數規則處理最高頻率並列"], ["清單索引", "計數", "最值"],
    ("列出各點數次數，並找出最常見的點數。", "點數只會是 0 至 9。先依 0、1、…、9 的順序列出次數，再輸出出現次數最多的點數；若並列，選數值最小者。"),
    "第一行為資料數 N，第二行是 N 個空白分隔的點數。",
    "第一行輸出 10 個次數，以一個空白分隔。第二行輸出最常見的點數。",
    ["1 ≤ N ≤ 100", "0 ≤ 每個點數 ≤ 9，皆為整數"],
    "由小到大檢查點數，只有次數嚴格增加時才更換答案。",
    '''
    # 思路：十格計數清單統計，再按遞增點數找最高次數；時間 O(N)，空間 O(N)（輸入清單）。
    n = int(input())
    numbers = list(map(int, input().split()))
    counts = [0] * 10
    for number in numbers:
        counts[number] += 1
    best = 0
    for number in range(1, 10):
        if counts[number] > counts[best]:
            best = number
    print(*counts)
    print(best)
    ''', oracle166,
    [seq([3, 1, 3, 1, 9]), seq([0]), seq([9, 9, 9]), seq([9] * 100), seq([0] * 100), seq(list(range(10)) * 10), seq([9, 8]), seq([5, 5, 6, 6, 4]), seq([1, 2, 2, 3]), seq([0, 1, 1, 0]), seq([8]), seq([9, 0]), seq([2] * 49 + [3] * 50 + [0])],
    [seq([RNG.randrange(10) for _ in range(RNG.randint(1, 100))]) for _ in range(60)])


def target_days(target, values):
    return lines([len(values), target], values)


def oracle167(s):
    n, target, *a = map(int, s.split())
    intervals = [(end - start, start + 1) for start in range(n) for end in range(start + 1, n + 1)
                 if min(a[start:end]) >= target]
    if not intervals:
        return '0 0'
    length, start = min(intervals, key=lambda v: (-v[0], v[1]))
    return f'{start} {length}'


add(167, "最長連續達標天數", "Medium", "M-7", ["連續紀錄", "最值", "並列規則"],
    ["追蹤連續達標段的長度與起點", "以最早起點處理等長連段"], ["迴圈", "條件判斷", "計數器"],
    ("找出最長的連續達標紀錄及開始日期。", "第 i 天的數值大於或等於門檻 T 就算達標，日期從 1 開始。找出所有天都達標的最長連續區間；若有多段等長，選開始日期最早者。完全沒有達標日則輸出 <code>0 0</code>。"),
    "第一行為天數 N 與門檻 T，第二行為依日期順序排列的 N 個整數。",
    "輸出開始日期與連續天數，中間以一個空白分隔。",
    ["1 ≤ N ≤ 100", "-1000 ≤ T、每日數值 ≤ 1000"],
    "遇到未達標日，把目前連續天數歸零。",
    '''
    # 思路：單趟記錄目前連段，只在更長時更新答案；時間 O(N)，空間 O(N)（輸入清單）。
    n, target = map(int, input().split())
    values = list(map(int, input().split()))
    run = best = start = 0
    for day, value in enumerate(values, 1):
        if value >= target:
            run += 1
            if run > best:
                best = run
                start = day - run + 1
        else:
            run = 0
    print(start, best)
    ''', oracle167,
    [target_days(5, [5, 6, 2, 8, 9, 10]), target_days(0, [-1, -2]), target_days(3, [3, 3, 0, 3, 3]), target_days(-1000, [-1000] * 100), target_days(1000, [1000] * 100), target_days(1000, [-1000] * 100), target_days(0, [0]), target_days(1, [0]), target_days(0, [-1, 0]), target_days(0, [0, -1]), target_days(5, [4, 5] * 50), target_days(-5, [-6, -5, -4, -6]), target_days(10, [10] * 99 + [9])],
    [target_days(RNG.randint(-4, 4), [RNG.randint(-5, 5) for _ in range(RNG.randint(1, 20))]) for _ in range(60)])


def oracle168(s):
    a = list(map(int, s.split()))[1:]
    levels = [k for k, _ in itertools.groupby(a)]
    return sum((levels[i] > levels[i - 1] and levels[i] > levels[i + 1]) or
               (levels[i] < levels[i - 1] and levels[i] < levels[i + 1]) for i in range(1, len(levels) - 1))


add(168, "忽略持平的溫度轉折", "Medium", "M-7", ["相鄰比較", "狀態紀錄", "計數"],
    ["忽略相等值並保留先前變化方向", "計算上升與下降方向切換次數"], ["比較運算", "迴圈", "變數更新"],
    ("忽略持平紀錄後，計算溫度上升與下降互換幾次。", "依時間比較相鄰溫度，大於前一筆為上升，小於前一筆為下降，相等則忽略且不改變原方向。第一個非持平變化只建立方向，不算轉折。之後上升改為下降，或下降改為上升，各計一次。"),
    "第一行是紀錄數 N，第二行為按時間排序的 N 個整數溫度。",
    "輸出轉折次數。", ["1 ≤ N ≤ 100", "-100 ≤ 溫度 ≤ 100"],
    "持平時不要重設最後一次非零的變化方向。",
    '''
    # 思路：相鄰溫度決定方向，跳過持平並統計方向更換；時間 O(N)，空間 O(N)。
    n = int(input())
    temperatures = list(map(int, input().split()))
    previous_direction = changes = 0
    for i in range(1, n):
        difference = temperatures[i] - temperatures[i - 1]
        if difference == 0:
            continue
        direction = 1 if difference > 0 else -1
        if previous_direction != 0 and direction != previous_direction:
            changes += 1
        previous_direction = direction
    print(changes)
    ''', oracle168,
    [seq([20, 22, 22, 19, 18, 21]), seq([5, 5, 5]), seq([0]), seq([-100, 100] * 50), seq([100] * 100), seq([-100] * 100), seq(list(range(100))), seq(list(range(99, -1, -1))), seq([1, 1, 2, 2, 1, 1]), seq([2, 1, 1, 2, 2, 3]), seq([1, 2]), seq([2, 1]), seq([0, 1, 0, -1, 0])],
    [seq([RNG.randint(-3, 3) for _ in range(RNG.randint(1, 30))]) for _ in range(60)])


def ballots(m, values):
    return lines([m, len(values)], values)


def oracle169(s):
    m, _, *votes = map(int, s.split())
    valid = Counter(v for v in votes if v)
    maximum = max(valid.values(), default=0)
    winners = ' '.join(str(v) for v in range(1, m + 1) if valid[v] == maximum) if maximum else 'NONE'
    return f'{votes.count(0)}\n{winners}'


add(169, "有效選票與並列當選", "Medium", "M-7", ["次數統計", "清單", "並列規則"],
    ["區分無效票與候選人票數", "輸出全部最高票者並處理零張有效票"], ["清單索引", "迴圈", "最值"],
    ("統計無效票，並列出所有最高票候選人。", "候選人編號為 1 至 M。選票 0 代表無效，其餘票值就是候選人編號。有效票最多者全部當選，按編號由小到大輸出。如果全部都是無效票，沒有任何人當選。"),
    "第一行為候選人數 M 與票數 N；第二行為 N 個空白分隔的票值。",
    "第一行輸出無效票數。第二行輸出當選者編號，以一個空白分隔；沒有當選者則輸出 <code>NONE</code>。",
    ["1 ≤ M ≤ 20", "1 ≤ N ≤ 100", "每個票值為 0 至 M 的整數"],
    "最高票數為 0 時，必須另行處理沒有有效票的情況。",
    '''
    # 思路：票值作為清單索引，找最高有效票數並依序輸出並列者；時間 O(N + M)，空間 O(N + M)。
    m, n = map(int, input().split())
    votes = list(map(int, input().split()))
    counts = [0] * (m + 1)
    for vote in votes:
        counts[vote] += 1
    print(counts[0])
    maximum = max(counts[1:])
    if maximum == 0:
        print('NONE')
    else:
        print(' '.join(str(i) for i in range(1, m + 1) if counts[i] == maximum))
    ''', oracle169,
    [ballots(3, [1, 2, 0, 2, 1]), ballots(1, [0]), ballots(4, [4, 4, 1]), ballots(20, [20] * 100), ballots(20, [0] * 100), ballots(1, [1] * 100), ballots(20, list(range(1, 21)) * 5), ballots(1, [1]), ballots(2, [0, 1, 0]), ballots(3, [2, 3]), ballots(20, [1, 20]), ballots(3, [0, 0, 3, 2, 1]), ballots(2, [2] * 50 + [1] * 49 + [0])],
    [ballots(m, [RNG.randrange(m + 1) for _ in range(RNG.randint(1, 50))]) for m in [RNG.randint(1, 20) for _ in range(60)]])


def pairs(limit, people):
    return records([len(people), limit], people)


def oracle170(s):
    rows = [list(map(int, row.split())) for row in s.splitlines()]
    _, limit = rows[0]
    return sum(g != h and max(a, b) - min(a, b) <= limit for (g, a), (h, b) in itertools.combinations(rows[1:], 2))


add(170, "跨組練習配對", "Medium", "M-8", ["巢狀迴圈", "條件組合", "配對計數"],
    ["用兩層迴圈枚舉不重複的兩人組合", "結合不同組別與能力差上限條件"], ["清單", "巢狀迴圈", "絕對值"],
    ("計算符合跨組與能力差條件的兩人配對數。", "每個人有組別 g 與能力值 s。兩人組別不同，而且能力值差的絕對值不超過 K，便形成一組合格配對。每對只計一次，不能與自己配對。不同人即使資料相同仍視為不同個體；不要求配對彼此互斥，同一人可以出現在多個配對中。"),
    "第一行為人數 N 與能力差上限 K。接著 N 行各為一人的組別 g 與能力值 s。",
    "輸出合格的兩人配對總數。", ["2 ≤ N ≤ 60", "0 ≤ K ≤ 100", "1 ≤ g ≤ 10", "1 ≤ s ≤ 100"],
    "固定第一個人後，只考慮位置在他後面的第二個人。",
    '''
    # 思路：只枚舉 i < j 的兩人，依組別和能力差判斷；時間 O(N²)，空間 O(N)。
    n, limit = map(int, input().split())
    people = [tuple(map(int, input().split())) for _ in range(n)]
    answer = 0
    for i in range(n):
        for j in range(i + 1, n):
            if people[i][0] != people[j][0] and abs(people[i][1] - people[j][1]) <= limit:
                answer += 1
    print(answer)
    ''', oracle170,
    [pairs(3, [(1, 10), (2, 12), (1, 11), (3, 20)]), pairs(0, [(1, 5), (2, 5)]), pairs(100, [(1, 1), (1, 100)]), pairs(100, [(i % 10 + 1, 100) for i in range(60)]), pairs(0, [(1, 1)] * 60), pairs(0, [(1, 1)] * 30 + [(10, 100)] * 30), pairs(99, [(1, 1), (10, 100)]), pairs(98, [(1, 1), (10, 100)]), pairs(1, [(1, 2), (2, 3), (3, 4)]), pairs(0, [(1, 50), (2, 50), (2, 50)]), pairs(5, [(10, 100), (1, 95)]), pairs(4, [(10, 100), (1, 95)]), pairs(100, [(1, 1), (2, 1), (3, 1), (4, 1)])],
    [pairs(RNG.randrange(11), [(RNG.randint(1, 4), RNG.randint(1, 15)) for _ in range(RNG.randint(2, 20))]) for _ in range(60)])


def oracle171(s):
    n = int(s)
    # 獨立枚舉乘法表中的因數對，僅到平方根；正式解答採整除判斷。
    answer = []
    for a in range(1, math.isqrt(n) + 1):
        candidates = range(a, n // a + 1)
        for b in candidates:
            if a * b == n:
                answer.append(f'{a} {b}')
    return '\n'.join(answer)


add(171, "因數配對清單", "Easy", "M-8", ["基礎數論", "餘數", "枚舉"],
    ["用餘數判斷整除", "避免交換順序與平方根造成重複配對"], ["整除與餘數", "迴圈", "條件判斷"],
    ("列出正整數的所有因數配對。", "找出所有正整數 a、b，使 <code>a × b = N</code> 且 <code>a ≤ b</code>。每對只列一次，按 a 由小到大輸出。當 N 為完全平方數，兩個相同因數的配對也要列出。"),
    "一行正整數 N。", "每行輸出一組 <code>a b</code>，中間以一個空白分隔。",
    ["1 ≤ N ≤ 10000"], "找到因數 a 時，另一個因數就是 N 除以 a 的商。",
    '''
    # 思路：逐一檢查 a 是否整除 N，並只輸出 a 不大於商的配對；時間 O(N)，額外空間 O(1)。
    n = int(input())
    for a in range(1, n + 1):
        if n % a == 0:
            b = n // a
            if a <= b:
                print(a, b)
    ''', oracle171,
    ['12', '1', '49', '10000', '9973', '2', '4', '36', '64', '81', '9999', '60', '100', '17'],
    [str(RNG.randint(1, 200)) for _ in range(80)])


def oracle172(s):
    h, w = map(int, s.split())
    board = [['.'] * w for _ in range(h)]
    for row in board:
        row[0] = row[-1] = '#'
    board[0] = ['#'] * w
    board[-1] = ['#'] * w
    return '\n'.join(''.join(row) for row in board)


add(172, "空心方框列印", "Easy", "M-7", ["巢狀迴圈", "邊界判斷", "格式化輸出"],
    ["用列與欄的位置辨識圖形邊界", "處理高度或寬度為一的退化圖形"], ["巢狀迴圈", "or 條件", "字串組合"],
    ("以井字號與句點印出指定大小的空心方框。", "方框高 H 列、寬 W 欄。最上列、最下列、最左欄與最右欄都印 <code>#</code>，其餘位置印 <code>.</code>。若 H 或 W 為 1，每個位置都在邊界上。"),
    "一行包含正整數 H 與 W，以空白分隔。",
    "輸出 H 行，每行恰有 W 個字元。字元之間不加空白。",
    ["1 ≤ H、W ≤ 30"], "某位置只要位於四條邊中的任一條，就屬於邊界。",
    '''
    # 思路：逐列逐欄判斷四條邊，組成一行後輸出；時間 O(HW)，額外空間 O(W)。
    h, w = map(int, input().split())
    for r in range(h):
        row = []
        for c in range(w):
            if r == 0 or r == h - 1 or c == 0 or c == w - 1:
                row.append('#')
            else:
                row.append('.')
        print(''.join(row))
    ''', oracle172,
    ['4 5', '1 1', '3 3', '30 30', '1 30', '30 1', '2 2', '2 30', '30 2', '3 30', '30 3', '5 4', '1 2', '2 1'],
    [f'{RNG.randint(1, 30)} {RNG.randint(1, 30)}' for _ in range(60)])


def attendance(values):
    return records([len(values), len(values[0])], values)


def oracle173(s):
    rows = s.splitlines()[1:]
    counts = [row.count('1') for row in rows]
    most = max(counts)
    champion = counts.index(most) + 1
    full = sum('0' not in row for row in rows)
    return f'{full}\n{champion} {most}'


add(173, "多日出席統計", "Medium", "M-7", ["巢狀迴圈", "統計", "並列規則"],
    ["從每位學生的多日紀錄統計出席次數", "統計全勤並依編號處理最高次數並列"], ["字串走訪", "計數", "最值"],
    ("統計全勤人數與出席最多的學生。", "學生編號依輸入順序從 1 開始。每人有 D 天的紀錄，<code>1</code> 表示出席，<code>0</code> 表示缺席。D 天全部出席才算全勤。出席次數最多者若有多位，選編號最小者；即使所有人都缺席，仍選編號 1。"),
    "第一行包含學生數 N 與天數 D。接著 N 行，每行有一個長度為 D 的 01 字串，沒有空白。",
    "第一行輸出全勤人數。第二行輸出出席最多者的編號與出席次數，以一個空白分隔。",
    ["1 ≤ N ≤ 50", "1 ≤ D ≤ 30", "每筆出席紀錄只含字元 0、1"],
    "先算完一位學生的出席次數，再更新全勤統計與最佳紀錄。",
    '''
    # 思路：逐人逐日累計出席，最高次數只在嚴格增加時更換；時間 O(ND)，額外空間 O(D)。
    n, days = map(int, input().split())
    full = 0
    best_count = -1
    best_id = 0
    for student in range(1, n + 1):
        count = 0
        for present in input():
            if present == '1':
                count += 1
        if count == days:
            full += 1
        if count > best_count:
            best_id, best_count = student, count
    print(full)
    print(best_id, best_count)
    ''', oracle173,
    [attendance(['111', '101', '111']), attendance(['0']), attendance(['01', '10']), attendance(['1' * 30] * 50), attendance(['0' * 30] * 50), attendance(['1']), attendance(['0', '1']), attendance(['1', '0']), attendance(['01' * 15, '10' * 15]), attendance(['0' * 30, '1' * 30]), attendance(['0'] * 49 + ['1']), attendance(['100', '010', '001']), attendance(['110', '111', '101', '000'])],
    [attendance([''.join(RNG.choice('01') for _ in range(days)) for _ in range(RNG.randint(1, 15))]) for days in [RNG.randint(1, 30) for _ in range(60)]])


def card_rounds(rounds):
    return records(len(rounds), rounds)


def oracle174(s):
    rounds = [tuple(map(int, row.split())) for row in s.splitlines()[1:]]
    a_wins = sum(a > b for a, b in rounds)
    b_wins = sum(a < b for a, b in rounds)
    ties = len(rounds) - a_wins - b_wins
    a_score, b_score = a_wins * 3 + ties, b_wins * 3 + ties
    winner = 'A' if a_wins > b_wins else 'B' if a_wins < b_wins else 'DRAW'
    return f'{a_score} {b_score}\n{winner}'


add(174, "紙牌逐輪勝負", "Easy", "M-7", ["多分支", "累加", "簡單模擬"],
    ["依兩個點數的大小分配積分", "由累計積分判斷總勝負"], ["迴圈", "比較運算", "累加器"],
    ("按照每輪紙牌點數計算兩位玩家的總積分。", "每輪 A 與 B 各出一張牌，只比較數字大小。點數大者得 3 分、小者得 0 分；點數相同則各得 1 分。所有回合結束後，總積分較高者獲勝，積分相同則平手。"),
    "第一行為回合數 N。接著 N 行，每行依序給 A、B 的紙牌點數。",
    "第一行依序輸出 A、B 的總積分，以一個空白分隔。第二行輸出勝者 <code>A</code> 或 <code>B</code>，平手輸出 <code>DRAW</code>。",
    ["1 ≤ N ≤ 100", "每張牌點數為 1 至 13 的整數，可重複出現"],
    "平手回合要同時增加兩位玩家的積分。",
    '''
    # 思路：逐輪比較並累加雙方積分，最後比較總分；時間 O(N)，額外空間 O(1)。
    n = int(input())
    score_a = score_b = 0
    for _ in range(n):
        a, b = map(int, input().split())
        if a > b:
            score_a += 3
        elif a < b:
            score_b += 3
        else:
            score_a += 1
            score_b += 1
    print(score_a, score_b)
    if score_a > score_b:
        print('A')
    elif score_a < score_b:
        print('B')
    else:
        print('DRAW')
    ''', oracle174,
    [card_rounds([(5, 3), (2, 7), (9, 9)]), card_rounds([(13, 1)]), card_rounds([(1, 13)]), card_rounds([(13, 1)] * 100), card_rounds([(1, 13)] * 100), card_rounds([(13, 13)] * 100), card_rounds([(1, 1)]), card_rounds([(5, 5), (6, 6), (7, 7)]), card_rounds([(2, 1), (1, 2), (3, 1)]), card_rounds([(1, 2), (2, 1), (1, 3)]), card_rounds([(1, 13), (13, 1)] * 50), card_rounds([(1, 1)] * 99 + [(2, 1)]), card_rounds([(13, 13)] * 99 + [(12, 13)])],
    [card_rounds([(RNG.randint(1, 13), RNG.randint(1, 13)) for _ in range(RNG.randint(1, 30))]) for _ in range(60)])


def stock(initial, changes):
    return records([len(initial), len(changes)], [initial, *changes])


def oracle175(s):
    rows = [list(map(int, row.split())) for row in s.splitlines()]
    quantities = {i + 1: value for i, value in enumerate(rows[1])}
    refused = 0
    for code, delta in rows[2:]:
        # 以可供取出的實體單位數檢查；失敗的整筆紀錄不影響下一筆。
        required = max(0, -delta)
        if required > quantities[code]:
            refused += 1
        else:
            quantities[code] += delta
    return ' '.join(str(quantities[i]) for i in range(1, rows[0][0] + 1)) + '\n' + str(refused)


add(175, "多商品庫存紀錄", "Medium", "M-7", ["清單", "索引更新", "簡單模擬"],
    ["依商品編號更新對應清單位置", "保留庫存不足時的原狀態"], ["清單索引", "正負數", "迴圈與分支"],
    ("依序處理多種商品的進出貨，回報最終庫存。", "商品編號為 1 至 M。每筆紀錄包含商品編號 p 與變動量 d：d 為正數表示補貨，負數表示出貨，0 表示不變。若整筆出貨會讓該商品庫存小於 0，整筆拒絕且庫存不變。補貨沒有容量上限；拒絕後仍繼續處理其餘紀錄。"),
    "第一行為商品種類 M 與紀錄數 N。第二行為依編號排列的 M 個初始庫存。接著 N 行各為 <code>p d</code>。",
    "第一行依商品編號順序輸出最終庫存，以一個空白分隔。第二行輸出遭拒絕的紀錄數。",
    ["1 ≤ M ≤ 20，1 ≤ N ≤ 100", "0 ≤ 每種商品初始庫存 ≤ 1000", "1 ≤ p ≤ M", "-1000 ≤ d ≤ 1000"],
    "先計算這筆操作後的候選庫存，再決定是否寫回清單。",
    '''
    # 思路：依編號計算新庫存，非負才寫回，否則累計拒絕數；時間 O(M + N)，空間 O(M)。
    m, n = map(int, input().split())
    quantities = list(map(int, input().split()))
    rejected = 0
    for _ in range(n):
        product, delta = map(int, input().split())
        index = product - 1
        updated = quantities[index] + delta
        if updated < 0:
            rejected += 1
        else:
            quantities[index] = updated
    print(*quantities)
    print(rejected)
    ''', oracle175,
    [stock([3, 5], [(1, -4), (2, -5), (1, 2)]), stock([0], [(1, 0)]), stock([2], [(1, -2)]), stock([1000] * 20, [(20, 1000)] * 100), stock([0] * 20, [(1, -1000)] * 100), stock([0], [(1, 1000), (1, -1000)] * 50), stock([1000], [(1, -1000)]), stock([0] * 20, [(20, 1), (1, 2)]), stock([5, 5], [(1, -6), (2, -4), (1, -5)]), stock([0, 0], [(1, -1), (1, 1), (1, -1)]), stock([1000], [(1, 1000)]), stock([1] * 20, [(i, -1) for i in range(1, 21)]), stock([1, 2, 3], [(2, 0), (3, -3), (1, -2)])],
    [stock([RNG.randrange(11) for _ in range(m)], [(RNG.randint(1, m), RNG.randint(-10, 10)) for _ in range(RNG.randint(1, 25))]) for m in [RNG.randint(1, 10) for _ in range(60)]])


def elevator(highest, start, commands):
    return records([highest, start, len(commands)], commands)


def oracle176(s):
    rows = s.splitlines()
    highest, floor, _ = map(int, rows[0].split())
    accepted_positions = [floor]
    rejected = 0
    for row in rows[1:]:
        direction, steps = row.split()
        path = [floor + offset * (1 if direction == 'U' else -1) for offset in range(1, int(steps) + 1)]
        if any(p < 1 or p > highest for p in path):
            rejected += 1
        elif path:
            floor = path[-1]
            accepted_positions.append(floor)
    distance = sum(abs(a - b) for a, b in zip(accepted_positions, accepted_positions[1:]))
    return f'{floor} {distance} {rejected}'


add(176, "有邊界的電梯移動", "Medium", "M-7", ["簡單模擬", "邊界判斷", "累加"],
    ["根據方向提出新位置並檢查合法範圍", "只累計成功移動的距離"], ["條件分支", "變數更新", "累加器"],
    ("模擬電梯指令，計算終點、總移動樓層與拒絕次數。", "建築只有 1 至 F 樓，沒有地下樓。<code>U k</code> 表示向上 k 層，<code>D k</code> 表示向下 k 層。若目的樓層超出範圍，整道指令拒絕，電梯不動；不可只移動到邊界。移動 0 層是成功指令，距離增加 0。"),
    "第一行為最高樓層 F、起始樓層 S、指令數 N。接著 N 行各為方向字母與非負整數 k。",
    "依序輸出最後樓層、成功移動的總樓層數、拒絕次數，三數間以一個空白分隔。",
    ["1 ≤ F ≤ 50", "1 ≤ S ≤ F", "1 ≤ N ≤ 100", "0 ≤ k ≤ 50，方向只會是 U 或 D"],
    "判斷目的樓層是否合法後，才能同時更新目前樓層與總距離。",
    '''
    # 思路：先算目的樓層，合法時更新位置與距離，否則計次；時間 O(N)，額外空間 O(1)。
    highest, floor, n = map(int, input().split())
    total = rejected = 0
    for _ in range(n):
        direction, steps = input().split()
        steps = int(steps)
        destination = floor + steps if direction == 'U' else floor - steps
        if 1 <= destination <= highest:
            floor = destination
            total += steps
        else:
            rejected += 1
    print(floor, total, rejected)
    ''', oracle176,
    [elevator(10, 3, [('U', 4), ('D', 7), ('D', 6)]), elevator(1, 1, [('U', 0)]), elevator(5, 5, [('U', 1), ('D', 4)]), elevator(50, 1, [('U', 49), ('D', 49)] * 50), elevator(1, 1, [('U', 50)] * 100), elevator(50, 50, [('D', 50)] * 100), elevator(50, 1, [('U', 50)]), elevator(50, 50, [('D', 49)]), elevator(1, 1, [('D', 0)] * 100), elevator(2, 1, [('U', 1), ('D', 1)]), elevator(10, 5, [('U', 6), ('D', 4), ('D', 1)]), elevator(10, 5, [('D', 5), ('U', 5), ('U', 1)]), elevator(50, 25, [('U', 25), ('D', 49), ('U', 24)])],
    [elevator(f, RNG.randint(1, f), [(RNG.choice('UD'), RNG.randrange(16)) for _ in range(RNG.randint(1, 25))]) for f in [RNG.randint(1, 15) for _ in range(60)]])


def oracle177(s):
    date = datetime.date.fromisoformat(s.strip())
    return (date + datetime.timedelta(days=1)).isoformat()


add(177, "日期往後一天", "Medium", "M-8", ["日期", "多分支", "閏年"],
    ["依月份與閏年決定當月天數", "處理月底與年底的進位"], ["整除判斷", "清單索引", "條件分支"],
    ("輸出指定有效日期的下一天。", "使用西元日曆。年份能被 400 整除，或能被 4 整除但不能被 100 整除，便是閏年。閏年 2 月有 29 天，其餘年 2 月有 28 天；4、6、9、11 月有 30 天，其餘月份有 31 天。輸入保證是有效日期。"),
    "一行日期，格式為 <code>YYYY-MM-DD</code>，年固定四位，月與日固定兩位。",
    "以相同的 <code>YYYY-MM-DD</code> 格式輸出下一天。",
    ["1900 ≤ 輸入年份 ≤ 2100", "輸入為上述年份內的有效日期；結果可能為 2101-01-01"],
    "先找出當月天數，再依序處理日期與月份的進位。",
    '''
    # 思路：建立每月天數並調整閏年二月，再處理日、月進位；時間 O(1)，額外空間 O(1)。
    year, month, day = map(int, input().split('-'))
    days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    if year % 400 == 0 or (year % 4 == 0 and year % 100 != 0):
        days[1] = 29
    day += 1
    if day > days[month - 1]:
        day = 1
        month += 1
        if month > 12:
            month = 1
            year += 1
    print(f'{year:04}-{month:02}-{day:02}')
    ''', oracle177,
    ['2024-02-28', '2023-12-31', '2026-09-21', '1900-01-01', '2100-12-31', '1900-02-28', '2000-02-28', '2000-02-29', '2100-02-28', '2024-02-29', '2023-02-28', '2023-04-30', '2023-06-30', '2023-09-30', '2023-11-30', '2023-01-31', '2023-07-31', '2023-08-31', '1999-12-31'],
    [(datetime.date(1900, 1, 1) + datetime.timedelta(days=RNG.randrange((datetime.date(2101, 1, 1) - datetime.date(1900, 1, 1)).days))).isoformat() for _ in range(100)])


def oracle178(s):
    distances = list(map(int, s.split()))[1:]
    marginal = [20, 10, 10, 10, 10, 5, 5, 5, 5, 5]
    fares = [sum(marginal[i] for i in range(10) if d > i * 1000) for d in distances]
    return '\n'.join(map(str, fares)) + '\nTOTAL ' + str(sum(fares))


add(178, "多段里程車資", "Medium", "M-7", ["分段計費", "無條件進位", "累加"],
    ["將不足一公里的里程無條件進位", "依級距計算每段費用並累加"], ["整除與餘數", "多分支", "迴圈"],
    ("按照指定計費規則，計算各段車資與總費用。", "每段里程獨立計費，不能先合併距離。0 公尺費用為 0；超過 0 且不超過 1000 公尺收 20 元。第 2 至第 5 公里，每開始一公里加 10 元；第 6 公里起，每開始一公里加 5 元。例如 1001 公尺為 30 元，5000 公尺為 60 元，5001 公尺為 65 元。這是本題自訂的計費規則。"),
    "第一行為路段數 N。第二行包含 N 個非負整數距離，單位為公尺，以空白分隔。",
    "先依序輸出 N 行各段車資，每行一個整數。最後一行輸出 <code>TOTAL S</code>，S 為總車資，TOTAL 與 S 之間有一個空白。",
    ["1 ≤ N ≤ 100", "0 ≤ 每段距離 ≤ 10000，皆為整數"],
    "先把每段公尺數換成「已開始的公里數」，再判斷落在哪個級距。",
    '''
    # 思路：先用整除計算進位公里數，再分級距算車資；時間 O(N)，空間 O(N)（輸入清單）。
    n = int(input())
    distances = list(map(int, input().split()))
    total = 0
    for distance in distances:
        kilometers = (distance + 999) // 1000
        if kilometers == 0:
            fare = 0
        elif kilometers <= 5:
            fare = 20 + (kilometers - 1) * 10
        else:
            fare = 60 + (kilometers - 5) * 5
        print(fare)
        total += fare
    print('TOTAL', total)
    ''', oracle178,
    [seq([1000, 1001, 5001]), seq([0]), seq([5000, 10000]), seq([10000] * 100), seq([0] * 100), seq([1]), seq([999, 1000, 1001]), seq([4999, 5000, 5001]), seq([5999, 6000, 6001]), seq([1000, 1000]), seq([2000]), seq([9999, 10000]), seq(list(range(0, 10001, 1000))), seq([1] * 100)],
    [seq([RNG.randrange(10001) for _ in range(RNG.randint(1, 30))]) for _ in range(60)])


def run_solution(source, data):
    old_stdin = sys.stdin
    output = io.StringIO()
    try:
        sys.stdin = io.StringIO(data)
        with contextlib.redirect_stdout(output):
            exec(compile(source, '<reference-solution>', 'exec'), {'__name__': '__main__'})
    finally:
        sys.stdin = old_stdin
    return output.getvalue().rstrip()


MANUAL_FIRST_SAMPLE = {
    154: '50', 155: '0 09:03:30', 156: '4 0 7', 157: '1 1 1', 158: '26 2', 159: '6 1',
    160: 'GREEN\nGREEN\nRED\nRED\nGREEN', 161: 'YES\nNO\nNO', 162: '3',
    163: 'a3 b2 c1 a2', 164: 'AAABBA', 165: 'amy 85 1\nbo 40 0',
    166: '0 2 0 2 0 0 0 0 0 1\n1', 167: '4 3', 168: '2', 169: '1\n1 2',
    170: '2', 171: '1 12\n2 6\n3 4', 172: '#####\n#...#\n#...#\n#####',
    173: '2\n1 3', 174: '4 4\nDRAW', 175: '5 0\n1', 176: '1 10 1',
    177: '2024-02-29', 178: '20\n30\n65\nTOTAL 115',
}


class BalancedHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        assert tag in {'p', 'code', 'ul', 'li'}, tag
        self.stack.append(tag)

    def handle_endtag(self, tag):
        assert self.stack and self.stack.pop() == tag, tag


def validate_input(pid, data):
    """限制檢查獨立於 oracle／solution；套用正式與隨機輸入。"""
    rows = data.splitlines()
    values = data.split()
    if pid == 154:
        assert len(values) == 2
        assert all(re.fullmatch(r'(?:[01][0-9]|2[0-3]):[0-5][0-9]', v) for v in values)
    elif pid == 155:
        start, n = rows[0].split()
        assert re.fullmatch(r'(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]', start)
        assert 1 <= int(n) <= 100 and len(rows) == int(n) + 1
        assert all(re.fullmatch(r'(?:[0-9]|[1-5][0-9]):[0-5][0-9]', row) for row in rows[1:])
    elif pid == 156:
        x, y, n = map(int, rows[0].split())
        assert -1000 <= x <= 1000 and -1000 <= y <= 1000
        assert 1 <= n <= 100 and len(rows) == n + 1
        assert all(d in 'NSEW' and len(d) == 1 and 0 <= int(a) <= 1000 for d, a in (r.split() for r in rows[1:]))
    elif pid == 157:
        x1, y1, x2, y2, n = map(int, rows[0].split())
        assert -1000 <= x1 < x2 <= 1000 and -1000 <= y1 < y2 <= 1000
        assert 1 <= n <= 100 and len(rows) == n + 1
        assert all(len(r.split()) == 2 and all(-1000 <= int(v) <= 1000 for v in r.split()) for r in rows[1:])
    elif pid in {158, 166, 168, 178}:
        n, *a = map(int, values)
        lo, hi = {158: (1, 6), 166: (0, 9), 168: (-100, 100), 178: (0, 10000)}[pid]
        assert 1 <= n <= 100 and len(rows) == 2 and len(a) == n
        assert all(lo <= v <= hi for v in a)
    elif pid == 159:
        capacity, initial, n = map(int, rows[0].split())
        assert 1 <= capacity <= 1000 and 0 <= initial <= capacity
        assert 1 <= n <= 100 and len(rows) == n + 1
        assert all(op in {'F', 'D'} and 0 <= int(a) <= 1000 for op, a in (r.split() for r in rows[1:]))
    elif pid == 160:
        g, r, q, *ts = map(int, values)
        assert 1 <= g <= 60 and 1 <= r <= 60 and 1 <= q <= 100
        assert len(rows) == 2 and len(ts) == q and all(0 <= t <= 10000 for t in ts)
    elif pid == 161:
        n = int(rows[0])
        assert 1 <= n <= 30 and len(rows) == n + 1
        assert all(re.fullmatch(r'[A-Za-z0-9_]{1,100}', row) for row in rows[1:])
    elif pid in {162, 163}:
        pattern = r'[0-9]{1,100}' if pid == 162 else r'[a-z]{1,1000}'
        assert re.fullmatch(pattern, data)
    elif pid == 164:
        groups = re.findall(r'([A-Z])([1-9][0-9]*)', data)
        assert 1 <= len(groups) <= 100 and encoded(groups) == data
        assert all(1 <= int(count) <= 20 for _, count in groups)
    elif pid == 165:
        n, k = map(int, rows[0].split())
        assert 1 <= n <= 100 and 1 <= k <= 20 and len(rows) == n + 1
        for row in rows[1:]:
            name, *marks = row.split(';')
            assert re.fullmatch(r'[a-z]{1,10}', name) and len(marks) == k
            assert all(v == '-' or (str(int(v)) == v and 0 <= int(v) <= 100) for v in marks)
    elif pid == 167:
        n, target, *a = map(int, values)
        assert 1 <= n <= 100 and -1000 <= target <= 1000
        assert len(rows) == 2 and len(a) == n and all(-1000 <= v <= 1000 for v in a)
    elif pid == 169:
        m, n, *votes = map(int, values)
        assert 1 <= m <= 20 and 1 <= n <= 100
        assert len(rows) == 2 and len(votes) == n and all(0 <= v <= m for v in votes)
    elif pid == 170:
        n, limit = map(int, rows[0].split())
        assert 2 <= n <= 60 and 0 <= limit <= 100 and len(rows) == n + 1
        assert all(1 <= int(g) <= 10 and 1 <= int(a) <= 100 for g, a in (r.split() for r in rows[1:]))
    elif pid == 171:
        assert len(values) == 1 and 1 <= int(data) <= 10000
    elif pid == 172:
        assert len(values) == 2 and all(1 <= int(v) <= 30 for v in values)
    elif pid == 173:
        n, d = map(int, rows[0].split())
        assert 1 <= n <= 50 and 1 <= d <= 30 and len(rows) == n + 1
        assert all(len(row) == d and set(row) <= {'0', '1'} for row in rows[1:])
    elif pid == 174:
        n = int(rows[0])
        assert 1 <= n <= 100 and len(rows) == n + 1
        assert all(len(r.split()) == 2 and all(1 <= int(v) <= 13 for v in r.split()) for r in rows[1:])
    elif pid == 175:
        m, n = map(int, rows[0].split())
        assert 1 <= m <= 20 and 1 <= n <= 100 and len(rows) == n + 2
        initial = list(map(int, rows[1].split()))
        assert len(initial) == m and all(0 <= v <= 1000 for v in initial)
        assert all(1 <= int(p) <= m and -1000 <= int(d) <= 1000 for p, d in (r.split() for r in rows[2:]))
    elif pid == 176:
        f, start, n = map(int, rows[0].split())
        assert 1 <= start <= f <= 50 and 1 <= n <= 100 and len(rows) == n + 1
        assert all(op in {'U', 'D'} and 0 <= int(k) <= 50 for op, k in (r.split() for r in rows[1:]))
    elif pid == 177:
        assert re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', data)
        date = datetime.date.fromisoformat(data)
        assert 1900 <= date.year <= 2100
    else:
        raise AssertionError(f'No constraint validation for {pid}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    total = random_total = 0
    for problem, source, oracle, fuzz in RECORDS:
        pid = problem['id']
        if args.write:
            (ROOT / 'problems' / f'{pid:03}.json').write_text(json.dumps(problem, ensure_ascii=False, indent=2) + '\n')
            (ROOT / 'solutions' / f'{pid:03}.py').write_text(source)
        disk = json.loads((ROOT / 'problems' / f'{pid:03}.json').read_text())
        actual_source = (ROOT / 'solutions' / f'{pid:03}.py').read_text()
        assert disk == problem, f'{pid}: JSON differs from reproducible specification'
        assert len(disk['samples']) == 3
        assert len({t['input'] for t in disk['testCases']}) == len(disk['testCases'])
        assert len(disk['testCases']) - len(disk['samples']) >= 8
        assert all(sample in disk['testCases'] for sample in disk['samples'])
        assert disk['sampleOutput'] == MANUAL_FIRST_SAMPLE[pid], f'{pid}: hand-calculated sample disagrees'
        assert disk['stage'] == 'Intermediate' and disk['apcsLevel'] is None
        assert disk['audienceLevel'] in {'M-7', 'M-8'}
        assert disk['difficulty'] in {'Easy', 'Medium', 'Hard'}
        assert disk['sampleInput'] == disk['samples'][0]['input']
        for field in ['description', 'hint', 'inputFormat', 'outputFormat', 'constraints']:
            html = BalancedHTML()
            html.feed(disk[field])
            assert not html.stack, (pid, field, html.stack)
        for test in disk['testCases']:
            validate_input(pid, test['input'])
            result = run_solution(actual_source, test['input'])
            assert result == test['output'], (pid, test['input'], result, test['output'])
            total += 1
        for data in fuzz:
            validate_input(pid, data)
            result = run_solution(actual_source, data)
            expected = str(oracle(data)).rstrip()
            assert result == expected, (pid, data, result, expected)
            random_total += 1
        print(f'{pid} PASS: {len(disk["testCases"])} fixed, {len(fuzz)} random')
    print(f'PASS: {len(RECORDS)} problems, {total} fixed tests, {random_total} independent-oracle random checks')


if __name__ == '__main__':
    main()
