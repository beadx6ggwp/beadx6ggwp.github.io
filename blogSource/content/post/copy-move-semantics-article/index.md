---
title: "從 Copy 到 Move: 理解 C++ 的 Ownership 語意"
description: 為什麼 std::move 不真的 Move

slug: copy-move-semantics-article # web path
image: img/Back to Basics Move Semantics.jpg
date: 2026-05-14T08:10:30+08:00
categories: [codingnote]
tags: [c++]

license:  # CC BY-NC-ND
hidden: false
# comments: true #註解掉為開啟
math: 
draft: false
---

## 簡介

最初和朋友只是想搞懂一個很小的問題: 一段看起來應該會 copy 的 code, 為什麼實際跑起來沒有 copy? 但討論到後來, 我們發現這個問題如果只用「compiler 做了最佳化」來解釋, 反而會跳過更重要的部分

因為在理解發生什麼事情之前, 其實應該先問:

* copy 到底是什麼?
* 一個 object 被 copy 之後, resource ownership 要怎麼辦?
* 如果不能 copy, 那 ownership 又該怎麼交出去?

這些問題一路牽出 RAII, copy constructor, deleted copy, move constructor, std::move, xvalue, 以及 C++17 的 prvalue model

也因此, 這篇與其說是在介紹 move semantics, 不如說是在整理 C++ 怎麼讓一個 object 自己說清楚: 它能不能被 copy, 能不能被 move, 以及它負責管理哪些 resource


## 一開始的問題: 這段 code 到底有沒有 copy?

我整理 move semantics 這個題目時, 其實一開始不是從 move 開始的. 我最一開始想問的是這段 code:

```cpp
T make() {
    return T{};
}

int main() {
    T y = make();
}
```

如果 `T` 長這樣:

```cpp
struct T {
    T() {
        std::cout << "default constructor\n";
    }

    T(const T&) {
        std::cout << "copy constructor\n";
    }

    ~T() {
        std::cout << "destructor\n";
    }
};
```

直覺上好像會覺得:

- `make()` 裡面先建立一個 `T{}` temporary object.
- 然後 return 給 `main()`.
- `main()` 再拿這個 temporary object 建立 `y`.

所以可能會猜 output 是:

```text
default constructor
copy constructor
destructor
destructor
```

但真的跑起來後, 會發現它可能根本沒有呼叫 copy constructor. 實際 output 比較像:

```text
default constructor
destructor
```

這時候就會有一個很自然的疑問:

> **compiler 為什麼沒有做 copy?**

這個現象當然跟 RVO / copy elision 有關. 但如果一開始就把它當成最佳化問題, 會很容易漏掉更前面的問題:

- **copy 到底是什麼?**
- **move 到底又是在解決什麼?**

因為如果不知道 copy 的語意是什麼, 就很難真的理解為什麼 move 需要被設計出來, 也很難理解為什麼有時候 "根本沒有東西可以 move"

## 把 copy 縮到最簡單的 case

我先把問題縮到最簡單的 `Point`:

```cpp
struct Point {
    int x;
    int y;
};

Point a{1, 2};
Point b = a;
```

這種 copy 很直覺. `Point` 裡面只有兩個 `int`, 所以 `Point b = a;` 基本上就是:

```cpp
b.x = a.x
b.y = a.y
```

copy 之後, `b` 就是一個可以正常使用的 `Point`. 這裡不太會有什麼 ownership 問題, 因為 `Point` 沒有管理任何外部資源.

但如果 object 裡面不是只有 `int` 呢? 例如一個 object 可能管理:

- heap memory
- file handle
- mutex lock
- GPU resource
- reference-counted control block

copy 完以後, 問題就不只是:

> **member 的值有沒有複製過去?**

而是:

- copy 出來的 `b` 能不能正常使用?
- `b` 需不需要釋放某個 resource?
- `b` 應該跟 `a` 指向同一份 resource, 還是應該有自己的 resource?
- `b` 死掉時會不會影響 `a`?
- `a` 死掉時會不會影響 `b`?

這些問題才是後面 copy / move 會一路牽出來的主軸.

## Buffer: 看起來只是 copy, 其實可能 double free

同樣的 copy 直覺, 換成一個 C-style `Buffer` 就開始不一樣:

```c
typedef struct {
    char* ptr; // Points to a heap block
    size_t size;
} Buffer;

Buffer buffer_create(size_t size);
void buffer_destroy(Buffer* buffer);
```

假設有這段操作:

```c
Buffer a = buffer_create(1024);
Buffer b = a;

buffer_destroy(&a);
buffer_destroy(&b);
```

