# 思路：每段長度 L 若 ≥ K，可提供 L - K + 1 個起點，全部加總。
# 積木對照：讀入 K 與空位清單 → 對每段：如果長度 ≥ K，總數加上 長度 - K + 1 → 說出總數。
k = int(input())
m = int(input())
segments = list(map(int, input().split()))
ways = 0
for length in segments:
    if length >= k:
        ways += length - k + 1
print(ways)
