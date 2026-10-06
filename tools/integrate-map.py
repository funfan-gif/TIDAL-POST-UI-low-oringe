"""Extract the preserved Week4 screen; scope its CSS and wrap its route controller."""
from pathlib import Path
import re

root = Path(__file__).resolve().parent.parent
old = (root / 'qa/map-reveal/source-before/index.html').read_text(encoding='utf-8')
final = (root / 'week4/index.html').read_text(encoding='utf-8')
main = final[final.index('<main class="game-stage"'):final.index('</main>') + 7]
main = re.sub(r'(href|src)="assets/', r'\1="week4/assets/', main)
main = main.replace('../assets/', 'assets/')
main = main.replace('href="../index.html?capture=03-mailbag"', 'href="#mailbag" data-action="map-back"')
main = main.replace('href="../index.html?capture=05-sailing"', 'href="#sailing" data-action="start-sailing"')
main = main.replace('<h1>邮务航海图桌', '<h1 id="mapTitle" tabindex="-1">邮务航海图桌')
start = old.index('      <section class="screen" data-screen="map"')
end = old.index('      <section class="screen sailing-screen"', start)
integrated = '<section class="screen integrated-map" data-screen="map" aria-labelledby="mapTitle" hidden>\n' + main + '\n</section>\n\n'
page = old[:start] + integrated + old[end:]
page = page.replace('  <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>\n', '')
page = page.replace('  <script src="app.js?v=3.0.0" defer></script>', '  <link rel="stylesheet" href="route-map.css">\n  <link rel="stylesheet" href="map-reveal.css">\n  <script src="route-map.js" defer></script>\n  <script src="map-reveal.js" defer></script>\n  <script src="app.js?v=4.1.0" defer></script>')
page = page.replace('<title>潮汐邮局｜V3 Game-ready Mid-Fi</title>', '<title>潮汐邮局｜完整课程原型</title>')
page = page.replace('《潮汐邮局》Week 2 V3 Game-ready Mid-Fi 可交互原型', '《潮汐邮局》完整课程原型：邮袋、纸卷摊图、航线规划、航行与投递')
page = page.replace('潮汐邮局 V3 可交互原型', '潮汐邮局完整课程原型')
page = page.replace('  <link rel="icon" href="data:,">', '  <link rel="icon" href="data:,">\n' + '\n'.join('  <link rel="preload" as="image" href="week4/assets/art-pass-02/' + name + '">' for name in ('cabin-surface.svg', 'ledger-paper.svg', 'dispatch-frame.svg')))
page = page.replace('前往群岛地图', '查看航海图').replace('V3 GAME-READY MID-FI', 'TIDAL POST · COURSE PROTOTYPE')
page = page.replace('<strong>选择航线</strong>', '<strong>规划航线</strong>').replace('目的地必须可达', '避开浅滩后确认航线')
page = page.replace('<div><dt>航程</dt><dd>2.4 海里</dd></div>\n              <div><dt>状态', '<div><dt>规划航程</dt><dd id="resultRouteDistance">2.4 海里</dd></div>\n              <div><dt>状态')
(root / 'index.html').write_text(page, encoding='utf-8')

def scope_css(source):
    source = re.sub(r'/\*.*?\*/', '', source, flags=re.S)
    source = source.replace('url("assets/', 'url("week4/assets/')
    result = []
    pos = 0
    while pos < len(source):
        brace = source.find('{', pos)
        if brace < 0:
            break
        prelude = source[pos:brace].strip()
        depth, end, quote = 1, brace + 1, None
        while depth:
            char = source[end]
            if quote:
                if char == quote and source[end - 1] != '\\':
                    quote = None
            elif char in ('"', "'"):
                quote = char
            elif char == '{':
                depth += 1
            elif char == '}':
                depth -= 1
            end += 1
        body = source[brace + 1:end - 1]
        if prelude.startswith('@media'):
            result.append(prelude + '{' + scope_css(body) + '}')
        elif prelude.startswith('@'):
            result.append(prelude + '{' + body + '}')
        else:
            selectors = []
            for selector in prelude.split(','):
                selector = selector.strip()
                if selector in (':root', 'body'):
                    selectors.append('.integrated-map')
                else:
                    selectors.append('.integrated-map ' + selector)
            result.append(',\n'.join(selectors) + '{' + body + '}')
        pos = end
    return '\n'.join(result) + '\n'

