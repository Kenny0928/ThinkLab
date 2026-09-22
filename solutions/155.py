# 思路：把所有時間轉成秒後累加，再用整除與餘數拆回；時間 O(N)，額外空間 O(1)。
start, count = input().split()
h, m, s = map(int, start.split(':'))
total = h * 3600 + m * 60 + s
for _ in range(int(count)):
    minutes, seconds = map(int, input().split(':'))
    total += minutes * 60 + seconds
days, remain = divmod(total, 86400)
hours, remain = divmod(remain, 3600)
minutes, seconds = divmod(remain, 60)
print(f'{days} {hours:02}:{minutes:02}:{seconds:02}')
