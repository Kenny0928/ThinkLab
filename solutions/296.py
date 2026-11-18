# 思路：0/1 背包，best[c] 為電力上限 c 的最高價值；容量由大到小更新，確保每個任務只用一次。
n = int(input())
best = [0] * 101
for _ in range(n):
    power, value = map(int, input().split())
    for c in range(100, power - 1, -1):
        best[c] = max(best[c], best[c - power] + value)
print(best[100])
