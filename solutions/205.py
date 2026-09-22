# 核心思路：deque 保存值遞減的索引，移除過期索引後取最前方。
# 時間 O(N)；演算法額外空間 O(K)，含輸入與輸出緩衝共 O(N)。
import sys
from collections import deque

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, k = data[:2]
    values = data[2:]
    candidates = deque()
    answer = []
    for i, value in enumerate(values):
        while candidates and candidates[0] <= i - k:
            candidates.popleft()
        while candidates and values[candidates[-1]] <= value:
            candidates.pop()
        candidates.append(i)
        if i >= k - 1:
            answer.append(str(values[candidates[0]]))
    print(' '.join(answer))

if __name__ == '__main__':
    main()
