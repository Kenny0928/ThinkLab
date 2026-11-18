# 思路：以每一家為候選點計算距離總和；總和較小，或總和相同但座標較小時更新答案。
n = int(input())
homes = list(map(int, input().split()))
best_place = None
best_total = None
for place in homes:
    total = 0
    for h in homes:
        total += abs(h - place)
    if best_total is None or total < best_total or (total == best_total and place < best_place):
        best_place, best_total = place, total
print(best_place, best_total)
