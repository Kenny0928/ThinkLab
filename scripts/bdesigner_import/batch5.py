#!/usr/bin/env python3
"""bDesigner 匯入第 5 批：花蓮縣國小／國中、屏東中小學、114 全國賽國中組與國小組程式題（283–298）。

全國賽國小組 97–101 為看圖作答的紙筆測驗（多小題、無標準輸入輸出），不轉為 Judge 題。
"""
from fractions import Fraction
import itertools
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add, lines, main  # noqa: E402

R = random.Random(20261122)
HL_E = ["114/114年花蓮縣國小"]
HL_M = ["114/114年花蓮縣國中"]
PT = ["114/114年屏東中小學"]
NAT_M = ["114/114年度全國賽個人賽國中組題目"]
NAT_E = ["114/114年度全國賽個人賽國小組題目"]


def ints(s):
    return list(map(int, s.split()))


# 283 零用錢是否足夠 -------------------------------------------------------
def o283(s):
    t = ints(s)
    money = t[0]
    for day, cost in enumerate(t[1:5], 1):
        money -= cost
        if money < 0:
            return f"第{day}天不夠用"
    return "錢剛好或有剩"


add(283, "零用錢是否足夠", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["迴圈", "條件判斷", "提前結束"],
    objectives=["依序扣除每天的花費", "在第一次不足時立即輸出並停止"],
    prerequisites=["迴圈", "if", "break"],
    lead="依序扣除 4 天的花費，判斷零用錢在哪一天不夠用。",
    body="從零用錢總額開始，依序扣除第 1 到第 4 天的花費。若某天扣除後剩餘金額小於 0，立即輸出 <code>第X天不夠用</code>（X 為該天）；若 4 天都能扣完，輸出 <code>錢剛好或有剩</code>。",
    input_format="第一行為零用錢總額。第二行有 4 個以空白分隔的整數，依序為第 1～4 天的花費。",
    output_format="輸出 <code>第X天不夠用</code> 或 <code>錢剛好或有剩</code>，沒有空白。",
    constraints=["0 ≤ 零用錢 ≤ 10000", "0 ≤ 每天花費 ≤ 10000"],
    hint="剩餘金額剛好等於 0 時仍然夠用。",
    solution='''
    # 思路：逐日扣款，第一次小於 0 時輸出天數並結束；全部扣完才輸出夠用。
    # 積木對照：讀入金額與清單 → 對第 1～4 天：金額減去花費 → 如果 < 0，說出第幾天不夠用並停止 → 迴圈結束後說出錢剛好或有剩。
    money = int(input())
    costs = list(map(int, input().split()))
    for day in range(4):
        money -= costs[day]
        if money < 0:
            print(f"第{day + 1}天不夠用")
            break
    else:
        print("錢剛好或有剩")
    ''', oracle=o283,
    cases=["100\n20 30 40 20", "100\n10 20 30 40", "5\n6 10 10 10", "100\n25 25 25 25", "0\n0 0 0 0", "0\n0 0 0 1",
           "10000\n10000 0 0 0", "10\n3 3 3 2", "10\n3 3 3 1", "50\n10 50 0 0", "7\n0 0 8 0"],
    fuzz=[lines(R.randint(0, 200), [R.randint(0, 80) for _ in range(4)]) for _ in range(100)],
    source_ids=[82], source_title="零用錢是否足夠", categories=HL_E,
    source_checks=[("5\n6 10 10 10", "第1天不夠用"), ("100\n25 25 25 25", "錢剛好或有剩"), ("100\n20 30 40 20", "第4天不夠用"),
                   ("100\n10 20 30 40", "錢剛好或有剩")],
    adaptation="整理輸入格式，補上剩餘剛好為 0 與第 2、3 天不足的測資。")


# 284 機器人戰鬥力比對 -----------------------------------------------------
def o284(s):
    p = ints(s)[1:]
    return " ".join(str(sorted(p).index(x)) for x in p)


add(284, "機器人戰鬥力比對", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["巢狀迴圈", "比較", "計數"],
    objectives=["用兩層迴圈讓每個元素與其他所有元素比較", "依嚴格大於的條件計分"],
    prerequisites=["巢狀迴圈", "清單"],
    lead="循環賽中每隻機器人與其他所有機器人比較戰鬥力，計算各自的積分。",
    body="每隻機器人與其他每一隻比較一次：自己的戰鬥力較高得 1 分，較低或平手得 0 分。請依輸入順序輸出每隻機器人的總積分。",
    input_format="第一行為機器人數量 N。第二行有 N 個以空白分隔的整數，代表每隻機器人的戰鬥力。",
    output_format="輸出一行 N 個整數，以一個空白分隔。",
    constraints=["1 ≤ N ≤ 100", "0 ≤ 戰鬥力 ≤ 1000"],
    hint="第 i 隻的積分就是「戰鬥力比它低的機器人數量」。",
    solution='''
    # 思路：對每一隻機器人，數出戰鬥力嚴格小於它的機器人數量。
    n = int(input())
    power = list(map(int, input().split()))
    scores = []
    for i in range(n):
        score = 0
        for j in range(n):
            if power[i] > power[j]:
                score += 1
        scores.append(str(score))
    print(" ".join(scores))
    ''', oracle=o284,
    cases=["3\n10 50 30", "3\n10 20 30", "5\n5 5 5 5 5", "1\n99", "2\n1 2", "2\n2 2", "4\n4 3 2 1", "5\n7 3 7 1 3",
           "6\n0 1000 500 500 0 1", "4\n9 9 8 10"],
    fuzz=[lines(n := R.randint(1, 15), [R.randint(0, 10) for _ in range(n)]) for _ in range(100)],
    source_ids=[83], source_title="機器人戰鬥力比對", categories=HL_E,
    source_checks=[("5\n5 5 5 5 5", "0 0 0 0 0"), ("1\n99", "0"), ("3\n10 50 30", "0 2 1"), ("3\n10 20 30", "0 1 2")],
    adaptation="整理輸出格式為單行，補上平手與相同戰鬥力多隻的測資。")


# 285 字串內的秘密數字 -----------------------------------------------------
def o285(s):
    return sum(int(c) for c in s.strip() if c.isdigit())


def g285():
    return "".join(R.choice("abcXYZ0123456789!?") for _ in range(R.randint(1, 20)))


