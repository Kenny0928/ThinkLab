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
