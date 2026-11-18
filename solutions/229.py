# 思路：逐項判斷，庫存小於 10 以 20 計算，否則以原庫存計算。
# 積木對照：總數設為 0 → 對每個庫存：如果 < 10 加 20，否則加上庫存 → 說出總數。
n = int(input())
stock = list(map(int, input().split()))
total = 0
for amount in stock:
    if amount < 10:
        total += 20
    else:
        total += amount
print(total)
