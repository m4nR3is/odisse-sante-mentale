"""Download the exact regional reports used for the financial gradients.
PDFs stay outside the delivered site. Run before extract_regional_social.py.
"""
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / 'tmp/pdfs/barometre-regional'
reports = json.loads((ROOT / 'data/raw/barometre-regional/social-regional-extracted.json').read_text())['reports']
OUTPUT.mkdir(parents=True, exist_ok=True)
for report in reports:
    path = OUTPUT / (report['code'] + '.pdf')
    if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == report['sha256']:
        continue
    with urlopen(Request(report['url'], headers={'User-Agent': 'Mozilla/5.0'}), timeout=90) as response:
        content = response.read()
    if hashlib.sha256(content).hexdigest() != report['sha256']:
        raise SystemExit(f"Source changed: {report['name']}. Review before replacing the recorded export.")
    path.write_bytes(content)
(OUTPUT / 'manifest.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2) + '\n')
print(f'{len(reports)} verified reports in {OUTPUT}')
