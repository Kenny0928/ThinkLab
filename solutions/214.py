# 思路：依序累加臨時屋容量，直到總容量 ≥ 人數或已無臨時屋可開。
# 積木對照：讀入人數與容量清單 → 重複直到「容量足夠或開完」→ 開放數加一、容量累加 → 說出開放數。
people = int(input())
n = int(input())
caps = list(map(int, input().split()))
opened = 0
total = 0
while total < people and opened < n:
    total += caps[opened]
    opened += 1
print(opened)
