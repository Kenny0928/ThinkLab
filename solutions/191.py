# 核心：維護以目前位置結尾的最佳和與全域最佳和。時間 O(N)，讀入空間 O(N)。
import sys
values = list(map(int, sys.stdin.read().split()))[1:]
ending = best = values[0]
for value in values[1:]:
    ending = max(value, ending + value)
    best = max(best, ending)
print(best)
