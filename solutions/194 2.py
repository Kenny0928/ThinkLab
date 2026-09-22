# 核心：逐列更新從上方或左方抵達的最小費用。時間 O(RC)，讀入空間 O(RC)。
import sys
it = iter(map(int, sys.stdin.read().split()))
rows, cols = next(it), next(it)
dp = [float('inf')] * cols
dp[0] = 0
for r in range(rows):
    for c in range(cols):
        toll = next(it)
        dp[c] = toll + min(dp[c], dp[c - 1] if c else float('inf'))
print(dp[-1])
