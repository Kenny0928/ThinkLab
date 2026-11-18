# 思路：以 0 起算的位置加上點數後取餘數；每次結算後若為負數改為 0。
# 積木對照：位置設為 0 → 對每個點數：位置 = (位置 + 點數) 除以 N 的餘數 → 金額加上該格 → 如果金額 < 0 設為 0。
n = int(input())
board = list(map(int, input().split()))
m = int(input())
dice = list(map(int, input().split()))
pos = 0
money = 0
for step in dice:
    pos = (pos + step) % n
    money += board[pos]
    if money < 0:
        money = 0
print(money)
