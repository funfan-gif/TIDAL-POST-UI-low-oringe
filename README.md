# 潮汐邮局｜V2 Final Master

《潮汐邮局》Week 2 可交互低保真原型，只包含最终版 V2 Final Master。

## 在线体验

https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/

## 交互路径

- Main：港口 → 委托详情 → 邮袋 → 群岛地图 → 航行 HUD → 投递结果 → 领取奖励 → 返回港口
- Return：邮袋试选 → 查看委托 → 返回邮袋，保留分类、选择和未保存草稿
- Failure：选择雾礁岛 → 查看低潮阻断原因 → 改选蓝潮岛 → 恢复出航

## 本地运行

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

然后打开 `http://127.0.0.1:4173/`。
