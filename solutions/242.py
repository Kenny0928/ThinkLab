# 思路：代入公式後四捨五入成整數，再依區間判斷等級。
height = int(input())
weight = int(input())
bmr = round(655 + 9.6 * weight + 1.8 * height - 4.7 * 14)
if bmr < 1200:
    level = "極低能量"
elif bmr < 1500:
    level = "較低能量"
elif bmr < 1800:
    level = "標準能量"
elif bmr < 2100:
    level = "較高能量"
else:
    level = "極高能量"
print(bmr, level)
