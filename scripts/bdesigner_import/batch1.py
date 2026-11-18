#!/usr/bin/env python3
"""bDesigner 匯入第 1 批：114 練習題、師大題目、桃園市國小／國中（214–229）。

python3 scripts/bdesigner_import/batch1.py          # 只驗證
python3 scripts/bdesigner_import/batch1.py --write  # 驗證通過後寫入
"""
import itertools
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add, lines, main  # noqa: E402

R = random.Random(20261118)
PRACTICE = ["114/練習題"]


# 214 臨時屋 ---------------------------------------------------------------
def o214(s):
    t = s.split()
    people, n, caps = int(t[0]), int(t[1]), list(map(int, t[2:]))
    opened, filled = 0, 0
    while filled < people and opened < n:
        filled += caps[opened]
        opened += 1
    return opened


def g214():
    n = R.randint(1, 12)
    caps = [R.randint(1, 60) for _ in range(n)]
    return lines(R.randint(0, sum(caps) + 30), n, caps)


add(214, "臨時屋", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["迴圈", "累加", "條件判斷"],
    objectives=["依序累加容量直到足以容納所有人", "在人數為 0 或容量不足時正確停止"],
    prerequisites=["變數", "迴圈", "條件判斷"],
    lead="計算防災演習中依序開放了幾間臨時屋。",
    body=["收容所有 N 間臨時屋，依編號順序開放：前一間住滿後才開放下一間。給定需要安置的人數與每間臨時屋的容量，請輸出開放了幾間。",
          "若人數為 0，不需要開放任何一間；若所有臨時屋都開放仍不足以容納全部人數，則全部 N 間都算已開放。"],
    input_format="第一行為需要安置的人數 P。第二行為臨時屋數量 N。第三行有 N 個以空白分隔的正整數，依序為每間臨時屋的容量。",
    output_format="輸出一個整數，代表開放的臨時屋數量。",
    constraints=["0 ≤ P ≤ 1000", "1 ≤ N ≤ 12", "1 ≤ 每間容量 ≤ 100"],
    hint="用一個變數記錄目前已開放的總容量，還不夠時再開放下一間。",
    solution='''
    # 思路：依序累加臨時屋容量，直到總容量 ≥ 人數或已無臨時屋可開。
    # 積木對照：讀入人數與容量清單 → 重複直到「容量足夠或開完」→ 開放數加一、容量累加 → 說出開放數。
    people = int(input())
    n = int(input())
    caps = list(map(int, input().split()))
    opened = 0
    total = 0
    while total < people and opened < n:
        total += caps[opened]
        opened += 1
    print(opened)
    ''', oracle=o214,
    cases=["50\n4\n30 20 15 55", "9\n3\n10 5 15", "0\n2\n30 20", "37\n2\n10 20",
           "30\n3\n30 10 10", "31\n3\n30 10 10", "1\n1\n1", "0\n1\n5", "1000\n12\n" + " ".join(["100"] * 12),
           "1000\n12\n" + " ".join(["50"] * 12), "100\n5\n1 1 1 1 96", "99\n5\n1 1 1 1 96", "60\n3\n20 20 20"],
    fuzz=[g214() for _ in range(80)],
    source_ids=[1], source_title="臨時屋", categories=PRACTICE,
    source_checks=[("9\n3\n10 5 15", "1"), ("50\n4\n30 20 15 55", "2"), ("0\n2\n30 20", "0"), ("37\n2\n10 20", "2")],
    adaptation="補上原題省略的輸入格式，明定人數為 0 與容量不足時的輸出。")


# 215 超商收銀結帳 ----------------------------------------------------------
def o215(s):
    t = list(map(int, s.split()))
    n = t[0]
    total, paid = sum(t[1:1 + n]), t[1 + n]
    return paid - total if paid >= total else "付款金額不足"


def g215():
    n = R.randint(1, 10)
    prices = [R.randint(1, 500) for _ in range(n)]
    return lines(n, prices, max(0, sum(prices) + R.randint(-100, 100)))


add(215, "超商收銀結帳", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["累加", "條件判斷"],
    objectives=["用迴圈或清單加總計算總金額", "以單一條件判斷付款是否足夠"],
    prerequisites=["清單", "加總", "條件判斷"],
    lead="計算超商結帳應找的金額。",
    body="先計算所有商品的總金額。若付款金額大於或等於總金額，輸出應找的金額；若付款金額不足，輸出 <code>付款金額不足</code>。",
    input_format="第一行為商品數量 N。第二行有 N 個以空白分隔的整數，代表每樣商品的價格。第三行為付款金額。",
    output_format="付款足夠時輸出應找金額（可能為 0）；不足時輸出 <code>付款金額不足</code>。",
    constraints=["1 ≤ N ≤ 100", "1 ≤ 商品價格 ≤ 10000", "0 ≤ 付款金額 ≤ 1000000"],
    hint="付款金額剛好等於總金額時，也算付款足夠。",
    solution='''
    # 思路：加總價格後與付款金額比較。
    # 積木對照：讀入 N 與價格清單 → 用迴圈累加總金額 → 如果付款 ≥ 總額，說出差額，否則說出「付款金額不足」。
    n = int(input())
    prices = list(map(int, input().split()))
    paid = int(input())
    total = 0
    for price in prices:
        total += price
    if paid >= total:
        print(paid - total)
    else:
        print("付款金額不足")
    ''', oracle=o215,
    cases=["3\n50 20 30\n120", "2\n40 35\n60", "4\n10 20 30 40\n100", "5\n5 5 5 5 5\n50", "1\n1\n0",
           "1\n10000\n10000", "1\n10000\n9999", "3\n100 200 300\n1000000", "2\n1 1\n1", "4\n25 25 25 25\n101",
           "100\n" + " ".join(["10000"] * 100) + "\n1000000", "100\n" + " ".join(["10000"] * 100) + "\n999999"],
    fuzz=[g215() for _ in range(80)],
    source_ids=[2], source_title="超商收銀結帳", categories=PRACTICE,
    source_checks=[("3\n50 30 20\n120", "20"), ("2\n40 35\n60", "付款金額不足"), ("4\n10 20 30 40\n100", "0"),
                   ("5\n5 5 5 5 5\n50", "25")],
    adaptation="整理原題輸入輸出格式，補足剛好付清、單件商品與極大值測資。")


