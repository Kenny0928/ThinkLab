#!/usr/bin/env python3
"""bDesigner 匯入第 2 批：台南市、A 縣市、A 校校內評選（230–248）。

合併重複來源：25+37 健康小管家、26+38 鋼琴計分、27+39 幸運號碼大樂透、30+42 我的健康小管家。
"""
from fractions import Fraction
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import add, lines, main  # noqa: E402

R = random.Random(20261119)
TAINAN_E = ["114/114年台南市國小"]
TAINAN_M = ["114/114年台南市國中"]
A_CITY = ["114/114年A縣市題目"]
A_SCHOOL = ["114/114A校校內評選"]
NTPC_E = ["114/114年新北市國小"]
NTPC_M = ["114/114年新北市國中"]


def ints(s):
    return list(map(int, s.split()))


# 230 偶數和 ---------------------------------------------------------------
def o230(s):
    a, b = ints(s)
    return sum(x for x in range(a, b + 1) if x % 2 == 0)


add(230, "偶數和", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["迴圈", "累加", "取餘數"],
    objectives=["用計數迴圈走訪一段整數範圍", "以除以 2 的餘數判斷偶數"],
    prerequisites=["迴圈", "取餘數"],
    lead="計算兩個正整數之間（含兩端）所有偶數的和。",
    body="輸入兩個由小到大的正整數 A 與 B，請計算 A 到 B 之間所有偶數的總和，A 與 B 本身若是偶數也要算進去。",
    input_format="第一行為 A，第二行為 B。",
    output_format="輸出一個整數，代表偶數的總和。",
    constraints=["1 ≤ A ≤ B ≤ 10000"],
    hint="一個數除以 2 的餘數為 0 時就是偶數。",
    solution='''
    # 思路：從 A 走到 B，遇到偶數就加入總和。
    # 積木對照：總和設為 0 → 數字從 A 到 B 重複 → 如果 除以 2 的餘數 = 0，總和加上數字 → 說出總和。
    a = int(input())
    b = int(input())
    total = 0
    for x in range(a, b + 1):
        if x % 2 == 0:
            total += x
    print(total)
    ''', oracle=o230,
    cases=["10\n20", "31\n39", "1\n1", "2\n2", "1\n2", "3\n3", "1\n10000", "9999\n10000", "5\n6", "7\n9", "100\n101"],
    fuzz=[lines(a := R.randint(1, 300), R.randint(a, 400)) for _ in range(80)],
    source_ids=[18], source_title="偶數和 (Even Sum)", categories=TAINAN_E,
    source_checks=[("10\n20", "90"), ("31\n39", "140")],
    adaptation="明定範圍包含兩端點，補上單一數字與沒有偶數的測資。")


# 231 三角形 ---------------------------------------------------------------
def o231(s):
    a, b, c = sorted(ints(s)[1:])
    return "yes" if a + b > c else "no"


add(231, "三角形", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["條件判斷", "邏輯運算"],
    objectives=["用三個不等式判斷能否組成三角形", "以 and 組合多個條件"],
    prerequisites=["條件判斷", "and 運算"],
    lead="判斷三個邊長能否組成一個三角形。",
    body="三角形任意兩邊的和必定大於第三邊。輸入三個正整數邊長，能組成三角形輸出 <code>yes</code>，否則輸出 <code>no</code>。兩邊和剛好等於第三邊時不能組成三角形。",
    input_format="第一行固定為 3。第二行有三個以空白分隔的正整數，代表三個邊長。",
    output_format="輸出 <code>yes</code> 或 <code>no</code>（皆為小寫）。",
    constraints=["1 ≤ 邊長 ≤ 1000"],
    hint="三組「兩邊和 &gt; 第三邊」必須同時成立。",
    solution='''
    # 思路：三組兩邊和都必須大於第三邊。
    input()
    a, b, c = map(int, input().split())
    if a + b > c and a + c > b and b + c > a:
        print("yes")
    else:
        print("no")
    ''', oracle=o231,
    cases=["3\n9 6 8", "3\n1 2 3", "3\n1 1 1", "3\n1 1 2", "3\n2 2 3", "3\n3 1 2", "3\n2 3 1", "3\n1000 1000 1",
           "3\n1 1000 1000", "3\n1000 1 1", "3\n5 12 13", "3\n10 4 5"],
    fuzz=[lines(3, [R.randint(1, 20) for _ in range(3)]) for _ in range(120)],
    source_ids=[19], source_title="三角形 (Triangle)", categories=TAINAN_E,
    source_checks=[("3\n9 6 8", "yes"), ("3\n1 2 3", "no")],
    adaptation="保留原題第一行固定為 3 的輸入格式，明定兩邊和等於第三邊時輸出 no。")


# 232 刮刮樂 ---------------------------------------------------------------
def o232(s):
    return {0: 0, 1: 100, 2: 200, 3: 500}[s.strip().count("6")]


add(232, "刮刮樂", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["字串", "計數", "多分支條件"],
    objectives=["逐字檢查字串並計數指定字元", "依計數結果對應獎金"],
    prerequisites=["字串走訪", "條件判斷"],
    lead="依刮刮樂上 6 的個數計算獎金。",
    body="刮刮樂上有三個 0～9 的數字。出現一個 6 得 100 元，兩個 6 得 200 元，三個 6 得 500 元，沒有 6 得 0 元。請輸出可以得到的獎金。",
    input_format="一行三個連續的數字字元，例如 <code>266</code>。",
    output_format="輸出一個整數，代表獎金。",
    constraints=["每個字元皆為 0～9"],
    hint="先數出有幾個 6，再決定獎金。",
    solution='''
    # 思路：計算字串中 6 的個數，再對應到獎金。
    # 積木對照：計數設為 0 → 對每個字元：如果是 6 計數加一 → 依計數說出 0、100、200 或 500。
    card = input().strip()
    sixes = 0
    for ch in card:
        if ch == "6":
            sixes += 1
    if sixes == 3:
        print(500)
    elif sixes == 2:
        print(200)
    elif sixes == 1:
        print(100)
    else:
        print(0)
    ''', oracle=o232,
    cases=["666", "600", "266", "123", "000", "006", "060", "660", "606", "999", "616", "565"],
    fuzz=["".join(R.choice("0123456789666") for _ in range(3)) for _ in range(100)],
    source_ids=[20], source_title="刮刮樂 (Scratch Card)", categories=TAINAN_E,
    source_checks=[("666", "500"), ("600", "100"), ("266", "200"), ("123", "0")],
    adaptation="整理輸入格式，補上 6 出現在不同位置的測資。")


