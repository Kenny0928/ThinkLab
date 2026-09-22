# 核心：累計相同前綴餘數先前出現的次數，包含空前綴。時間 O(N + K)，空間 O(N + K)。
import sys
data = list(map(int, sys.stdin.read().split()))
n, k = data[:2]
counts = [0] * k
counts[0] = 1
remainder = answer = 0
for value in data[2:]:
    remainder = (remainder + value) % k
    answer += counts[remainder]
    counts[remainder] += 1
print(answer)
