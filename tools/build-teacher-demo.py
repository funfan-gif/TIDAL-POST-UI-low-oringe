"""Package the actual course prototype into one offline teacher-demo HTML."""
from pathlib import Path
import base64
import mimetypes
import re
from io import BytesIO
from PIL import Image

root = Path(__file__).resolve().parent.parent
cache = {}

def data_uri(file):
    file = file.resolve()
    if not file.is_relative_to(root):
        raise ValueError(f'Asset outside project: {file}')
    if file not in cache:
        mime = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        content = file.read_bytes()
        if file.suffix.lower() == '.png':
            # Optimize the embedded display copy; never modify the original coursework assets.
            image = Image.open(BytesIO(content)).convert('RGBA')
            image.thumbnail((1400, 930) if file.name == 'sea-paper.png' else (384, 384), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            image.save(buffer, format='WEBP', quality=94, method=6)
            content, mime = buffer.getvalue(), 'image/webp'
        cache[file] = f'data:{mime};base64,' + base64.b64encode(content).decode('ascii')
    return cache[file]

def asset_url(url, directory):
    if url.startswith(('data:', '#', 'http:', 'https:')):
        return url
    return data_uri(directory / url.split('?', 1)[0])

page = (root / 'index.html').read_text(encoding='utf-8')
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
    script = file.read_text(encoding='utf-8')
    if file.name == 'app.js':
        # Start from the saved-mail task without reading/writing the main prototype session.
        script = script.replace('const capturePreset = query.get("capture");', 'const capturePreset = "03-mailbag";')
        old = '\'<img src="assets/icons/\' + (valid ? "03_mailbag.png" : "02_commission.png") + \'" alt="">'
        new = '\'<img src="\' + (valid ? "' + data_uri(root / 'assets/icons/03_mailbag.png') + '" : "' + data_uri(root / 'assets/icons/02_commission.png') + '") + \'" alt="">'
        if old not in script:
            raise ValueError('Mailbag preview asset replacement is out of date')
        script = script.replace(old, new)
    if file.name == 'route-map.js':
        script = script.replace('tidalPost.prototype.route.v1', 'tidalPost.teacher.route.v1').replace('tidalPost.plannedRoute', 'tidalPost.teacher.plannedRoute')
    if file.name == 'sailing.js':
        for name in ('05_sail_selected.png', '06_deliver.png'):
            script = script.replace('assets/icons/' + name, data_uri(root / 'assets/icons' / name))
    scripts.append('<script>' + script.replace('</script', '<\\/script') + '</script>')
    return ''

page = re.sub(r'<script src="([^"]+)" defer></script>', inline_script, page)
page = re.sub(r'\b(src|href)="((?:week4/)?assets/[^"]+)"',
              lambda m: m[1] + '="' + asset_url(m[2], root) + '"', page)
reset = '<script>try{sessionStorage.removeItem("tidalPost.teacher.route.v1");sessionStorage.removeItem("tidalPost.teacher.plannedRoute");}catch{}</script>'
page = page.replace('</body>', reset + '\n'.join(scripts) + '</body>')
encoded = base64.b64encode(page.encode('utf-8')).decode('ascii')
template = (root / 'tools/teacher-demo.template.html').read_text(encoding='utf-8')
output = template.replace('__PROTOTYPE_BASE64__', encoded)
(root / 'teacher-demo.html').write_text(output, encoding='utf-8')
print(f'teacher-demo.html: {len(output.encode("utf-8")):,} bytes; {len(cache)} embedded assets; no external runtime files')
