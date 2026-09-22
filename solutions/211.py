# 核心思路：合併排序遇到右側較小值時，累加左側剩餘元素個數。
# 時間 O(N log N)；空間 O(N)。
import sys

def sort_and_count(values):
    if len(values) <= 1:
        return values, 0
    middle = len(values) // 2
    left, count_left = sort_and_count(values[:middle])
    right, count_right = sort_and_count(values[middle:])
    i = j = 0
    count = count_left + count_right
    merged = []
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
            count += len(left) - i
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged, count

def main():
    data = list(map(int, sys.stdin.read().split()))
    print(sort_and_count(data[1:])[1])

if __name__ == '__main__':
    main()
