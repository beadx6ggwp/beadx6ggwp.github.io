---
title: "UI 到底是怎麼被畫出來的"
description: 整理UI如何從state, layout, command一路變成pixels

slug: how-ui-is-drawn-render-pipeline-note # web path
image: img/libiui-img.jpg
date: 2026-02-26T08:19:30+08:00
categories: [ComputerGraphics]
tags: [graphics]

license: # CC BY-NC-ND
hidden: false
# comments: true #註解掉為開啟
math:
draft: false
---

示意圖為libiui: https://sysprog21.github.io/libiui/

# UI 到底是怎麼被畫出來的

以前看到 UI, 比較容易先想到 framework 或 library, 例如 Web UI, Qt, GTK, Dear ImGui, Nuklear, microui, libiui. 但如果把問題放回 rendering system, UI 就不是停在 button, text field, menu, window 這些元件名稱上. 它最後要變成 pixels, 再進到螢幕上.

所以這篇先從一條比較通用的路徑開始:

```text
state
-> UI description
-> drawing intent
-> backend execution
-> framebuffer / render target / surface
-> display backend / compositor
-> screen
```

這條線裡有幾個問題會反覆出現. UI state 要怎麼變成 drawing intent? 文字要在哪裡量測和繪製? clip rect 是誰管理? draw command 要不要先收集? 最後的 pixels 是寫到自己的 framebuffer, 寫到某個 surface, 還是交給 compositor?

目前比較想把 UI 放進 render pipeline 裡看, 而不是只從 retained mode UI 和 immediate mode UI 的分類開始看. retained / immediate 是重要差異, 但它們比較像回答 "UI description 怎麼保存或重新產生". 這篇更想先追的是: UI 從 state 到 pixels, 中間經過哪些層.

## 一個 frame 裡的兩條來源

如果只看 3D rendering, 一個簡化的 pipeline 可能長這樣:

```text
scene / camera / material
-> render commands
-> vertex processing
-> primitive assembly
-> rasterization
-> depth / blend
-> framebuffer
-> present
```

3D 那邊的輸入通常不是 pixels, 而是 vertex data, index buffer, material, texture, shader state. 三角形會經過 transform, clipping, primitive assembly, rasterization, 後面才會進到 fragment color, depth test, blending, framebuffer write.

UI 也有自己的路徑:

```text
input / UI state
-> widget state
-> layout result
-> UI drawing intent
-> rect / text / image / clip
-> framebuffer / surface
-> present / composition
```

這兩條線最後都要變成 pixels, 但不一定永遠寫進同一塊 framebuffer. software renderer 裡, 3D 和 UI 可能真的都寫進同一個 color buffer. browser, mobile OS, desktop compositor 裡, application 更常是提交 layer, surface, texture, 或 compositor frame, 後面再由 compositor 合成.

所以 UI 不是單純 "最後多畫一層". 在小型 renderer 裡, 它可以是一段 overlay pass. 在更完整的系統裡, 它可能是一組 layer, surface, display list, texture tiles, 或 compositor inputs. 形式不同, 但都在處理 UI description 到 pixels 的轉換.

## UI 和 3D 怎麼在同一個 frame 合流

如果先用 software renderer 或 game HUD 來想, 3D scene 和 UI 合在一起的方式可以很直接:

```text
Frame begin
  clear color / depth buffer

  3D pass
    mesh vertices
    -> triangles
    -> rasterize triangles
    -> depth test
    -> write color framebuffer

  UI pass
    widgets / layout
    -> rects / text / images
    -> alpha blend over color framebuffer

  present framebuffer
Frame end
```

這個版本適合理解 in-app overlay, debug UI, editor panel, HUD. 3D pass 通常會使用 depth buffer, UI pass 則多半使用 screen-space coordinate, 直接畫在 scene color 上. UI pass 不一定要參與同一套 depth test, 因為它的問題比較像 2D layout, text, clip, blending.

GPU renderer 裡, UI 也常常會變成 GPU 可以處理的資料. rectangle 可以變成 quads, text 可以透過 font atlas 變成 textured quads, icon 或 image 也可以是 texture quad. 這時候 UI 不是繞過 rendering pipeline, 而是換成比較適合 2D 的 geometry 和 texture 資料, 再用另一個 render pass 或另一批 draw calls 疊到 scene 上.

```text
3D scene commands
  -> draw meshes into scene color

UI commands
  -> generate quads / text atlas draws
  -> draw with alpha blending

final color
  -> present / compositor
```

