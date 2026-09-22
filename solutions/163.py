# 思路：追蹤目前字母及次數，遇不同字母就結算連段；時間 O(L)，空間 O(L)。
text = input()
result = []
current = text[0]
count = 1
for char in text[1:]:
    if char == current:
        count += 1
    else:
        result.append(current + str(count))
        current, count = char, 1
result.append(current + str(count))
print(' '.join(result))
