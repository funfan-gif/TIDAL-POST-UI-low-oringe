"""Embed the established Mission → Result prototype into the offline Harbor HTML."""
from pathlib import Path
from io import BytesIO
import base64
import json
import mimetypes
import re
import subprocess
from PIL import Image

root = Path(__file__).resolve().parent.parent
output = root / '效果查看/index.html'
source_revision = 'af25838e9783f6c39a06a2720ddcf2420fed79b2'
cache = {}


def historical(name):
    return subprocess.check_output(
        ['git', 'show', f'{source_revision}:{name}'], cwd=root
    ).decode('utf-8')


def data_uri(file):
    file = file.resolve()
    if not file.is_relative_to(root):
        raise ValueError(f'Asset outside project: {file}')
    if file not in cache:
        mime = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        content = file.read_bytes()
        if file.suffix.lower() == '.png':
            image = Image.open(BytesIO(content)).convert('RGBA')
            image.thumbnail((1400, 930) if file.name == 'sea-paper.png' else (420, 420), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            image.save(buffer, format='WEBP', quality=94, method=6)
            content, mime = buffer.getvalue(), 'image/webp'
        cache[file] = f'data:{mime};base64,' + base64.b64encode(content).decode('ascii')
    return cache[file]


def asset_url(url, directory):
    if url.startswith(('data:', '#')):
        return url
    if url.startswith(('http:', 'https:', '//')):
        raise ValueError(f'Unexpected network asset: {url}')
    return data_uri(directory / url.split('?', 1)[0])


page = historical('index.html')
page = re.sub(r'\s*<link[^>]+rel="preload"[^>]*>', '', page)


def inline_css(match):
    file = root / match[1].split('?', 1)[0]
    css = file.read_text(encoding='utf-8')
    css = re.sub(r'url\([\"\']?([^\)\"\']+)[\"\']?\)',
                 lambda m: 'url("' + asset_url(m[1], file.parent) + '")', css)
    return '<style>' + css + '</style>'


page = re.sub(r'<link rel="stylesheet" href="([^"]+)"\s*/?>', inline_css, page)
scripts = []


def inline_script(match):
    file = root / match[1].split('?', 1)[0]
    script = historical('app.js') if file.name == 'app.js' else file.read_text(encoding='utf-8')
    if file.name == 'app.js':
        script = script.replace('const capturePreset = query.get("capture");', 'const capturePreset = "02-mission";')
        hook = '''const navigateInsidePrototype = navigate;
navigate = function(screen, options = {}) {
  if (screen === "harbor") {
    sailing?.stop();
    window.parent.postMessage({type:"tidal-return-harbor", stamps:state.stamps, completed:state.completed}, "*");
    return;
  }
  return navigateInsidePrototype(screen, options);
};
window.addEventListener("message", event => {
  if (event.source === window.parent && event.data?.type === "tidal-open-mission") {
    state.missionReturnTarget = "harbor";
    navigate("mission");
    document.querySelector("#missionTitle")?.focus({preventScroll:true});
  }
});
'''
        script = script.replace('const initialScreen = applyCapturePreset();', hook + '\nconst initialScreen = applyCapturePreset();')
        script += '\nrequestAnimationFrame(() => document.querySelector("#missionTitle")?.focus({preventScroll:true}));'
    # Give the standalone copy its own route storage, including offline-file fallback.
    script = script.replace('tidalPost.prototype.route.v1', 'tidalPost.continuous.route.v1')
    script = script.replace('tidalPost.map.v3', 'tidalPost.continuous.map.v3')
    script = script.replace('tidalPost.plannedRoute', 'tidalPost.continuous.plannedRoute')
    script = re.sub(r'(["\'])(assets/[^"\'\s]+\.(?:png|svg|webp|jpe?g))\1',
                    lambda m: json.dumps(asset_url(m[2], root)), script)
    scripts.append('<script>' + script.replace('</script', '<\\/script') + '</script>')
    return ''


page = re.sub(r'<script src="([^"]+)" defer></script>', inline_script, page)
page = re.sub(r'\b(src|href)="((?:week4/)?assets/[^"]+)"',
              lambda m: m[1] + '="' + asset_url(m[2], root) + '"', page)
reset = '''<script>try{
sessionStorage.removeItem("tidalPost.continuous.route.v1");
sessionStorage.removeItem("tidalPost.continuous.map.v3");
sessionStorage.removeItem("tidalPost.continuous.plannedRoute");
}catch{}</script>'''
page = page.replace('</body>', reset + '\n'.join(scripts) + '</body>')
encoded = base64.b64encode(page.encode('utf-8')).decode('ascii')
shell = output.read_text(encoding='utf-8')
pattern = r'(<script id="legacyPrototype" type="application/octet-stream">)[\s\S]*?(</script>)'
shell, count = re.subn(pattern, lambda m: m[1] + encoded + m[2], shell)
if count != 1:
    raise ValueError('Standalone prototype payload marker is missing or duplicated')
output.write_text(shell, encoding='utf-8')
print(f'{output}: {output.stat().st_size:,} bytes; {len(cache)} embedded assets; all screens offline')
