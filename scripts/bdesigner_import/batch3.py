#!/usr/bin/env python3
"""bDesigner 匯入第 3 批：新北市國小／國中其餘題目、新竹縣國小／國中（249–263）。

新北市國中 41「航運費用計算」與 28 同題，已在 batch2 的 240 合併。
"""
from fractions import Fraction
import itertools
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add, lines, main  # noqa: E402

R = random.Random(20261120)
NTPC_E = ["114/114年新北市國小"]
NTPC_M = ["114/114年新北市國中"]
HCC_E = ["114/114年新竹縣國小"]
HCC_M = ["114/114年新竹縣國中"]


def ints(s):
    return list(map(int, s.split()))


def half_up(x: Fraction) -> int:
    return math.floor(x + Fraction(1, 2))


# 249 小隊長的奇數號碼 -----------------------------------------------------
def o249(s):
    a, b = ints(s)
    return sum(range(a if a % 2 else a + 1, b + 1, 2))


add(249, "小隊長的奇數號碼", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["迴圈", "累加", "取餘數"],
    objectives=["在指定範圍內篩選奇數並累加", "正確包含範圍的兩個端點"],
    prerequisites=["迴圈", "取餘數"],
    lead="計算兩個號碼之間（含兩端）所有奇數的總和。",
    body="老師給小隊長一個起始號碼 A 與結束號碼 B（A ≤ B）。請找出 A 到 B 之間（包含 A 與 B）所有奇數，輸出它們的總和；若沒有奇數則輸出 0。",
    input_format="第一行為起始號碼 A，第二行為結束號碼 B。",
    output_format="輸出一個整數，代表奇數的總和。",
    constraints=["1 ≤ A ≤ B ≤ 10000"],
    hint="除以 2 的餘數為 1 的數就是奇數。",
    solution='''
    # 思路：從 A 走到 B，遇到奇數就加入總和。
    # 積木對照：總和設為 0 → 數字從 A 到 B 重複 → 如果 除以 2 的餘數 = 1，總和加上數字 → 說出總和。
    a = int(input())
    b = int(input())
    total = 0
    for x in range(a, b + 1):
        if x % 2 == 1:
            total += x
    print(total)
    ''', oracle=o249,
    cases=["10\n20", "31\n39", "1\n1", "2\n2", "1\n2", "2\n3", "1\n10000", "9999\n10000", "10000\n10000", "4\n8", "7\n7"],
    fuzz=[lines(a := R.randint(1, 300), R.randint(a, 400)) for _ in range(80)],
    source_ids=[40], source_title="小隊長的奇數號碼", categories=NTPC_E,
    source_checks=[("10\n20", "75"), ("31\n39", "175")],
    adaptation="明定範圍包含兩端點，補上端點為偶數與只有單一號碼的測資。")


# 250 智慧倉儲 -------------------------------------------------------------
def o250(s):
    t = ints(s)
    left = {"L": t[0], "M": t[1], "S": t[2]}
    used = {"L": 0, "M": 0, "S": 0}
    fail = 0
    n = t[3]
    for i in range(n):
        size = max(t[4 + 3 * i:7 + 3 * i])
        need = "S" if size <= 30 else "M" if size <= 80 else "L"
        choices = {"S": "SML", "M": "ML", "L": "L"}[need]
        for c in choices:
            if left[c] > 0:
                left[c] -= 1
                used[c] += 1
                break
        else:
            fail += 1
    return f"{used['L']} {used['M']} {used['S']} {fail}"


def g250():
    n = R.randint(1, 8)
    dims = [R.choice([R.randint(1, 30), R.randint(31, 80), R.randint(81, 150), 30, 80]) for _ in range(3 * n)]
    return lines([R.randint(0, 3) for _ in range(3)], n, dims)


add(250, "智慧倉儲", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["模擬", "多分支條件", "貪心"],
    objectives=["依最長邊判斷貨物所需的最小櫃型", "最小櫃型用完時依序改用較大的櫃子"],
    prerequisites=["max 函式", "if/elif", "計數器"],
    lead="依規則把貨物放進大、中、小三種櫃子，統計使用量與無法放入的件數。",
    body=["每件貨物有長、寬、高三個尺寸（公分），一個櫃子只能放一件。依最長的一邊判斷：最長邊不超過 30 公分可放小、中、大櫃；超過 30 但不超過 80 公分可放中、大櫃；超過 80 公分只能放大櫃。",
          "貨物依輸入順序逐件處理，每件都優先放進可用的最小櫃型；該櫃型沒有空櫃時改用下一個較大的櫃型。所有可用櫃型都沒有空櫃時，該貨物無法放入。"],
    input_format="第一行為三個非負整數 L、M、S，分別是大、中、小櫃子的數量。第二行為貨物件數 N。第三行有 3N 個正整數，每三個一組為一件貨物的長、寬、高。",
    output_format="輸出四個以空白分隔的整數：使用的大櫃數、中櫃數、小櫃數、無法放入的貨物件數。",
    constraints=["0 ≤ L、M、S ≤ 100", "1 ≤ N ≤ 100", "1 ≤ 尺寸 ≤ 200"],
    hint="先算出每件貨物的最長邊，再決定「最小可用櫃型」。",
    solution='''
    # 思路：依最長邊決定最小櫃型，再由小到大找第一個還有空櫃的櫃型。
    large, medium, small = map(int, input().split())
    n = int(input())
    sizes = list(map(int, input().split()))
    used_l = used_m = used_s = fail = 0
    for i in range(n):
        longest = max(sizes[3 * i:3 * i + 3])
        if longest <= 30 and small > 0:
            small -= 1
            used_s += 1
        elif longest <= 80 and medium > 0:
            medium -= 1
            used_m += 1
        elif large > 0:
            large -= 1
            used_l += 1
        else:
            fail += 1
    print(used_l, used_m, used_s, fail)
    ''', oracle=o250,
    cases=["2 2 2\n3\n30 30 30 30 30 30 30 30 40", "2 1 1\n3\n30 30 30 30 30 30 30 30 40",
           "1 2 5\n4\n60 30 30 30 60 30 30 60 65 100 5 5", "0 0 0\n1\n1 1 1", "0 0 1\n1\n31 1 1",
           "1 0 0\n2\n80 80 80 81 1 1", "0 1 0\n2\n81 1 1 80 1 1", "3 3 3\n3\n200 200 200 10 10 10 50 50 50",
           "1 1 1\n4\n5 5 5 5 5 5 5 5 5 5 5 5", "0 2 0\n3\n10 20 30 30 31 30 1 1 1", "2 0 2\n3\n100 1 1 1 100 1 1 1 100"],
    fuzz=[g250() for _ in range(150)],
    source_ids=[43], source_title="智慧倉儲", categories=NTPC_M,
    source_checks=[("2 2 2\n3\n30 30 30 30 30 30 30 30 40", "0 1 2 0"),
                   ("2 1 1\n3\n30 30 30 30 30 30 30 30 40", "1 1 1 0"),
                   ("1 2 5\n4\n60 30 30 30 60 30 30 60 65 100 5 5", "1 2 0 1")],
    adaptation="原題對 30 與 80 公分的邊界前後敘述不一致，依原站範例統一為「不超過 30」「不超過 80」。")


