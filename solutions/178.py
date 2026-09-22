# 思路：先用整除計算進位公里數，再分級距算車資；時間 O(N)，空間 O(N)（輸入清單）。
n = int(input())
distances = list(map(int, input().split()))
total = 0
for distance in distances:
    kilometers = (distance + 999) // 1000
    if kilometers == 0:
        fare = 0
    elif kilometers <= 5:
        fare = 20 + (kilometers - 1) * 10
    else:
        fare = 60 + (kilometers - 5) * 5
    print(fare)
    total += fare
print('TOTAL', total)
