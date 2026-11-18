# 思路：計算 BMI 並四捨五入到兩位小數，再以三段條件分類。
weight = float(input())
height = float(input())
bmi = round(weight / (height * height), 2)
if bmi < 18.5:
    level = "過輕"
elif bmi < 24:
    level = "標準"
else:
    level = "過重"
print(f"{bmi:.2f} {level}")
