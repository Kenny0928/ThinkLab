# 思路：解析時分後相減，負數表示跨午夜；時間 O(1)，額外空間 O(1)。
start, end = input().split()
sh, sm = map(int, start.split(':'))
eh, em = map(int, end.split(':'))
elapsed = eh * 60 + em - sh * 60 - sm
if elapsed < 0:
    elapsed += 1440
print(elapsed)
