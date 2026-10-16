# Development Progress — 交接时实现状态

## 当前快照

- 项目：潮汐邮局 / Tidal Post。
- 交接分支：`week5/harbor-event-overhaul`。
- 设计基线提交：`af25838`（第五周地图 V3）；其父链包含第四周 `15e66c2` 和 GitHub 仓库已有的 Week 2/3 原型历史。
- 当前交接提交会包含 Harbor Event 港口改版和文档准备中的变更。
- 根目录 `index.html` 在当前分支修改中被删除。单文件运行入口是 `效果查看/index.html`；旧 HTML 同时保存在 `qa/harbor-event-v1/source-before/index.html` 和 Git 历史中，原有页面内容没有被丢弃。

## 已实现

### 项目骨架与基础视觉

- 六页任务闭环：Harbor、Mission、Mailbag、Map、Sailing、Result；Main / Return / Failure / Reward 状态逻辑保存在 `app.js` 和历史源快照中。
- Week 3 六枚 PNG 功能图标和暖纸、深海墨、海玻璃、珊瑚邮戳、邮票金 token。
- Canvas 航行 HUD、键盘控制、屏幕控制、暂停/地图覆盖、实际到达条件和奖励领取边界。

### Week 4 地图规划与材质

- 将地图任务改为规划到委托固定目的地，提供坐标、地标、潮汐、W1/W2 航点、危险航段验证、路线确认及恢复提示。
- 首次进入地图播放约 5.5 秒卷轴展开；保留地图折痕、磨损和纸张材质。航点调整与确认状态通过 `week4/`、`map-reveal.*` 及 `paper-wear.css` 相关模块实现。
- 保留独立提交板 HTML/CSS/PDF、教师演示、Week 4 源文件和历史截图。

### Week 5 地图 V3

- 三个可选港口；目的地址匹配和航线安全分开判断；目的地切换会撤销确认。
- W1/W2 可拖动或键盘操作；地图具有分层航道、雾礁、浅滩与重绘沉船；危险状态可读且有恢复方向。
- 可编辑 SVG 资产和地图 QA 截图/报告位于 `assets/week5/`、`qa/week5-map-v3/`。

### Harbor Event

- Harbor 等待、海鸥抵达、信封交付、双潮邮戳、信纸展开和接取状态由 `harbor-event.js` / `.css` 及更新后的 `app.js` 支持。
- 约 6.6 秒正常事件；减少动态效果下约 290 ms；进入后焦点与返回的已展开信件状态有明确处理。
- `效果查看/index.html` 提供独立、内嵌素材的连续演示；`tools/build-continuous-demo.py` 是其构建辅助脚本。

## 仓库已有验证记录

以下结果来自已保存报告，不代表交接文档编写期间重新运行：

| 范围 | 记录结果 | 证据 |
| --- | --- | --- |
| Harbor Event 页面 | 20/20 | `qa/harbor-event-v1/harbor-qa-report.json` |
| Harbor Event 与六页整合流程 | 21/21 | `qa/harbor-event-v1/integration-qa-report.json` |
| Harbor 单文件离线连续演示 | 17/17 | `qa/harbor-event-v1/continuous-qa-report.json` |
| Week 5 地图 V3 页面 | 15/15 | `qa/week5-map-v3/visual-qa-report.json` |
| Week 5 主流程 | 21/21 | `qa/week5-map-v3/integration-qa-report.json` |
| Week 4 集成与交付 | 59/59、17/17 | `qa/week4-final/` |

## 未完成 / 当前限制

1. **模块化根入口缺失。** 当前根目录无 `index.html`。离线演示可运行，但外壳和嵌入的旧原型与模块化源代码并未合并成一个清晰的、可维护的根入口；GitHub Pages 工作流仍发布仓库根目录。
2. **地图计划未驱动船舶物理路径。** W1/W2 规划可验证、确认并记录，但原 Canvas 航行仍使用原有路径；第四周记录明确注明了该范围。
3. **Figma 原生源文件不在 Git 内。** README 保留 Figma 链接；仓库有本地 HTML/CSS/JS/SVG、Figma 状态台账和截图，不能据此声称 Figma 文件已随代码归档。
4. **真实玩家测试记录有限。** 自动化浏览器检查和设计审查可在 QA 报告中核对；没有足够证据声称完成了真实玩家可用性测试。
5. **跨设备复核尚待执行。** 当前离线单文件报告显示无网络请求；新设备仍应按 `NEXT-TASKS.md` 检查依赖、入口、字体和截图。

## 资产与仓库体检

交接检查时，索引中约 387 个文件、工作树文件总量约 279 MB；最大单文件为第四周 PDF（约 11.6 MB），没有单文件超过 GitHub 100 MB 限制。当前没有 LFS 跟踪文件，也未发现必须启用 Git LFS 的单项资产。首次克隆体积较大，主要来自历史 QA PNG、PDF、演示和源码快照；只有删除或迁移用户明确授权的冗余历史资产后，才考虑减小仓库。

检查了当前文件路径、忽略规则和常见凭据格式；没有发现 `.env`、缓存依赖目录或常见访问密钥模式。编辑器日志 `Typora_Hook_Log.txt` 不属于项目交付物，不应提交。GitHub 远端需要网络权限才能查询/推送，最终状态以交接提交后的远端核对为准。
