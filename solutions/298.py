# 思路：累加前綴和，後群人數 = 總和 - 前綴和，枚舉所有切分點取差最小者。
n = int(input())
classes = list(map(int, input().split()))
total = sum(classes)
prefix = 0
best_diff = None
best_front = 0
for k in range(n - 1):
    prefix += classes[k]
    diff = abs(total - 2 * prefix)
    if best_diff is None or diff < best_diff:
        best_diff, best_front = diff, prefix
back = total - best_front
print(min(best_front, back), max(best_front, back))
