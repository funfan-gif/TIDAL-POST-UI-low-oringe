# 潮汐邮局 · Week 4 邮务航海图桌

本目录独立扩展最新 V3 main，保留仓库根目录的全部前三周成果。

## 打开作品

在仓库根目录启动静态服务器，例如：

```powershell
python -m http.server 4174 --bind 127.0.0.1
```

- 交互作品：<http://127.0.0.1:4174/week4/>
- 安全状态：<http://127.0.0.1:4174/week4/?state=valid>
- 危险状态：<http://127.0.0.1:4174/week4/?state=blocked>
- 提交展示板：<http://127.0.0.1:4174/week4/submission-board.html>
- 调试碰撞：在状态 URL 后添加 `&debug=1`。

也可以直接打开 `index.html` 或 `submission-board.html`；浏览器限制本地存储时，交互仍可运行，路线记忆不保证可用。

## 操作

拖动 W1 / W2；Tab 聚焦航点后用方向键移动，Shift 加方向键加大步幅。路线和记录实时同步。穿越浅滩、陆地或沉船礁时，确认锁定；绕行后恢复。点击“确认航线”查看结果，继续出航或返回调整；“重置航点”恢复北线参考布局。

## 提交文件

- `qa/01-route-valid-1920x1080.png`：核心界面。
- `qa/02-route-blocked-1920x1080.png`：同一界面的关键状态。
- `submission-board.html`：左右对照与三个简短说明。
- `qa/07-submission-board-2400x1350.png`：可直接提交的展示板图片。
- `design-rationale.md`：V3 问题 → 老师反馈 → 第四周决策。
- `qa/qa-report.json`、`qa/visual-audit.md`：交互与视觉证据。

## 自动 QA

无运行时框架或外部资源依赖。测试需要 Node.js、Playwright 和已安装的 Microsoft Edge。

启动项目附带的本地服务器：

```powershell
node week4/qa/serve.mjs
```

另开终端，传入含 Playwright 的 `node_modules` 绝对目录：

```powershell
node week4/qa/qa-week4.mjs "C:/path/to/node_modules"
```

测试用实际鼠标事件拖动航点，并自动生成两状态、确认、灰度、50% 缩放和展示板截图。

## 范围

目标是 1920 × 1080 PC 游戏界面，其他比例采用整场景等比缩放与留边。潮汐固定为 06:40 的低潮场景；航行入口保留 V3 航行，其物理运动尚未读取新规划路线。未修改或发布远程 main。
