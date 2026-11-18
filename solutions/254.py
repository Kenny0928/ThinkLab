# 思路：以公分為單位計算面積，片數與包數都用無條件進位。
length = round(float(input()) * 100)
width = round(float(input()) * 100)
area = length * width
tiles = (area + 3599) // 3600
packs = (tiles + 11) // 12
print(packs)
