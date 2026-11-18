# 思路：公分轉公尺計算 BMI，四捨五入到一位小數後再依區間分類。
height = int(input()) / 100
weight = int(input())
bmi = round(weight / (height * height), 1)
if bmi < 18.5:
    level = "體重過輕"
elif bmi < 25:
    level = "正常範圍"
elif bmi < 30:
    level = "體重過重"
elif bmi < 35:
    level = "輕度肥胖"
elif bmi < 40:
    level = "中度肥胖"
else:
    level = "重度肥胖"
print(f"{bmi:.1f} {level}")
