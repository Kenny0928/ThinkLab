# 思路：計數對中的號碼，再用對中個數查獎金表。
lucky = [7, 24, 31, 42, 45, 56, 63, 78, 80, 99]
prizes = [0, 200, 500, 2000, 10000, 100000]
picks = list(map(int, input().split()))
hit = 0
for number in picks:
    if number in lucky:
        hit += 1
print(f"猜中{hit}個號碼，獎金{prizes[hit]}元")
