# 核心：用最近出現位置維護沒有重複值的視窗。時間 O(N)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
last = {}
left = best = 0
for right, value in enumerate(data[1:]):
    left = max(left, last.get(value, -1) + 1)
    last[value] = right
    best = max(best, right - left + 1)
print(best)
