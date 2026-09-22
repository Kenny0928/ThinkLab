# 核心：二維前綴和用容斥去掉重疊區。時間 O(RC + Q)，空間 O(RC + Q)。
import sys
it = iter(map(int, sys.stdin.read().split()))
rows, cols, q = next(it), next(it), next(it)
prefix = [[0] * (cols + 1) for _ in range(rows + 1)]
for r in range(1, rows + 1):
    for c in range(1, cols + 1):
        prefix[r][c] = next(it) + prefix[r - 1][c] + prefix[r][c - 1] - prefix[r - 1][c - 1]
answers = []
for _ in range(q):
    r1, c1, r2, c2 = next(it), next(it), next(it), next(it)
    answers.append(str(prefix[r2][c2] - prefix[r1 - 1][c2] - prefix[r2][c1 - 1] + prefix[r1 - 1][c1 - 1]))
print("\n".join(answers))
