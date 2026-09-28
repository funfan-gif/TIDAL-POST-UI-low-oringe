# V3 Final QA Report

日期：2026-09-28

## Figma

- 文件：`m3YZJuwn5JkYnFCPW8fh5W`
- 六个主 Frame 全部保留：
  - `8:2` 01 Harbor
  - `16:2` 02 Mission
  - `10:2` 03 Mailbag
  - `11:2` 04 Map
  - `12:2` 05 Sailing
  - `13:2` 06 Result
- V3 UI System：`61:2`
- 组件实例：六页共 77 个
- Prototype CTA reactions：10 条
- Flow 起点：Main / Return / Failure
- Variables：4 collections，52 tokens
- Styles：6 text styles，2 effect styles
- 截图：`qa/v3-figma-final/`

## HTML 自动化结果

`qa-report.json`：63 / 63 assertions 通过。

- Main Flow：通过
- Return Flow：通过
- Failure Flow：通过
- Canvas 航行真实位置更新：通过
- W/A/S/D/E/M/Esc：通过
- 奖励确认边界：通过
- reduced-motion：通过
- 1920×1080、1440×900、1366×768、390×844：通过
- Console errors：0
- Network failures：0

## 人工截图复核

- Harbor：通过
- Mission：通过
- Mailbag：通过
- Map：通过
- Sailing：通过
- Result：通过
- 移动端 Harbor：通过

## QA 中发现并修复

1. Figma Component Set variants 位置重叠 → 改为横向 Auto Layout。
2. Figma 主图标实例使用 resize 导致裁切 → 改为等比 rescale。
3. Figma Result 奖励侧栏溢出 → 压缩 spacing 与组件高度。
4. Figma Result 插画重复缩放遮挡标题 → 替换为全新组件实例。
5. 浏览器缓存复用改写前脚本 → CSS/JS 加入 V3 版本参数，QA 禁用缓存。
6. 移动端 Harbor 双列任务卡裁切 → 700px 以下改为纵向布局与全宽 CTA。

## 仍存在的限制

- Figma 的 Sailing 是静态 HUD + Prototype 点击演示；真实物理与控制器在 HTML Canvas 中。
- 原型状态只保存在当前页面会话，刷新后重置；这是课程原型的设计边界。
- 未加入音频素材，避免未经课程确认的自动播放与版权问题。
