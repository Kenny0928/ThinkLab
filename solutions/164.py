# 思路：用索引讀字母與其後完整數字段，依次數展開；時間 O(L + K)，空間 O(K)，K 為輸出長度。
code = input()
result = []
i = 0
while i < len(code):
    letter = code[i]
    i += 1
    count = 0
    while i < len(code) and '0' <= code[i] <= '9':
        count = count * 10 + int(code[i])
        i += 1
    result.append(letter * count)
print(''.join(result))
