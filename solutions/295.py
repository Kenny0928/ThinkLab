# 思路：以清單保存螢幕數字，依數字移動並翻轉正負號，直到遇到 0 或已進入 11 次。
rooms = {
    "A": [1, 2, 3, -1, -2, -3, 1, 2, 3, -3, -2, -1],
    "B": [-2, -2, -3, -2, -2, -3, -2, -2, -3, -2, -2, -3],
    "C": [1, 2, -1, 0, 1, -2, 2, 1, -1, 2, -2, 0],
}
group, start = input().split()
screen = rooms[group][:]
pos = int(start) - 1
path = [pos + 1]
while screen[pos] != 0 and len(path) < 11:
    step = screen[pos]
    screen[pos] = -step
    pos = (pos + step) % 12
    path.append(pos + 1)
print(" ".join(map(str, path)))
