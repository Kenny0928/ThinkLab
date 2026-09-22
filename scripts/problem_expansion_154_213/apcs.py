#!/usr/bin/env python3
"""204–213 原創挑戰題：--write 明確重建，預設驗證已落檔內容及固定種子對拍。

小測資用獨立窮舉／直接模擬 oracle；最大測資用可證的特殊結構答案。
執行：python3 scripts/problem_expansion_154_213/apcs.py [--write]
"""
from pathlib import Path
from itertools import combinations
import argparse
import io
import json
import random
import runpy
import sys
from contextlib import redirect_stdout

ROOT = Path(__file__).resolve().parents[2]
MOD = 1_000_000_007
SOLUTIONS = {}
SPECS = {}
BUILDERS = {}
RANDOM = {}
ORACLES = {}


def specification(pid, title, difficulty, advanced, tags, goals, prerequisites,
                  description, input_format, output_format, constraints, hint):
    SPECS[pid] = dict(id=pid, title=title, stage='Challenge', difficulty=difficulty,
                     audienceLevel='A-HS' if advanced else 'M-HS',
                     apcsLevel='APCS-Advanced' if advanced else 'APCS-Implementation',
                     platformMode='Python', tags=tags, learningObjectives=goals,
                     prerequisites=prerequisites, description=description,
                     inputFormat=input_format, outputFormat=output_format,
                     constraints='<ul>'+''.join('<li>'+s+'</li>' for s in constraints)+'</ul>',
                     hint='<p>'+hint+'</p>', timeLimit=3, memoryLimit=256)


def case(inp, answer):
    return {'input': inp, 'output': str(answer)}


def rows(first, data):
    return '\n'.join([first]+[' '.join(map(str, r)) for r in data])


# 204: cut-position enumeration is independent of binary-search/greedy solution.
def pack_input(a, k):
    return f'{len(a)} {k}\n'+' '.join(map(str, a))


def pack_oracle(inp):
    z=list(map(int, inp.split())); n,k=z[:2]; a=z[2:]
    best=sum(a)
    for mask in range(1 << (n-1)):
        if mask.bit_count()+1 > k: continue
        load=peak=0
        for i,x in enumerate(a):
            load += x
            if i == n-1 or mask >> i & 1:
                peak=max(peak,load); load=0
        best=min(best,peak)
    return best

specification(204,'連續包裹分車','Easy',False,['二分搜尋','貪心','答案單調性'],
    ['把最小化最大負載轉為容量可行性判定','利用單調性二分搜尋答案'],
    ['清單','貪心','二分搜尋'],
    "<p class='problem-lead'>依照包裹順序分車，求每車所需的最小共同容量。</p><p>有 <code>N</code> 個包裹，重量依序為 <code>w₁ … wₙ</code>。最多使用 <code>K</code> 輛車，每輛使用中的車必須承接一段非空、連續的包裹；所有包裹恰好運送一次，不能改變順序或拆開包裹。所有車的容量相同，求可完成配送的最小整數容量。</p>",
    '<p>第一行是 <code>N K</code>。第二行是 <code>N</code> 個包裹重量。</p>',
    '<p>輸出一個整數，代表最小共同容量。</p>',
    ['1 ≤ K ≤ N ≤ 30000','1 ≤ wᵢ ≤ 10⁹'],
    '如果某個容量已足夠，更大的容量也一定足夠。')
SOLUTIONS[204] = '''# 核心思路：二分容量，每次由左至右盡量裝滿一車以判定車數。
# 時間 O(N log(sum(w)))；空間 O(N)。
import sys

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, k = data[:2]
    weights = data[2:]
    low, high = max(weights), sum(weights)
    while low < high:
        capacity = (low + high) // 2
        cars, load = 1, 0
        for weight in weights:
            if load + weight > capacity:
                cars += 1
                load = 0
            load += weight
        if cars <= k:
            high = capacity
        else:
            low = capacity + 1
    print(low)

if __name__ == '__main__':
    main()
'''

def build204():
    small=[([2,3,4,2,5],3),([7],1),([4,4,4],2),([1,1],2),([1,10,1],1),
           ([10,1,1,10],2),([1,2,3,4,5],5),([5,4,3,2,1],2),
           ([1,1,1,1,1,1],4),([1_000_000_000,1],2),([8,1,1,8,1,1],3)]
    out=[case(pack_input(a,k),pack_oracle(pack_input(a,k))) for a,k in small]
    # Equal weights: each truck holds at most ceil(N/K) packages at optimum.
    out.append(case(pack_input([1_000_000_000]*30000,137),219_000_000_000))
    return out
BUILDERS[204]=build204; ORACLES[204]=pack_oracle
def random204(r):
    n=r.randint(1,9); return pack_input([r.randint(1,30) for _ in range(n)],r.randint(1,n))
RANDOM[204]=random204


# 205: direct slice maxima provide a deliberately quadratic small oracle.
def window_input(a,k): return f'{len(a)} {k}\n'+' '.join(map(str,a))
def window_oracle(inp):
    z=list(map(int,inp.split())); n,k=z[:2]; a=z[2:]
    return ' '.join(str(max(a[i:i+k])) for i in range(n-k+1))
specification(205,'觀測窗的最高溫','Easy',False,['滑動視窗','單調佇列','deque'],
    ['維護固定長度視窗的最大值','淘汰過期與不可能再成為最大值的元素'],
    ['清單索引','佇列','時間複雜度'],
    "<p class='problem-lead'>輸出每一段連續 K 筆觀測值中的最大值。</p><p>共有 <code>N</code> 筆整數觀測值。第一個觀測窗包含第 <code>1</code> 至第 <code>K</code> 筆，之後每次向右移動一筆，直到最後一窗包含第 <code>N−K+1</code> 至第 <code>N</code> 筆。依序輸出每個觀測窗的最大值；相同數值可以重複出現。</p>",
    '<p>第一行是 <code>N K</code>。第二行是 <code>N</code> 個觀測值。</p>',
    '<p>輸出一行，共 <code>N−K+1</code> 個整數，以一個半形空格分隔。</p>',
    ['1 ≤ K ≤ N ≤ 50000','−10⁹ ≤ 觀測值 ≤ 10⁹'],
    '較晚出現且不小於前方元素的值，會讓那個前方元素失去成為最大值的機會。')
