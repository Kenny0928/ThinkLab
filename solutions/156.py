# 思路：按方向更新兩座標，每次移動後更新最遠距離；時間 O(N)，額外空間 O(1)。
x, y, n = map(int, input().split())
farthest = abs(x) + abs(y)
for _ in range(n):
    direction, amount = input().split()
    amount = int(amount)
    if direction == 'N':
        y += amount
    elif direction == 'S':
        y -= amount
    elif direction == 'E':
        x += amount
    else:
        x -= amount
    farthest = max(farthest, abs(x) + abs(y))
print(x, y, farthest)
