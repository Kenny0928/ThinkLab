# 思路：以餘數處理環形移動；每步先修正上下限，再更新最高能量。
n = int(input())
board = list(map(int, input().split()))
m = int(input())
dice = list(map(int, input().split()))
pos = 0
energy = 0
highest = 0
for step in dice:
    pos = (pos + step) % n
    energy += board[pos]
    if energy > 50:
        energy = 50
    elif energy <= 0:
        energy = 5
    if energy > highest:
        highest = energy
print(energy, highest)
