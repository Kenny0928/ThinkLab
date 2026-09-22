# 思路：逐列解析欄位，只累加非缺考分數，另計缺考數；時間 O(NK)，空間 O(K)。
n, k = map(int, input().split())
for _ in range(n):
    fields = input().split(';')
    name = fields[0]
    total = count = absent = 0
    for mark in fields[1:]:
        if mark == '-':
            absent += 1
        else:
            total += int(mark)
            count += 1
    average = str(total // count) if count else 'NA'
    print(name, average, absent)
