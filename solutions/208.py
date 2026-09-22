# 核心思路：Dijkstra 搭配最小堆，距離不符目前最佳值的舊紀錄直接略過。
# 時間 O((N+M) log(N+1))；空間 O(N+M)。
import sys
import heapq

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, m, source, target = data[:4]
    graph = [[] for _ in range(n + 1)]
    for i in range(4, len(data), 3):
        u, v, w = data[i:i + 3]
        graph[u].append((v, w))
        graph[v].append((u, w))
    distance = [float('inf')] * (n + 1)
    distance[source] = 0
    queue = [(0, source)]
    while queue:
        cost, u = heapq.heappop(queue)
        if cost != distance[u]:
            continue
        if u == target:
            break
        for v, weight in graph[u]:
            candidate = cost + weight
            if candidate < distance[v]:
                distance[v] = candidate
                heapq.heappush(queue, (candidate, v))
    print(-1 if distance[target] == float('inf') else distance[target])

if __name__ == '__main__':
    main()
