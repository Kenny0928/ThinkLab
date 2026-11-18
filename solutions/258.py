# 思路：第一箭原分；之後先判斷連續滿分，再依與前一箭的大小關係決定倍率。
n = int(input())
scores = list(map(int, input().split()))
total = scores[0]
for i in range(1, n):
    prev, cur = scores[i - 1], scores[i]
    if prev == 10 and cur == 10:
        total += cur * 3
    elif cur < prev:
        total += cur
    elif cur == prev:
        total += cur * 2
    else:
        total += cur * 3
print(total)
