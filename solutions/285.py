# 思路：走訪每個字元，是數字就轉成整數加入總和。
# 積木對照：總和設為 0 → 對字串的每個字：如果是 0～9，總和加上它 → 說出總和。
text = input().strip()
total = 0
for ch in text:
    if "0" <= ch <= "9":
        total += int(ch)
print(total)
