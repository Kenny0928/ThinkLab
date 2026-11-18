# 思路：計算每隻的戰鬥力後由大到小排序，取第 2 名。讀取時以所有空白分隔的字詞處理，換行或同一行都可。
import sys

tokens = sys.stdin.read().split()
n = int(tokens[0])
team = []
for i in range(n):
    name = tokens[1 + 3 * i]
    attack = int(tokens[2 + 3 * i])
    defense = int(tokens[3 + 3 * i])
    if attack > defense:
        bonus = 2
    elif attack == defense:
        bonus = 3
    else:
        bonus = 1
    team.append(((attack + defense) * bonus, name, attack, defense))
team.sort(reverse=True)
power, name, attack, defense = team[1]
print(name, attack, defense, power)
