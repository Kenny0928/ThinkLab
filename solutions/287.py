# 思路：換成分鐘數；6 點前等到 6 點，6 點後用餘數求距下一班的時間。
h, s, m = map(int, input().split())
now = h * 60 + s
if now <= 360:
    print(360 - now)
else:
    passed = now - 360
    print((m - passed % m) % m)
