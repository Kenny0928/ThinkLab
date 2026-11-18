# 思路：總和扣除最大與最小值；結果是整數就轉成 int 輸出。
scores = list(map(float, input().split()))
total = sum(scores) - max(scores) - min(scores)
if total == int(total):
    print(int(total))
else:
    print(total)
