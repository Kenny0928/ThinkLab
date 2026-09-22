# 思路：先排除外部，再看是否碰到任一邊界；時間 O(N)，額外空間 O(1)。
x1, y1, x2, y2, n = map(int, input().split())
inside = boundary = outside = 0
for _ in range(n):
    x, y = map(int, input().split())
    if not (x1 <= x <= x2 and y1 <= y <= y2):
        outside += 1
    elif x == x1 or x == x2 or y == y1 or y == y2:
        boundary += 1
    else:
        inside += 1
print(inside, boundary, outside)