# 251 王牌教練 -------------------------------------------------------------
def o251(s):
    t = ints(s)
    runners = [(t[1 + 2 * i], t[2 + 2 * i]) for i in range(t[0])]
    best = None
    for order in itertools.permutations(runners, 4):
        total = sum(r for r, _ in order) + sum(max(order[i][1], order[i + 1][1]) for i in range(3))
        best = total if best is None else min(best, total)
    return best


def g251():
    n = R.randint(4, 5)
    return lines(n, [R.randint(1, 30) if i % 2 == 0 else R.randint(1, 10) for i in range(2 * n)])


add(251, "王牌教練", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["枚舉", "排列", "最小值"],
    objectives=["枚舉所有選人與棒次的排列", "依題意計算每種排列的總時間並取最小值"],
    prerequisites=["巢狀迴圈", "清單", "itertools.permutations（選用）"],
    lead="從 4 或 5 名選手中安排接力棒次，使總時間最短。",
    body=["接力賽需 4 名選手上場。每位選手有跑完全程的時間 r 與接棒動作時間 b（秒）。若有 5 名選手，其中 1 人當替補不上場。",
          "總時間 = 上場 4 人的 r 總和 + 3 次接棒時間。第 1→2、2→3、3→4 棒各接棒一次，每次接棒時間為這兩位選手 b 值中較大者。請選出上場的人並安排棒次，輸出最短總時間。"],
    input_format="第一行為選手人數 N。第二行有 2N 個正整數，每兩個一組為一位選手的 r 與 b。",
    output_format="輸出一個整數，代表最短總時間。",
    constraints=["4 ≤ N ≤ 5", "1 ≤ r ≤ 100", "1 ≤ b ≤ 100"],
    hint="5 人選 4 人再排順序也只有 120 種，可以全部試一次。",
    solution='''
    # 思路：枚舉所有 4 人的排列（最多 5×4×3×2 = 120 種），計算總時間取最小值。
    from itertools import permutations

    n = int(input())
    values = list(map(int, input().split()))
    runners = [(values[2 * i], values[2 * i + 1]) for i in range(n)]
    best = None
    for order in permutations(runners, 4):
        total = sum(run for run, _ in order)
        for i in range(3):
            total += max(order[i][1], order[i + 1][1])
        if best is None or total < best:
            best = total
    print(best)
    ''', oracle=o251,
    cases=["4\n10 1 10 1 10 1 10 1", "4\n13 1 9 4 12 2 11 3", "5\n12 3 15 4 13 2 11 6 11 1", "4\n1 1 1 1 1 1 1 1",
           "4\n100 100 100 100 100 100 100 100", "4\n10 9 10 1 10 1 10 9", "5\n10 1 10 1 10 1 10 1 1 100",
           "5\n50 1 10 1 10 1 10 1 10 1", "4\n5 10 6 1 7 2 8 3", "5\n20 5 20 4 20 3 20 2 20 1", "5\n1 1 2 2 3 3 4 4 100 1"],
    fuzz=[g251() for _ in range(100)],
    source_ids=[44], source_title="王牌教練", categories=NTPC_M,
    source_checks=[("4\n10 1 10 1 10 1 10 1", "43"), ("4\n13 1 9 4 12 2 11 3", "54"),
                   ("5\n12 3 15 4 13 2 11 6 11 1", "58")],
    adaptation="整理題意與輸入格式，補上替補選手明顯較快或較慢的測資。")


# 252 圓柱體積計算 ---------------------------------------------------------
def o252(s):
    r, h = ints(s)
    cents = 314 * r * r * h
    return f"{cents // 100}.{cents % 100:02d}"


