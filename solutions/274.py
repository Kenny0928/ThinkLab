# 思路：查表取得字母數值與類別，驗證餘數後計數；最後輸出所有等於最大值的類別。
letter_value = {"A": 11, "B": 13, "C": 15, "V": 17, "I": 19, "P": 21, "S": 23, "T": 25, "U": 27}
letter_group = {"A": 0, "B": 0, "C": 0, "V": 1, "I": 1, "P": 1, "S": 2, "T": 2, "U": 2}
names = ["普通會員", "貴賓會員", "學生會員"]
n = int(input())
cards = input().split()
counts = [0, 0, 0]
for card in cards:
    total = letter_value[card[0]] + sum(int(d) for d in card[1:])
    if total % 10 in (0, 1):
        counts[letter_group[card[0]]] += 1
best = max(counts)
if best == 0:
    print("無")
else:
    print(" ".join(names[i] for i in range(3) if counts[i] == best))
