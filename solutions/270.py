# 思路：用 is_open 記錄狀態；關閉狀態收到 O 才計數。
# 積木對照：狀態設為關 → 對每個指令：如果是 O 且目前關閉，次數加一 → 依指令設定狀態 → 說出狀態與次數。
n = int(input())
commands = input().split()
is_open = False
count = 0
for c in commands:
    if c == "O":
        if not is_open:
            count += 1
        is_open = True
    else:
        is_open = False
print("OPEN" if is_open else "CLOSED", count)
