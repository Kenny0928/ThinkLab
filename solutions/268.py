# 思路：標準氣泡排序，外層 N-1 輪；每輪結束輸出序列，並累計交換次數。
n = int(input())
heights = list(map(int, input().split()))
swaps = 0
for i in range(n - 1):
    for j in range(n - 1 - i):
        if heights[j] > heights[j + 1]:
            heights[j], heights[j + 1] = heights[j + 1], heights[j]
            swaps += 1
    print(" ".join(map(str, heights)))
print(swaps)
