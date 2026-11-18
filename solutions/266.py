# 思路：依密度由大到小做穩定排序；key 取負的密度即可保留同密度的輸入順序。
tokens = input().split()
items = []
for i in range(0, len(tokens), 2):
    items.append((tokens[i], int(tokens[i + 1])))
items.sort(key=lambda item: -item[1])
print(" ".join(code for code, _ in items))