# 216 電影院找座位 ----------------------------------------------------------
def o216(s):
    t = list(map(int, s.split()))
    k, m, segs = t[0], t[1], t[2:]
    return sum(1 for L in segs for start in range(L) if start + k <= L)


def g216():
    m = R.randint(1, 8)
    return lines(R.randint(1, 12), m, [R.randint(1, 15) for _ in range(m)])


add(216, "電影院找座位", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["迴圈", "數學", "條件判斷"],
    objectives=["推導長度 L 的空位段能放 K 人連坐的起點數為 L − K + 1", "排除長度不足的空位段"],
    prerequisites=["迴圈", "條件判斷"],
    lead="計算一家 K 人在一排座位中連坐的方式數。",
    body=["一排座位中已有部分有人坐，剩下的空位形成數段「連續空位」。給你每段連續空位的座位數，請計算一家 K 人可以坐在連續 K 個空位的方式總數。",
          "兩種方式只要起始座位不同就算不同。長度不足 K 的空位段無法使用。"],
    input_format="第一行為家庭人數 K。第二行為空位段數 M。第三行有 M 個以空白分隔的正整數，代表每段連續空位的長度。",
    output_format="輸出一個整數，代表可以坐下的方式總數。",
    constraints=["1 ≤ K ≤ 100", "1 ≤ M ≤ 100", "1 ≤ 每段長度 ≤ 1000"],
    hint="先數一段長度為 6 的空位能讓 3 人從哪幾個位置開始坐。",
    solution='''
    # 思路：每段長度 L 若 ≥ K，可提供 L - K + 1 個起點，全部加總。
    # 積木對照：讀入 K 與空位清單 → 對每段：如果長度 ≥ K，總數加上 長度 - K + 1 → 說出總數。
    k = int(input())
    m = int(input())
    segments = list(map(int, input().split()))
    ways = 0
    for length in segments:
        if length >= k:
            ways += length - k + 1
    print(ways)
    ''', oracle=o216,
    cases=["3\n2\n6 2", "2\n3\n3 5 4", "4\n1\n4", "5\n3\n1 3 4", "1\n3\n1 2 3", "1\n1\n1", "100\n1\n1000",
           "100\n2\n99 100", "1000\n1\n1000", "2\n5\n1 1 1 1 1", "7\n4\n7 8 6 20"],
    fuzz=[g216() for _ in range(80)],
    source_ids=[3], source_title="電影院找座位", categories=PRACTICE,
    source_checks=[("3\n2\n6 2", "4"), ("2\n3\n3 5 4", "9"), ("4\n1\n4", "1"), ("5\n3\n1 3 4", "0")],
    adaptation="補上原題省略的輸入格式，並說明長度不足的空位段不計。")


# 217 大富翁 ---------------------------------------------------------------
def o217(s):
    t = list(map(int, s.split()))
    n = t[0]
    board = t[1:1 + n]
    m = t[1 + n]
    dice = t[2 + n:2 + n + m]
    pos, money = 0, 0
    for d in dice:
        for _ in range(d):
            pos = 0 if pos == n - 1 else pos + 1
        money = max(0, money + board[pos])
    return money


def g217():
    n = R.randint(1, 10)
    m = R.randint(1, 10)
    return lines(n, [R.randint(-50, 50) for _ in range(n)], m, [R.randint(1, 6) for _ in range(m)])


add(217, "大富翁", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["模擬", "餘數", "清單"],
    objectives=["用餘數處理環形棋盤的位置", "在金額不足時將結果下限設為 0"],
    prerequisites=["清單索引", "取餘數", "條件判斷"],
    lead="模擬環形棋盤上的移動，求玩家最後的金額。",
    body=["環形棋盤共有 N 格，每格標示金錢變化（正數獲得、負數失去、0 不變）。玩家一開始站在第 1 格，金額為 0；起始格不結算。",
          "依序按照每次骰子點數往前移動，超過第 N 格時回到第 1 格繼續。每次移動後立即結算落點格的金錢變化；若需扣錢但金額不足，只扣到 0 元。"],
    input_format="第一行為格數 N。第二行有 N 個整數，依序為第 1 到第 N 格的金錢變化。第三行為骰子次數 M。第四行有 M 個整數，代表每次骰到的點數。",
    output_format="輸出一個整數，代表玩家最後的金額。",
    constraints=["1 ≤ N ≤ 100", "−1000 ≤ 金錢變化 ≤ 1000", "1 ≤ M ≤ 100", "1 ≤ 點數 ≤ 6"],
    hint="把格子編成 0 到 N−1，新位置就是（目前位置 + 點數）除以 N 的餘數。",
    solution='''
    # 思路：以 0 起算的位置加上點數後取餘數；每次結算後若為負數改為 0。
    # 積木對照：位置設為 0 → 對每個點數：位置 = (位置 + 點數) 除以 N 的餘數 → 金額加上該格 → 如果金額 < 0 設為 0。
    n = int(input())
    board = list(map(int, input().split()))
    m = int(input())
    dice = list(map(int, input().split()))
    pos = 0
    money = 0
    for step in dice:
        pos = (pos + step) % n
        money += board[pos]
        if money < 0:
            money = 0
    print(money)
    ''', oracle=o217,
    cases=["5\n10 -5 0 20 -10\n3\n1 2 3", "4\n50 -20 10 -5\n4\n4 1 1 1", "3\n-10 5 -5\n2\n1 2", "2\n50 -30\n2\n6 6",
           "1\n7\n3\n1 2 3", "1\n-5\n2\n6 6", "6\n0 0 0 0 0 0\n2\n6 6", "3\n0 -1000 1000\n3\n2 1 1",
           "4\n-1 -1 -1 -1\n4\n1 2 3 4", "5\n1000 1000 1000 1000 1000\n3\n5 5 5", "6\n10 20 -100 30 40 -5\n6\n1 1 1 1 1 1"],
    fuzz=[g217() for _ in range(80)],
    source_ids=[4], source_title="大富翁", categories=PRACTICE,
    source_checks=[("5\n10 -5 0 20 -10\n3\n1 2 3", "15"), ("4\n50 -20 10 -5\n4\n4 1 1 1", "35"),
                   ("3\n-10 5 -5\n2\n1 2", "0"), ("2\n50 -30\n2\n6 6", "100")],
    adaptation="整理原題格式，補足單格棋盤、繞多圈與扣到 0 的測資。")