SOLUTIONS[205]='''# 核心思路：deque 保存值遞減的索引，移除過期索引後取最前方。
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
'''
def build205():
    small=[([2,1,5,3,4],3),([-5,-2,-7],2),([9],1),([1,2,3,4],1),
           ([4,3,2,1],4),([6,6,6,6],2),([3,1,3,1,3],2),([0,0,1,0],3),
           ([-10**9,10**9],2),([9,8,7,6,5,4],3),([1,4,2,8,3,9],4)]
    out=[case(window_input(a,k),window_oracle(window_input(a,k))) for a,k in small]
    # Strictly decreasing: each window's left endpoint is its maximum.
    a=list(range(50000,0,-1)); out.append(case(window_input(a,25000),' '.join(map(str,a[:25001]))))
    return out
BUILDERS[205]=build205; ORACLES[205]=window_oracle
def random205(r):
    n=r.randint(1,16); return window_input([r.randint(-8,8) for _ in range(n)],r.randint(1,n))
RANDOM[205]=random205


# 206: explicit component labels make an independent O(NQ) oracle.
def dsu_input(n,ops): return rows(f'{n} {len(ops)}',ops)
def dsu_oracle(inp):
    lines=inp.splitlines(); n,q=map(int,lines[0].split()); label=list(range(n+1)); out=[]
    for line in lines[1:]:
        t,a,b=map(int,line.split())
        if t==1:
            old,new=label[b],label[a]
            label=[new if x==old else x for x in label]
        else: out.append('YES' if label[a]==label[b] else 'NO')
    return '\n'.join(out)
specification(206,'社團合併查詢','Easy',False,['並查集','連通性','資料結構'],
    ['用並查集維護持續合併的群組','區分成員編號與所屬集合'],
    ['清單','函式','樹狀結構'],
    "<p class='problem-lead'>依序合併社團，並回答兩位學生是否已在同一社團。</p><p>學生編號為 <code>1</code> 至 <code>N</code>，起初每人各自一個社團。操作 <code>1 a b</code> 會合併 a、b 所在的兩個社團；若已在同一社團則不改變任何狀態。操作 <code>2 a b</code> 查詢當下是否同社團。允許 <code>a = b</code>，也允許重複合併；不會拆分社團。</p>",
    '<p>第一行是 <code>N Q</code>。接下來 <code>Q</code> 行，每行一個操作 <code>1 a b</code> 或 <code>2 a b</code>。</p>',
    '<p>每個查詢各輸出一行：同社團輸出 <code>YES</code>，否則輸出 <code>NO</code>。</p>',
    ['1 ≤ N, Q ≤ 30000','1 ≤ a, b ≤ N','至少有一個查詢操作'],
    '以一個代表節點辨識整個社團，合併時只需要連接兩個代表。')
SOLUTIONS[206]='''# 核心思路：路徑壓縮與依集合大小合併，查詢兩個根是否相同。
# 時間 O((N+Q) α(N))；空間 O(N+Q)，包含輸入與輸出緩衝。
import sys

def main():
    lines = sys.stdin.read().splitlines()
    n, q = map(int, lines[0].split())
    parent = list(range(n + 1))
    size = [1] * (n + 1)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    answer = []
    for line in lines[1:]:
        kind, a, b = map(int, line.split())
        a, b = find(a), find(b)
        if kind == 2:
            answer.append('YES' if a == b else 'NO')
        elif a != b:
            if size[a] < size[b]:
                a, b = b, a
            parent[b] = a
            size[a] += size[b]
    print('\\n'.join(answer))

if __name__ == '__main__':
    main()
'''
def build206():
    small=[(4,[(2,1,2),(1,1,2),(2,1,2),(2,2,3)]),(1,[(2,1,1)]),
           (3,[(1,1,2),(1,2,3),(2,1,3)]),(2,[(1,1,1),(2,1,2)]),
           (2,[(1,1,2),(1,2,1),(2,2,1)]),(5,[(2,1,5),(2,3,3)]),
           (4,[(1,1,2),(1,3,4),(2,1,4),(1,2,3),(2,1,4)]),
           (3,[(2,1,3),(1,1,3),(2,1,3),(2,1,2)]),
           (6,[(1,6,5),(1,4,3),(1,5,4),(2,6,3)]),
           (3,[(1,2,2),(2,2,2),(2,1,2)]),(30000,[(2,1,30000)])]
    out=[case(dsu_input(n,op),dsu_oracle(dsu_input(n,op))) for n,op in small]
    # Growing chain with a query after every merge defeats graph traversal per query.
    ops=[op for i in range(2,15002) for op in ((1,i-1,i),(2,1,i))]
    out.append(case(dsu_input(30000,ops),'\n'.join(['YES']*15000)))
    return out
BUILDERS[206]=build206; ORACLES[206]=dsu_oracle
def random206(r):
    n=r.randint(1,12); op=[(r.randint(1,2),r.randint(1,n),r.randint(1,n)) for _ in range(r.randint(1,30))]
    op.append((2,r.randint(1,n),r.randint(1,n))); return dsu_input(n,op)
RANDOM[206]=random206


