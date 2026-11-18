# 思路：由高到低排序後，跳過第 6、12、18... 杯。
n = int(input())
prices = sorted(map(int, input().split()), reverse=True)
total = 0
for i in range(n):
    if (i + 1) % 6 != 0:
        total += prices[i]
print(total)
