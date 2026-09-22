# 思路：只枚舉 i < j 的兩人，依組別和能力差判斷；時間 O(N²)，空間 O(N)。
n, limit = map(int, input().split())
people = [tuple(map(int, input().split())) for _ in range(n)]
answer = 0
for i in range(n):
    for j in range(i + 1, n):
        if people[i][0] != people[j][0] and abs(people[i][1] - people[j][1]) <= limit:
            answer += 1
print(answer)
