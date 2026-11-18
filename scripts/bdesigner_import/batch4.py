#!/usr/bin/env python3
"""bDesigner 匯入第 4 批：金門縣國中／國小、新竹市國中／國小（264–282）。

金門縣國中與國小有多組同名題：國小版為國中版的簡化（較少模式、較少輸出），
合併為一題並採國中版規格：57+64、58+65、59+66、60+67、61+68。
63「金門粥糜採購任務」與 5「可口便當」同題，已在 batch1 的 218 合併。
"""
import itertools
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add, lines, main  # noqa: E402

R = random.Random(20261121)
KM_M = ["114/114年金門縣國中"]
KM_E = ["114/114年金門縣國小"]
HC_M = ["114/114年新竹市國中"]
HC_E = ["114/114年新竹市國小"]


def ints(s):
    return list(map(int, s.split()))


# 264 資訊競賽獎勵統計 -----------------------------------------------------
def o264(s):
    scores = ints(s)[1:]
    bands = [(90, 101), (80, 90), (70, 80), (60, 70)]
    return " ".join(str(sum(lo <= x < hi for x in scores)) for lo, hi in bands)


add(264, "資訊競賽獎勵統計", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["多分支條件", "計數"],
    objectives=["以 if/elif 由高到低判斷每個分數的級別", "用多個計數器分別統計"],
    prerequisites=["if/elif", "計數器"],
    lead="統計競賽中金牌、銀牌、銅牌與佳作的人數。",
    body="每位選手的得分只歸入最高的一個獎項：90 分以上金牌，80～89 分銀牌，70～79 分銅牌，60～69 分佳作，未滿 60 分只有參賽證明（不計入）。請輸出各獎項的人數。",
    input_format="第一行為參賽人數 N。第二行有 N 個以空白分隔的整數，代表每位選手的得分。",
    output_format="輸出四個以空白分隔的整數：金牌、銀牌、銅牌、佳作的人數。",
    constraints=["1 ≤ N ≤ 1000", "0 ≤ 得分 ≤ 100"],
    hint="從最高的獎項開始判斷，用 elif 就不會重複計算。",
    solution='''
    # 思路：每個分數由高到低判斷一次，對應的計數器加一。
    n = int(input())
    scores = list(map(int, input().split()))
    gold = silver = bronze = merit = 0
    for s in scores:
        if s >= 90:
            gold += 1
        elif s >= 80:
            silver += 1
        elif s >= 70:
            bronze += 1
        elif s >= 60:
            merit += 1
    print(gold, silver, bronze, merit)
    ''', oracle=o264,
    cases=["6\n92 55 80 90 72 65", "3\n45 60 59", "1\n100", "1\n0", "1\n89", "1\n79", "1\n69", "4\n90 80 70 60",
           "4\n89 79 69 59", "10\n100 99 91 90 88 81 77 70 61 1", "5\n59 58 57 56 55"],
    fuzz=[lines(n := R.randint(1, 20), [R.randint(0, 100) for _ in range(n)]) for _ in range(100)],
    source_ids=[57, 64], source_title="資訊競賽獎勵統計", categories=KM_M + KM_E,
    source_checks=[("6\n92 55 80 90 72 65", "2 1 1 1"), ("3\n45 60 59", "0 0 0 1")],
    adaptation="合併金門縣國中與國小的同一題；依原站資料改為所有得分在同一行，補上各級距端點測資。")


# 265 台灣星鏈衛星佈署計畫 -------------------------------------------------
def o265(s):
    length, gap, mode = ints(s)
    q = length // gap
    return {1: q + 1, 2: q, 3: q - 1, 4: q}[mode]


add(265, "台灣星鏈衛星佈署計畫", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["整數除法", "多分支條件", "植樹問題"],
    objectives=["用整數除法求間隔數", "依端點是否放置推導數量公式"],
    prerequisites=["整數除法", "if/elif"],
    lead="依佈署模式計算一段軌道需要幾顆衛星。",
    body=["沿長度 L 公里的路段，每隔 D 公里佈署一顆衛星。先求間隔數 q = L ÷ D 的整數商（不足一個間隔的剩餘距離不佈署）。",
          "模式 1（全線覆蓋）：起點與終點都佈署，共 q + 1 顆。模式 2（銜接佈署）：只有起點佈署，共 q 顆。模式 3（受限區域）：起點與終點都不佈署，共 q − 1 顆。模式 4（環繞軌道）：首尾相接的圓形軌道，共 q 顆。"],
    input_format="第一行為路段長度 L，第二行為間隔 D，第三行為模式 M（1～4）。",
    output_format="輸出一個整數，代表衛星總數。",
    constraints=["1 ≤ D ≤ L ≤ 100000", "M 為 1、2、3、4 之一"],
    hint="先畫一條線段，數數看「點」和「間隔」的數量關係。",
    solution='''
    # 思路：q = L // D 為間隔數，依模式加減端點。
    length = int(input())
    gap = int(input())
    mode = int(input())
    q = length // gap
    if mode == 1:
        print(q + 1)
    elif mode == 3:
        print(q - 1)
    else:
        print(q)
    ''', oracle=o265,
    cases=["1000\n200\n1", "1000\n200\n3", "1050\n200\n2", "800\n200\n4", "1000\n250\n2", "1\n1\n1", "1\n1\n3",
           "5\n3\n1", "5\n3\n3", "100000\n1\n4", "100000\n99999\n1", "999\n100\n3"],
    fuzz=[lines(L := R.randint(1, 2000), R.randint(1, L), R.randint(1, 4)) for _ in range(100)],
    source_ids=[58, 65], source_title="台灣星鏈 (T-Starlink) 衛星佈署計畫", categories=KM_M + KM_E,
    source_checks=[("1000\n200\n1", "6"), ("1000\n200\n3", "4"), ("1050\n200\n2", "5"), ("800\n200\n4", "4"),
                   ("1000\n250\n2", "4")],
    adaptation="合併國中版（四種模式、可有餘數）與國小版（兩種模式、整除）；明確寫出各模式公式並限制 D ≤ L。")


# 266 「一杯心情」飲料調製 -------------------------------------------------
def o266(s):
    t = s.split()
    items = list(zip(t[::2], map(int, t[1::2])))
    out = []
    for density in sorted({d for _, d in items}, reverse=True):
        out += [c for c, d in items if d == density]
    return " ".join(out)


def g266():
    codes = R.sample("BMTFJ", 5)
    return " ".join(f"{c} {R.randint(90, 130) // 10 * 10}" for c in codes)


