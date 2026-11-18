# 思路：計算三款票數，找最高票數並檢查是否只有一個款式達到。
# 積木對照：三個計數變數 → 逐張選票加一 → 求最大值 → 數有幾款等於最大值 → 只有一款就說出編號，否則說出「請重新投票」。
n = int(input())
votes = list(map(int, input().split()))
counts = [0, 0, 0]
for v in votes:
    counts[v - 1] += 1
top = max(counts)
if counts.count(top) == 1:
    print(counts.index(top) + 1)
else:
    print("請重新投票")