# 207: enumerate every path, without DP, on small DAGs.
def dag_input(n,edges,s,t): return rows(f'{n} {len(edges)} {s} {t}',edges)
def dag_oracle(inp):
    z=list(map(int,inp.split())); n,m,s,t=z[:4]; adj=[[] for _ in range(n+1)]
    for i in range(4,len(z),2): adj[z[i]].append(z[i+1])
    def walk(u): return 1 if u==t else sum(walk(v) for v in adj[u])
    return walk(s)%MOD
specification(207,'終點路線計數','Medium',False,['拓撲排序','動態規劃','有向無環圖'],
    ['依拓撲順序累加路徑數','在計數過程中取餘數'],
    ['有向圖','佇列','動態規劃'],
    "<p class='problem-lead'>計算有向無環圖中，從起點到終點的不同路線數。</p><p>有 <code>N</code> 個站點與 <code>M</code> 條單向道路。沿著道路方向，從 <code>S</code> 到 <code>T</code> 的路線有幾條？只要經過的道路序列不同，就算不同路線。答案可能很大，請輸出除以 <code>1000000007</code> 的餘數。若 <code>S = T</code>，不走任何道路的路線算一條。</p><p>保證沒有有向環、沒有自環，也沒有重複的有向道路；站點編號不一定依行進方向遞增。</p>",
    '<p>第一行是 <code>N M S T</code>。接下來 <code>M</code> 行，每行 <code>u v</code> 表示道路由 u 通往 v。</p>',
    '<p>輸出一個整數。若無法抵達終點，輸出 <code>0</code>。</p>',
    ['1 ≤ N ≤ 20000','0 ≤ M ≤ 30000','1 ≤ S, T, u, v ≤ N','輸入保證為有向無環圖，且道路彼此不同'],
    '處理一個站點前，先確保所有通往它的站點都已處理完。')
SOLUTIONS[207]='''# 核心思路：Kahn 拓撲排序，將到達節點的路徑數沿每條邊傳遞。
# 時間 O(N+M)；空間 O(N+M)。
import sys
from collections import deque
MOD = 1000000007

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, m, source, target = data[:4]
    graph = [[] for _ in range(n + 1)]
    indegree = [0] * (n + 1)
    for i in range(4, len(data), 2):
        u, v = data[i:i + 2]
        graph[u].append(v)
        indegree[v] += 1
    queue = deque(i for i in range(1, n + 1) if indegree[i] == 0)
    ways = [0] * (n + 1)
    ways[source] = 1
    while queue:
        u = queue.popleft()
        for v in graph[u]:
            ways[v] = (ways[v] + ways[u]) % MOD
            indegree[v] -= 1
            if indegree[v] == 0:
                queue.append(v)
    print(ways[target])

if __name__ == '__main__':
    main()
'''
def build207():
    small=[(4,[(1,2),(1,3),(2,4),(3,4)],1,4),(3,[(1,2)],1,3),(1,[],1,1),
           (4,[(4,2),(4,3),(2,1),(3,1),(4,1)],4,1),(2,[],1,2),
           (3,[(1,2),(2,3)],2,2),(5,[(1,3),(2,3),(3,4),(4,5)],2,5),
           (4,[(1,2),(1,3),(2,3),(2,4),(3,4)],1,4),
           (3,[(2,1),(3,1)],1,3),(5,[(1,2),(3,4)],3,4),
           (5,[(1,2),(1,3),(1,4),(1,5)],1,5)]
    out=[case(dag_input(*x),dag_oracle(dag_input(*x))) for x in small]
    # Reverse-labelled chain plus skip-one edges: ways to the 10003rd chain node = F_10003.
    n=20000; edges=[(n-i,n-i-1) for i in range(n-1)]+[(n-i,n-i-2) for i in range(10001)]
    a,b=0,1
    for _ in range(10003): a,b=b,(a+b)%MOD
    out.append(case(dag_input(n,edges,n,1),a)); return out
BUILDERS[207]=build207; ORACLES[207]=dag_oracle
def random207(r):
    n=r.randint(1,9); order=list(range(1,n+1)); r.shuffle(order)
    edges=[(order[i],order[j]) for i in range(n) for j in range(i+1,n) if r.random()<.35]
    r.shuffle(edges); return dag_input(n,edges,r.randint(1,n),r.randint(1,n))
RANDOM[207]=random207


# 208: Floyd–Warshall oracle, independent of priority-queue Dijkstra.
def graph_input(n,edges,s=None,t=None):
    first=f'{n} {len(edges)}'+(f' {s} {t}' if s is not None else '')
    return rows(first,edges)
def shortest_oracle(inp):
    lines=inp.splitlines(); n,m,s,t=map(int,lines[0].split()); inf=10**30
    d=[[inf]*n for _ in range(n)]
    for i in range(n): d[i][i]=0
    for line in lines[1:]:
        a,b,w=map(int,line.split()); d[a-1][b-1]=d[b-1][a-1]=w
    for k in range(n):
        for i in range(n):
            for j in range(n): d[i][j]=min(d[i][j],d[i][k]+d[k][j])
    return d[s-1][t-1] if d[s-1][t-1]<inf else -1
specification(208,'快遞最短路程','Medium',True,['最短路徑','Dijkstra','優先佇列'],
    ['用優先佇列處理非負權重最短路徑','正確略過過期的距離紀錄'],
    ['圖的鄰接清單','heapq','貪心'],
    "<p class='problem-lead'>找出雙向道路網中，起點到終點的最短總路程。</p><p>有 <code>N</code> 個配送站與 <code>M</code> 條雙向道路，每條道路的路程為非負整數。從 <code>S</code> 出發前往 <code>T</code>，可以經過其他配送站，請求出最短總路程；無法抵達時輸出 <code>-1</code>。允許路程為 <code>0</code>；若 <code>S = T</code>，最短總路程為 <code>0</code>。</p><p>沒有自環，同一對站點至多一條道路；整個路網不保證連通。</p>",
    '<p>第一行是 <code>N M S T</code>。接下來 <code>M</code> 行，每行 <code>u v w</code> 表示 u、v 之間有路程 w 的雙向道路。</p>',
    '<p>輸出最短總路程；無法抵達則輸出 <code>-1</code>。</p>',
    ['1 ≤ N ≤ 20000','0 ≤ M ≤ 30000','1 ≤ S, T, u, v ≤ N，u ≠ v','0 ≤ w ≤ 10⁹','同一對站點至多一條道路'],
    '每次優先延伸目前已知總路程最短的站點。')
