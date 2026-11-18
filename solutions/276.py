# 思路：依白球數 0、1、2、3 的順序檢查所有選法，第一個成立的即為最佳獎項。
red = int(input())
a, b, c = map(int, input().split())
if red % 7 == 0:
    print("特獎")
elif (red + a) % 7 == 0 or (red + b) % 7 == 0 or (red + c) % 7 == 0:
    print("頭獎")
elif (red + a + b) % 7 == 0 or (red + a + c) % 7 == 0 or (red + b + c) % 7 == 0:
    print("二獎")
elif (red + a + b + c) % 7 == 0:
    print("三獎")
else:
    print("未中獎")
