# 思路：以字串記錄狀態，依「目前狀態＋指令」決定下一個狀態；END 後停止處理。
n = int(input())
commands = input().split()
state = "IDLE"
count = 0
for c in commands:
    if state == "END":
        break
    if state == "IDLE":
        if c == "S":
            state = "OPEN"
            count += 1
    elif state == "OPEN":
        if c == "P":
            state = "PAUSED"
        elif c == "E":
            state = "END"
    elif state == "PAUSED":
        if c == "R":
            state = "OPEN"
        elif c == "E":
            state = "END"
print(state, count)
