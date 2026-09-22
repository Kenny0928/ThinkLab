# 核心：排序後合併重疊或相接路段。時間 O(N log N)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
intervals = sorted(zip(data[1::2], data[2::2]))
left, right = intervals[0]
total = 0
for start, end in intervals[1:]:
    if start <= right:
        right = max(right, end)
    else:
        total += right - left
        left, right = start, end
print(total + right - left)