SOLUTIONS[208]='''# 核心思路：Dijkstra 搭配最小堆，距離不符目前最佳值的舊紀錄直接略過。
# 時間 O((N+M) log(N+1))；空間 O(N+M)。
import sys
import heapq

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, m, source, target = data[:4]
    graph = [[] for _ in range(n + 1)]
    for i in range(4, len(data), 3):
        u, v, w = data[i:i + 3]
        graph[u].append((v, w))
        graph[v].append((u, w))
    distance = [float('inf')] * (n + 1)
    distance[source] = 0
    queue = [(0, source)]
    while queue:
        cost, u = heapq.heappop(queue)
        if cost != distance[u]:
            continue
        if u == target:
            break
        for v, weight in graph[u]:
            candidate = cost + weight
            if candidate < distance[v]:
                distance[v] = candidate
                heapq.heappush(queue, (candidate, v))
    print(-1 if distance[target] == float('inf') else distance[target])

if __name__ == '__main__':
    main()
'''
def build208():
    small=[(4,[(1,2,9),(1,3,2),(3,2,1),(2,4,3),(3,4,10)],1,4),
           (3,[(1,2,7)],1,3),(1,[],1,1),(2,[(1,2,0)],1,2),
           (3,[(1,2,0),(2,3,0),(1,3,5)],1,3),(4,[(1,2,2),(2,4,2),(1,3,2),(3,4,2)],1,4),
           (3,[(1,2,10**9),(2,3,10**9)],1,3),(2,[],2,1),
           (3,[(1,2,4),(2,3,8)],3,1),(3,[(1,2,5),(2,3,6)],2,2),
           (5,[(1,2,1),(2,3,1),(4,5,0)],1,3)]
    out=[case(graph_input(*x),shortest_oracle(graph_input(*x))) for x in small]
    # All shortcuts cost more than traversing the corresponding chain segment.
    n=20000; edges=[(i,i+1,2) for i in range(1,n)]+[(i,i+2,5) for i in range(1,10001)]+[(1,n,10**9)]
    out.append(case(graph_input(n,edges,1,n),2*(n-1))); return out
BUILDERS[208]=build208; ORACLES[208]=shortest_oracle
def random208(r):
    n=r.randint(1,8); edges=[(i,j,r.randint(0,20)) for i in range(1,n+1) for j in range(i+1,n+1) if r.random()<.4]
    return graph_input(n,edges,r.randint(1,n),r.randint(1,n))
RANDOM[208]=random208


# 209: enumerate all candidate edge subsets and test connectivity by graph traversal.
def mst_oracle(inp):
    lines=inp.splitlines(); n,m=map(int,lines[0].split()); edges=[tuple(map(int,l.split())) for l in lines[1:]]
    best=None
    for chosen in combinations(edges,n-1):
        adj=[[] for _ in range(n+1)]
        for a,b,w in chosen: adj[a].append(b); adj[b].append(a)
        seen={1}; stack=[1]
        while stack:
            for v in adj[stack.pop()]:
                if v not in seen: seen.add(v); stack.append(v)
        if len(seen)==n:
            cost=sum(w for a,b,w in chosen)
            best=cost if best is None else min(best,cost)
    return -1 if best is None else best
specification(209,'校園光纖最低成本','Medium',True,['最小生成樹','Kruskal','並查集'],
    ['選擇能連通全部節點且總成本最低的邊','用並查集判斷新增邊是否形成環'],
    ['排序','無向圖','並查集'],
    "<p class='problem-lead'>從候選光纖中選出一些，讓所有建築連通且總成本最低。</p><p>校園有 <code>N</code> 棟建築與 <code>M</code> 條候選雙向光纖，每條有指定建置成本。選出的光纖必須讓任意兩棟建築可互相到達。請輸出最低總成本；如果無法連通全部建築，輸出 <code>-1</code>。只有一棟建築時，不需任何光纖，成本為 <code>0</code>。</p><p>成本可以為零。沒有自環，同一對建築至多一條候選光纖。只須輸出最低成本，不必輸出選了哪些光纖。</p>",
    '<p>第一行是 <code>N M</code>。接下來 <code>M</code> 行，每行 <code>u v w</code> 表示連接 u、v 的候選光纖成本為 w。</p>',
    '<p>輸出最低總成本；無法連通則輸出 <code>-1</code>。</p>',
    ['1 ≤ N ≤ 20000','0 ≤ M ≤ 30000','1 ≤ u, v ≤ N，u ≠ v','0 ≤ w ≤ 10⁹','同一對建築至多一條候選光纖'],
    '依成本由小到大考慮光纖，只有連接不同連通群的光纖才有必要選。')
