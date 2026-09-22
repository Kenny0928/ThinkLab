# 核心：由起點向前推進，封閉階梯不接收走法。時間 O(N + M)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
n, m = data[:2]
closed = set(data[2:])
mod = 1000000007
ways = [0] * (n + 1)
ways[0] = int(0 not in closed)
for pos in range(1, n + 1):
    if pos not in closed:
        ways[pos] = sum(ways[max(0, pos - 3):pos]) % mod
print(ways[n])