add(285, "字串內的秘密數字", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["字串", "累加", "條件判斷"],
    objectives=["逐字檢查字串中的字元", "判斷字元是否為數字並轉成整數相加"],
    prerequisites=["字串走訪", "isdigit 或比較字元"],
    lead="把字串中所有數字字元當作個位數加總。",
    body="輸入一個包含英文字母、數字與符號的字串。請把其中每個數字字元（0～9）視為個位數相加（例如 <code>12</code> 代表 1 加 2），忽略其他字元，輸出總和。沒有數字時輸出 0。",
    input_format="一行一個不含空白的字串。",
    output_format="輸出一個整數，代表數字的總和。",
    constraints=["1 ≤ 字串長度 ≤ 100"],
    hint="字元 c 是數字時，int(c) 可以把它變成整數。",
    solution='''
    # 思路：走訪每個字元，是數字就轉成整數加入總和。
    # 積木對照：總和設為 0 → 對字串的每個字：如果是 0～9，總和加上它 → 說出總和。
    text = input().strip()
    total = 0
    for ch in text:
        if "0" <= ch <= "9":
            total += int(ch)
    print(total)
    ''', oracle=o285,
    cases=["A1B2C3", "Key5Word2", "Agent007", "12345", "abc", "0", "9999999999", "a!b@c#9", "X0Y0Z0", "1a2b3c4d5e6f7g8h9i"],
    fuzz=[g285() for _ in range(100)],
    source_ids=[84], source_title="字串內的秘密數字", categories=HL_E,
    source_checks=[("Agent007", "7"), ("12345", "15"), ("A1B2C3", "6"), ("Key5Word2", "7")],
    adaptation="把「讓角色說出」改為標準輸出，補上沒有數字與含符號的測資。")


# 286 最佳派對地點 ---------------------------------------------------------
def o286(s):
    xs = ints(s)[1:]
    best = min((sum(abs(x - h) for x in xs), h) for h in xs)
    return f"{best[1]} {best[0]}"


add(286, "最佳派對地點", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["枚舉", "絕對值", "最小值"],
    objectives=["枚舉每個候選地點並計算距離總和", "用絕對值計算一維距離並處理並列"],
    prerequisites=["巢狀迴圈", "abs", "最小值"],
    lead="在朋友的家中選出讓所有人距離總和最小的派對地點。",
    body="N 個朋友住在同一條直線上，每家有一個整數座標。派對必須選在其中一人的家，請找出讓所有人走到派對地點的距離總和最小的地點。兩點距離為座標差的絕對值。若有多個地點總和一樣小，選座標較小的。",
    input_format="第一行為朋友數 N。第二行有 N 個以空白分隔的整數座標。",
    output_format="輸出兩個以空白分隔的整數：最佳地點的座標與最小距離總和。",
    constraints=["1 ≤ N ≤ 100", "−1000 ≤ 座標 ≤ 1000"],
    hint="試試每一家當派對地點，各算一次距離總和。",
    solution='''
    # 思路：以每一家為候選點計算距離總和；總和較小，或總和相同但座標較小時更新答案。
    n = int(input())
    homes = list(map(int, input().split()))
    best_place = None
    best_total = None
    for place in homes:
        total = 0
        for h in homes:
            total += abs(h - place)
        if best_total is None or total < best_total or (total == best_total and place < best_place):
            best_place, best_total = place, total
    print(best_place, best_total)
    ''', oracle=o286,
    cases=["3\n2 10 5", "3\n1 9 3", "5\n10 20 30 40 50", "1\n7", "2\n5 1", "2\n-3 -3", "4\n1 2 3 4", "4\n8 -2 6 0",
           "5\n-1000 1000 0 0 1", "6\n3 3 3 9 9 9"],
    fuzz=[lines(n := R.randint(1, 12), [R.randint(-50, 50) for _ in range(n)]) for _ in range(100)],
    source_ids=[85], source_title="最佳派對地點", categories=HL_E,
    source_checks=[("3\n1 9 3", "3 8"), ("5\n10 20 30 40 50", "30 60"), ("3\n2 10 5", "5 8")],
    adaptation="把積木提示改為通用說明，補上偶數人數並列、負座標與重複座標的測資。")


# 287 公車時刻表 -----------------------------------------------------------
def o287(s):
    h, m, gap = ints(s)
    now = h * 60 + m
    bus = 360
    while bus < now:
        bus += gap
    return bus - now


add(287, "公車時刻表", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["時間換算", "取餘數", "條件判斷"],
    objectives=["把時與分換成從午夜起算的分鐘數", "用餘數算出距離下一班車的時間"],
    prerequisites=["整數運算", "取餘數", "if/else"],
    lead="計算小明最少還要等幾分鐘才有下一班公車。",
    body="首班車早上 06:00 發車，之後每隔 M 分鐘一班。小明在 H 點 S 分到站，請輸出他最少還要等幾分鐘；剛好有車時輸出 0。若小明在 06:00 以前到站，就要等到首班車。",
    input_format="一行三個以空白分隔的整數 H、S、M。",
    output_format="輸出一個整數，代表等待分鐘數。",
    constraints=["0 ≤ H ≤ 23", "0 ≤ S ≤ 59", "1 ≤ M ≤ 120"],
    hint="06:00 以後，到站時間距首班車經過 d 分鐘，等待時間是 (M − d % M) % M。",
    solution='''
    # 思路：換成分鐘數；6 點前等到 6 點，6 點後用餘數求距下一班的時間。
    h, s, m = map(int, input().split())
    now = h * 60 + s
    if now <= 360:
        print(360 - now)
    else:
        passed = now - 360
        print((m - passed % m) % m)
    ''', oracle=o287,
    cases=["6 15 20", "5 50 20", "7 30 30", "7 5 15", "6 0 10", "0 0 1", "5 59 120", "6 1 1", "23 59 120", "23 59 7",
           "12 0 45", "6 0 120"],
    fuzz=[lines([R.randint(0, 23), R.randint(0, 59), R.randint(1, 120)]) for _ in range(200)],
    source_ids=[86], source_title="公車時刻表", categories=HL_M,
    source_checks=[("7 30 30", "0"), ("7 5 15", "10"), ("6 15 20", "5"), ("5 50 20", "10")],
    adaptation="依原站範例明定 06:00 前到站需等到首班車，並移除未定義的末班車限制。")


# 288 連續成績進步分析 -----------------------------------------------------
def o288(s):
    a = ints(s)[1:]
    best = 0
    for i in range(1, len(a)):
        k = 0
        while i + k < len(a) and a[i + k] > a[i + k - 1]:
            k += 1
        best = max(best, k)
    return best


