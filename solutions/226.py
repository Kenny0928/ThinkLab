# 思路：件數最多時，每次買最便宜的商品一定不會更差；依價格排序後在預算與庫存內盡量購買。
money = int(input())
m = int(input())
prices = list(map(int, input().split()))
counts = list(map(int, input().split()))
total = 0
for price, count in sorted(zip(prices, counts)):
    take = min(count, money // price)
    total += take
    money -= take * price
print(total)
