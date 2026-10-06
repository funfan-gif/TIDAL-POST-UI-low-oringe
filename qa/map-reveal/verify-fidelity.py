"""Compare browser evidence pixels without changing either source image."""
from pathlib import Path
from PIL import Image, ImageChops
import json

out = Path(__file__).resolve().parent
a = Image.open(out / 'source-neutral.png').convert('RGBA')
b = Image.open(out / '06-map-ready-final.png').convert('RGBA')
diff = ImageChops.difference(a, b)
pixels = list(diff.get_flattened_data())
changed = sum(any(p[:3]) for p in pixels)
report = {'viewport': list(a.size), 'changedPixels': changed,
          'ratio': changed / (a.width * a.height),
          'maxChannelDelta': max(max(p[:3]) for p in pixels),
          'passed': changed == 0,
          'conditions': 'Same Edge, 1920×1080, neutral cursor, blurred focus, default safe route.'}
(out / 'fidelity-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
diff.save(out / 'fidelity-diff.png')
print(json.dumps(report))
