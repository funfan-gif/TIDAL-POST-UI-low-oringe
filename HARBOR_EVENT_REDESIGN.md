# TIDAL POST / 潮汐邮局 — Harbor Event UI 重构

## 设计结论

第一页不再解释“这里有一个任务”，而是让玩家亲历一次送达：清晨旧港保持安静，异界海鸥穿过潮雾，把带有“双潮邮戳”的信封交到玩家视野中央；邮戳确认去处后，信纸才展开为可操作的委托。

核心句：**委托不是系统弹窗，而是潮汐把亡灵的未竟愿望送到港口。**

因此删除原顶部网页标题、左右卡片、航行记录与常驻流程导航。任务信息仍完整保留，但被装入游戏世界中的“跨界信件”，只有剧情事件完成后才可接取。

## 玩家任务与反馈闭环

| 阶段 | 玩家理解 | 系统反馈 | 设计理由 |
| --- | --- | --- | --- |
| 等待 | 港口此刻没有新消息 | 场景中只有“等待来信” | 保留呼吸感，避免一进入就被面板包围 |
| 海鸥入港 | 有东西从另一个世界靠近 | 海鸥、潮光尾迹、短句状态 | 信使是叙事角色，不是加载图标 |
| 信封交付 | 新委托与自己有关 | 信封聚焦，环境压暗 | 把注意力收束到唯一关键物 |
| 邮戳确认 | 跨界邮路正在辨认去处 | 双潮印记脉冲 | 把“校验状态”世界观化 |
| 信纸展开 | 未竟愿望可以被阅读 | 纸张展开、内容逐层显现 | 让信息出现成为记忆展开，而非弹窗切换 |
| 收下委托 | 玩家主动承担愿望 | 印章式操作 + 角落目标提示 | 用行动结束叙事事件，并进入原有任务闭环 |

## TIDAL POST DESIGN LANGUAGE

### 核心视觉关键词

- **潮汐送达**：信息像潮水抵港，有来处、有节律。
- **未竟回声**：灵魂并不以幽灵特效喧宾夺主，而以微光、短句和留白存在。
- **旧港余温**：世界陈旧但不阴冷，海纤纸和邮灯提供可依靠的暖意。
- **克制灵性**：超自然反馈集中在信使、邮戳和潮光线上。
- **手工邮路**：折痕、墨迹、纤维和邮政编号建立长期可复用的物质感。

### 核心符号

1. **双潮邮戳**：两道相向潮线围绕信路，代表“彼岸寄出 / 此岸接收”。只用于跨界确认、任务接取和投递完成。
2. **异界海鸥**：唯一的亡灵委托信使。它出现就意味着故事事件，而非普通系统通知。
3. **潮光信线**：用短促的暖金轨迹串联海鸥、信封、邮戳和目标提示，承担状态引导。

### 色彩体系

| Token | 色值 | 用途 |
| --- | --- | --- |
| `harbor/deep` | `#173B43` | 夜潮、环境压暗、世界底色 |
| `harbor/ink` | `#244952` | 正文与邮政信息 |
| `harbor/tide` | `#4E918B` | 潮线、交互轮廓、跨界状态 |
| `harbor/glow` | `#D8C47D` | 愿望、确认、邮灯与奖励 |
| `harbor/coral` | `#B86F5A` | 旧印、少量情绪强调 |
| `harbor/paper` | `#EEE2C5` | 海纤信纸主体 |
| `harbor/paper-light` | `#F8EFD8` | 展开面、可读区域 |
| `harbor/mist` | `#C8D8C9` | 次级信息与潮雾 |

颜色被加入现有 Figma `TP / Primitives` 与 `TP / Color` 变量集合，后续地图、邮袋和航行 HUD 可以继续复用，而不是只服务第一页。

### 材质体系

- **海纤纸**：不是仿羊皮纸；颜色偏潮湿米白，带折线、细纤维与青色封边。
- **旧港木与铜**：只属于场景和邮政器物，不再成为矩形 UI 面板皮肤。
- **潮雾**：用于隔开世界与事件焦点，不用普通网页蒙层的纯黑遮罩。
- **灵魂微光**：只在送达、确认、愿望完成时出现；不做全屏粒子背景。
- **邮墨**：承担可读信息；暖金只标记“仍有牵挂的愿望”和玩家确认。

## 信件组件

`Harbor / Spirit Letter` 是新的第一页核心组件：

