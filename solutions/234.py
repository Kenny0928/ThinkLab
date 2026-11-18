# 思路：總和扣掉最大與最小值後除以 3，再四捨五入；小數部分不會剛好是 .5，round 不會遇到平手。
input()
scores = list(map(int, input().split()))
middle = sum(scores) - max(scores) - min(scores)
print(round(middle / 3))