add(288, "連續成績進步分析", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["連段", "前後比較", "最大值"],
    objectives=["比較相鄰兩天找出連續進步的段落", "在中斷時重設計數並追蹤最大值"],
    prerequisites=["清單索引", "迴圈", "max"],
    lead="找出成績連續進步的最長天數。",
    body="老師記錄了 N 天的測驗成績。從第 2 天起，若當天成績大於前一天，算一天「成績進步」；沒有比前一天高（含相同）就中斷連續進步。請輸出連續成績進步的最長天數（第 1 天不列入計算），若沒有任何進步則輸出 0。",
    input_format="第一行為天數 N。第二行有 N 個以空白分隔的整數成績。",
    output_format="輸出一個整數，代表最長連續進步天數。",
    constraints=["1 ≤ N ≤ 1000", "0 ≤ 成績 ≤ 100"],
    hint="用一個計數器：進步就加 1，否則歸零，每次都和最大值比較。",
    solution='''
    # 思路：計數器在進步時加一、未進步時歸零，並記錄過程中的最大值。
    n = int(input())
    scores = list(map(int, input().split()))
    run = best = 0
    for i in range(1, n):
        if scores[i] > scores[i - 1]:
            run += 1
            best = max(best, run)
        else:
            run = 0
    print(best)
    ''', oracle=o288,
    cases=["5\n60 65 70 68 72", "5\n50 60 55 56 57", "5\n100 90 80 80 70", "5\n60 60 60 60 60", "1\n50", "2\n1 2",
           "2\n2 1", "6\n1 2 3 4 5 6", "8\n5 6 6 7 8 9 1 2", "7\n10 20 10 20 30 40 30"],
    fuzz=[lines(n := R.randint(1, 15), [R.randint(0, 10) for _ in range(n)]) for _ in range(100)],
    source_ids=[87], source_title="連續成績進步分析", categories=HL_M,
    source_checks=[("5\n100 90 80 80 70", "0"), ("5\n60 60 60 60 60", "0"), ("5\n60 65 70 68 72", "2"),
                   ("5\n50 60 55 56 57", "2")],
    adaptation="補上輸入格式，明定成績相同視為中斷、沒有進步時輸出 0。")


# 289 卡住的鍵盤 -----------------------------------------------------------
def o289(s):
    text = s.strip()
    runs = [(len(list(g)), -i, k) for i, (k, g) in enumerate(itertools.groupby(text))]
    n, _, ch = max(runs)
    return f"{ch} {n}"


def g289():
    return "".join(R.choice("ABC") * R.randint(1, 4) for _ in range(R.randint(1, 8)))


add(289, "卡住的鍵盤", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["字串", "連段", "最大值"],
    objectives=["掃描字串並計算每段連續相同字元的長度", "以嚴格大於更新，保留最先出現的最長段"],
    prerequisites=["字串索引", "迴圈", "條件判斷"],
    lead="找出字串中連續出現最多次的字母與次數。",
    body="給一個由大寫英文字母組成的字串，找出連續出現次數最多的字母，輸出該字母與連續次數。若有多段一樣長，輸出最先出現的那一段的字母。",
    input_format="一行一個由大寫英文字母組成的字串。",
    output_format="輸出字母與次數，中間以一個空白分隔，例如 <code>W 12</code>。",
    constraints=["1 ≤ 字串長度 ≤ 1000"],
    hint="和前一個字元相同就把目前長度加 1，否則重新從 1 開始。",
    solution='''
    # 思路：掃描連續段長度；只有在嚴格大於最大值時更新，以保留最先出現者。
    text = input().strip()
    best_char, best_len = text[0], 1
    run = 1
    for i in range(1, len(text)):
        if text[i] == text[i - 1]:
            run += 1
        else:
            run = 1
        if run > best_len:
            best_char, best_len = text[i], run
    print(best_char, best_len)
    ''', oracle=o289,
    cases=["WWWWWWWWWWWWBBWW", "AAABCCCC", "RRRGGGBB", "ABCDEFG", "A", "ZZ", "ABBA", "BBAAA", "AAABBBAAAA", "QWQQWWW"],
    fuzz=[g289() for _ in range(150)],
    source_ids=[88], source_title="卡住的鍵盤", categories=HL_M,
    source_checks=[("RRRGGGBB", "R 3"), ("ABCDEFG", "A 1"), ("WWWWWWWWWWWWBBWW", "W 12"), ("AAABCCCC", "C 4")],
    adaptation="統一輸出為字母與次數之間有一個空白，補上同字母分成多段與並列的測資。")


# 290 外送員的接單策略 -----------------------------------------------------
def o290(s):
    t = ints(s)
    orders = [(t[1 + 2 * i], t[2 + 2 * i]) for i in range(t[0])]
    best = 0
    for mask in range(1 << len(orders)):
        chosen = sorted((orders[i] for i in range(len(orders)) if mask >> i & 1), key=lambda o: (o[1], o[0]))
        if all(a[1] <= b[0] for a, b in zip(chosen, chosen[1:])):
            best = max(best, len(chosen))
    return best


def g290():
    n = R.randint(1, 10)
    data = []
    for _ in range(n):
        a = R.randint(0, 20)
        data += [a, a + R.randint(0, 6)]
    return lines(n, data)


