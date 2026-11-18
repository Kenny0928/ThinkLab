# 思路：較小站 < 10 < 較大站即為兩段票；未滿 12 歲半價。
start, end, age = map(int, input().split())
low, high = min(start, end), max(start, end)
if low < 10 and high > 10:
    fare = 20
else:
    fare = 10
if age < 12:
    fare //= 2
print(fare)
