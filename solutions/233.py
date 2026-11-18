# 思路：套票 800 元比分開買 900 元便宜，因此盡量組成套票，其餘單買。
child = int(input())
adult = int(input())
sets = min(child, adult)
print(sets * 800 + (child - sets) * 400 + (adult - sets) * 500)
