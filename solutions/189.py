# 核心：最重者一定需要一艘船，若可行就配最輕者。時間 O(N log N)，空間 O(N)。
import sys
data = list(map(int, sys.stdin.read().split()))
n, capacity = data[:2]
weights = sorted(data[2:])
left, right = 0, n - 1
boats = 0
while left <= right:
    if left < right and weights[left] + weights[right] <= capacity:
        left += 1
    right -= 1
    boats += 1
print(boats)
