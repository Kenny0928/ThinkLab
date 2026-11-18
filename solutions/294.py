# 思路：由高到低處理每個積分組，整組放得下就邀請，放不下就停止；最後依編號輸出。
k, n = map(int, input().split())
scores = list(map(int, input().split()))
invited = []
for value in sorted(set(scores), reverse=True):
    group = [i for i in range(n) if scores[i] == value]
    if len(invited) + len(group) > k:
        break
    invited += group
if invited:
    print(" ".join(str(i + 1) for i in sorted(invited)))
else:
    print(0)