add(252, "圓柱體積計算", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["數學", "四則運算", "格式化輸出"],
    objectives=["套用圓柱體積公式", "以固定兩位小數輸出結果"],
    prerequisites=["乘法", "格式化輸出"],
    lead="計算圓柱體的體積。",
    body="圓柱體積 = 底面半徑 × 底面半徑 × 圓周率 × 高，圓周率固定使用 3.14。輸入半徑與高，請輸出體積，固定顯示到小數點後兩位。",
    input_format="第一行為底面半徑，第二行為高，皆為正整數。",
    output_format="輸出體積，固定兩位小數，例如 <code>197.82</code>。",
    constraints=["1 ≤ 半徑 ≤ 100", "1 ≤ 高 ≤ 100"],
    hint="用 <code>f\"{volume:.2f}\"</code> 可以固定輸出兩位小數。",
    solution='''
    # 思路：套用公式，以兩位小數格式輸出。
    # 積木對照：讀入半徑與高 → 體積 = 半徑 × 半徑 × 3.14 × 高 → 四捨五入到兩位小數後說出。
    r = int(input())
    h = int(input())
    volume = r * r * 3.14 * h
    print(f"{volume:.2f}")
    ''', oracle=o252,
    cases=["3\n7", "9\n9", "1\n1", "10\n1", "1\n10", "100\n100", "5\n2", "7\n3", "12\n5", "50\n37"],
    fuzz=[lines(R.randint(1, 100), R.randint(1, 100)) for _ in range(200)],
    source_ids=[45], source_title="圓柱體積計算", categories=HCC_E,
    source_checks=[("3\n7", "197.82"), ("9\n9", "2289.06")],
    adaptation="補上輸入順序（先半徑後高）與整數範圍，以整數運算的 oracle 確認兩位小數輸出。")


# 253 身體質量指數計算與健康判斷 -------------------------------------------
def o253(s):
    w_text, h_text = s.split()
    w, h = Fraction(w_text), Fraction(h_text)
    hundred = half_up(w / (h * h) * 100)
    value = Fraction(hundred, 100)
    label = "過輕" if value < Fraction(185, 10) else "標準" if value < 24 else "過重"
    return f"{hundred // 100}.{hundred % 100:02d} {label}"


def bmi2_safe(w, h):
    frac = (Fraction(w) / (Fraction(h) ** 2) * 100) % 1
    return abs(frac - Fraction(1, 2)) > Fraction(1, 50)


def g253():
    while True:
        w, h = str(R.randint(20, 120)), f"{R.randint(120, 200) / 100:.2f}"
        if bmi2_safe(w, h):
            return lines(w, h)


BMI2_CASES = ["60\n1.55", "38\n1.43", "45\n1.60", "47\n1.60", "48\n1.61", "61\n1.60", "62\n1.60", "20\n2.00",
              "120\n1.20", "70\n1.75", "55\n1.72", "80\n1.80"]
assert all(bmi2_safe(*c.split()) for c in BMI2_CASES)

add(253, "身體質量指數計算與健康判斷", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["浮點數", "四捨五入", "多分支條件"],
    objectives=["以公尺為單位的身高計算 BMI", "四捨五入到兩位小數後判斷肥胖程度"],
    prerequisites=["float", "round", "if/elif"],
    lead="計算 BMI（兩位小數）並判斷過輕、標準或過重。",
    body=["BMI = 體重（公斤）÷（身高（公尺）× 身高（公尺））。請將 BMI 四捨五入到小數點後兩位，再用四捨五入後的值判斷：",
          "BMI &lt; 18.5 為 <code>過輕</code>；18.5 ≤ BMI &lt; 24 為 <code>標準</code>；BMI ≥ 24 為 <code>過重</code>。"],
    input_format="第一行為體重（公斤，正整數）。第二行為身高（公尺，最多兩位小數）。",
    output_format="輸出 BMI（固定兩位小數）與判斷結果，中間以一個空白分隔。",
    constraints=["20 ≤ 體重 ≤ 120", "1.20 ≤ 身高 ≤ 2.00", "測資不會出現 BMI 第三位小數剛好接近 5 的情況"],
    hint="注意本題輸入順序是先體重後身高，身高單位是公尺。",
    solution='''
    # 思路：計算 BMI 並四捨五入到兩位小數，再以三段條件分類。
    weight = float(input())
    height = float(input())
    bmi = round(weight / (height * height), 2)
    if bmi < 18.5:
        level = "過輕"
    elif bmi < 24:
        level = "標準"
    else:
        level = "過重"
    print(f"{bmi:.2f} {level}")
    ''', oracle=o253,
    cases=BMI2_CASES, fuzz=[g253() for _ in range(200)],
    source_ids=[46], source_title="身體質量指數計算與健康判斷", categories=HCC_E,
    source_checks=[("60\n1.55", "24.97 過重"), ("38\n1.43", "18.58 標準")],
    adaptation="補上輸入順序與單位（先體重後身高、身高以公尺計），明定以四捨五入後的值分類並避開浮點誤差的臨界值。")


# 254 房間磁磚的購買計算 ---------------------------------------------------
def cm(text):
    return int(Fraction(text) * 100)


