# 核心：建立父節點與走訪序，逆序將子樹大小加給父節點。時間 O(N)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
n = data[0]
graph = [[] for _ in range(n + 1)]
for i in range(1, len(data), 2):
    u, v = data[i:i + 2]
    graph[u].append(v)
    graph[v].append(u)
parent = [0] * (n + 1)
order = [1]
for u in order:
    for v in graph[u]:
        if v != parent[u]:
            parent[v] = u
            order.append(v)
size = [1] * (n + 1)
for u in reversed(order[1:]):
    size[parent[u]] += size[u]
print(*size[1:])
