# 思路：逐小時更新排隊人數，固定航班必開，剩餘 > 50 人再加開一艘。
n = int(input())
queue = 0
carried = 0
boats = 0
for _ in range(n):
    queue += int(input())
    take = min(150, queue)
    queue -= take
    carried += take
    boats += 1
    if queue > 50:
        take = min(150, queue)
        queue -= take
        carried += take
        boats += 1
print(carried, boats)
