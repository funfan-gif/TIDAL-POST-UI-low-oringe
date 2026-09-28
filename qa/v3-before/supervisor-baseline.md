# 潮汐邮局 V3 · Supervisor Baseline Audit

审查范围：当前公开版的六个主要页面，1920 × 1080。证据为本目录中本轮重新捕获的 `01-harbor.png` 至 `06-result.png`。

## 总体判断

V2 的任务、返回、失败恢复与奖励确认逻辑清楚，能够继续作为 V3 的结构骨架。主要问题不是可用性失效，而是视觉语言仍像课程线框：文字密度偏高、交互与说明的视觉权重接近、项目专属图标缺席、地图和航行缺少游戏世界对象，且默认界面暴露了流程编号和版本标签。

## KEEP

- 六屏信息架构与 Main / Return / Failure / Reward 四条状态逻辑。
- `missionAccepted`、`selectedItem`、`mailbagSaved`、`selectedIsland`、`rewardClaimed`、`completed`、`missionReturnTarget`、`activeCategory`。
- 委托信纸隐喻、邮袋三栏结构、地图右侧航线判断、结果页奖励未领取/已领取边界。
- 明确的按钮禁用、失败原因、恢复动作、键盘焦点和 reduced-motion 基础。

## REDUCE

- 01 港口：删除大段“今日航行记录”说明，压缩为委托 / 邮袋 / 航线三态旅程条。
- 02 委托：右侧条件不再复述完整句子，只保留图标、短标签和完成状态。
- 03 邮袋：弱化 B-01 / S-08 编号，删去重复解释；让物件本身成为识别主体。
- 04 地图：减少右侧说明文案，让潮位、距离、锁与断航线直接表达状态。
- 05 航行：移除静态“保持航向”说明和直达结果按钮。
- 06 结果：把说明句缩短为奖励领取状态；让“投递成功”和 `+40` 主导。

## REPLACE

- 全站灰阶 wireframe 色彩替换为 Week 3 的 Paper / Deep Sea Ink / Sea Glass / Coral Stamp / Postage Gold。
- 文本首字母编号和纯椭圆地图按钮替换为彩色邮务图标、岛屿轮廓、目的地针、锁和断航线。
- 邮袋字母编号占位符替换为蓝色信封与明信片插画。
- 航行静态示意替换为 Canvas runtime + DOM HUD；只有满足距离、速度和方向条件并按 E 才能进入结果页。
- 默认六步 footer 与版本标识改为 `?debug=1` 才显示。

## ADD

- Week 3 六枚彩色核心图标：Back / Commission / Mailbag / Map / Sail / Deliver。
- 轻量功能 glyph：Stamp、Reward、Tide、Distance、Time、Warning、Lock、Saved、Draft、Envelope、Compass、Speed、Rudder。
- 可复用按钮、状态 chip、邮务卡、路线/岛屿 marker、HUD chip、keycap 和奖励章样式。
- 行为动效：按钮按压、物件/岛屿选择、保存、路线绘制、警告、页面转场、蜡封与奖励计数。
- 航行键盘与屏幕按钮、暂停帮助、迷你地图、可读的对准/减速/靠岸提示。

## 六屏审查

1. Harbor — 健康度：中。主 CTA 可见，但卡片空白过多，路径说明抢空间，缺少邮务物件识别。
2. Mission — 健康度：中。信纸隐喻成立，右栏与左栏重复，主次按钮偏像网页表单。
3. Mailbag — 健康度：中上。结构最成熟，但物件以编号替代插画，草稿/保存仍以文字为主。
4. Map — 健康度：中。失败恢复清楚；岛屿是椭圆按钮，状态表现像流程图而非群岛游戏。
5. Sailing — 健康度：不通过。没有操控、惯性、靠岸条件或真实运行状态，按钮直接跳结果。
6. Result — 健康度：中。奖励边界正确；成功感与世界观反馈不足，空白过大。

## V3 视觉计划

### Tokens

- Paper `#F4EFE5`：主背景、信纸、票据。
- Deep Sea Ink `#294752`：正文、结构轮廓、可读信息。
- Sea Glass `#3B7474`：主操作、已选、可航行。
- Coral Stamp `#D97A66`：警告、草稿、路线强调、邮戳。
- Postage Gold `#D6A64C`：奖励、完成、关键数值。
- Sea Mist `#DCEAE5`：地图与航行的低对比海面辅助层。

字体使用现有中文系统字体栈，以 Microsoft YaHei 为运行基线；标题使用更厚重字重和紧凑行距，正文控制在 80 字符以内。避免单独全大写眉题成为主要装饰。

### Layout

```text
HARBOR / MISSION / RESULT
┌─────────────────────────────────────────────────────────────┐
│ brand + contextual back/status                     stamps    │
├─────────────────────────────────────────────────────────────┤
│ illustrated task object │ decisive information / primary CTA│
│ compact journey/status  │ secondary details                 │
└─────────────────────────────────────────────────────────────┘

MAILBAG / MAP
┌─────────────────────────────────────────────────────────────┐
│ icon categories │ interactive world/list │ decision panel    │
└─────────────────────────────────────────────────────────────┘

SAILING
┌─────────────────────────────────────────────────────────────┐
│ mission       heading/compass                    tide+distance│
│                         CANVAS WORLD                         │
│ speed                  rudder                  contextual hint│
│                    keycaps / pointer controls                │
└─────────────────────────────────────────────────────────────┘
```

### Uniqueness check

方案不采用 SaaS 等尺寸卡片、黑底霓虹或报纸式细线排版。视觉锚点来自本项目已有的水彩邮务物件、票据缺口、蜡封、岛屿航线和邮船；装饰仅在能表达委托、状态、路线或奖励时出现。

## 证据限制

截图可以确认层级、布局、视觉状态与大部分交互暗示，但不能单独证明完整键盘访问、动效节奏或航行手感；这些必须在实现后通过运行测试确认。
