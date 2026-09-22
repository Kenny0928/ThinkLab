# 核心：逐一對每個連通分量 BFS 染兩色，相鄰同色即矛盾。時間 O(N + M)，空間 O(N + M)。
import sys
from collections import deque
data = list(map(int, sys.stdin.read().split()))
n, m = data[:2]
graph = [[] for _ in range(n)]
for i in range(2, len(data), 2):
    u, v = data[i] - 1, data[i + 1] - 1
    graph[u].append(v)
    graph[v].append(u)
color = [-1] * n
valid = True
for start in range(n):
    if color[start] != -1:
        continue
    color[start] = 0
    queue = deque([start])
    while queue:
        u = queue.popleft()
        for v in graph[u]:
            if color[v] == -1:
                color[v] = 1 - color[u]
                queue.append(v)
            elif color[v] == color[u]:
                valid = False
print('YES' if valid else 'NO')
