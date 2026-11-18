# 思路：以兩個變數保存前兩天的數量，逐日往後推算。
n, a, b = map(int, input().split())
if n == 1:
    print(a)
else:
    prev, cur = a, b
    for _ in range(n - 2):
        prev, cur = cur, prev + cur
    print(cur)