add(290, "外送員的接單策略", stage="Advanced", difficulty="Medium", audience="M-HS",
    tags=["貪心", "排序", "區間排程"],
    objectives=["理解「優先選最早結束的訂單」為何能使數量最多", "依結束時間排序後做區間選擇"],
    prerequisites=["sort 與 key", "tuple", "迴圈"],
    lead="在時間不衝突的情況下，求外送員最多能接幾張訂單。",
    body=["共有 N 張訂單，每張有開始時間與結束時間。外送員同一時間只能執行一張訂單；若一張的結束時間剛好等於另一張的開始時間，可以銜接，不算衝突。",
          "請輸出最多能接下的訂單數量（目標是張數最多，不是總時長最長）。輸入的訂單沒有排序。"],
    input_format="第一行為訂單數 N。第二行有 2N 個以空白分隔的整數，每兩個一組為一張訂單的開始與結束時間。",
    output_format="輸出一個整數，代表最多可接的訂單數。",
    constraints=["1 ≤ N ≤ 50", "0 ≤ 開始時間 ≤ 結束時間 ≤ 100"],
    hint="每次都選「結束時間最早、且不與已選訂單衝突」的訂單。",
    solution='''
    # 思路：依結束時間（相同時依開始時間）排序，能接就接；時間 O(N log N)。
    n = int(input())
    values = list(map(int, input().split()))
    orders = [(values[2 * i], values[2 * i + 1]) for i in range(n)]
    orders.sort(key=lambda o: (o[1], o[0]))
    count = 0
    free_at = -1
    for start, end in orders:
        if start >= free_at:
            count += 1
            free_at = end
    print(count)
    ''', oracle=o290,
    cases=["4\n1 3 2 4 3 5 5 7", "3\n1 10 10 20 20 30", "3\n1 10 2 3 4 5", "3\n20 30 0 10 10 20", "1\n0 0", "1\n0 100",
           "3\n3 3 1 3 3 5", "4\n0 10 1 2 2 3 3 4", "5\n1 4 3 5 0 6 5 7 8 9", "4\n5 6 5 6 5 6 5 6", "6\n0 2 1 3 2 4 3 5 4 6 5 7"],
    fuzz=[g290() for _ in range(150)],
    source_ids=[89], source_title="外送員的接單策略", categories=HL_M,
    source_checks=[("3\n1 10 2 3 4 5", "2"), ("3\n20 30 0 10 10 20", "3"), ("4\n1 3 2 4 3 5 5 7", "3"),
                   ("3\n1 10 10 20 20 30", "3")],
    adaptation="依原站資料採單行輸入所有時間；oracle 以枚舉所有子集驗證貪心解，並涵蓋開始等於結束的零長度訂單。")


# 291 小島越野賽 -----------------------------------------------------------
def o291(s):
    h = ints(s)[1:]
    n = len(h)
    best = [0] + [None] * (n - 1)

    def moves(i):
        if i + 1 < n:
            d = h[i + 1] - h[i]
            yield i + 1, 1 if abs(d) <= 1 else 3 if d >= 2 else 1
        if i + 2 < n and h[i + 1] == h[i] == h[i + 2]:
            yield i + 2, 1
        if i + 2 < n and h[i + 1] < h[i] == h[i + 2]:
            yield i + 2, 2

    for i in range(n):
        for j, c in moves(i):
            if best[j] is None or best[i] + c < best[j]:
                best[j] = best[i] + c
    return best[-1]


def g291():
    n = R.randint(1, 12)
    return lines(n, [R.randint(1, 5) for _ in range(n)])


add(291, "小島越野賽", stage="Advanced", difficulty="Easy", audience="M-8",
    tags=["動態規劃", "最短路徑", "條件判斷"],
    objectives=["依位置記錄到達該格的最少時間", "由每一格嘗試所有合法走法並更新後面的格子"],
    prerequisites=["清單", "迴圈", "if 條件"],
    lead="依地形選擇走法，求機器人從第 1 格到最後一格的最少秒數。",
    body=["一條路由 N 格組成，每格有一個高度。機器人站在第 1 格，要走到第 N 格。設目前高度為 h，可用的走法有：",
          "平地衝刺（1 秒）：前方第 1、2 格都與 h 一樣高時，直接到前方第 2 格。爬小階梯（1 秒）：前方第 1 格與 h 的高度差在 1 以內時，前進 1 格。動力大跳躍（3 秒）：前方第 1 格比 h 高 2 或以上時，前進 1 格。跨越坑洞（2 秒）：前方第 1 格比 h 矮、且前方第 2 格與 h 一樣高時，直接到前方第 2 格。深谷急降（1 秒）：前方第 1 格比 h 低 2 或以上時，前進 1 格。請輸出到達最後一格的最少秒數。"],
    input_format="第一行為格數 N。第二行有 N 個以空白分隔的整數，依序為每格的高度。",
    output_format="輸出一個整數，代表最少秒數。",
    constraints=["1 ≤ N ≤ 1000", "0 ≤ 高度 ≤ 100"],
    hint="用 cost[i] 記錄到第 i 格的最少秒數，從前往後更新 cost[i+1] 與 cost[i+2]。",
    solution='''
    # 思路：cost[i] 為到第 i 格的最少秒數；由前往後，從每格嘗試前進 1 格與 2 格的合法走法。
    n = int(input())
    h = list(map(int, input().split()))
    INF = float("inf")
    cost = [INF] * n
    cost[0] = 0
    for i in range(n):
        if i + 1 < n:
            diff = h[i + 1] - h[i]
            step = 3 if diff >= 2 else 1
            cost[i + 1] = min(cost[i + 1], cost[i] + step)
        if i + 2 < n:
            if h[i + 1] == h[i] and h[i + 2] == h[i]:
                cost[i + 2] = min(cost[i + 2], cost[i] + 1)
            if h[i + 1] < h[i] and h[i + 2] == h[i]:
                cost[i + 2] = min(cost[i + 2], cost[i] + 2)
    print(cost[n - 1])
    ''', oracle=o291,
    cases=["4\n1 1 1 2", "4\n3 1 3 6", "5\n4 1 2 3 1", "3\n1 1 1", "2\n1 2", "1\n5", "2\n1 3", "2\n9 1", "5\n2 2 2 2 2",
           "7\n5 1 5 1 5 1 5", "6\n1 3 5 7 9 11", "8\n3 2 3 3 3 0 3 9"],
    fuzz=[g291() for _ in range(200)],
    source_ids=[90], source_title="小島越野賽(國小)", categories=PT,
    source_checks=[("3\n1 1 1", "1"), ("2\n1 2", "1"), ("4\n1 1 1 2", "2"), ("4\n3 1 3 6", "5"), ("5\n4 1 2 3 1", "4")],
    adaptation="將五種走法整理為精確條件；原題列為國小題，但需要動態規劃，故歸入 LV.3。")


