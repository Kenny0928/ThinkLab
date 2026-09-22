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
