# 思路：逐字累積種類旗標並檢查相鄰重複，最後合併規則；時間 O(總字元數)，空間 O(L)。
n = int(input())
for _ in range(n):
    password = input()
    upper = lower = digit = False
    repeated = False
    for i, char in enumerate(password):
        upper = upper or 'A' <= char <= 'Z'
        lower = lower or 'a' <= char <= 'z'
        digit = digit or '0' <= char <= '9'
        if i > 0 and char == password[i - 1]:
            repeated = True
    valid = 8 <= len(password) <= 20 and upper and lower and digit and not repeated
    print('YES' if valid else 'NO')
