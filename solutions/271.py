# 思路：由高級距往低級距逐段計費。
w = int(input())
cost = 0
if w > 50:
    cost += (w - 50) * 15
    w = 50
if w > 30:
    cost += (w - 30) * 20
    w = 30
if w > 10:
    cost += (w - 10) * 25
    w = 10
cost += w * 30
print(cost)