# 233 遊樂場 ---------------------------------------------------------------
def o233(s):
    child, adult = ints(s)
    return min(400 * (child - k) + 500 * (adult - k) + 800 * k for k in range(min(child, adult) + 1))


add(233, "遊樂場", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["數學", "最小值", "條件判斷"],
    objectives=["比較不同購票方式找出最便宜的總價", "用 min 找出可組成的親子套票數"],
    prerequisites=["四則運算", "min 函式"],
    lead="計算兒童與成人購買遊樂園門票的最優惠總價。",
    body="兒童票每張 400 元，成人票每張 500 元；親子套票組含 1 張兒童票與 1 張成人票，每組 800 元。輸入兒童與成人人數，請輸出最便宜的總票價。",
    input_format="第一行為兒童人數，第二行為成人人數。",
    output_format="輸出一個整數，代表最優惠的總票價。",
    constraints=["0 ≤ 兒童人數、成人人數 ≤ 1000"],
    hint="一組套票比分開買便宜多少？能組幾組就組幾組嗎？",
    solution='''
    # 思路：套票 800 元比分開買 900 元便宜，因此盡量組成套票，其餘單買。
    child = int(input())
    adult = int(input())
    sets = min(child, adult)
    print(sets * 800 + (child - sets) * 400 + (adult - sets) * 500)
    ''', oracle=o233,
    cases=["5\n5", "6\n3", "0\n0", "1\n0", "0\n1", "1\n1", "3\n6", "1000\n1000", "1000\n0", "0\n1000", "7\n2"],
    fuzz=[lines(R.randint(0, 30), R.randint(0, 30)) for _ in range(80)],
    source_ids=[21], source_title="遊樂場 (Amusement Park)", categories=TAINAN_M,
    source_checks=[("5\n5", "4000"), ("6\n3", "3600")],
    adaptation="補上輸入順序（先兒童後成人）與人數為 0 的測資。")


# 234 歌唱比賽 -------------------------------------------------------------
def o234(s):
    scores = sorted(ints(s)[1:])
    middle = Fraction(sum(scores[1:-1]), 3)
    return int(middle + Fraction(1, 2))


add(234, "歌唱比賽", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["排序", "平均", "四捨五入"],
    objectives=["去掉一個最高分與一個最低分後計算平均", "將平均四捨五入到整數"],
    prerequisites=["清單", "max/min 或排序", "除法"],
    lead="去掉最高與最低分後，計算歌唱比賽的平均成績。",
    body="5 位評審各給 0～10 的整數分數。將分數去掉一個最高分與一個最低分後，計算剩下 3 個分數的平均，並四捨五入到整數輸出。（3 個整數的平均小數部分只可能是 0、1/3 或 2/3，不會剛好在 .5 上。）",
    input_format="第一行固定為 5。第二行有 5 個以空白分隔的整數分數。",
    output_format="輸出一個整數，代表四捨五入後的成績。",
    constraints=["0 ≤ 分數 ≤ 10"],
    hint="總和減去最大值與最小值，就是中間 3 個分數的和。",
    solution='''
    # 思路：總和扣掉最大與最小值後除以 3，再四捨五入；小數部分不會剛好是 .5，round 不會遇到平手。
    input()
    scores = list(map(int, input().split()))
    middle = sum(scores) - max(scores) - min(scores)
    print(round(middle / 3))
    ''', oracle=o234,
    cases=["5\n10 8 9 9 9", "5\n10 9 9 6 6", "5\n7 7 7 7 7", "5\n0 0 0 0 0", "5\n10 10 10 10 10",
           "5\n10 9 8 8 0", "5\n10 9 9 8 0", "5\n0 1 1 2 10", "5\n0 0 0 1 10", "5\n5 6 7 8 9", "5\n3 10 0 4 4",
           "5\n1 2 2 2 9"],
    fuzz=[lines(5, [R.randint(0, 10) for _ in range(5)]) for _ in range(150)],
    source_ids=[22], source_title="歌唱比賽 (Singing Contest)", categories=TAINAN_M,
    source_checks=[("5\n10 8 9 9 9", "9"), ("5\n10 9 9 6 6", "8"), ("5\n7 7 7 7 7", "7")],
    adaptation="原題未說明平均非整數時的處理方式，明定四捨五入到整數（不會出現 .5 平手）。")


# 235 質數和 ---------------------------------------------------------------
def o235(s):
    a, b = ints(s)
    return sum(x for x in range(a, b + 1) if x > 1 and all(x % d for d in range(2, x)))


add(235, "質數和", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["質數", "巢狀迴圈", "累加"],
    objectives=["以試除法判斷質數", "在範圍內累加符合條件的數"],
    prerequisites=["巢狀迴圈", "取餘數", "布林旗標"],
    lead="計算兩個正整數之間（含兩端）所有質數的和。",
    body="質數是大於 1、且除了 1 和本身以外沒有其他因數的整數（1 不是質數）。輸入兩個由小到大的正整數 A、B，請輸出 A 到 B 之間所有質數的總和；若沒有質數則輸出 0。",
    input_format="第一行為 A，第二行為 B。",
    output_format="輸出一個整數，代表質數的總和。",
    constraints=["1 ≤ A ≤ B ≤ 100"],
    hint="判斷 x 是否為質數時，只要檢查 2 到 x−1 有沒有能整除 x 的數。",
    solution='''
    # 思路：逐一以試除法判斷是否為質數，是質數就加入總和。
    a = int(input())
    b = int(input())
    total = 0
    for x in range(a, b + 1):
        if x < 2:
            continue
        is_prime = True
        d = 2
        while d * d <= x:
            if x % d == 0:
                is_prime = False
                break
            d += 1
        if is_prime:
            total += x
    print(total)
    ''', oracle=o235,
    cases=["21\n30", "13\n19", "54\n58", "1\n1", "1\n2", "2\n2", "4\n4", "1\n100", "97\n100", "90\n96", "2\n3", "24\n28"],
    fuzz=[lines(a := R.randint(1, 100), R.randint(a, 100)) for _ in range(100)],
    source_ids=[23], source_title="質數和 (Prime Sum)", categories=TAINAN_M,
    source_checks=[("21\n30", "52"), ("13\n19", "49"), ("54\n58", "0")],
    adaptation="將埃拉托賽尼篩法的說明改為質數定義，明定範圍包含兩端與 1 不是質數。")


# 236 奇緣蛋糕特賣 ---------------------------------------------------------
def o236(s):
    n = int(s)
    rate = 9 if n <= 5 else 8 if n <= 10 else 7 if n <= 15 else 6
    cost = Fraction(300 * n * rate, 10)
    return int(cost if cost >= 1200 else cost + 80)


