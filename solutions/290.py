# 思路：依結束時間（相同時依開始時間）排序，能接就接；時間 O(N log N)。
n = int(input())
values = list(map(int, input().split()))
orders = [(values[2 * i], values[2 * i + 1]) for i in range(n)]
orders.sort(key=lambda o: (o[1], o[0]))
count = 0
free_at = -1
for start, end in orders:
    if start >= free_at:
        count += 1
        free_at = end
print(count)
