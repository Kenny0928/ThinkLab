# 核心：在 L 加 D、R+1 減 D，最後前綴累加還原。時間 O(N + Q)，空間 O(N + Q)。
import sys
data = list(map(int, sys.stdin.read().split()))
n, q = data[:2]
diff = [0] * (n + 2)
for i in range(2, len(data), 3):
    left, right, delta = data[i:i + 3]
    diff[left] += delta
    diff[right + 1] -= delta
current = 0
answer = []
for pos in range(1, n + 1):
    current += diff[pos]
    answer.append(current)
print(*answer)
