---
title: "Linear Algebra: 從Coordinate Vector到Matrix Representation"
description: "整理 basis、coordinate vector、linear map、matrix representation、composition、inverse 與 isomorphism 的關係。"
slug: linear-algebra-representation-to-matrix
image: img/vector representation.jpg
date: 2026-04-26T18:00:00+08:00
categories: [Math]
tags: [LinearAlgebra]
license:
hidden: false
math: true
draft: false
---

## 前言

第一次學線性代數時，很容易把整個科目想成 matrix calculation。

看到 linear map，就想成一個 matrix；看到 vector，就想成 column vector。這樣做題很快，但後面遇到 polynomial space、function space、change of basis、isomorphism 時，就會開始覺得符號在飄。

原因是 matrix 不是一開始就存在的東西。

比較合理的順序應該是先有 vector space，再有 basis。選了 basis 之後，vector 才能被寫成 coordinate vector。接著有 linear map，並且 linear map 會被 basis images 決定。最後，把這些 basis images 寫成 coordinates，才得到 matrix representation。

所以這篇不從「matrix 怎麼乘」開始，而是從 representation 的需求開始整理：

```text
linear combination
-> span
-> linear independence
-> basis
-> coordinate vector
-> linear map
-> matrix representation
-> composition
-> inverse
-> isomorphism
```

這種順序也比較接近 Axler 在 *Linear Algebra Done Right* 裡的味道：先把 vector spaces 和 linear maps 當作主要對象，matrix 是選定 bases 之後才出現的表示方式。

## 先回到 Linear Combination

在談 matrix 之前，可以先回到 linear combination。

給定 vectors $\vec{v}\_1,\ldots,\vec{v}\_n$ 和 scalars $a\_1,\ldots,a\_n$，可以組出：

$$ a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n $$

這個式子看起來很普通，但它背後其實已經用到 field 和 vector space 的設定。

field 處理的是 scalar 的加法、乘法與消去。vector space 處理的是 vector addition 和 scalar multiplication，而且要求操作後還留在同一個 space 裡。

所以 field 和 vector space 不是形式上的開場白。它們先把 linear combination 這件事變成可以反覆使用的操作。

---

## Span：能不能表示出來

有了 linear combination 後，接著會問：

> 能不能用這組 vectors 做出某個目標 vector？

這就是 span 處理的問題。

若 $S\subseteq V$，那 $\operatorname{span}(S)$ 是所有能由 $S$ 裡的 vectors 做 linear combination 得到的 vectors。

所以：

$$ x\in\operatorname{span}(S) $$

意思是存在某些 coefficients，可以把 $x$ 表示出來。

但這裡只保證存在，還沒有保證唯一。

例如在 $\mathbb{R}^2$ 中，$\{(1,0),(0,1),(1,1)\}$ 一樣可以 span 整個 $\mathbb{R}^2$，但 $(1,1)$ 其實已經可以由前兩個 vectors 做出來：

$$ (1,1)=(1,0)+(0,1) $$

所以 spanning set 不一定適合拿來當 coordinates。因為同一個 vector 可能有很多種表示方式。

---

## Linear Independence：表示法不能有冗餘

Linear independence 的定義是：

$$ a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n=\vec{0}\Rightarrow a\_1=\cdots=a\_n=0 $$

這句話表面上是在講 zero vector，但它真正排除的是 redundant representation。

如果存在一組不全為零的 coefficients，使得：

$$ a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n=\vec{0} $$

那就代表其中某個 vector 可以被其他 vectors 表示。換句話說，這組 vectors 裡有人是多餘的。

所以可以先把 span 和 linear independence 分開看：

```text
span
-> 每個 vector 至少能被表示

linear independence
-> 表示法不會有冗餘
```

basis 則是把這兩個條件合起來。

---

## Basis 讓 coordinates 變得合法

一組 basis 同時滿足：

1. spans $V$；
2. linearly independent。

所以如果 $\beta=(\vec{v}\_1,\ldots,\vec{v}\_n)$ 是 $V$ 的 ordered basis，那每個 $x\in V$ 都可以唯一寫成：

$$ x=a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n $$

這時候才可以定義 coordinate vector：

$$ [x]\_{\beta}=\begin{pmatrix} a\_1\\ \vdots\\ a\_n \end{pmatrix} $$

這個 column vector 不是 $x$ 本身，而是 $x$ 在 basis $\beta$ 下的 coordinates。

如果 basis 改掉，coordinates 也會跟著改掉。