這個想法主要適合 game engine, editor UI, in-app HUD. 平台 UI system 和 browser UI 不一定是這種形狀. 它們中間通常還會有 layer tree, surface, render server, compositor 之類的結構.

## 三種比較常見的 path

如果把文章主線壓成幾種路徑, 目前可以先分成三種. 這不是完整分類, 比較像幫自己定位 UI 放進 pipeline 的方式.

第一種是 software framebuffer path. UI 最後直接被 rasterize / blend 到 renderer 自己管理的 framebuffer. 這種情境很適合學 software renderer, 因為 render target, framebuffer, display backend 的邊界比較容易看清楚.

```text
UI drawing intent
-> CPU raster / text draw / blend
-> owned framebuffer
-> display backend
```

第二種是 engine render pass path. UI 會被轉成 engine renderer 能處理的資料, 例如 quads, mesh, text atlas, texture draw. Unity, Unreal, game HUD, editor overlay, VR / world-space UI 都比較容易放到這條線上看.

```text
UI framework
-> layout / draw elements
-> quads / mesh / texture atlas
-> engine renderer
-> render target
```

第三種是 platform compositor path. UI 不一定直接寫進 application 自己的 framebuffer, 而是變成 layer, surface, display list, compositor frame, 後面再由 browser compositor, OS compositor, render server, display server 接手.

```text
UI tree / layer tree
-> paint records / surface / layer
-> compositor
-> final frame
```

這三種 path 會互相重疊. browser 可能同時有 software raster, GPU tiles, compositor frame. game engine UI 可能有 screen-space overlay, camera-space UI, world-space UI. mobile OS 可能有 app process, render server, GPU compositor. 這裡先不把它們整理成絕對分類, 只是用來幫文章定主軸.

## UI 前半段: state, layout, interaction

一開始可能會覺得 UI 就是呼叫一些 2D drawing API, 像是畫矩形, 畫文字, 畫圖片. 但真的放到 pipeline 裡, 會發現前面還有一大段.

button 會有 hover, pressed, disabled, focused. text field 會有 cursor, selection, composition, scroll offset. scroll view 會有 content size, viewport, clip, scroll position. modal 或 menu 會影響 input capture 和 z-order. 這些東西還沒進入 rasterization, 但已經會決定後面要畫什麼.

所以 UI drawing 前半段比較像 state machine + layout system, 後半段才比較像 2D renderer:

```text
input
-> interaction state
-> layout
-> visual style
-> drawing intent
-> raster / blend
```

這也是 UI 繪製比一開始想像中麻煩的地方. 它不是單純把幾個元件畫出來, 而是要把互動狀態, 幾何位置, 文字量測, clipping, draw order 一起整理成可以被 backend 執行的內容.

## UI description 是保存, 還是重新產生

retained UI 和 immediate UI 可以放在 UI description 的 lifetime 這一段看.

retained UI 比較像是在 UI update 和 drawing intent 中間, 保留一份比較長期存在的 representation, 可能是 widget tree, DOM tree, layout tree, paint tree. state 改變時, 系統可以沿著這些中間表示更新後面的結果:

```text
state changed
-> update UI representation
-> update layout / paint data
-> produce draw commands or paint records
```

Web UI 是一個很大的例子. application state 改變後, 可能經過 framework update, DOM mutation, style, layout, paint, raster, composite. React 的 render 比較接近 application state 到 UI description, browser 後面的 style, layout, paint, raster, composite 才比較接近把它一路推到 pixels.

看 Chromium RenderingNG 的文章時, 這條線會更明顯. 它把 browser rendering 拆成 animate, style, layout, pre-paint, scroll, paint, commit, layerize, raster, activate, aggregate, draw 這些 stage. 這比單純說 "browser render" 更能說明問題, 因為 UI 更新中間會產生很多不同層級的資料, 不只是一次性地把 DOM 畫到螢幕上.

```text
DOM / CSS / input
-> style
-> layout
-> pre-paint
-> paint records / display list
-> layerize
-> raster into tiles
-> compositor frame
-> aggregate
-> draw
```

RenderNG 是 Chromium 的 browser rendering 架構, 不能直接拿來當成所有 UI system 的通用 pipeline. 放在這篇裡, 它比較像一個大型 retained / compositor-based system 的參考. 比較重要的是它把 UI 更新拆成很多中間階段: 先算 layout, 再產生繪製資料, 接著 raster 成可合成的內容, 最後交給 compositor. 這樣就足夠支撐這篇要看的問題: UI 的中間結果會被保存在哪裡, 又在哪一層被轉成 pixels.