add(266, "「一杯心情」飲料調製", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["排序", "穩定排序", "清單"],
    objectives=["依數值由大到小排序成對資料", "密度相同時保持原輸入順序（穩定排序）"],
    prerequisites=["清單", "sort 與 key", "tuple"],
    lead="依密度把五種原料由杯底到杯口排好。",
    body=["五層奶蓋茶的原料以代碼表示：B 黑糖糖漿、M 鮮奶、T 茶、F 奶蓋、J 果凍。每種原料有一個整數密度，密度大的沉在下層，密度小的浮在上層。",
          "若有多種原料密度相同，保持它們在輸入中的先後順序（先輸入的在下層）。請輸出由杯底到杯口的原料代碼。"],
    input_format="一行 10 個以空白分隔的資料，每兩個一組為原料代碼與密度，共 5 組，代碼各不相同。",
    output_format="輸出 5 個原料代碼，由杯底到杯口，以一個空白分隔。",
    constraints=["代碼為 B、M、T、F、J 之一且不重複", "1 ≤ 密度 ≤ 1000"],
    hint="Python 的 sort 是穩定排序：鍵值相同時會保留原本的順序。",
    solution='''
    # 思路：依密度由大到小做穩定排序；key 取負的密度即可保留同密度的輸入順序。
    tokens = input().split()
    items = []
    for i in range(0, len(tokens), 2):
        items.append((tokens[i], int(tokens[i + 1])))
    items.sort(key=lambda item: -item[1])
    print(" ".join(code for code, _ in items))
    ''', oracle=o266,
    cases=["B 120 J 120 T 110 M 110 F 90", "F 100 M 110 T 110 J 110 B 120", "B 100 M 110 T 120 F 130 J 140",
           "B 50 M 50 T 50 F 50 J 50", "J 1 F 2 T 3 M 4 B 5", "B 5 M 4 T 3 F 2 J 1", "T 1000 F 1 M 1000 J 1 B 500",
           "F 7 J 7 B 9 M 8 T 8", "M 30 B 30 J 40 T 20 F 40", "J 600 T 500 F 700 B 500 M 600"],
    fuzz=[g266() for _ in range(150)],
    source_ids=[59, 66], source_title="「一杯心情」飲料調製", categories=KM_M + KM_E,
    source_checks=[("B 100 M 110 T 120 F 130 J 140", "J F T M B"), ("B 50 M 50 T 50 F 50 J 50", "B M T F J"),
                   ("B 120 J 120 T 110 M 110 F 90", "B J T M F"), ("F 100 M 110 T 110 J 110 B 120", "B M T J F")],
    adaptation="合併國中版（五種原料、可同密度）與國小版（四種原料、密度不同）；依國中版資料採單行輸入。")


# 267 猜數字小幫手 ---------------------------------------------------------
def o267(s):
    x = int(s)
    lo, hi, guesses = 1, 100, []
    while True:
        mid = (lo + hi) // 2
        guesses.append(mid)
        if mid == x:
            return " ".join(map(str, guesses)) + "\n" + str(len(guesses))
        lo, hi = (mid + 1, hi) if mid < x else (lo, mid - 1)


add(267, "猜數字小幫手", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["二分搜尋", "模擬", "while 迴圈"],
    objectives=["模擬二分搜尋縮小範圍的過程", "記錄每次猜測並計算次數"],
    prerequisites=["while 迴圈", "整數除法", "清單"],
    lead="模擬用二分法猜 1～100 之間的數字，輸出每次猜的數與總次數。",
    body=["一開始範圍是 L = 1、R = 100。每次猜 mid = (L + R) ÷ 2（無條件捨去）。若 mid 小於答案 X，令 L = mid + 1；若 mid 大於 X，令 R = mid − 1；若 mid 等於 X 就停止。",
          "請依序輸出每次猜的數字，以及總共猜了幾次。"],
    input_format="一行一個整數 X，代表正確答案。",
    output_format="第一行依序輸出每次猜的數字，以一個空白分隔；第二行輸出總猜測次數。",
    constraints=["1 ≤ X ≤ 100"],
    hint="用 while True 重複猜，猜中時 break。",
    solution='''
    # 思路：維護範圍 [low, high]，每次猜中間值並依大小縮小範圍。
    x = int(input())
    low, high = 1, 100
    guesses = []
    while True:
        mid = (low + high) // 2
        guesses.append(mid)
        if mid == x:
            break
        if mid < x:
            low = mid + 1
        else:
            high = mid - 1
    print(" ".join(map(str, guesses)))
    print(len(guesses))
    ''', oracle=o267,
    cases=["75", "10", "50", "1", "100", "25", "99", "51", "49", "2", "63", "37"],
    fuzz=[str(x) for x in range(1, 101)],
    source_ids=[60, 67], source_title="猜數字小幫手", categories=KM_M + KM_E,
    source_checks=[("75", "50 75 2"), ("10", "50 25 12 6 9 10 6")],
    adaptation="合併國中版（輸出猜測過程與次數）與國小版（只輸出次數），採國中版並把猜測過程與次數分成兩行。")


# 268 風獅爺排排隊 ---------------------------------------------------------
def o268(s):
    a = ints(s)[1:]
    out, swaps = [], 0
    n = len(a)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swaps += 1
        out.append(" ".join(map(str, a)))
    return "\n".join(out + [str(swaps)])


def g268():
    n = R.randint(2, 10)
    return lines(n, [R.randint(100, 200) for _ in range(n)])


add(268, "風獅爺排排隊", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["氣泡排序", "巢狀迴圈", "模擬"],
    objectives=["實作氣泡排序並在每一輪結束後輸出序列", "統計排序過程中的交換次數"],
    prerequisites=["巢狀迴圈", "清單交換"],
    lead="用氣泡排序把風獅爺由矮到高排好，輸出每一輪的結果與交換次數。",
    body=["共有 N 尊風獅爺。每一輪從左到右比較相鄰兩尊，若左邊比右邊高就交換，交換一次計 1 次。第 1 輪比較到最後一個位置，之後每一輪少比較最右邊已排好的一個位置，共進行 N − 1 輪。",
          "即使某一輪沒有發生交換，也要照常進行並輸出該輪結果。"],
    input_format="第一行為數量 N。第二行有 N 個以空白分隔的整數，代表各尊風獅爺的身高。",
    output_format="前 N − 1 行依序輸出每一輪結束後的身高序列（以一個空白分隔）；最後一行輸出總交換次數。",
    constraints=["2 ≤ N ≤ 10", "1 ≤ 身高 ≤ 1000"],
    hint="第 i 輪（i 從 0 開始）只需要比較到索引 N − 2 − i。",
    solution='''
    # 思路：標準氣泡排序，外層 N-1 輪；每輪結束輸出序列，並累計交換次數。
    n = int(input())
    heights = list(map(int, input().split()))
    swaps = 0
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if heights[j] > heights[j + 1]:
                heights[j], heights[j + 1] = heights[j + 1], heights[j]
                swaps += 1
        print(" ".join(map(str, heights)))
    print(swaps)
    ''', oracle=o268,
    cases=["4\n150 120 180 110", "5\n160 140 170 130 150", "4\n150 120 110 100", "4\n120 110 140 130", "2\n1 2", "2\n2 1",
           "3\n5 5 5", "10\n10 9 8 7 6 5 4 3 2 1", "10\n1 2 3 4 5 6 7 8 9 10", "6\n3 1 3 1 3 1"],
    fuzz=[g268() for _ in range(100)],
    source_ids=[61, 68], source_title="風獅爺排排隊", categories=KM_M + KM_E,
    source_checks=[("4\n150 120 180 110", "120 150 110 180 120 110 150 180 110 120 150 180 4"),
                   ("5\n160 140 170 130 150", "140 160 130 150 170 140 130 150 160 170 130 140 150 160 170 130 140 150 160 170 6")],
    adaptation="合併國中版（輸出每一輪結果）與國小版（只輸出排序結果與交換次數），採國中版；國小版兩組範例的最終序列與交換次數（6、2）與本題最後兩行一致，並收入測資。")