css = '/* Extracted from preserved Week4 styles; only selectors and asset URLs are scoped. */\n'
for name in ('week4-map.css', 'art-pass-02.css', 'art-pass-03.css'):
    css += scope_css((root / 'week4' / name).read_text(encoding='utf-8'))
css += '''
.prototype-frame.map-mode { position:static; border:0; width:100vw; height:100vh; aspect-ratio:auto; display:block; background:transparent; box-shadow:none; }
.prototype-frame.map-mode > .topbar, .prototype-frame.map-mode > .bottombar { display:none; }
.integrated-map.screen { position:fixed; inset:0; z-index:20; padding:0; gap:0; min-height:0; width:100vw; height:100vh; overflow:hidden; animation:none; font-size:16px; line-height:normal; }
.integrated-map img { max-width:none; display:inline; }
.integrated-map .game-stage { font-size:16px; line-height:normal; }
.integrated-map .desk-heading h1 { letter-spacing:.05em; }
'''
(root / 'route-map.css').write_text(css, encoding='utf-8')

js = (root / 'week4/week4-map.js').read_text(encoding='utf-8')
js = js.replace('(() => {', 'window.TidalRouteMap = { create(root, options = {}) {', 1)
js = js.replace('document.querySelector(selector)', 'root.querySelector(selector)')
js = js.replace('document.querySelectorAll(', 'root.querySelectorAll(')
js = js.replace('tidalPost.week4.route.v1', 'tidalPost.prototype.route.v1')
js = js.replace('  let result;', '  let result;\n  let enabled = true;')
js = js.replace('    persist();\n  }', '    persist();\n    options.onChange?.(structuredClone({ start: port, destination, waypoints, confirmed, ...result }));\n  }', 1)
js = js.replace('if (event.button !== 0) return;', 'if (!enabled || event.button !== 0) return;')
js = js.replace('      const delta = event.shiftKey', '      if (!enabled) return;\n      const delta = event.shiftKey')
js = js.replace('    if (!recompute().valid) return;', '    if (!enabled || !recompute().valid) return;')
start_reset = js.index('  $("#reset-route").addEventListener')
end_reset = js.index('  $("#confirm-route").addEventListener', start_reset)
js = js[:start_reset] + '''  function resetRoute({ discardSaved = false } = {}) {
    waypoints = safeWaypoints.map(p => ({ ...p })); confirmed = false; lastMoved = 0;
    try { sessionStorage.removeItem("tidalPost.plannedRoute"); if (discardSaved) sessionStorage.removeItem(storageKey); } catch { }
    $("#confirmation").close();
    if (!root.hidden) render();
  }
  $("#reset-route").addEventListener("click", () => { if (enabled) resetRoute(); });
''' + js[end_reset:]
js = js.replace('// The visible hazard shape and the collision shape are the same source of truth.', '// Art Pass 03 visual assets are separate from the preserved SVG collision proxies.')
js = js.removesuffix('})();\n') + '''  return {
    getState: window.__tidalRoute.getState,
    refresh() { fitStage(); render(); },
    setEnabled(value) { enabled = Boolean(value); stage.inert = !enabled; },
    reset: resetRoute,
    invalidateConfirmation() { confirmed = false; try { sessionStorage.removeItem("tidalPost.plannedRoute"); } catch {} if (!root.hidden) render(); else persist(); },
    closeConfirmation() { $("#confirmation").close(); }
  };
} };
'''
(root / 'route-map.js').write_text(js, encoding='utf-8')
print('Integrated final map DOM, scoped CSS and reusable controller; Week4 untouched.')