畫面更新也不是單一步驟. 文字內容改了, 可能要重新量文字和排版. 顏色改了, layout 可能不需要動. hover state 改了, 可能只影響一小塊 visual output. scroll offset 改了, 會牽涉 viewport, clip, content position, 以及後面要更新的區域.

immediate UI 則比較像每一 frame 用 code path 重新描述 UI:

```cpp
ui_begin_frame(input);

if (ui_button("Save")) {
    save_file();
}

ui_slider("Exposure", &exposure, 0.0f, 4.0f);

ui_end_frame();
```

這種寫法不一定保留長期存在的 widget tree, 但它仍然需要 runtime state. ID, layout cursor, active item, focused item, input capture, scroll state, text editing state, clip stack, text measurement cache, draw batch, 這些東西還是會出現. 所以 retained / immediate 不是 "有沒有狀態" 的差別, 比較像 UI description 怎麼被保存或重新產生. 最後它們還是會回到同一件事: 產生 drawing intent, 再交給 backend 畫出去.

## dirty update 放在後半段看

UI state 改變後, 不一定每次都要整張畫面重來. 這件事比較接近 pipeline 後半段:

```text
UI state changed
-> drawing intent changed
-> affected bounds changed
-> framebuffer region changed
-> display transfer changed
```

在 retained UI 裡, dirty 可能從 node 或 layout tree 開始傳. 在 immediate UI 裡, 也可能透過 command bounds, text cache, draw batch, ink bounds 之類的方式留下線索. 所以 dirty update 不完全等於 retained mode, 它比較像在問: 這次變動最後影響到哪些 pixels, 以及哪些 pixels 真的需要重新傳出去.

小 OLED UI 很適合看這件事:

```text
button / encoder
-> menu state
-> UI drawing
-> 1bpp framebuffer
-> OLED driver
-> I2C / SPI
-> screen
```

128x64 monochrome OLED 的 framebuffer 只有:

```text
128 * 64 / 8 = 1024 bytes
```

但它已經會碰到完整問題. pixel coordinate 和 memory layout 不一定一樣, 一個 byte 可能打包 8 個 pixels, controller 可能用 page addressing. 所以畫面改變時, 不只是重新畫某個 widget, 還要處理哪些 bytes 變了, 哪些 pages 要 flush, dirty rect 要不要對齊 page, I2C / SPI 傳輸成本在哪裡. 把這件事放大到 browser 或桌面系統, 就會變成 damage region, layer update, compositor update 這類問題.

## 幾種具體系統裡的 UI pipeline

Browser 可以放在 platform compositor path 裡看. DOM / CSS / input 會一路走到 style, layout, paint records, raster tiles, compositor frame. RenderingNG 的架構很適合作為 browser pipeline 的參考, 但它代表的是 Chromium 的實作脈絡, 不是所有 UI 系統的通用模型.

iOS 也適合放在 platform UI pipeline 的脈絡裡看. touch event 進入 app 後, UI 更新不只是 application 自己畫幾個 pixels. 中間會經過 UIView / CALayer changes, Core Animation transaction, render server, GPU compositing, framebuffer, display hardware.

```text
touch
-> app event / run loop
-> UIView / CALayer changes
-> CATransaction commit
-> render server
-> GPU compositing
-> framebuffer
-> display hardware
```

Game engine 則比較適合拿來看 engine render pass path. Unity 文件把 UI Toolkit, uGUI, IMGUI 放在同一個比較脈絡裡, 可以對應不同 UI description 和 runtime 用途. Unreal 則可以先用 UMG 和 Slate 當參考. 從這篇的角度看, 它們可以放在 UI description 到 engine renderer 之間的位置: widget tree / layout / invalidation / draw elements / render target.

```text
engine state / gameplay state
-> UI framework
-> layout / widget tree
-> draw elements / mesh / texture quads
-> engine renderer
-> scene color / render target / compositor
```

game engine UI 不一定只是 screen-space overlay. 它可能是 world-space UI, VR UI, editor tooling, debug panel, 或 engine editor 本身. 差異在於 UI 的 geometry, depth, input, hit-test, render target, composition 位置不同.

## backend contract, RHI, framebuffer

`libiui` 可以當成一個小型 backend contract 的參考. 它的 API 風格偏 immediate mode, 但放在這篇的脈絡裡, 更適合觀察的是 UI layer 怎麼接到 backend. UI layer 處理 input, context, layout, widget state. backend 則透過 renderer callback 提供基本 drawing capability, 例如畫 box, 畫 text, 設定 clip, 以及量測文字寬度.

