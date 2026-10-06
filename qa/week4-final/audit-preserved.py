from pathlib import Path
import hashlib
import json
from datetime import datetime, timezone

out = Path(__file__).resolve().parent
root = out.parent.parent
manifest = json.loads((out / 'preserved-hashes.json').read_text(encoding='utf-8'))
changed = [name for name, expected in manifest.items() if hashlib.sha256((root / name).read_bytes()).hexdigest() != expected]
report = {'auditedAt': datetime.now(timezone.utc).isoformat(), 'protected': len(manifest), 'changed': changed,
          'authorizedChanges': ['week4/index.html', 'week4/submission-board.html', 'week4/submission-board.css', 'week4/README.md'], 'passed': not changed}
(out / 'preservation-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
# Refresh the final hash assertion after the corresponding README documentation update.
qa = json.loads((out / 'qa-report.json').read_text(encoding='utf-8'))
for assertion in qa['assertions']:
    if assertion['name'].startswith('All ') and 'protected' in assertion['name']:
        assertion.update(name=f'All {len(manifest)} protected map logic, old QA, assets and original sailing/styles files remain byte-identical', passed=not changed,
                         detail={'protected': len(manifest), 'changed': changed, 'auditedAt': report['auditedAt']})
(out / 'qa-report.json').write_text(json.dumps(qa, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps(report))
if changed:
    raise SystemExit(1)
