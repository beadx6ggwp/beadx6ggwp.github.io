---
title: "快速判斷N是否為2的次方數"
description: 

slug: ispowerby2 # web path
image: 
date: 2018-03-21T09:31:46+08:00
categories: [CodingNote]
tags: [ProblemSolving]

license:  # CC BY-NC-ND
hidden: false
# comments: true #註解掉為開啟
math: 
draft: false
---

# 快速判斷N是否為2的次方數

前陣子遇到一個題目 : 請你判斷一個正整數N是否為2的次方。

我遇到這題目時，直覺想到的就是，透過迴圈從1開始檢查所有2的次方數，像這樣 :
```C++
bool isPowerBy2_(int n)
{
    for (int i = 1; i <= n; i *= 2)            
        if (i == n) return true;

    return false;
}
// output:
// isPowerBy2(1)   => true
// isPowerBy2(2)   => true
// isPowerBy2(4)   => true
// isPowerBy2(-1)  => false
// isPowerBy2(0)   => false
// isPowerBy2(3)   => false
```

雖然這樣就解決了，但我一直在想是否有效率更高的方法。

我們先來觀察2的次方數轉成2進制的樣子 :
```
1 => 0000 0001 ,    1 – 1 => 0000 0000

2 => 0000 0010 ,    2 – 1 => 0000 0001

4 => 0000 0100  ,    4 – 1 => 0000 0011

8 => 0000 1000  ,    8 – 1 => 0000 0111

16 => 0001 0000 ,   16 – 1 => 0000 1111

32 => 0010 0000 ,   32 – 1 => 0001 1111
```

可以發現，只要該數是2的次方時，除了MSB(最高位元)是 1 其餘都是0，

然後我們又可以發現，2的次方數減1後，剛好等於原數NOT後的值。

 

在數位邏輯中 N & !N = 0，我們可以透過這個方法來判斷N是否為2的次方，所以是否為2的次方的判斷規則就是 :

`N & (N-1) == 0`

在數學中0不是任何人的次方，但這裡會有個小問題，當我們把0帶入後照樣會得到true，因為0不管和誰做AND都是0，所以要再加上一個 n > 0來塞選。

 

最後我們得到
``` C++
bool isPowerBy2(int n)
{
    return n > 0 && (n & n - 1) == 0;
}
// output:
// isPowerBy2(1)   => true
// isPowerBy2(2)   => true
// isPowerBy2(4)   => true
// isPowerBy2(-1)  => false
// isPowerBy2(0)   => false
// isPowerBy2(3)   => false
```
 

那為什麼只要 n & n-1 == 0就代表是2的次方數呢?

根據上面列出的幾個數字，得出如果該數是2的次方數，就只有MSB為1，而其餘數字都會有2個以上的1，所以在減1時，就不會跟MSB借位，也就沒辦法達到NOT的效果。

7 = 0111, 7 – 1 = 0110 => 7 & (7-1) = 110, 110 != 0

沒辦法達到NOT效果的話，在做AND運算時就不會得到0，只有在該數為2的次方數時，AND的結果才會是零，最後就能透過結果是否為0來判斷N是不是2的次方數了