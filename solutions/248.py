# 思路：比較每次變化前後的區間偵測事件；用 run 累計同號變化量，變號時重設。
def zone(value):
    if value < 70:
        return "low"
    if value > 180:
        return "high"
    return "normal"

n = int(input())
value = int(input())
deltas = list(map(int, input().split()))
low = high = 0
run = best = 0
previous = 0
for d in deltas:
    before = zone(value)
    value += d
    after = zone(value)
    if after != before and after == "low":
        low += 1
    if after != before and after == "high":
        high += 1
    if previous != 0 and (previous > 0) == (d > 0):
        run += abs(d)
    else:
        run = abs(d)
    best = max(best, run)
    previous = d
print(low, high, best)