# 218 可口便當 -------------------------------------------------------------
def o218(s):
    rows = s.split("\n")
    orders = rows[1].split()
    priority = rows[3].split()
    out = []
    for p in priority:
        out += [o for o in orders if o == p]
    return " ".join(out)


def g218():
    kinds = R.sample(range(1, 10), R.randint(1, 9))
    n = R.randint(1, 15)
    orders = [R.choice(kinds) for _ in range(n)]
    pr = sorted(set(orders)) + [k for k in kinds if k not in orders]
    R.shuffle(pr)
    return lines(n, orders, len(pr), pr)


add(218, "可口便當", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["清單", "排序", "巢狀迴圈"],
    objectives=["依指定的優先順序重新排列資料", "保留同種資料的全部出現次數"],
    prerequisites=["清單", "巢狀迴圈"],
    lead="依主廚指定的套餐順序，列出所有訂單被處理的順序。",
    body=["今天有 N 份訂單，每份訂單是一個套餐編號（1～9）。主廚會給出套餐的烹煮先後順序：先煮完所有第一順位的套餐，再煮第二順位，依此類推。",
          "請輸出所有訂單依序被處理時的套餐編號。順序清單會包含所有出現在訂單中的套餐，也可能包含今天沒人點的套餐。"],
    input_format="第一行為訂單數 N。第二行有 N 個以空白分隔的套餐編號。第三行為順序清單的長度 M。第四行有 M 個互不相同的套餐編號，代表烹煮順序。",
    output_format="輸出一行 N 個套餐編號，以一個空白分隔。",
    constraints=["1 ≤ N ≤ 100", "1 ≤ M ≤ 9", "套餐編號介於 1～9"],
    hint="依照順序清單逐一處理每種套餐，每次把訂單中所有這種套餐都拿出來。",
    solution='''
    # 思路：依烹煮順序逐一處理每種套餐，將該套餐出現的次數全部輸出。
    # 積木對照：讀入兩個清單 → 對順序清單的每個編號：計算訂單中出現幾次 → 重複加入結果清單 → 用空白組合後說出。
    n = int(input())
    orders = input().split()
    m = int(input())
    priority = input().split()
    result = []
    for meal in priority:
        result += [meal] * orders.count(meal)
    print(" ".join(result))
    ''', oracle=o218,
    cases=["5\n8 9 9 9 8\n2\n9 8", "7\n3 1 4 1 5 9 3\n5\n1 9 4 3 5", "1\n5\n1\n5", "1\n5\n3\n1 2 5",
           "4\n2 2 2 2\n1\n2", "6\n1 2 3 4 5 6\n6\n6 5 4 3 2 1", "9\n1 2 3 4 5 6 7 8 9\n9\n9 8 7 6 5 4 3 2 1",
           "5\n7 3 7 3 7\n4\n1 3 2 7", "3\n4 4 6\n9\n1 2 3 4 5 6 7 8 9", "8\n2 1 2 1 2 1 2 1\n2\n1 2"],
    fuzz=[g218() for _ in range(80)],
    source_ids=[5, 63], source_title="可口便當／金門粥糜採購任務", categories=["114/師大題目", "114/114年金門縣國中"],
    source_checks=[("5\n8 9 9 9 8\n2\n9 8", "9 9 9 8 8"), ("7\n3 1 4 1 5 9 3\n5\n1 9 4 3 5", "1 1 9 4 3 3 5")],
    adaptation="補上原題省略的輸入格式，明定順序清單可包含未點的套餐；金門縣國中「金門粥糜採購任務」規則與範例相同，併入本題。")


# 219 短片欣賞 -------------------------------------------------------------
def o219(s):
    rows = s.split("\n")
    seq = rows[1].split()
    k, fav = rows[2].split()
    k = int(k)
    return max(seq[i:i + k].count(fav) for i in range(len(seq) - k + 1))