`Buffer b = a;` 這行做了什麼? 其實在這一行當下, 還不一定會出事. 它只是把 member value 複製過去:

```c
b.ptr  = a.ptr
b.size = a.size
```

真正的問題在後面:

```c
buffer_destroy(&a);
buffer_destroy(&b);
```

因為 `a.ptr` 和 `b.ptr` 指向同一塊 heap block:

```text
a.ptr ----+
          +----> same heap block
b.ptr ----+
```

所以 destroy 的時候可能變成:

```text
a destroy -> free heap block
b destroy -> free same heap block again
```

也就是 double free.

這邊的重點不是 "C 不能 copy struct". C 當然可以 copy struct. 真正的問題是:

```c
Buffer b = a;
```

這一行只表達了 "把 `ptr` 和 `size` 的值複製過去". 但它沒有表達:

- `Buffer` 能不能 copy?
- copy 是 shallow copy 還是 deep copy?
- copy 之後誰 owns heap block?
- 誰負責 destroy?

也就是說, 這裡有 representation copy, 但語意沒有跟著被說清楚.

## Shallow copy 和 deep copy

剛剛 `Buffer b = a;` 做的是 shallow copy. shallow copy 很便宜, 因為它只複製表面上的值. 對 pointer 來說, 它複製的是 pointer value 本身:

```text
b.ptr = a.ptr
```

它不是去 dereference `a.ptr`, 然後把 heap block 裡面的內容複製一份. 所以結果會是:

```text
a.ptr ----+
          +----> heap block
b.ptr ----+
```

`a` 和 `b` 都以為自己擁有同一塊 heap block.

這裡的 cheap 只是說這個 operation 很便宜, 不是說它語意上一定正確. pointer value 被 copy 過去後, `a.ptr` 和 `b.ptr` 都指到同一個 heap block. 如果後面的 destroy 邏輯把兩個 `Buffer` 都當成 owner, 問題才真正爆出來.

一個解法是 deep copy. 也就是讓 `b.ptr` 指向另一塊新的 heap block, 但是那塊新的 heap block 裡面有和 `a` 一樣的內容.

例如:

```c
Buffer buffer_clone(const Buffer* src) {
    Buffer dst = buffer_create(src->size);
    memcpy(dst.ptr, src->ptr, src->size);
    return dst;
}
```

然後使用時寫:

```c
Buffer a = buffer_create(1024);
Buffer b = buffer_clone(&a);

buffer_destroy(&a);
buffer_destroy(&b);
```

這樣 `a` 和 `b` 就各自擁有不同的 heap block. `buffer_destroy(&a)` 和 `buffer_destroy(&b)` 都合理, 因為它們 release 的是不同資源.

但 deep copy 通常比較貴, 因為它要做兩件事:

- allocate 一塊新的 memory
- 把 heap block A 的內容 copy 到 heap block B

到這裡, copy 的問題開始變得比較清楚:

> **copy 不是只有一種意思.**
>
> 對 `Point` 來說, memberwise copy 很合理.  
> 對 `Buffer` 來說, memberwise copy 可能會 double free.

## C 可以做到, 但語意靠人記得

上面的問題在 C 裡不是不能解. 可以規定:

```c
Buffer buffer_clone(const Buffer* src);
```

使用時也遵守這個規則:

- 要複製 `Buffer` 的時候, 不要寫 `Buffer b = a`.
- 請寫 `Buffer b = buffer_clone(&a)`.

這樣可以解. 但問題是, 這個正確性不是從 `Buffer b = a` 這個語法本身看出來的, 而是靠:

- naming
- documentation
- team convention
- code review
- 使用者記得不要犯錯

如果今天讀這段 code 的人沒有完整上下文, 只是沿著既有型別繼續寫功能.

他看到:

```c
Buffer b = a;
```

光看語法本身, 他很難知道這行對 `Buffer` 來說是不安全的, 也不一定知道真正應該要 call:

```c
buffer_clone(&a)
```

然後 code 就炸了. 所以問題不是 C 完全做不到, 而是語意不在語言結構裡.

> **C 做得到, 但很多語意藏在 convention 裡.**

`Buffer b = a;` 這個語法看起來像 copy. 可是對 `Buffer` 來說, 真正合理的 copy 可能是 clone. 當語法和真正想表達的語意不一致時, 使用者就很容易踩坑.

## C++ 想把這些語意放進 type 裡

所以 C++ 不是只是把:

```c
buffer_create()
buffer_destroy()
```

換成 constructor / destructor 而已.

