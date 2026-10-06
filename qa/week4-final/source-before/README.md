# 潮汐邮局 / Tidal Post — 完整课程原型

保留原六页任务闭环与 Canvas 航行，将最新 Week4 Art Pass 03 航海图作为同一状态机的第四页。邮袋首次保存后进入地图，会播放 5.5 秒的左→右单卷轴摊图，其中持续展开为 4.5 秒；历史独立地图与交付证据保留在 `week4/`。

本轮完成 Map Reveal + Full Prototype Integration，仅在本地完成和验证。下方既有 GitHub Pages / Figma 链接是上一版发布记录，尚未包含本轮集成。

## 在线原型

GitHub Pages：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/>

Figma 可编辑源文件：<https://www.figma.com/design/m3YZJuwn5JkYnFCPW8fh5W/>

## 本地启动

可以直接双击 `index.html`。建议用静态服务器运行：

```powershell
cd D:\游戏界面设计\第四周\tidal-post-week4
node week4/qa/serve.mjs
```

打开 <http://127.0.0.1:4174/>。服务器从仓库根目录提供静态文件，不需要安装前端依赖。独立历史地图仍可通过 <http://127.0.0.1:4174/week4/> 查看。

## 三条真实 Flow

### Main Flow

港口“查看委托” → 接取并整理邮袋 → 选择“蓝色信封 ×1” → 保存邮袋 → 查看航海图 → 纸卷摊开 → 在最终 Week4 海图上拖动 W1/W2 → 确认安全航线 → 确认弹窗“出航” → 操控邮船进入灯塔圈 → 按 `E` 投递 → 领取 `+40` 邮票。

Map Reveal 是第四页内部的过渡状态。展开期间路线输入锁定，200ms 后可点击任意位置，或按 Enter / Space / Escape 跳过；完成后焦点回到 W1。确认出航同时要求已保存邮袋、航线有效、航线已确认。

### Return Flow

- 委托详情 → 返回港口
- 邮袋 → 返回委托 → 返回邮袋
- 地图 → 返回邮袋（保存状态与修改过的 W1/W2 保留）→ 再进地图仅 180ms 淡入
- 奖励领取后 → 返回港口

### Failure Flow

- 邮袋选择“海盐账单”并保存 → 任务不匹配，保存失败 → 改选蓝色信封恢复
- 拖动航点让线段穿过雾礁浅滩 → 危险斜线 / 虚线 / 原因 / 恢复位置提示 → 确认锁定 → 调整至北航道恢复

目的地一直固定为蓝潮岛北侧码头。确认后再改航点会撤销确认，需重新确认才可出航。“继续接取任务”会清除本轮路线和摊图标记，下一次正式进入地图可以再次完整摊开。

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
- `route-map.css / route-map.js`：当前 Week4 地图样式隔离、路线组件与 Root state 同步
- `map-reveal.css / map-reveal.js`：临时纸卷、遮罩、投影、原生动画时间线与输入恢复
- `sailing.js`：Canvas 航行控制与 HUD
- `assets/icons/`：Week 3 透明 PNG 主图标
- `qa/v3-final/screenshots/`：六页、三条 Flow 和响应式截图
- `qa/v3-final/qa-report.json`：自动化 QA 明细
- `qa/v3-figma-state.json`：Figma Frame、组件和 Prototype 节点台账
- `qa/map-reveal/`：本轮截图、两段真实浏览器 WebM 录像、回归报告与源码备份
- `qa/map-reveal-slow/`：5.5 秒慢速摊图的自然播放截图、17 项检查、最终画面像素对比和调整前备份
- `map-reveal-rationale.md`：时序、公开参考、接入方式、验证范围和限制

## QA 参数

- 单页截图：`?capture=01-harbor` 至 `?capture=06-result`
- 运行时状态：`?debug=1`

## 无障碍与降级

- 所有关键操作均可键盘访问并有可见焦点
- 失败、锁定、选中与完成状态均有文字，不只依赖颜色
- `prefers-reduced-motion: reduce` 会关闭非必要动画
- 摊图在 reduced-motion 下只保留 150ms 淡入；路线功能相同
- 原页小屏布局保持；Week4 地图采用 1920×1080 参考舞台等比缩放，已验证 1366×768

## 本轮验证

原 Week4 功能回归 36/36；最终 Art Pass 检查 16/16；完整原型集成与输入测试 59/59。地图最终静止状态与独立 Week4 同条件截图比较，1920×1080 像素差异为 0。历史地图、QA、素材及原 `sailing.js / styles.css / motion.css` 共 161 个保护文件的 SHA-256 未变。

测试从 Harbor 实际点击到 Mailbag 和 Map，再用键盘操控原航行引擎到投递圈并完成 Result。定格图使用原生动画时间线暂停取样；录像采用浏览器真实连续播放，没有跳过或手动寻帧。

本轮航点规划用于验证、确认、任务状态和结果中的规划航程。原航行引擎仍使用原 Canvas 路径与约 2.4 海里的 HUD 比例，W1/W2 尚未改变船舶物理路线。
