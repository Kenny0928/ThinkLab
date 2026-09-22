# 思路：先算目的樓層，合法時更新位置與距離，否則計次；時間 O(N)，額外空間 O(1)。
highest, floor, n = map(int, input().split())
total = rejected = 0
for _ in range(n):
    direction, steps = input().split()
    steps = int(steps)
    destination = floor + steps if direction == 'U' else floor - steps
    if 1 <= destination <= highest:
        floor = destination
        total += steps
    else:
        rejected += 1
print(floor, total, rejected)
