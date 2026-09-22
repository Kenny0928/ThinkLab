# 思路：取時間對週期的餘數，比較是否小於綠燈秒數；時間 O(Q)，空間 O(Q)（輸入清單）。
green, red, q = map(int, input().split())
times = list(map(int, input().split()))
for time in times:
    print('GREEN' if time % (green + red) < green else 'RED')
