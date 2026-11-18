# 思路：每輪排序三個點數並依種類數判斷組合；以 invalid 計數連續無效輪數。
n = int(input())
values = list(map(int, input().split()))
energy = 0
invalid = 0
for i in range(n):
    a, b, c = sorted(values[3 * i:3 * i + 3])
    valid = True
    if a == b == c:
        energy *= a
    elif a == b:
        energy += c
    elif b == c:
        energy += a
    elif (a, b, c) == (1, 2, 3):
        energy //= 2
    elif (a, b, c) == (4, 5, 6):
        energy *= 2
    else:
        valid = False
    if valid:
        invalid = 0
    else:
        invalid += 1
        if invalid == 3:
            energy = 0
            invalid = 0
print(energy)