def o254(s):
    a, b = s.split()
    tiles = -(-cm(a) * cm(b) // 3600)
    return -(-tiles // 12)


def tile_safe(a, b):
    return (cm(a) * cm(b)) % 3600 != 0


def g254():
    while True:
        a, b = (str(R.randint(5, 150) / 10).removesuffix(".0") for _ in range(2))
        if tile_safe(a, b):
            return lines(a, b)


TILE_CASES = ["4\n4", "5\n3.5", "0.5\n0.5", "1\n1", "2.5\n1.7", "4.3\n1", "4.4\n1", "8.7\n1", "8.6\n1", "15\n14.9",
              "3.3\n2.9", "10\n7.1"]
assert all(tile_safe(*c.split()) for c in TILE_CASES)

add(254, "房間磁磚的購買計算", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["數學", "無條件進位", "單位換算"],
    objectives=["將公尺換算為公分後以整數計算面積", "用無條件進位求最少片數與包數"],
    prerequisites=["整數除法", "math.ceil 或負數整除"],
    lead="計算鋪滿房間地板最少要買幾包磁磚。",
    body="磁磚每片為 60 公分 × 60 公分，可以切割拼鋪，每包 12 片。房間地板的長、寬以公尺表示。請先算出鋪滿地板最少需要幾片磁磚（不足一片的部分也要用一片），再算出最少需要買幾包。",
    input_format="第一行為房間的長，第二行為房間的寬，單位為公尺，最多一位小數。",
    output_format="輸出一個整數，代表最少要購買的包數。",
    constraints=["0.5 ≤ 長、寬 ≤ 15", "測資的地板面積不會剛好是磁磚面積的整數倍"],
    hint="把公尺換成公分（乘以 100 再四捨五入成整數）後計算，可以避免小數誤差。",
    solution='''
    # 思路：以公分為單位計算面積，片數與包數都用無條件進位。
    length = round(float(input()) * 100)
    width = round(float(input()) * 100)
    area = length * width
    tiles = (area + 3599) // 3600
    packs = (tiles + 11) // 12
    print(packs)
    ''', oracle=o254,
    cases=TILE_CASES, fuzz=[g254() for _ in range(200)],
    source_ids=[47], source_title="房間磁磚的購買計算", categories=HCC_E,
    source_checks=[("4\n4", "4"), ("5\n3.5", "5")],
    adaptation="補上輸入單位與小數位數，提示以公分整數計算；測資避開面積剛好整除時浮點誤差的情況。")


# 255 美味餐車三明治多重折扣與利潤計算 -------------------------------------
def o255(s):
    cost, hour = ints(s)
    price = half_up(Fraction(3 * cost, 2))
    rate = Fraction(6, 10) if hour >= 12 else Fraction(8, 10) if hour >= 11 else Fraction(1)
    sale = half_up(price * rate)
    profit = sale - cost
    return f"有利潤 賺 {profit} 元" if profit > 0 else f"無利潤 賠 {-profit} 元"


add(255, "美味餐車三明治多重折扣與利潤計算", stage="Intermediate", difficulty="Medium", audience="E-UPPER",
    tags=["多分支條件", "四捨五入", "四則運算"],
    objectives=["依時段選擇折扣並分兩次四捨五入", "以整數運算實作「.5 進位」的四捨五入"],
    prerequisites=["整數除法", "if/elif"],
    lead="依時段折扣計算三明治的售價，判斷是賺還是賠。",
    body=["三明治售價為成本加 50%，四捨五入到整數（小數 .5 進位）。11 點（含）到 12 點前打八折；12 點（含）以後打六折；11 點以前不打折。折扣以四捨五入後的售價計算，折扣後的價錢也四捨五入到整數。",
          "實收價高於成本時輸出 <code>有利潤 賺 X 元</code>；否則輸出 <code>無利潤 賠 X 元</code>（X 為差額的絕對值，剛好打平時 X 為 0）。"],
    input_format="第一行為成本（正整數），第二行為時段（0～23 的整數小時）。",
    output_format="輸出 <code>有利潤 賺 X 元</code> 或 <code>無利潤 賠 X 元</code>，各部分以一個空白分隔。",
    constraints=["1 ≤ 成本 ≤ 1000", "0 ≤ 時段 ≤ 23"],
    hint="Python 的 round(52.5) 會得到 52；本題的 .5 要進位，可用 (3 × 成本 + 1) // 2 計算售價。",
    solution='''
    # 思路：售價 = 成本 × 1.5 四捨五入（以整數運算 .5 進位）；八折、六折的結果不會出現 .5，同樣以整數運算四捨五入。
    cost = int(input())
    hour = int(input())
    price = (3 * cost + 1) // 2
    if hour >= 12:
        sale = (price * 6 + 5) // 10
    elif hour >= 11:
        sale = (price * 8 + 5) // 10
    else:
        sale = price
    profit = sale - cost
    if profit > 0:
        print(f"有利潤 賺 {profit} 元")
    else:
        print(f"無利潤 賠 {-profit} 元")
    ''', oracle=o255,
    cases=["20\n11", "35\n12", "35\n10", "1\n0", "1\n12", "10\n11", "5\n12", "9\n12", "100\n23", "1000\n11",
           "999\n12", "33\n11", "7\n10"],
    fuzz=[lines(R.randint(1, 300), R.randint(0, 23)) for _ in range(200)],
    source_ids=[48], source_title="美味餐車三明治多重折扣與利潤計算", categories=HCC_E,
    source_checks=[("20\n11", "有利潤 賺 4 元"), ("35\n12", "無利潤 賠 3 元")],
    adaptation="依原站範例（成本 35 售價 53）確認 .5 進位；補上 11 點前不打折與打平時的輸出規則。")


# 256 雲端資料備份硬碟統計 -------------------------------------------------
FULL_MSG = "待備份檔案總容量超過雲端硬碟總空間，無法完整備份，請重新輸入。"


def o256(s):
    t = ints(s)
    data, n, disks = t[0], t[1], t[2:]
    if data > sum(disks):
        return FULL_MSG
    used = 0
    while data > 0:
        data -= disks[used]
        used += 1
    return used


def g256():
    n = R.randint(1, 8)
    disks = [R.randint(1, 500) for _ in range(n)]
    return lines(R.randint(0, sum(disks) + 200), n, disks)


add(256, "雲端資料備份硬碟統計", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["迴圈", "累加", "條件判斷"],
    objectives=["依序累加容量直到可容納全部資料", "先檢查總容量是否足夠"],
    prerequisites=["迴圈", "sum", "條件判斷"],
    lead="計算備份資料依序用了幾個雲端硬碟。",
    body=["系統依序把資料存入雲端硬碟：第一個硬碟滿了才用第二個，依此類推。請輸出總共用了幾個硬碟；待備份資料為 0 MB 時用了 0 個。",
          "若待備份總量超過所有硬碟容量的總和，輸出 <code>待備份檔案總容量超過雲端硬碟總空間，無法完整備份，請重新輸入。</code>（全形逗號與句號）。"],
    input_format="第一行為待備份資料量（MB）。第二行為硬碟數 N。第三行有 N 個以空白分隔的正整數，依序為每個硬碟的容量（MB）。",
    output_format="輸出使用的硬碟數，或容量不足的訊息。",
    constraints=["0 ≤ 資料量 ≤ 100000", "1 ≤ N ≤ 100", "1 ≤ 容量 ≤ 10000"],
    hint="先用 sum 判斷總容量夠不夠，夠的話再一個一個累加。",
    solution='''
    # 思路：總容量不足就輸出訊息；否則依序累加容量直到足以存放全部資料。
    data = int(input())
    n = int(input())
    disks = list(map(int, input().split()))
    if data > sum(disks):
        print("待備份檔案總容量超過雲端硬碟總空間，無法完整備份，請重新輸入。")
    else:
        used = 0
        stored = 0
        while stored < data:
            stored += disks[used]
            used += 1
        print(used)
    ''', oracle=o256,
    cases=["50\n2\n100 50", "800\n3\n500 200 300", "0\n1\n10", "1\n1\n1", "2\n1\n1", "100\n2\n100 50", "101\n2\n100 50",
           "150\n2\n100 50", "151\n2\n100 50", "100000\n10\n" + " ".join(["10000"] * 10), "30\n4\n10 10 10 10"],
    fuzz=[g256() for _ in range(100)],
    source_ids=[49], source_title="雲端資料備份硬碟統計", categories=HCC_E,
    source_checks=[("50\n2\n100 50", "1"), ("800\n3\n500 200 300", "3")],
    adaptation="明定資料量與容量為整數、資料量為 0 時輸出 0，並統一容量不足訊息的標點。")


# 257 綠色節能競賽：電價分段計費與成本分析 ---------------------------------
def bill_cents(u):
    tiers = [(120, 163), (330, 238), (500, 352), (10 ** 9, 480)]
    cents, low = 0, 0
    for high, rate in tiers:
        if u > low:
            cents += (min(u, high) - low) * rate
        low = high
    return cents


def o257(s):
    t = ints(s)
    bills = [(bill_cents(u) + 50) // 100 for u in t[1:]]
    lo = min(range(len(bills)), key=lambda i: (bills[i], i))
    hi = min(range(len(bills)), key=lambda i: (-bills[i], i))
    return f"{lo + 1} {bills[lo]} {hi + 1} {bills[hi]}"


def usage_safe(u):
    return bill_cents(u) % 100 != 50


def g257():
    n = R.randint(1, 8)
    us = []
    while len(us) < n:
        u = R.choice([R.randint(0, 150), R.randint(100, 600), R.randint(450, 1200)])
        if usage_safe(u):
            us.append(u)
    return lines(n, us)


ELEC_CASES = ["3\n555 339 80", "4\n222 911 349 119", "1\n0", "1\n120", "2\n121 120", "2\n330 331", "2\n500 501",
              "3\n80 80 80", "3\n1000 999 1000", "5\n0 120 330 500 2000", "4\n300 200 100 400"]
assert all(usage_safe(u) for c in ELEC_CASES for u in ints(c)[1:])

add(257, "綠色節能競賽：電價分段計費與成本分析", stage="Intermediate", difficulty="Hard", audience="M-7",
    tags=["累進計算", "最大值", "最小值"],
    objectives=["依累進級距計算分段費用", "找出最小值與最大值所在的位置"],
    prerequisites=["if/elif", "清單", "四捨五入"],
    lead="以累進電價計算每戶電費，找出電費最低與最高的住戶。",
    body=["電費採四段累進：120 度以下每度 1.63 元；121～330 度的部分每度 2.38 元；331～500 度的部分每度 3.52 元；501 度以上的部分每度 4.80 元。例如 339 度的電費為 120 × 1.63 + 210 × 2.38 + 9 × 3.52。",
          "每戶電費四捨五入為整數元後再比較。請輸出電費最低與最高的住戶編號（從 1 開始）及其電費；若有相同電費，取編號較小的住戶。"],
    input_format="第一行為住戶數 N。第二行有 N 個以空白分隔的非負整數，依序為每戶的用電度數。",
    output_format="輸出四個以空白分隔的整數：最低電費住戶編號、最低電費、最高電費住戶編號、最高電費。",
    constraints=["1 ≤ N ≤ 100", "0 ≤ 用電度數 ≤ 5000", "測資不會出現電費剛好為 x.50 元的情況"],
    hint="每一段只計算「落在這一段裡的度數」，例如 339 度在第三段只有 9 度。",
    solution='''
    # 思路：逐段計算累進電費並四捨五入；比較時使用嚴格大小，保留編號較小者。
    def bill(units):
        cost = 0
        if units > 500:
            cost += (units - 500) * 4.80
            units = 500
        if units > 330:
            cost += (units - 330) * 3.52
            units = 330
        if units > 120:
            cost += (units - 120) * 2.38
            units = 120
        cost += units * 1.63
        return round(cost)

    n = int(input())
    usages = list(map(int, input().split()))
    bills = [bill(u) for u in usages]
    low_i = high_i = 0
    for i in range(1, n):
        if bills[i] < bills[low_i]:
            low_i = i
        if bills[i] > bills[high_i]:
            high_i = i
    print(low_i + 1, bills[low_i], high_i + 1, bills[high_i])
    ''', oracle=o257,
    cases=ELEC_CASES, fuzz=[g257() for _ in range(200)],
    source_ids=[50], source_title="綠色節能競賽:電價分段計費與成本分析", categories=HCC_E,
    source_checks=[("3\n555 339 80", "3 130 1 1558"), ("4\n222 911 349 119", "4 194 2 3267")],
    adaptation="補上輸入輸出格式與並列時取編號較小者的規則，測資避開 x.50 元的四捨五入平手。")


# 258 射箭比賽成績計算 -----------------------------------------------------
def o258(s):
    a = ints(s)[1:]
    total = a[0]
    for prev, cur in zip(a, a[1:]):
        if prev == cur == 10:
            total += 3 * cur
        elif cur < prev:
            total += cur
        elif cur == prev:
            total += 2 * cur
        else:
            total += 3 * cur
    return total


def g258():
    n = R.randint(5, 10)
    return lines(n, [R.choice([R.randint(0, 10), 10, 0]) for _ in range(n)])


add(258, "射箭比賽成績計算", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["模擬", "多分支條件", "前後比較"],
    objectives=["比較每一箭與前一箭的分數決定倍率", "優先處理「連續滿分」的特例"],
    prerequisites=["清單", "迴圈", "if/elif"],
    lead="依每一箭與前一箭的比較規則，計算射箭選手的總成績。",
    body=["第一箭直接採原始分數。從第二箭起，與前一箭的原始分數比較：連續兩箭皆為 10 分時，本箭成績為原始分數的 3 倍；否則若本箭低於前一箭，採原始分數；與前一箭相同，為 2 倍；高於前一箭，為 3 倍。",
          "請輸出所有箭成績的總和。"],
    input_format="第一行為箭數 N。第二行有 N 個以空白分隔的整數，依序為每箭的原始分數。",
    output_format="輸出一個整數，代表總成績。",
    constraints=["5 ≤ N ≤ 10", "0 ≤ 分數 ≤ 10"],
    hint="先判斷是否連續兩次滿分，再判斷低於、相同、高於。",
    solution='''
    # 思路：第一箭原分；之後先判斷連續滿分，再依與前一箭的大小關係決定倍率。
    n = int(input())
    scores = list(map(int, input().split()))
    total = scores[0]
    for i in range(1, n):
        prev, cur = scores[i - 1], scores[i]
        if prev == 10 and cur == 10:
            total += cur * 3
        elif cur < prev:
            total += cur
        elif cur == prev:
            total += cur * 2
        else:
            total += cur * 3
    print(total)
    ''', oracle=o258,
    cases=["5\n7 7 9 10 10", "7\n5 3 3 4 10 0 3", "5\n0 0 0 0 0", "5\n10 10 10 10 10", "10\n10 10 10 10 10 10 10 10 10 10",
           "5\n10 9 8 7 6", "5\n1 2 3 4 5", "6\n9 9 10 10 9 9", "8\n0 10 0 10 0 10 10 0", "5\n5 5 5 5 5"],
    fuzz=[g258() for _ in range(150)],
    source_ids=[51], source_title="射箭比賽成績計算", categories=HCC_M,
    source_checks=[("5\n7 7 9 10 10", "108"), ("7\n5 3 3 4 10 0 3", "65")],
    adaptation="整理規則順序，明定連續滿分優先判斷，補上全 0 分與全滿分的測資。")


# 259 猜數字 ---------------------------------------------------------------
def o259(s):
    rows = s.split("\n")
    ans, guess = rows[1].split(), rows[2].split()
    a = sum(x == y for x, y in zip(ans, guess))
    b = len(set(ans) & set(guess)) - a
    return f"{a}A{b}B"


def g259():
    n = R.randint(2, 6)
    return lines(n, R.sample(range(10), n), R.sample(range(10), n))


add(259, "猜數字", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["清單", "比對", "字串格式化"],
    objectives=["逐位置比對兩組數字計算 A", "計算數字相同但位置不同的個數 B"],
    prerequisites=["清單索引", "in 判斷"],
    lead="比對猜測與答案，以 XAYB 的形式輸出結果。",
    body="答案與猜測都是 N 個不重複的數字（0～9）。X 為數字與位置都正確的個數，Y 為數字出現在答案中但位置不正確的個數。請輸出 <code>XAYB</code>，例如 <code>1A2B</code>。",
    input_format="第一行為 N。第二行為答案的 N 個數字，第三行為猜測的 N 個數字，皆以空白分隔。",
    output_format="輸出一行 <code>XAYB</code>，中間沒有空白。",
    constraints=["2 ≤ N ≤ 10", "同一行的數字互不重複"],
    hint="先算 A；猜測中出現在答案裡的數字總數減去 A 就是 B。",
    solution='''
    # 思路：同位置相同計入 A；數字在答案中但位置不同計入 B。
    n = int(input())
    answer = input().split()
    guess = input().split()
    a = b = 0
    for i in range(n):
        if guess[i] == answer[i]:
            a += 1
        elif guess[i] in answer:
            b += 1
    print(f"{a}A{b}B")
    ''', oracle=o259,
    cases=["4\n4 7 1 9\n4 9 7 8", "3\n3 5 8\n5 3 8", "4\n1 2 3 4\n1 2 3 4", "4\n1 2 3 4\n4 3 2 1", "4\n1 2 3 4\n5 6 7 8",
           "2\n0 9\n9 0", "2\n0 9\n0 8", "10\n0 1 2 3 4 5 6 7 8 9\n9 8 7 6 5 4 3 2 1 0", "5\n0 1 2 3 4\n0 2 1 5 6",
           "6\n5 3 9 0 2 8\n8 3 0 9 7 1"],
    fuzz=[g259() for _ in range(150)],
    source_ids=[52], source_title="猜數字", categories=HCC_M,
    source_checks=[("4\n4 7 1 9\n4 9 7 8", "1A2B"), ("3\n3 5 8\n5 3 8", "1A2B")],
    adaptation="補上每個數字為 0～9 的單一數字與 N 的上限。")


# 260 寶可夢訓練師 ---------------------------------------------------------
def o260(s):
    tokens = s.split("\n")[1].split()
    order, count = [], {}
    for name, num in zip(tokens[::2], tokens[1::2]):
        if name not in count:
            order.append(name)
            count[name] = 0
        count[name] += int(num)
    return " ".join(f"{n} {count[n]}" for n in order)


def g260():
    n = R.randint(1, 10)
    return lines(n, [x for _ in range(n) for x in (R.choice("火水電草毒冰"), R.randint(0, 20))])


add(260, "寶可夢訓練師", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["字典", "計數", "字串"],
    objectives=["用字典依名稱累加數量", "依第一次出現的順序輸出統計結果"],
    prerequisites=["字典", "清單", "迴圈"],
    lead="統計各屬性寶可夢的數量，依第一次出現的順序輸出。",
    body="輸入 N 組「屬性名稱 數量」資料，同一屬性可能出現多次。請把同屬性的數量加總，依各屬性第一次出現的順序輸出「屬性 數量」，每個屬性只輸出一次。",
    input_format="第一行為資料組數 N。第二行有 N 組資料，每組為屬性名稱與數量，全部以空白分隔。",
    output_format="輸出一行，依序為各屬性的名稱與總數，全部以一個空白分隔，例如 <code>火 5 水 2</code>。",
    constraints=["1 ≤ N ≤ 100", "0 ≤ 數量 ≤ 100", "屬性名稱不含空白"],
    hint="Python 3.7 以後的字典會保留鍵加入的順序。",
    solution='''
    # 思路：以字典累加各屬性數量，字典保留第一次加入的順序。
    n = int(input())
    tokens = input().split()
    totals = {}
    for i in range(n):
        name = tokens[2 * i]
        amount = int(tokens[2 * i + 1])
        totals[name] = totals.get(name, 0) + amount
    print(" ".join(f"{name} {amount}" for name, amount in totals.items()))
    ''', oracle=o260,
    cases=["5\n火 2 水 1 火 3 電 2 水 1", "4\n草 1 草 2 毒 3 草 4", "1\n火 0", "1\n冰 100", "3\n水 1 水 2 水 3",
           "3\n電 1 火 2 草 3", "4\n火 0 水 0 火 0 水 5", "6\n毒 1 冰 2 毒 3 冰 4 草 5 毒 6", "2\n超能力 7 惡 8",
           "5\n龍 9 龍 1 妖精 2 龍 0 妖精 3"],
    fuzz=[g260() for _ in range(100)],
    source_ids=[53], source_title="寶可夢訓練師", categories=HCC_M,
    source_checks=[("5\n火 2 水 1 火 3 電 2 水 1", "火 5 水 2 電 2"), ("4\n草 1 草 2 毒 3 草 4", "草 7 毒 3")],
    adaptation="明定輸出為單行、依第一次出現的順序，補上數量為 0 與多字屬性名稱的測資。")


# 261 機器人行走軌跡 -------------------------------------------------------
def o261(s):
    x = y = 0
    for cmd in s.split("\n")[1].split():
        dx, dy = {"U": (0, 1), "D": (0, -1), "L": (-1, 0), "R": (1, 0)}[cmd[0]]
        for _ in range(int(cmd[1:])):
            if 0 <= x + dx <= 10 and 0 <= y + dy <= 10:
                x, y = x + dx, y + dy
    return f"({x},{y})"


def g261():
    n = R.randint(1, 10)
    return lines(n, [R.choice("UDLR") + str(R.randint(1, 9)) for _ in range(n)])


add(261, "機器人行走軌跡", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["模擬", "座標", "字串解析"],
    objectives=["解析「方向字母＋步數」的指令", "每走一步檢查邊界，越界的那一步不移動"],
    prerequisites=["字串索引", "迴圈", "條件判斷"],
    lead="依指令移動機器人，輸出最終座標。",
    body=["機器人從 (0, 0) 出發，只能在 0 ≤ x ≤ 10、0 ≤ y ≤ 10 的範圍內移動。指令由方向字母與步數組成：U 為 y 加 1、D 為 y 減 1、L 為 x 減 1、R 為 x 加 1，例如 <code>U5</code> 代表向上走 5 步。",
          "機器人一步一步移動，若某一步會超出範圍，該步不移動，但仍繼續執行之後的步數與指令。"],
    input_format="第一行為指令數 N。第二行有 N 個以空白分隔的指令，每個指令為 U、D、L、R 之一後接 1～9 的步數。",
    output_format="輸出 <code>(x,y)</code>，括號與逗號為半形，中間沒有空白。",
    constraints=["1 ≤ N ≤ 100"],
    hint="把每個指令拆成第一個字元（方向）與後面的數字（步數）。",
    solution='''
    # 思路：逐指令、逐步移動，下一步若越界則跳過該步。
    n = int(input())
    commands = input().split()
    x = y = 0
    moves = {"U": (0, 1), "D": (0, -1), "L": (-1, 0), "R": (1, 0)}
    for command in commands:
        dx, dy = moves[command[0]]
        for _ in range(int(command[1:])):
            nx, ny = x + dx, y + dy
            if 0 <= nx <= 10 and 0 <= ny <= 10:
                x, y = nx, ny
    print(f"({x},{y})")
    ''', oracle=o261,
    cases=["5\nU2 D3 D4 L5 R3", "4\nR3 L2 U3 D1", "1\nL1", "1\nD9", "2\nR9 R9", "2\nU9 U9", "4\nR9 R9 U9 U9",
           "6\nR9 R9 U9 U9 L3 D4", "3\nR5 U5 L9", "8\nU1 R1 U1 R1 D1 L1 D1 L1"],
    fuzz=[g261() for _ in range(150)],
    source_ids=[54], source_title="機器人行走軌跡", categories=HCC_M,
    source_checks=[("5\nU2 D3 D4 L5 R3", "(3,0)"), ("4\nR3 L2 U3 D1", "(1,2)")],
    adaptation="依原站範例明定起點為 (0,0)、逐步檢查邊界，並說明輸出格式。")


# 262 學校運動會 -----------------------------------------------------------
def o262(s):
    rows = s.split("\n")
    n = int(rows[0])
    t = rows[1].split()
    teams = sorted(zip(t[::2], map(int, t[1::2])), key=lambda p: -p[1])
    return " ".join(name for name, _ in teams[:(n + 1) // 2])


def g262():
    n = R.randint(3, 10)
    names = R.sample(["一甲", "一乙", "二甲", "二乙", "三甲", "三乙", "四甲", "四乙", "五甲", "五乙", "六甲"], n)
    scores = R.sample(range(0, 200), n)
    return lines(n, [x for p in zip(names, scores) for x in p])


add(262, "學校運動會", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["排序", "清單", "四捨五入"],
    objectives=["將名稱與分數配對後依分數排序", "計算「前二分之一（四捨五入）」的班級數"],
    prerequisites=["sort 與 key", "tuple", "整數除法"],
    lead="依總得分排序，輸出排名前二分之一的班級。",
    body="輸入 N 個班級的名稱與總得分（不會有相同分數）。請依總得分由高到低排序，輸出前 N ÷ 2（四捨五入取整數，例如 5 班取 3 班、3 班取 2 班）名的班級名稱。",
    input_format="第一行為班級數 N。第二行有 N 組「班級名稱 總得分」，全部以空白分隔。",
    output_format="依得分由高到低輸出班級名稱，以一個空白分隔。",
    constraints=["3 ≤ N ≤ 50", "0 ≤ 總得分 ≤ 1000", "分數互不相同"],
    hint="N ÷ 2 四捨五入取整數等於 (N + 1) // 2。",
    solution='''
    # 思路：配對後依分數由高到低排序，取前 (N + 1) // 2 名。
    n = int(input())
    tokens = input().split()
    teams = []
    for i in range(n):
        teams.append((int(tokens[2 * i + 1]), tokens[2 * i]))
    teams.sort(reverse=True)
    print(" ".join(name for _, name in teams[:(n + 1) // 2]))
    ''', oracle=o262,
    cases=["5\n一甲 85 二乙 92 三丙 78 四丁 95 五戊 88", "3\n一甲 70 二乙 90 三丙 80", "4\n甲 1 乙 2 丙 3 丁 4",
           "4\n甲 4 乙 3 丙 2 丁 1", "3\n甲 0 乙 1000 丙 500", "6\n一甲 10 一乙 60 二甲 30 二乙 50 三甲 20 三乙 40",
           "7\nA 7 B 6 C 5 D 4 E 3 F 2 G 1", "8\n紅 3 橙 8 黃 1 綠 6 藍 5 靛 2 紫 7 白 4", "3\n一甲 99 一乙 98 一丙 100",
           "5\n忠 12 孝 34 仁 56 愛 78 信 90"],
    fuzz=[g262() for _ in range(100)],
    source_ids=[55], source_title="學校運動會", categories=HCC_M,
    source_checks=[("5\n一甲 85 二乙 92 三丙 78 四丁 95 五戊 88", "四丁 二乙 五戊"), ("3\n一甲 70 二乙 90 三丙 80", "二乙 三丙")],
    adaptation="說明四捨五入取整數的意義，補上偶數班級數與分數順序不同的測資。")


# 263 機器人跳樓梯 ---------------------------------------------------------
def o263(s):
    n, k = ints(s)

    def count(left):
        if left == 0:
            return 1
        return sum(count(left - j) for j in range(1, min(k, left) + 1))

    if n <= 18:
        return count(n)
    ways = [1] + [0] * n
    for i in range(1, n + 1):
        ways[i] = sum(ways[max(0, i - k):i])
    return ways[n]


add(263, "機器人跳樓梯", stage="Advanced", difficulty="Easy", audience="M-HS",
    tags=["動態規劃", "遞推", "計數"],
    objectives=["以「最後一跳跳幾階」拆解問題並建立遞推式", "用陣列由小到大累積方法數"],
    prerequisites=["清單", "巢狀迴圈", "遞推"],
    lead="計算機器人一次跳 1～K 階、剛好到達第 N 階的跳法總數。",
    body="機器人每次可以往上跳 1 到 K 階。跳的階數順序不同視為不同跳法，例如 N = 4、K = 2 時有 1+1+1+1、1+1+2、1+2+1、2+1+1、2+2 共 5 種。請輸出剛好到達第 N 階的跳法總數。",
    input_format="第一行為樓梯階數 N，第二行為一次最多可跳的階數 K。",
    output_format="輸出一個整數，代表跳法總數。",
    constraints=["1 ≤ K ≤ N ≤ 30"],
    hint="到達第 i 階的最後一跳可能是 1、2、…、K 階，所以方法數是前 K 階方法數的總和。",
    solution='''
    # 思路：ways[i] = ways[i-1] + ways[i-2] + ... + ways[i-K]（只加到第 0 階），ways[0] = 1。
    n = int(input())
    k = int(input())
    ways = [0] * (n + 1)
    ways[0] = 1
    for i in range(1, n + 1):
        for jump in range(1, k + 1):
            if i - jump >= 0:
                ways[i] += ways[i - jump]
    print(ways[n])
    ''', oracle=o263,
    cases=["4\n2", "4\n3", "1\n1", "2\n1", "2\n2", "5\n5", "10\n2", "30\n1", "30\n2", "30\n30", "30\n3", "12\n4"],
    fuzz=[lines(n := R.randint(1, 18), R.randint(1, n)) for _ in range(100)],
    source_ids=[56], source_title="機器人跳樓梯", categories=HCC_M,
    source_checks=[("4\n2", "5"), ("4\n3", "7")],
    adaptation="補上跳法順序不同即視為不同的說明與範例；oracle 在小範圍以遞迴枚舉驗證。")


if __name__ == "__main__":
    main()
