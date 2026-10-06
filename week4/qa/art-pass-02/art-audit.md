# ART PASS 02 · BEFORE 审查

已在真实 Edge 1920 × 1080 浏览器中打开 valid 与 blocked，截图为 `00-before-valid.png`、`00-before-blocked.png`，审查后开始修改。

- A / C：起终点是规整圆角信息框；右侧横向分隔线、状态矩形和纯色主按钮仍像网页侧栏；航点是平面拖拽圆柄。
- B：背景只呈现浅色渐变，海面大色带缺少颜料层次，岛屿和房屋几何感较强。海图纸边过于笔直，纸张没有真实的轻纤维和折痕。
- D：第一眼会在标题、目标矩形框和实心主按钮之间跳转，航线仍可见，但缺少“在道具上规划”的体验。
- E：起点、固定目标、航线、雾礁、状态和确认均已可辨认，这一信息结构应保留。
- F：邮船图标、邮戳、TP-042、灯塔与浮标强化邮务航海身份，保留并统一笔触。
- G：大面积几何色带、每段数据的圆角框、装饰性分隔线与相同纸面边框增加网页感，应减弱。

Visual thesis：一名海上邮差在旧邮船船舱里摊开一张留下潮气与盐粒痕迹的邮务海图，以航海墨线、纸签图钉和放行邮戳规划去往蓝潮岛的路线。

主色：旧象牙纸、浅海玻璃水彩、深海玻璃墨线；珊瑚色只指向问题航段与错误原因。字体分为书写地名、清晰 UI、紧凑航海数值。材质不承载状态，不进入碰撞或拖拽逻辑。

使用流程依据 OpenAI 官方 `game-ui-frontend`、`game-playtest`，本地 `frontend-design` 辅助排版；`imagegen` 生成独立材质资产。未安装额外运行框架。

官方技能来源：
- https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-ui-frontend/SKILL.md
- https://github.com/openai/plugins/blob/main/plugins/game-studio/skills/game-playtest/SKILL.md
