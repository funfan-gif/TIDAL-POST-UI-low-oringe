# TIDAL POST · 世界航海图 V3 重制记录

## 玩家任务

玩家带着 TP-042 蓝色信封，在旧邮局港的海图桌上辨认收件港、选择目的地、调整 W1/W2 绕开低潮浅滩并确认航线。目的地匹配与航线安全是两条独立判断。

## 五处红圈问题清单

| 区域 | 原问题 | V3 处理 |
| --- | --- | --- |
| A 地图题签 | 委托 ID、英文调试标签与固定路线重复，像原型注释 | 改为印在海图上的“北线邮务海图 / 北海分局第七测区”，使用墨线边饰与测绘印记，不再重复 TP-042 |
| B 北航道 | 只靠两行普通文字说明 | 以浅青水道洗色、成对等深线、浮标门与水流短线形成可读的航道走廊；“20m+”降为三级信息 |
| C 蓝潮岛北侧码头 | 长期显示巨大“固定目的地”纸牌，无法更换目的地 | 改为港口印章标记；Hover 展开金色罗盘环与纸签，Click 盖章并保持 Selected；另加入白塔补给站、东汐渔港 |
| D 雾礁浅滩 | 沙色同心区域、礁石贴片感、水深像调试文案 | 新增可编辑 SVG：青绿陆架→沙黄色浅滩→低潮核心；礁石增加体积、浸水线与水深点；碰撞轮廓与浅滩核心共用坐标 |
| E 旧沉船残骸 | 线框结构单薄，难以不看文字识别 | 重绘为结构完整的腐朽木船：断桅、船肋、破损甲板、漂板与浸没水纹；作为地标而非港口 |

## 美术方向

**Cozy Hand-Painted Nautical Chart / 温暖手绘式航海图**

- 配色：船舱深海绿 `#284f50`、海图纸 `#eee0be`、浅海青 `#9bc8bd`、航海墨 `#315e57`、暖金 `#c9a35d`、危险锈红 `#a65746`。
- 字体：海图标题与地名优先楷体/宋体回退；数字与方位使用 Georgia；动态说明保持系统中文字体，避免装饰字影响识别。
- 布局：继续使用 1920×1080 参考舞台，海图与航线记录维持 3.7:1；地图坐标统一在 `viewBox 0 0 1400 930`。
- 原则：地理靠形状辨认，状态靠形状＋颜色＋短文案；地图上不放现代网页卡片；动态航线、港口和反馈保持独立图层。

## 参考落实

| 参考 | 借鉴点 | 应用位置 | 不照搬 |
| --- | --- | --- | --- |
| Spiritfarer 世界地图 | 目的地点是温暖插画世界的一部分；选择后清晰保留当前目的地 | 港口标记、Selected 稳定态、轻量地点纸签 | 不复制原游戏的图标、世界布局与资源气泡 |
| Sea of Thieves 海图桌 | 地图作为船上实体物件；岛屿、格网、手写圈记共享同一材质语境 | 船舱背景、旧纸、墨线格网、邮务盖章 | 不采用海盗绳索、骷髅符号或写实 3D 桌面 |
| DREDGE 地图 | 群岛轮廓和区域名优先，兴趣点标记克制；地图直接服务航行 | 港口层级、地标与危险海域分离、右侧航线数据 | 不采用恐怖高反差、密集收集物图标 |
| Carto | 地图图形语言与绘本场景一致，地貌本身承担玩法信息 | 浅滩、岛屿、港口全部保持水彩墨线语言 | 不复制拼图网格与地图块操作 |
| NOAA U.S. Chart No. 1 | Sounding、Depth Contour、Wreck、Reef、Buoy、Channel 的符号关系 | 水深点、等深线、沉船/礁石身份、航标门 | 不把作品做成专业 ECDIS，也不机械堆满标准缩写 |

参考链接：

