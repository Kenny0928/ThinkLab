# 思路：兩兩讀取數量與單價，相乘後累加並記錄當下總額。
# 積木對照：總額設為 0 → i 從 0 到 N-1：總額加上 第 2i 項 × 第 2i+1 項、加入結果清單 → 用空白組合後說出。
n = int(input())
values = list(map(int, input().split()))
total = 0
result = []
for i in range(n):
    total += values[2 * i] * values[2 * i + 1]
    result.append(str(total))
print(" ".join(result))
