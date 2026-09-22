# 思路：票值作為清單索引，找最高有效票數並依序輸出並列者；時間 O(N + M)，空間 O(N + M)。
m, n = map(int, input().split())
votes = list(map(int, input().split()))
counts = [0] * (m + 1)
for vote in votes:
    counts[vote] += 1
print(counts[0])
maximum = max(counts[1:])
if maximum == 0:
    print('NONE')
else:
    print(' '.join(str(i) for i in range(1, m + 1) if counts[i] == maximum))
