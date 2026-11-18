# 思路：以 0 起算的位置每次加 K 取餘數，直到回到 0。
# 積木對照：位置 = 0、結果清單放入 1 → 重複：位置 = (位置 + K) 除以 N 的餘數、加入 位置 + 1 → 直到位置 = 0。
n = int(input())
k = int(input())
pos = 0
path = [1]
while True:
    pos = (pos + k) % n
    path.append(pos + 1)
    if pos == 0:
        break
print(" ".join(map(str, path)))