```text
widget / layout / input
-> drawing intent
-> renderer callback
-> backend implementation
```

這個 boundary 還不是完整 RHI, 但已經把 UI frontend 和具體 platform 隔開了一層.

Skia 也可以放在這裡看, 只是它的位置和 libiui 不一樣. libiui 比較像 UI layer 加上一個很小的 renderer callback contract. Skia 則更像 2D graphics backend: 它提供 canvas, paint, path, image, surface 這類 drawing model, 用來承接更高層產生的繪製需求. 對這篇文章來說, Skia 適合拿來理解 drawing intent 到 pixels 之間的那一段, 也就是 text, path, image, blend, clip 這些 2D 繪製工作怎麼被整理成一個可跨平台的 graphics layer.

從這種小型 backend contract 往外看, 會接到更大的 render backend 抽象. 小型 UI backend 可能只需要畫 box, 畫 text, 設 clip. 比較完整的 renderer 則會開始處理 GPU resource, render pass, command submission, present 這些問題.

這時候問題不只是 "多包一層 API", 而是上層描述 drawing intent 或 render intent 時, 要怎麼避開直接依賴底層平台的 resource 和 lifetime. 所以 `SetPixel()` 和 `Clear()` 這種東西, 比較像 framebuffer access abstraction 或 render target writer. 如果要一路長到 RHI, 還要處理 resource lifetime, backend switching, present boundary 這類更大的邊界.

framebuffer 這邊也要放寬一點看. 在 software renderer 裡, 可以先用 owned framebuffer 當 reference point:

```text
renderer backend
-> framebuffer
-> display backend
-> screen
```

這條線可以先分開看 renderer 寫出的結果, 以及 display backend 怎麼把結果交出去. 但在現代桌面系統裡, application 畫完通常也不是直接到螢幕. 中間還會有 window surface, backing store, GPU texture, compositor layer, damage region, vsync, final composition. 所以 UI 在 render pipeline 裡的位置, 不能只想成 "畫在 framebuffer 上". 更外層還有 OS window system 和 compositor.

## 想法總結

整理到這裡, UI 繪製不像一開始想像的那麼單純. 它不是 "畫幾個按鈕和文字" 而已, 也不是選一個 retained UI 或 immediate UI library 就結束. 只要問 UI 最後怎麼變成 pixels, 問題就會一路往 render pipeline 裡延伸.

UI 從 input / state 開始, 經過 layout, interaction, drawing intent, backend execution, framebuffer / render target / surface, display backend, compositor, 最後才變成螢幕上的畫面. 不同系統的差異, 可能在於它們在哪裡保存中間結果, 怎麼產生 drawing intent, 怎麼接 backend, 最後怎麼交給 framebuffer / surface / compositor.

所以這篇整理到最後, 反而比較像是把 UI 放回 rendering system 裡看. UI 不是 rendering system 外面的附加功能, 它本身就橫跨了 state, layout, command, backend, framebuffer, present, compositor 這些層次. 後面如果繼續往下看, 應該會很自然接到 OS window system, compositor, display server, GPU surface, damage tracking, vsync, 以及更完整的 rendering backend 抽象.

## References

- Chrome Developers: [RenderingNG architecture](https://developer.chrome.com/docs/chromium/renderingng-architecture)
- Chrome Developers: [Key data structures in RenderingNG](https://developer.chrome.com/docs/chromium/renderingng-data-structures)
- Jacob Bartlett: [Touch to Pixels: UI Pipeline Internals on iOS](https://blog.jacobstechtavern.com/p/ui-pipeline-internals)
- Unity Manual: [UI Renderer](https://docs.unity3d.com/Manual/UIE-ui-renderer.html)
- Unity Manual: [Generate 2D visual content](https://docs.unity3d.com/Manual/UIE-generate-2d-visual-content.html)
- YawLighthouse: [UMG-Slate Compendium](https://github.com/YawLighthouse/UMG-Slate-Compendium)
- Unreal Engine Documentation: [Slate UI Framework](https://dev.epicgames.com/documentation/en-us/unreal-engine/slate-ui-framework-in-unreal-engine)
- Skia: [API Reference and Overview](https://skia.org/docs/user/api/)
- Skia: [The Raster Tragedy in Skia](https://skia.org/docs/dev/design/raster_tragedy/)
- Dear ImGui: [Dear ImGui repository](https://github.com/ocornut/imgui)
- libiui: [sysprog21/libiui](https://github.com/sysprog21/libiui)