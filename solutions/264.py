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
