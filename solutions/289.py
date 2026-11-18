# 思路：掃描連續段長度；只有在嚴格大於最大值時更新，以保留最先出現者。
text = input().strip()
best_char, best_len = text[0], 1
run = 1
for i in range(1, len(text)):
    if text[i] == text[i - 1]:
        run += 1
    else:
        run = 1
    if run > best_len:
        best_char, best_len = text[i], run
print(best_char, best_len)
