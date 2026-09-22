# 核心：依總分降冪、筆試降冪、編號升冪排序。時間 O(N log N)，空間 O(N)。
import sys
tokens = list(map(int, sys.stdin.read().split()))
n = tokens[0]
records = [tuple(tokens[i:i + 3]) for i in range(1, len(tokens), 3)]
records.sort(key=lambda r: (-(r[1] + r[2]), -r[1], r[0]))
print(*(r[0] for r in records))
