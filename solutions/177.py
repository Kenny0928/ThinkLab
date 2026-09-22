# 思路：建立每月天數並調整閏年二月，再處理日、月進位；時間 O(1)，額外空間 O(1)。
year, month, day = map(int, input().split('-'))
days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
if year % 400 == 0 or (year % 4 == 0 and year % 100 != 0):
    days[1] = 29
day += 1
if day > days[month - 1]:
    day = 1
    month += 1
    if month > 12:
        month = 1
        year += 1
print(f'{year:04}-{month:02}-{day:02}')
