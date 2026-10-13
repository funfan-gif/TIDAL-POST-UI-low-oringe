# 潮汐邮局 / Tidal Post — 第五周世界航海图 V3

本目录是从第四周提交 `15e66c2` 建立的独立第五周开发副本，当前分支为 `week5/map-v3-overhaul`。第四周目录没有被覆盖。

第五周新增三处可选港口、地址匹配与航线安全双状态、港口 Hover / Selected / 错误印章、分层北航道、雾礁浅滩和沉船重绘，以及独立蓝色信封图标。完整美术与参考记录见 `MAP_V3_REDESIGN.md`，浏览器证据见 `qa/week5-map-v3/`。

保留原六页任务闭环与 Canvas 航行，并在同一状态机的第四页接入世界航海图 V3。邮袋首次保存后进入地图，仍播放 5.5 秒左→右单卷轴摊图；历史独立地图与第四周证据保留在 `week4/`。

本版包含完整原型整合、经年使用的纸张材质、分段非线性摊图、六页提交 PDF 和独立教师演示。Figma 链接保留为之前版本的设计记录。

## 在线原型

GitHub Pages：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/>

教师快速演示：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/teacher-demo.html>

第四周提交 PDF：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/week4/submission-board.pdf>

可编辑提交展示板：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/week4/submission-board.html>

Figma 可编辑源文件：<https://www.figma.com/design/m3YZJuwn5JkYnFCPW8fh5W/>

## 本地启动

可以直接双击 `index.html`。建议用静态服务器运行：

```powershell
cd D:\游戏界面设计\第五周\tidal-post-week5-map-v3
node week4/qa/serve.mjs
```

打开 <http://127.0.0.1:4174/>。服务器从仓库根目录提供静态文件，不需要安装前端依赖。独立历史地图仍可通过 <http://127.0.0.1:4174/week4/> 查看。

## 三条真实 Flow

### Main Flow

港口“查看委托” → 接取并整理邮袋 → 选择“蓝色信封 ×1” → 保存邮袋 → 查看航海图 → 纸卷摊开 → 选择收件港并拖动 W1/W2 → 同时满足“邮址匹配 + 航线安全” → 确认出航 → 操控邮船进入灯塔圈 → 按 `E` 投递 → 领取 `+40` 邮票。

Map Reveal 是第四页内部的过渡状态。展开期间路线输入锁定，200ms 后可点击任意位置，或按 Enter / Space / Escape 跳过；完成后焦点回到 W1。确认出航同时要求已保存邮袋、航线有效、航线已确认。

### Return Flow

- 委托详情 → 返回港口
- 邮袋 → 返回委托 → 返回邮袋
- 地图 → 返回邮袋（保存状态与修改过的 W1/W2 保留）→ 再进地图仅 180ms 淡入
- 奖励领取后 → 返回港口

### Failure Flow

- 邮袋选择“海盐账单”并保存 → 任务不匹配，保存失败 → 改选蓝色信封恢复
- 拖动航点让线段穿过雾礁浅滩 → 危险斜线 / 虚线 / 原因 / 恢复位置提示 → 确认锁定 → 调整至北航道恢复

地图可选择蓝潮岛北侧码头、白塔补给站和东汐渔港。当前 TP-042 只有蓝潮岛北侧码头匹配；选错时只显示“邮址未匹配”，不揭示正确答案。切换港口或调整航点都会撤销旧确认状态。“继续接取任务”会清除本轮路线和摊图标记。

## 航行控制

- `W / S`：增加 / 减少油门
- `A / D`：左舵 / 右舵
- `E`：进入灯塔圈后投递
- `M`：展开 / 收起航行地图
- `Esc`：暂停 / 继续
- 鼠标或触控拖动：改变船首方向
- 页面内按钮提供完整的鼠标 / 触控替代操作

航行使用 `requestAnimationFrame` 和 delta-time 更新，运行时状态包含 `x / y / heading / speed / rudder / throttle / distance`。默认航线在持续加速时约 23–30 秒完成。

## 文件

