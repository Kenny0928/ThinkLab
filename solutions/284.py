# 思路：對每一隻機器人，數出戰鬥力嚴格小於它的機器人數量。
n = int(input())
power = list(map(int, input().split()))
scores = []
for i in range(n):
    score = 0
    for j in range(n):
        if power[i] > power[j]:
            score += 1
    scores.append(str(score))
print(" ".join(scores))
