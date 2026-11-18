# 思路：套用公式，以兩位小數格式輸出。
# 積木對照：讀入半徑與高 → 體積 = 半徑 × 半徑 × 3.14 × 高 → 四捨五入到兩位小數後說出。
r = int(input())
h = int(input())
volume = r * r * 3.14 * h
print(f"{volume:.2f}")
