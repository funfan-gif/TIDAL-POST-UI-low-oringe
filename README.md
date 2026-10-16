# 潮汐邮局 / Tidal Post — Week 5 交接分支

本目录是从第四周提交 `15e66c2` 建立的独立第五周开发副本，当前工作分支为 `week5/harbor-event-overhaul`。第四周目录没有被覆盖。当前交接分支基于 `af25838`，并保留 Week 2–4 的原型、设计记录和 QA 证据。

第五周地图版新增三处可选港口、地址匹配与航线安全双状态、港口 Hover / Selected / 错误印章、分层北航道、雾礁浅滩和沉船重绘。当前 Harbor Event 版进一步把第一页从 Dashboard 重构为“异界海鸥送达亡灵委托”的 6.6 秒剧情事件。地图记录见 `MAP_V3_REDESIGN.md`；第一页设计语言、组件、动效和 QA 见 `HARBOR_EVENT_REDESIGN.md` 与 `qa/harbor-event-v1/`。

保留原六页任务闭环与 Canvas 航行，并在同一状态机的第四页接入世界航海图 V3。邮袋首次保存后进入地图，仍播放 5.5 秒左→右单卷轴摊图；历史独立地图与第四周证据保留在 `week4/`。

本版包含完整任务流程、经年使用的纸张材质、分段非线性摊图、六页提交 PDF 和独立教师演示。Figma 链接保留为之前版本的设计记录。

## 新电脑先读

1. `AGENTS.md`：项目长期设计、代码和资产规则。
2. `UI-STYLE-GUIDE.md`：视觉系统，含蓝色信封插画风格。
3. `TEACHER-FEEDBACK.md`：现有记录中可核实的教师意见。
4. `DEVELOPMENT-PROGRESS.md`：真实实现状态、QA 证据和限制。
5. `NEXT-TASKS.md`：建议的后续任务。

## 本地启动

本分支的完整离线演示为 `效果查看/index.html`，可以直接双击。或在仓库根目录启动静态服务器：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

打开 <http://127.0.0.1:4173/效果查看/>。不需要安装前端依赖。也可使用 `node week4/qa/serve.mjs` 并打开 `http://127.0.0.1:4174/效果查看/`。

重跑浏览器 QA 时才需要 Playwright：在仓库根目录执行 `npm install --no-save playwright` 和 `npx playwright install chromium`。启动 `node week4/qa/serve.mjs` 后，另开终端运行 `node qa/harbor-event-v1/scripts/harbor-qa.mjs`、`node qa/harbor-event-v1/scripts/integration-qa.mjs`、`node qa/harbor-event-v1/scripts/continuous-qa.mjs`，或对应的 `qa/week5-map-v3/scripts/` 脚本。若需使用系统浏览器，可通过 `PLAYWRIGHT_EXECUTABLE_PATH` 指定浏览器程序路径。QA 会在 `qa/` 下生成截图和 JSON 报告。

**当前分支根目录没有 `index.html`。** 删除是本分支已有修改；旧入口可从 Git 历史查阅。当前可运行入口是上述独立演示。GitHub Pages 工作流仍发布仓库根目录，因此需在后续任务中补回模块化根入口或调整发布目录；不要静默恢复旧版入口并覆盖当前改动。

## 克隆交接分支

```powershell
git clone --single-branch --branch week5/harbor-event-overhaul https://github.com/funfan-gif/TIDAL-POST-UI-low-oringe.git Tidal-Post
cd Tidal-Post
```

## 三条真实 Flow

### Main Flow

旧邮局港“等待来信” → 异界海鸥送达信封 → 双潮邮戳确认 → 信纸展开 → 收下委托 → 接取并整理邮袋 → 选择“蓝色信封 ×1” → 保存邮袋 → 查看航海图 → 纸卷摊开 → 选择收件港并拖动 W1/W2 → 同时满足“邮址匹配 + 航线安全” → 确认出航 → 操控邮船进入灯塔圈 → 按 `E` 投递 → 领取 `+40` 邮票。

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

