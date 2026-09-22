# 核心：左括號入堆疊，右括號核對堆疊頂端。時間 O(N)，空間 O(N)。
import sys
text = sys.stdin.readline().rstrip("\r\n")
matching = {')': '(', ']': '[', '}': '{'}
stack = []
valid = True
for ch in text:
    if ch in '([{':
        stack.append(ch)
    elif not stack or stack.pop() != matching[ch]:
        valid = False
        break
print('YES' if valid and not stack else 'NO')
