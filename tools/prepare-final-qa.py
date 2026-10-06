"""Rerun the existing flow checks against final timing without overwriting old evidence."""
from pathlib import Path
import json
import re
import hashlib

root = Path(__file__).resolve().parent.parent
out = root / 'qa/week4-final'
script = (root / 'qa/map-reveal/qa-integration.mjs').read_text(encoding='utf-8')
script = script.replace('1720', '5500').replace('await seek(p,350)', 'await seek(p,500)').replace('await seek(p,1330)', 'await seek(p,5080)')
timing = '''function timeAt(progress){
  const frames=[[0,0,.45,0,.7,1],[.18,.08,.25,.2,.4,1],[.44,.34,.4,0,.6,1],[.58,.42,.25,.15,.35,1],[.84,.9,.25,.5,.35,1],[1,1]];
  const bez=(t,p,q)=>3*(1-t)**2*t*p+3*(1-t)*t*t*q+t**3;
  const i=frames.findIndex((f,j)=>j<frames.length-1&&progress>=f[1]&&progress<=frames[j+1][1]);
  const a=frames[i],b=frames[i+1],v=(progress-a[1])/(b[1]-a[1]);let low=0,high=1;
  for(let n=0;n<35;n++){const m=(low+high)/2;if(bez(m,a[3],a[5])<v)low=m;else high=m;}
  return 500+4500*(a[0]+(b[0]-a[0])*bez((low+high)/2,a[2],a[4]));
}'''
script = re.sub(r'function timeAt\(progress\)\{.*?\}\nasync function point', timing+'\nasync function point', script, flags=re.S)
script = script.replace("mask35.includes('65%')", "Math.abs(parseFloat(mask35.match(/inset\\(0px ([\\d.]+)%/)[1])-65)<.001")
allowed = {'week4/index.html', 'week4/submission-board.html', 'week4/submission-board.css', 'week4/README.md'}
manifest = json.loads((root / 'qa/map-reveal/preserved-hashes.json').read_text(encoding='utf-8'))
manifest = {name: value for name, value in manifest.items() if name not in allowed}
script = script.replace('All 161 protected Week4, old QA, assets and original sailing/styles files remain byte-identical', f'All {len(manifest)} protected map logic, old QA, assets and original sailing/styles files remain byte-identical')
(out / 'qa-integration.mjs').write_text(script, encoding='utf-8')
(out / 'preserved-hashes.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
before_readme = (root / 'week4/README.md').read_text(encoding='utf-8')
before_readme = re.sub(r'^当前正式提交文件为.*?\n\n', '', before_readme, flags=re.M)
before_readme = re.sub(r'^本轮新增 `paper-wear.css`.*?\n\n', '', before_readme, flags=re.M)
original_manifest = json.loads((root / 'qa/map-reveal/preserved-hashes.json').read_text(encoding='utf-8'))
for candidate in (before_readme.encode('utf-8'), before_readme.replace('\n', '\r\n').encode('utf-8')):
    if hashlib.sha256(candidate).hexdigest() == original_manifest['week4/README.md']:
        (out / 'source-before/week4-README.md').write_bytes(candidate)
        break
else:
    raise ValueError('Could not verify the original Week4 README backup')
print(f'Prepared existing integration checks; {len(manifest)} protected files, 4 authorized Week4 entry/submission/documentation edits')
