# 思路：計數器在進步時加一、未進步時歸零，並記錄過程中的最大值。
n = int(input())
scores = list(map(int, input().split()))
run = best = 0
for i in range(1, n):
    if scores[i] > scores[i - 1]:
        run += 1
        best = max(best, run)
    else:
        run = 0
print(best)
