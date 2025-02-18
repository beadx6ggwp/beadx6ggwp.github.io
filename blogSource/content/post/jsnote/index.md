---
title: "js筆記"
description: 'JavaScript:Understanding the Weird Part'

slug: jsnote # web path
image: img/maxresdefault.jpg
date: 2025-02-18T17:17:33+08:00
categories: ['codingnote']
tags: ['JS']

license:  # CC BY-NC-ND
hidden: false
# comments: true #註解掉為開啟
math: 
draft: false
---

# JavaScript: Understanding the Weird Part

重點整理

資源:
- 你所不知道的js
- JavaScript：優良部分

找工作面試的時候被問到不少js內容 希望一次補好知識 再去碰框架

了解完畢後需要重新整理 目前有點混亂

## section 2 execution context & lexical environment


> [The ECMAScript “Executable Code and Execution Contexts” chapter explained](https://medium.com/@g.smellyshovel/the-ecmascript-executable-code-and-execution-contexts-chapter-explained-fa6e098e230f)

### ep6 語法解析、詞彙環境、執行環境
- syntax parser

- lexical environment
code在程式中的實際環境 像是scope Closure this 都跟這個相關
關注於它寫在哪、周圍環境是什麼

- execution context
也類似於os中的Context

js並不單單是直譯，為了優化，在剛吃到script時候會預先編譯部份，這也是hoisting的原因

### ep7 name/value & objects

- name/value pairs
在一個context情況下 一個name(變數)只會對應到唯一的value
白話:一段執行中的code 同樣名稱的變數 只有一個對應的value 不過這個value 可以是其他的name/value

- objects
最簡單的定義: name/value 的集合
![image](https://hackmd.io/_uploads/H1ZQUV9t1x.png)

### ep9 global environment & global object
不論何時 js的code永遠是在一個execution context中執行
其中base execution context 就是global execution context
而所謂全域就是指可以在程式中的任何地方使用它
這個v8提供的環境給予了global object 以及 this 而無論code何時執行 都在這個執行環境底下

```js
var a = 'hello world'

function b(){
    
}
```
若是這樣寫 其實在瀏覽器執行時 a和b都會被加入到global物件中
```js
> this.a
'hello world'
```
![image](https://hackmd.io/_uploads/ryQfA4RKye.png)

### ep10 Execution context creation and hoisting

在line 宣告並賦值之前 就log(a)
ex1:
```js
b();
console.log(a);

var a = 'hello world';
function b(){
    console.log('call b');
}

> call b
> undefined
```
但是當把 line 4的宣告完全移除
ex2:
```js
b();
console.log(a);

var a = 'hello world';
function b(){
    console.log('call b');
}

> call b
> Uncaught ReferenceError: a is not defined
```
雖然有些會說hoisting 可以看作把宣告往上移動 變成類似這樣
ex3:
```js
function b(){
    console.log('call b');
}
var a;

b();
console.log(a);

a = 'hello world'
```
然而 實際上並不能這樣看

> 個人認為本質是因為JS雖然是直編語言 但還是有編譯的環節
> 而hoisting就是在編譯環節 建立Execution Contexts 預先對需要使用的變數進行宣告與基本的分配 是一種編譯的優化手段
> [淺談 JavaScript 頭號難題 this：絕對不完整，但保證好懂](https://blog.huli.tw/2019/02/23/javascript-what-is-this/)
> [我知道你懂 hoisting，可是你了解到多深？](https://blog.huli.tw/2018/11/10/javascript-hoisting-and-tdz/)
> [ECMA2015 8 Executable Code and Execution Contexts](https://262.ecma-international.org/6.0/#sec-lexical-environments)
> [Learn JavaScript Closures with Code Examples](https://www.freecodecamp.org/news/lets-learn-javascript-closures-66feb44f6a44/)

執行環境的建立有兩大步驟:
Execution Context is Create(Creation Phase)
![image](https://hackmd.io/_uploads/SkFkErAt1x.png)

然而 variable跟funciton的處理卻不太一樣

在ex2中line2執行時 a確實有被分配到memory 但此時值尚未給定 所以給了一個預設值 叫做`undefined` 而這也是js中的一種特殊type
而任何variable的預設值 都是undefined

### ep11 js and undefined

```js
var a;
console.log(a);
```
有第一行 `var a` 會輸出 `undefined`
沒這一行 會輸出 `Uncaught ReferenceError:a is not defined`

這個差異在哪?
在於underfined 代表這variable已經擁有記憶體空間 但是其內容並沒有給定 比較像是一種"標記"
而從來沒宣告 代表在編譯階段 並不會分配給他記憶體空間 導致存取時出現ReferenceError

所以絕對不要手動的去指定變數為undefined

### ep12 the execution context code execution

Execution Context Runs(execution Phase)
![image](https://hackmd.io/_uploads/ByL4_rRK1g.png)

```js
function b(){
    console.log('call b');
}
b();
console.log(a);
var a = 'hello world';
console.log(a);

> call b
> underfined
> hello world
```

### ep13 single threaded, synchronous execution
js run code的一大特性 單緒 同步
> 但其實大多數程式都是這樣 只是在於js執行於其環境(瀏覽器、nodejs) 多緒的方式幾乎都是透過外部engine包裝thread pool後提供的接口 才會有這種js是單執行緒+同步的說法

### ep14 Function Invocation and The Exectuion Stack

Invocation: running a function

```js
function b(){
    
}
function a(){
    b();
}
a();
```
在執行時誰會最先被創造?
global execution context:
parser解析 編譯器解析 並創造執行環境 產生global object、this、window object
然後將這些function放入記憶體中(hoisting)

接著在執行到a時 建立新的Execution Context並放入execution stack中 分配獨立的memory space
並同樣會經歷Execution Context的兩個步驟
1. creation phase 
2. execution phase

此時執行b() 又會再創造一個執行環境 將其推入stack中 並且執行
然後再一層一層pop執行回去
![image](https://hackmd.io/_uploads/BkTo2H0tkx.png)

而code lexicalily的排列並不重要 因為function在hoisting的時候早就被實例化存在memory內
像是把a放到b的前面
```js
function a(){
    b();
    var c;
}
function b(){
    var d;
}
a();
var d;
```


### ep16 functions, context and variable environments

Variable environment:只是描述創造這個變數的位置
```js
function b(){
    var myVar;
    console.log(myVar);
}
function a(){
    var myVar = 2;
    console.log(myVar);
    b();
}
var myVar = 1;
console.log(myVar);
a();
console.log(myVar);

> 1
> 2
> undefined
> 1
```
那麼myVar的值到底為何?
重點在於 "每個execution context擁有自己的variable environment"

![image](https://hackmd.io/_uploads/BkBr180KJl.png)

而這個也和另一個名詞 Scope相關 表示我們可以在哪存取到哪些變數

在上面這案例中 雖然宣告了三次myVar 但都是在不同的execution context 所以他們都是不同的

而line 13 因為前面的call stack都消失了 所以現在所處的就是global execution context 所以myVar就是1

### ep16 scope chain

```js
function b(){
    console.log(myVar);
}
function a(){
    var myVar = 2;
    b();
}
var myVar = 1;
a();

> 1
```
![image](https://hackmd.io/_uploads/H1TheICFyl.png)

當要存取變數時 並不會只在當前execution context的variable environment找
記住 每一個execution context都有特殊的東西被創造
1. this
2. references of outer environment
每一個execution context都有一個references到它的外部環境
那這個外部環境是什麼?

在case of function b and function a 他們各自的外部環境就是global execution context
![image](https://hackmd.io/_uploads/BkWoZICtJe.png)

參考到哪些外部環境 取決於lexical environment

什麼意思?

如這段的code所示 function b在詞彙上(lexical) 是存在於global environment之上
表示b並不在a函數之中 在詞彙上 b和line 8的myVar屬於同樣的級別

在js中 很注重lexical environment 當你在某個execution context無法存取某個變數時 它會到outer reference去找
而每個function所指向的外部環境 都與函數詞彙上的位置有些不同

像是`function b`、`function a`、line8的`myVar`其實都是在window物件之中
```
window :{
    ...
    b:function(),
    a:function(),
    myVar:1
}

```

複習一次:
1. 這些execution context被創造的順序 和這些code 詞彙上的位置無關 而是這些execution context何時被創造出來 
2. 但當你invoke這些function時 js的parser會根據這段code的lexical位置來為execution context創造外部環境

而這一段serching外部環境的過程 稱為scope chain
- scope: 能使用這變數的地方
- chain: 這個執行環境 這段code的lexical位置 所對應的外部環境

那麼以上面那段code來說 如何改變b的外部參照?
```js
function a(){
    
    function b(){
        console.log(myVar);
    }
    
    var myVar = 2;
    b();
}
var myVar = 1;
a();
b();

> 2
> Uncaught ReferenceError:b is not defined
```
先看line12 此時沒辦法在global呼叫b 因為並不存在於這裡的variable environments 而是在a的裡面

![image](https://hackmd.io/_uploads/H17xYL0Yye.png)
現在這樣的狀態就是一層一層往外 所以如果把line 7拿掉 最就會參考到global的myVar 最終輸出1

從Create phase來看 誰創造了它?
outer reference會找到自己被創造的執行環境 在目前這情況 function b 在a實際執行之前 都不存在 一開始的global只會有myVar、a

當a實際執行時 一樣會建立execution context 這時候才創造了b
因為b是在a執行時創造的 所以b的outer reference就是a

### ep17 scope, es6, let
- execution context
- execution environment
- variable environment
- lexical environment
這些東西最終產生出了scope的概念: 變數可以被使用的區域

而在es6 引入了let 也引入了block scoping
```js
if (a>b){
    
    let c = true;
    
}
```
c一樣會有hoisting 設值為undefined 但是在它實際執行到那一行宣告之前 不能存取它

block 指的是大括號之中`{}` let只能在被宣告的區塊使用
所以在for中的let變數 其實在記憶體中都是不同的

### ep18 what about asynchronous callbacks?


asynchronous: 同一時間不只一個

![image](https://hackmd.io/_uploads/SyxXUAAKyg.png)

![image](https://hackmd.io/_uploads/BkALIRRtkg.png)

![image](https://hackmd.io/_uploads/SyyjUCRtkx.png)

**event queue的code 仍然是同步的 只有偵測事件這件事 是非同步**
```js
function waitThreeSeconds(){
    var ms = new Date().getTime() + 3000;
    while(new Date().getTime() < ms){}
    console.log('finish function');
}
function clickHandler(){
    console.log('click event')
}
document.addEventListener('click', clickHandler);

waitThreeSeconds();
console.log('finish execution');
```
如果在3秒內觸發點擊 那麼執行順序會如何?

```
> finish function
> finish execution
> click event
```
因為直到execution stack為空時 才會去看event queue
當event queue也空了 就會繼續看queue有沒有東西 這個持續檢查 稱為continuous check

## Section3 types and operator

### ep19 types and javascript

Dynamic typing: 在執行的時候才會決定如何操作

### ep20 primitive types

雖然不用自己宣告型別 但js有六種基本型別(primitive types)

primitive type是什麼意思?
代表它並不是物件 而是single value
- undefined : represents lack of existence 變數建立的初始值 應該保持由引擎給值 不該自己賦予
- null: 這才是可以自行操作的"空值" null 是「存在但沒有東西」，有種刻意用 null 來標記「沒東西」的感覺。
- boolean: True/False
- number: js中只有一種數值型別 稱為floating point number, double-precision 64-bit format IEEE 754-2019
- string: a sequence of character
- symbol: 除了字串以外唯一可以當作 object 的 key 的東西，而每一個 Symbol 的值都是獨一無二的

> [來數數 JavaScript 的所有資料型別](https://blog.huli.tw/2022/02/26/javascript-how-many-types/)

### ep21 operators
operator : 是一種特殊的函數
其中包含著隱式轉換

```js
var a = 3 + 4;
consoloe.log(a);
> 7
```
這裡js是如何知道 + 旁邊的3, 4是數值? 然後相加?
語法解析會自動處理
```js
function +(a,b){
    return // add the two #s (# mean number)
}
```
### ep22 operator precedence and associativity
運算子的優先性與相依性

operator precedence: 一行code不只一個運算子時 哪個運算子優先計算
associativity: 當運算子有同樣的優先級時 依照右/左相依性

```js
var a = 2, b = 3, c = 4;
a = b = c;

console.log(a);
console.log(b);
console.log(c);

> 4
> 4
> 4
因為 `=` 是 右相依 (right to left)
`=`本身會將左邊的值 設定為右邊 並回傳右邊的值
所以會先執行 `b=c` 設定b為4 並回傳4 再執行 `a=4`
```

> [operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_precedence)

### ep24 coercion 強制轉型

coercion: 轉換一個型別到另一個型別 動態型別
```js
var a = 'hello' + 'world';
console.log(a);
> hello world
```
此時跟上面的數值相加就不同了 +這個operator會自動判斷成字串串接

但如果兩個型別不同呢?
```js
var a = 1 + '2';
console.log(a);
> 12
```
可以看到 數字1 被轉換成了string 執行串接

### ep25 comparison operator

```js
console.log(1 < 2 < 3);
console.log(3 < 2 < 1);

> true
> true
```
為什麼???
首先 `<`的優先級一樣 所以看associativity 為left-to
-right
`3 < 2 return false` 但這時候就有問題了
下一個operator其實是在執行:
`false < 1` 變成 左參數:boolean,右參數:number
會嘗試轉換boolean成數字 Number(false)也就是0 此時
`0 < 1 return true`

所以回頭看line 1為何會正確?
`1 < 2 return true`
`true < 3` 其中Number(true)為1
`1 < 3 return true` 所以為true

但並不是每次的轉型都可以預期 像是
`Number(undefined) return NaN` Not a Number
NaN並不是純值 但可以當作是"想把某個東西轉成數值型別 但他不是數值 所以轉不了"
但是`Number(null) return 0` 這其實是語言設計的缺陷

所以這邊想講的就是 轉型結果 完全依賴於js如何解析 除非你了解所有規則 不然是很難知道

---
那只要在某些情況不要轉型 不就好了嗎? 檢查兩個東西是否相等
`==` Equality operator 但他也會做轉型
`3 == 3, return true`
`'3' == 3, return true`
`false == 0, return true`

`null == 0, return false` ??? Number(null)為0 但為什麼?
`null < 1, return true`

`"" == 0, return true`
`"" == false, return true`

這種轉換的特性 會導致程式執行容易不符合預期 要怎麼解決?
Strict Equality 這也是operator 但他並不會強制轉型
`'3'===3, false`

所以使用`==` 應該要是你預期要使用轉型的時候

> 這篇玩件就完整的解釋做了什麼[Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)

### ep27 existence and booleans 存在 和 布林
雖然不建議使用內建方法來轉換 但是作為測試還是可以使用

```js
Boolean(undefined)
> return false
Boolean(null)
> return false
Boolean("")
> return false
```
既然這些東西都會被轉換成false 那可以適當的使用這種特性

在`if()`中 會嘗試轉換成boolean
```js
var a;

if(a){
    console.log('something is there')
}
在creation phase of the execution context會把a設置為undefined
此時 只要a是undefined、null、"" 都不會進到這個if中
```
但這樣做也有問題 如果`a = 0` 並不代表不存在 但仍然會被轉形成false
所以 可能額外添加`if(a || a===0)`

### ep28 Default values

```js
function greet(name){
    console.log('hello' + name);
}
greet();
> hello undefined
```
此時 如果greet執行時沒有穿入參數? 在呼叫invoke階段會發生什麼?
- a new execution context is created
- 這個variable在函數內被創造 只是傳入值是在呼叫階段被設定 但是在一開始被設定為undefined

所以name會是undefined

但這裡有個問題 +operator 看到的是string跟undefined 會強制把這個undefined轉換成string 這可以預期(運算子operator、轉型coercion) 但不會是理想的行為

那樣怎麼樣給一個default給這個name?
```js
雖然ES6有新的做法 但這邊先以原本的方式講解
function greet(name){
    name = name || '<your name here>';
    console.log('hello' + name);
}
greet();
> hello undefined
```
記住 operator 只是會一種會回傳值的function 所以這個`||`會回傳什麼?
回傳可以被強制轉形成true的那一個參數 並優先回傳左到右的第一個被轉形成true的
```js
undefined || 'hello'
> 'hello'
null || 'hello'
> 'hello'
"" || 'hello'
> 'hello'
```

### ep29 framework aside: Default value
```html=
<script src="lib1.js"></script>
<script src="lib2.js"></script>
<script src="app.js"></script>
```
```js
var libraryName = "lib1"
```

```js
var libraryName = "lib2"
```

```js
consoloe.log(libraryName);
> lib2
```
這三個script標籤 並不會有三個新的execution context 只是把code分開而已

所以如果在lib2加入一個檢查
這個檢查 稱為 checking global namespace
```js
window.libraryName = window.libraryName || "lib2"
```
最終app.js
```js
> lib1
```


## section 4 object & function

### ep30 objtct & dot

在其他語言中 object跟function確實是不同的東西 但在js中 他們是非常related 甚至有些情況幾乎就是相同的

在ep7已經提過 object 就是一堆name/value pairs的collection
但這裡會以其他不同的觀點來看

在js中 object會如何存在memory?

![image](https://hackmd.io/_uploads/BJ0coX1c1x.png)

既然object是collection of name/value 那這個value 是什麼?
- Primitive "property" like Bollean, string, number, ...
- Object "property" 連結到另外一個object 這個連結 也是這object的屬性
- Function "method"  在object裡面的function 通稱為method 它也是function 但是和物件有所連結

所以Object的value主要有兩種 property 跟 method

```js
var person = new Obejct();

person['firstname'] = 'Tony'; 
// 在mem中產生內容為Tony的string 其key為firstname
// 這樣就能透過firstname來參考到這段string在mem中的位置
// 這operator稱為 Computer Member Access

person['lastname'] = 'Alicea'; 

var firstNameProperty = "firstname";
console.log(person);
console.log(person[firstNameProperty]);

console.log(person.firstname);
// dot 這operator 稱為 Member Acess

person.address = new Object();
// person物件中 再放一個address物件
person.address.street = "111 Main St.";
// dot 是 左相依(left-to-right)
// 先執行左邊 在person物件中 look fo 名為address的property或method 並在記憶體中找到它
// 第二個dot 就會根據剛剛找到的address物件 找名為street的property or method
// 在這情況無法找到 所以會自動建立這屬性 並賦予"..."這字串

> Object
> Tony

> Tony
```
雖然 dot跟中括號都可以存取物件property or method 但最好還是使用dot就好 除非真的需要動態存取 畢竟Computer Member Access的Computer並不是說假的 它的存取方式其實跟dot有些不同

### ep31 objects and object literals 物件與物件實體化

`{}` 當js執行到大括號時 會自動建立物件 幾乎等價於 `new Object();` 稱為物體實體化
```js
var Tony = {
    firstname: 'Tony',
    address:{ // 再建立另一個address的Object 連結到Tony
        street: "111 Main St." 
    }    
}
```

都是做一樣的事 建立物件到記憶體中 並用某中名稱(key)去存取它
![image](https://hackmd.io/_uploads/BybGQ4191l.png)

> [JavaScript Under The Hood 4 - Memory Storage](https://www.youtube.com/watch?v=Hci9Bb4_fkA)

### ep32 FrameWork Aside: Faking Namespaces

在多數語言中Namespace是variable和function的容器 通常是解決同樣命名的情況

在js 沒有這個namespace可以區隔 但是因為Object的特性 一樣可以達到

```js
var greet = 'hello';
var greet = 'hola';

console.log(greet);
> hola
```
如果這兩個greet是在不同的js被同時宣告呢? 第一個hello被覆蓋掉了
這時就會利用Object來當作容器 確保不會跟其他的js檔案、global產生衝突
```js
var english = {};
var spanish = {};
english.greet = 'hello';
spanish.greet = 'hello';
console.log(english.greet);
> hello
```
另一個情況
```js
english.greetings.greet = 'hello'
> Uncaught TypeError: Cannot set peoperty 'greet' of undefined
```
why? 因為dot是operator是左相依(left-to-right) `english.greetings`先被執行 但是`greetings` 變數既然宣告在這 那就會初始化為undefined
接著執行右邊的`undefined.greet` 但undefined根本不是object 所以沒辦法做這件事
必須先`english.greetings = {}`

如此 就能透過物件達到namespace的效果

但根源是什麼?

### ep33 json and object literals
javascript object notation與物件實體語法

早期web都是透過XML傳輸 但同個firstname要儲存兩次 這樣會浪費很多頻寬

```js
var objectLiteral = {
    firstname: 'Mary',
    isAProgrammer: true
}

<object>
    <firstname>Mary</firstname>
    <isAProgrammer>true</isAProgrammer>
</object>

JSON:
{
    "firstname": "Mary",
    "isAProgrammer": true
}
```
JSON本質就是string data 其結構有點像object literals
像是JSON的property都要包在`""`中

JSON是物件實體化語法的子集合 也就是JSON語法較為嚴格 只要能寫成JSON 那就能寫成物件實體化語法

**JSON本身並不是JS的一部分** 但是在傳輸上非常實用 所以現在有了內建的parser在這之間作轉換

```js
console.log(JSON.stringify(objectLiteral));

var jsonValue = JSON.parse( '{"firstname": "Mary", "isAProgrammer": true}');
console.log(jsonValue);
```

### ep34 functions are objects

First class function: 任何可以對其他型別 如object, string, numbers, boolean 也都可以對函數做

> [MDN - First-class Function](https://developer.mozilla.org/en-US/docs/Glossary/First-class_Function)

什麼意思?

可以賦予任意變數的值為function 也可以把function當作參數傳入其他function 也可以用實體語法立刻創造函數(create them on the fly)

那這個function object是怎樣?
一個特殊型態的物件 因為它擁有物件該有的 但是多了一些特性
既然是物件 代表function本身 可以有屬性和方法
![image](https://hackmd.io/_uploads/Byr2pU191x.png)


而他會有特殊屬性
- Name: js的function 並不一定要有名稱 can be anonymous
- code: 它本身也承載著實際寫的程式碼 也就是說 所寫的code 會成為函數物件的特殊屬性 而且特別的是 它是可呼叫的 invocable ()

```js
// 這段code 只是greet這個function object的特殊屬性
function greet() {
  console.log('Hello');
}

// 這裡新增了一個property到greet這個function物件
greet.language = 'english';

console.log(greet);
console.log(greet.language);

> function greet() {console.log('Hello');}
> english
```
如果執行它 `greet()` 就會去像前面一樣 去建立execution context
![image](https://hackmd.io/_uploads/SkChfPy9Jx.png)

**函數只是帶有特殊屬性的物件 使其成為程式碼的容器**


### ep35 function statements and function expressions
function陳述句與表示式

- expressions: a unit of code that results in a value
js中的任何expressions 最終 都會創造一個value 但這value並不一定要被存下來 只是說會產生一個值
```js
// a unit of code
// = is operator, function接受兩個參數 並回傳一個值
a = 3; 
> 3

// other expressions, 但這次只是單單的回傳3 並沒有把這結果存到哪裡
1 + 2
> 3
```

- statements
```js
var a;
if( a===3 ){
    
}

var b = if(a==3){ } // X
```
這個`a===3`是expressions 但if本身並沒有任何回傳值 只是statements 所以像line6那樣做並沒有作用

statements會做其他事 expressions則會有回傳值

而js中的function是object 存在function statements and function expressions

```js
// function statements 因對當他被執行 並不回傳任何值
// 但他還是會做特殊的事 在這裡global的執行環境 creation phase時會hoisting
// 所以可以在宣告、建立greet之前呼叫greet
greet();

function greet(){
    console.log('hi')
}

// function expressions
// 建立一個function物件 設定anonymousGreet這個變數指向這個物件的記憶體位置
// 這跟上面的差異就在 這個function沒有名稱 (也可以有名稱 但沒意義)
// 所這個function建立時 其實回傳了一個值 就是他的記憶體位置
var anonymousGreet = function(){
    console.log('hi')
}
anonymousGreet();
```

上面的`greet()` 是function statements因為一開始的hoist 所以在execution phase時 這一段本身並不會做任何事情

但下面的`var anonymousGreet = function()` 最一開始hoist的只是anonymousGreet 內容會是undefined 
只有當這段被執行到時 這段statements才會去生成function物件 並回傳這個物件 這就是function expressions 回傳一個值 而值就是這個新物件

```js
// 這行被移上來 在宣告、實體化之前呼叫 會如何?
anonymousGreet();

var anonymousGreet = function(){
    console.log('hi')
}

> Uncaught TypeError: undefined is not a function
```

所以 實際上會被hoisting的 是function statements 而不是function expressions

因為他只會hoist variable 並不包含物件 這function物件是直到被執行的當下 才被創造出來

![image](https://hackmd.io/_uploads/S14auw15Jg.png)

所以可以這樣
```js
function log(a){
    console.log(a);
}

log( function(){console.log('hi')} );

> function(){console.log('hi')}
```
此時會立即創造function物件(on the fly) 並傳入log中
First class function 可以傳入任何 object可以傳入的地方(畢竟創造後就是回傳這物件的所在) 這時只要加上()就可以執行 `a()`

這就是一級函數的概念 可以把函數像變數一樣傳到其他地方 這概念的延伸 就是functional programming

### ep36 by value vs by reference

> [深入探討 JavaScript 中的參數傳遞：call by value 還是 reference？](https://blog.huli.tw/2018/06/23/javascript-call-by-value-or-reference/)


```js
function changeA(a) { a.a=2; }
function changeB(b) { b=2; }
function changeC(c) { c={c:2}; }
var a = {a: 1};
var b = 1;
var c = {c: 1};
changeA(a);
changeB(b);
changeC(c);
console.log(a);
console.log(b);
console.log(c);

> {a: 2}
> 1
> {c: 1}
```
`changeC(c);` 時，雖然 c 是對象類型，但在函數內部重新賦值並不會改變原始對象。這是因為重新賦值只是在函數內部改變了局部變量 c' 的引用，並沒有改變原始對象的內容。
只是重新指了一個內部c'所指的位置 但並沒有真的動到原本的c
![image](https://hackmd.io/_uploads/HJH27d19yx.png)

js中 只要宣告變數都會產生這個變數本身的空間

但只有primitive types是新的對應值(直接存在該格記憶體)
```js
var a = 3;
var b = a;

a 0x01 3
b 0x04 3
```
```js
var a = "abc";
var b = a;

a 0x01 'a'
  0x02 'b'
  0x03 'c'
  0x04 '\0'

b 0x06 'a'
  0x07 'b'
  0x08 'c'
  0x09 '\0'
```
其他object 都只是更改指標的指向 雖然本質都是by value 但比較主流的說法會認為 所有物件都是by reference
```js
// 在heap的某處 生成這物件 並return其位置給a
var a = {name:3}; 
var b = a;
// 假設heap的位置在0x51,先不考慮物件本身怎麼存的
  0x51 {name:3} 
a 0x02 0x51
b 0x04 0x51
```

![image](https://hackmd.io/_uploads/B1L7md151e.png)

mutate : 改變某些東西 通常指物件的屬性更改
immutable : 不可改變

### ep37 objects, functions and this

複習: 當function呼叫時 會創造新的execution context 放入execution stack
但不要跟剛剛的function是物件搞混了 這裡指的是function物件的`code`這個特殊屬性

當execution context被建立 每個執行環境 都有自己的variable environments及outer environment
(lexical environment, scope chain 如果變數不在其variable environments 就會到scope chain去找)

而每當execution context被創造 執行的時候都會給一個特殊的東西 `this` 它會根據函數如何被呼叫 來決定它指向什麼物件 那麼到底指向誰呢?

![image](https://hackmd.io/_uploads/S1Ufjukq1e.png)

invoke a()時 第一件事是創造execution context 其中的一部分就是創造`this`
而`this`在a的執行環境會是什麼?
```js
function a(){
    console.log(this);
    this.newVar = 'hello';
}

var b = function(){
    console.log(this);
}
a(); // 執行a這function物件的code屬性
console.log(newVar); // 甚至不用使用this.newVar
b(); // 就算在執行階段創造 也一樣
> window
> window
```
所以單純的執行function `this`仍會指向global object
此時總共有三個執行環境 global、a、b 都有各自的`this` 但是他們都指向同個位置 global

那麼object method呢?
在obj裡面的primitive type稱為property, function稱為method
```js
var c = {
    name:'the object',
    log: function(){
        this.name = 'update object';
        console.log(this)
    }
}
c.log();

> {name: 'the object', log: ƒ}
```
在這時候this就是這物件了 why?

在看另外一個情況 在裡面再加一個function
猜 他仍然會指向c物件 因為這function在log這個function物件內 而log在c物件內
```js
var c = {
    name:'the object',
    log: function(){
        this.name = 'update object';
        console.log(this);
        
        var setname = function(newname){
            this.name = newname;
        }
        setname('update again! the c object');
        console.log(this);
    }
}
c.log();

> {name: 'update object', log: ƒ}
> {name: 'update object', log: ƒ}
```
line10呼叫後 c物件的name卻沒有被改變 反而是改到global object的window.name了

要怎麼樣才能確保 我用的this是對的? 在確保是this的地方宣告一個變數去存這個this的位置

在line10 setname裡面的`self.name` 這個self並沒有在function中被宣告 這時就會沿著scope chain往外找 看他的outer lexcial reference 從而找到log中的變數self
```js
var c = {
    name:'the object',
    log: function(){
        var self = this; // here
        
        self.name = 'update object';
        console.log(self);
        
        var setname = function(newname){
            self.name = newname;
        }
        setname('update again! the c object');
        console.log(self);
    }
}
c.log();

> {name: 'update object', log: ƒ}
> {name: 'update again! the c object', log: ƒ}
```

### ep38 arrays collections of anything

大多數靜態型別中 陣列都是一串相同type的東西

在js中 因為他是動態型別 能混合放置任何type(不過其實就兩大類primitive、object)
```js
// var arr = new Array();
var arr = [
    1, 
    false, 
    {
        name:'tony',
        address:'111 st.'
    },
    function(name){
        // 在這的是function expression
        var greeting = 'hello';
        console.log(greeting + name);
    },
    'hello'
];
console.log(arr);
arr[3](arr[2].name);
> [1, false, {…}, ƒ, 'hello']
> hellotony
```

### ep39 arguments and spread
js在執行function時自動設置好的

![image](https://hackmd.io/_uploads/SkWMOnl9Jx.png)