SOLUTIONS[209]='''# 核心思路：Kruskal 按成本排序，以並查集選出不形成環的邊。
# 時間 O(M log(M+1) + N)；空間 O(N+M)。
import sys

def main():
    data = list(map(int, sys.stdin.read().split()))
    n, m = data[:2]
    edges = [(data[i + 2], data[i], data[i + 1]) for i in range(2, len(data), 3)]
    edges.sort()
    parent = list(range(n + 1))
    size = [1] * (n + 1)
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    total = used = 0
    for weight, u, v in edges:
        u, v = find(u), find(v)
        if u == v:
            continue
        if size[u] < size[v]:
            u, v = v, u
        parent[v] = u
        size[u] += size[v]
        total += weight
        used += 1
    print(total if used == n - 1 else -1)

if __name__ == '__main__':
    main()
'''
def build209():
    small=[(4,[(1,2,4),(1,3,1),(2,3,2),(2,4,3),(3,4,8)]),
           (3,[(1,2,5)]),(1,[]),(2,[(1,2,0)]),(3,[(1,2,7),(2,3,7),(1,3,7)]),
           (4,[(1,2,0),(2,3,0),(3,4,0),(1,4,5)]),
           (4,[(1,2,10**9),(2,3,10**9),(3,4,10**9)]),(2,[]),
           (4,[(1,2,1),(2,3,1),(1,3,1)]),(4,[(4,3,9),(3,2,4),(2,1,2)]),
           (5,[(1,2,1),(1,3,1),(1,4,1),(1,5,1),(2,3,9)])]
    out=[case(graph_input(*x),mst_oracle(graph_input(*x))) for x in small]
    # The N-1 cost-2 chain edges connect everything; every other edge costs more.
    n=20000; edges=[(i,i+1,2) for i in range(1,n)]+[(i,i+2,5) for i in range(1,10001)]+[(1,n,10**9)]
    out.append(case(graph_input(n,edges),2*(n-1))); return out
BUILDERS[209]=build209; ORACLES[209]=mst_oracle
def random209(r):
    n=r.randint(1,7); edges=[(i,j,r.randint(0,12)) for i in range(1,n+1) for j in range(i+1,n+1) if r.random()<.4]
    r.shuffle(edges); return graph_input(n,edges[:12])
RANDOM[209]=random209


# 210: enumerate subsets, sort by start time, and reject overlapping intervals.
def schedule_input(jobs): return rows(str(len(jobs)),jobs)
def schedule_oracle(inp):
    lines=inp.splitlines(); jobs=[tuple(map(int,l.split())) for l in lines[1:]]; best=0
    for mask in range(1 << len(jobs)):
        chosen=sorted(jobs[i] for i in range(len(jobs)) if mask >> i & 1)
        if all(chosen[i-1][1]<=chosen[i][0] for i in range(1,len(chosen))):
            best=max(best,sum(x[2] for x in chosen))
    return best
specification(210,'任務時段最大獎勵','Hard',True,['加權區間排程','動態規劃','二分搜尋'],
    ['建立依結束時間排序的最佳獎勵狀態','用二分搜尋找到可銜接的前一段狀態'],
    ['排序','動態規劃','二分搜尋'],
    "<p class='problem-lead'>選取互不重疊的任務，使總獎勵最大。</p><p>每個任務有開始時間 <code>s</code>、結束時間 <code>e</code> 與獎勵 <code>v</code>，執行期間為 <code>[s, e)</code>。同一時間最多執行一個任務；因此一個任務在時間 t 結束後，可以立即開始另一個在 t 開始的任務。任務不可中途放棄，可以一個都不選。</p><p>每行代表一個獨立任務，允許多個任務的時段或獎勵完全相同。只輸出最大總獎勵，不必輸出任務清單。</p>",
    '<p>第一行是任務數 <code>N</code>。接下來 <code>N</code> 行，每行是 <code>s e v</code>；輸入順序不保證依時間排列。</p>',
    '<p>輸出一個整數，代表最大總獎勵。</p>',
    ['1 ≤ N ≤ 20000','0 ≤ s &lt; e ≤ 10⁹','0 ≤ v ≤ 10⁹'],
    '依結束時間排序後，比較「跳過此任務」和「把它接到相容的最佳安排後方」。')
SOLUTIONS[210]='''# 核心思路：依結束時間排序，DP 比較不選與選取任務；bisect_right 找相容前綴。
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
'''
def build210():
    small=[[(0,3,5),(3,5,6),(0,5,10)],[(1,2,0)],[(0,10,8),(1,4,6),(4,8,6)],
           [(0,1,10**9)],[(0,10**9,1)],[(2,4,5),(2,4,5),(4,5,5)],
           [(5,6,2),(3,5,4),(0,3,8)],[(0,4,6),(0,2,3),(2,4,3)],
           [(0,10,50),(1,3,10),(4,6,10),(7,9,10)],[(1,2,0),(2,3,0)],
           [(0,2,5),(1,2,9),(2,3,4),(3,6,8),(1,6,20)]]
    out=[case(schedule_input(j),schedule_oracle(schedule_input(j))) for j in small]
    # All tasks meet only at endpoints, so every reward can be collected.
    jobs=[(i,i+1,10**9) for i in range(20000-1,-1,-1)]
    out.append(case(schedule_input(jobs),20000*10**9)); return out
BUILDERS[210]=build210; ORACLES[210]=schedule_oracle
def random210(r):
    jobs=[]
    for _ in range(r.randint(1,10)):
        s=r.randint(0,12); jobs.append((s,s+r.randint(1,6),r.randint(0,30)))
    return schedule_input(jobs)
RANDOM[210]=random210


# 211: pair enumeration for small tests; descending sequence has N(N-1)/2 pairs.
def inversion_input(a): return str(len(a))+'\n'+' '.join(map(str,a))
def inversion_oracle(inp):
    a=list(map(int,inp.split()))[1:]
    return sum(a[i]>a[j] for i in range(len(a)) for j in range(i+1,len(a)))
