# 思路：逐人逐日累計出席，最高次數只在嚴格增加時更換；時間 O(ND)，額外空間 O(D)。
n, days = map(int, input().split())
full = 0
best_count = -1
best_id = 0
for student in range(1, n + 1):
    count = 0
    for present in input():
        if present == '1':
            count += 1
    if count == days:
        full += 1
    if count > best_count:
        best_id, best_count = student, count
print(full)
print(best_id, best_count)
