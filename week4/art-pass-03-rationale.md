# Art Pass 03 · Landmark Illustration Pass

本轮只重绘地点与地物，保留 Art Pass 02 的页面布局、顶部标题、航线记录板、色彩和交互。作品仍是海图桌上的邮务规划界面。

## 从几何占位到地点

| 地点 | 修改前 | 本轮形体与空间关系 |
| --- | --- | --- |
| 旧邮局港 | 左下绿色陆地与两栋重复房屋，缺少港湾 | 内凹浅水湾形成完整泊船口；钟楼邮局靠近栈桥，渔屋提供比例参照，低矮邮件棚沿淡色小路连接装卸岸；木码头、系缆柱和绳索围绕原玩家船位置 |
| 蓝潮岛 | 圆滑绿块与两栋相同房屋，北侧码头只有细线 | 完整独立的不规则海岸，北侧凹湾容纳木栈桥、小泊位和邮旗；宽檐邮务小屋带信封牌与邮筒，4 组树冠与沙岸／sage／moss 颜料层形成内部地貌；浅青水晕与西南石岸区别于旧港 |
| 雾礁浅滩 | 黄色椭圆和三个三角礁图标 | 不规则沙绿浅水 wash，3 组露礁与 2 块水下礁错落分布；断续等深线、稀疏点纹、碎浪、3 条静态雾 wash 与 4 m／5 m 标识；没有连续的陆地海岸描边 |

邮局长厅与钟楼、窄高渔屋、低斜顶邮件棚、宽檐邮务小屋分别使用独立轮廓。灯塔、浮标与沉船小幅统一墨线和颜料语言，保持次要权重。

## 地物与路线的层级

资产为 9 个原创可编辑 SVG，详见 `assets/art-pass-03/README.md`。手工 path 决定形体，局部 turbulence / displacement 只处理半透明颜料底层。没有生成整页图像，本轮没有使用 ImageGen。

地物视觉均禁止 pointer events，位于 route 和 waypoints 之前。主 SVG 的坐标、地名、起点船、目的地图标、路线、航点和状态反馈保留独立 DOM。新增资产降低透明度，航线的原有线宽未调整。

BLOCKED 使用原 `.is-danger` 状态：自然浅滩轮廓上出现珊瑚斜线、断续外缘、少量岩缘和增强碎浪。原危险虚线、交叉标记、警告图标、绕行文字和禁用确认继续工作。NORMAL 下这些强调层隐藏，保留安静浅水与岩礁。

## 冻结范围与证据

`week4-map.js`、`week4-map.css`、`art-pass-02.css` 和展示板 CSS 均未修改。原逻辑障碍仍是原 SVG 数据，放入透明代理组；隐藏使用父组 opacity，实际 fill / stroke 和几何测量保留。原目的地 (1115,255)、起点 (275,720)、W1/W2、hitbox、计算、碰撞、确认、键盘、记忆与 query/debug 保持原样。

视觉海岸和浅滩边缘允许与逻辑代理不同，这是本次 brief 指定的分离方式。碰撞仍以原障碍为准；debug 可以查看原代理。没有为插画重算碰撞边界。

原 36 项脚本以完全相同的副本运行：36/36 PASS。补充核对 16/16 PASS：111 个历史／冻结文件 SHA-256 未变；两种状态的关键 DOM、布局、命中范围、障碍属性／变换／描边和全图采样一致；资源解码、SVG 解析、渲染层级与 debug 显示正常。

所有最终截图、修改前源码、修改前截图与报告独立保存至 `qa/art-pass-03/`。展示板只更新轮次和两张截图引用。Function Pass 和 Art Pass 02 的所有 QA 与资产原样保留。

## 浏览器视觉审查

实际查看 VALID、BLOCKED、CONFIRMED、两张灰度、50% 缩放和三个地点前后裁切。港湾与码头、独立岛与北栈桥、无建筑的散礁浅水形成不同轮廓，半尺寸建筑保持整体轮廓，危险反馈在灰度下继续可读。新增 5 m 标识移离岩缘，保持水深文字清楚。

无文字灰度截图用于自查地点形态。注意力排序按真实截图作定性判断，未声称完成真人三秒识别测试。七项审查详情见 `qa/art-pass-03/visual-review.md`。

## 使用的指引

按用户指定，优先采用 OpenAI game-studio 的 [game-ui-frontend](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-ui-frontend/SKILL.md) 与 [game-playtest](https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-playtest/SKILL.md) 指引。当前未安装这两个 skill，已阅读官方源文本；本机 frontend-design 仅用于辅助资产构图，不主导页面重构。