所以平常直接把 vector 寫成 column vector，其實是省略了前提：已經選好 ordered basis。

---

## Coordinate Map

選好 basis $\beta$ 後，可以定義 coordinate map：

$$ C\_{\beta}:V\to F^n $$

$$ C\_{\beta}(x)=[x]\_{\beta} $$

它做的事情就是把 abstract vector $x$ 轉成它在 $\beta$ 下的 coordinate vector。

這個 map 之所以 well-defined，是因為 basis expansion unique。也就是同一個 $x$ 不會有兩組不同 coordinates。

它也是 linear。假設：

$$ x=a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n $$

$$ y=b\_1\vec{v}\_1+\cdots+b\_n\vec{v}\_n $$

那麼：

$$ x+y=(a\_1+b\_1)\vec{v}\_1+\cdots+(a\_n+b\_n)\vec{v}\_n $$

所以：

$$ [x+y]\_{\beta}=[x]\_{\beta}+[y]\_{\beta} $$

scalar multiplication 也是一樣：

$$ [cx]\_{\beta}=c[x]\_{\beta} $$

因此選定 basis 後，$V$ 可以被翻譯成 $F^n$。但這個翻譯不是天生的，而是依賴你選的 basis。

---

## Linear Map 由 Basis Images 決定

接著看 linear map。

普通 function 通常不能只靠幾個 input 的結果決定。但 linear map 有額外限制：它必須保留 linear combination。

也就是：

$$ T(a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n)=a\_1T(\vec{v}\_1)+\cdots+a\_nT(\vec{v}\_n) $$

如果 $\beta=(\vec{v}\_1,\ldots,\vec{v}\_n)$ 是 $V$ 的 basis，任意 $x\in V$ 都可以寫成：

$$ x=a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n $$

套用 $T$：

$$ T(x)=a\_1T(\vec{v}\_1)+\cdots+a\_nT(\vec{v}\_n) $$

所以只要知道：

$$ T(\vec{v}\_1),\ldots,T(\vec{v}\_n) $$

就能決定 $T$ 對所有 $x\in V$ 的結果。

這句話要小心，不是說「知道幾個 input 的 output 就能決定 function」。它成立是因為那幾個 input 是 basis，而且 map 是 linear。

---

## Matrix Representation：記錄 Basis Images 的 Coordinates

現在令：

$$ T:V\to W $$

是 linear map。

選兩組 ordered bases：

- $\beta=(\vec{v}\_1,\ldots,\vec{v}\_n)$ for $V$；
- $\gamma=(\vec{w}\_1,\ldots,\vec{w}\_m)$ for $W$。

這裡先不要急著寫 matrix，可以先看 $T$ 對 domain basis vector 做了什麼。

對每個 $\vec{v}\_k$，有：

$$ T(\vec{v}\_k)\in W $$

因為 $\gamma$ 是 $W$ 的 basis，所以 $T(\vec{v}\_k)$ 可以唯一寫成：

$$ T(\vec{v}\_k)=A\_{1,k}\vec{w}\_1+\cdots+A\_{m,k}\vec{w}\_m $$

這裡的 $A\_{j,k}$ 就是 matrix 裡第 $j$ row、第 $k$ column 的 entry。

也就是說，matrix 不是先被定義出來，再拿來套到 $T$ 上。比較自然的方向是反過來：

```text
先看 T(v_k)
-> 把 T(v_k) 寫成 gamma basis 的 linear combination
-> coefficients 放進第 k 個 column
```

因此 $T$ relative to domain basis $\beta$ and codomain basis $\gamma$ 的 matrix representation 可以寫成：

$$ [T]^{\gamma}\_{\beta}=([T(\vec{v}\_1)]\_{\gamma},[T(\vec{v}\_2)]\_{\gamma},\ldots,[T(\vec{v}\_n)]\_{\gamma}) $$

這個式子裡的 columns 不是排版用的。第 $k$ 欄就是 $T(\vec{v}\_k)$ 在 $\gamma$ 底下的 coordinate vector。

所以 matrix representation 其實只是把 linear map 對 basis 的作用結果，用 coordinates 存起來。

## Matrix Representation 的公式

若：

$$ x=a\_1\vec{v}\_1+\cdots+a\_n\vec{v}\_n $$

那：

$$ [x]\_{\beta}=\begin{pmatrix} a\_1\\ \vdots\\ a\_n \end{pmatrix} $$

而：

$$ T(x)=a\_1T(\vec{v}\_1)+\cdots+a\_nT(\vec{v}\_n) $$

