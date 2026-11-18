# 思路：配對後依分數由高到低排序，取前 (N + 1) // 2 名。
n = int(input())
tokens = input().split()
teams = []
for i in range(n):
    teams.append((int(tokens[2 * i + 1]), tokens[2 * i]))
teams.sort(reverse=True)
print(" ".join(name for _, name in teams[:(n + 1) // 2]))
