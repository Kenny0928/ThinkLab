# 核心思路：Kruskal 按成本排序，以並查集選出不形成環的邊。
# 時間 O(M log(M+1) + N)；空間 O(N+M)。
import sys

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, m = data[:2]
    edges = [(data[i + 2], data[i], data[i + 1]) for i in range(2, len(data), 3)]
    edges.sort()
    parent = list(range(n + 1))
    size = [1] * (n + 1)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    total = used = 0
    for weight, u, v in edges:
        u, v = find(u), find(v)
        if u == v:
            continue
        if size[u] < size[v]:
            u, v = v, u
        parent[v] = u
        size[u] += size[v]
        total += weight
        used += 1
    print(total if used == n - 1 else -1)

if __name__ == '__main__':
    main()