- `效果查看/index.html`：当前完整任务流程的单文件离线演示
- `tools/build-continuous-demo.py`：从已有历史提交重建内嵌式连续演示；需要 Python 3.9+ 和 Pillow。
- `qa/playwright-runtime.mjs`：QA 脚本共用的 Playwright 浏览器启动入口。
- `harbor-event.css / harbor-event.js`：第一页等待、海鸥、信封、开信和委托信状态机与 6.6 秒事件动效
- `styles.css`：V3 tokens、布局与响应式
- `motion.css`：过渡、失败反馈、奖励与 reduced-motion
- `app.js`：任务状态机、Main / Return / Failure Flow
- `route-map.css / route-map.js`：保留的 Week4 地图基础与历史控制器
- `week5-map.css / week5-map.js`：V3 地图美术覆盖、三港口交互、动态终点及地址/安全双状态
- `assets/week5/`：可编辑旧邮局港、异界海鸥、双潮邮戳、信封、浅滩 SVG 与透明水彩沉船 PNG
- `HARBOR_EVENT_REDESIGN.md`：第一页设计语言、符号、色彩、材质、组件、动效、参考转译与 Figma 节点
- `qa/harbor-event-v1/`：改前/改后、动画阶段、移动端、reduced-motion、Figma 画面与两份自动化报告
- `qa/harbor-event-v1/continuous-qa-report.json`：单文件离线演示的连续流程检查报告
- `qa/harbor-event-v1/source-before/index.html`：Harbor Event 改版前的根入口快照，保留原有六页语义 HTML
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
- `AGENTS.md`、`UI-STYLE-GUIDE.md`、`TEACHER-FEEDBACK.md`、`DEVELOPMENT-PROGRESS.md`、`NEXT-TASKS.md`：跨设备设计交接文档

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

Harbor Event 通过 20/20 项视觉与交互检查、21/21 项完整主流程检查：正常送达动画为 6601ms，reduced-motion 为 290ms；等待状态只有一个主操作，动画阶段可见，最终焦点正确，1920×1080 与 390×844 无溢出。接取后原 Mission、Mailbag、Map、Sailing、Result 闭环完整通过。报告见 `qa/harbor-event-v1/*.json`。

第五周 V3 通过 15/15 项视觉与交互检查、21/21 项完整主流程检查：三港口真实改变终点，错误邮址锁定确认，浅滩碰撞仍命中，1920×1080 与 1366×768 无溢出，reduced-motion 生效；TP-042 从接取、保存、摊图、确认、航行到投递、领奖和返回港口完整通过。报告见 `qa/week5-map-v3/*.json`。

单文件离线连续演示通过 17/17 项检查，报告为 `qa/harbor-event-v1/continuous-qa-report.json`。这些数字来自已有 QA 文件，本次交接没有重新运行测试。

以下为 Week 5 地图 V3 初次集成时的验证记录。第四周历史回归和提交证据保留在 `qa/` 与 `week4/`；Harbor Event 的独立记录位于 `qa/harbor-event-v1/`，未覆盖第四周文件。

测试从 Harbor 实际点击到 Mailbag 和 Map，再用键盘操控原航行引擎到投递圈并完成 Result。定格图使用原生动画时间线暂停取样；录像采用浏览器真实连续播放，没有跳过或手动寻帧。

本轮航点规划用于验证、确认、任务状态和结果中的规划航程。原航行引擎仍使用原 Canvas 路径与约 2.4 海里的 HUD 比例，W1/W2 尚未改变船舶物理路线。

## 在线参考

- GitHub Pages 默认分支的已发布版本：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/>（可能与本交接分支不同）
- 教师快速演示：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/teacher-demo.html>
- 第四周提交 PDF：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/week4/submission-board.pdf>
- 可编辑提交展示板：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/week4/submission-board.html>
- Figma 可编辑源文件：<https://www.figma.com/design/m3YZJuwn5JkYnFCPW8fh5W/>（Figma 原生文件未导出到本仓库）
