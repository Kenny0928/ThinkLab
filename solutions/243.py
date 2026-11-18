# 思路：讀到 -1 前持續累加商品價格，最後比較餘額。
prices = [3490, 7990, 3990, 2590, 6890, 3490, 1490]
wallet = int(input())
total = 0
while True:
    item = int(input())
    if item == -1:
        break
    total += prices[item - 1]
if wallet >= total:
    print(f"結帳成功，餘額剩{wallet - total}元")
else:
    print(f"餘額不足，請另外加值{total - wallet}元")
