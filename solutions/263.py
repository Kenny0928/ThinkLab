# 思路：ways[i] = ways[i-1] + ways[i-2] + ... + ways[i-K]（只加到第 0 階），ways[0] = 1。
n = int(input())
k = int(input())
ways = [0] * (n + 1)
ways[0] = 1
for i in range(1, n + 1):
    for jump in range(1, k + 1):
        if i - jump >= 0:
            ways[i] += ways[i - jump]
print(ways[n])
