# Map Reveal + Full Prototype Integration

## 方案与任务叙事

使用左→右单卷轴：旧邮局港先落在桌面上，再揭开雾礁浅滩，最后揭开蓝潮岛。纸卷采用浅暖纸色与海玻璃色阴影，避免与现有水彩邮务地图产生材料冲突。独立厚卷边有上、下椭圆端面、内卷明暗、细折痕和桌面投影；这些对象只存在于过渡阶段。

公开参考：

- [Sea of Thieves 官方 2.4.0 更新](https://www.seaofthieves.com/release-notes/2.4.0)：地图包可以在船长桌上被取用、携带或交给其他玩家。由此借鉴“地图是世界里的物件”的原则；未将该文档当成特定摊图动画的分析证据。
- [MDN clip-path](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/clip-path)：裁剪可见区域，保持底下地图和路线几何的真实比例。
- [MDN transform-origin](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-origin) 与 [perspective](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/perspective)：用于卷边极轻的转动和厚度表现。
- [MDN Animation](https://developer.mozilla.org/en-US/docs/Web/API/Animation)：统一原生动画时间线、完成回调和取消后清理。
- 阅读了 OpenAI 官方 [game-ui-frontend](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-ui-frontend/SKILL.md) / [game-playtest](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-playtest/SKILL.md)，采用地图任务优先、输入反馈、真实浏览器游玩与截图核验的工作方式。本机 `frontend-design` 作为材质与运动辅助。

没有复制商业 UI、动画代码或素材。

## 时间线

根据“铺开的效果不明显、时间太短”的反馈，将原 1720ms 调整为 5500ms，主展开段从 900ms 延长到 4500ms。随后依据“长期使用痕迹、插值要有变化”的要求，将单一缓动改为多段 cubic-bezier：起卷加速，在旧折痕处放慢，再释放纸张重量，最后缓缓停稳。地图裁剪和实体卷边使用同一组关键帧，保持同步。

新增 `paper-wear.css` 和两份原创 SVG：亮度遮罩产生真实透明的四角掉纸、边缘缺口和少量纸孔；独立材质层显示角部磨损、盐水污迹、纵向及横向折痕。旧损在展开期间和最终海图上都保留。没有改变地物碰撞或航点几何。

完整播放的原生时间线为 5500ms：

| 时间 | 发生的事 |
| --- | --- |
| 0–150ms | 前一页的短暂视觉副本降低亮度、透明度；桌面接上，无黑屏 |
| 150–500ms | 已卷好的海图从稍低的位置落入，邮务封条轻轻脱开 |
| 500–5000ms | 裁剪边界和卷筒缓慢向右移动，地图本身比例不变 |
| 5000–5200ms | 卷边消隐、投影变窄，纸张铺平 |
| 5050–5230ms | 路线、航点、起点和目的地标记淡入 |
| 5150–5330ms | 地名、坐标、航向标签与操作提示淡入 |
| 5250–5480ms | Ledger 淡入并移动 16px；沿用原纸张角度 |
| 5500ms | 清理临时对象和动画，开放交互，焦点回到 W1 |

动画只改变 clip-path、transform、opacity 和少量临时投影；没有每帧修改 width/left，也没有新增循环。独立卷边的轻微 rotateY 有 perspective，实际海图没有横向缩放。动画完成后恢复 Art Pass 的原多边形纸边裁剪，移除临时 will-change。

200ms 后的鼠标点击、Enter、Space、Escape 调用同一个完成函数，清理状态而不是停在中途。完整动画只用于每轮任务第一次成功保存后的正式进入。返回使用 180ms 淡入；reduced-motion 使用 150ms 淡入，且不创建移动纸卷。

## 接入同一原型

Root `index.html` 的第四个 `.screen` 替换为当前 `week4/index.html` 的真实海图 DOM。引用最新 Art Pass 03 素材，并保留碰撞代理、危险层、路线、航点、Ledger 和确认弹窗。无 iframe，无跳转独立 Week4 页面。

`route-map.css` 将三份当前 Week4 样式限制在 `.integrated-map`；`route-map.js` 将原有路线算法封装为可复用组件。`map-reveal.js` 独立管理过渡。预加载桌面、记录纸和纸质按钮框，避免首次进入时贴图晚到。

六页状态流保持 Harbor → Mission → Mailbag → Map → Sailing → Result。Map 页内部为 MAILBAG_SAVED → MAP_REVEALING → MAP_READY → MAP_CONFIRMED。Root `routePlan` 保存起点、W1、W2、固定目的地、总距离、各段 bearing、有效性和确认状态。出航需要三个条件同时成立：邮袋已保存、路线有效、路线已确认。

任务邮件一直是蓝色信封 ×1，固定目的地一直是蓝潮岛北侧码头。确认后的任何路线调整都会撤销出航许可。Map→Mailbag→Map 保留邮袋与路线草稿；“继续接取任务”才会清空本轮路线和摊图标记。

Session storage：Root 为 `tidalPost.prototype.v4`；集成路线为 `tidalPost.prototype.route.v1`；确认后的规划沿用 `tidalPost.plannedRoute`。独立历史地图的 `tidalPost.week4.route.v1` 保留。

## 真实浏览器验证

### 当前提交版：旧损纸张、分段缓动与六页 PDF

`qa/week4-final/` 保留本轮修改前源码及新证据。完整流程 59/59；自然展开、离线教师自动演示、提交材料检查 17/17。实际播放维持 5–6 秒，卷边和裁剪一致；危险判断、跳过、返回、reduced-motion 和真实航行投递均正常。独立地图与集成地图使用同一新版材质，最终画面比较为 0 像素差异。

`week4/submission-board.html` 已改为六页打印排版，PDF 包含保存邮件、展开海图、核心地图、危险状态、确认许可和开始航行。逐页渲染检查后交付 `week4/submission-board.pdf`。`teacher-demo.html` 内嵌原型代码和经显示尺寸优化的素材副本，可单独离线运行，自动演示走真实功能；原始 PNG 没有修改。

本轮按明确要求修改 `week4/index.html` 入口、提交板 HTML/CSS 及对应 README，其余 157 个原保护文件保持不变。之前的 1.72 秒与单曲线 5.5 秒证据目录保留为历史记录。

### 5.5 秒慢速调整

新增证据保存在 `qa/map-reveal-slow/`，之前的 `qa/map-reveal/` 保留为 1.72 秒版本的历史记录。新检查在真实浏览器自然播放，不暂停、跳转或改变时间线速度：1.5 秒约展开 11%，3 秒约 59%，4.5 秒约 97%；完整播放处于 5–6 秒范围。17/17 项通过，涵盖卷边与裁剪同步、交互锁定、完成清理、四种跳过、返回淡入和 reduced-motion。最终地图与独立 Week4 参考图仍为 0 像素差异，161 个保护文件保持不变。

### 初次集成验证记录

- 原功能回归脚本原样复制到新 QA 目录：36/36。
- 最新 Art Pass 03 检查重跑：16/16。仅迁移输出和历史 HTML 路径；保护清单使用本轮 161 文件基线，因为 Root index/app/README 是本轮要求修改的文件。原 Week4、历史 QA、素材、原航行和基础样式仍全部冻结。
- 集成与输入测试：59/59，包括从 Harbor 的 Main / Return / Failure Flow、错误邮件恢复、危险航线禁用、四种跳过、自然完成、键盘航点、刷新保留、重新确认、任务重置、reduced-motion、两种桌面视口。
- 使用原引擎真实键盘航行进入灯塔圈，按 E 进入 Result；+40 邮票仅到账一次。没有把船位置设置到终点，也没有直接调用抵达回调。
- 所有 161 保护文件 SHA-256 相同。
- 同一 Edge、1920×1080、默认安全路线、移走鼠标并取消焦点后的最终地图：与独立 Week4 **0 像素差异**。视口矩阵、碰撞代理、viewBox 和原纸边裁剪也相同。
- 无运行时错误、无缺失本地资源。
- `map-reveal-flow.webm` 和 `mailbag-to-sailing.webm` 为真实连续浏览器截图帧，由浏览器 MediaRecorder 编码；视频没有跳过或手动调动画时间线。WebM 时长信息已补齐以便定位播放，编码画面不变。关键帧 PNG 使用原生时间线暂停，以准确取 35% / 70% 展开状态。

报告、截图、视频与可复跑脚本均在 `qa/map-reveal/`。完整原型地址为 `http://127.0.0.1:4174/`。

## 真实限制

W1/W2 当前决定规划结果与出航许可，尚未改动原 sailing.js 的物理路径。Sailing HUD 距离仍按原 2.4nm 参考航程变化，Result 明确显示“规划航程”。其余五页保留原 Mid-Fi 视觉，本轮没有统一做 Art Pass。地图仍是桌面参考舞台等比缩放，小手机上的字体与命中面积并未单独设计。旧版录像采用浏览器截图采样和原生编码，会漏掉部分快速中间帧，不能用于判断实际动效帧率。当前版本通过自然播放截图与离线教师演示核验动效，PDF 保存静态关键帧。
