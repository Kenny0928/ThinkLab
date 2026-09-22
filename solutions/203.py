# 核心：同色正方形直接計數，否則切為四個子區域遞迴。時間 O(N² log N)，空間 O(N²)。
import sys
lines = sys.stdin.read().split()
n = int(lines[0])
grid = lines[1:]
counts = [0, 0]
def split(row, col, size):
    color = grid[row][col]
    same = all(grid[r][c] == color for r in range(row, row + size) for c in range(col, col + size))
    if same:
        counts[int(color)] += 1
        return
    half = size // 2
    for dr in (0, half):
        for dc in (0, half):
            split(row + dr, col + dc, half)
split(0, 0, n)
print(*counts)
