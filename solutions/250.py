# 思路：依最長邊決定最小櫃型，再由小到大找第一個還有空櫃的櫃型。
large, medium, small = map(int, input().split())
n = int(input())
sizes = list(map(int, input().split()))
used_l = used_m = used_s = fail = 0
for i in range(n):
    longest = max(sizes[3 * i:3 * i + 3])
    if longest <= 30 and small > 0:
        small -= 1
        used_s += 1
    elif longest <= 80 and medium > 0:
        medium -= 1
        used_m += 1
    elif large > 0:
        large -= 1
        used_l += 1
    else:
        fail += 1
print(used_l, used_m, used_s, fail)
