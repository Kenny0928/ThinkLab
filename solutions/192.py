# 核心：dp[x] 表示恰好湊出 x 的最少枚數。時間 O(KS)，空間 O(K + S)。
import sys
data = list(map(int, sys.stdin.read().split()))
count, target = data[:2]
coins = data[2:]
unreachable = target + 1
dp = [0] + [unreachable] * target
for amount in range(1, target + 1):
    for coin in coins:
        if coin <= amount:
            dp[amount] = min(dp[amount], dp[amount - coin] + 1)
print(-1 if dp[target] == unreachable else dp[target])