def g219():
    n = R.randint(1, 20)
    letters = R.sample("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 3)
    return lines(n, [R.choice(letters) for _ in range(n)], f"{R.randint(1, n)} {R.choice(letters)}")


add(219, "短片欣賞", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["滑動視窗", "字串", "計數"],
    objectives=["枚舉所有長度為 K 的連續區段", "在區段中計數指定字母並取最大值"],
    prerequisites=["清單切片", "巢狀迴圈", "最大值"],
    lead="找出連續看 K 場短片時，最多能看到幾次最喜歡的系列。",
    body=["圖書館依序播放 N 場短片，每場以一個大寫英文字母代表所屬系列。娜娜可以挑選任一個起點，連續觀看剛好 K 場。",
          "請計算她最多能看到幾場最喜歡的系列。例如序列 <code>A B C A W A Q A</code>、K = 5、最喜歡 A，從第 4 場開始看可以看到 3 次 A。"],
    input_format="第一行為場次數 N。第二行有 N 個以空白分隔的大寫英文字母。第三行為整數 K 與最喜歡的系列字母，以空白分隔。",
    output_format="輸出一個整數，代表最多能看到的次數。",
    constraints=["1 ≤ N ≤ 20", "1 ≤ K ≤ N", "字母皆為 A～Z 的大寫字母"],
    hint="起點可以從第 1 場一路試到第 N − K + 1 場。",
    solution='''
    # 思路：枚舉每個長度 K 的連續區段，計算其中最喜歡字母的數量並取最大值。
    # 積木對照：讀入清單、K 與字母 → 對每個起點：數區段內有幾個該字母 → 若比最大值大則更新 → 說出最大值。
    n = int(input())
    films = input().split()
    k, favorite = input().split()
    k = int(k)
    best = 0
    for start in range(n - k + 1):
        count = 0
        for film in films[start:start + k]:
            if film == favorite:
                count += 1
        if count > best:
            best = count
    print(best)
    ''', oracle=o219,
    cases=["8\nA B C A W A Q A\n5 A", "3\nX G X\n2 X", "1\nA\n1 A", "1\nA\n1 B", "5\nA A A A A\n5 A",
           "5\nB B B B B\n3 A", "6\nA B A B A B\n1 A", "20\n" + " ".join("AB" * 10) + "\n20 B",
           "7\nC C D D D C C\n3 C", "7\nC C D D D C C\n4 D", "10\nZ Y Z Z Y Y Z Z Z Y\n4 Z"],
    fuzz=[g219() for _ in range(80)],
    source_ids=[6], source_title="短片欣賞", categories=["114/師大題目"],
    source_checks=[("8\nA B C A W A Q A\n5 A", "3"), ("3\nX G X\n2 X", "1")],
    adaptation="原題以圖片說明範例，改以文字敘述；補上輸入格式與 K ≤ N 的限制。")


# 220 傳球遊戲 -------------------------------------------------------------
def o220(s):
    n, k = map(int, s.split())
    seen = [1]
    cur = 1
    while True:
        for _ in range(k):
            cur = cur + 1 if cur < n else 1
        seen.append(cur)
        if cur == 1:
            return " ".join(map(str, seen))


add(220, "傳球遊戲", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["模擬", "餘數", "迴圈"],
    objectives=["用餘數在圓圈中前進固定人數", "以「回到起點」作為迴圈結束條件"],
    prerequisites=["while 迴圈", "取餘數"],
    lead="模擬圍成圓圈的傳球，輸出球依序經過的同學編號。",
    body=["N 位同學圍成一圈，編號 1 到 N。球一開始在 1 號手上，每次往編號增加的方向前進 K 人（K = 1 代表傳給下一位，N 號的下一位是 1 號）。",
          "球再次回到 1 號手上時比賽結束。請輸出球依序落在誰的手上，第一個與最後一個數字都是 1。"],
    input_format="第一行為人數 N，第二行為每次前進的人數 K。",
    output_format="輸出一行整數，以一個空白分隔。",
    constraints=["2 ≤ N ≤ 1000", "1 ≤ K ≤ 1000"],
    hint="把編號換成 0 到 N−1 後，下一位就是（目前 + K）除以 N 的餘數。",
    solution='''
    # 思路：以 0 起算的位置每次加 K 取餘數，直到回到 0。
    # 積木對照：位置 = 0、結果清單放入 1 → 重複：位置 = (位置 + K) 除以 N 的餘數、加入 位置 + 1 → 直到位置 = 0。
    n = int(input())
    k = int(input())
    pos = 0
    path = [1]
    while True:
        pos = (pos + k) % n
        path.append(pos + 1)
        if pos == 0:
            break
    print(" ".join(map(str, path)))
    ''', oracle=o220,
    cases=["5\n2", "4\n1", "6\n3", "12\n9", "2\n1", "2\n2", "7\n7", "1000\n1", "1000\n999", "1000\n1000",
           "10\n4", "9\n6", "13\n1000"],
    fuzz=[lines(R.randint(2, 60), R.randint(1, 120)) for _ in range(80)],
    source_ids=[8], source_title="傳球遊戲", categories=PRACTICE,
    source_checks=[("5\n2", "1 3 5 2 4 1"), ("4\n1", "1 2 3 4 1"), ("6\n3", "1 4 1"), ("12\n9", "1 10 7 4 1")],
    adaptation="把原題「隔 K 個人」改寫為「往前 K 人」以免歧義，並補上 K 為 N 倍數的邊界。")


# 221 找零錢計算 -----------------------------------------------------------
COINS = [100, 50, 10, 5, 1]


def o221(s):
    t = list(map(int, s.split()))
    change, stock = t[1] - t[0], t[2:7]
    best = None
    for a in range(min(stock[0], change // 100) + 1):
        for b in range(min(stock[1], change // 50) + 1):
            for c in range(min(stock[2], change // 10) + 1):
                for d in range(min(stock[3], change // 5) + 1):
                    rest = change - 100 * a - 50 * b - 10 * c - 5 * d
                    if 0 <= rest <= stock[4]:
                        combo = (a + b + c + d + rest, (a, b, c, d, rest))
                        if best is None or combo[0] < best[0]:
                            best = combo
    return "無法找零" if best is None else " ".join(map(str, best[1]))


def g221():
    price = R.randint(1, 400)
    return lines(price, price + R.randint(0, 300), [R.randint(0, 4) for _ in range(5)])


add(221, "找零錢計算", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["貪心", "整除", "模擬"],
    objectives=["在每種面額有庫存上限時由大到小找零", "判斷剩餘金額無法湊出的情況"],
    prerequisites=["整數除法", "min 函式", "清單"],
    lead="在錢幣庫存有限的情況下，用最少的枚數找零。",
    body=["收銀機有 100、50、10、5、1 元五種錢幣，每種數量有限。顧客付款後，請在不超過庫存的前提下，用最少的總枚數找出剛好的零錢。",
          "若無法剛好找出，輸出 <code>無法找零</code>。付款金額一定不小於購物金額；不需要找零時輸出五個 0。"],
    input_format="第一行為購物金額。第二行為付款金額。第三行有 5 個非負整數，依序為 100、50、10、5、1 元的庫存枚數。",
    output_format="可找零時輸出 5 個以空白分隔的整數，依序為找出的 100、50、10、5、1 元枚數；否則輸出 <code>無法找零</code>。",
    constraints=["1 ≤ 購物金額 ≤ 付款金額 ≤ 10000", "0 ≤ 每種庫存 ≤ 100"],
    hint="這組面額中每種都是下一種較小面額的整數倍，從大面額開始，每種盡量多用但不超過庫存。",
    solution='''
    # 思路：面額 100、50、10、5、1 依序整除，從大到小盡量使用（受庫存限制）即為最少枚數；最後若仍有餘額則無法找零。
    change = -int(input()) + int(input())
    stock = list(map(int, input().split()))
    coins = [100, 50, 10, 5, 1]
    used = []
    for coin, have in zip(coins, stock):
        take = min(have, change // coin)
        used.append(take)
        change -= take * coin
    if change == 0:
        print(" ".join(map(str, used)))
    else:
        print("無法找零")
    ''', oracle=o221,
    cases=["270\n500\n3 3 10 10 20", "500\n500\n1 2 3 4 5", "123\n150\n2 2 2 2 0", "1\n10000\n100 0 0 0 0",
           "1\n10000\n99 1 4 1 4", "1\n10000\n99 1 4 1 3", "40\n100\n0 1 0 2 0", "40\n100\n0 0 6 0 0",
           "40\n100\n0 0 5 2 0", "99\n100\n0 0 0 0 1", "99\n100\n5 5 5 5 0", "1\n100\n0 1 4 1 5", "37\n100\n0 1 0 2 3"],
    fuzz=[g221() for _ in range(150)],
    source_ids=[9], source_title="找零錢計算", categories=PRACTICE,
    source_checks=[("270\n500\n3 3 10 10 20", "2 0 3 0 0"), ("500\n500\n1 2 3 4 5", "0 0 0 0 0"),
                   ("123\n150\n2 2 2 2 0", "無法找零")],
    adaptation="明定付款不小於購物金額；以暴力枚舉 oracle 確認由大到小找零在此面額下即為最少枚數。")


# 222 班服投票 -------------------------------------------------------------
TAOYUAN_E = ["114/114桃園市國小"]
TAOYUAN_M = ["114/114桃園市國中"]


def o222(s):
    votes = s.split("\n")[1].split()
    counts = {k: votes.count(k) for k in "123"}
    top = max(counts.values())
    winners = [k for k, v in counts.items() if v == top]
    return winners[0] if len(winners) == 1 else "請重新投票"


def g222():
    n = R.randint(1, 12)
    return lines(n, [R.randint(1, 3) for _ in range(n)])


add(222, "班服投票", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["計數", "條件判斷", "最大值"],
    objectives=["分別統計三種選項的票數", "判斷最高票是否並列"],
    prerequisites=["計數器", "多分支條件"],
    lead="統計班服投票，輸出最高票的款式或要求重新投票。",
    body="班服有 1、2、3 三種款式，每張選票寫一個款式編號。請統計各款式得票數；若最高票只有一個款式，輸出該款式編號，若有兩個以上款式並列最高票，輸出 <code>請重新投票</code>。",
    input_format="第一行為選票數 N。第二行有 N 個以空白分隔的整數，每個介於 1～3。",
    output_format="輸出最高票的款式編號，或 <code>請重新投票</code>。",
    constraints=["1 ≤ N ≤ 50"],
    hint="先找出最高票數，再數有幾個款式拿到這個票數。",
    solution='''
    # 思路：計算三款票數，找最高票數並檢查是否只有一個款式達到。
    # 積木對照：三個計數變數 → 逐張選票加一 → 求最大值 → 數有幾款等於最大值 → 只有一款就說出編號，否則說出「請重新投票」。
    n = int(input())
    votes = list(map(int, input().split()))
    counts = [0, 0, 0]
    for v in votes:
        counts[v - 1] += 1
    top = max(counts)
    if counts.count(top) == 1:
        print(counts.index(top) + 1)
    else:
        print("請重新投票")
    ''', oracle=o222,
    cases=["8\n1 2 2 3 2 1 3 2", "6\n1 2 3 1 2 3", "5\n3 3 1 2 3", "1\n1", "1\n3", "2\n1 2", "2\n3 3",
           "4\n1 1 2 2", "4\n2 3 3 2", "5\n1 3 1 3 2", "7\n2 2 2 1 1 1 3", "50\n" + " ".join(["1"] * 17 + ["2"] * 16 + ["3"] * 17)],
    fuzz=[g222() for _ in range(80)],
    source_ids=[10], source_title="班服投票", categories=TAOYUAN_E,
    source_checks=[("8\n1 2 2 3 2 1 3 2", "2"), ("6\n1 2 3 1 2 3", "請重新投票"), ("5\n3 3 1 2 3", "3")],
    adaptation="整理原題格式，補上單張選票、兩款並列與零票款式的測資。")


# 223 棒球場的座位 ---------------------------------------------------------
def o223(s):
    seat = int(s)
    zones = [(1, 25, 90), (2, 50, 90), (3, 25, 90)]
    for zone, per_row, rows in zones:
        for row in range(1, rows + 1):
            if seat <= per_row:
                return f"{zone} {row} {seat}"
            seat -= per_row


add(223, "棒球場的座位", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["整除與餘數", "多分支條件"],
    objectives=["用整除與餘數把流水號換成排與位置", "依區段先扣除前面各區的座位數"],
    prerequisites=["整數除法", "取餘數", "if/elif"],
    lead="把棒球場的座位流水號換成區、排與位置。",
    body=["棒球場共有 9000 個座位，分為三大區，每區 90 排。第一區與第三區為普通區，各 2250 席，每排 25 人；第二區為搖滾區，共 4500 席，每排 50 人。",
          "座位由第一區開始編號，在每區內先由左至右、再由前至後，接著是第二、三區。請輸出座位所在的區、排與該排的第幾個位置。"],
    input_format="一行一個整數，代表座位號碼。",
    output_format="輸出三個以空白分隔的整數：區、排、該排的第幾個位置。",
    constraints=["1 ≤ 座位號碼 ≤ 9000"],
    hint="先把號碼減 1 變成從 0 起算，再用整除求排、用餘數求位置。",
    solution='''
    # 思路：判斷所在區後，扣除前面各區席次，再用整除與餘數算出排與位置。
    seat = int(input())
    if seat <= 2250:
        zone, offset, per_row = 1, seat - 1, 25
    elif seat <= 6750:
        zone, offset, per_row = 2, seat - 2251, 50
    else:
        zone, offset, per_row = 3, seat - 6751, 25
    print(zone, offset // per_row + 1, offset % per_row + 1)
    ''', oracle=o223,
    cases=["1881", "3045", "8241", "1", "25", "26", "2250", "2251", "2300", "2301", "6750", "6751", "9000", "4500"],
    fuzz=[str(R.randint(1, 9000)) for _ in range(200)],
    source_ids=[11], source_title="棒球場的座位", categories=TAOYUAN_E,
    source_checks=[("1881", "1 76 6"), ("3045", "2 16 45"), ("8241", "3 60 16")],
    adaptation="整理輸入輸出格式，補上每區第一席、最後一席與排的邊界測資。")


# 224 挑選喜歡的午餐區間 ---------------------------------------------------
def o224(s):
    rows = [r.split() for r in s.split("\n")]
    menu, k, fav = rows[1], int(rows[2][0]), set(rows[3])
    best = (-1, 0)
    for i in range(len(menu) - k + 1):
        c = sum(m in fav for m in menu[i:i + k])
        if c > best[0]:
            best = (c, i + 1)
    return f"{best[0]} {best[1]}"


def g224():
    n = R.randint(1, 15)
    return lines(n, [R.choice("ABCD") for _ in range(n)], R.randint(1, n), R.sample("ABCDE", R.randint(1, 3)))


add(224, "挑選喜歡的午餐區間", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["滑動視窗", "計數", "字串"],
    objectives=["枚舉連續 K 天的區段並計數符合條件的項目", "以「嚴格大於才更新」保留最早的區段"],
    prerequisites=["清單切片", "in 判斷", "最大值"],
    lead="找出連續 K 天中最愛餐點出現最多次的區段。",
    body=["學校提供 N 天的午餐，每天主餐以一個大寫字母表示。小虎有一種或多種最愛的餐點，他想挑連續 K 天，使最愛餐點出現的天數最多。",
          "若有多段的次數相同，選起始日最早的一段。第一天為第 1 天。"],
    input_format="第一行為天數 N。第二行有 N 個以空白分隔的大寫字母。第三行為 K。第四行為一個或多個以空白分隔的最愛餐點字母。",
    output_format="輸出兩個以空白分隔的整數：最愛餐點出現的天數、該區段的起始日。",
    constraints=["1 ≤ K ≤ N ≤ 100"],
    hint="次數相同時不要更新，這樣自然會保留最早的起始日。",
    solution='''
    # 思路：枚舉每個起點，計算 K 天內屬於最愛餐點的天數；只有嚴格較大時才更新答案。
    n = int(input())
    menu = input().split()
    k = int(input())
    favorites = input().split()
    best_count = -1
    best_start = 1
    for start in range(n - k + 1):
        count = 0
        for meal in menu[start:start + k]:
            if meal in favorites:
                count += 1
        if count > best_count:
            best_count = count
            best_start = start + 1
    print(best_count, best_start)
    ''', oracle=o224,
    cases=["7\nA B A C A B A\n3\nA", "10\nA B C D A B C C B A\n4\nA C", "5\nA B C D E\n2\nA B C D E", "1\nA\n1\nA",
           "1\nA\n1\nB", "4\nB B B B\n2\nA", "6\nA B A B A B\n6\nB", "6\nC C A A C C\n2\nC",
           "8\nA B B A A B A A\n3\nA", "5\nD E D E D\n1\nE", "9\nA A B B C C A A B\n3\nB C"],
    fuzz=[g224() for _ in range(100)],
    source_ids=[12], source_title="挑選喜歡的午餐區間", categories=TAOYUAN_E,
    source_checks=[("7\nA B A C A B A\n3\nA", "2 1"), ("10\nA B C D A B C C B A\n4\nA C", "3 5"),
                   ("5\nA B C D E\n2\nA B C D E", "2 1")],
    adaptation="統一主角名稱，明定最愛餐點可有多種、次數為 0 時輸出第 1 天。")


# 225 綠能任務挑戰 ---------------------------------------------------------
def o225(s):
    t = list(map(int, s.split()))
    n = t[0]
    board = t[1:1 + n]
    m = t[1 + n]
    dice = t[2 + n:2 + n + m]
    pos = energy = top = 0
    for d in dice:
        pos = (pos + d) % n
        energy = energy + board[pos]
        energy = 50 if energy > 50 else 5 if energy <= 0 else energy
        top = max(top, energy)
    return f"{energy} {top}"


def g225():
    n = R.randint(1, 8)
    m = R.randint(1, 10)
    return lines(n, [R.randint(-30, 30) for _ in range(n)], m, [R.randint(1, 6) for _ in range(m)])


add(225, "綠能任務挑戰", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["模擬", "餘數", "多分支條件"],
    objectives=["在環形地圖上以餘數移動", "依上下限規則修正數值並追蹤最大值"],
    prerequisites=["清單索引", "取餘數", "if/elif"],
    lead="模擬環形地圖上的能量變化，輸出最終能量與最高能量。",
    body=["地圖共有 N 個地點，每個地點有能量變化值（正、負或 0）。玩家從第 1 個地點出發，初始能量為 0，出發點不計算能量。",
          "每次依骰子點數往前移動，超過第 N 個地點時回到第 1 個，抵達後計入該地點的能量變化。若總能量超過 50，會維持為 50；若總能量小於或等於 0，會自動補助為 5。最高能量指每次修正後的能量中最大的值。"],
    input_format="第一行為地點數 N。第二行有 N 個整數，依序為每個地點的能量變化值。第三行為骰子次數 M。第四行有 M 個整數，代表每次骰到的點數。",
    output_format="輸出兩個以空白分隔的整數：最終能量值與過程中的最高能量值。",
    constraints=["1 ≤ N ≤ 100", "−100 ≤ 能量變化 ≤ 100", "1 ≤ M ≤ 100", "1 ≤ 點數 ≤ 6"],
    hint="每次移動後先加上能量變化，再依規則修正，最後才更新最高值。",
    solution='''
    # 思路：以餘數處理環形移動；每步先修正上下限，再更新最高能量。
    n = int(input())
    board = list(map(int, input().split()))
    m = int(input())
    dice = list(map(int, input().split()))
    pos = 0
    energy = 0
    highest = 0
    for step in dice:
        pos = (pos + step) % n
        energy += board[pos]
        if energy > 50:
            energy = 50
        elif energy <= 0:
            energy = 5
        if energy > highest:
            highest = energy
    print(energy, highest)
    ''', oracle=o225,
    cases=["4\n25 10 30 -5\n4\n1 1 2 1", "5\n10 -5 0 20 -10\n3\n1 2 3", "5\n-10 -20 10 0 30\n5\n1 1 1 1 1",
           "1\n0\n1\n3", "1\n100\n2\n1 1", "1\n-100\n2\n6 6", "3\n0 45 -40\n2\n1 1", "3\n0 5 -10\n2\n1 1",
           "2\n50 1\n2\n1 1", "4\n10 10 10 10\n6\n4 4 4 4 4 4", "6\n-3 7 -8 20 31 -100\n6\n1 2 3 4 5 6"],
    fuzz=[g225() for _ in range(100)],
    source_ids=[13], source_title="綠能任務挑戰", categories=TAOYUAN_E,
    source_checks=[("4\n25 10 30 -5\n4\n1 1 2 1", "50 50"), ("5\n10 -5 0 20 -10\n3\n1 2 3", "20 25"),
                   ("5\n-10 -20 10 0 30\n5\n1 1 1 1 1", "35 45")],
    adaptation="明定最高能量以修正後的值計算，並修正原題輸出格式說明中的範例數字。")


# 226 購買紀念品 -----------------------------------------------------------
def o226(s):
    t = list(map(int, s.split()))
    money, m = t[0], t[1]
    prices, counts = t[2:2 + m], t[2 + m:2 + 2 * m]
    best = [0] + [-1] * money  # best[c] = 花費恰為 c 時最多件數（有界背包）
    for p, c in zip(prices, counts):
        for _ in range(c):
            for cost in range(money, p - 1, -1):
                if best[cost - p] >= 0:
                    best[cost] = max(best[cost], best[cost - p] + 1)
    return max(best)


def g226():
    m = R.randint(1, 5)
    return lines(R.randint(0, 600), m, [R.randint(1, 200) for _ in range(m)], [R.randint(0, 4) for _ in range(m)])


add(226, "購買紀念品", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["貪心", "排序", "模擬"],
    objectives=["理解「件數最多」時應從最便宜的商品買起", "同時受預算與庫存限制計算可買數量"],
    prerequisites=["清單排序", "zip", "整數除法"],
    lead="用剩下的日幣買到最多件紀念品。",
    body="小明剩下 N 日幣，紀念品店有 M 種商品，每種有價格與剩餘數量。在總花費不超過 N 的情況下，請計算最多可以買幾件紀念品（不需要把錢剛好花完）。",
    input_format="第一行為剩下的日幣 N。第二行為商品種類數 M。第三行有 M 個整數，代表每種商品的價格。第四行有 M 個整數，依序代表每種商品的剩餘數量。",
    output_format="輸出一個整數，代表最多可以買到的紀念品件數。",
    constraints=["0 ≤ N ≤ 100000", "1 ≤ M ≤ 100", "1 ≤ 價格 ≤ 10000", "0 ≤ 剩餘數量 ≤ 100"],
    hint="想讓件數最多，應該先買哪一種商品？",
    solution='''
    # 思路：件數最多時，每次買最便宜的商品一定不會更差；依價格排序後在預算與庫存內盡量購買。
    money = int(input())
    m = int(input())
    prices = list(map(int, input().split()))
    counts = list(map(int, input().split()))
    total = 0
    for price, count in sorted(zip(prices, counts)):
        take = min(count, money // price)
        total += take
        money -= take * price
    print(total)
    ''', oracle=o226,
    cases=["1000\n3\n100 300 200\n3 4 2", "500\n3\n600 700 800\n3 4 5", "1500\n3\n200 300 100\n2 1 4",
           "1285\n3\n400 300 100\n4 6 3", "0\n1\n1\n5", "10\n1\n1\n0", "10\n2\n3 3\n2 2", "100\n2\n100 1\n1 0",
           "999\n4\n250 250 250 250\n1 1 1 1", "1000\n4\n250 250 250 250\n1 1 1 1", "7\n3\n2 3 5\n1 1 1",
           "100000\n2\n1 10000\n100 100"],
    fuzz=[g226() for _ in range(80)],
    source_ids=[14], source_title="購買紀念品", categories=TAOYUAN_M,
    source_checks=[("1000\n3\n100 300 200\n3 4 2", "6"), ("500\n3\n600 700 800\n3 4 5", "0"),
                   ("1500\n3\n200 300 100\n2 1 4", "7"), ("1285\n3\n400 300 100\n4 6 3", "6")],
    adaptation="原題「盡量花完」與「件數最多」語意衝突，依原站答案改為只求件數最多；oracle 以有界背包驗證貪心。")


# 227 攻擊防禦力平衡 -------------------------------------------------------
def o227(s):
    t = list(map(int, s.split()))
    atk, dfn, items = t[0], t[1], t[2:8]
    for size in (1, 2, 3):
        for combo in itertools.combinations(range(3), size):
            if atk + sum(items[i] for i in combo) == dfn + sum(items[3 + i] for i in combo):
                return " ".join(str(i + 1) for i in combo)
    return 0


def g227():
    return lines(R.randint(0, 30), R.randint(0, 30), [R.randint(0, 20) for _ in range(6)])


add(227, "攻擊防禦力平衡", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["枚舉", "組合", "條件判斷"],
    objectives=["依使用數量由少到多枚舉道具組合", "以固定順序處理數量相同的多種解"],
    prerequisites=["巢狀迴圈", "清單", "條件判斷"],
    lead="用最少件道具讓角色的攻擊力等於防禦力。",
    body=["角色有初始攻擊力與防禦力，另有 3 件道具，每件同時增加攻擊力與防禦力，每件最多使用一次，效果可疊加。請找出使攻擊力等於防禦力時，使用件數最少的道具組合。",
          "若同樣件數有多種組合，依編號由小到大比較，選字典序最小的組合（例如 <code>1 3</code> 優先於 <code>2 3</code>）。至少要使用 1 件道具；若任何組合都無法達成，輸出 <code>0</code>。"],
    input_format="第一行為初始攻擊力，第二行為初始防禦力。第三行有 6 個整數：先依序為第 1、2、3 件道具的攻擊力加成，再依序為第 1、2、3 件道具的防禦力加成。",
    output_format="輸出使用的道具編號，由小到大以一個空白分隔；無法達成時輸出 <code>0</code>。",
    constraints=["0 ≤ 初始攻擊力、初始防禦力 ≤ 1000", "0 ≤ 道具加成 ≤ 1000"],
    hint="先試只用 1 件的 3 種情況，再試 2 件的 3 種情況，最後才試全部 3 件。",
    solution='''
    # 思路：依件數 1、2、3 的順序、同件數依編號字典序枚舉組合，第一個符合者即為答案。
    attack = int(input())
    defense = int(input())
    values = list(map(int, input().split()))
    plus_attack, plus_defense = values[:3], values[3:]
    combos = [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]
    answer = "0"
    for combo in combos:
        a = attack + sum(plus_attack[i - 1] for i in combo)
        d = defense + sum(plus_defense[i - 1] for i in combo)
        if a == d:
            answer = " ".join(map(str, combo))
            break
    print(answer)
    ''', oracle=o227,
    cases=["15\n20\n20 5 10 10 15 5", "10\n15\n5 20 15 10 10 25", "10\n25\n15 10 15 10 5 20", "0\n0\n0 0 0 0 0 0",
           "5\n5\n1 2 3 1 2 3", "0\n10\n0 0 10 0 0 0", "0\n10\n4 3 3 0 0 0", "0\n10\n5 5 0 0 0 0",
           "0\n10\n6 4 5 0 0 1", "1000\n0\n0 0 0 1000 0 0", "7\n3\n0 0 0 1 1 1", "20\n10\n1 2 3 4 5 6"],
    fuzz=[g227() for _ in range(150)],
    source_ids=[15], source_title="攻擊防禦力平衡", categories=TAOYUAN_M,
    source_checks=[("15\n20\n20 5 10 10 15 5", "3"), ("10\n15\n5 20 15 10 10 25", "1 2"),
                   ("10\n25\n15 10 15 10 5 20", "0")],
    adaptation="原題未定義同件數多解與初始已相等的情形，明定至少使用 1 件並以字典序最小者為答案。")


# 228 檢查碼 ---------------------------------------------------------------
def o228(s):
    code = s.strip()
    value = {"A": 11, "B": 13, "C": 15, "D": 17}[code[0]] + sum(int(c) for c in code[1:])
    return "yes" if value % 5 == 4 else "no"


add(228, "檢查碼", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["字串", "取餘數", "條件判斷"],
    objectives=["逐字讀取字串並把數字字元轉為整數", "以對照表取得英文字母代表的數值"],
    prerequisites=["字串索引", "迴圈", "取餘數"],
    lead="判斷書店會員卡號是否正確。",
    body=["會員卡號由 1 個英文字母、4 個數字與 1 位檢查碼組成，共 6 個字元。英文字母代表的數值為：A = 11、B = 13、C = 15、D = 17。",
          "將字母代表的數值加上後面 5 個數字（含檢查碼）的總和，若除以 5 的餘數為 4，卡號正確，輸出 <code>yes</code>；否則輸出 <code>no</code>。例如 <code>B20135</code>：13 + 2 + 0 + 1 + 3 + 5 = 24，餘數為 4，是正確卡號。"],
    input_format="一行一個 6 字元的會員卡號。",
    output_format="卡號正確輸出 <code>yes</code>，否則輸出 <code>no</code>（皆為小寫）。",
    constraints=["第一個字元為 A、B、C 或 D", "其餘 5 個字元皆為數字 0～9"],
    hint="用 int() 把每個數字字元轉成整數再相加。",
    solution='''
    # 思路：查表取得字母數值，加上其餘 5 個數字，檢查除以 5 的餘數是否為 4。
    card = input().strip()
    letter_value = {"A": 11, "B": 13, "C": 15, "D": 17}
    total = letter_value[card[0]]
    for ch in card[1:]:
        total += int(ch)
    print("yes" if total % 5 == 4 else "no")
    ''', oracle=o228,
    cases=["C20351", "D15713", "B20135", "A15274", "A00003", "A00000", "B00001", "C00004", "D00002",
           "D99999", "A99999", "C12345", "B54321"],
    fuzz=[R.choice("ABCD") + "".join(R.choice("0123456789") for _ in range(5)) for _ in range(150)],
    source_ids=[16], source_title="檢查碼", categories=TAOYUAN_M,
    source_checks=[("C20351", "no"), ("D15713", "yes")],
    adaptation="把題目中的計算範例整理為說明，補上四種字母與各種餘數的測資。")


# 229 校園販賣機自動補貨 ---------------------------------------------------
def o229(s):
    stock = list(map(int, s.split()))[1:]
    return sum(20 if x < 10 else x for x in stock)


add(229, "校園販賣機自動補貨", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["迴圈", "累加", "條件判斷"],
    objectives=["在累加時依條件替換數值", "正確處理等於門檻的邊界"],
    prerequisites=["迴圈", "if/else"],
    lead="自動補貨後，計算販賣機內飲料的總罐數。",
    body="販賣機有 N 種飲料。庫存低於 10 罐的品項會自動補貨到 20 罐；庫存大於或等於 10 罐則不補貨。請輸出補貨後所有飲料的總罐數。",
    input_format="第一行為飲料種類數 N。第二行有 N 個以空白分隔的整數，代表各飲料目前的庫存。",
    output_format="輸出一個整數，代表補貨後的總罐數。",
    constraints=["1 ≤ N ≤ 100", "0 ≤ 庫存 ≤ 100"],
    hint="庫存剛好 10 罐時不需要補貨。",
    solution='''
    # 思路：逐項判斷，庫存小於 10 以 20 計算，否則以原庫存計算。
    # 積木對照：總數設為 0 → 對每個庫存：如果 < 10 加 20，否則加上庫存 → 說出總數。
    n = int(input())
    stock = list(map(int, input().split()))
    total = 0
    for amount in stock:
        if amount < 10:
            total += 20
        else:
            total += amount
    print(total)
    ''', oracle=o229,
    cases=["5\n12 8 5 20 18", "4\n9 9 9 9", "6\n10 11 19 0 7 30", "1\n0", "1\n9", "1\n10", "1\n100",
           "3\n10 10 10", "100\n" + " ".join(["0"] * 100), "100\n" + " ".join(["100"] * 100), "5\n9 10 19 20 21"],
    fuzz=[lines(n := R.randint(1, 20), [R.randint(0, 40) for _ in range(n)]) for _ in range(80)],
    source_ids=[17], source_title="校園販賣機自動補貨", categories=TAOYUAN_M,
    source_checks=[("5\n12 8 5 20 18", "90"), ("4\n9 9 9 9", "80"), ("6\n10 11 19 0 7 30", "110")],
    adaptation="整理原題格式，補上庫存 9、10 的門檻與全部補貨的測資。")


if __name__ == "__main__":
    main()