add(236, "奇緣蛋糕特賣", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["多分支條件", "四則運算"],
    objectives=["依數量區間選擇折扣", "依折扣後金額判斷是否加收運費"],
    prerequisites=["if/elif/else", "乘法"],
    lead="依購買數量的折扣與運費規則，計算蛋糕訂單的總金額。",
    body=["每個蛋糕原價 300 元，每筆訂單運費 80 元。購買 1～5 個打 9 折、6～10 個打 8 折、11～15 個打 7 折、16 個以上打 6 折（全部蛋糕都用同一個折扣）。",
          "若折扣後金額達到 1200 元以上則免運費，否則加收 80 元。請輸出應付的總金額。"],
    input_format="一行一個整數 N，代表購買的蛋糕數量。",
    output_format="輸出一個整數，代表應付的總金額。",
    constraints=["1 ≤ N ≤ 1000"],
    hint="先算出折扣後金額，再判斷運費；300 乘以任何折扣都會是整數。",
    solution='''
    # 思路：依區間決定折扣（以十分之幾表示避免小數誤差），再判斷運費。
    n = int(input())
    if n <= 5:
        rate = 9
    elif n <= 10:
        rate = 8
    elif n <= 15:
        rate = 7
    else:
        rate = 6
    cost = 30 * n * rate
    if cost < 1200:
        cost += 80
    print(cost)
    ''', oracle=o236,
    cases=["4", "17", "1", "5", "6", "10", "11", "15", "16", "1000", "8", "3"],
    fuzz=[str(R.randint(1, 60)) for _ in range(80)],
    source_ids=[24], source_title="奇緣蛋糕特賣", categories=A_CITY,
    source_checks=[("4", "1160"), ("17", "3060")],
    adaptation="明定所有蛋糕套用同一折扣、滿 1200 元含剛好 1200 元免運，補上各區間端點測資。")


# 237 健康小管家（BMI） ----------------------------------------------------
BMI_LEVELS = [(Fraction(185, 10), "體重過輕"), (Fraction(25), "正常範圍"), (Fraction(30), "體重過重"),
              (Fraction(35), "輕度肥胖"), (Fraction(40), "中度肥胖")]


def o237(s):
    h, w = ints(s)
    tenth = Fraction(w * 100000, h * h)  # BMI × 10
    rounded = int(tenth + Fraction(1, 2))
    value = Fraction(rounded, 10)
    label = next((name for limit, name in BMI_LEVELS if value < limit), "重度肥胖")
    return f"{rounded // 10}.{rounded % 10} {label}"


def bmi_safe(h, w):
    frac = Fraction(w * 100000, h * h) % 1
    return abs(frac - Fraction(1, 2)) > Fraction(1, 50)


def g237():
    while True:
        h, w = R.randint(120, 200), R.randint(25, 150)
        if bmi_safe(h, w):
            return lines(h, w)


BMI_CASES = ["165\n45", "180\n85", "160\n47", "170\n53", "170\n72", "160\n64", "160\n77", "150\n79", "150\n90",
             "150\n91", "200\n200", "120\n20", "175\n70"]
assert all(bmi_safe(*ints(c)) for c in BMI_CASES)

add(237, "健康小管家", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["浮點數", "四捨五入", "多分支條件"],
    objectives=["將公分換算為公尺後計算 BMI", "以四捨五入後的值判斷分類區間"],
    prerequisites=["除法", "round 或格式化輸出", "if/elif"],
    lead="計算 BMI 並判斷所屬的分類等級。",
    body=["BMI = 體重（公斤）÷（身高（公尺）× 身高（公尺））。請將 BMI 四捨五入到小數點後一位，再依下列標準分類：",
          "小於 18.5 為 <code>體重過輕</code>；18.5～24.9 為 <code>正常範圍</code>；25.0～29.9 為 <code>體重過重</code>；30.0～34.9 為 <code>輕度肥胖</code>；35.0～39.9 為 <code>中度肥胖</code>；40.0 以上為 <code>重度肥胖</code>。例如身高 165 公分、體重 45 公斤，BMI = 16.52…，四捨五入為 16.5，屬於體重過輕。"],
    input_format="第一行為身高（公分），第二行為體重（公斤），皆為正整數。",
    output_format="輸出 BMI（固定一位小數）與分類名稱，中間以一個空白分隔。",
    constraints=["120 ≤ 身高 ≤ 200", "20 ≤ 體重 ≤ 200", "測資不會出現 BMI 第二位小數剛好接近 5 的情況"],
    hint="用 <code>f\"{bmi:.1f}\"</code> 輸出一位小數，分類時要用四捨五入後的值比較。",
    solution='''
    # 思路：公分轉公尺計算 BMI，四捨五入到一位小數後再依區間分類。
    height = int(input()) / 100
    weight = int(input())
    bmi = round(weight / (height * height), 1)
    if bmi < 18.5:
        level = "體重過輕"
    elif bmi < 25:
        level = "正常範圍"
    elif bmi < 30:
        level = "體重過重"
    elif bmi < 35:
        level = "輕度肥胖"
    elif bmi < 40:
        level = "中度肥胖"
    else:
        level = "重度肥胖"
    print(f"{bmi:.1f} {level}")
    ''', oracle=o237,
    cases=BMI_CASES, fuzz=[g237() for _ in range(200)],
    source_ids=[25, 37], source_title="健康小管家", categories=A_CITY + NTPC_E,
    source_checks=[("165\n45", "16.5 體重過輕"), ("180\n85", "26.2 體重過重")],
    adaptation="合併 A 縣市與新北市國小的同一題；明定四捨五入並以四捨五入後的值分類，測資避開浮點誤差的臨界值。")


# 238 鋼琴小天才計分挑戰 ---------------------------------------------------
def o238(s):
    vals = sorted(Fraction(x) for x in s.split())
    total = sum(vals[1:-1])
    return str(total.numerator) if total.denominator == 1 else f"{float(total):.1f}"


def g238():
    return " ".join(str(R.randint(2, 20) / 2).removesuffix(".0") for _ in range(7))


