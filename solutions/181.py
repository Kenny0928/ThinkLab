# 核心：prefix[i] 保存前 i 筆總額。時間 O(N + Q)，空間 O(N + Q)。
import sys
data = list(map(int, sys.stdin.read().split()))
n, q = data[:2]
prefix = [0]
for amount in data[2:2 + n]:
    prefix.append(prefix[-1] + amount)
answers = []
for i in range(2 + n, len(data), 2):
    left, right = data[i:i + 2]
    answers.append(str(prefix[right] - prefix[left - 1]))
print("\n".join(answers))
