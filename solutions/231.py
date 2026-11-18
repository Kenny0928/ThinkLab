# 思路：三組兩邊和都必須大於第三邊。
input()
a, b, c = map(int, input().split())
if a + b > c and a + c > b and b + c > a:
    print("yes")
else:
    print("no")
