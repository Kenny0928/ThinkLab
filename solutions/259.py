# 思路：同位置相同計入 A；數字在答案中但位置不同計入 B。
n = int(input())
answer = input().split()
guess = input().split()
a = b = 0
for i in range(n):
    if guess[i] == answer[i]:
        a += 1
    elif guess[i] in answer:
        b += 1
print(f"{a}A{b}B")
