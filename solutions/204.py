# 核心思路：二分容量，每次由左至右盡量裝滿一車以判定車數。
# 時間 O(N log(sum(w)))；空間 O(N)。
import sys

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, k = data[:2]
    weights = data[2:]
    low, high = max(weights), sum(weights)
    while low < high:
        capacity = (low + high) // 2
        cars, load = 1, 0
        for weight in weights:
            if load + weight > capacity:
                cars += 1
                load = 0
            load += weight
        if cars <= k:
            high = capacity
        else:
            low = capacity + 1
    print(low)

if __name__ == '__main__':
    main()