# 269 金門坑道參觀系統 -----------------------------------------------------
def o269(s):
    state, count = "IDLE", 0
    for c in s.split("\n")[1].split():
        if state == "END":
            break
        if state == "IDLE" and c == "S":
            state, count = "OPEN", count + 1
        elif state == "OPEN" and c == "P":
            state = "PAUSED"
        elif state == "PAUSED" and c == "R":
            state = "OPEN"
        elif state in ("OPEN", "PAUSED") and c == "E":
            state = "END"
    return f"{state} {count}"


def g269():
    n = R.randint(1, 10)
    return lines(n, [R.choice("SPRE") for _ in range(n)])


add(269, "金門坑道參觀系統", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["狀態機", "模擬", "多分支條件"],
    objectives=["用變數記錄目前狀態並依指令轉換", "在結束狀態後忽略之後的指令"],
    prerequisites=["字串比較", "if/elif", "break"],
    lead="依指令模擬坑道參觀系統的狀態轉換，輸出最終狀態與開放次數。",
    body=["系統有四種狀態：<code>IDLE</code>（未開放，起始狀態）、<code>OPEN</code>（參觀中）、<code>PAUSED</code>（暫停）、<code>END</code>（已結束）。指令有 S（開始）、P（暫停）、R（恢復）、E（結束）。",
          "IDLE 收到 S 轉為 OPEN，並記一次開放參觀；OPEN 收到 P 轉為 PAUSED，收到 E 轉為 END；PAUSED 收到 R 轉為 OPEN，收到 E 轉為 END。其他情況狀態不變。進入 END 後，後續指令都不處理。"],
    input_format="第一行為指令數 N。第二行有 N 個以空白分隔的大寫字母（S、P、R、E）。",
    output_format="輸出最終狀態與開放次數，以一個空白分隔，例如 <code>END 1</code>。",
    constraints=["1 ≤ N ≤ 100"],
    hint="IDLE 狀態下收到 E 不會結束，因為規則只允許 OPEN 或 PAUSED 收到 E 時結束。",
    solution='''
    # 思路：以字串記錄狀態，依「目前狀態＋指令」決定下一個狀態；END 後停止處理。
    n = int(input())
    commands = input().split()
    state = "IDLE"
    count = 0
    for c in commands:
        if state == "END":
            break
        if state == "IDLE":
            if c == "S":
                state = "OPEN"
                count += 1
        elif state == "OPEN":
            if c == "P":
                state = "PAUSED"
            elif c == "E":
                state = "END"
        elif state == "PAUSED":
            if c == "R":
                state = "OPEN"
            elif c == "E":
                state = "END"
    print(state, count)
    ''', oracle=o269,
    cases=["5\nS P R P E", "6\nP S S P R E", "1\nE", "1\nS", "2\nS P", "3\nS P R", "3\nE S E", "4\nS E S P",
           "5\nR P E R S", "6\nS P P R R P"],
    fuzz=[g269() for _ in range(150)],
    source_ids=[62], source_title="金門坑道參觀系統", categories=KM_M,
    source_checks=[("5\nS P R P E", "END 1"), ("6\nP S S P R E", "END 1")],
    adaptation="整理狀態轉換規則，補上 IDLE 收到 E、結束後仍有指令等測資。")


# 270 金門坑道開關管理 -----------------------------------------------------
def o270(s):
    is_open, count = False, 0
    for c in s.split("\n")[1].split():
        if c == "O" and not is_open:
            count += 1
        is_open = c == "O"
    return f"{'OPEN' if is_open else 'CLOSED'} {count}"


add(270, "金門坑道開關管理", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["模擬", "布林變數", "條件判斷"],
    objectives=["用布林變數記錄開關狀態", "只在狀態由關閉變為開啟時計數"],
    prerequisites=["布林值", "if/else", "迴圈"],
    lead="依開關指令模擬坑道狀態，輸出最終狀態與成功開放的次數。",
    body="坑道一開始是 <code>CLOSED</code>。指令 O 代表開啟、C 代表關閉。關閉時收到 O 會轉為 <code>OPEN</code>，並記錄一次成功開放；開啟時收到 C 會轉為 <code>CLOSED</code>；其他情況狀態不變。請輸出最終狀態與成功開放的總次數。",
    input_format="第一行為指令數 N。第二行有 N 個以空白分隔的大寫字母（O 或 C）。",
    output_format="輸出最終狀態（<code>OPEN</code> 或 <code>CLOSED</code>）與成功開放次數，以一個空白分隔。",
    constraints=["1 ≤ N ≤ 100"],
    hint="已經開著時再收到 O，不算一次新的開放。",
    solution='''
    # 思路：用 is_open 記錄狀態；關閉狀態收到 O 才計數。
    # 積木對照：狀態設為關 → 對每個指令：如果是 O 且目前關閉，次數加一 → 依指令設定狀態 → 說出狀態與次數。
    n = int(input())
    commands = input().split()
    is_open = False
    count = 0
    for c in commands:
        if c == "O":
            if not is_open:
                count += 1
            is_open = True
        else:
            is_open = False
    print("OPEN" if is_open else "CLOSED", count)
    ''', oracle=o270,
    cases=["5\nO C O O C", "4\nC O C C", "1\nO", "1\nC", "3\nO O O", "4\nO C O C", "5\nC C C C O", "6\nO C O C O C",
           "2\nC O", "7\nO O C C O O O"],
    fuzz=[lines(n := R.randint(1, 12), [R.choice("OC") for _ in range(n)]) for _ in range(100)],
    source_ids=[69], source_title="金門坑道開關管理", categories=KM_E,
    source_checks=[("5\nO C O O C", "CLOSED 2"), ("4\nC O C C", "CLOSED 1")],
    adaptation="整理狀態轉換規則，補上最終為開啟、連續重複指令的測資。")


