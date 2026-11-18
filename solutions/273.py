# 思路：水平修正 = -(風速 × 完整 10 公尺段數)，垂直修正 = 完整 8 公尺段數。
wind = int(input())
distance = int(input())
x = -wind * (distance // 10)
y = distance // 8
print(x, y)
