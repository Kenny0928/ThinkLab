# 思路：計數對中號碼後依個數決定獎金。
draw = [10, 18, 29, 31, 35, 36]
picks = list(map(int, input().split()))
hit = 0
for number in picks:
    if number in draw:
        hit += 1
if hit == 6:
    prize = 100000
elif hit == 5:
    prize = 10000
elif hit == 4:
    prize = 1000
elif hit == 3:
    prize = 100
else:
    prize = 0
print(f"猜中{hit}個號碼，獎金{prize}元")
