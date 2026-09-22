# 核心：從未走訪陸地啟動迭代 DFS，走訪時立即標記。時間 O(RC)，空間 O(RC)。
import sys
lines = sys.stdin.read().split()
rows, cols = map(int, lines[:2])
grid = [list(row) for row in lines[2:]]
regions = largest = 0
for r in range(rows):
    for c in range(cols):
        if grid[r][c] != '1':
            continue
        regions += 1
        stack = [(r, c)]
        grid[r][c] = '0'
        size = 0
        while stack:
            x, y = stack.pop()
            size += 1
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == '1':
                    grid[nx][ny] = '0'
                    stack.append((nx, ny))
        largest = max(largest, size)
print(regions, largest)