真正重要的是, 這個 type 到底:

- 能不能 copy?
- copy 之後誰 owns `ptr`?
- destroy 時誰負責 free?
- 能不能把 ownership 轉移出去?

這些問題不應該只藏在文件裡, 而是應該盡量寫進 type 自己的操作裡.

例如:

```cpp
class Buffer {
public:
    explicit Buffer(std::size_t size);
    ~Buffer();

private:
    char* ptr;
    std::size_t size;
};
```

如果 destructor 寫成:

```cpp
~Buffer() {
    delete[] ptr;
}
```

這其實就在說:

- `Buffer` owns `ptr`.
- `Buffer` 死掉時要 release `ptr`.

那下一個問題馬上出現:

> **如果 `Buffer` 可以 copy, 那 copy 之後誰 owns `ptr`?**

這就應該由 copy constructor 來定義. 如果要 deep copy, 就在 copy constructor 裡 allocate new memory. 如果根本不允許 duplicate, 就應該禁止 copy.

重點是:

> **copy / destroy / move 這些操作, 應該成為 type 語意的一部分.**

這就是我想說的:

> **Copy / Destroy become type-semantic**

## 有些 object 不應該被 copy

有些 type 本來就不應該有兩個 owner, 例如一個唯一擁有 heap block 的 `Buffer`, 或一個 file handle owner. 在 C 裡, 很難直接禁止使用者複製, 但 C++ 可以寫:

```cpp
Buffer(const Buffer&) = delete;
Buffer& operator=(const Buffer&) = delete;
```

這樣 compiler 就會直接擋下 copy. 也就是 type 自己明確說:

> **我不允許 duplicate.**

但這也帶出新的問題:

- 不能 copy 的 object, 要怎麼 return from function?
- 不能 copy 的 object, 要怎麼放進 container?
- 不能 copy 的 object, 要怎麼從一個地方交給另一個地方?

這個問題可以具體化成兩個很常見的場景:

```cpp
Buffer make_buffer() {
    Buffer b(1024);
    return b; // cannot copy
}

std::vector<Buffer> buffers; // vector cannot copy type Buffer
```

一旦 `Buffer` 明確禁止 copy, 它確實比較安全, 但原本習慣的 value-style 使用方式也會卡住. 這個 tension 才是 move 要進場的原因.

這就是 move 要出場的地方.

## auto_ptr: 把 ownership transfer 塞進 copy operation 的問題

在 C++11 以前, 語言還沒有正式的 move semantics. 但需求已經存在:

- 這個 object 不能 duplicate.
- 可是我想把 ownership 交出去.

於是有了 `std::auto_ptr`. 它的想法大概是:

> **既然不能 copy ownership, 那我在 copy constructor 裡把 ownership 轉移出去總可以吧?**

先補一個 technical note: `auto_ptr` 在 C++11 deprecated, C++17 removed. 這裡只把它當成歷史案例, 用來說明為什麼 ownership transfer 不該藏在 copy operation 裡. 現代 C++ 應該用 `std::unique_ptr`.

簡化後像這樣:

```cpp
template<class T>
class auto_ptr {
public:
    explicit auto_ptr(T* p = nullptr) : ptr(p) {}

    ~auto_ptr() {
        delete ptr;
    }

    auto_ptr(auto_ptr& other)
        : ptr(other.release()) {}

    T* release() {
        T* p = ptr;
        ptr = nullptr;
        return p;
    }

private:
    T* ptr = nullptr;
};
```

使用起來像 copy:

```cpp
std::auto_ptr<Buffer> a(new Buffer);
std::auto_ptr<Buffer> b = a; // looks like copy
```

但實際上不是 copy. 實際上是:

- `b` 接手 ownership.
- `a` 變成 `nullptr`.

也就是:

> **`auto_ptr` 把 ownership transfer 放進 copy constructor 裡表達.**

表面上看起來像 copy, 實際上 consumes the source. 一開始看起來好像可以: 我確實做到 ownership transfer 了, 而且還只用了 copy constructor, 沒有什麼花俏的新語法.

但問題出在 generic code. 例如把 `auto_ptr` 放進 STL algorithm:

```cpp
std::vector<std::auto_ptr<T>> v(...);
std::sort(v.begin(), v.end());
```

template 不知道 `auto_ptr` 的 copy constructor 會 transfer ownership. 對 generic algorithm 來說, 它只看到:

> **copy constructor**

所以它會把這個 operation 當 copy 來用. 但 `auto_ptr` 的 copy 會讓 source 失去 ownership. 結果就是:

- STL 以為它只是 copy.
- 實際上 source 被搬空.
- 後面如果 STL 繼續使用 source, 就可能出事.

這就是為什麼 ownership transfer 不應該藏在 copy 裡. `auto_ptr` 的問題, 本質上不是它完全做不到 ownership transfer. 它做得到. 問題是它把 transfer 塞進了 copy operation, 所以 generic code 看到的是 copy, 實際發生的卻是 consume source.

這代表語言少了一種明確表達 "我要轉移 ownership" 的方式.

## 缺少的明確表示法: xvalue

經過 `auto_ptr` 的例子, 我覺得這裡才是 `xvalue` 最自然出現的位置. 如果一個語言需要用 proxy trick 來表達常見需求, 那通常代表語言本身缺少一種明確表示法. 在這裡, 少掉的就是:

> **這個 expression 可以被當成 ownership transfer 的來源.**

也就是說, 這裡需要一種跟 copy 明確區分開來的表示法. 原本的 copy constructor 是:

```cpp
Buffer(const Buffer&);
```

新的 move constructor 則是另一條 overload:

```cpp
Buffer(Buffer&&);
```

但光有 `Buffer(Buffer&&)` 還不夠. compiler 還需要知道:

> **這個 expression 到底能不能 bind 到 `T&&`?**

如果全部都走 copy 那條路, 最後又會回到 `auto_ptr` 的問題. 所以 C++ 需要一種 expression category, 專門表示:

> **這個 expression 指向某個 object, 而且可以被當成 resource reuse / move source 的來源.**

這個 category 就是 `xvalue`. 用標準術語說, xvalue 是一種 glvalue, 表示它 denoting 的 object 可以讓 resource 被 reused. 在這篇的脈絡裡, 可以先把 `xvalue` 理解成:

> **xvalue = 可以作為 move source 的 expression.**

這裡的重點不是先背 value category 表, 而是看出它在這條脈絡裡的作用: 把 ownership transfer 從 copy operation 裡拆出來.

粗略看, 常見 expression 可以分成三類:

- **lvalue**: 像 `x`, `*ptr`, 回傳 `T&` 的 function. 它們有 identity, 通常不應該被默默搬走.
- **xvalue**: 像 `std::move(x)`, 回傳 `T&&` 的 function, `Point{}.y`. 它們可以作為 move source.
- **prvalue**: 像 `42`, `true`, `std::string{}`, 回傳 `T` 的 function. 它們比較像用來產生值的 expression.

這張分類表只是入口. 真正判斷時, 我比較喜歡再壓成兩個問題.

## Value category 的判斷模型

value category 可以先壓成三個欄位:

```text
1. Has specific memory location?
2. Moveable?
3. Identity protected?
```

先提醒: 這三欄不是標準術語, 而是這篇用來理解 move source 的模型. 標準定義會從 expression 是否是 glvalue, 是否 determines identity, 以及 xvalue 是否代表 resources can be reused 來描述.

實際判斷時可以看 `1 + 2`, 也可以看 `1 + 3`. 因為 `Moveable` 和 `Identity protected` 在這個模型裡剛好是反方向的理解.

我比較喜歡看 `Identity protected?`, 因為這比較接前面 ownership transfer 的問題. 重點不是問 "這東西看起來快死了嗎?", 而是問:

> **這個 expression 背後的 identity / ownership 需不需要被保護?**

第一個問題可以先看:

> **這個 expression 有沒有具體的 memory location?**

如果沒有, 它就是 prvalue. 因為它還不是一個有身份, 有位置, 可以被別人指到的 object.

如果有 memory location, 再看第二個問題:

> **這個 expression 的 identity 需要被保護嗎?**

用這個角度看:

- **lvalue**: 有 memory location, identity protected, 所以不能被默默 move.
- **xvalue**: 有 memory location, identity not protected, 所以可以作為 move source.
- **prvalue**: 在 C++17 之後不會急著 materialize 成獨立 temporary, 通常可以直接 initialize result object.

這裡容易卡住的是 prvalue. 如果 prvalue 沒有具體 object, 為什麼表裡又常說它是 moveable?

這裡的 `moveable` 不是標準術語, 也不是說它已經有一份 ownership 可以被轉走. 比較精準地說, prvalue 可以作為 `T&&` binding source. 包含 move constructor 在內, 很多接受 `T&&` 的介面都可以吃 prvalue.

換成 `Identity protected?` 會比較直覺:

- lvalue 有身份, 有位置, 所以不應該被隱式當成可以搬走的來源.
- xvalue 有身份, 有位置, 但這個 expression 已經明確表示可以作為 move source.
- prvalue 不需要先有一個獨立 temporary object, 自然也沒有 named object 那種 identity / ownership 需要保護.

這裡的 `protected` 不是 standard 的正式術語, 也不是說 compiler 會保證 `x` 的內容永遠不變. 它比較精準的意思是:

```text
一般寫出 named object expression x 時,
compiler 不會自動把它當成可以被 consume 的 move source.
```

也就是保護 `x` 不會在普通使用中不小心進入 `T&&` overload 或 move constructor, 進而讓 ownership / resource 被轉走.

所以這是一個教學模型, 但對理解 move 很有幫助. 尤其是 `std::move(x)`: `x` 本來是 lvalue, 因為它有名字, 它預設不會被當成 move source.

當我們寫:

```cpp
std::move(x)
```

意思不是 "現在立刻搬走 x"

意思是:

> **我明確允許 `x` 被當成 move source. 後面的 operation 可以從它轉移 ownership.**

所以 `std::move(x)` 是 xvalue.

## Point{}.y 為什麼是 xvalue?

有一個例子很容易卡住:

```cpp
Point{}.y
```

`Point{}` 本身是 prvalue. 在 C++17 的模型裡, prvalue 不會急著 materialize 成一個獨立 temporary. 它可以先理解成 "用來 initialize result object 的 expression".

如果只寫:

```cpp
Point{}
```

那它會停在 prvalue 這個狀態. 也就是說, 到這一步還不需要先假設已經有一個獨立的匿名 `Point` temporary object.

但當你寫:

```cpp
Point{}.y
```

要取 `.y`, member access 需要一個 glvalue object expression. 所以 `Point{}` 這個 prvalue 會先經過 temporary materialization, 產生一個 temporary `Point` object, 接著才取它的 data member.

materialize 後, 這個 temporary object 有 memory location, 對應前面的第一個 check:

```text
Has specific memory location? yes
```

而 `a.m` 這類 member access 在 `a` 是 rvalue 且 `m` 是 non-static data member of object type 時, 會是 xvalue. 對應到這裡, `Point{}` materialize 後仍然是可以作為 move source 的 temporary, 所以 `Point{}.y` 是 xvalue.

所以:

```cpp
Point{}.y
```

是 xvalue.

重點不是它看起來快死了. 重點是:

- `.y` 觸發 materialization.
- materialized temporary 的 member expression 可以作為 move source.
- `Point{}` 後面沒有接 `.y` 時, 它仍然是 prvalue.

## function return type 也會影響 value category

function call expression 的 value category 可以先用 return type 判斷:

```cpp
T f();    // f() 是 prvalue
T& f();   // f() 是 lvalue
T&& f();  // f() 是 xvalue
```

這會影響 `std::move`, 因為 `std::move` 大概就是回傳 `T&&`.

所以:

```cpp
std::move(x)
```

整個 expression 是 xvalue.

## Temporary Materialization Conversion

前面提到 xvalue 還有一種來源是 `TMC`, 也就是 Temporary Materialization Conversion.

這裡的起點還是 C++17 的 prvalue model:

> **prvalue 不會急著 materialize 成獨立 temporary. 它可以直接 initialize final destination, 也可以在需要時才 materialize.**

但 "不急著 materialize" 不等於永遠不 materialize. 有些情況下, compiler 不得不讓 prvalue materialize 成真的 temporary object.

下面就是一個不得不 materialize 的例子:

```cpp
struct T {
    T() { std::cout << "default\n"; }
    T(T&&) { std::cout << "move\n"; }
    T(const T&) { std::cout << "copy\n"; }
};

void f(T&& ref) {}

f(T{});
```

`T{}` 一開始是 prvalue. 但現在它要 bind 到:

```cpp
T&& ref
```

reference 需要真的 refer to 某個 object. 如果完全沒有 runtime object, `ref` 就沒有東西可以 reference.

所以 compiler 必須 materialize 這個 prvalue, 讓它變成一個 temporary object. 套回前面的判斷模型, 這個 temporary object 現在有具體 identity, 而且可以作為 `T&&` 的 binding source. 所以這一步可以先理解成:

```text
prvalue -> temporary materialization -> xvalue
```

這就是 Temporary Materialization Conversion.

這裡先用這個方式簡化理解:

> **prvalue 原本可以直接 initialize result object; 但如果需要被 reference 綁住, 就會 materialize 成 temporary object.**

## 有名字的 rvalue reference 仍然是 lvalue

另一個很容易混淆的點:

```cpp
T f(T&& rref) {
    // ... do something
    return rref;
}
```

`rref` 的 declaration type 是 `T&&`. 它看起來好像很 rvalue, 而且它可能真的是從 rvalue bind 進來的. 所以直覺上可能覺得:

- 它看起來快死了.
- 它應該是 rvalue.

但不是. expression `rref` 是 lvalue. 原因是:

- `rref` 有名字.
- named object expression 是 lvalue.

這也是 declaration type 和 value category 必須分開看的原因.

## Declaration type 不是 value category

這段可以把 declaration type 和 value category 的差異拉出來:

```cpp
T&& rr = std::move(x);
```

`rr` 的 declaration type 是:

```cpp
T&&
```

這代表:

- `rr` 是一個 rvalue reference 變數.
- 它的 binding source 必須是 xvalue 或 prvalue.

可以粗略整理成這樣:

```text
Reference   Binding source category
T&          lvalue
T&&         xvalue or prvalue
const T&    all categories are valid
```

所以這些例子會長這樣:

```cpp
T x; // x: lvalue

T& r1 = x;                         // OK, T& can bind to lvalue
T& r2 = T{};                       // FAIL, non-const T& cannot bind to prvalue
T& r3 = std::move(x);              // FAIL, non-const T& cannot bind to xvalue

T&& rr1 = T{};                     // OK, T&& can bind to prvalue
T&& rr2 = std::move(x);            // OK, T&& can bind to xvalue
T&& rr3 = x;                       // FAIL, T&& cannot bind to lvalue

const T& cr1 = x;                  // OK, const T& can bind to lvalue
const T& cr2 = T{};                // OK, const T& can bind to prvalue
const T& cr3 = std::move(x);       // OK, const T& can bind to xvalue
```

這些規則是在講 declaration 可以從哪些 source expression 綁進來.

但當你在 expression 裡寫:

```cpp
rr
```

這個 expression 的 type 是 `T`, value category 是 lvalue.

所以要分清楚:

```text
Declaration:
    Type: T&&

Expression:
    Type: T
    Value category: lvalue
```

這裡先只是在判斷 expression `rref` 本身的 value category. 也就是說, 在一般 expression context 裡:

```cpp
rref
```

仍然是 lvalue.

但 `return` statement 要另外小心. C++ 對 return operand 有 automatic move / move-eligible 的特殊規則. 尤其在 value-returning function 裡, 如果 return operand 是符合條件的 local variable 或 parameter, overload resolution 可能會先把它當成 rvalue 來選 move constructor. C++20 之後, rvalue reference parameter 也被納入這類 move-eligible case.

所以這段不能簡化成:

```text
return rref; 一定不會 move
```

比較安全的說法是:

```text
expression rref 本身是 lvalue.
return statement 另有 implicit move rule.
```

如果不在 return 的特殊規則裡, 而是一般 function call 想把 `rref` 當成 `T&&` 傳出去, 才需要明確寫:

```cpp
use(std::move(rref));
```

語意上它是在說:

> **我允許從 `rref` 轉移 resource.**

## 為什麼 named object 預設被保護?

為什麼 C++ 要設計成 named object expression 是 lvalue? 我覺得可以從兩個 option 看:

- **Option A**: named object 預設可以 move.
- **Option B**: named object 預設被保護.

如果選 Option A, 很多變數可能在不明顯的地方被搬空. 這會很像 `auto_ptr` 的問題:

- 看起來只是普通使用.
- 結果 ownership 被轉走.

所以 C++ 選比較保守的設計. named object 預設是 lvalue.

如果真的要 move, 就要明確寫:

```cpp
std::move(x)
```

也就是明確告訴 compiler:

> **我願意放棄對這個 object 的保護.**

## 練習: t, std::move(t), std::move(T{})

用這段當練習:

```cpp
void use(const T&) {}
void use(T&&) {}

void process_data(T&& t) {
    use(t);              // (A)
    use(std::move(t));   // (B)
    use(std::move(T{})); // (C)
}
```

- (A): `use(t);`: 

    `t` 有名字, 所以 expression `t` 是 lvalue. 因此會 call: `use(const T&)`

- (B):`use(std::move(t));`

    `std::move(t)` 把 `t` 這個 lvalue expression 轉成 xvalue. 因此會 bind 到: `use(T&&)`

- (C): `use(std::move(T{}));` 

    這個比較容易怪. `T{}` 是 prvalue. 那對一個 prvalue 做 `std::move` 會變什麼?

可以回想 `std::move` 大概是:

