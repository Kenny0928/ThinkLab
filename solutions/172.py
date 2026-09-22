# 思路：逐列逐欄判斷四條邊，組成一行後輸出；時間 O(HW)，額外空間 O(W)。
h, w = map(int, input().split())
for r in range(h):
    row = []
    for c in range(w):
        if r == 0 or r == h - 1 or c == 0 or c == w - 1:
            row.append('#')
        else:
            row.append('.')
    print(''.join(row))