- 顶部为潮外寄达与邮务编号，说明跨界渠道和可追踪性。
- 双潮邮戳与标题形成唯一视觉重心。
- 委托原话使用宋体系统，区别于邮局的无衬线登记信息。
- 收件人、所需邮件、航程、酬谢仍可快速扫描，但不再像后台统计卡。
- “收下委托”采用双环邮戳按钮，含义是玩家盖章接收，而非点击普通 CTA。
- 右下角 `Harbor / Objective Whisper` 只在事件结束后出现，不抢占场景。

Figma 组件：World Mark、Postage、Tide Action、Cross-Realm Envelope、Spirit Gull Carrier、Objective Whisper、Spirit Letter。

## 动效语言

动效不是魔法爆发，而是一次被潮汐放慢的邮政流程：**靠近 → 交付 → 确认 → 展开 → 承担**。

| 时间 | 事件 | 情绪 |
| --- | --- | --- |
| `0.0s` | 点击“等待来信” | 安静被打破 |
| `1.2s` | 海鸥穿过潮雾 | 远方靠近 |
| `2.7s` | 信封脱离信使并进入视野 | 被交到手中 |
| `4.05s` | 双潮邮戳脉冲，封口开启 | 此岸确认 |
| `5.25s` | 信纸沿折痕展开 | 记忆恢复可读 |
| `6.6s` | 委托稳定、操作解锁、HUD 提示出现 | 玩家获得责任 |

正常时序为 6.6 秒，提供可见的跳过入口。`prefers-reduced-motion` 下改为约 290ms 的直接展开，并保留全部信息和焦点恢复。

## 参考研究转译

- [Spiritfarer](https://thunderlotusgames.com/games/spiritfarer/) 把照料亡灵与告别放进温暖的海上生活。本项目学习“让死亡主题保持温柔且可行动”，不复制其角色或装饰。
- [Sky 光·遇的地图说明](https://thatgamecompany.helpshift.com/hc/en/17-sky-children-of-the-light/faq/1104-what-is-the-sky-map/?l=en&p=all) 展示了通过世界内地点与发光符号逐步揭示信息的思路。本项目把状态提示收缩成潮光与角落目标。
- [Ori and the Will of the Wisps](https://www.orithegame.com/?swcfpc=1) 强调手绘世界、动画角色与情绪叙事。本项目将光用于“送达路径”，而非通用发光边框。
- [Hollow Knight](https://www.hollowknight.com/) 的废墟感与克制情绪说明，世界重量可以通过环境和声音承担，UI 不必持续解释。
- [GRIS](https://nomada.studio/gris-game/) 以精细动画和色彩变化承载悲伤与恢复。本项目借鉴“颜色随情绪承担语义”，不复制水彩构图。

## 实现与可访问性

- Harbor 页拥有独立 `waiting / arriving / revealed` 状态，刷新时不会卡在中间动画。
- 动画结束后焦点自动进入“收下委托”；等待状态只暴露一个主操作。
- 所有阶段有 `aria-live` 文本；信息不依赖颜色。
- 1920×1080 与 390×844 均无溢出；移动端信件改为单列事实区。
- 接取后继续进入原有 Mission → Mailbag → Map → Sailing → Result 六页闭环。

## 可运行 Demo 与截图

本地启动：

```powershell
cd D:\游戏界面设计\第五周\tidal-post-week5-map-v3
node week4/qa/serve.mjs
```

打开 `http://127.0.0.1:4174/`，点击“等待来信”。

关键画面：

- `qa/harbor-event-v1/after/01-waiting-harbor-1920x1080.png`
- `qa/harbor-event-v1/after/02-spirit-gull-arrival.png`
- `qa/harbor-event-v1/after/03-envelope-delivery.png`
- `qa/harbor-event-v1/after/05-letter-unfolding.png`
- `qa/harbor-event-v1/after/06-final-letter-1920x1080.png`
- `qa/harbor-event-v1/after/07-final-letter-390x844.png`

## Figma 交付

文件：<https://www.figma.com/design/m3YZJuwn5JkYnFCPW8fh5W/>

- 页面 `Week 5 — Harbor Event`：`79:68`
- 四状态展示板：`80:86`
- Waiting：`80:171`
- Spirit Gull Arrival：`80:242`
- Envelope Focus：`80:343`
- Final Commission：`80:427`
- 组件与设计语言板：`80:90`

Figma 稿由独立文字、SVG、变量、组件和实例组成；不是一张铺满画布的截图。

## 验证

- Harbor 视觉与交互：`20 / 20` 通过，报告 `qa/harbor-event-v1/harbor-qa-report.json`。
- 完整主流程回归：`21 / 21` 通过，报告 `qa/harbor-event-v1/integration-qa-report.json`。
- 正常动画实测 `6601ms`；reduced-motion 实测 `290ms`。
- 无脚本错误、资源错误、横向溢出或焦点丢失。