add(238, "鋼琴小天才計分挑戰", stage="Beginner", difficulty="Medium", audience="E-UPPER",
    tags=["最大值", "最小值", "小數"],
    objectives=["去掉一個最高分與一個最低分後加總", "依結果是否為整數決定輸出格式"],
    prerequisites=["清單", "max/min", "浮點數"],
    lead="去掉最高與最低分後，計算鋼琴比賽選手的總成績。",
    body=["7 位評審各給一個 1～10 分的分數，分數是 0.5 的倍數（例如 8、9.5）。計算總成績時，扣除一個最高分與一個最低分，剩下 5 個分數的總和就是總成績。",
          "若總成績是整數，輸出整數（例如 <code>41</code>）；否則輸出到小數點後一位（例如 <code>22.5</code>）。"],
    input_format="一行 7 個以空白分隔的分數，整數分數不含小數點。",
    output_format="輸出選手的總成績。",
    constraints=["1 ≤ 分數 ≤ 10", "分數皆為 0.5 的倍數"],
    hint="總和減掉最大值與最小值即可；0.5 的倍數相加不會產生浮點誤差。",
    solution='''
    # 思路：總和扣除最大與最小值；結果是整數就轉成 int 輸出。
    scores = list(map(float, input().split()))
    total = sum(scores) - max(scores) - min(scores)
    if total == int(total):
        print(int(total))
    else:
        print(total)
    ''', oracle=o238,
    cases=["8 9 7 9 8 10 7", "1.5 2.5 3.5 4.5 5.5 6.5 7.5", "1 1 1 1 1 1 1", "10 10 10 10 10 10 10",
           "1 10 5 5 5 5 5", "9.5 9.5 9 8.5 10 1 7", "2 3 4 5 6 7 8.5", "1.5 1 1 1 1 1 10", "6 6.5 7 7.5 8 8.5 9",
           "10 9.5 1 1.5 5 5 5"],
    fuzz=[g238() for _ in range(150)],
    source_ids=[26, 38], source_title="鋼琴音樂小才子計分挑戰／鋼琴小天才計分挑戰", categories=A_CITY + NTPC_E,
    source_checks=[("8 9 7 9 8 10 7", "41"), ("1.5 2.5 3.5 4.5 5.5 6.5 7.5", "22.5")],
    adaptation="合併兩縣市的同一題；原題範例含小數分數，明定分數為 0.5 的倍數以避免浮點誤差，並明定整數與小數的輸出格式。")


# 239 幸運號碼大樂透 -------------------------------------------------------
LUCKY10 = {7, 24, 31, 42, 45, 56, 63, 78, 80, 99}


def o239(s):
    hit = len(set(ints(s)) & LUCKY10)
    prize = [0, 200, 500, 2000, 10000, 100000][hit]
    return f"猜中{hit}個號碼，獎金{prize}元"


def g239():
    pool = sorted(LUCKY10) + R.sample([x for x in range(1, 100) if x not in LUCKY10], 10)
    return " ".join(map(str, R.sample(pool, 5)))


add(239, "幸運號碼大樂透", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["清單", "計數", "字串格式化"],
    objectives=["判斷每個號碼是否在幸運號碼清單中", "依對中個數查表並組合輸出字串"],
    prerequisites=["in 判斷", "清單索引", "字串組合"],
    lead="計算樂透彩券對中的號碼個數與獎金。",
    body=["本期 10 個幸運號碼是 7、24、31、42、45、56、63、78、80、99。玩家從 1～99 中挑選 5 個不同號碼，依對中個數領取獎金：",
          "5 個 100000 元；4 個 10000 元；3 個 2000 元；2 個 500 元；1 個 200 元；0 個 0 元。"],
    input_format="一行 5 個以空白分隔、互不相同的整數。",
    output_format="輸出 <code>猜中X個號碼，獎金Y元</code>，X、Y 為整數，全形逗號，整行沒有空白。",
    constraints=["1 ≤ 號碼 ≤ 99", "5 個號碼互不相同"],
    hint="把獎金依對中個數 0～5 放進清單，就能直接用個數當索引。",
    solution='''
    # 思路：計數對中的號碼，再用對中個數查獎金表。
    lucky = [7, 24, 31, 42, 45, 56, 63, 78, 80, 99]
    prizes = [0, 200, 500, 2000, 10000, 100000]
    picks = list(map(int, input().split()))
    hit = 0
    for number in picks:
        if number in lucky:
            hit += 1
    print(f"猜中{hit}個號碼，獎金{prizes[hit]}元")
    ''', oracle=o239,
    cases=["7 18 29 31 35", "1 2 3 4 5", "7 24 31 42 45", "56 63 78 80 99", "7 24 31 42 1", "99 80 78 2 3",
           "24 1 2 3 4", "6 8 23 25 98", "45 46 63 64 7", "99 1 98 2 97"],
    fuzz=[g239() for _ in range(100)],
    source_ids=[27, 39], source_title="幸運號碼大樂透", categories=A_CITY + NTPC_E,
    source_checks=[("7 18 29 31 35", "猜中2個號碼，獎金500元"), ("1 2 3 4 5", "猜中0個號碼，獎金0元")],
    adaptation="合併 A 縣市與新北市國小的同一題；兩站輸出格式的空白與逗號不同，統一為無空白、含全形逗號的格式。")


# 240 魔法公車車票計算 -----------------------------------------------------
def o240(s):
    a, b, age = ints(s)
    lo, hi = min(a, b), max(a, b)
    fare = 20 if lo < 10 < hi else 10
    return fare // 2 if age < 12 else fare


add(240, "魔法公車車票計算", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["條件判斷", "邏輯運算"],
    objectives=["判斷旅程是否跨越特定站點", "依年齡套用半價優惠"],
    prerequisites=["if/else", "and/or 運算"],
    lead="依上下車站與年齡計算魔法公車的票價。",
    body=["公車有 1～15 號站，10 號站是「魔法分隔站」。旅程若從 10 號站的一側坐到另一側（上下車站一個小於 10、一個大於 10），要買兩段票 20 元；否則買一段票 10 元。在 10 號站上車或下車不算跨越。",
          "乘客未滿 12 歲（11 歲以下）可享半價。請輸出應付的票價。"],
    input_format="一行三個以空白分隔的整數：上車站號、下車站號、年齡。",
    output_format="輸出一個整數，代表應付的票價。",
    constraints=["1 ≤ 站號 ≤ 15，上下車站不同", "1 ≤ 年齡 ≤ 120"],
    hint="跨越 10 號站代表兩站中較小的 &lt; 10 且較大的 &gt; 10。",
    solution='''
    # 思路：較小站 < 10 < 較大站即為兩段票；未滿 12 歲半價。
    start, end, age = map(int, input().split())
    low, high = min(start, end), max(start, end)
    if low < 10 and high > 10:
        fare = 20
    else:
        fare = 10
    if age < 12:
        fare //= 2
    print(fare)
    ''', oracle=o240,
    cases=["5 8 18", "7 12 20", "13 10 8", "14 5 30", "14 5 11", "14 5 12", "10 15 40", "1 10 5", "9 11 12",
           "11 9 11", "1 15 1", "12 15 70", "3 4 120"],
    fuzz=[lines([a := R.randint(1, 15), R.choice([x for x in range(1, 16) if x != a]), R.randint(1, 30)]) for _ in range(120)],
    source_ids=[28, 41], source_title="魔法公車車票計算／航運費用計算", categories=A_CITY + NTPC_M,
    source_checks=[("5 8 18", "10"), ("7 12 20", "20"), ("13 10 8", "5")],
    adaptation="依原站範例明定在 10 號站上下車不算跨越、12 歲以下指未滿 12 歲；新北市國中「航運費用計算」規則與範例相同（20 站、排水量未滿 12 半價），併入本題。")


