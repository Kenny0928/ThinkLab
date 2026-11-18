# 思路：以字典累加各屬性數量，字典保留第一次加入的順序。
n = int(input())
tokens = input().split()
totals = {}
for i in range(n):
    name = tokens[2 * i]
    amount = int(tokens[2 * i + 1])
    totals[name] = totals.get(name, 0) + amount
print(" ".join(f"{name} {amount}" for name, amount in totals.items()))
