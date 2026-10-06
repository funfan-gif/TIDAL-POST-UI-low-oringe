from pathlib import Path
from PIL import Image, ImageChops, ImageOps, ImageDraw
from pypdf import PdfReader
import json

out = Path(__file__).resolve().parent
root = out.parent.parent
reader = PdfReader(root / 'week4/submission-board.pdf')
titles = ['保存邮件', '展开海图', '目标固定', '解释危险', '确认安全航线', '规划结束']
texts = [p.extract_text() for p in reader.pages]
pdf = {'pages': len(reader.pages), 'pageSizePoints': [list(p.mediabox)[2:] for p in reader.pages],
       'titlesPresent': [title in text for title, text in zip(titles, texts)],
       'charactersPerPage': [len(text) for text in texts], 'links': sum(len(p.get('/Annots', [])) for p in reader.pages)}
pdf['passed'] = pdf['pages'] == 6 and all(pdf['titlesPresent']) and all(n > 200 for n in pdf['charactersPerPage'])
first = Image.open(root / 'week4/submission-assets/03-map-ready.png').convert('RGB')
second = Image.open(out / 'screenshots/standalone-worn-map.png').convert('RGB')
diff = ImageChops.difference(first, second)
changed = sum(any(pixel) for pixel in diff.get_flattened_data())
fidelity = {'size': list(first.size), 'changedPixels': changed, 'passed': changed == 0}
(out / 'pdf-report.json').write_text(json.dumps(pdf, indent=2, ensure_ascii=False), encoding='utf-8')
(out / 'fidelity-report.json').write_text(json.dumps(fidelity, indent=2), encoding='utf-8')
print(json.dumps({'pdf': pdf, 'fidelity': fidelity}, ensure_ascii=False))
if not pdf['passed'] or not fidelity['passed']:
    raise SystemExit(1)
