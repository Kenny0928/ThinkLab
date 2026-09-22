# 核心思路：兩個背包狀態分別記錄未用券與已用券；預算倒序，先更新已用券狀態。
# 時間 O(NB)（B=0 時 O(N)）；空間 O(B+N)，包含輸入。
import sys

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, budget = data[:2]
    unused = [0] * (budget + 1)
    used = [-10**30] * (budget + 1)
    for i in range(2, len(data), 2):
        price, value = data[i:i + 2]
        discounted = price // 2
        for money in range(budget, -1, -1):
            if money >= price:
                used[money] = max(used[money], used[money - price] + value)
            if money >= discounted:
                used[money] = max(used[money], unused[money - discounted] + value)
            if money >= price:
                unused[money] = max(unused[money], unused[money - price] + value)
    print(max(unused[budget], used[budget]))

if __name__ == '__main__':
    main()
