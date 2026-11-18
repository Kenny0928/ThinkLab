# 思路：奇數清單遞增排序、偶數清單遞減排序，再接在一起。
n = int(input())
weights = list(map(int, input().split()))
odd = sorted(w for w in weights if w % 2 == 1)
even = sorted((w for w in weights if w % 2 == 0), reverse=True)
print(" ".join(map(str, odd + even)))
