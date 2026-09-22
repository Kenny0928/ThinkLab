# 核心：deque 保存編號與剩餘時間。時間 O(N + Σ ceil(Ti/K))，空間 O(N)。
import sys
from collections import deque
data = list(map(int, sys.stdin.read().split()))
n, quantum = data[:2]
queue = deque(enumerate(data[2:], 1))
answer = []
while queue:
    task, remaining = queue.popleft()
    if remaining <= quantum:
        answer.append(task)
    else:
        queue.append((task, remaining - quantum))
print(*answer)