# 241 幸運數字彩虹樂透 -----------------------------------------------------
DRAW6 = {10, 18, 29, 31, 35, 36}


def o241(s):
    hit = len(set(ints(s)) & DRAW6)
    prize = {6: 100000, 5: 10000, 4: 1000, 3: 100}.get(hit, 0)
    return f"猜中{hit}個號碼，獎金{prize}元"


def g241():
    pool = sorted(DRAW6) + R.sample([x for x in range(1, 50) if x not in DRAW6], 8)
    return " ".join(map(str, R.sample(pool, 6)))


add(241, "幸運數字彩虹樂透", stage="Intermediate", difficulty="Easy", audience="E-UPPER",
    tags=["清單", "計數", "多分支條件"],
    objectives=["計算兩組號碼的相同個數", "依區間規則對應獎金"],
    prerequisites=["in 判斷", "if/elif"],
    lead="計算彩虹樂透彩券對中的號碼個數與獎金。",
    body=["本次開獎號碼為 10、18、29、31、35、36。彩券上有 6 個 1～49 的不同號碼，依對中個數領取獎金：",
          "6 個 100000 元；5 個 10000 元；4 個 1000 元；3 個 100 元；2 個以下 0 元。"],
    input_format="一行 6 個以空白分隔、互不相同的整數。",
    output_format="輸出 <code>猜中X個號碼，獎金Y元</code>，全形逗號，整行沒有空白。",
    constraints=["1 ≤ 號碼 ≤ 49", "6 個號碼互不相同"],
    hint="2 個以下都是 0 元，最後一個 else 就能處理。",
    solution='''
    # 思路：計數對中號碼後依個數決定獎金。
    draw = [10, 18, 29, 31, 35, 36]
    picks = list(map(int, input().split()))
    hit = 0
    for number in picks:
        if number in draw:
            hit += 1
    if hit == 6:
        prize = 100000
    elif hit == 5:
        prize = 10000
    elif hit == 4:
        prize = 1000
    elif hit == 3:
        prize = 100
    else:
        prize = 0
    print(f"猜中{hit}個號碼，獎金{prize}元")
    ''', oracle=o241,
    cases=["10 18 29 31 35 36", "1 2 3 4 5 6", "10 18 29 31 35 1", "10 18 29 31 1 2", "10 18 29 1 2 3",
           "10 18 1 2 3 4", "36 1 2 3 4 5", "49 48 47 46 45 44", "36 35 31 29 18 49", "11 19 30 32 34 37"],
    fuzz=[g241() for _ in range(100)],
    source_ids=[29], source_title="幸運數字彩虹樂透", categories=A_CITY,
    source_checks=[("10 18 29 31 35 36", "猜中6個號碼，獎金100000元"), ("1 2 3 4 5 6", "猜中0個號碼，獎金0元")],
    adaptation="整理獎項表，補上每種對中個數的測資。")


# 242 我的健康小管家（BMR） ------------------------------------------------
BMR_LEVELS = [(1200, "極低能量"), (1500, "較低能量"), (1800, "標準能量"), (2100, "較高能量")]


def o242(s):
    h, w = ints(s)
    tenth = 6550 + 96 * w + 18 * h - 47 * 14  # BMR × 10
    value = (tenth + 5) // 10
    return f"{value} " + next((n for lim, n in BMR_LEVELS if value < lim), "極高能量")


def bmr_safe(h, w):
    return (6550 + 96 * w + 18 * h - 47 * 14) % 10 != 5


def g242():
    while True:
        h, w = R.randint(120, 200), R.randint(20, 160)
        if bmr_safe(h, w):
            return lines(h, w)


BMR_CASES = ["170\n55", "175\n70", "120\n20", "200\n160", "150\n40", "160\n50", "165\n60", "180\n80", "170\n100",
             "190\n120", "155\n45", "185\n65", "158\n52"]
assert all(bmr_safe(*ints(c)) for c in BMR_CASES)

add(242, "我的健康小管家", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["四則運算", "四捨五入", "多分支條件"],
    objectives=["依公式計算含小數係數的數值", "四捨五入後依區間分類"],
    prerequisites=["浮點數運算", "round", "if/elif"],
    lead="以簡化公式計算基礎代謝率（BMR）並判斷能量等級。",
    body=["簡化的 BMR 公式（年齡固定為 14 歲）為：BMR = 655 + 9.6 × 體重（公斤）+ 1.8 × 身高（公分）− 4.7 × 14。請將 BMR 四捨五入到整數，再依下列標準分類：",
          "小於 1200 為 <code>極低能量</code>；1200～1499 為 <code>較低能量</code>；1500～1799 為 <code>標準能量</code>；1800～2099 為 <code>較高能量</code>；2100 以上為 <code>極高能量</code>。"],
    input_format="第一行為身高（公分），第二行為體重（公斤），皆為正整數。",
    output_format="輸出四捨五入後的 BMR 與能量等級，中間以一個空白分隔。",
    constraints=["120 ≤ 身高 ≤ 200", "20 ≤ 體重 ≤ 160", "測資不會出現 BMR 小數部分剛好為 0.5 的情況"],
    hint="先算出 BMR，四捨五入成整數後再比較等級。",
    solution='''
    # 思路：代入公式後四捨五入成整數，再依區間判斷等級。
    height = int(input())
    weight = int(input())
    bmr = round(655 + 9.6 * weight + 1.8 * height - 4.7 * 14)
    if bmr < 1200:
        level = "極低能量"
    elif bmr < 1500:
        level = "較低能量"
    elif bmr < 1800:
        level = "標準能量"
    elif bmr < 2100:
        level = "較高能量"
    else:
        level = "極高能量"
    print(bmr, level)
    ''', oracle=o242,
    cases=BMR_CASES, fuzz=[g242() for _ in range(200)],
    source_ids=[30, 42], source_title="我的健康小管家", categories=A_CITY + NTPC_M,
    source_checks=[("170\n55", "1423 較低能量"), ("175\n70", "1576 標準能量")],
    adaptation="合併 A 縣市與新北市國中的同一題；兩站對取整方式說法不同，採新北市版的四捨五入，測資避開 .5 平手。")