# 271 貨物重量計費 ---------------------------------------------------------
def o271(s):
    w = int(s)
    return sum(rate for kg in range(1, w + 1)
               for lo, hi, rate in [(0, 10, 30), (10, 30, 25), (30, 50, 20), (50, 10 ** 9, 15)] if lo < kg <= hi)


add(271, "貨物重量計費", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["累進計算", "多分支條件"],
    objectives=["把重量拆成不同級距分段計費", "處理剛好在級距邊界的重量"],
    prerequisites=["if/elif", "四則運算"],
    lead="依累進費率計算寄送貨物的運費。",
    body="運費採累進計算：前 10 公斤每公斤 30 元；超過 10 公斤到 30 公斤的部分每公斤 25 元；超過 30 公斤到 50 公斤的部分每公斤 20 元；超過 50 公斤的部分每公斤 15 元。例如 32 公斤的運費為 10 × 30 + 20 × 25 + 2 × 20 = 840 元。",
    input_format="一行一個整數 w，代表貨物重量（公斤）。",
    output_format="輸出一個整數，代表運費（元）。",
    constraints=["0 ≤ w ≤ 10000"],
    hint="從最高級距開始扣：超過 50 的部分先算，再把重量設為 50，依此類推。",
    solution='''
    # 思路：由高級距往低級距逐段計費。
    w = int(input())
    cost = 0
    if w > 50:
        cost += (w - 50) * 15
        w = 50
    if w > 30:
        cost += (w - 30) * 20
        w = 30
    if w > 10:
        cost += (w - 10) * 25
        w = 10
    cost += w * 30
    print(cost)
    ''', oracle=o271,
    cases=["6", "32", "0", "1", "10", "11", "30", "31", "50", "51", "10000", "45"],
    fuzz=[str(R.randint(0, 200)) for _ in range(100)],
    source_ids=[70], source_title="貨物重量計費", categories=HC_M,
    source_checks=[("6", "180"), ("32", "840")],
    adaptation="以計算範例說明累進方式，補上各級距端點與 0 公斤的測資。")


# 272 想去遊樂園 -----------------------------------------------------------
def o272(s):
    ages = ints(s)[1:]
    seniors = sum(a >= 65 for a in ages)
    small = sorted(a for a in ages if a <= 6)
    free = min(seniors, len(small))
    big = 0
    for a in ages:
        big += 299 if a <= 12 else 599
    big -= 299 * free
    seven = sum(0 if a % 7 == 0 else 299 if a <= 9 else 499 for a in ages)
    if big < seven:
        return f"大人國 {big}"
    if seven < big:
        return f"七福村 {seven}"
    return f"一樣 {big}"


def g272():
    n = R.randint(1, 8)
    return lines(n, [R.choice([R.randint(1, 6), R.randint(7, 12), R.randint(13, 64), R.randint(65, 90), 7, 14, 70])
                     for _ in range(n)])


add(272, "想去遊樂園", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["多分支條件", "計數", "比較"],
    objectives=["依不同規則分別計算兩種方案的總價", "處理「一位長者帶一位幼童免費」的配對優惠"],
    prerequisites=["if/elif", "min 函式", "取餘數"],
    lead="比較兩間遊樂園的總票價，輸出較便宜的一間與金額。",
    body=["大人國：13 歲以上（含 65 歲以上長者）全票 599 元，12 歲以下半票 299 元。祖孫樂優惠：每一位 65 歲以上長者可免費帶一位 6 歲以下兒童。",
          "七福村：年齡為 7 的倍數者免費；其餘 10 歲以上全票 499 元，9 歲以下半票 299 元。請分別算出全家在兩間的總價，輸出較便宜的園名與金額；若金額相同，輸出 <code>一樣</code> 與金額。"],
    input_format="第一行為同行人數 N。第二行有 N 個以空白分隔的整數，代表每位同行者的年齡。",
    output_format="輸出園名（<code>大人國</code>、<code>七福村</code> 或 <code>一樣</code>）與金額，以一個空白分隔。",
    constraints=["1 ≤ N ≤ 100", "1 ≤ 年齡 ≤ 120"],
    hint="大人國能免費的兒童數 = min(65 歲以上人數, 6 歲以下人數)。",
    solution='''
    # 思路：分別計算兩園總價；大人國先照年齡收費，再扣掉可配對的免費兒童。
    n = int(input())
    ages = list(map(int, input().split()))
    big = 0
    seniors = kids = 0
    for a in ages:
        big += 299 if a <= 12 else 599
        if a >= 65:
            seniors += 1
        if a <= 6:
            kids += 1
    big -= 299 * min(seniors, kids)
    seven = 0
    for a in ages:
        if a % 7 == 0:
            continue
        seven += 299 if a <= 9 else 499
    if big < seven:
        print("大人國", big)
    elif seven < big:
        print("七福村", seven)
    else:
        print("一樣", big)
    ''', oracle=o272,
    cases=["3\n70 5 10", "4\n65 5 10 12", "1\n7", "1\n30", "1\n12", "2\n65 6", "2\n65 7", "3\n80 3 4", "4\n66 67 2 3",
           "2\n13 9", "5\n35 70 14 21 28", "3\n64 6 1"],
    fuzz=[g272() for _ in range(150)],
    source_ids=[71], source_title="想去遊樂園", categories=HC_M,
    source_checks=[("3\n70 5 10", "七福村 798"), ("4\n65 5 10 12", "大人國 1197")],
    adaptation="明定各票種年齡界線、祖孫樂為一對一配對，並補上兩園同價時的輸出。")


