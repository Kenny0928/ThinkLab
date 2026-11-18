# 思路：售價 = 成本 × 1.5 四捨五入（以整數運算 .5 進位）；八折、六折的結果不會出現 .5，同樣以整數運算四捨五入。
cost = int(input())
hour = int(input())
price = (3 * cost + 1) // 2
if hour >= 12:
    sale = (price * 6 + 5) // 10
elif hour >= 11:
    sale = (price * 8 + 5) // 10
else:
    sale = price
profit = sale - cost
if profit > 0:
    print(f"有利潤 賺 {profit} 元")
else:
    print(f"無利潤 賠 {-profit} 元")
