# 思路：判斷所在區後，扣除前面各區席次，再用整除與餘數算出排與位置。
seat = int(input())
if seat <= 2250:
    zone, offset, per_row = 1, seat - 1, 25
elif seat <= 6750:
    zone, offset, per_row = 2, seat - 2251, 50
else:
    zone, offset, per_row = 3, seat - 6751, 25
print(zone, offset // per_row + 1, offset % per_row + 1)
