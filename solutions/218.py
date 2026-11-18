# 思路：依烹煮順序逐一處理每種套餐，將該套餐出現的次數全部輸出。
# 積木對照：讀入兩個清單 → 對順序清單的每個編號：計算訂單中出現幾次 → 重複加入結果清單 → 用空白組合後說出。
n = int(input())
orders = input().split()
m = int(input())
priority = input().split()
result = []
for meal in priority:
    result += [meal] * orders.count(meal)
print(" ".join(result))
