# 思路：總容量不足就輸出訊息；否則依序累加容量直到足以存放全部資料。
data = int(input())
n = int(input())
disks = list(map(int, input().split()))
if data > sum(disks):
    print("待備份檔案總容量超過雲端硬碟總空間，無法完整備份，請重新輸入。")
else:
    used = 0
    stored = 0
    while stored < data:
        stored += disks[used]
        used += 1
    print(used)
