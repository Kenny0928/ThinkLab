# 核心：dp[j] 記錄目前 A 前綴與 B 前 j 字元的 LCS 長度。時間 O(|A||B|)，空間 O(|A| + |B|)。
import sys
a = sys.stdin.readline().rstrip('\r\n')
b = sys.stdin.readline().rstrip('\r\n')
previous = [0] * (len(b) + 1)
for ca in a:
    current = [0]
    for j, cb in enumerate(b, 1):
        if ca == cb:
            current.append(previous[j - 1] + 1)
        else:
            current.append(max(previous[j], current[-1]))
    previous = current
print(previous[-1])
