# 思路：從 A 走到 B，遇到奇數就加入總和。
# 積木對照：總和設為 0 → 數字從 A 到 B 重複 → 如果 除以 2 的餘數 = 1，總和加上數字 → 說出總和。
a = int(input())
b = int(input())
total = 0
for x in range(a, b + 1):
    if x % 2 == 1:
        total += x
print(total)
