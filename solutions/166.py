# 思路：十格計數清單統計，再按遞增點數找最高次數；時間 O(N)，空間 O(N)（輸入清單）。
n = int(input())
numbers = list(map(int, input().split()))
counts = [0] * 10
for number in numbers:
    counts[number] += 1
best = 0
for number in range(1, 10):
    if counts[number] > counts[best]:
        best = number
print(*counts)
print(best)
