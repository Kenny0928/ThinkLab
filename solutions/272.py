# 思路：分別計算兩園總價；大人國先照年齡收費，再扣掉可配對的免費兒童。
n = int(input())
ages = list(map(int, input().split()))
big = 0
seniors = kids = 0
for a in ages:
    big += 299 if a <= 12 else 599
    if a >= 65:
        seniors += 1
    if a <= 6:
        kids += 1
big -= 299 * min(seniors, kids)
seven = 0
for a in ages:
    if a % 7 == 0:
        continue
    seven += 299 if a <= 9 else 499
if big < seven:
    print("大人國", big)
elif seven < big:
    print("七福村", seven)
else:
    print("一樣", big)
