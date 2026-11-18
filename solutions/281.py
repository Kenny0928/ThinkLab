# 思路：第一次開機需 5 度；每個 1 耗 1 度；相鄰兩段 1 之間的 g 個 0 取 min(g, 5)；開頭與結尾的 0 一律關機。
n = int(input())
need = list(map(int, input().split()))
ones = [i for i in range(n) if need[i] == 1]
if not ones:
    print(0)
else:
    total = 5 + len(ones)
    for a, b in zip(ones, ones[1:]):
        gap = b - a - 1
        total += min(gap, 5)
    print(total)
