# 思路：單趟記錄目前連段，只在更長時更新答案；時間 O(N)，空間 O(N)（輸入清單）。
n, target = map(int, input().split())
values = list(map(int, input().split()))
run = best = start = 0
for day, value in enumerate(values, 1):
    if value >= target:
        run += 1
        if run > best:
            best = run
            start = day - run + 1
    else:
        run = 0
print(start, best)
