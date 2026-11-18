# 思路：逐段計算累進電費並四捨五入；比較時使用嚴格大小，保留編號較小者。
def bill(units):
    cost = 0
    if units > 500:
        cost += (units - 500) * 4.80
        units = 500
    if units > 330:
        cost += (units - 330) * 3.52
        units = 330
    if units > 120:
        cost += (units - 120) * 2.38
        units = 120
    cost += units * 1.63
    return round(cost)

n = int(input())
usages = list(map(int, input().split()))
bills = [bill(u) for u in usages]
low_i = high_i = 0
for i in range(1, n):
    if bills[i] < bills[low_i]:
        low_i = i
    if bills[i] > bills[high_i]:
        high_i = i
print(low_i + 1, bills[low_i], high_i + 1, bills[high_i])
