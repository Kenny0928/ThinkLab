# 思路：面額 100、50、10、5、1 依序整除，從大到小盡量使用（受庫存限制）即為最少枚數；最後若仍有餘額則無法找零。
change = -int(input()) + int(input())
stock = list(map(int, input().split()))
coins = [100, 50, 10, 5, 1]
used = []
for coin, have in zip(coins, stock):
    take = min(have, change // coin)
    used.append(take)
    change -= take * coin
if change == 0:
    print(" ".join(map(str, used)))
else:
    print("無法找零")
