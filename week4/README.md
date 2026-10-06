# 潮汐邮局 · Week 4 邮务航海图桌

本目录独立扩展最新 V3 main，保留仓库根目录的全部前三周成果。

## 打开作品

当前正式提交文件为 `submission-board.pdf`（六页）。`submission-board.html` 是对应的可编辑打印源，新增地图展开状态；实际截图保存在 `submission-assets/`。完整任务原型打开仓库根目录 `index.html`，教师快速演示打开根目录 `teacher-demo.html`（单个文件，可离线）。

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

- `qa/art-pass-03/01-landmarks-valid-1920x1080.png`：当前 Art Pass 03 核心界面。
- `qa/art-pass-03/02-landmarks-blocked-1920x1080.png`：当前危险状态。
- `qa/art-pass-03/03-landmarks-confirmed-1920x1080.png`：确认许可。
- `qa/art-pass-03/04-landmarks-valid-grayscale.png`、`05-landmarks-blocked-grayscale.png`：灰度。
- `qa/art-pass-03/06-landmarks-halfscale-960x540.png`：半尺寸。
- `qa/art-pass-03/07-before-after-comparison.png`：三个地点的前后裁切对比。
- `qa/art-pass-03/08-submission-board-art-pass-03.png`：当前 2400 × 1350 展示板。
- `art-pass-03-rationale.md`、`qa/art-pass-03/visual-review.md`：地点设计与七项视觉审查。
- `qa/art-pass-03/qa-report.json`、`landmark-qa-report.json`：36 项回归和 16 项保留核对。

历史成果继续保留：

- `qa/art-pass-02/01-after-valid-1920x1080.png`：Art Pass 02 核心界面。
- `qa/art-pass-02/02-after-blocked-1920x1080.png`：同一界面的关键状态。
- `submission-board.html`：左右对照与三个简短说明。
- `qa/art-pass-02/07-submission-board-art-pass-02.png`：2400 × 1350 展示板图片。
- `design-rationale.md`：V3 问题 → 老师反馈 → 第四周决策。
- `art-pass-02-rationale.md`：第二轮美术命题、文件与资产、保留范围及限制。
- `qa/art-pass-02/qa-report.json`、`visual-qa-report.json`、`visual-review.md`：本轮功能回归和视觉证据。
- `qa/art-pass-02/00-before-valid.png`、`00-before-blocked.png`：真实浏览器 BEFORE。

`qa/` 下 Function Pass 与 `qa/art-pass-02/` 的截图和报告全部保留。当前证据写入 `qa/art-pass-03/`，包含修改前源码、截图和 111 个历史／冻结文件哈希。

## 自动 QA

无运行时框架或外部资源依赖。测试需要 Node.js、Playwright 和已安装的 Microsoft Edge。

启动项目附带的本地服务器：

```powershell
node week4/qa/serve.mjs
```

另开终端，传入含 Playwright 的 `node_modules` 绝对目录：

```powershell
node week4/qa/art-pass-03/regression-36.mjs "C:/path/to/node_modules"
```

这份脚本与原 36 项脚本完全相同，输出目录改由脚本所在位置决定，因此重跑不会覆盖历史 QA。测试用实际鼠标事件拖动航点，并生成状态、确认、灰度、50% 缩放和展示板证据。

另有 `qa/art-pass-02/capture-art.mjs` 与 `visual-qa.mjs`，分别用于指定命名的最终截图与 27 项补充验证；当前脚本使用本机 Codex 自带 Playwright 路径和 Edge，换机器时需调整运行时路径。

本轮 `qa/art-pass-03/capture-landmarks.mjs` 输出指定命名截图；`landmark-qa.mjs` 核对历史哈希、修改前后实际浏览器 DOM、布局、命中范围、碰撞几何、资源与层级。二者也使用本机运行时路径。

## 美术层

本轮新增 `paper-wear.css` 与 `assets/art-pass-04/`，表现四角掉纸、边缘缺口、污迹和长期折叠痕迹。基础地图、地物碰撞和路线代码不变。完整原型的摊图保持 5.5 秒，使用多段 cubic-bezier 表达起卷、折痕阻力和停稳。

`art-pass-03.css` 仅补充地点资产与既有危险状态绑定。9 个可编辑 SVG 放在 `assets/art-pass-03/`，包含港湾、岛屿、浅滩、码头与次要航标。视觉地物与冻结的碰撞代理分离，原 `week4-map.js`、基础 CSS 与 Art Pass 02 CSS 未修改。见该资产目录的 README。

`art-pass-02.css` 作为覆盖样式，保留原 `week4-map.css`。海域纸纹为独立生成的 PNG；船舱底面、岛屿颜料、记录纸与放行框为原创 SVG。资产来源、生成 brief 和字体依赖见 `assets/art-pass-02/README.md`。没有整张 UI 背景图，地理、航线、航点、读数和按钮仍独立渲染。

## 范围

目标是 1920 × 1080 PC 游戏界面，其他比例采用整场景等比缩放与留边。潮汐固定为 06:40 的低潮场景；航行入口保留 V3 航行，其物理运动尚未读取新规划路线。未修改或发布远程 main。
