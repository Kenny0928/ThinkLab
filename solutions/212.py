# 核心思路：Fenwick Tree 保存可更新前綴和，區間答案為 prefix(r)-prefix(l-1)。
# 時間 O((N+Q) log N)；空間 O(N+Q)，包含輸入與輸出緩衝。
import sys

def main():
    lines = sys.stdin.read().splitlines()
    n, q = map(int, lines[0].split())
    tree = [0] * (n + 1)
    def add(index, delta):
        while index <= n:
            tree[index] += delta
            index += index & -index
    def prefix(index):
        result = 0
        while index:
            result += tree[index]
            index -= index & -index
        return result
    for i, value in enumerate(map(int, lines[1].split()), 1):
        add(i, value)
    answer = []
    for line in lines[2:]:
        kind, x, y = map(int, line.split())
        if kind == 1:
            add(x, y)
        else:
            answer.append(str(prefix(y) - prefix(x - 1)))
    print('\n'.join(answer))

if __name__ == '__main__':
    main()