把右邊轉成 $\gamma$ coordinates：

$$ [T(x)]\_{\gamma}=a\_1[T(\vec{v}\_1)]\_{\gamma}+\cdots+a\_n[T(\vec{v}\_n)]\_{\gamma} $$

這正好就是 matrix columns 對 coefficients 做 linear combination：

$$ [T(x)]\_{\gamma}=[T]^{\gamma}\_{\beta}[x]\_{\beta} $$

這句話如果直接背，很容易忽略它其實在做兩次翻譯：

```text
先把 x 翻成 beta coordinates
再把 T(x) 翻成 gamma coordinates
```

所以可以把每個 object 放回它所在的位置：


| object | 所在位置 |
|---|---|
| $x$ | $V$ |
| $[x]\_{\beta}$ | $F^n$ |
| $T(x)$ | $W$ |
| $[T(x)]\_{\gamma}$ | $F^m$ |
| $[T]^{\gamma}\_{\beta}$ | $M\_{m\times n}(F)$ |

所以 matrix 不是直接吃 abstract vector $x$。它吃的是 $[x]\_{\beta}$。

matrix 的輸出也不是 $T(x)$ 本身，而是 $[T(x)]\_{\gamma}$。

整個流程可以寫成：

```text
x in V
-> [x]_beta in F^n
-> [T(x)]_gamma in F^m
-> T(x) in W
```

---

## 上下標在記錄方向

$[T]^{\gamma}\_{\beta}$ 裡面：

- $\beta$ 是 domain basis；
- $\gamma$ 是 codomain basis。

所以它做的是：

```text
beta coordinates
-> gamma coordinates
```

如果換 basis，同一個 linear map $T$ 會得到不同的 matrix。

所以不能直接說 linear map 就是 matrix。比較精確地說，是選定 domain basis 和 codomain basis 後，linear map 才會有對應的 matrix representation。

---

## Composition：右邊的 matrix 先作用

現在令：

$$ T:V\to W $$

$$ U:W\to Z $$

composition 是：

$$ U\circ T:V\to Z $$

也就是先做 $T$，再做 $U$。

選 bases：

- $\alpha$ for $V$；
- $\beta$ for $W$；
- $\gamma$ for $Z$。

對 $x\in V$，先做 $T$：

$$ [T(x)]\_{\beta}=[T]^{\beta}\_{\alpha}[x]\_{\alpha} $$

再做 $U$：

$$ [U(T(x))]\_{\gamma}=[U]^{\gamma}\_{\beta}[T(x)]\_{\beta} $$

代入前一式：

$$ [(U\circ T)(x)]\_{\gamma}=[U]^{\gamma}\_{\beta}[T]^{\beta}\_{\alpha}[x]\_{\alpha} $$

所以：

$$ [U\circ T]^{\gamma}\_{\alpha}=[U]^{\gamma}\_{\beta}[T]^{\beta}\_{\alpha} $$

這也能看出為什麼右邊的 matrix 先作用。。

因為 column vector 放在最右邊，越靠近 input coordinates 的 matrix 越先被套用。

```text
[x]_alpha
-> [T(x)]_beta
-> [U(T(x))]_gamma
```

---

## Identity Map 和 Change of Coordinates

如果 $I\_V:V\to V$ 是 identity map，那：

$$ I\_V(x)=x $$

如果 domain basis 和 codomain basis 都是 $\beta$，那：

$$ [I\_V]^{\beta}\_{\beta}=I $$

但如果 domain basis 是 $\alpha$，codomain basis 是 $\beta$，那：

$$ [I\_V]^{\beta}\_{\alpha} $$

就不是單純的 identity matrix，而是在把 $\alpha$ coordinates 轉成 $\beta$ coordinates。

所以 identity map 的 matrix 不一定是 identity matrix。它取決於兩邊用的是不是同一組 basis。

---

## Inverse：Map 反過來，Basis 也反過來

如果 $T:V\to W$ is invertible，那有：

$$ T^{-1}:W\to V $$

滿足：

$$ T^{-1}\circ T=I\_V $$

$$ T\circ T^{-1}=I\_W $$

選 basis $\beta$ for $V$，basis $\gamma$ for $W$。

因為 $T$ 是：

```text
beta coordinates
-> gamma coordinates
```

所以 $T^{-1}$ 是：

```text
gamma coordinates
-> beta coordinates
```

因此：

$$ [T^{-1}]^{\beta}\_{\gamma}=([T]^{\gamma}\_{\beta})^{-1} $$

