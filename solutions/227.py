# 思路：依件數 1、2、3 的順序、同件數依編號字典序枚舉組合，第一個符合者即為答案。
attack = int(input())
defense = int(input())
values = list(map(int, input().split()))
plus_attack, plus_defense = values[:3], values[3:]
combos = [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]
answer = "0"
for combo in combos:
    a = attack + sum(plus_attack[i - 1] for i in combo)
    d = defense + sum(plus_defense[i - 1] for i in combo)
    if a == d:
        answer = " ".join(map(str, combo))
        break
print(answer)
