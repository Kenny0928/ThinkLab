# 思路：非六點重設連段，六點以目前連段長度計分；時間 O(N)，空間 O(N)（輸入清單）。
n = int(input())
dice = list(map(int, input().split()))
total = run = longest = 0
for value in dice:
    if value == 6:
        run += 1
        total += 6 * run
        longest = max(longest, run)
    else:
        run = 0
        total += value
print(total, longest)
