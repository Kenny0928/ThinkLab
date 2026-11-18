# 思路：逐一以試除法判斷是否為質數，是質數就加入總和。
a = int(input())
b = int(input())
total = 0
for x in range(a, b + 1):
    if x < 2:
        continue
    is_prime = True
    d = 2
    while d * d <= x:
        if x % d == 0:
            is_prime = False
            break
        d += 1
    if is_prime:
        total += x
print(total)
