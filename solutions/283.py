# 思路：逐日扣款，第一次小於 0 時輸出天數並結束；全部扣完才輸出夠用。
# 積木對照：讀入金額與清單 → 對第 1～4 天：金額減去花費 → 如果 < 0，說出第幾天不夠用並停止 → 迴圈結束後說出錢剛好或有剩。
money = int(input())
costs = list(map(int, input().split()))
for day in range(4):
    money -= costs[day]
    if money < 0:
        print(f"第{day + 1}天不夠用")
        break
else:
    print("錢剛好或有剩")
