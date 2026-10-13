# Week 5 · Map V3 QA

本目录只保存第五周新增证据，不覆盖第四周 QA。

## 关键画面

- `before/01-original-full-map.png`：改前完整地图。
- `after/01-map-default-1920x1080.png`：改后完整地图。
- `after/02-port-hover-1920x1080.png`：Hover。
- `after/03-port-selected-1920x1080.png`：Selected。
- `after/04-wrong-destination-1920x1080.png`：错误目的地。
- `after/05-route-danger-1920x1080.png`：危险航线。
- `after/06-map-default-1366x768.png`：1366×768。
- `after/08-mailbag-envelope-1920x1080.png`：信封图标。
- `compare/03-title-before-after.png` 至 `07-wreck-before-after.png`：五区同视角对比。

## 重跑

先从项目根目录启动：

```powershell
node week4/qa/serve.mjs
```

另开终端：

```powershell
node qa/week5-map-v3/scripts/visual-qa.mjs
node qa/week5-map-v3/scripts/integration-qa.mjs
node qa/week5-map-v3/scripts/build-comparisons.mjs
```

测试使用实际 Microsoft Edge 与 Playwright。当前结果：视觉 15/15，主流程 21/21。
