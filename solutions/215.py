# 思路：加總價格後與付款金額比較。
# 積木對照：讀入 N 與價格清單 → 用迴圈累加總金額 → 如果付款 ≥ 總額，說出差額，否則說出「付款金額不足」。
n = int(input())
prices = list(map(int, input().split()))
paid = int(input())
total = 0
for price in prices:
    total += price
if paid >= total:
    print(paid - total)
else:
    print("付款金額不足")
