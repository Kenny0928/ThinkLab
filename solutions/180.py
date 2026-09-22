# 核心：排序後用 bisect_right 找到每個上限右側的位置。時間 O(N log N + Q log N)，空間 O(N + Q)。
import sys
from bisect import bisect_right
data = list(map(int, sys.stdin.read().split()))
n, q = data[:2]
prices = sorted(data[2:2 + n])
print("\n".join(str(bisect_right(prices, b)) for b in data[2 + n:]))
