# 思路：逐週累加點數；判斷資格（第一週或週五成績進步）與點數是否足夠後兌換。
first = list(map(int, input().split()))
weeks, prices = first[0], first[1:]
points = dolls = 0
last_friday = -1
for w in range(weeks):
    scores = list(map(int, input().split()))
    for s in scores:
        points += s // 10
    eligible = (w == 0) or (scores[4] > last_friday)
    if eligible and points >= prices[w]:
        points -= prices[w]
        dolls += 1
    last_friday = scores[4]
print(dolls, points)
