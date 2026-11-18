# 思路：枚舉所有一位數與兩個數字不同、無前導零的兩位數，取燈條數剛好為 N 的最大值。
segments = [6, 2, 5, 5, 4, 5, 6, 3, 7, 6]
n = int(input())
best = -1
for d in range(10):
    if segments[d] == n:
        best = max(best, d)
for tens in range(1, 10):
    for ones in range(10):
        if tens != ones and segments[tens] + segments[ones] == n:
            best = max(best, tens * 10 + ones)
print(best)
