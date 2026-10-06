"""Build the editable six-page HTML source for the course submission PDF."""
from pathlib import Path
from html import escape

root = Path(__file__).resolve().parent.parent
pages = [
    dict(chapter='邮务准备', title='保存邮件，让出航准备有起点', state='潮汐邮局 / Tidal Post', detail='游戏界面设计 · 第四周', image='01-mailbag-saved.png',
         caption='蓝色信封 ×1 · 委托 TP-042 · 蓝潮岛北侧码头',
         notes=[('玩家任务', '准备委托要求的邮件，并明确本次投递目标。保存成功后，才能查看航海图。'),
                ('状态与反馈', '选择邮件形成草稿；保存后显示已保存状态。错误邮件会说明不匹配原因，并允许重新选择。'),
                ('本次连接', '邮袋进入海图，再确认航线、开始航行；邮件、目的地和规划结果在同一任务中延续。')],
         footer='保存邮件 → 展开海图 → 规划与恢复 → 确认航线 → 开始航行'),
    dict(chapter='新增过渡状态', title='展开海图，从邮件准备进入空间规划', state='Map Revealing', detail='完整时长 5.5 秒', image='02-map-unroll.png',
         caption='实际展开中段 · 掉纸、折痕、污迹随地图一同显露 · 完成后开放航点操作',
         notes=[('纸张与使用痕迹', '四角磨损、边缘缺口、少量纸孔与折痕，让海图像长期随船使用的邮务工具。'),
                ('有变化的展开节奏', '起卷加速，经过旧折痕时放慢，再继续展开并轻轻停稳。裁剪边界与卷筒同步移动。'),
                ('交互恢复', '展开中锁定规划输入；可点击或按 Enter / Space / Esc 跳过。完成后焦点回到 W1。')],
         footer='PDF 展示关键帧；完整动效可在教师演示 HTML 与在线原型中观看'),
    dict(chapter='核心地图页面', title='目标固定，航线由玩家规划', state='Route Valid', detail='安全路线可确认', image='03-map-ready.png',
         caption='当前位置 · 固定目的地 · W1 / W2 · 坐标与航向 · 潮汐窗口 · 航线记录',
         notes=[('呼应老师建议', '加入坐标、方位、海上地标和航标。玩家依据空间信息设定路线，而非重复选择委托目的地。'),
                ('信息层级', '先看起点、终点、航线和确认状态；再查航向、距离和潮汐。海图承担主要规划任务。'),
                ('可操作的地图', '拖动 W1 / W2，或聚焦后按方向键移动。航线、距离和记录实时更新，安全后允许确认。')],
         footer='地图几何、地物碰撞与航点位置保持原规则；旧损只改变纸张材质'),
    dict(chapter='关键失败状态', title='解释危险，也给出恢复方向', state='Route Blocked', detail='穿越低潮浅滩', image='04-map-blocked.png',
         caption='航段进入雾礁 → 虚线、斜线与警告 → 确认锁定 → 调整至北航道恢复',
         notes=[('冗余状态编码', '危险同时通过颜色、虚线、三角警告、浅滩斜线和文字说明表达，灰度下仍可辨认。'),
                ('失败原因', '指出具体危险航段和低潮限制。禁止确认与出航，避免把不可通行路线带入下一阶段。'),
                ('恢复路径', '玩家将航点移回北航道后，警告消失、确认恢复。提示帮助理解规则，保留玩家的判断与操作。')],
         footer='判断 → 操作 → 系统反馈 → 解释原因 → 调整恢复'),
    dict(chapter='规划结果', title='确认安全航线，取得出航许可', state='Map Confirmed', detail='邮件与路线一并确认', image='05-map-confirmed.png',
         caption='蓝色信封 ×1 → 蓝潮岛 · 北侧码头 · 出航 / 返回海图调整',
         notes=[('确认操作的结果', '以邮务放行印章、任务邮件、目的地和规划航程明确告诉玩家：本次路线已经记录。'),
                ('明确下一步', '“出航”进入航行；“返回海图调整”继续规划。确认后再改航点，会撤销原有出航许可。'),
                ('返回保留状态', '返回邮袋保留邮件与航点草稿，再进地图只做短淡入；每轮任务首次进入才完整展开。')],
         footer='出航条件：邮袋已保存 + 航线有效 + 航线已确认'),
    dict(chapter='接回完整课程原型', title='规划结束，邮船开始航行', state='Sailing', detail='保留原航行与投递闭环', image='06-sailing.png',
         caption='港口 → 委托 → 邮袋 → 海图 → 航行 → 投递与奖励',
         notes=[('本周的完整变化', '地图从简单目的地选择扩展为可操作的航线规划，并通过纸卷展开接回邮件准备和出航流程。'),
                ('课程知识的落实', '以玩家任务决定信息层级，用操作与系统状态形成反馈闭环；失败可恢复，返回保留状态。'),
                ('查看与体验', '教师演示：保存邮件至出航。在线完整原型保留全流程。航点用于规划与许可，船舶物理仍沿用原航行引擎。')],
         footer='原创虚构海图 · 1920 × 1080 游戏界面 · 离线教师 HTML 内嵌代码与素材'),
]
sections = []
for number, page in enumerate(pages, 1):
    notes = ''.join(f'<section><h2>{escape(title)}</h2><p>{escape(text)}</p></section>' for title, text in page['notes'])
    sections.append(f'''<article class="sheet" aria-labelledby="page{number}-title">
<header><div><span class="chapter">{page['chapter']}</span><h1 id="page{number}-title">{page['title']}</h1></div><div class="identity">{page['state']}<br>{page['detail']}</div></header>
<div class="content"><figure><img src="submission-assets/{page['image']}" alt="{page['caption']}"><figcaption>{page['caption']}</figcaption></figure><div class="notes">{notes}</div></div>
<footer><span>{page['footer']}</span><span>{number:02} / 06</span></footer></article>''')
sections[-1] = sections[-1].replace('教师演示：保存邮件至出航。在线完整原型保留全流程。', '<a href="https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/teacher-demo.html">教师快速演示</a> · <a href="https://funfan-gif.github.io/TIDAL-POST-UI-low-oringe/">在线完整原型</a><br>')
html = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>潮汐邮局 · 第四周课程提交</title><link rel="icon" href="data:,"><link rel="stylesheet" href="submission-board.css?v=4.2.0"></head><body>
<nav class="document-tools" aria-label="提交材料"><strong>潮汐邮局 · 第四周提交</strong><span><a href="submission-board.pdf" download>下载六页 PDF</a><a href="../teacher-demo.html">教师快速演示</a><a href="../index.html">完整交互原型</a></span></nav>
<main class="submission">''' + '\n'.join(sections) + '</main></body></html>\n'
css = '''*{box-sizing:border-box}
body{margin:0;background:#315451;color:#294752;font-family:"Microsoft YaHei",sans-serif}
.document-tools{display:flex;justify-content:space-between;align-items:center;gap:20px;max-width:1122px;margin:0 auto;padding:22px 0;color:#f4efe5;font-size:14px}
.document-tools span{display:flex;gap:12px}.document-tools a{border:1px solid #a9c3b9;padding:9px 14px;border-radius:3px}
a{color:inherit;text-decoration:none}a:hover{text-decoration:underline}a:focus-visible{outline:3px solid #d6a64c;outline-offset:3px}
.submission{padding-bottom:30px}
.sheet{width:1122px;height:793px;margin:0 auto 30px;padding:32px 38px;display:grid;grid-template-rows:64px 1fr 30px;gap:12px;background:#f4efe5;box-shadow:0 15px 30px #132e3433;overflow:hidden}
header{display:flex;justify-content:space-between;align-items:center;gap:24px}
.chapter{display:block;font:13px "Microsoft YaHei",sans-serif;color:#55776b;margin-bottom:5px}
h1{font:29px/1.25 "KaiTi","STKaiti","SimSun",serif;margin:0}
.identity{text-align:right;flex-shrink:0;font:14px/1.6 "KaiTi","SimSun",serif;color:#60776b}
.content{display:grid;grid-template-rows:536px 1fr;gap:10px;min-height:0}
figure{margin:0;display:grid;grid-template-rows:510px 26px}
figure img{width:100%;height:510px;object-fit:contain;background:#25494a}
figcaption{font-size:11px;line-height:26px;color:#60766e;white-space:nowrap}
.notes{display:grid;grid-template-columns:1fr 1fr 1.18fr;gap:26px;min-height:0}
h2{font:17px/1.3 "KaiTi","SimSun",serif;margin:0 0 5px}
.notes p{font-size:12px;line-height:1.7;margin:0;color:#536f65}
.notes a{text-decoration:underline;text-underline-offset:3px}
footer{display:flex;justify-content:space-between;align-items:end;font-size:10px;color:#73857b;border-top:1px solid #b9c7b8;padding-top:9px}
@media screen and (max-width:1160px){.document-tools{padding:18px;flex-wrap:wrap}.sheet{width:calc(100% - 32px);height:auto;padding:24px;grid-template-rows:auto 1fr auto}.content{grid-template-rows:auto auto}figure{grid-template-rows:auto auto}figure img{height:auto;aspect-ratio:16/9}figcaption{white-space:normal;line-height:1.5;padding:8px 0}.notes{gap:16px}.identity{font-size:12px}h1{font-size:25px}}
@media screen and (max-width:650px){header{display:block}.identity{text-align:left;margin-top:10px}.notes{grid-template-columns:1fr}.document-tools span{flex-wrap:wrap}footer{gap:20px;line-height:1.5}}
@page{size:A4 landscape;margin:0}
@media print{body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}.document-tools{display:none}.submission{padding:0}.sheet{width:297mm;height:210mm;margin:0;box-shadow:none;break-after:page;page-break-after:always}.sheet:last-child{break-after:auto;page-break-after:auto}}
'''
(root / 'week4/submission-board.html').write_text(html, encoding='utf-8')
(root / 'week4/submission-board.css').write_text(css, encoding='utf-8')
print('Built six-page submission-board.html and print stylesheet')