# 243 東台線上 3C 購物平台 -------------------------------------------------
PRICES3C = {1: 3490, 2: 7990, 3: 3990, 4: 2590, 5: 6890, 6: 3490, 7: 1490}


def o243(s):
    t = ints(s)
    wallet = t[0]
    total = sum(PRICES3C[x] for x in t[1:t.index(-1)])
    return f"結帳成功，餘額剩{wallet - total}元" if wallet >= total else f"餘額不足，請另外加值{total - wallet}元"


def g243():
    items = [R.randint(1, 7) for _ in range(R.randint(0, 6))]
    return lines(R.randint(0, 30000), *items, -1)


add(243, "東台線上 3C 購物平台", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["哨兵迴圈", "查表", "條件判斷"],
    objectives=["用 while 迴圈讀到 -1 為止", "以商品編號查詢價格並加總"],
    prerequisites=["while 迴圈", "清單或字典", "字串格式化"],
    lead="模擬線上購物結帳，判斷電子錢包餘額是否足夠。",
    body=["商品價格表：1 電競滑鼠 3490 元、2 電競鍵盤 7990 元、3 電腦椅 3990 元、4 電腦機殼 2590 元、5 電腦桌 6890 元、6 記憶體 16GB 3490 元、7 SSD 256GB 1490 元。",
          "系統先讀入電子錢包餘額，再逐一讀入購買的商品編號（同一商品可買多次），讀到 <code>-1</code> 時結帳。餘額足夠（含剛好相等）輸出 <code>結帳成功，餘額剩X元</code>；不足則輸出 <code>餘額不足，請另外加值X元</code>。"],
    input_format="第一行為電子錢包餘額。接著每行一個商品編號，最後一行為 <code>-1</code>。",
    output_format="輸出結帳結果，全形逗號，整行沒有空白。",
    constraints=["0 ≤ 餘額 ≤ 1000000", "商品編號為 1～7", "購買件數 0～100"],
    hint="把價格放進清單，用「編號 − 1」當索引查價格。",
    solution='''
    # 思路：讀到 -1 前持續累加商品價格，最後比較餘額。
    prices = [3490, 7990, 3990, 2590, 6890, 3490, 1490]
    wallet = int(input())
    total = 0
    while True:
        item = int(input())
        if item == -1:
            break
        total += prices[item - 1]
    if wallet >= total:
        print(f"結帳成功，餘額剩{wallet - total}元")
    else:
        print(f"餘額不足，請另外加值{total - wallet}元")
    ''', oracle=o243,
    cases=["10000\n1\n4\n-1", "5000\n3\n5\n-1", "0\n-1", "0\n7\n-1", "1490\n7\n-1", "1489\n7\n-1",
           "30000\n2\n2\n2\n-1", "23970\n2\n2\n2\n-1", "1000000\n1\n2\n3\n4\n5\n6\n7\n-1", "100\n6\n6\n-1"],
    fuzz=[g243() for _ in range(100)],
    source_ids=[31], source_title="東台線上 3C 購物平台", categories=A_CITY,
    source_checks=[("10000\n1\n4\n-1", "結帳成功，餘額剩3920元"), ("5000\n3\n5\n-1", "餘額不足，請另外加值5880元")],
    adaptation="統一輸出為無空白格式，明定餘額剛好相等算結帳成功、可以不買任何商品。")


# 244 程式設計師阿倫 -------------------------------------------------------
def o244(s):
    n, a, b = ints(s)
    seq = [a, b]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[n - 1]


add(244, "程式設計師阿倫", stage="Intermediate", difficulty="Easy", audience="M-7",
    tags=["遞推", "迴圈", "數列"],
    objectives=["用兩個變數滾動計算遞推數列", "正確處理第 1、2 項的邊界"],
    prerequisites=["迴圈", "多重指派"],
    lead="依「每天等於前兩天總和」的規則，求第 N 天寫的程式數量。",
    body="阿倫第 1 天寫了 A 個程式、第 2 天寫了 B 個。從第 3 天起，每天寫的數量等於前 2 天的總和。請輸出第 N 天寫了幾個程式。",
    input_format="一行三個以空白分隔的整數 N、A、B。",
    output_format="輸出一個整數，代表第 N 天寫的程式數量。",
    constraints=["1 ≤ N ≤ 40", "0 ≤ A、B ≤ 100"],
    hint="只需要記住最近兩天的數量，就能算出下一天。",
    solution='''
    # 思路：以兩個變數保存前兩天的數量，逐日往後推算。
    n, a, b = map(int, input().split())
    if n == 1:
        print(a)
    else:
        prev, cur = a, b
        for _ in range(n - 2):
            prev, cur = cur, prev + cur
        print(cur)
    ''', oracle=o244,
    cases=["4 1 2", "1 1 1", "10 1 1", "2 3 7", "1 9 0", "3 0 0", "40 100 100", "40 1 0", "5 0 1", "6 2 5", "20 3 4"],
    fuzz=[lines([R.randint(1, 40), R.randint(0, 100), R.randint(0, 100)]) for _ in range(100)],
    source_ids=[32], source_title="程式設計師阿倫", categories=A_SCHOOL,
    source_checks=[("4 1 2", "5"), ("1 1 1", "1"), ("10 1 1", "55")],
    adaptation="原題寫「輸入為 2 行」但實為一行三個整數，依範例修正；加上 N 的範圍限制。")


# 245 超市採購即時通 -------------------------------------------------------
def o245(s):
    t = ints(s)
    out, total = [], 0
    for i in range(t[0]):
        total += t[1 + 2 * i] * t[2 + 2 * i]
        out.append(total)
    return " ".join(map(str, out))


def g245():
    n = R.randint(1, 8)
    return lines(n, [R.randint(0, 20) for _ in range(2 * n)])