specification(211,'排隊逆序對','Hard',True,['合併排序','分治','逆序對'],
    ['在合併已排序區段時一次計入多個逆序對','處理相同值與大型整數答案'],
    ['遞迴','排序','分治'],
    "<p class='problem-lead'>計算隊伍中，前方數值嚴格大於後方數值的配對數。</p><p>隊伍有 <code>N</code> 個整數。若位置 <code>i &lt; j</code> 且 <code>aᵢ &gt; aⱼ</code>，位置對 <code>(i, j)</code> 就是一組逆序對。請計算全部逆序對的數量。數值相等不算逆序對；即使數值相同，只要位置不同仍是不同元素。</p>",
    '<p>第一行是 <code>N</code>。第二行是 <code>N</code> 個整數，依序代表隊伍數值。</p>',
    '<p>輸出逆序對總數。答案可能超過 32 位元有號整數範圍。</p>',
    ['1 ≤ N ≤ 70000','−10⁹ ≤ aᵢ ≤ 10⁹'],
    '合併兩段已排序資料時，右段一個元素可能同時小於左段尚未取出的所有元素。')
SOLUTIONS[211]='''# 核心思路：合併排序遇到右側較小值時，累加左側剩餘元素個數。
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
'''
def build211():
    small=[[3,1,2],[2,2,1],[0],[1,2,3,4],[4,3,2,1],[7,7,7,7],
           [-10**9,10**9,-10**9],[0,-1,0,-1],[5,-3,2,-8,1],
           [10**9,-10**9],[2,1,2,1,2,1]]
    out=[case(inversion_input(a),inversion_oracle(inversion_input(a))) for a in small]
    n=70000; out.append(case(inversion_input(list(range(n,0,-1))),n*(n-1)//2)); return out
BUILDERS[211]=build211; ORACLES[211]=inversion_oracle
RANDOM[211]=lambda r: inversion_input([r.randint(-10,10) for _ in range(r.randint(1,20))])


# 212: direct list updates and slice sums provide an O(NQ) small oracle.
def fenwick_input(a,ops): return rows(f'{len(a)} {len(ops)}',[a]+ops)
def fenwick_oracle(inp):
    lines=inp.splitlines(); a=list(map(int,lines[1].split())); out=[]
    for line in lines[2:]:
        kind,x,y=map(int,line.split())
        if kind==1: a[x-1]+=y
        else: out.append(str(sum(a[x-1:y])))
    return '\n'.join(out)
specification(212,'即時庫存區間總量','Hard',True,['Fenwick Tree','前綴和','動態查詢'],
    ['結合單點增量更新與區間總和查詢','以兩個動態前綴和求得閉區間總和'],
    ['前綴和','位元運算','資料結構'],
    "<p class='problem-lead'>處理庫存調整，並即時回答指定連續貨架的帳面總量。</p><p>有 <code>N</code> 個貨架，編號由 <code>1</code> 到 <code>N</code>。操作 <code>1 i d</code> 將第 i 個貨架的帳面數量<strong>增加 d</strong>，不是改設為 d；d 可以為負數。操作 <code>2 l r</code> 查詢目前第 l 至第 r 個貨架的帳面數量總和，包含兩端。</p><p>初始數量、調整後數量和總和都可以為負數，代表尚待補入的欠量。所有操作必須依輸入順序處理。</p>",
    '<p>第一行是 <code>N Q</code>。第二行是 <code>N</code> 個初始數量。接下來 <code>Q</code> 行，每行是操作 <code>1 i d</code> 或 <code>2 l r</code>。</p>',
    '<p>每個查詢各輸出一行，內容為當下閉區間 <code>[l, r]</code> 的總和。</p>',
    ['1 ≤ N, Q ≤ 50000','−10⁹ ≤ 初始數量, d ≤ 10⁹','1 ≤ i ≤ N；1 ≤ l ≤ r ≤ N','至少有一個查詢；調整後數量不受初始數量範圍限制'],
    '區間總和等於右端前綴和減去左端前一格的前綴和，但前綴和必須支援快速更新。')
SOLUTIONS[212]='''# 核心思路：Fenwick Tree 保存可更新前綴和，區間答案為 prefix(r)-prefix(l-1)。
# 時間 O((N+Q) log N)；空間 O(N+Q)，包含輸入與輸出緩衝。
import sys

def main():
    lines = sys.stdin.read().splitlines()
    n, q = map(int, lines[0].split())
    tree = [0] * (n + 1)
    def add(index, delta):
        while index <= n:
            tree[index] += delta
            index += index & -index
    def prefix(index):
        result = 0
        while index:
            result += tree[index]
            index -= index & -index
        return result
    for i, value in enumerate(map(int, lines[1].split()), 1):
        add(i, value)
    answer = []
    for line in lines[2:]:
        kind, x, y = map(int, line.split())
        if kind == 1:
            add(x, y)
        else:
            answer.append(str(prefix(y) - prefix(x - 1)))
    print('\\n'.join(answer))

if __name__ == '__main__':
    main()
'''
def build212():
    small=[([2,3,5],[(2,1,3),(1,2,-4),(2,2,3)]),([0],[(2,1,1)]),
           ([-3,4],[(1,1,2),(2,1,1),(2,1,2)]),([1],[(1,1,0),(2,1,1)]),
           ([5],[(1,1,-5),(2,1,1),(1,1,-1),(2,1,1)]),
           ([10**9,-10**9],[(2,1,2),(1,2,10**9),(2,2,2)]),
           ([0,0,0],[(1,3,7),(2,1,3),(2,3,3)]),([1,2,3,4],[(2,2,3),(1,2,10),(2,1,2)]),
           ([-2,-3,-4],[(2,1,3),(1,1,-10**9),(2,1,1)]),
           ([10**9]*4,[(2,1,4),(1,4,10**9),(2,1,4)]),
           ([3,1,4],[(1,2,2),(1,2,2),(2,2,2)])]
    out=[case(fenwick_input(a,op),fenwick_oracle(fenwick_input(a,op))) for a,op in small]
    # Each update adds 10^9; every following full-range query is the running total.
    ops=[op for i in range(1,25001) for op in ((1,i,10**9),(2,1,50000))]
    out.append(case(fenwick_input([0]*50000,ops),'\n'.join(str(i*10**9) for i in range(1,25001)))); return out
BUILDERS[212]=build212; ORACLES[212]=fenwick_oracle
def random212(r):
    n=r.randint(1,12); a=[r.randint(-20,20) for _ in range(n)]; ops=[]
    for _ in range(r.randint(1,25)):
        if r.random()<.5: ops.append((1,r.randint(1,n),r.randint(-20,20)))
        else:
            l=r.randint(1,n); ops.append((2,l,r.randint(l,n)))
    ops.append((2,1,n)); return fenwick_input(a,ops)
RANDOM[212]=random212


# 213: enumerate subsets and every possible coupon target, no knapsack DP.
def coupon_input(items,budget): return rows(f'{len(items)} {budget}',items)
def coupon_oracle(inp):
    lines=inp.splitlines(); n,b=map(int,lines[0].split()); items=[tuple(map(int,l.split())) for l in lines[1:]]; best=0
    for mask in range(1 << n):
        chosen=[items[i] for i in range(n) if mask >> i & 1]
        full=sum(p for p,v in chosen); value=sum(v for p,v in chosen)
        costs=[full]+[full-p+p//2 for p,v in chosen]
        if min(costs)<=b: best=max(best,value)
    return best
specification(213,'半價券採購計畫','Medium',True,['0/1背包','動態規劃','狀態設計'],
    ['以預算與優惠券使用狀態建立背包動態規劃','倒序更新避免重複選取同一件商品'],
    ['0/1 背包','動態規劃','整數除法'],
    "<p class='problem-lead'>在預算內選購商品，搭配一張半價券取得最大總效益。</p><p>有 <code>N</code> 件商品，每件最多購買一次，價格為 p、效益為 v。你有預算 <code>B</code> 以及一張可選擇使用的半價券。最多對一件<strong>已購買</strong>的商品用券，其實付價格變為 <code>⌊p / 2⌋</code>，也就是 p 除以 2 後無條件捨去小數；效益不變。</p><p>所有商品的實付價格總和不得超過 B。可以不用券，也可以一件都不買；即使兩件商品的價格與效益相同，仍各自最多購買一次。請輸出最大總效益。</p>",
    '<p>第一行是 <code>N B</code>。接下來 <code>N</code> 行，每行是某件商品的價格 <code>p</code> 與效益 <code>v</code>。</p>',
    '<p>輸出一個整數，代表在預算內可取得的最大總效益。</p>',
    ['1 ≤ N ≤ 100','0 ≤ B ≤ 5000','1 ≤ p ≤ 5000','0 ≤ v ≤ 10⁹'],
    '除了剩餘預算，還需要記錄優惠券是否已經使用。')
SOLUTIONS[213]='''# 核心思路：兩個背包狀態分別記錄未用券與已用券；預算倒序，先更新已用券狀態。
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
'''
def build213():
    small=[([(6,8),(5,9),(4,5)],8),([(1,7)],0),([(5,10),(8,20)],1),
           ([(1,9)],1),([(5,10)],2),([(1,5),(1,6),(1,7)],0),
           ([(2,0),(3,0)],5),([(5000,10**9)],2500),([(4,5),(4,5)],6),
           ([(3,100),(9,101)],6),([(2,3),(3,4),(4,5)],20)]
    out=[case(coupon_input(a,b),coupon_oracle(coupon_input(a,b))) for a,b in small]
    # 51 equal-price items cost 51*99-50=4999 with one coupon; 52 cost 5098.
    out.append(case(coupon_input([(99,10**9)]*100,5000),51*10**9)); return out
BUILDERS[213]=build213; ORACLES[213]=coupon_oracle
def random213(r):
    return coupon_input([(r.randint(1,15),r.randint(0,30)) for _ in range(r.randint(1,9))],r.randint(0,35))
RANDOM[213]=random213


def check_input(pid, inp):
    """Validate complete shape, operation validity, numeric bounds, and graph contracts."""
    lines=inp.splitlines(); z=list(map(int,inp.split()))
    if pid in (204,205):
        n,k=z[:2]; assert 1<=k<=n<=(30000 if pid==204 else 50000) and len(z)==n+2
        lo=1 if pid==204 else -10**9
        assert all(lo<=x<=10**9 for x in z[2:])
    elif pid==206:
        n,q=z[:2]; assert 1<=n<=30000 and 1<=q<=30000 and len(lines)==q+1
        query=False
        for line in lines[1:]:
            op,a,b=map(int,line.split()); assert op in (1,2) and 1<=a<=n and 1<=b<=n
            query |= op==2
        assert query
    elif pid in (207,208,209):
        head=list(map(int,lines[0].split())); n,m=head[:2]
        assert 1<=n<=20000 and 0<=m<=30000 and len(lines)==m+1
        if pid!=209: assert len(head)==4 and all(1<=v<=n for v in head[2:])
        else: assert len(head)==2
        seen=set(); adj=[[] for _ in range(n+1)]; indegree=[0]*(n+1)
        for line in lines[1:]:
            edge=list(map(int,line.split())); a,b=edge[:2]
            assert len(edge)==(2 if pid==207 else 3) and 1<=a<=n and 1<=b<=n and a!=b
            if pid!=207: assert 0<=edge[2]<=10**9
            key=(a,b) if pid==207 else tuple(sorted((a,b)))
            assert key not in seen; seen.add(key); adj[a].append(b); indegree[b]+=1
        if pid==207:
            queue=[i for i in range(1,n+1) if indegree[i]==0]; done=0
            while queue:
                u=queue.pop(); done+=1
                for v in adj[u]:
                    indegree[v]-=1
                    if indegree[v]==0: queue.append(v)
            assert done==n
    elif pid==210:
        n=z[0]; assert 1<=n<=20000 and len(lines)==n+1
        for line in lines[1:]:
            s,e,v=map(int,line.split()); assert 0<=s<e<=10**9 and 0<=v<=10**9
    elif pid==211:
        n=z[0]; assert 1<=n<=70000 and len(z)==n+1 and all(-10**9<=x<=10**9 for x in z[1:])
    elif pid==212:
        n,q=map(int,lines[0].split()); assert 1<=n<=50000 and 1<=q<=50000 and len(lines)==q+2
        a=list(map(int,lines[1].split())); assert len(a)==n and all(-10**9<=x<=10**9 for x in a)
        query=False
        for line in lines[2:]:
            op,x,y=map(int,line.split()); assert op in (1,2)
            if op==1: assert 1<=x<=n and -10**9<=y<=10**9
            else: assert 1<=x<=y<=n; query=True
        assert query
    elif pid==213:
        n,b=map(int,lines[0].split()); assert 1<=n<=100 and 0<=b<=5000 and len(lines)==n+1
        for line in lines[1:]:
            p,v=map(int,line.split()); assert 1<=p<=5000 and 0<=v<=10**9


def execute(path, inp):
    original=sys.stdin; output=io.StringIO()
    try:
        sys.stdin=io.StringIO(inp)
        with redirect_stdout(output): runpy.run_path(str(path),run_name='__main__')
    finally: sys.stdin=original
    return output.getvalue().rstrip()



def verify_mutants():
    """Confirm small fixtures reject one representative implementation bug per topic."""
    changes = {
        204: ('max(weights), sum(weights)', 'min(weights), sum(weights)'),
        205: ('candidates[0] <= i - k', 'candidates[0] < i - k'),
        206: ('a, b = find(a), find(b)', 'a, b = parent[a], parent[b]'),
        207: ('deque(i for i in range(1, n + 1) if indegree[i] == 0)', 'deque([source])'),
        208: ('if candidate < distance[v]:', "if distance[v] == float('inf'):"),
        209: ('if u == v:', 'if False:'),
        210: ('bisect_right', 'bisect_left'),
        211: ('left[i] <= right[j]', 'left[i] < right[j]'),
        212: ('prefix(y) - prefix(x - 1)', 'prefix(y) - prefix(x)'),
        213: ('range(budget, -1, -1)', 'range(budget + 1)'),
    }
    for pid, (old, new) in changes.items():
        source = (ROOT/'solutions'/f'{pid:03d}.py').read_text(encoding='utf-8')
        assert old in source, (pid, 'mutation point changed; update its targeted check')
        mutant = compile(source.replace(old, new), f'mutant-{pid}', 'exec')
        killed = False
        problem = json.loads((ROOT/'problems'/f'{pid:03d}.json').read_text(encoding='utf-8'))
        for tc in problem['testCases'][:11]:
            original = sys.stdin
            output = io.StringIO()
            try:
                sys.stdin = io.StringIO(tc['input'])
                with redirect_stdout(output):
                    exec(mutant, {'__name__': '__main__'})
            finally:
                sys.stdin = original
            if output.getvalue().rstrip() != tc['output'].rstrip():
                killed = True
                break
        assert killed, (pid, 'representative wrong solution unexpectedly passed')
    print('PASS: 10/10 representative incorrect solutions rejected by stored cases')


def write_all():
    for pid, spec in SPECS.items():
        tests=BUILDERS[pid]()
        problem=dict(spec, samples=tests[:3], sampleInput=tests[0]['input'],
                     sampleOutput=tests[0]['output'], testCases=tests)
        (ROOT/'problems'/f'{pid:03d}.json').write_text(json.dumps(problem,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        (ROOT/'solutions'/f'{pid:03d}.py').write_text(SOLUTIONS[pid],encoding='utf-8')


def verify_all(rounds):
    total=0
    for pid in sorted(SPECS):
        p=json.loads((ROOT/'problems'/f'{pid:03d}.json').read_text(encoding='utf-8'))
        solution=ROOT/'solutions'/f'{pid:03d}.py'
        generated={c['input']:c['output'] for c in BUILDERS[pid]()}
        samples={(s['input'],s['output']) for s in p['samples']}
        assert len(samples)==3
        assert (p['sampleInput'],p['sampleOutput']) in samples
        assert samples <= {(c['input'],c['output']) for c in p['testCases']}
        assert len(p['testCases'])-len(samples)>=8
        assert len({c['input'] for c in p['testCases']})==len(p['testCases'])
        for tc in p['testCases']:
            inp,expected=tc['input'],tc['output']; check_input(pid,inp)
            # Generator answers are independently derived; unknown review additions need a small oracle.
            oracle=generated[inp] if inp in generated else str(ORACLES[pid](inp))
            assert expected==oracle, (pid,'oracle mismatch',expected,oracle)
            actual=execute(solution,inp)
            assert actual==expected.rstrip(), (pid,'stored case',actual[:200],expected[:200])
        rng=random.Random(20260921+pid)
        for _ in range(rounds):
            inp=RANDOM[pid](rng); check_input(pid,inp)
            expected=str(ORACLES[pid](inp)); actual=execute(solution,inp)
            assert actual==expected.rstrip(), (pid,'random case',inp,actual,expected)
        total+=len(p['testCases'])+rounds
        print(f'PASS {pid}: {len(p["testCases"])} stored + {rounds} independent-oracle random cases')
    print(f'PASS: {total} checks across {len(SPECS)} original Challenge problems')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write',action='store_true',help='明確重建題目與解答；預設僅驗證')
    parser.add_argument('--rounds',type=int,default=80,help='每題固定種子隨機對拍數（預設 80）')
    args=parser.parse_args()
    if args.write: write_all()
    verify_all(args.rounds)
    verify_mutants()
