# 思路：逐一比較找出最大值與最小值，再相減。
# 積木對照：最大、最小都設為第一筆 → 對每筆：比最大大就更新、比最小小就更新 → 說出 最大 - 最小。
n = int(input())
temps = list(map(int, input().split()))
highest = lowest = temps[0]
for t in temps:
    if t > highest:
        highest = t
    if t < lowest:
        lowest = t
print(highest - lowest)
