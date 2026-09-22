# 核心思路：路徑壓縮與依集合大小合併，查詢兩個根是否相同。
# 時間 O((N+Q) α(N))；空間 O(N+Q)，包含輸入與輸出緩衝。
import sys

def main():
    lines = sys.stdin.read().splitlines()
    n, q = map(int, lines[0].split())
    parent = list(range(n + 1))
    size = [1] * (n + 1)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    answer = []
    for line in lines[1:]:
        kind, a, b = map(int, line.split())
        a, b = find(a), find(b)
        if kind == 2:
            answer.append('YES' if a == b else 'NO')
        elif a != b:
            if size[a] < size[b]:
                a, b = b, a
            parent[b] = a
            size[a] += size[b]
    print('\n'.join(answer))

if __name__ == '__main__':
    main()
