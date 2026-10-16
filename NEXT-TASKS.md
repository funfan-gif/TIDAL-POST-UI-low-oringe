# Next Tasks — 下一台电脑继续工作

## 第一次打开

1. 按 `README.md` 中的命令克隆 `week5/harbor-event-overhaul` 分支，并启动本地静态服务器。
2. 打开 `效果查看/index.html`，确认离线演示可载入；查看 `qa/harbor-event-v1/continuous-qa-report.json` 和相关 QA 报告，了解已经记录的完整流程。
3. 依次阅读 `AGENTS.md`、`UI-STYLE-GUIDE.md`、`TEACHER-FEEDBACK.md`、`DEVELOPMENT-PROGRESS.md`，再读 `HARBOR_EVENT_REDESIGN.md`、`MAP_V3_REDESIGN.md`、`map-reveal-rationale.md`。
4. 先执行 `git status --short --branch`；不使用 `git reset --hard`、`git clean` 或覆盖文件的办法清理工作区。

## 优先级 1：恢复清晰、可编辑的应用入口

- 当前仓库根目录没有 `index.html`；不能把 `效果查看/index.html` 的内嵌副本当作模块化源代码。
- 以 Git 历史中的入口、现有 `harbor-event.*`、`app.js`、地图模块和 `sailing.js` 为依据，新增可维护的页面入口/模板，显式加载各模块并保留所有状态。
- 保留 `效果查看/index.html` 作为离线评审产物；不要覆盖历史页面或在不检查差异时恢复旧版根入口。
- 更新 `README.md` 的启动说明和 `.github/workflows/pages.yml`，让根入口或经过确认的发布目录确实可访问。提交之前在本地验证主流程、返回/错误恢复、移动端和 reduced-motion。

## 优先级 2：让规划结果连接实际航行

- 第四周记录显示 W1/W2 当前能参与规划和确认，但没有改变 Canvas 船舶物理路径。
- 先定义规划航点与 Canvas 坐标/目的地模型的转换及失败恢复，再让确认路线影响航行目标、HUD 距离和结果页；确保错误目的地、危险航线和返回流程依旧一致。
- 保留目前的默认 2.4 nm 场景基线，补上对应状态 QA 和设计理由。

## 优先级 3：复核跨设备与资产来源

- 在新设备按 README 安装 Playwright 并重新运行 Harbor / Week 5 QA 脚本，记录 Node/Python 版本及结果；历史周次脚本若仍依赖本机路径，应逐步改为环境配置并保留原始报告。
- 核对 `assets/icons/` 和 `assets/week5/` 的原始可编辑来源、透明图边缘与实际显示尺寸；新增蓝色信封卡片时遵循 `UI-STYLE-GUIDE.md`，不要把不同周次的资产误判为同一个风格版本。
- 如需无账号/联网条件下继续编辑 Figma 原稿，需取得并归档允许共享的原生设计文件或补充可编辑替代稿；现有仓库只含 Figma 链接、状态台账和截图。

## 发布前核对

- 远端分支为 `week5/harbor-event-overhaul`；当前 `main` 与该交接分支不是同一状态。若要合并到 `main`，先读取并对比远端新提交，再制作可审阅的合并/PR；不要直接强推覆盖。
- 确认根入口、GitHub Pages 地址、内嵌演示、设计说明和提交材料彼此一致。
- 检查 `git status`、忽略规则、敏感信息、最大文件和 LFS 状态；提交只包含项目文件，不包含 Token、密码、缓存、临时日志或个人运行时路径。
