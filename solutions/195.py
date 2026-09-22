# 核心：dp[i] 從前方比自己小的元素延伸。時間 O(N²)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
values = data[1:]
dp = [1] * n
for i in range(n):
    for j in range(i):
        if values[j] < values[i]:
            dp[i] = max(dp[i], dp[j] + 1)
print(max(dp))