- <https://www.humblegames.com/games/carto/>
- <https://www.dredge.game/>
- <https://www.blacksaltgames.com/games/dredge-update-v-1-1-0-map-markers-more/>
- <https://news.xbox.com/en-us/wp-content/uploads/sites/2/2020/06/Sea_of_Thieves_Player_Guide-1.pdf>
- <https://nauticalcharts.noaa.gov/publications/us-chart-1.html>
- <https://oceanservice.noaa.gov/facts/sounding.html>

## Skills 筛选

- **实际使用：`frontend-design`**。用于先定义项目专属配色、字体、布局与反模板原则，再进入实现。
- **实际使用：`game-ui-ux`**。用于参考分辨率缩放、鼠标/键盘共存、稳定状态、冗余编码和 reduced-motion。
- **实际使用：`imagegen`**。只生成透明沉船地标底稿；文字、路线、港口和碰撞均未烘焙，最终资产已复制到项目目录。
- **已检查但未安装：`nextlevelbuilder/ui-ux-pro-max-skill`（MIT）**。覆盖面较广，但对本项目最关键的游戏海图地理表达帮助有限，并且会引入额外 CLI；现有本地 Skill 已覆盖其可用部分。
- **已检查但未安装：`vercel-labs/agent-skills` 的 `web-design-guidelines`（MIT）**。定位是网页规范审查，不负责游戏地图美术；本轮用项目内 Playwright QA 更直接。
- **已检查但未采用：通用 SVG 角色动画 Skill**。本任务是地图标记与航线，不需要角色 morph 状态机。

## 图层结构

1. 纸张与旧损纹理
2. 深浅海水与等深线
3. 岛屿与港口建筑
4. 浅滩、沉船及地标
5. 静态制图符号与三级文字
6. 可交互港口
7. 动态航线与 W1/W2
8. 地址匹配、危险与确认反馈

## 交互与状态

- 三个可选港口：蓝潮岛·北侧码头、白塔补给站、东汐渔港。
- Hover：暖金描边 → 罗盘环展开 → 图标轻微上浮 → 纸签显现。
- Selected：一次邮务盖章；离开 Hover 后仍以双环与印章保持选中。
- Wrong Destination：暗红小印章显示“邮址未匹配”，不提示正确答案；右侧记录同步异常。
- 目的地切换会改变实际终点、距离、航向与危险判断，并撤销旧确认状态。
- 确认条件：`地址匹配 && 航线安全`。两种状态分开显示。
- 动画均在 `prefers-reduced-motion` 下关闭或缩短。

## 工具与资产来源

- HTML / CSS / JavaScript / SVG：交互、制图层、信封与浅滩源文件。
- 内置 Image Generation：原创透明沉船水彩资产；未使用第三方商业游戏截图或网络贴图。
- Playwright + Microsoft Edge：真实浏览器交互与截图。
- Git：从第四周提交 `15e66c2` 克隆，在 `week5/map-v3-overhaul` 分支开发；第四周目录保持不变。

## QA

- `visual-qa-report.json`：15 / 15 通过。覆盖 1920×1080、1366×768、Hover/Selected 区分、真实目的地切换、错误邮址锁定、浅滩碰撞、独立信封素材、运行时错误和 reduced-motion。
- `integration-qa-report.json`：21 / 21 通过。从港口接取 TP-042，经邮袋保存、摊图、航点键盘调整、错误港口、正确港口、确认、真实航行、投递、领奖到返回港口。
- `before/01-original-full-map.png`：第四周真实运行完整地图。
- `after/01-map-default-1920x1080.png`：第五周完整地图。
- `after/02-port-hover-1920x1080.png`：未选中的白塔补给站 Hover。
- `after/03-port-selected-1920x1080.png`：蓝潮岛 Selected 稳定态。
- `after/04-wrong-destination-1920x1080.png`：白塔补给站邮址未匹配。
- `after/05-route-danger-1920x1080.png`：W1 穿越浅滩后的危险航线。
- `after/06-map-default-1366x768.png`：小分辨率验证。
- `after/08-mailbag-envelope-1920x1080.png`：重绘后的蓝色信封与邮袋身份区分。
- `compare/03` 至 `07`：五处红圈的同视角前后对比。