# 292 基地台訊號覆蓋 -------------------------------------------------------
def o292(s):
    t = ints(s)
    n, g = t[0], t[1:]
    towers = [(i // n, i % n, v) for i, v in enumerate(g) if v > 0]
    counts = [0, 0, 0, 0]
    for r in range(n):
        for c in range(n):
            best = max([0] + [v - abs(r - tr) - abs(c - tc) for tr, tc, v in towers])
            counts[0 if best >= 4 else 1 if best >= 2 else 2 if best == 1 else 3] += 1
    return " ".join(map(str, counts))


def g292():
    n = R.randint(1, 7)
    return lines(n, [R.choice([0, 0, 0, R.randint(1, 8)]) for _ in range(n * n)])


add(292, "基地台訊號覆蓋", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["二維清單", "曼哈頓距離", "巢狀迴圈"],
    objectives=["在二維格子中計算曼哈頓距離", "對每一格取所有基地台訊號的最大值並分類計數"],
    prerequisites=["二維清單", "巢狀迴圈", "abs", "max"],
    lead="計算 N × N 地圖上每格的最強訊號，並統計各訊號等級的格子數。",
    body=["地圖中數字 0 表示沒有基地台，正整數表示基地台及其初始強度。兩格距離採曼哈頓距離（列差 + 行差），每遠 1 格強度減 1，最低為 0。一格同時收到多個訊號時，取最強的值。",
          "依每格的最終強度分類：4 以上為訊號好；2～3 為普通；1 為弱；0 為無訊號。請輸出四種等級的格子數。"],
    input_format="第一行為 N。第二行有 N × N 個以空白分隔的非負整數，依由左至右、由上至下的順序給出地圖。",
    output_format="輸出四個以空白分隔的整數：訊號好、普通、弱、無訊號的格子數。",
    constraints=["1 ≤ N ≤ 20", "0 ≤ 強度 ≤ 50"],
    hint="先把所有基地台的位置與強度存起來，再對每一格算出最大的「強度 − 距離」。",
    solution='''
    # 思路：記錄所有基地台，對每格取 max(強度 - 曼哈頓距離, 0)，再依等級計數。
    n = int(input())
    values = list(map(int, input().split()))
    towers = []
    for i, v in enumerate(values):
        if v > 0:
            towers.append((i // n, i % n, v))
    good = normal = weak = none = 0
    for r in range(n):
        for c in range(n):
            best = 0
            for tr, tc, v in towers:
                best = max(best, v - abs(r - tr) - abs(c - tc))
            if best >= 4:
                good += 1
            elif best >= 2:
                normal += 1
            elif best == 1:
                weak += 1
            else:
                none += 1
    print(good, normal, weak, none)
    ''', oracle=o292,
    cases=["3\n0 0 0 0 3 0 0 0 0", "4\n5 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4", "2\n4 0 0 0", "3\n0 0 0 0 1 0 0 0 0", "1\n0",
           "1\n50", "2\n0 0 0 0", "3\n1 1 1 1 1 1 1 1 1", "5\n0 0 0 0 0 0 0 0 0 0 0 0 9 0 0 0 0 0 0 0 0 0 0 0 0",
           "4\n2 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2"],
    fuzz=[g292() for _ in range(150)],
    source_ids=[91], source_title="基地台訊號覆蓋(國中)", categories=PT,
    source_checks=[("2\n4 0 0 0", "1 3 0 0"), ("3\n0 0 0 0 1 0 0 0 0", "0 0 1 8"), ("3\n0 0 0 0 3 0 0 0 0", "0 5 4 0"),
                   ("4\n5 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4", "4 12 0 0")],
    adaptation="整理訊號傳播與分級規則，加上地圖大小與強度範圍。")


# 293 考試獎勵 -------------------------------------------------------------
def o293(s):
    rows = [list(map(int, r.split())) for r in s.split("\n")]
    weeks, prices = rows[0][0], rows[0][1:]
    points = dolls = 0
    last_friday = None
    for w in range(weeks):
        scores = rows[1 + w]
        points += sum(x // 10 for x in scores)
        eligible = last_friday is None or scores[4] > last_friday
        if eligible and points >= prices[w]:
            points -= prices[w]
            dolls += 1
        last_friday = scores[4]
    return f"{dolls} {points}"


def g293():
    w = R.randint(1, 5)
    return "\n".join([" ".join(map(str, [w] + [R.randint(5, 60) for _ in range(w)]))] +
                     [" ".join(str(R.randint(0, 100)) for _ in range(5)) for _ in range(w)])


add(293, "考試獎勵", stage="Intermediate", difficulty="Medium", audience="M-8",
    tags=["模擬", "累加", "條件判斷"],
    objectives=["逐週累積點數並判斷兌換資格", "保存上一週的週五成績供下一週比較"],
    prerequisites=["二維資料", "整數除法", "and 條件"],
    lead="模擬每週測驗累積點數與兌換娃娃，輸出兌換數量與剩餘點數。",
    body=["每週一到週五各有一次測驗，每次可得到「分數 ÷ 10（無條件捨去）」的點數，點數可跨週累積。每週五可用點數兌換該週的娃娃，每週最多一隻。",
          "第一週一定有資格；第二週起，該週五的成績必須高於前一週五的成績才有資格。有資格且點數足夠（大於或等於該週娃娃的點數）時就兌換，並扣除點數。請輸出總共兌換的娃娃數與剩餘點數。"],
    input_format="第一行為週數 W，接著 W 個整數依序為每週娃娃所需的點數。接下來 W 行，每行 5 個整數，為該週週一到週五的成績。",
    output_format="輸出兩個以空白分隔的整數：兌換的娃娃數與剩餘點數。",
    constraints=["1 ≤ W ≤ 52", "1 ≤ 娃娃點數 ≤ 100", "0 ≤ 成績 ≤ 100"],
    hint="每週先把該週五天的點數加進去，再判斷能不能兌換。",
    solution='''
    # 思路：逐週累加點數；判斷資格（第一週或週五成績進步）與點數是否足夠後兌換。
    first = list(map(int, input().split()))
    weeks, prices = first[0], first[1:]
    points = dolls = 0
    last_friday = -1
    for w in range(weeks):
        scores = list(map(int, input().split()))
        for s in scores:
            points += s // 10
        eligible = (w == 0) or (scores[4] > last_friday)
        if eligible and points >= prices[w]:
            points -= prices[w]
            dolls += 1
        last_friday = scores[4]
    print(dolls, points)
    ''', oracle=o293,
    cases=["1 23\n10 20 30 40 50", "4 10 20 80 99\n80 88 60 70 90\n70 71 72 73 74\n89 80 85 83 81\n100 100 100 100 100",
           "1 1\n0 0 0 0 9", "1 1\n0 0 0 0 10", "2 5 5\n10 10 10 10 50\n10 10 10 10 50",
           "2 5 5\n10 10 10 10 50\n10 10 10 10 51", "3 100 1 1\n100 100 100 100 100\n0 0 0 0 0\n100 100 100 100 1",
           "3 60 60 60\n100 100 100 100 30\n100 100 100 100 40\n100 100 100 100 50", "2 50 50\n100 100 100 100 100\n100 100 100 100 100",
           "3 10 10 10\n9 9 9 9 9\n50 50 50 50 50\n60 60 60 60 60"],
    fuzz=[g293() for _ in range(150)],
    source_ids=[92], source_title="考試獎勵", categories=NAT_M,
    source_checks=[("1 23\n10 20 30 40 50", "0 15"),
                   ("4 10 20 80 99\n80 88 60 70 90\n70 71 72 73 74\n89 80 85 83 81\n100 100 100 100 100", "2 73")],
    adaptation="原題未寫輸入格式，依原站範例補上（第一行為週數與每週娃娃點數），並明定點數足夠指大於或等於。")


# 294 簽唱會門票 -----------------------------------------------------------
def o294(s):
    t = ints(s)
    limit, n, scores = t[0], t[1], t[2:]
    invited = set()
    for v in sorted(set(scores), reverse=True):
        group = [i for i in range(n) if scores[i] == v]
        if len(invited) + len(group) > limit:
            break
        invited |= set(group)
    return " ".join(str(i + 1) for i in sorted(invited)) or "0"


def g294():
    n = R.randint(1, 12)
    return lines([R.randint(1, 8), n], [R.choice([10, 20, 30, 40, 50]) for _ in range(n)])


add(294, "簽唱會門票", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["排序", "分組", "貪心"],
    objectives=["依積分由高到低把相同積分的粉絲視為一組", "在不超過人數上限時整組加入，否則停止"],
    prerequisites=["set", "sort", "清單"],
    lead="依粉絲積分由高到低發出邀請，同積分的粉絲必須一起邀請。",
    body=["場地最多容納 K 人。依積分由高到低，一次考慮同一積分的所有粉絲：若加入他們後總人數不超過 K，就全部邀請；否則停止，之後積分更低的粉絲也都不邀請（同積分的粉絲不可只邀請一部分）。",
          "請依報名順序（編號由小到大）輸出獲邀粉絲的編號（從 1 開始）；若沒有任何人獲邀，輸出 <code>0</code>。"],
    input_format="第一行為兩個整數 K 與 N，分別為人數上限與報名人數。第二行有 N 個以空白分隔的整數，依報名順序為每位粉絲的積分。",
    output_format="輸出獲邀粉絲的編號，以一個空白分隔；或輸出 <code>0</code>。",
    constraints=["1 ≤ K ≤ 100", "1 ≤ N ≤ 100", "0 ≤ 積分 ≤ 1000"],
    hint="先把不重複的積分由大到小排序，再逐一判斷整組能不能放進去。",
    solution='''
    # 思路：由高到低處理每個積分組，整組放得下就邀請，放不下就停止；最後依編號輸出。
    k, n = map(int, input().split())
    scores = list(map(int, input().split()))
    invited = []
    for value in sorted(set(scores), reverse=True):
        group = [i for i in range(n) if scores[i] == value]
        if len(invited) + len(group) > k:
            break
        invited += group
    if invited:
        print(" ".join(str(i + 1) for i in sorted(invited)))
    else:
        print(0)
    ''', oracle=o294,
    cases=["3 6\n90 95 80 95 70 60", "3 5\n10 10 10 10 10", "3 5\n60 80 95 60 60", "1 1\n5", "1 2\n5 5", "5 3\n1 2 3",
           "2 4\n9 8 8 7", "4 6\n50 40 50 30 40 40", "100 4\n0 0 0 0", "3 7\n7 7 5 9 5 9 1"],
    fuzz=[g294() for _ in range(150)],
    source_ids=[93], source_title="簽唱會門票", categories=NAT_M,
    source_checks=[("3 6\n90 95 80 95 70 60", "1 2 4"), ("3 5\n10 10 10 10 10", "0"), ("3 5\n60 80 95 60 60", "2 3")],
    adaptation="補上輸入格式（第一行為人數上限與報名人數），並明定某組放不下時即停止、不跳過該組改邀較低積分者。")


# 295 闖關遊戲 -------------------------------------------------------------
ROOMS = {
    "A": [1, 2, 3, -1, -2, -3, 1, 2, 3, -3, -2, -1],
    "B": [-2, -2, -3, -2, -2, -3, -2, -2, -3, -2, -2, -3],
    "C": [1, 2, -1, 0, 1, -2, 2, 1, -1, 2, -2, 0],
}


def o295(s):
    group, start = s.split()
    screen = ROOMS[group][:]
    room = int(start)
    path = [room]
    while screen[room - 1] != 0 and len(path) < 11:
        step = screen[room - 1]
        screen[room - 1] = -step
        room = (room - 1 + step) % 12 + 1
        path.append(room)
    return " ".join(map(str, path))


add(295, "闖關遊戲", stage="Intermediate", difficulty="Medium", audience="M-8",
    tags=["模擬", "環狀結構", "取餘數"],
    objectives=["用餘數在 12 個環狀房間中前後移動", "每次離開房間後翻轉該房間數字的正負號"],
    prerequisites=["清單", "取餘數", "while 迴圈"],
    lead="依房間螢幕的數字在環狀房間間移動，輸出闖關時依序進入的房間。",
    body=["12 個房間依編號 1～12 順時鐘圍成一圈（12 的順時鐘下一間是 1）。三組起始設定中，房間 1～12 的螢幕數字依序為：A 組：+1 +2 +3 −1 −2 −3 +1 +2 +3 −3 −2 −1；B 組：−2 −2 −3 −2 −2 −3 −2 −2 −3 −2 −2 −3；C 組：+1 +2 −1 0 +1 −2 +2 +1 −1 +2 −2 0。",
          "從指定房間開始（算第 1 次進入）。房間數字為 +i 時前往順時鐘方向第 i 間，為 −i 時前往逆時鐘方向第 i 間；離開房間後該房間的數字正負互換。當進入的房間數字為 0，或已累計進入 11 次時，闖關成功並結束。請輸出依序進入的房間編號。"],
    input_format="一行包含起始設定（<code>A</code>、<code>B</code> 或 <code>C</code>）與第一個進入的房間編號，以空白分隔。",
    output_format="輸出依序進入的房間編號，以一個空白分隔。",
    constraints=["1 ≤ 房間編號 ≤ 12"],
    hint="把房間編號換成 0～11 後，新位置 = (位置 + 數字) % 12；Python 的 % 對負數也會得到 0～11。",
    solution='''
    # 思路：以清單保存螢幕數字，依數字移動並翻轉正負號，直到遇到 0 或已進入 11 次。
    rooms = {
        "A": [1, 2, 3, -1, -2, -3, 1, 2, 3, -3, -2, -1],
        "B": [-2, -2, -3, -2, -2, -3, -2, -2, -3, -2, -2, -3],
        "C": [1, 2, -1, 0, 1, -2, 2, 1, -1, 2, -2, 0],
    }
    group, start = input().split()
    screen = rooms[group][:]
    pos = int(start) - 1
    path = [pos + 1]
    while screen[pos] != 0 and len(path) < 11:
        step = screen[pos]
        screen[pos] = -step
        pos = (pos + step) % 12
        path.append(pos + 1)
    print(" ".join(map(str, path)))
    ''', oracle=o295,
    cases=["A 2", "B 12", "C 5", "A 1", "A 12", "B 1", "B 7", "C 4", "C 12", "C 1", "A 9", "B 3"],
    fuzz=[f"{g} {r}" for g in "ABC" for r in range(1, 13)],
    source_ids=[94], source_title="闖關遊戲", categories=NAT_M,
    source_checks=[("A 2", "2 4 3 6 3 12 11 9 12 1 2"), ("B 12", "12 9 6 3 12 3 6 9 12 9 6"), ("C 5", "5 6 4")],
    adaptation="原題以兩張圖提供房間排列與起始設定，改以文字列出；明定起始房間算第 1 次進入。")


# 296 火星探測車 -----------------------------------------------------------
def o296(s):
    t = ints(s)
    items = [(t[1 + 2 * i], t[2 + 2 * i]) for i in range(t[0])]
    if len(items) <= 15:
        best = 0
        for mask in range(1 << len(items)):
            w = sum(items[i][0] for i in range(len(items)) if mask >> i & 1)
            if w <= 100:
                best = max(best, sum(items[i][1] for i in range(len(items)) if mask >> i & 1))
        return best
    dp = [0] * 101
    for w, v in items:
        for c in range(100, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[100]


def g296():
    n = R.randint(1, 12)
    return "\n".join([str(n)] + [f"{R.randint(1, 100)} {R.randint(0, 300)}" for _ in range(n)])


add(296, "火星探測車", stage="Advanced", difficulty="Medium", audience="M-HS",
    tags=["動態規劃", "0/1背包"],
    objectives=["將任務選擇建模為容量 100 的 0/1 背包", "以倒序更新避免同一任務被重複選取"],
    prerequisites=["清單", "巢狀迴圈", "max"],
    lead="在 100 單位電力內挑選任務，使總科學價值最高。",
    body="探測車出發前充滿 100 單位電力。有 N 個任務，每個任務有電力需求與科學價值，每個任務最多執行一次。在電力需求總和不超過 100 的前提下，請輸出可獲得的最高總科學價值。",
    input_format="第一行為任務數 N。接下來 N 行，每行兩個整數：電力需求與科學價值。",
    output_format="輸出一個整數，代表最高總科學價值。",
    constraints=["1 ≤ N ≤ 100", "1 ≤ 電力需求 ≤ 100", "0 ≤ 科學價值 ≤ 10000"],
    hint="用 best[c] 表示「使用至多 c 單位電力」可得到的最高價值。",
    solution='''
    # 思路：0/1 背包，best[c] 為電力上限 c 的最高價值；容量由大到小更新，確保每個任務只用一次。
    n = int(input())
    best = [0] * 101
    for _ in range(n):
        power, value = map(int, input().split())
        for c in range(100, power - 1, -1):
            best[c] = max(best[c], best[c - power] + value)
    print(best[100])
    ''', oracle=o296,
    cases=["3\n20 50\n40 60\n30 70", "2\n96 220\n51 113", "4\n80 100\n50 60\n20 30\n10 10", "1\n100 5", "1\n100 0",
           "2\n50 10\n50 10", "3\n51 100\n50 60\n50 60", "5\n10 1\n20 2\n30 3\n40 4\n100 9",
           "6\n1 1\n2 3\n3 5\n97 100\n98 101\n99 102", "4\n34 40\n33 40\n33 40\n1 1"],
    fuzz=[g296() for _ in range(150)],
    source_ids=[95], source_title="火星探測車", categories=NAT_M,
    source_checks=[("3\n20 50\n40 60\n30 70", "180"), ("2\n96 220\n51 113", "220"), ("4\n80 100\n50 60\n20 30\n10 10", "130")],
    adaptation="補上輸入格式與每個任務最多執行一次的說明；oracle 以枚舉所有子集驗證。")


# 297 熱浪區間 -------------------------------------------------------------
def o297(s):
    rows = s.split("\n")
    _, threshold = rows[0].split()
    th = Fraction(threshold)
    temp = [Fraction(x) for x in rows[1].split()]
    n = len(temp)
    best = None
    for a in range(n):
        for b in range(a + 1, n):
            if temp[a] < th or temp[b] < th or temp[a] >= temp[b]:
                continue
            # 在區間 a..b 中，以 a 開頭、b 結尾的最長嚴格遞增子序列
            length = {a: 1}
            for j in range(a + 1, b + 1):
                cand = [length[i] + 1 for i in length if temp[i] < temp[j] and temp[j] >= th]
                if cand:
                    length[j] = max(cand)
            if b in length:
                key = (-length[b], a, b)
                best = key if best is None or key < best else best
    if best is None:
        return "0 0"
    return f"{best[2] - best[1] + 1} {best[1] + 1}"


def g297():
    n = R.randint(1, 10)
    th = R.choice(["30.0", "32.5", "34.0"])
    return lines(f"{n} {th}", " ".join(f"{R.randint(290, 360) / 10:.1f}" for _ in range(n)))


add(297, "熱浪區間", stage="Advanced", difficulty="Hard", audience="M-HS",
    tags=["動態規劃", "最長遞增子序列", "多重排序條件"],
    objectives=["以動態規劃求嚴格遞增子序列的最長長度", "依多個條件（長度、起始日、結束日）挑選唯一答案"],
    prerequisites=["清單", "巢狀迴圈", "tuple 比較"],
    lead="找出達到高溫門檻、且溫度嚴格遞增的最長熱浪，輸出其區間天數與起始日。",
    body=["給定連續 n 天的最高氣溫（一位小數）與高溫門檻 T。挑選若干天 i₁ &lt; i₂ &lt; … &lt; i_k（k ≥ 2），使每一天的氣溫都 ≥ T，且氣溫嚴格遞增。這組天數形成的熱浪區間為第 i₁ 天到第 i_k 天，區間天數為 i_k − i₁ + 1。",
          "請找出 k 最大的熱浪；若有多組 k 相同，選起始日 i₁ 最早者；仍相同時，選結束日 i_k 最早者。輸出該熱浪的區間天數與起始日（第一天為第 1 天）。若不存在 k ≥ 2 的熱浪，輸出 <code>0 0</code>。"],
    input_format="第一行為天數 n 與門檻 T，以空白分隔。第二行有 n 個以空白分隔、一位小數的氣溫。",
    output_format="輸出兩個以空白分隔的整數：區間天數與起始日。",
    constraints=["1 ≤ n ≤ 500", "氣溫與門檻皆為一位小數"],
    hint="令 f[j] 為「以第 j 天結尾的最長熱浪長度與其最早起始日」，由所有 i &lt; j 且 temp[i] &lt; temp[j] 的 f[i] 轉移。",
    solution='''
    # 思路：f[j] = (以 j 結尾的最長長度, 該長度下最早的起始日)；比較時長度大者優先，長度相同取起始日小者。
    # 最後在所有 j 中，依（長度最大、起始日最早、結束日最早）挑出答案；時間 O(n^2)。
    first = input().split()
    n, threshold = int(first[0]), float(first[1])
    temp = list(map(float, input().split()))
    length = [0] * n
    start = [0] * n
    for j in range(n):
        if temp[j] < threshold:
            continue
        length[j], start[j] = 1, j
        for i in range(j):
            if length[i] and temp[i] < temp[j]:
                if length[i] + 1 > length[j] or (length[i] + 1 == length[j] and start[i] < start[j]):
                    length[j], start[j] = length[i] + 1, start[i]
    best = None
    for j in range(n):
        if length[j] >= 2:
            key = (-length[j], start[j], j)
            if best is None or key < best:
                best = key
    if best is None:
        print(0, 0)
    else:
        print(best[2] - best[1] + 1, best[1] + 1)
    ''', oracle=o297,
    cases=["8 32.0\n25.0 32.1 31.9 31.9 32.3 32.5 31.0 32.5", "7 34.0\n35.2 36.3 34.0 28.0 34.1 35.0 36.0", "1 30.0\n35.0",
           "2 30.0\n31.0 31.0", "2 30.0\n31.0 31.1", "3 30.0\n29.9 30.0 30.1", "4 30.0\n35.0 34.0 33.0 32.0",
           "6 30.0\n30.1 30.5 30.2 30.6 30.3 30.7", "6 33.0\n33.0 34.0 33.5 35.0 33.6 34.0", "5 40.0\n35.0 36.0 37.0 38.0 39.0",
           "7 30.0\n31.0 32.0 30.5 30.6 30.7 33.0 34.0"],
    fuzz=[g297() for _ in range(200)],
    source_ids=[96], source_title="熱浪區間", categories=NAT_M,
    source_checks=[("8 32.0\n25.0 32.1 31.9 31.9 32.3 32.5 31.0 32.5", "5 2"), ("7 34.0\n35.2 36.3 34.0 28.0 34.1 35.0 36.0", "5 3")],
    adaptation="原題未定義同長度熱浪的選擇方式；依原站兩組範例推定「長度最大 → 起始日最早 → 結束日最早」並明列，補上不存在熱浪時輸出 0 0。")


# 298 運動會 ---------------------------------------------------------------
def o298(s):
    a = ints(s)[1:]
    total = sum(a)
    best = min((abs(total - 2 * sum(a[:k])), sum(a[:k])) for k in range(1, len(a)))
    left = best[1]
    return f"{min(left, total - left)} {max(left, total - left)}"


add(298, "運動會", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["前綴和", "最小值", "枚舉"],
    objectives=["枚舉所有切分點並以累加計算兩側總和", "找出兩群人數差最小的切法"],
    prerequisites=["迴圈", "累加", "abs"],
    lead="把連續的班級分成 A、B 兩群，使兩群人數最接近。",
    body="N 個班級依序排列，每班有一個參賽人數。請在某兩個相鄰班級之間切一刀，把班級分成前後兩群（每群至少一班），使兩群總人數的差最小。請先輸出人數較少的一群，再輸出人數較多的一群。例如 10 12 7 15 23 24 可分成 10+12+7+15 = 44 與 23+24 = 47。",
    input_format="第一行為班級數 N。第二行有 N 個以空白分隔的非負整數，代表各班人數。",
    output_format="輸出兩個以空白分隔的整數：較少的一群人數、較多的一群人數。",
    constraints=["2 ≤ N ≤ 1000", "0 ≤ 每班人數 ≤ 1000"],
    hint="前面一群的人數可以邊走邊累加，後面一群就是總數減掉前面。",
    solution='''
    # 思路：累加前綴和，後群人數 = 總和 - 前綴和，枚舉所有切分點取差最小者。
    n = int(input())
    classes = list(map(int, input().split()))
    total = sum(classes)
    prefix = 0
    best_diff = None
    best_front = 0
    for k in range(n - 1):
        prefix += classes[k]
        diff = abs(total - 2 * prefix)
        if best_diff is None or diff < best_diff:
            best_diff, best_front = diff, prefix
    back = total - best_front
    print(min(best_front, back), max(best_front, back))
    ''', oracle=o298,
    cases=["6\n10 12 7 15 23 24", "7\n12 0 2 8 2 3 0", "2\n5 5", "2\n0 9", "2\n1000 1", "3\n1 1 1", "4\n0 0 0 0",
           "5\n1 2 3 4 5", "5\n100 1 1 1 1", "6\n3 1 4 1 5 9"],
    fuzz=[lines(n := R.randint(2, 15), [R.randint(0, 30) for _ in range(n)]) for _ in range(150)],
    source_ids=[102], source_title="運動會", categories=NAT_E,
    source_checks=[("6\n10 12 7 15 23 24", "44 47"), ("7\n12 0 2 8 2 3 0", "13 14")],
    adaptation="原題以表格圖片說明，改以文字範例；補上每群至少一班與人數為 0 的測資。")


if __name__ == "__main__":
    main()
