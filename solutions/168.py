# 思路：相鄰溫度決定方向，跳過持平並統計方向更換；時間 O(N)，空間 O(N)。
n = int(input())
temperatures = list(map(int, input().split()))
previous_direction = changes = 0
for i in range(1, n):
    difference = temperatures[i] - temperatures[i - 1]
    if difference == 0:
        continue
    direction = 1 if difference > 0 else -1
    if previous_direction != 0 and direction != previous_direction:
        changes += 1
    previous_direction = direction
print(changes)
