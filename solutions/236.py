# 思路：依區間決定折扣（以十分之幾表示避免小數誤差），再判斷運費。
n = int(input())
if n <= 5:
    rate = 9
elif n <= 10:
    rate = 8
elif n <= 15:
    rate = 7
else:
    rate = 6
cost = 30 * n * rate
if cost < 1200:
    cost += 80
print(cost)
