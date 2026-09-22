# 思路：逐筆更新水量，加水受容量限制，取水不足則拒絕；時間 O(N)，額外空間 O(1)。
capacity, volume, n = map(int, input().split())
failures = 0
for _ in range(n):
    op, amount = input().split()
    amount = int(amount)
    if op == 'F':
        volume = min(capacity, volume + amount)
    elif amount <= volume:
        volume -= amount
    else:
        failures += 1
print(volume, failures)
