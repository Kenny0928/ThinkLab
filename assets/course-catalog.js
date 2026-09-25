/* SkillLab intermediate and advanced course content. Kept separate from the UI engine. */
(() => {
  'use strict';

  const intermediate = [
    {
      id:'M01',displayNumber:'M01',title:'字串長度與索引',badge:'len() · text[i]',kicker:'STRING POSITION',
      goal: '把字串看成有編號的字元序列，使用索引與切片取出需要的部分。',
      concept: 'Python 索引從 0 開始，-1 代表最後一個字元。切片 text[start:end] 包含 start，但不包含 end；text[::-1] 可反轉字串。',
      mission: '輸入一個不含空白、長度至少 2 的通行證，輸出第一個與最後一個字元，中間不加空格。', sampleInput: 'A73K', sampleOutput: 'AK',
      predict: 'word = "PYTHON" 時，word[0]、word[2]、word[-1] 分別是什麼？', predictAnswer: '分別是 P、T、N。最後一格也可以用 len(word) - 1 取得。',
      steps: ['讀入通行證字串。', '用索引 0 取出首字元，用 -1 取出尾字元。', '將兩個字元串接後輸出。'],
      starter: 'code = input()\nprint(code[____] + code[____])', solution: 'code = input()\nprint(code[0] + code[-1])', hint: '第一格編號是 0，最後一格可用 -1。', checkpoint: '為什麼 len(text) 不能直接當最後一格的索引？',
      commonMistakes: ['把第一格寫成 1。', '把 len(text) 當最後索引，導致 IndexError。'], tests: [{input:'A73K',output:'AK'},{input:'python',output:'pn'},{input:'7X93',output:'73'}],
      variants: [
        {title:'第二個字元',mission:'輸入長度至少 2 的字串，輸出第二個字元。',sampleInput:'ABCDE',sampleOutput:'B',starter:'text = input()\nprint(text[____])',solution:'text = input()\nprint(text[1])',hint:'索引從 0 開始，所以第二個字元的索引是 1。',tests:[{input:'hi',output:'i'},{input:'ABCDE',output:'B'},{input:'9Z',output:'Z'}]},
        {title:'正中央字元',mission:'輸入長度為奇數的字串，輸出正中央字元。',sampleInput:'LEVEL',sampleOutput:'V',starter:'text = input()\nmid = len(text) ____ 2\nprint(text[mid])',solution:'text = input()\nmid = len(text) // 2\nprint(text[mid])',hint:'奇數長度的中央索引是 len(text) // 2。',tests:[{input:'A',output:'A'},{input:'cat',output:'a'},{input:'1234567',output:'4'}]}
      ]
    },
    {
      id:'M02',displayNumber:'M02',title:'字串逐字走訪',badge:'for ch in text',kicker:'VISIT EVERY CHARACTER',
      goal:'依序處理每個字元，根據條件統計或更新狀態。',concept:'for ch in text 會讓 ch 依序取得每個字元。isdigit()、lower()、strip()、find()、count() 等方法可以幫助分類或處理字串。',
      mission:'輸入一行只含英文字母與數字的字串，輸出其中數字字元數量。',sampleInput:'Room204',sampleOutput:'3',predict:'逐字讀取 A1B22，遇到數字就加 1，最後計數器是多少？',predictAnswer:'3，因為 1、2、2 三個字元的 isdigit() 為 True。',
      steps:['把 count 設為 0。','用 for 逐字取得 ch。','ch.isdigit() 成立時將 count 加 1，最後輸出。'],starter:'text = input()\ncount = 0\nfor ch in text:\n    if ch.____():\n        count += 1\nprint(count)',solution:'text = input()\ncount = 0\nfor ch in text:\n    if ch.isdigit():\n        count += 1\nprint(count)',hint:'isdigit() 會回傳這個字元是否為數字。',checkpoint:'如何用追蹤表記錄目前字元、條件結果與 count？',commonMistakes:['只檢查第一個字元。','在每一輪把 count 重設為 0。'],tests:[{input:'Room204',output:'3'},{input:'abc',output:'0'},{input:'12345',output:'5'}],
      variants:[
        {title:'母音觀察',mission:'輸入一個小寫英文字串，輸出 a/e/i/o/u 的出現總數。',sampleInput:'education',sampleOutput:'5',starter:'text = input()\ncount = 0\nfor ch in text:\n    if ch in "____":\n        count += 1\nprint(count)',solution:'text = input()\ncount = 0\nfor ch in text:\n    if ch in "aeiou":\n        count += 1\nprint(count)',hint:'可用 ch in "aeiou" 一次檢查五個母音。',tests:[{input:'sky',output:'0'},{input:'apple',output:'2'},{input:'aeiou',output:'5'}]},
        {title:'最長連續驚嘆號',mission:'輸入只含英文字母與 ! 的字串，輸出最長連續 ! 的長度。',sampleInput:'Go!!!Now!!',sampleOutput:'3',starter:'text = input()\nrun = 0\nbest = 0\nfor ch in text:\n    if ch == "!":\n        run += 1\n        best = max(best, run)\n    else:\n        run = ____\nprint(best)',solution:'text = input()\nrun = 0\nbest = 0\nfor ch in text:\n    if ch == "!":\n        run += 1\n        best = max(best, run)\n    else:\n        run = 0\nprint(best)',hint:'遇到其他字元時，目前連續長度要歸零。',tests:[{input:'Hello',output:'0'},{input:'!!A!!!!',output:'4'},{input:'!A!',output:'1'}]}
      ]
    },
    {
      id:'M03',displayNumber:'M03',title:'字串組裝與輸出格式',badge:'join() · f-string',kicker:'BUILD THE OUTPUT',
      goal:'把算好的片段組裝成題目要求的格式，再一次輸出。',concept:'輸出不一定要邊算邊印。可以先用一個字串變數把片段接起來，最後再輸出。用分隔符接每一段時，結尾一定會多出一個分隔符，可用切片 line[:-1] 去掉。"-".join(text) 會直接在每兩個字元之間插入分隔符，效果相同。"=" * n 會把符號重複 n 次。要把變數嵌進文字裡，可用 f-string，例如 f"{name} 得到 {score} 分"。',
      mission:'輸入一個不含空白的字串，在每兩個字元之間插入一個 - 之後輸出。',sampleInput:'PYTHON',sampleOutput:'P-Y-T-H-O-N',
      predict:'text 是 "ABC" 時，先讓每個字元後面都接上一個 -，得到的字串是什麼？要輸出 A-B-C 還缺一步什麼？',predictAnswer:'會得到 "A-B-C-"，結尾多了一個 -。用切片去掉最後一個字元就好，也就是 line[:-1]。',
      steps:['準備一個空字串 line。','逐字走訪，把「這個字元」加上一個 - 接到 line 後面。','輸出時用切片去掉結尾多出來的分隔符。'],
      starter:'text = input()\nline = ""\nfor ch in text:\n    line += ch + "-"\nprint(line[:____])',
      solution:'text = input()\nline = ""\nfor ch in text:\n    line += ch + "-"\nprint(line[:-1])',
      hint:'每一輪都會多接一個 -，所以輸出時要少取一個字元；line[:-1] 表示取到倒數第二個為止。',
      checkpoint:'用「邊接邊加分隔符」組裝輸出時，為什麼結尾一定要另外處理？',
      commonMistakes:['忘了去掉結尾多出來的分隔符。','把 line = "" 寫在迴圈裡面，每一輪都被清空。'],
      tests:[{input:'PYTHON',output:'P-Y-T-H-O-N'},{input:'A',output:'A'},{input:'2026',output:'2-0-2-6'}],
      variants:[
        {title:'標題橫幅',mission:'輸入一行標題文字，輸出三行：與標題等長的一排 =、標題本身，再一排 =。',sampleInput:'HELLO',sampleOutput:'=====\nHELLO\n=====',starter:'title = input()\nbar = "=" * ____\nprint(bar)\nprint(title)\nprint(bar)',solution:'title = input()\nbar = "=" * len(title)\nprint(bar)\nprint(title)\nprint(bar)',hint:'符號要重複「標題有幾個字元」次，也就是 len(title) 次。',tests:[{input:'HELLO',output:'=====\nHELLO\n====='},{input:'A',output:'=\nA\n='},{input:'ThinkLab',output:'========\nThinkLab\n========'}]},
        {title:'連續字元壓縮',mission:'輸入一行只含小寫英文字母的字串，把每一段連續相同的字元寫成「字母次數」，段與段之間以一個空格分隔後輸出。',sampleInput:'aaabb',sampleOutput:'a3 b2',starter:'text = input()\nparts = ""\nrun = 1\nfor i in range(1, len(text)):\n    if text[i] == text[i - 1]:\n        run += 1\n    else:\n        parts += text[i - 1] + str(run) + " "\n        run = ____\nparts += text[-1] + str(run)\nprint(parts)',solution:'text = input()\nparts = ""\nrun = 1\nfor i in range(1, len(text)):\n    if text[i] == text[i - 1]:\n        run += 1\n    else:\n        parts += text[i - 1] + str(run) + " "\n        run = 1\nparts += text[-1] + str(run)\nprint(parts)',hint:'字元換掉時才把上一段寫進 parts，並把 run 重設為 1；最後一段要在迴圈結束後補上。',tests:[{input:'aaabb',output:'a3 b2'},{input:'abc',output:'a1 b1 c1'},{input:'aabbaa',output:'a2 b2 a2'},{input:'z',output:'z1'}]}
      ]
    },
    {
      id:'M04',displayNumber:'M04',title:'建立與讀取清單',badge:'split() · list',kicker:'A LINE OF DATA',
      goal:'把同一行多個整數轉成可用索引取值的清單。',concept:'input() 回傳字串；split() 先切成多段字串，map(int, ...) 再逐項轉成整數，list(...) 將結果收集起來。',
      mission:'第一行輸入 N K，第二行輸入 N 個整數。輸出人類習慣 1 起算的第 K 個數。',sampleInput:'5 3\n8 4 9 2 7',sampleOutput:'9',predict:'"3 8 6".split() 的結果是什麼？每一項是什麼型別？',predictAnswer:'["3", "8", "6"]，三項都還是字串。',
      steps:['以 map(int, input().split()) 讀取 N 與 K。','將第二行轉成整數清單。','把 1 起算的 K 減 1，再當成索引。'],starter:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\nprint(nums[____])',solution:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\nprint(nums[k - 1])',hint:'第 K 個對應的 Python 索引是 K - 1。',checkpoint:'為什麼要先 split()，再用 int() 轉換？',commonMistakes:['忘了轉成 int。','K 沒有減 1，導致錯一格或 IndexError。'],tests:[{input:'5 3\n8 4 9 2 7',output:'9'},{input:'1 1\n-5',output:'-5'},{input:'4 4\n10 20 30 40',output:'40'}],
      variants:[
        {title:'兩端相加',mission:'輸入 N 與 N 個整數，輸出第一個與最後一個數的和。',sampleInput:'4\n10 20 30 7',sampleOutput:'17',starter:'n = int(input())\nnums = list(map(int, input().split()))\nprint(nums[____] + nums[____])',solution:'n = int(input())\nnums = list(map(int, input().split()))\nprint(nums[0] + nums[-1])',hint:'清單首尾可用索引 0 與 -1。',tests:[{input:'1\n8',output:'16'},{input:'3\n-2 5 9',output:'7'},{input:'5\n0 1 2 3 0',output:'0'}]},
        {title:'相鄰差值',mission:'輸入 N 與 N 個整數，逐行輸出後一項減前一項的差。',sampleInput:'4\n3 8 6 10',sampleOutput:'5\n-2\n4',starter:'n = int(input())\nnums = list(map(int, input().split()))\nfor i in range(1, n):\n    print(nums[i] - nums[____])',solution:'n = int(input())\nnums = list(map(int, input().split()))\nfor i in range(1, n):\n    print(nums[i] - nums[i - 1])',hint:'目前位置是 i，前一個位置就是 i - 1。',tests:[{input:'2\n5 5',output:'0'},{input:'4\n3 8 6 10',output:'5\n-2\n4'},{input:'3\n0 -2 -7',output:'-2\n-5'}]}
      ]
    },
    {
      id:'M05',displayNumber:'M05',title:'清單的增刪與切片',badge:'append · pop · [a:b]',kicker:'GROW AND SHRINK',
      goal:'改變清單的長度，並取出其中一段。',concept:'清單的長度不是固定的。nums.append(x) 在最後面加一項；nums.pop() 取出並移除最後一項，nums.pop(i) 移除索引 i 那一項；nums.insert(i, x) 插在索引 i 之前；nums.remove(x) 移除第一個等於 x 的項目。切片 nums[a:b] 和字串一樣包含 a、不包含 b，取出來的是一份新的清單。要小心 b = a 只是替同一份清單多取一個名字，改其中一個另一個也會跟著變；真正的複製要寫 b = a[:] 或 b = list(a)。整份清單可用 print(*nums) 以空格輸出，要自訂分隔符則用 ",".join(map(str, nums))。',
      mission:'第一行輸入 N，第二行輸入 N 個整數代表排隊中的號碼，第三行輸入一個整數 x。第一行輸出把 x 排到隊伍最後之後的隊伍，第二行輸出最前面的人離開之後的隊伍，號碼之間以一個空格分隔。',sampleInput:'3\n5 8 2\n9',sampleOutput:'5 8 2 9\n8 2 9',
      predict:'nums 是 [1, 2, 3]，先執行 nums.append(4)，再執行 nums.pop(0)。兩次之後 nums 是什麼？',predictAnswer:'append(4) 之後是 [1, 2, 3, 4]；pop(0) 移除索引 0 那一項，之後是 [2, 3, 4]。',
      steps:['讀入 N、整數清單，以及要加入的號碼 x。','用 append() 把 x 接到清單最後，輸出目前隊伍。','用 pop(0) 移除最前面那一項，再輸出一次。'],
      starter:'n = int(input())\nqueue = list(map(int, input().split()))\nx = int(input())\nqueue.____(x)\nprint(*queue)\nqueue.____(0)\nprint(*queue)',
      solution:'n = int(input())\nqueue = list(map(int, input().split()))\nx = int(input())\nqueue.append(x)\nprint(*queue)\nqueue.pop(0)\nprint(*queue)',
      hint:'append() 一定加在最後面；pop(0) 才是移除最前面那一項，pop() 不帶參數移除的是最後一項。',
      checkpoint:'append()、pop()、insert()、remove() 各自改變清單的哪個位置？',
      commonMistakes:['用 pop() 卻沒有指定索引，結果移除到最後一項。','以為 b = a 就是複製，改了 b 才發現 a 也跟著變。'],
      tests:[{input:'3\n5 8 2\n9',output:'5 8 2 9\n8 2 9'},{input:'1\n7\n4',output:'7 4\n4'},{input:'4\n1 2 3 4\n0',output:'1 2 3 4 0\n2 3 4 0'}],
      variants:[
        {title:'切片後用逗號組合',mission:'第一行輸入 N，第二行輸入 N 個整數，第三行輸入兩個整數 a b（0 ≤ a ≤ b ≤ N）。輸出索引 a（含）到 b（不含）之間的項目，項目之間以一個逗號分隔、不加空格；範圍內沒有項目時輸出空白行。',sampleInput:'5\n1 2 3 4 5\n1 4',sampleOutput:'2,3,4',starter:'n = int(input())\nnums = list(map(int, input().split()))\na, b = map(int, input().split())\npart = nums[____:____]\nprint(",".join(map(str, part)))',solution:'n = int(input())\nnums = list(map(int, input().split()))\na, b = map(int, input().split())\npart = nums[a:b]\nprint(",".join(map(str, part)))',hint:'切片 nums[a:b] 包含 a 不包含 b；join() 只能接字串，所以要先用 map(str, ...) 轉換。',tests:[{input:'5\n1 2 3 4 5\n1 4',output:'2,3,4'},{input:'5\n1 2 3 4 5\n0 5',output:'1,2,3,4,5'},{input:'3\n7 8 9\n2 2',output:''}]},
        {title:'複製一份不互相影響',mission:'第一行輸入 N，第二行輸入 N 個整數清單 a，第三行輸入一個整數 v。先做出 a 的獨立複製 b，再把 a 的第一項改成 v。第一行輸出 a，第二行輸出 b，數字之間以一個空格分隔。',sampleInput:'3\n1 2 3\n9',sampleOutput:'9 2 3\n1 2 3',starter:'n = int(input())\na = list(map(int, input().split()))\nv = int(input())\nb = a____\na[0] = v\nprint(*a)\nprint(*b)',solution:'n = int(input())\na = list(map(int, input().split()))\nv = int(input())\nb = a[:]\na[0] = v\nprint(*a)\nprint(*b)',hint:'b = a 只是同一份清單的另一個名字；b = a[:] 會切出一份新的清單。',tests:[{input:'3\n1 2 3\n9',output:'9 2 3\n1 2 3'},{input:'1\n5\n5',output:'5\n5'},{input:'4\n10 20 30 40\n0',output:'0 20 30 40\n10 20 30 40'}]}
      ]
    },
    {
      id:'M06',displayNumber:'M06',title:'清單統計',badge:'sum · average',kicker:'SUMMARIZE A LIST',
      goal:'用計數器與累加器從一批資料產生總和、平均與條件統計。',concept:'計數器回答「有幾筆」，累加器回答「合計多少」。整數平均可先求總和，再使用 // 除以筆數。',
      mission:'輸入 N 與 N 天閱讀分鐘數。第一行輸出總分鐘，第二行輸出整數平均。',sampleInput:'5\n20 30 15 25 10',sampleOutput:'100\n20',predict:'3、4、5、6、9 的總和是 27；27 / 5 與 27 // 5 分別是什麼？',predictAnswer:'5.4 與 5。本關規定使用整數除法。',
      steps:['讀入 N 與整數清單。','以 sum() 或累加迴圈求總和。','以 total // n 求整數平均，分兩行輸出。'],starter:'n = int(input())\nminutes = list(map(int, input().split()))\ntotal = ____\naverage = ____\nprint(total)\nprint(average)',solution:'n = int(input())\nminutes = list(map(int, input().split()))\ntotal = sum(minutes)\naverage = total // n\nprint(total)\nprint(average)',hint:'總和是 sum(minutes)；整數平均是 total // n。',checkpoint:'什麼時候要用計數器，什麼時候要用累加器？',commonMistakes:['平均的分母用錯。','題目要求整數平均卻輸出浮點數。'],tests:[{input:'5\n20 30 15 25 10',output:'100\n20'},{input:'3\n1 2 2',output:'5\n1'},{input:'1\n0',output:'0\n0'}],
      variants:[
        {title:'只加正數',mission:'輸入 N 與 N 個整數，只將大於 0 的數加起來。',sampleInput:'5\n3 -2 0 7 -1',sampleOutput:'10',starter:'n = int(input())\nnums = list(map(int, input().split()))\ntotal = 0\nfor x in nums:\n    if x ____ 0:\n        total += x\nprint(total)',solution:'n = int(input())\nnums = list(map(int, input().split()))\ntotal = 0\nfor x in nums:\n    if x > 0:\n        total += x\nprint(total)',hint:'條件是嚴格大於 0，0 加不加不影響結果。',tests:[{input:'5\n3 -2 0 7 -1',output:'10'},{input:'3\n-1 -2 -3',output:'0'},{input:'4\n1 2 3 4',output:'10'}]},
        {title:'高於平均有幾筆',mission:'輸入 N 與 N 個非負整數，輸出嚴格大於整數平均的資料筆數。',sampleInput:'5\n1 2 3 4 5',sampleOutput:'2',starter:'n = int(input())\nnums = list(map(int, input().split()))\naverage = sum(nums) // n\ncount = 0\nfor x in nums:\n    if x ____ average:\n        count += 1\nprint(count)',solution:'n = int(input())\nnums = list(map(int, input().split()))\naverage = sum(nums) // n\ncount = 0\nfor x in nums:\n    if x > average:\n        count += 1\nprint(count)',hint:'要先算完整平均，再第二次走訪比較。',tests:[{input:'5\n1 2 3 4 5',output:'2'},{input:'4\n7 7 7 7',output:'0'},{input:'3\n0 1 2',output:'1'}]}
      ]
    },
    {
      id:'M07',displayNumber:'M07',title:'數字拆解與進位轉換',badge:'% 10 · // 10',kicker:'TAKE A NUMBER APART',
      goal:'用餘數取出一個數的每一位，並把同一招換底做進位轉換。',concept:'n % 10 會取出最右邊那一位，n // 10 會把最右邊那一位去掉。把這兩件事放進 while 迴圈重複做，直到 n 變成 0，就走過了每一位數字。N 本身是 0 時迴圈一次都不會跑，要單獨處理。換成別的進位制是同一招：把 10 換成 2，每次的餘數就是一個二進位位元，而且是由低位往高位取得，所以新的位元要接在前面。同樣用 %，還可以判斷因數：N % i 等於 0 就代表 i 是 N 的因數；質數就是大於 1 且除了 1 與自己以外沒有其他因數的數（延伸練習見 Judge 004、048、148、171）。',
      mission:'輸入一個非負整數 N，由個位開始，逐行輸出它的每一位數字。',sampleInput:'507',sampleOutput:'7\n0\n5',
      predict:'n 是 507 時，n % 10 與 n // 10 分別是多少？重複做這兩件事直到 n 變成 0，總共會做幾輪？',predictAnswer:'7 與 50。507 → 50 → 5 → 0 共 3 輪，正好等於 507 的位數。',
      steps:['讀入 N。','先處理 N 是 0 的情況，直接輸出 0。','用 while 迴圈輸出 n % 10，再把 n 換成 n // 10，直到 n 變成 0。'],
      starter:'n = int(input())\nif n == 0:\n    print(0)\nwhile n > 0:\n    print(n ____ 10)\n    n = n ____ 10',
      solution:'n = int(input())\nif n == 0:\n    print(0)\nwhile n > 0:\n    print(n % 10)\n    n = n // 10',
      hint:'取出最右邊那一位用 %，把最右邊那一位去掉用 //。',
      checkpoint:'為什麼 N 是 0 時要單獨處理？',
      commonMistakes:['忘了更新 n，造成無窮迴圈。','把 % 與 // 的用途對調。','沒有處理 N 是 0 的情況，結果什麼都沒輸出。'],
      tests:[{input:'507',output:'7\n0\n5'},{input:'0',output:'0'},{input:'9',output:'9'},{input:'1000',output:'0\n0\n0\n1'}],
      variants:[
        {title:'數字反轉',mission:'輸入一個非負整數 N，輸出把它的數字由後往前重新排列後的結果；開頭的 0 會自然消失。',sampleInput:'507',sampleOutput:'705',starter:'n = int(input())\nrev = 0\nwhile n > 0:\n    rev = rev * 10 + n ____ 10\n    n = n ____ 10\nprint(rev)',solution:'n = int(input())\nrev = 0\nwhile n > 0:\n    rev = rev * 10 + n % 10\n    n = n // 10\nprint(rev)',hint:'每一輪先把目前答案乘以 10 空出個位，再把剛取出的那一位加進去。',tests:[{input:'507',output:'705'},{input:'0',output:'0'},{input:'1200',output:'21'},{input:'9',output:'9'}]},
        {title:'十進位轉二進位',mission:'輸入一個非負整數 N，輸出它的二進位表示法；N 是 0 時輸出 0，其餘情況開頭不能有 0。',sampleInput:'13',sampleOutput:'1101',starter:'n = int(input())\nif n == 0:\n    print(0)\nelse:\n    bits = ""\n    while n > 0:\n        bits = str(n % 2) ____ bits\n        n = n ____ 2\n    print(bits)',solution:'n = int(input())\nif n == 0:\n    print(0)\nelse:\n    bits = ""\n    while n > 0:\n        bits = str(n % 2) + bits\n        n = n // 2\n    print(bits)',hint:'餘數是由低位往高位取得的，所以新的位元要接在前面，寫成 str(n % 2) + bits。',tests:[{input:'13',output:'1101'},{input:'0',output:'0'},{input:'1',output:'1'},{input:'8',output:'1000'}]}
      ]
    },
    {
      id:'M08',displayNumber:'M08',title:'最大值、最小值與位置',badge:'best value',kicker:'KEEP THE BEST',
      goal:'同步維護目前最佳值與它的位置，處理第一次／最後一次的並列規則。',concept:'最佳值應由第一筆資料初始化，不能一律設為 0。要保留第一次位置就只在嚴格更好時更新。',
      mission:'輸入 N 與 N 個整數分數。第一行輸出最高分，第二行輸出它第一次出現的 1 起算位置。',sampleInput:'6\n70 95 80 95 60 90',sampleOutput:'95\n2',predict:'資料是 [-5, -2, -8]。如果 best 初始為 0，會發生什麼事？',predictAnswer:'best 會錯誤保留 0，但 0 根本不在資料中。',
      steps:['用第一筆分數初始 best，位置初始為 0。','從索引 1 開始，只在找到更大分數時同步更新值與位置。','輸出位置時加 1。'],starter:'n = int(input())\nscores = list(map(int, input().split()))\nbest = scores[0]\nbest_pos = 0\nfor i in range(1, n):\n    if scores[i] ____ best:\n        best = scores[i]\n        best_pos = i\nprint(best)\nprint(best_pos + 1)',solution:'n = int(input())\nscores = list(map(int, input().split()))\nbest = scores[0]\nbest_pos = 0\nfor i in range(1, n):\n    if scores[i] > best:\n        best = scores[i]\n        best_pos = i\nprint(best)\nprint(best_pos + 1)',hint:'保留第一次位置，所以只在 scores[i] > best 時更新。',checkpoint:'題目改成「最後一次最高分」時，比較運算子要如何改？',commonMistakes:['best 用 0 初始。','忘記將 0 起算索引轉為 1 起算位置。'],tests:[{input:'6\n70 95 80 95 60 90',output:'95\n2'},{input:'3\n-5 -2 -8',output:'-2\n2'},{input:'1\n7',output:'7\n1'}],
      variants:[
        {title:'最後一次最低溫',mission:'輸入 N 與 N 個整數，輸出最低值與它最後一次出現的 1 起算位置，同一行以空格分隔。',sampleInput:'5\n8 3 5 3 7',sampleOutput:'3 4',starter:'n = int(input())\nnums = list(map(int, input().split()))\nbest = nums[0]\npos = 0\nfor i in range(1, n):\n    if nums[i] ____ best:\n        best = nums[i]\n        pos = i\nprint(best, pos + 1)',solution:'n = int(input())\nnums = list(map(int, input().split()))\nbest = nums[0]\npos = 0\nfor i in range(1, n):\n    if nums[i] <= best:\n        best = nums[i]\n        pos = i\nprint(best, pos + 1)',hint:'要保留最後一次最小值，遇到相等時也要更新，因此用 <=。',tests:[{input:'5\n8 3 5 3 7',output:'3 4'},{input:'3\n-1 -1 -1',output:'-1 3'},{input:'1\n4',output:'4 1'}]},
        {title:'資料範圍',mission:'輸入 N 與 N 個整數，輸出最大值減最小值。',sampleInput:'5\n3 9 -2 7 4',sampleOutput:'11',starter:'n = int(input())\nnums = list(map(int, input().split()))\nsmall = nums[0]\nlarge = nums[0]\nfor x in nums[1:]:\n    small = min(small, x)\n    large = max(large, x)\nprint(____)',solution:'n = int(input())\nnums = list(map(int, input().split()))\nsmall = nums[0]\nlarge = nums[0]\nfor x in nums[1:]:\n    small = min(small, x)\n    large = max(large, x)\nprint(large - small)',hint:'資料範圍是最大值減最小值。',tests:[{input:'5\n3 9 -2 7 4',output:'11'},{input:'1\n8',output:'0'},{input:'3\n-10 -2 -8',output:'8'}]}
      ]
    },
    {
      id:'M09',displayNumber:'M09',title:'線性搜尋',badge:'found · count · position',kicker:'SEARCH ONE BY ONE',
      goal:'依序檢查資料，分辨「是否存在」、「出現次數」與「第一次位置」。',concept:'布林值 True 與 False 在LV.1已經學過，這一關把它用在搜尋上。搜尋前先決定要哪一種答案：「是否存在」用一個布林變數，「出現幾次」用計數器，「第一次在哪裡」要保留索引並提早結束迴圈。',
      mission:'第一行輸入 N K，第二行輸入 N 個書籍編號。找到 K 輸出 YES，否則輸出 NO。',sampleInput:'5 8\n3 8 2 9 1',sampleOutput:'YES',predict:'在 [4, 7, 2, 7] 搜尋 7，存在、次數、第一次 1 起算位置分別是什麼？',predictAnswer:'True、2、2。三種問法需要不同的狀態。',
      steps:['建立 found = False。','逐項比較是否等於 K，找到就改為 True。','走訪完後根據 found 輸出 YES 或 NO。'],starter:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\nfound = False\nfor x in nums:\n    if x == k:\n        found = ____\n        break\nprint("YES" if found else "NO")',solution:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\nfound = False\nfor x in nums:\n    if x == k:\n        found = True\n        break\nprint("YES" if found else "NO")',hint:'找到目標時將 found 設為 True。',checkpoint:'什麼情況適合提早 break？計算出現次數時可以 break 嗎？',commonMistakes:['搜尋值與索引混淆。','計算出現次數時太早 break。'],tests:[{input:'5 8\n3 8 2 9 1',output:'YES'},{input:'4 7\n4 2 1 9',output:'NO'},{input:'1 -3\n-3',output:'YES'}],
      variants:[
        {title:'目標出現次數',mission:'輸入 N K 與 N 個整數，輸出 K 的出現次數。',sampleInput:'6 5\n5 2 5 3 5 1',sampleOutput:'3',starter:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\ncount = 0\nfor x in nums:\n    if x == k:\n        count += ____\nprint(count)',solution:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\ncount = 0\nfor x in nums:\n    if x == k:\n        count += 1\nprint(count)',hint:'這題必須走完全部資料，不能第一次找到就停。',tests:[{input:'6 5\n5 2 5 3 5 1',output:'3'},{input:'3 8\n1 2 3',output:'0'},{input:'4 0\n0 0 0 0',output:'4'}]},
        {title:'第一次出現位置',mission:'輸入 N K 與 N 個整數，輸出 K 第一次出現的 1 起算位置；找不到輸出 -1。',sampleInput:'4 7\n4 7 2 7',sampleOutput:'2',starter:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\nposition = -1\nfor i in range(n):\n    if nums[i] == k:\n        position = ____\n        break\nprint(position)',solution:'n, k = map(int, input().split())\nnums = list(map(int, input().split()))\nposition = -1\nfor i in range(n):\n    if nums[i] == k:\n        position = i + 1\n        break\nprint(position)',hint:'第一次找到就記錄 i + 1 並 break。',tests:[{input:'4 7\n4 7 2 7',output:'2'},{input:'3 9\n9 1 9',output:'1'},{input:'2 5\n1 2',output:'-1'}]}
      ]
    },
    {
      id:'M10',displayNumber:'M10',title:'清單更新與狀態模擬',badge:'state update',kicker:'CHANGE THE STATE',
      goal:'依序執行多筆指令，正確更新同一份清單狀態。',concept:'模擬題要先定義「目前狀態」。每讀一筆指令只執行指定更新，通常等全部指令完成後再輸出。',
      mission:'第一行輸入 N，第二行是 N 個初始存量，接著輸入 Q 與 Q 行 K D。每筆使第 K 格增加 D，最後輸出全部存量。',sampleInput:'4\n5 2 0 7\n3\n2 3\n4 -2\n1 1',sampleOutput:'6 5 0 5',predict:'第 2 格初始為 0，依序執行 (2,+3)、(2,-1)、(2,+5) 後是多少？',predictAnswer:'0 → 3 → 2 → 7，最後為 7。',
      steps:['建立初始狀態清單。','每筆 K D 將 K 減 1 轉為索引，在原值上加 D。','全部指令執行後以空格輸出清單。'],starter:'n = int(input())\nitems = list(map(int, input().split()))\nq = int(input())\nfor _ in range(q):\n    k, d = map(int, input().split())\n    items[____] += d\nprint(*items)',solution:'n = int(input())\nitems = list(map(int, input().split()))\nq = int(input())\nfor _ in range(q):\n    k, d = map(int, input().split())\n    items[k - 1] += d\nprint(*items)',hint:'題目的第 K 格要轉成清單索引 K - 1。',checkpoint:'「覆寫」與「在原值上增加」有什麼差異？',commonMistakes:['K 沒有減 1。','每處理一筆指令就重建清單。'],tests:[{input:'4\n5 2 0 7\n3\n2 3\n4 -2\n1 1',output:'6 5 0 5'},{input:'1\n0\n2\n1 5\n1 -2',output:'3'},{input:'3\n1 2 3\n0',output:'1 2 3'}],
      variants:[
        {title:'成績訂正',mission:'輸入 N 與 N 個成績，再輸入 Q 行 K X，代表把第 K 筆成績覆寫為 X。輸出最終成績。',sampleInput:'3\n60 70 80\n2\n2 75\n1 90',sampleOutput:'90 75 80',starter:'n = int(input())\nscores = list(map(int, input().split()))\nq = int(input())\nfor _ in range(q):\n    k, x = map(int, input().split())\n    scores[k - 1] = ____\nprint(*scores)',solution:'n = int(input())\nscores = list(map(int, input().split()))\nq = int(input())\nfor _ in range(q):\n    k, x = map(int, input().split())\n    scores[k - 1] = x\nprint(*scores)',hint:'這題是覆寫成績，不是在原分數上加 x。',tests:[{input:'3\n60 70 80\n2\n2 75\n1 90',output:'90 75 80'},{input:'1\n0\n1\n1 100',output:'100'},{input:'2\n5 6\n0',output:'5 6'}]},
        {title:'燈號切換',mission:'輸入 N 個初始 0/1 燈號與 Q 個 1 起算位置。每筆指令切換該燈號，最後輸出狀態。',sampleInput:'4\n0 1 0 1\n3\n1\n2\n1',sampleOutput:'0 0 0 1',starter:'n = int(input())\nlights = list(map(int, input().split()))\nq = int(input())\nfor _ in range(q):\n    k = int(input()) - 1\n    lights[k] = 1 - ____\nprint(*lights)',solution:'n = int(input())\nlights = list(map(int, input().split()))\nq = int(input())\nfor _ in range(q):\n    k = int(input()) - 1\n    lights[k] = 1 - lights[k]\nprint(*lights)',hint:'0 和 1 可以用 1 - 目前值互相切換。',tests:[{input:'4\n0 1 0 1\n3\n1\n2\n1',output:'0 0 0 1'},{input:'1\n0\n1\n1',output:'1'},{input:'2\n1 1\n2\n2\n2',output:'1 1'}]}
      ]
    },
    {
      id:'M11',displayNumber:'M11',title:'巢狀迴圈',badge:'loop × loop',kicker:'ROWS AND COLUMNS',
      goal:'用外層迴圈控制列，內層迴圈處理當列的每個位置。',concept:'可把巢狀迴圈想成教室座位：外層選擇第幾排，內層走過這排的每個座位。每當外層執行一次，內層都會跑完一輪。',
      mission:'輸入正整數 R C，依列優先順序輸出所有座標 (r,c)，r 與 c 都從 1 開始，每個座標一行。',sampleInput:'2 3',sampleOutput:'(1,1)\n(1,2)\n(1,3)\n(2,1)\n(2,2)\n(2,3)',predict:'R=2、C=3 時，外層執行幾次？內層內容總共執行幾次？',predictAnswer:'外層 2 次，內層內容總共 2 × 3 = 6 次。',
      steps:['外層使 r 從 1 到 R。','內層使 c 從 1 到 C。','在內層輸出格式完整的 (r,c)。'],starter:'r_count, c_count = map(int, input().split())\nfor r in range(1, r_count + 1):\n    for c in range(1, ____):\n        print(f"({r},{c})")',solution:'r_count, c_count = map(int, input().split())\nfor r in range(1, r_count + 1):\n    for c in range(1, c_count + 1):\n        print(f"({r},{c})")',hint:'range() 不包含終點，所以欄的終點要寫 c_count + 1。',checkpoint:'請各用一句話說明外層與內層的責任。',commonMistakes:['把列數與欄數風位。','格式多了空格或括號。'],tests:[{input:'1 1',output:'(1,1)'},{input:'2 3',output:'(1,1)\n(1,2)\n(1,3)\n(2,1)\n(2,2)\n(2,3)'},{input:'3 1',output:'(1,1)\n(2,1)\n(3,1)'}],
      variants:[
        {title:'數字長方形',mission:'輸入 R C，輸出 R 行，每行依序為 1 到 C，數字以一個空格分隔。',sampleInput:'2 4',sampleOutput:'1 2 3 4\n1 2 3 4',starter:'r_count, c_count = map(int, input().split())\nfor _ in range(r_count):\n    row = []\n    for c in range(1, c_count + 1):\n        row.append(str(____))\n    print(" ".join(row))',solution:'r_count, c_count = map(int, input().split())\nfor _ in range(r_count):\n    row = []\n    for c in range(1, c_count + 1):\n        row.append(str(c))\n    print(" ".join(row))',hint:'每一列都建立新的 row，將欄編號 c 轉成字串加入。',tests:[{input:'1 3',output:'1 2 3'},{input:'2 4',output:'1 2 3 4\n1 2 3 4'},{input:'3 1',output:'1\n1\n1'}]},
        {title:'空心方框',mission:'輸入 R C（都至少 2），以 * 輸出 R×C 空心長方形，內部用空格。',sampleInput:'3 5',sampleOutput:'*****\n*   *\n*****',starter:'r_count, c_count = map(int, input().split())\nfor r in range(r_count):\n    row = ""\n    for c in range(c_count):\n        if r == 0 or r == r_count - 1 or c == 0 or c == c_count - 1:\n            row += "*"\n        else:\n            row += "____"\n    print(row)',solution:'r_count, c_count = map(int, input().split())\nfor r in range(r_count):\n    row = ""\n    for c in range(c_count):\n        if r == 0 or r == r_count - 1 or c == 0 or c == c_count - 1:\n            row += "*"\n        else:\n            row += " "\n    print(row)',hint:'只有邊界位置放星號，內部要加一個空格。',tests:[{input:'2 3',output:'***\n***'},{input:'3 5',output:'*****\n*   *\n*****'},{input:'4 2',output:'**\n**\n**\n**'}]}
      ]
    },
    {
      id:'M12',displayNumber:'M12',title:'二維清單',badge:'grid[r][c]',kicker:'DATA ON A GRID',
      goal:'把格狀資料建成清單的清單，使用列與欄索引定位與統計。',concept:'grid[r] 取出一整列，grid[r][c] 才取出單一格。Python 的 r、c 都從 0 開始，對應紙上第 r+1 列、第 c+1 欄。',
      mission:'輸入 R C，接著 R 行各 C 個 0/1。0 表示可用座位，逐行輸出每列可用座位數。',sampleInput:'2 3\n0 1 0\n1 1 0',sampleOutput:'2\n1',predict:'grid[1][2] 在格紙上是第幾列第幾欄？grid[1] 又是什麼？',predictAnswer:'第 2 列第 3 欄；grid[1] 是第 2 列的整列清單。',
      steps:['連續讀取 R 行建立 grid。','每次取出一整列 row。','計算 row 中 0 的數量並輸出。'],starter:'r_count, c_count = map(int, input().split())\ngrid = [list(map(int, input().split())) for _ in range(r_count)]\nfor row in grid:\n    print(row.count(____))',solution:'r_count, c_count = map(int, input().split())\ngrid = [list(map(int, input().split())) for _ in range(r_count)]\nfor row in grid:\n    print(row.count(0))',hint:'題目說 0 表示可用，因此每列要 count(0)。',checkpoint:'grid[r] 和 grid[r][c] 分別取出什麼？',commonMistakes:['把 R 與 C 風位。','要算每欄時，卻在每列重設累加值。'],tests:[{input:'2 3\n0 1 0\n1 1 0',output:'2\n1'},{input:'1 1\n1',output:'0'},{input:'3 2\n0 0\n0 1\n1 1',output:'2\n1\n0'}],
      variants:[
        {title:'每欄總和',mission:'輸入 R C 與整數格子，輸出 C 個欄總和，以空格分隔。',sampleInput:'2 3\n1 2 3\n4 5 6',sampleOutput:'5 7 9',starter:'r_count, c_count = map(int, input().split())\ngrid = [list(map(int, input().split())) for _ in range(r_count)]\nsums = [0] * c_count\nfor r in range(r_count):\n    for c in range(c_count):\n        sums[c] += grid[____][____]\nprint(*sums)',solution:'r_count, c_count = map(int, input().split())\ngrid = [list(map(int, input().split())) for _ in range(r_count)]\nsums = [0] * c_count\nfor r in range(r_count):\n    for c in range(c_count):\n        sums[c] += grid[r][c]\nprint(*sums)',hint:'目前格子是 grid[r][c]，它要加到第 c 欄的 sums[c]。',tests:[{input:'2 3\n1 2 3\n4 5 6',output:'5 7 9'},{input:'1 2\n-1 5',output:'-1 5'},{input:'3 1\n2\n3\n4',output:'9'}]},
        {title:'最亮的格子',mission:'輸入 R C 與整數亮度，輸出最大值及它第一次出現的 1 起算列、欄，同一行以空格分隔。',sampleInput:'2 3\n1 9 3\n9 5 2',sampleOutput:'9 1 2',starter:'r_count, c_count = map(int, input().split())\ngrid = [list(map(int, input().split())) for _ in range(r_count)]\nbest = grid[0][0]\nbest_r = best_c = 0\nfor r in range(r_count):\n    for c in range(c_count):\n        if grid[r][c] ____ best:\n            best, best_r, best_c = grid[r][c], r, c\nprint(best, best_r + 1, best_c + 1)',solution:'r_count, c_count = map(int, input().split())\ngrid = [list(map(int, input().split())) for _ in range(r_count)]\nbest = grid[0][0]\nbest_r = best_c = 0\nfor r in range(r_count):\n    for c in range(c_count):\n        if grid[r][c] > best:\n            best, best_r, best_c = grid[r][c], r, c\nprint(best, best_r + 1, best_c + 1)',hint:'只在嚴格更大時更新，就能保留列優先的第一次位置。',tests:[{input:'2 3\n1 9 3\n9 5 2',output:'9 1 2'},{input:'1 1\n-7',output:'-7 1 1'},{input:'2 2\n1 2\n3 4',output:'4 2 2'}]}
      ]
    },
    {
      id:'M13',displayNumber:'M13',title:'函式、拆解與測試',badge:'def · return',kicker:'NAME A RESPONSIBILITY',
      goal:'用參數接收資料、以 return 交回結果，將大問題拆成可獨立測試的小任務。',concept:'print() 是顯示結果，return 是把值交回呼叫處。計算函式應使用參數，通常不在函式內部直接 input()，才容易重複測試。',
      mission:'實作 clamp(value, low, high)。value 太小回傳 low，太大回傳 high，否則回傳原值。主程式讀入三個整數並輸出結果。',sampleInput:'120 0 100',sampleOutput:'100',predict:'clamp(120, 0, 100) 應回傳什麼？如果函式只 print 卻沒有 return，呼叫處收到什麼？',predictAnswer:'應回傳 100；只 print 時，呼叫處收到 None。',
      steps:['定義含三個參數的 clamp。','依序處理低於 low、高於 high 與其餘三種情況。','主程式讀入資料，呼叫函式後輸出回傳值。'],starter:'def clamp(value, low, high):\n    if value < low:\n        return ____\n    if value > high:\n        return ____\n    return ____\n\nvalue, low, high = map(int, input().split())\nprint(clamp(value, low, high))',solution:'def clamp(value, low, high):\n    if value < low:\n        return low\n    if value > high:\n        return high\n    return value\n\nvalue, low, high = map(int, input().split())\nprint(clamp(value, low, high))',hint:'三條回傳路徑分別是 low、high 與 value。',checkpoint:'主程式與 clamp 函式各負責什麼？',commonMistakes:['在函式內只 print，卻沒有 return。','函式依賴外部變數，無法獨立測試。'],tests:[{input:'120 0 100',output:'100'},{input:'-5 0 100',output:'0'},{input:'42 0 100',output:'42'}],
      variants:[
        {title:'位數總和函式',mission:'實作 digit_sum(n)，回傳非負整數各位數總和。主程式讀入 n 並輸出結果。',sampleInput:'5072',sampleOutput:'14',starter:'def digit_sum(n):\n    total = 0\n    for ch in str(n):\n        total += ____\n    return total\n\nn = int(input())\nprint(digit_sum(n))',solution:'def digit_sum(n):\n    total = 0\n    for ch in str(n):\n        total += int(ch)\n    return total\n\nn = int(input())\nprint(digit_sum(n))',hint:'將 n 轉成字串後，每個 ch 還要以 int(ch) 轉回數字才能累加。',tests:[{input:'5072',output:'14'},{input:'0',output:'0'},{input:'999',output:'27'}]},
        {title:'成績報表',mission:'輸入 N 與 N 個 0–100 分數。至少定義 total_score 與 pass_count 兩個函式，逐行輸出總分、整數平均、及格人數。',sampleInput:'5\n60 59 80 42 100',sampleOutput:'341\n68\n3',starter:'def total_score(scores):\n    return ____\n\ndef pass_count(scores):\n    return sum(1 for score in scores if score >= 60)\n\nn = int(input())\nscores = list(map(int, input().split()))\ntotal = total_score(scores)\nprint(total)\nprint(total // n)\nprint(pass_count(scores))',solution:'def total_score(scores):\n    return sum(scores)\n\ndef pass_count(scores):\n    return sum(1 for score in scores if score >= 60)\n\nn = int(input())\nscores = list(map(int, input().split()))\ntotal = total_score(scores)\nprint(total)\nprint(total // n)\nprint(pass_count(scores))',hint:'total_score 只負責回傳 sum(scores)；主程式負責組合結果與輸出。',tests:[{input:'5\n60 59 80 42 100',output:'341\n68\n3'},{input:'3\n10 20 30',output:'60\n20\n0'},{input:'4\n60 70 80 90',output:'300\n75\n4'}]}
      ]
    },
    {
      id:'M14',displayNumber:'M14',title:'讀懂錯誤訊息與自訂測資',badge:'Traceback · 邊界測資',kicker:'READ THE ERROR, WRITE THE TEST',allowedLanguages:['python'],
      goal:'看懂 Python 的錯誤訊息並定位問題，並能自己設計一般、邊界與陷阱三種測資。',concept:'程式出錯時 Python 會印出 Traceback。先看最後一行的錯誤類型與說明，再看上面一行的行號。三個最常遇到的：IndexError: list index out of range 是索引超出範圍，常見原因是 1 起算的位置沒有減 1，或迴圈跑到最後一項卻又取了下一項；ValueError: invalid literal for int() 是拿了不是純數字的字串去轉整數，常見原因是沒有先 split()；TypeError 是型別不合，例如字串和整數直接相加或比較，通常是忘了 int()。另外還有 NameError（名字打錯或還沒定義）與 ZeroDivisionError（除數是 0）。測資自己出三種就夠：一般值、邊界值（N 等於 1、資料全部相同、出現 0）、陷阱值（負數、重複、答案落在第一筆或最後一筆）。題目沒有先告訴你有幾行時，用 for line in sys.stdin 一路讀到輸入結束。',
      mission:'輸入 N 與 N 個整數（N 至少 2），逐行輸出每一個數與它下一個數的和，共 N-1 行。起始程式會出現 IndexError，請讀懂訊息後修好迴圈範圍。',sampleInput:'4\n3 8 6 10',sampleOutput:'11\n14\n16',
      predict:'nums 有 4 個項目，程式寫 for i in range(4)，迴圈裡取 nums[i + 1]。會在 i 等於多少時出錯？錯誤類型是什麼？',predictAnswer:'i 等於 3 時 nums[4] 已經超出範圍，出現 IndexError: list index out of range。迴圈上限應該是 n - 1。',
      steps:['先看 Traceback 最後一行的錯誤類型，再看上一行的行號。','找出是哪一個索引超出範圍，倒推回迴圈的上限。','修好之後，自己補一組 N 等於 2 的最小測資再跑一次。'],
      starter:'n = int(input())\nnums = list(map(int, input().split()))\n# 這段會出現 IndexError，請修好迴圈的範圍\nfor i in range(____):\n    print(nums[i] + nums[i + 1])',
      solution:'n = int(input())\nnums = list(map(int, input().split()))\nfor i in range(n - 1):\n    print(nums[i] + nums[i + 1])',
      hint:'迴圈裡取了 nums[i + 1]，所以 i 最大只能到 n - 2，範圍要寫成 range(n - 1)。',
      checkpoint:'看到 Traceback 時，你會先看哪兩行？為什麼這兩行就夠定位問題？',
      commonMistakes:['只把錯誤訊息當成「程式壞了」，沒有讀最後一行的錯誤類型。','測資只準備一般值，沒有測 N 等於 1、全部相同或含負數的情況。'],
      tests:[{input:'4\n3 8 6 10',output:'11\n14\n16'},{input:'2\n1 1',output:'2'},{input:'3\n-5 5 0',output:'0\n5'}],
      variants:[
        {title:'修好 ValueError',mission:'輸入一行以空格分隔的整數（題目沒有先給數量），輸出它們的總和。起始程式會出現 ValueError，請修好讀取方式。',sampleInput:'3 8 6',sampleOutput:'17',starter:'# 這段會出現 ValueError，請修好讀取方式\nnums = list(map(int, input().____()))\nprint(sum(nums))',solution:'nums = list(map(int, input().split()))\nprint(sum(nums))',hint:'int() 一次只能轉一段純數字；要先用 split() 把一行切成好幾段，再逐段轉換。',tests:[{input:'3 8 6',output:'17'},{input:'5',output:'5'},{input:'-1 1 -2 2',output:'0'}]},
        {title:'讀到輸入結束',mission:'輸入有好幾行，每行一個整數，但題目沒有先告訴你有幾行。請讀到輸入結束為止，第一行輸出總和，第二行輸出筆數。',sampleInput:'3\n8\n6',sampleOutput:'17\n3',starter:'import sys\n\ntotal = 0\ncount = 0\nfor line in sys.____:\n    line = line.strip()\n    if line == "":\n        continue\n    total += int(line)\n    count += 1\nprint(total)\nprint(count)',solution:'import sys\n\ntotal = 0\ncount = 0\nfor line in sys.stdin:\n    line = line.strip()\n    if line == "":\n        continue\n    total += int(line)\n    count += 1\nprint(total)\nprint(count)',hint:'標準輸入是 sys.stdin，直接用 for 走訪它就會一行一行讀到結束。',tests:[{input:'3\n8\n6',output:'17\n3'},{input:'5',output:'5\n1'},{input:'-1\n1\n-2\n2',output:'0\n4'}]}
      ]
    }
  ];

  window.SKILLLAB_COURSES = window.SKILLLAB_COURSES || {};
  window.SKILLLAB_COURSES.intermediate = {
    key: 'intermediate', name: 'LV.2 講義', shortName: 'LV.2', lessons: intermediate,
    storagePrefix: 'pyjudge_intermediate', progressVersion: 'v2', legacyDrafts: false, skipLegacyProgress: true,
    finishTitle: 'LV.2 學習地圖完成！',
    finishCopy: '你已經能處理字串與組裝輸出、清單的增刪與切片、數字拆解與進位轉換、統計與搜尋、狀態模擬、二維資料、函式，也會讀錯誤訊息並自己出測資。接下來可進入效率、資料結構與演算法選擇。',
    finishHref: 'beginner.html?course=advanced', finishLink: '前往 LV.3 講義 →'
  };
})();