```cpp
template<class T>
std::remove_reference_t<T>&& move(T&& t);
```

`T{}` 要傳進去時, 會先因為 reference binding 觸發 Temporary Materialization Conversion, 也就是先 materialize 成 temporary object. 然後 `std::move` 回傳 `T&&`, 而 function returning `T&&` 的 expression 是 xvalue.

也可以換成更接近實作的說法: `std::move` 只是把 argument cast 成 `T&&` 再 return. 對 `T{}` 來說, 為了進入這個 `T&&` parameter, 它先被 materialize, 接著整個 `std::move(T{})` 因為回傳 `T&&` 而成為 xvalue.

所以: `std::move(T{})` 是 xvalue, 也會 bind 到: `use(T&&)`

這裡再次強調:

> **`std::move` 不真的 move.**
>
> 它只是讓 expression 變成 xvalue. 真正的 move 發生在後續的 move constructor 或 `T&&` overload.

## Move constructor 實際做什麼?

有了前面的 `T&&` binding 概念後, move constructor 就比較好讀. 一個簡化版 `Buffer` move constructor:

```cpp
Buffer(Buffer&& other)
    : ptr(other.ptr), size(other.size) {
    other.ptr = nullptr;
    other.size = 0;
}
```

move 前:

```text
a.ptr ----> heap block
b.ptr ----> nothing
```

move 後:

```text
b.ptr ----> heap block
a.ptr ----> empty / null / safe state
```

也就是:

- `b` 接手 `a` 原本的 heap block.
- `a` 不再擁有那塊 heap block.

這樣 destructor 執行時:

```text
b's destructor -> delete[] heap block
a's destructor -> delete[] nullptr
```

不會 double free. 注意, move 之後的 `a` 還是存在. 它不是消失了, 而是進入 moved-from state.

對 standard library type 來說, 常見保證是 moved-from object 仍然:

> **valid but unspecified**

也就是 object 還能被 destroy, assign, 或用在該 type 明確允許的操作上, 但原本的 value 不應該再被假設.

在這個 `Buffer` 例子裡, moved-from state 被設計成:

```text
a.ptr  -> nullptr
a.size -> 0
```

但自己寫 type 時, 不一定每個 type 都要把 moved-from state 設計成 `nullptr + 0`. 重點是這個 state 必須仍然能安全 destruct, 而且不破壞 ownership invariant.

## 什麼時候用 move?

move 適合在這種情況:

- 我不在乎 source object 原本的 value 了.
- 我只想把它背後的 resource ownership 交出去.

也就是:

```text
before:
    a.ptr ----> heap block
    b.ptr ----> nothing

after:
    b.ptr ----> heap block
    a.ptr ----> empty / null / safe state
```

所以 `std::move(a)` 可以理解成:

> **我允許後續 operation 從 `a` 轉移 ownership.**

不是:

> `std::move` 本身把 `a` 搬走.

## 回到最一開始: 為什麼 return T{} 沒有東西可以 move?

最後回到一開始的 code:

```cpp
T make() {
    return T{};
}

T y = make();
```

前面已經知道三件事:

1. move 是 ownership transfer.
2. `std::move` 不真的 move.
3. C++17 之後, prvalue 不會急著 materialize 成獨立 temporary, 而是可以直接 initialize final destination.

再看原本那個直覺:

- `T{}` 先 initialize 一個 temporary object.
- `make()` return 這個 temporary object.
- caller 再用它 move construct `y`.

哪裡怪怪的?

怪在第一步:

> **`T{}` 真的先 initialize 了一個獨立 temporary object 嗎?**

在這裡, 甚至沒有 reference 要綁住它.

`T{}` 本身是 prvalue, 而 `make()` 這個 function call expression 也是 prvalue. 在 C++17 的 prvalue model 下, 可以把它理解成:

- `T{}` 直接描述一個 `T` result object 要怎麼被 initialized.
- `make()` 的 result 也是一個 `T` prvalue.
- caller 用這個 prvalue 直接 initialize `y`.

所以從 caller 看:

```cpp
T y = make();
```

在這種情況下很接近:

```cpp
T y = T{};
```

除了 `y` 本身以外, 中間不需要有另一個獨立 temporary object 存在. 既然沒有獨立 source object, 自然也沒有東西可以 move.

這就是那句:

> **Sometimes there are nothing to move.**

我覺得這也是整個主題最有趣的地方. 一開始以為問題是:

> **compiler 怎麼把 copy / move 省掉?**

但最後更像是:

> **在現代 C++ 的 object model 裡, 這個 object 根本可以直接在最後的位置被 initialize.**

