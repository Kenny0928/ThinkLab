# 核心：依結束時間排序，每次選最早可完成的活動。時間 O(N log N)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
intervals = list(zip(data[1::2], data[2::2]))
intervals.sort(key=lambda p: (p[1], p[0]))
finish = -1
count = 0
for start, end in intervals:
    if start >= finish:
        finish = end
        count += 1
print(count)
