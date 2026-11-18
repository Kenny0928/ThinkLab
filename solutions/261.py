# 思路：逐指令、逐步移動，下一步若越界則跳過該步。
n = int(input())
commands = input().split()
x = y = 0
moves = {"U": (0, 1), "D": (0, -1), "L": (-1, 0), "R": (1, 0)}
for command in commands:
    dx, dy = moves[command[0]]
    for _ in range(int(command[1:])):
        nx, ny = x + dx, y + dy
        if 0 <= nx <= 10 and 0 <= ny <= 10:
            x, y = nx, ny
print(f"({x},{y})")
