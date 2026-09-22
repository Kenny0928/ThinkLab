# 核心：儲存 ADD 的增減量，UNDO 時撤回堆疊頂端。時間 O(Q)，空間 O(Q)。
import sys
lines = sys.stdin.read().splitlines()
value, q = map(int, lines[0].split())
history = []
answers = []
for text in lines[1:]:
    op = text.split()
    if op[0] == 'ADD':
        delta = int(op[1])
        value += delta
        history.append(delta)
    elif op[0] == 'UNDO':
        if history:
            value -= history.pop()
    else:
        answers.append(str(value))
print('\n'.join(answers))
