# 潮汐邮局 / Tidal Post — Week 2 V3

Game-ready Mid-Fi 可交互原型。保留 Week 2 的六页任务闭环与状态逻辑，升级为第三周确定的“海玻璃低饱和 / 邮务纸本 / 圆润轻航海”视觉，并加入真正可操控的 Canvas 航行。

## 在线原型

GitHub Pages：<https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/>

Figma 可编辑源文件：<https://www.figma.com/design/m3YZJuwn5JkYnFCPW8fh5W/>

## 本地启动

可以直接双击 `index.html`。建议用静态服务器运行：

```powershell
cd D:\游戏界面设计\TIDAL-POST-UI-low-oringe-deploy
python -m http.server 4173 --bind 127.0.0.1
```

打开 <http://127.0.0.1:4173/>。

## 三条真实 Flow

### Main Flow

港口“查看委托” → 接取并整理邮袋 → 选择“蓝色信封” → 保存邮袋 → 前往地图 → 选择“蓝潮岛” → 确认航线 → 操控邮船进入灯塔圈 → 按 `E` 投递 → 领取 `+40` 邮票。

### Return Flow

- 委托详情 → 返回港口
- 邮袋 → 返回委托 → 返回邮袋
- 地图 → 返回邮袋（保存状态保留）
- 奖励领取后 → 返回港口

### Failure Flow

- 邮袋选择“海盐账单”并保存 → 任务不匹配，保存失败 → 改选蓝色信封恢复
- 地图选择“雾礁” → 低潮封锁、无法航行 → “重新选择蓝潮岛”恢复

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
- `sailing.js`：Canvas 航行控制与 HUD
- `assets/icons/`：Week 3 透明 PNG 主图标
- `qa/v3-final/screenshots/`：六页、三条 Flow 和响应式截图
- `qa/v3-final/qa-report.json`：自动化 QA 明细
- `qa/v3-figma-state.json`：Figma Frame、组件和 Prototype 节点台账

## QA 参数

- 单页截图：`?capture=01-harbor` 至 `?capture=06-result`
- 运行时状态：`?debug=1`

## 无障碍与降级

- 所有关键操作均可键盘访问并有可见焦点
- 失败、锁定、选中与完成状态均有文字，不只依赖颜色
- `prefers-reduced-motion: reduce` 会关闭非必要动画
- 小屏切换为纵向布局；主桌面目标为 1920×1080
