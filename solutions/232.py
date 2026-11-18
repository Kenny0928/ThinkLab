# 思路：計算字串中 6 的個數，再對應到獎金。
# 積木對照：計數設為 0 → 對每個字元：如果是 6 計數加一 → 依計數說出 0、100、200 或 500。
card = input().strip()
sixes = 0
for ch in card:
    if ch == "6":
        sixes += 1
if sixes == 3:
    print(500)
elif sixes == 2:
    print(200)
elif sixes == 1:
    print(100)
else:
    print(0)
