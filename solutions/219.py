# 思路：枚舉每個長度 K 的連續區段，計算其中最喜歡字母的數量並取最大值。
# 積木對照：讀入清單、K 與字母 → 對每個起點：數區段內有幾個該字母 → 若比最大值大則更新 → 說出最大值。
n = int(input())
films = input().split()
k, favorite = input().split()
k = int(k)
best = 0
for start in range(n - k + 1):
    count = 0
    for film in films[start:start + k]:
        if film == favorite:
            count += 1
    if count > best:
        best = count
print(best)
