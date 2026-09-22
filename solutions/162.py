# 思路：依索引奇偶累加權重，再補至下一個十的倍數；時間 O(L)，空間 O(L)。
digits = input()
total = 0
for i, char in enumerate(digits):
    total += int(char) * (1 if i % 2 == 0 else 3)
print((10 - total % 10) % 10)