add(245, "超市採購即時通", stage="Beginner", difficulty="Easy", audience="E-UPPER",
    tags=["累加", "迴圈", "乘法"],
    objectives=["每讀一組資料就更新累積總和", "以清單收集並一次輸出所有中間結果"],
    prerequisites=["迴圈", "乘法", "清單"],
    lead="每拿一種商品就輸出一次目前的累積金額。",
    body="小華依序拿了 N 種商品，每種有數量 Q 與單價 P。每拿一種商品，就把 Q × P 加入累積總金額，並記下當時的累積總金額。請依序輸出這 N 個累積總金額。",
    input_format="第一行為商品種類數 N。第二行有 2N 個以空白分隔的整數，依序為第 1 種的 Q、P，第 2 種的 Q、P……",
    output_format="輸出一行 N 個整數，以一個空白分隔。",
    constraints=["1 ≤ N ≤ 100", "0 ≤ Q ≤ 100", "0 ≤ P ≤ 10000"],
    hint="第 i 種商品的數量與單價在清單中的位置是 2i 與 2i+1（i 從 0 起算）。",
    solution='''
    # 思路：兩兩讀取數量與單價，相乘後累加並記錄當下總額。
    # 積木對照：總額設為 0 → i 從 0 到 N-1：總額加上 第 2i 項 × 第 2i+1 項、加入結果清單 → 用空白組合後說出。
    n = int(input())
    values = list(map(int, input().split()))
    total = 0
    result = []
    for i in range(n):
        total += values[2 * i] * values[2 * i + 1]
        result.append(str(total))
    print(" ".join(result))
    ''', oracle=o245,
    cases=["2\n3 10 2 50", "3\n4 5 3 30 1 100", "1\n0 100", "1\n5 0", "1\n100 10000", "3\n1 1 1 1 1 1",
           "4\n2 3 0 9 4 1 1 7", "2\n100 10000 100 10000", "5\n1 2 3 4 5 6 7 8 9 10", "3\n0 0 0 0 0 0"],
    fuzz=[g245() for _ in range(80)],
    source_ids=[33], source_title="超市採購即時通", categories=A_SCHOOL,
    source_checks=[("2\n3 10 2 50", "30 130"), ("3\n4 5 3 30 1 100", "20 110 210")],
    adaptation="明定所有累積金額輸出於同一行，補上數量或單價為 0 的測資。")


# 246 金門小三通春運調度 ---------------------------------------------------
def o246(s):
    t = ints(s)
    queue = carried = boats = 0
    for arrive in t[1:1 + t[0]]:
        queue += arrive
        take = min(150, queue)
        queue, carried, boats = queue - take, carried + take, boats + 1
        if queue > 50:
            take = min(150, queue)
            queue, carried, boats = queue - take, carried + take, boats + 1
    return f"{carried} {boats}"


def g246():
    n = R.randint(1, 8)
    return lines(n, *[R.choice([0, R.randint(0, 60), R.randint(100, 400)]) for _ in range(n)])


add(246, "金門小三通春運調度", stage="Intermediate", difficulty="Medium", audience="M-7",
    tags=["模擬", "條件判斷", "累加"],
    objectives=["以排隊人數模擬每小時的載運", "依剩餘人數條件決定是否加開船班"],
    prerequisites=["迴圈", "min 函式", "條件判斷"],
    lead="模擬碼頭每小時的固定航班與加班船，統計載運人數與船班數。",
    body=["每小時開始時，新到達的旅客加入排隊。固定航班每小時一定發出一班（即使沒有人也照開），最多載 150 人。",
          "固定航班離港後，若碼頭仍有超過 50 人排隊，加開 1 艘加班船，最多載 150 人；每小時最多加開 1 艘。載不完的旅客留到下一小時。最後一小時結束後仍留在碼頭的旅客不計入載運人數。"],
    input_format="第一行為營運小時數 N。接下來 N 行，每行一個整數，依序代表每小時新到達的旅客人數。",
    output_format="輸出兩個以空白分隔的整數：成功載運的旅客總數、發出的總船班數。",
    constraints=["1 ≤ N ≤ 24", "0 ≤ 每小時到達人數 ≤ 1000"],
    hint="加班船的條件是「固定航班開走後」剩下的人數大於 50，剛好 50 人不加開。",
    solution='''
    # 思路：逐小時更新排隊人數，固定航班必開，剩餘 > 50 人再加開一艘。
    n = int(input())
    queue = 0
    carried = 0
    boats = 0
    for _ in range(n):
        queue += int(input())
        take = min(150, queue)
        queue -= take
        carried += take
        boats += 1
        if queue > 50:
            take = min(150, queue)
            queue -= take
            carried += take
            boats += 1
    print(carried, boats)
    ''', oracle=o246,
    cases=["1\n220", "1\n350", "2\n60 40".replace(" ", "\n"), "1\n0", "1\n200", "1\n201", "1\n150", "3\n0\n0\n0",
           "2\n1000\n0", "3\n400\n0\n0", "1\n1000", "4\n100\n100\n100\n100", "2\n300\n250"],
    fuzz=[g246() for _ in range(100)],
    source_ids=[34], source_title="金門小三通春運調度", categories=A_SCHOOL,
    source_checks=[("1\n220", "220 2"), ("1\n350", "300 2"), ("2\n60\n40", "100 2")],
    adaptation="依原站資料改為每小時人數各占一行；補上剛好剩 50 人、整天無人與大量積壓跨小時的測資。")


# 247 數位能量方塊實驗 -----------------------------------------------------
def o247(s):
    t = ints(s)
    energy = invalid = 0
    for i in range(t[0]):
        dice = sorted(t[1 + 3 * i:4 + 3 * i])
        kinds = len(set(dice))
        if kinds == 1:
            energy *= dice[0]
        elif kinds == 2:
            energy += dice[0] if dice[1] == dice[2] else dice[2]
        elif dice == [1, 2, 3]:
            energy //= 2
        elif dice == [4, 5, 6]:
            energy *= 2
        else:
            invalid += 1
            if invalid == 3:
                energy, invalid = 0, 0
            continue
        invalid = 0
    return energy


def g247():
    n = R.randint(1, 10)
    rolls = []
    for _ in range(n):
        rolls += R.choice([[R.randint(1, 6)] * 3, R.sample([1, 2, 3], 3), R.sample([4, 5, 6], 3),
                           [R.randint(1, 6) for _ in range(3)]])
    return lines(n, rolls)


