# 思路：查表取得字母數值，加上其餘 5 個數字，檢查除以 5 的餘數是否為 4。
card = input().strip()
letter_value = {"A": 11, "B": 13, "C": 15, "D": 17}
total = letter_value[card[0]]
for ch in card[1:]:
    total += int(ch)
print("yes" if total % 5 == 4 else "no")
