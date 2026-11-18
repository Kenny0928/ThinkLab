# 思路：維護範圍 [low, high]，每次猜中間值並依大小縮小範圍。
x = int(input())
low, high = 1, 100
guesses = []
while True:
    mid = (low + high) // 2
    guesses.append(mid)
    if mid == x:
        break
    if mid < x:
        low = mid + 1
    else:
        high = mid - 1
print(" ".join(map(str, guesses)))
print(len(guesses))