所以 function 邊界在這裡有點像是透明的. 概念上, result object 的 storage 已經是最後要放 `y` 的地方, prvalue 直接用來 initialize 那個 result object.

## 結尾: 從 C convention 到 C++ semantic lifting

如果只把這篇看成 move semantics, 其實會太小.

從一開始的 `Buffer b = a;` 到最後的 `return T{};`, 我真正想整理的是:

> **C++ 怎麼維護 object / resource 的語意?**

在 C 裡, 很多事情不是做不到. `Buffer` 可以自己寫 `buffer_create`, `buffer_destroy`, `buffer_clone`. lock 可以自己記得 unlock. file 可以自己記得 close.

問題是, 這些規則常常散在:

```text
naming
documentation
team convention
code review
programmer discipline
```

也就是說, 真正知道語意的人常常是寫 code 的人. 但 code 本身不一定說得清楚:

```text
這個 pointer 是 owner 還是 borrower?
這個 object 能不能 copy?
copy 是 shallow copy 還是 deep copy?
誰負責 release resource?
source 被 transfer 後還能不能用?
```

所以我覺得這條線可以叫做:

```text
C convention -> C++ semantic lifting
```

`semantic lifting` 的意思不是 C++ 神奇地消滅所有 bug, 而是把原本靠人記得的語意, 盡量提升到 type, object lifetime, type operation, library abstraction, language rule 裡.

套回這篇文章, 對應會長這樣:

```text
C helper convention:
    buffer_create / buffer_destroy

C++ lifetime operation:
    constructor / destructor / RAII

C shallow copy danger:
    Buffer b = a

C++ copy semantic:
    copy constructor / deleted copy

C ownership transfer convention:
    誰拿走 ptr 靠 API 文件說明

C++ transfer semantic:
    move constructor / std::move / xvalue

C out / temporary / return convention:
    呼叫者和被呼叫者約定 object 放哪

C++ return-by-value rule:
    prvalue / copy elision / direct initialization
```

這也是為什麼 RAII 會自然長出來.

如果一個 resource 需要成對操作:

```text
malloc / free
open / close
lock / unlock
create / destroy
```

那 C++ 會想把這個 pairing 綁到 object lifetime:

```text
constructor:
    acquire resource

destructor:
    release resource
```

這就是 RAII 的核心直覺:

> **resource lifetime follows object lifetime.**

但只做到 destructor 還不夠. 一旦 type owns resource, copy / move 也會立刻變成同一個 ownership 問題的一部分.

如果 object 可以 copy:

```text
copy 後兩邊都 owns resource 嗎?
copy 後是 shared ownership 嗎?
copy 後是 deep copy 嗎?
```

如果 object 不該 copy:

```text
copy 要不要 delete?
不能 copy 的 object 要怎麼放進 container?
不能 copy 的 object 要怎麼 return?
```

所以 RAII, copy constructor, deleted copy, move constructor, `std::move`, value category, return-by-value rules 不是分散的語法點. 它們都是同一個方向的不同層:

```text
把 resource / lifetime / ownership / transfer 的語意,
從 convention 提升到 C++ object model 裡.
```

最後回到這篇的三個核心操作:

- **copy**: `A` 和 `B` 都要一份語意上合理的 object.
- **move**: `A` 已經有 resource, 但 `A` 不需要了, `B` 接手 ownership.
- **prvalue / `return T{}`**: 有時候根本不用先有 `A`, result object 可以直接在 `B` 的位置被 initialize.

所以 `std::move` 不是單純讓程式變快. RVO 也不是單純 compiler trick.

更大的主題是:

> **C++ 想保留 C 的低階成本模型, 同時把更多語意放進 type operation 和 object lifetime 裡.**

這也是我覺得 C++ 難但有趣的地方. 它不是只問 "這段 memory 怎麼搬?", 而是一直在追問:

```text
這個 object 代表什麼?
它擁有什麼?
它能不能被複製?
它能不能被轉移?
它什麼時候開始 lifetime?
它什麼時候結束 lifetime?
```

也就是:

```text
type is not just layout.
```


## References:

1. [Back to Basics: Move Semantics - Ben Saks - CppCon 2025](https://www.youtube.com/watch?v=szU5b972F7E)
2. [Back to Basics: RAII and the Rule of Zero - Arthur O'Dwyer - CppCon 2019](https://www.youtube.com/watch?v=7Qgd9B1KuMQ)
3. [礦坑系列 ── 值類別 Value Categoraries](https://mes0903.github.io/Cpp-Miner/Miner_main/Value_Categories)