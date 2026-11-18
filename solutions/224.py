# 思路：枚舉每個起點，計算 K 天內屬於最愛餐點的天數；只有嚴格較大時才更新答案。
n = int(input())
menu = input().split()
k = int(input())
favorites = input().split()
best_count = -1
best_start = 1
for start in range(n - k + 1):
    count = 0
    for meal in menu[start:start + k]:
        if meal in favorites:
            count += 1
    if count > best_count:
        best_count = count
        best_start = start + 1
print(best_count, best_start)
