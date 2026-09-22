# 核心思路：Kahn 拓撲排序，將到達節點的路徑數沿每條邊傳遞。
# 時間 O(N+M)；空間 O(N+M)。
import sys
from collections import deque
MOD = 1000000007

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, m, source, target = data[:4]
    graph = [[] for _ in range(n + 1)]
    indegree = [0] * (n + 1)
    for i in range(4, len(data), 2):
        u, v = data[i:i + 2]
        graph[u].append(v)
        indegree[v] += 1
    queue = deque(i for i in range(1, n + 1) if indegree[i] == 0)
    ways = [0] * (n + 1)
    ways[source] = 1
    while queue:
        u = queue.popleft()
        for v in graph[u]:
            ways[v] = (ways[v] + ways[u]) % MOD
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    print(ways[target])

if __name__ == '__main__':
    main()
