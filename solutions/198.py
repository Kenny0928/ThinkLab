# 核心：BFS 第一次到達節點時即可確定最少邊數。時間 O(N + M)，空間 O(N + M)。
import sys
from collections import deque
data = list(map(int, sys.stdin.read().split()))
n, m, source, target = data[:4]
graph = [[] for _ in range(n + 1)]
for i in range(4, len(data), 2):
    u, v = data[i:i + 2]
    graph[u].append(v)
    graph[v].append(u)
distance = [-1] * (n + 1)
distance[source] = 0
queue = deque([source])
while queue:
    u = queue.popleft()
    for v in graph[u]:
        if distance[v] == -1:
            distance[v] = distance[u] + 1
            queue.append(v)
print(distance[target])
