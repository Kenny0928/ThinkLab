# 思路：逐輪比較並累加雙方積分，最後比較總分；時間 O(N)，額外空間 O(1)。
n = int(input())
score_a = score_b = 0
for _ in range(n):
    a, b = map(int, input().split())
    if a > b:
        score_a += 3
    elif a < b:
        score_b += 3
    else:
        score_a += 1
        score_b += 1
print(score_a, score_b)
if score_a > score_b:
    print('A')
elif score_a < score_b:
    print('B')
else:
    print('DRAW')