- `index.html`：六页语义结构
- `styles.css`：V3 tokens、布局与响应式
- `motion.css`：过渡、失败反馈、奖励与 reduced-motion
- `app.js`：任务状态机、Main / Return / Failure Flow
- `route-map.css / route-map.js`：保留的 Week4 地图基础与历史控制器
- `week5-map.css / week5-map.js`：V3 地图美术覆盖、三港口交互、动态终点及地址/安全双状态
- `assets/week5/`：可编辑信封与浅滩 SVG、透明水彩沉船 PNG
- `MAP_V3_REDESIGN.md`：五区问题、参考落实、Skills 筛选、图层和测试记录
- `qa/week5-map-v3/`：改前/改后、Hover、Selected、错误目的地、危险路线、响应式截图及 Playwright 报告
- `map-reveal.css / map-reveal.js`：临时纸卷、遮罩、投影、原生动画时间线与输入恢复
- `paper-wear.css`、`week4/paper-wear.css`：完整原型与独立地图共享的旧损纸张样式
- `week4/assets/art-pass-04/`：四角掉纸、缺口、磨损污迹和折痕的原创 SVG
- `teacher-demo.html`：内嵌代码与素材的独立离线演示，从保存邮件走到开始航行，包含危险与恢复
- `week4/submission-board.html / .css / .pdf`：六页作业提交源文件和正式 PDF
- `week4/submission-assets/`：本版实际浏览器的保存、展开、安全、危险、确认、出航状态画面
- `sailing.js`：Canvas 航行控制与 HUD
- `assets/icons/`：Week 3 透明 PNG 主图标
- `qa/v3-final/screenshots/`：六页、三条 Flow 和响应式截图
- `qa/v3-final/qa-report.json`：自动化 QA 明细
- `qa/v3-figma-state.json`：Figma Frame、组件和 Prototype 节点台账
- `qa/map-reveal/`：本轮截图、两段真实浏览器 WebM 录像、回归报告与源码备份
- `qa/map-reveal-slow/`：5.5 秒慢速摊图的自然播放截图、17 项检查、最终画面像素对比和调整前备份
- `qa/week4-final/`：当前旧损与分段缓动版本的 59 项回归、17 项交付检查、PDF 渲染与源码备份
- `map-reveal-rationale.md`：时序、公开参考、接入方式、验证范围和限制

## QA 参数

- 单页截图：`?capture=01-harbor` 至 `?capture=06-result`
- 运行时状态：`?debug=1`

## 无障碍与降级

- 所有关键操作均可键盘访问并有可见焦点
- 失败、锁定、选中与完成状态均有文字，不只依赖颜色
- `prefers-reduced-motion: reduce` 会关闭非必要动画
- 摊图在 reduced-motion 下只保留 150ms 淡入；路线功能相同
- 原页小屏布局保持；V3 地图采用 1920×1080 参考舞台等比缩放，已验证 1366×768

## 本轮验证

第五周 V3 通过 15/15 项视觉与交互检查、21/21 项完整主流程检查：三港口真实改变终点，错误邮址锁定确认，浅滩碰撞仍命中，1920×1080 与 1366×768 无溢出，reduced-motion 生效；TP-042 从接取、保存、摊图、确认、航行到投递、领奖和返回港口完整通过。报告见 `qa/week5-map-v3/*.json`。

以下为初次集成的验证记录：

第四周原有回归与提交证据继续保留在 `qa/` 与 `week4/qa/`；第五周所有新文件、截图和报告均位于本目录及 `qa/week5-map-v3/`，未覆盖第四周文件。

测试从 Harbor 实际点击到 Mailbag 和 Map，再用键盘操控原航行引擎到投递圈并完成 Result。定格图使用原生动画时间线暂停取样；录像采用浏览器真实连续播放，没有跳过或手动寻帧。

本轮航点规划用于验证、确认、任务状态和结果中的规划航程。原航行引擎仍使用原 Canvas 路径与约 2.4 海里的 HUD 比例，W1/W2 尚未改变船舶物理路线。
