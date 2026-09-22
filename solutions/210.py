# 核心思路：依結束時間排序，DP 比較不選與選取任務；bisect_right 找相容前綴。
# 時間 O(N log N)；空間 O(N)。
import sys
from bisect import bisect_right

def main():
    data = list(map(int, sys.stdin.read().split()))
    n = data[0]
    jobs = [(data[i + 1], data[i], data[i + 2]) for i in range(1, len(data), 3)]
    jobs.sort()
    ends = [end for end, start, reward in jobs]
    best = [0] * (n + 1)
    for i, (end, start, reward) in enumerate(jobs):
        compatible = bisect_right(ends, start, 0, i)
        best[i + 1] = max(best[i], best[compatible] + reward)
    print(best[n])

if __name__ == '__main__':
    main()
