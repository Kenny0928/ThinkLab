# 思路：q = L // D 為間隔數，依模式加減端點。
length = int(input())
gap = int(input())
mode = int(input())
q = length // gap
if mode == 1:
    print(q + 1)
elif mode == 3:
    print(q - 1)
else:
    print(q)
