# 思路：cost[i] 為到第 i 格的最少秒數；由前往後，從每格嘗試前進 1 格與 2 格的合法走法。
n = int(input())
h = list(map(int, input().split()))
INF = float("inf")
cost = [INF] * n
cost[0] = 0
for i in range(n):
    if i + 1 < n:
        diff = h[i + 1] - h[i]
        step = 3 if diff >= 2 else 1
        cost[i + 1] = min(cost[i + 1], cost[i] + step)
    if i + 2 < n:
        if h[i + 1] == h[i] and h[i + 2] == h[i]:
            cost[i + 2] = min(cost[i + 2], cost[i] + 1)
        if h[i + 1] < h[i] and h[i + 2] == h[i]:
            cost[i + 2] = min(cost[i + 2], cost[i] + 2)
print(cost[n - 1])