add(247, "數位能量方塊實驗", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["模擬", "多分支條件", "狀態管理"],
    objectives=["將三顆骰子排序後辨識點數組合", "用計數器追蹤連續無效次數並在條件達成時重置"],
    prerequisites=["排序", "set", "if/elif", "計數器"],
    lead="依三顆能量方塊的點數組合，模擬累積能量的變化。",
    body=["初始能量為 0。每一輪擲出三顆 1～6 點的方塊，依點數組合（不限順序）調整能量：恰有兩顆相同時，加上第三顆（不同的那顆）的點數；三顆相同時，能量乘以該點數；三顆為 1、2、3 時，能量除以 2（無條件捨去）；三顆為 4、5、6 時，能量乘以 2。",
          "不符合以上任何組合的一輪為「無效」，能量不變。若連續 3 輪都是無效，能量歸零，連續無效次數也重新計算；只要出現一輪有效，連續無效次數就重新從 0 開始。"],
    input_format="第一行為輪數 N。第二行有 3N 個以空白分隔的整數，每三個一組代表一輪的三顆方塊點數。",
    output_format="輸出一個整數，代表最終累積能量。",
    constraints=["1 ≤ N ≤ 30", "1 ≤ 點數 ≤ 6"],
    hint="先把每輪三個點數排序，再用不同點數的個數區分「全同、兩同、全不同」。",
    solution='''
    # 思路：每輪排序三個點數並依種類數判斷組合；以 invalid 計數連續無效輪數。
    n = int(input())
    values = list(map(int, input().split()))
    energy = 0
    invalid = 0
    for i in range(n):
        a, b, c = sorted(values[3 * i:3 * i + 3])
        valid = True
        if a == b == c:
            energy *= a
        elif a == b:
            energy += c
        elif b == c:
            energy += a
        elif (a, b, c) == (1, 2, 3):
            energy //= 2
        elif (a, b, c) == (4, 5, 6):
            energy *= 2
        else:
            valid = False
        if valid:
            invalid = 0
        else:
            invalid += 1
            if invalid == 3:
                energy = 0
                invalid = 0
    print(energy)
    ''', oracle=o247,
    cases=["3\n2 1 3 6 4 5 2 2 4", "4\n2 2 6 1 4 5 2 3 5 1 2 6", "1\n2 2 5", "2\n2 4 2 5 4 6", "1\n6 6 6",
           "2\n5 1 1 6 6 6", "3\n6 6 1 3 1 2 2 1 3", "5\n6 6 1 1 4 5 1 4 5 2 2 3 1 4 5",
           "4\n6 6 1 1 4 5 1 4 5 2 2 3", "7\n1 1 6 1 3 5 2 4 6 1 2 4 1 3 5 2 4 6 6 6 5",
           "6\n1 1 6 6 4 5 4 6 5 5 5 5 1 1 1 3 2 1", "3\n1 1 5 4 4 2 3 3 3"],
    fuzz=[g247() for _ in range(200)],
    source_ids=[35], source_title="數位能量方塊實驗", categories=A_SCHOOL,
    source_checks=[("3\n2 1 3 6 4 5 2 2 4", "4"), ("4\n2 2 6 1 4 5 2 3 5 1 2 6", "0"), ("1\n2 2 5", "5"),
                   ("2\n2 4 2 5 4 6", "8")],
    adaptation="明定有效一輪會重設連續無效次數、歸零後重新計算，並說明兩同時加上的是不同的那一顆。")


# 248 糖尿病血糖趨勢與預警分析 ---------------------------------------------
def zone(v):
    return "low" if v < 70 else "high" if v > 180 else "normal"


def o248(s):
    t = ints(s)
    n, value, deltas = t[0], t[1], t[2:]
    low = high = 0
    for d in deltas:
        before = zone(value)
        value += d
        after = zone(value)
        if after != before:
            low += after == "low"
            high += after == "high"
    best = 0
    for i in range(n):
        for j in range(i, n):
            seg = deltas[i:j + 1]
            if all(x > 0 for x in seg) or all(x < 0 for x in seg):
                best = max(best, abs(sum(seg)))
    return f"{low} {high} {best}"


def g248():
    n = R.randint(1, 10)
    return lines(n, R.randint(40, 220), [R.choice([-1, 1]) * R.randint(1, 90) for _ in range(n)])


add(248, "糖尿病血糖趨勢與預警分析", stage="Intermediate", difficulty="Hard", audience="M-8",
    tags=["模擬", "狀態轉移", "連段"],
    objectives=["比較前後狀態以偵測「進入新區間」的事件", "追蹤同方向連續變化的累計量並取最大值"],
    prerequisites=["函式", "if/elif", "迴圈"],
    lead="統計血糖進入異常區間的次數，並找出最大的連續同向變化量。",
    body=["血糖值分三區：低血糖區（&lt; 70）、正常區（70～180）、高血糖區（&gt; 180）。血糖從起始值 S 開始，依序加上 N 次變化量。起始值本身不算事件。",
          "每次變化後，若血糖從其他區進入低血糖區，低血糖事件加 1；從其他區進入高血糖區，高血糖事件加 1；停留在同一區不重複計算（由高直接跳到低也算進入低血糖區）。另外，連續同方向（持續上升或持續下降）的變化量總和的絕對值稱為一段趨勢，方向改變時重新累計；請求出最大的趨勢值。"],
    input_format="第一行為觀察次數 N。第二行為起始血糖 S。第三行有 N 個以空白分隔的非零整數，依序為每次的變化量。",
    output_format="輸出三個以空白分隔的整數：低血糖事件次數、高血糖事件次數、最大趨勢值。",
    constraints=["1 ≤ N ≤ 100", "0 ≤ S ≤ 400", "變化量為非零整數，且過程中血糖皆介於 0～600"],
    hint="寫一個把血糖值轉成區名的函式，每次變化前後各呼叫一次再比較。",
    solution='''
    # 思路：比較每次變化前後的區間偵測事件；用 run 累計同號變化量，變號時重設。
    def zone(value):
        if value < 70:
            return "low"
        if value > 180:
            return "high"
        return "normal"

    n = int(input())
    value = int(input())
    deltas = list(map(int, input().split()))
    low = high = 0
    run = best = 0
    previous = 0
    for d in deltas:
        before = zone(value)
        value += d
        after = zone(value)
        if after != before and after == "low":
            low += 1
        if after != before and after == "high":
            high += 1
        if previous != 0 and (previous > 0) == (d > 0):
            run += abs(d)
        else:
            run = abs(d)
        best = max(best, run)
        previous = d
    print(low, high, best)
    ''', oracle=o248,
    cases=["3\n100\n110 -160 220", "6\n100\n40 50 -20 -30 -80 -10", "1\n100\n5", "1\n60\n-10", "1\n180\n1",
           "1\n70\n-1", "2\n200\n-140 200", "4\n100\n90 -10 -20 50", "5\n69\n1 -1 1 -1 1", "5\n181\n-1 1 -1 1 -1",
           "3\n100\n100 100 100", "4\n300\n-50 -50 -50 -50"],
    fuzz=[g248() for _ in range(150)],
    source_ids=[36], source_title="糖尿病血糖趨勢與預警分析", categories=A_SCHOOL,
    source_checks=[("3\n100\n110 -160 220", "1 2 220"), ("6\n100\n40 50 -20 -30 -80 -10", "1 1 140")],
    adaptation="明定起始值不算事件、變化量不為 0，並以「連續同號變化量總和」定義趨勢值。")


if __name__ == "__main__":
    main()
