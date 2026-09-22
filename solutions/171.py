# 思路：逐一檢查 a 是否整除 N，並只輸出 a 不大於商的配對；時間 O(N)，額外空間 O(1)。
n = int(input())
for a in range(1, n + 1):
    if n % a == 0:
        b = n // a
        if a <= b:
            print(a, b)