這個式子可以直接從方向看。

$T$ 原本把 $V$ 送到 $W$，所以在 coordinates 裡是從 $\beta$ 走到 $\gamma$。

$T^{-1}$ 則把 $W$ 送回 $V$，所以在 coordinates 裡就從 $\gamma$ 走回 $\beta$。

也就是說，inverse 不只是把 matrix 取 inverse，也要把它連接的兩套 coordinate systems 反過來看。

---

## Isomorphism

最後看 isomorphism。

一個 linear map $T:V\to W$ 如果 bijective，就稱為 linear isomorphism。

它不是說 $V$ 和 $W$ 裡的元素長得一樣，而是說兩邊的 linear combination structure 可以互相翻譯，而且不丟資訊。

如果 $V$ 和 $W$ 都是 finite-dimensional vector spaces over the same field，那：

$$ V\cong W\Longleftrightarrow \dim(V)=\dim(W) $$

原因是：

如果 $V\cong W$，isomorphism 會把 basis 對應到 basis，所以 dimension 相同。

反過來，如果 dimension 相同，可以選兩邊的 basis，然後把一邊的 basis vectors 對應到另一邊，再 linear extend 成一個 isomorphism。

但這裡只是在說 abstract vector space structure。

如果還有 inner product、norm、metric、topology、orientation 這些額外結構，只看 dimension 不一定夠。

---

## 回頭看 Notation

到這裡再看 $[T]^{\gamma}\_{\beta}$，它就不只是上下標比較多的 matrix。

下標 $\beta$ 表示 input coordinate system，也就是這個 matrix 預期吃的是 $[x]\_{\beta}$。

上標 $\gamma$ 表示 output coordinate system，也就是這個 matrix 算出來的是 $[T(x)]\_{\gamma}$。

因此：

$$ [T(x)]\_{\gamma}=[T]^{\gamma}\_{\beta}[x]\_{\beta} $$

這個 notation 其實是在標出資料流：

```text
beta coordinates -> gamma coordinates
```

composition 也是同一件事。

如果：

$$ [T]^{\beta}\_{\alpha} $$

把 $\alpha$ coordinates 轉成 $\beta$ coordinates，而：

$$ [U]^{\gamma}\_{\beta} $$

把 $\beta$ coordinates 轉成 $\gamma$ coordinates，那它們中間的 $\beta$ 對得上，所以可以接起來：

$$ [U\circ T]^{\gamma}\_{\alpha}=[U]^{\gamma}\_{\beta}[T]^{\beta}\_{\alpha} $$

右邊的 $[T]^{\beta}\_{\alpha}$ 先作用，是因為 column vector 放在最右邊。這不是 notation 故意反直覺，而是 function composition 寫成 $U(T(x))$ 後，最靠近 $x$ 的東西先作用。

inverse 也可以用同一個方式看。

如果 $T$ 是：

```text
beta coordinates -> gamma coordinates
```

那 $T^{-1}$ 就是：

```text
gamma coordinates -> beta coordinates
```

所以：

$$ [T^{-1}]^{\beta}\_{\gamma}=([T]^{\gamma}\_{\beta})^{-1} $$

這裡上下標反過來，不是額外多背一條規則，而是 map 的方向反過來後自然發生的事情。

---

## 結論

從 coordinate vector 走到 matrix representation，最後整理出來的是：matrix 是 linear map 在 chosen bases 下的記錄方式。

basis 先讓 abstract vector 有唯一 coordinates。linear map 因為保留 linear combination，所以只要知道 basis vectors 被送到哪裡，就能決定整個 map。

matrix representation 接著做的事情，就是把這些 images 轉成 codomain basis 下的 coordinates，再依序放進 columns。

所以 matrix 不是 linear map 的起點，而是後面的表示結果。

composition 會對應到 matrix multiplication，是因為 coordinate representation 要跟 function composition 相容。

inverse 的上下標會反過來，是因為 map 的方向反過來，domain basis 和 codomain basis 也跟著交換。

如果之後要繼續看 change of basis、similar matrices、eigenvalues，這個觀念會一直出現：很多 matrix statement 背後真正不變的東西是 linear map，matrix 則是選了 basis 之後看到的樣子。

---

## References

- Sheldon Axler, *Linear Algebra Done Right*, 4th edition
- Stephen H. Friedberg, Arnold J. Insel, Lawrence E. Spence, *Linear Algebra*, 4th edition
- 李宏毅 Linear Algebra Lecture