# 273 我是神箭手 -----------------------------------------------------------
def o273(s):
    wind, dist = ints(s)
    x = -wind * (dist // 10)
    y = dist // 8
    return f"{x} {y}"


add(273, "我是神箭手", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["整數除法", "正負數", "座標"],
    objectives=["用整數除法計算完整距離段數", "依偏移方向反向修正瞄準點"],
    prerequisites=["整數除法", "負數運算"],
    lead="考慮重力與風力，計算弓箭手應瞄準的座標。",
    body=["靶心位於 (0, 0)，單位為公分。距離每滿 8 公尺，箭會往下掉 1 公分；距離每滿 10 公尺，箭會往風吹的方向偏移「風速」公分（風速為正往右、為負往左），未滿的部分不計。",
          "為了讓箭剛好命中靶心，瞄準點要抵銷這些偏移：水平座標 x 與風力偏移方向相反，垂直座標 y 往上補足掉落量。請輸出瞄準點座標。"],
    input_format="第一行為風速（整數，可為負數或 0），第二行為距離（公尺，正整數）。",
    output_format="輸出兩個以空白分隔的整數 x y。",
    constraints=["−20 ≤ 風速 ≤ 20", "1 ≤ 距離 ≤ 1000"],
    hint="例如風速 3、距離 24 公尺：風力偏移 2 次共往右 6 公分，所以要往左瞄 6 公分。",
    solution='''
    # 思路：水平修正 = -(風速 × 完整 10 公尺段數)，垂直修正 = 完整 8 公尺段數。
    wind = int(input())
    distance = int(input())
    x = -wind * (distance // 10)
    y = distance // 8
    print(x, y)
    ''', oracle=o273,
    cases=["3\n24", "5\n40", "0\n100", "-2\n35", "-20\n1000", "20\n1000", "1\n7", "1\n8", "1\n9", "-1\n10", "4\n79", "-3\n80"],
    fuzz=[lines(R.randint(-20, 20), R.randint(1, 1000)) for _ in range(120)],
    source_ids=[72], source_title="我是神箭手", categories=HC_M,
    source_checks=[("3\n24", "-6 3"), ("5\n40", "-20 5")],
    adaptation="說明瞄準點是抵銷偏移的方向，補上風速為 0、負風速與未滿 8／10 公尺的測資。")


# 274 會員入場統計 ---------------------------------------------------------
GROUPS = [("普通會員", {"A": 11, "B": 13, "C": 15}), ("貴賓會員", {"V": 17, "I": 19, "P": 21}),
          ("學生會員", {"S": 23, "T": 25, "U": 27})]


def o274(s):
    cards = s.split("\n")[1].split()
    counts = [0, 0, 0]
    for card in cards:
        for g, (_, table) in enumerate(GROUPS):
            if card[0] in table and (table[card[0]] + sum(map(int, card[1:]))) % 10 in (0, 1):
                counts[g] += 1
    if max(counts) == 0:
        return "無"
    return " ".join(GROUPS[g][0] for g in range(3) if counts[g] == max(counts))


def g274():
    n = R.randint(1, 8)
    return lines(n, ["".join([R.choice("ABCVIPSTU")] + [str(R.randint(0, 9)) for _ in range(5)]) for _ in range(n)])


add(274, "會員入場統計", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["字串", "取餘數", "計數"],
    objectives=["驗證卡號檢查碼並分類計數", "輸出所有並列最多的類別"],
    prerequisites=["字典", "字串走訪", "max"],
    lead="驗證會員卡號，統計合法入場人數最多的會員類別。",
    body=["卡號由 1 個英文字母、4 個數字與 1 個檢查碼共 6 碼組成。字母對應的數字為：普通會員 A=11、B=13、C=15；貴賓會員 V=17、I=19、P=21；學生會員 S=23、T=25、U=27。",
          "總和值 = 字母對應數字 + 後面 5 個數字。總和值除以 10 的餘數為 0 或 1 的卡號才合法。請統計合法卡號中各類別的人數，輸出人數最多的類別；若並列最多，依「普通會員、貴賓會員、學生會員」的順序全部輸出。若沒有任何合法卡號，輸出 <code>無</code>。"],
    input_format="第一行為卡號數 N。第二行有 N 個以空白分隔的 6 碼卡號。",
    output_format="輸出類別名稱，多個時以一個空白分隔；或輸出 <code>無</code>。",
    constraints=["1 ≤ N ≤ 100", "卡號第一碼為上述 9 個字母之一，其餘為數字"],
    hint="用字典記錄每個字母對應的數字與所屬類別。",
    solution='''
    # 思路：查表取得字母數值與類別，驗證餘數後計數；最後輸出所有等於最大值的類別。
    letter_value = {"A": 11, "B": 13, "C": 15, "V": 17, "I": 19, "P": 21, "S": 23, "T": 25, "U": 27}
    letter_group = {"A": 0, "B": 0, "C": 0, "V": 1, "I": 1, "P": 1, "S": 2, "T": 2, "U": 2}
    names = ["普通會員", "貴賓會員", "學生會員"]
    n = int(input())
    cards = input().split()
    counts = [0, 0, 0]
    for card in cards:
        total = letter_value[card[0]] + sum(int(d) for d in card[1:])
        if total % 10 in (0, 1):
            counts[letter_group[card[0]]] += 1
    best = max(counts)
    if best == 0:
        print("無")
    else:
        print(" ".join(names[i] for i in range(3) if counts[i] == best))
    ''', oracle=o274,
    cases=["2\nS11114 T00007", "3\nA12347 V00003 S11113", "1\nA00000", "1\nA00009", "3\nB00007 I00001 U00003",
           "2\nC00005 C00006", "4\nA00009 B00007 V00003 P00009", "3\nT00005 S00007 U00004", "2\nA12345 V12345",
           "5\nB00007 A00008 S11113 S11114 I00002"],
    fuzz=[g274() for _ in range(150)],
    source_ids=[73], source_title="會員入場統計", categories=HC_M,
    source_checks=[("2\nS11114 T00007", "學生會員"), ("3\nA12347 V00003 S11113", "貴賓會員 學生會員")],
    adaptation="補上沒有合法卡號時輸出「無」的規則，以及三類並列的測資。")


# 275 買五送一 -------------------------------------------------------------
def o275(s):
    prices = sorted(ints(s)[1:], reverse=True)
    return sum(p for i, p in enumerate(prices, 1) if i % 6)


add(275, "買五送一", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["排序", "取餘數", "累加"],
    objectives=["將價格由高到低排序", "用位置的餘數找出免費的杯數"],
    prerequisites=["sort", "enumerate", "取餘數"],
    lead="依「每滿 6 杯第 6 杯免費」的規則計算飲料總價。",
    body="把所有飲料依價格由高到低排列，第 6、12、18……杯免費，其餘照價計算。請輸出應付的總金額。",
    input_format="第一行為杯數 N。第二行有 N 個以空白分隔的整數，代表每杯飲料的價格。",
    output_format="輸出一個整數，代表應付總金額。",
    constraints=["1 ≤ N ≤ 100", "1 ≤ 價格 ≤ 1000"],
    hint="排序後第 i 杯（從 1 開始數）若 i 除以 6 的餘數為 0 就免費。",
    solution='''
    # 思路：由高到低排序後，跳過第 6、12、18... 杯。
    n = int(input())
    prices = sorted(map(int, input().split()), reverse=True)
    total = 0
    for i in range(n):
        if (i + 1) % 6 != 0:
            total += prices[i]
    print(total)
    ''', oracle=o275,
    cases=["6\n80 70 60 50 40 30", "9\n30 30 30 30 30 40 40 40 40", "1\n50", "5\n10 20 30 40 50", "6\n1 1 1 1 1 1",
           "12\n" + " ".join(map(str, range(1, 13))), "7\n100 1 100 1 100 1 100", "13\n" + " ".join(["1000"] * 13),
           "6\n30 40 50 60 70 80", "11\n5 9 3 7 1 8 2 6 4 10 11"],
    fuzz=[lines(n := R.randint(1, 20), [R.randint(1, 100) for _ in range(n)]) for _ in range(100)],
    source_ids=[74], source_title="買五送一", categories=HC_M,
    source_checks=[("6\n80 70 60 50 40 30", "300"), ("9\n30 30 30 30 30 40 40 40 40", "280")],
    adaptation="整理題意，補上不足 6 杯、剛好 12 杯與輸入未排序的測資。")


# 276 歡樂抽獎 -------------------------------------------------------------
def o276(s):
    t = ints(s)
    red, whites = t[0], t[1:4]
    names = ["特獎", "頭獎", "二獎", "三獎"]
    for k in range(4):
        if any((red + sum(c)) % 7 == 0 for c in itertools.combinations(whites, k)):
            return names[k]
    return "未中獎"


add(276, "歡樂抽獎", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["枚舉", "組合", "取餘數"],
    objectives=["依使用球數由少到多枚舉所有組合", "以取餘數判斷 7 的倍數"],
    prerequisites=["巢狀迴圈", "取餘數", "布林旗標"],
    lead="判斷紅球搭配白球能否湊出 7 的倍數，以及能得到的最高獎項。",
    body=["每位同學有 1 顆紅球與 3 顆白球，球上各有一個 0～9 的整數。紅球一定要使用，白球可選 0～3 顆，所選球的數字總和為 7 的倍數即中獎（0 也是 7 的倍數）。",
          "使用的白球越少獎項越好：不用白球為 <code>特獎</code>、1 顆為 <code>頭獎</code>、2 顆為 <code>二獎</code>、3 顆為 <code>三獎</code>；都無法組成則為 <code>未中獎</code>。請輸出能得到的最好獎項。"],
    input_format="第一行為紅球數字 R。第二行為三顆白球的數字，以空白分隔。",
    output_format="輸出 <code>特獎</code>、<code>頭獎</code>、<code>二獎</code>、<code>三獎</code> 或 <code>未中獎</code>。",
    constraints=["0 ≤ 每顆球的數字 ≤ 9"],
    hint="1 顆白球有 3 種選法、2 顆白球也有 3 種選法，3 顆只有 1 種。",
    solution='''
    # 思路：依白球數 0、1、2、3 的順序檢查所有選法，第一個成立的即為最佳獎項。
    red = int(input())
    a, b, c = map(int, input().split())
    if red % 7 == 0:
        print("特獎")
    elif (red + a) % 7 == 0 or (red + b) % 7 == 0 or (red + c) % 7 == 0:
        print("頭獎")
    elif (red + a + b) % 7 == 0 or (red + a + c) % 7 == 0 or (red + b + c) % 7 == 0:
        print("二獎")
    elif (red + a + b + c) % 7 == 0:
        print("三獎")
    else:
        print("未中獎")
    ''', oracle=o276,
    cases=["2\n6 4 2", "8\n3 2 5", "0\n1 1 1", "7\n1 2 3", "1\n6 1 1", "1\n2 2 4", "1\n9 1 1", "3\n1 1 2", "9\n9 9 9",
           "5\n1 1 1", "4\n2 2 2", "6\n0 0 0"],
    fuzz=[lines(R.randint(0, 9), [R.randint(0, 9) for _ in range(3)]) for _ in range(200)],
    source_ids=[75], source_title="歡樂抽獎", categories=HC_M,
    source_checks=[("2\n6 4 2", "三獎"), ("8\n3 2 5", "未中獎")],
    adaptation="明定 0 為 7 的倍數，補上各種獎項與數字 0 的測資。")


# 277 考試座位安排 ---------------------------------------------------------
def o277(s):
    n, m, k = ints(s)
    seat = 0
    for row in range(1, n + 1):
        for col in range(1, m + 1):
            seat += 1
            if seat == k:
                return f"{row} {col}"


add(277, "考試座位安排", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["整除與餘數", "座標"],
    objectives=["用整除與餘數把座號換成排與位置"],
    prerequisites=["整數除法", "取餘數"],
    lead="依座號算出學生坐在第幾排第幾個位子。",
    body="教室有 N 排，每排 M 個位子。學生依座號 1、2、3……依序就座，先坐滿第 1 排（由左到右），再坐第 2 排，依此類推。請輸出座號 K 的學生坐在第幾排的第幾個位子。",
    input_format="第一行為兩個整數 N M。第二行為座號 K。",
    output_format="輸出兩個以空白分隔的整數：排數與該排的位置。",
    constraints=["1 ≤ N、M ≤ 100", "1 ≤ K ≤ N × M"],
    hint="把座號減 1 之後，用整除求排、用餘數求位置，最後各加 1。",
    solution='''
    # 思路：(K - 1) // M 為從 0 起算的排，(K - 1) % M 為從 0 起算的位置。
    # 積木對照：讀入 N、M、K → 排 = 向下取整((K-1)/M) + 1 → 位 = (K-1) 除以 M 的餘數 + 1 → 說出。
    n, m = map(int, input().split())
    k = int(input())
    print((k - 1) // m + 1, (k - 1) % m + 1)
    ''', oracle=o277,
    cases=["5 4\n7", "3 5\n13", "1 1\n1", "1 100\n100", "100 1\n100", "100 100\n10000", "5 4\n4", "5 4\n5", "5 4\n20",
           "7 3\n11"],
    fuzz=[lines([n := R.randint(1, 30), m := R.randint(1, 30)], R.randint(1, n * m)) for _ in range(150)],
    source_ids=[76], source_title="考試座位安排", categories=HC_E,
    source_checks=[("5 4\n7", "2 3"), ("3 5\n13", "3 3")],
    adaptation="整理題意，補上單排、單欄與每排最後一個位子的測資。")


# 278 智慧氣候監測系統：氣溫變動分析 ---------------------------------------
def o278(s):
    temps = sorted(ints(s)[1:])
    return temps[-1] - temps[0]


add(278, "智慧氣候監測系統：氣溫變動分析", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["最大值", "最小值", "清單"],
    objectives=["找出一組資料的最大值與最小值", "計算全距"],
    prerequisites=["清單", "max/min 或迴圈比較"],
    lead="計算一天氣溫資料的全距（最高溫減最低溫）。",
    body="感測器回傳 N 筆整數氣溫（可為正數、0 或負數）。請找出最高溫與最低溫，輸出兩者的差。",
    input_format="第一行為資料筆數 N。第二行有 N 個以空白分隔的整數。",
    output_format="輸出一個整數，代表全距。",
    constraints=["1 ≤ N ≤ 1000", "−100 ≤ 氣溫 ≤ 100"],
    hint="只有一筆資料時，最高溫與最低溫相同。",
    solution='''
    # 思路：逐一比較找出最大值與最小值，再相減。
    # 積木對照：最大、最小都設為第一筆 → 對每筆：比最大大就更新、比最小小就更新 → 說出 最大 - 最小。
    n = int(input())
    temps = list(map(int, input().split()))
    highest = lowest = temps[0]
    for t in temps:
        if t > highest:
            highest = t
        if t < lowest:
            lowest = t
    print(highest - lowest)
    ''', oracle=o278,
    cases=["5\n10 50 30 20 40", "6\n5 8 12 3 9 3", "1\n7", "1\n-100", "2\n-100 100", "3\n0 0 0", "4\n-5 -1 -9 -3",
           "5\n100 99 98 97 100", "6\n-20 15 0 33 -7 8", "3\n1 -1 0"],
    fuzz=[lines(n := R.randint(1, 30), [R.randint(-100, 100) for _ in range(n)]) for _ in range(100)],
    source_ids=[77], source_title="智慧氣候監測系統 —— 氣溫變動分析", categories=HC_E,
    source_checks=[("5\n10 50 30 20 40", "40"), ("6\n5 8 12 3 9 3", "9")],
    adaptation="刪去與解題無關的抽象化說明，補上負溫度與單筆資料的範圍與測資。")


# 279 快遞物流中心分類系統 -------------------------------------------------
def o279(s):
    w = ints(s)[1:]
    return " ".join(map(str, sorted(x for x in w if x % 2) + sorted((x for x in w if x % 2 == 0), reverse=True)))


add(279, "快遞物流中心分類系統", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["排序", "取餘數", "清單"],
    objectives=["依奇偶把資料分成兩組", "兩組分別以不同方向排序後合併"],
    prerequisites=["清單", "sort", "取餘數"],
    lead="依重量的奇偶與輕重規則，排出包裹的裝車順序。",
    body="奇數重量的包裹先裝車，且由輕到重；偶數重量（含 0）的包裹後裝車，且由重到輕。請輸出裝車順序。",
    input_format="第一行為包裹數 N。第二行有 N 個以空白分隔的整數，代表每個包裹的重量。",
    output_format="輸出一行裝車順序的重量，以一個空白分隔。",
    constraints=["1 ≤ N ≤ 50", "0 ≤ 重量 ≤ 100"],
    hint="先分成兩個清單，各自排序後再接起來。",
    solution='''
    # 思路：奇數清單遞增排序、偶數清單遞減排序，再接在一起。
    n = int(input())
    weights = list(map(int, input().split()))
    odd = sorted(w for w in weights if w % 2 == 1)
    even = sorted((w for w in weights if w % 2 == 0), reverse=True)
    print(" ".join(map(str, odd + even)))
    ''', oracle=o279,
    cases=["6\n5 12 3 8 7 10", "8\n15 20 11 6 9 14 2 13", "1\n0", "1\n7", "4\n1 3 5 7", "4\n2 4 6 8", "5\n0 100 1 99 50",
           "6\n5 5 4 4 3 3", "3\n10 1 0", "7\n9 8 7 6 5 4 3"],
    fuzz=[lines(n := R.randint(1, 20), [R.randint(0, 100) for _ in range(n)]) for _ in range(100)],
    source_ids=[78], source_title="快遞物流中心分類系統", categories=HC_E,
    source_checks=[("6\n5 12 3 8 7 10", "3 5 7 12 10 8"), ("8\n15 20 11 6 9 14 2 13", "9 11 13 15 20 14 6 2")],
    adaptation="精簡題意，明定 0 屬於偶數，補上全奇、全偶與重複重量的測資。")


# 280 寶可夢聯盟大挑戰 -----------------------------------------------------
def o280(s):
    t = s.split()
    mons = []
    for i in range(int(t[0])):
        name, a, d = t[1 + 3 * i], int(t[2 + 3 * i]), int(t[3 + 3 * i])
        bonus = 2 if a > d else 3 if a == d else 1
        mons.append(((a + d) * bonus, name, a, d))
    power, name, a, d = sorted(mons, reverse=True)[1]
    return f"{name} {a} {d} {power}"


def g280():
    names = R.sample(["皮卡丘", "小火龍", "傑尼龜", "伊布", "妙蛙種子", "波波", "可達鴨", "喵喵", "卡比獸", "胖丁"], R.randint(2, 8))
    while True:
        rows = [(n, R.randint(1, 30), R.randint(1, 30)) for n in names]
        powers = [(a + d) * (2 if a > d else 3 if a == d else 1) for _, a, d in rows]
        if len(set(powers)) == len(powers):
            return "\n".join([str(len(rows))] + [f"{n} {a} {d}" for n, a, d in rows])


add(280, "寶可夢聯盟大挑戰", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["多分支條件", "排序", "第二大值"],
    objectives=["依條件決定加成倍率並計算戰鬥力", "找出第二大的值並輸出對應資料"],
    prerequisites=["if/elif", "清單", "sort"],
    lead="計算每隻寶可夢的戰鬥力，派出戰鬥力第二高的寶可夢。",
    body=["戰鬥力 =（攻擊力 + 防禦力）× 戰技加成。攻擊力大於防禦力時加成為 2，相等時為 3，小於時為 1。",
          "請輸出戰鬥力第二高的寶可夢的名稱、攻擊力、防禦力與戰鬥力。保證每隻寶可夢的戰鬥力都不相同。"],
    input_format="第一行為寶可夢數量 N。接下來 N 行，每行為「名稱 攻擊力 防禦力」，以空白分隔。",
    output_format="輸出一行四個欄位：名稱 攻擊力 防禦力 戰鬥力，以一個空白分隔。",
    constraints=["2 ≤ N ≤ 100", "1 ≤ 攻擊力、防禦力 ≤ 100", "名稱不含空白，長度 ≤ 20", "戰鬥力互不相同"],
    hint="把（戰鬥力, 名稱, 攻擊力, 防禦力）放進清單由大到小排序，第二個就是答案。",
    solution='''
    # 思路：計算每隻的戰鬥力後由大到小排序，取第 2 名。讀取時以所有空白分隔的字詞處理，換行或同一行都可。
    import sys

    tokens = sys.stdin.read().split()
    n = int(tokens[0])
    team = []
    for i in range(n):
        name = tokens[1 + 3 * i]
        attack = int(tokens[2 + 3 * i])
        defense = int(tokens[3 + 3 * i])
        if attack > defense:
            bonus = 2
        elif attack == defense:
            bonus = 3
        else:
            bonus = 1
        team.append(((attack + defense) * bonus, name, attack, defense))
    team.sort(reverse=True)
    power, name, attack, defense = team[1]
    print(name, attack, defense, power)
    ''', oracle=o280,
    cases=["4\n皮卡丘 10 5\n小火龍 7 7\n傑尼龜 6 9\n伊布 8 8", "5\n妙蛙種子 6 6\n波波 5 3\n可達鴨 4 7\n尼多力諾 9 4\n喵喵 3 3",
           "2\n甲 1 1\n乙 2 1", "2\n甲 100 100\n乙 100 99", "3\n甲 1 100\n乙 100 1\n丙 50 50", "3\n甲 5 6\n乙 6 5\n丙 3 9",
           "4\n卡比獸 90 90\n胖丁 1 2\n快龍 99 98\n超夢 100 100", "3\nA 10 20\nB 20 10\nC 15 15",
           "5\n一號 1 2\n二號 2 3\n三號 3 4\n四號 4 5\n五號 5 7", "3\n大 100 1\n中 50 49\n小 1 100"],
    fuzz=[g280() for _ in range(100)],
    source_ids=[79], source_title="寶可夢聯盟大挑戰", categories=HC_E,
    source_checks=[("4\n皮卡丘 10 5 小火龍 7 7 傑尼龜 6 9 伊布 8 8", "小火龍 7 7 42"),
                   ("5\n妙蛙種子 6 6 波波 5 3 可達鴨 4 7 尼多力諾 9 4 喵喵 3 3", "尼多力諾 9 4 26")],
    adaptation="依題目說明採每行一隻寶可夢的輸入，將 N 下限改為 2 以確保有第二名；原站單行資料以同一份解答核對。")


# 281 省電大作戰 -----------------------------------------------------------
def o281(s):
    need = ints(s)[1:]
    n = len(need)
    INF = float("inf")
    off, on = 0, INF  # 上一小時結束時冷氣關／開的最小耗電
    for h in range(n):
        new_on = min(on + 1, off + 6)
        new_off = INF if need[h] else min(off, on)
        off, on = new_off, new_on
    return min(off, on)


def g281():
    n = R.randint(1, 15)
    return lines(n, [R.choice([0, 0, 1]) for _ in range(n)])


add(281, "省電大作戰", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["貪心", "連段", "模擬"],
    objectives=["分析兩段使用時間之間的空檔該關機或保持開機", "以 min(空檔長度, 5) 比較兩種成本"],
    prerequisites=["清單", "迴圈", "min 函式"],
    lead="安排冷氣開關，在需要時都有冷氣的前提下，求一天最少耗電。",
    body=["一天有 N 個小時，1 代表該小時小明在房間、冷氣必須開著；0 代表不在房間，可關機也可保持開機。冷氣開著的每個小時耗 1 度電；每次從關機變成開機需額外耗 5 度電；關機不耗電。一開始冷氣是關著的。",
          "請計算在所有標示 1 的小時都開著冷氣的情況下，一整天最少耗多少度電。"],
    input_format="第一行為時數 N。第二行有 N 個以空白分隔的 0 或 1。",
    output_format="輸出一個整數，代表最少耗電度數。",
    constraints=["1 ≤ N ≤ 100"],
    hint="兩段 1 之間有 g 個 0：保持開機要多花 g 度，關掉再開要多花 5 度。",
    solution='''
    # 思路：第一次開機需 5 度；每個 1 耗 1 度；相鄰兩段 1 之間的 g 個 0 取 min(g, 5)；開頭與結尾的 0 一律關機。
    n = int(input())
    need = list(map(int, input().split()))
    ones = [i for i in range(n) if need[i] == 1]
    if not ones:
        print(0)
    else:
        total = 5 + len(ones)
        for a, b in zip(ones, ones[1:]):
            gap = b - a - 1
            total += min(gap, 5)
        print(total)
    ''', oracle=o281,
    cases=["5\n1 1 1 1 1", "8\n1 0 0 1 0 1 0 0", "1\n0", "1\n1", "5\n0 0 0 0 0", "7\n1 0 0 0 0 0 1", "8\n1 0 0 0 0 0 0 1",
           "9\n0 1 0 0 0 0 1 0 0", "12\n1 0 1 0 0 0 0 0 0 0 1 1", "6\n0 0 1 0 0 0"],
    fuzz=[g281() for _ in range(200)],
    source_ids=[80], source_title="省電大作戰", categories=HC_E,
    source_checks=[("5\n1 1 1 1 1", "10"), ("8\n1 0 0 1 0 1 0 0", "11")],
    adaptation="明定冷氣一開始為關機；oracle 以開／關兩種狀態的動態規劃驗證貪心解。")


# 282 數位顯示器 -----------------------------------------------------------
SEGMENTS = [6, 2, 5, 5, 4, 5, 6, 3, 7, 6]


def o282(s):
    n = int(s)
    values = [d for d in range(10) if SEGMENTS[d] == n]
    values += [10 * a + b for a in range(1, 10) for b in range(10) if a != b and SEGMENTS[a] + SEGMENTS[b] == n]
    return max(values) if values else -1


add(282, "數位顯示器", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["枚舉", "查表", "最大值"],
    objectives=["用清單記錄每個數字需要的燈條數", "枚舉所有一位數與兩位數找出最大值"],
    prerequisites=["清單索引", "巢狀迴圈", "條件判斷"],
    lead="用剛好 N 條 LED 燈條組成最大的一位數或兩位數。",
    body=["七段顯示器顯示數字 0～9 所需的燈條數依序為：6、2、5、5、4、5、6、3、7、6（例如 1 需要 2 條、8 需要 7 條）。",
          "請用剛好 N 條燈條組成一個最大的數，規則為：最多兩位數；兩位數的兩個數字不能相同；不可有前導零（一位數 0 可以）。若無法剛好用完 N 條，輸出 <code>-1</code>。"],
    input_format="一行一個整數 N，代表燈條數。",
    output_format="輸出可以組成的最大數，或 <code>-1</code>。",
    constraints=["2 ≤ N ≤ 30"],
    hint="兩位數的十位數字從 1 試到 9、個位數字從 0 試到 9，檢查燈條數總和是否剛好為 N。",
    solution='''
    # 思路：枚舉所有一位數與兩個數字不同、無前導零的兩位數，取燈條數剛好為 N 的最大值。
    segments = [6, 2, 5, 5, 4, 5, 6, 3, 7, 6]
    n = int(input())
    best = -1
    for d in range(10):
        if segments[d] == n:
            best = max(best, d)
    for tens in range(1, 10):
        for ones in range(10):
            if tens != ones and segments[tens] + segments[ones] == n:
                best = max(best, tens * 10 + ones)
    print(best)
    ''', oracle=o282,
    cases=["3", "7", "2", "4", "5", "6", "8", "13", "14", "15", "30", "12"],
    fuzz=[str(n) for n in range(2, 31)],
    source_ids=[81], source_title="數位顯示器", categories=HC_E,
    source_checks=[("3", "7"), ("7", "74")],
    adaptation="原題以圖片提供燈條數表，改以文字列出；明定兩位數的兩個數字不可相同。")


if __name__ == "__main__":
    main()
