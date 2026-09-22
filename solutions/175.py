# 思路：依編號計算新庫存，非負才寫回，否則累計拒絕數；時間 O(M + N)，空間 O(M)。
m, n = map(int, input().split())
quantities = list(map(int, input().split()))
rejected = 0
for _ in range(n):
    product, delta = map(int, input().split())
    index = product - 1
    updated = quantities[index] + delta
    if updated < 0:
        rejected += 1
    else:
        quantities[index] = updated
print(*quantities)
print(rejected)
