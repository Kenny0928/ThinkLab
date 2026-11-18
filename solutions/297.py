# 思路：f[j] = (以 j 結尾的最長長度, 該長度下最早的起始日)；比較時長度大者優先，長度相同取起始日小者。
# 最後在所有 j 中，依（長度最大、起始日最早、結束日最早）挑出答案；時間 O(n^2)。
first = input().split()
n, threshold = int(first[0]), float(first[1])
temp = list(map(float, input().split()))
length = [0] * n
start = [0] * n
for j in range(n):
    if temp[j] < threshold:
        continue
    length[j], start[j] = 1, j
    for i in range(j):
        if length[i] and temp[i] < temp[j]:
            if length[i] + 1 > length[j] or (length[i] + 1 == length[j] and start[i] < start[j]):
                length[j], start[j] = length[i] + 1, start[i]
best = None
for j in range(n):
    if length[j] >= 2:
        key = (-length[j], start[j], j)
        if best is None or key < best:
            best = key
if best is None:
    print(0, 0)
else:
    print(best[2] - best[1] + 1, best[1] + 1)
