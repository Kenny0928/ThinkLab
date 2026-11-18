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
