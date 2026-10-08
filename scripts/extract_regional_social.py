"""Extract financial gradients from the official regional Baromètre 2024 PDF tables.
Requires PyMuPDF. PDFs are downloaded separately to ../tmp/pdfs/barometre-regional.
The compact export retains PDF hashes, page numbers and verbatim table rows.
"""
import json,re,unicodedata
from pathlib import Path
import pymupdf
ROOT=Path(__file__).resolve().parents[1]
PDFS=ROOT.parent/'tmp/pdfs/barometre-regional'
def fold(s):return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').replace('’',"'").lower()
financial=['Vous êtes à l’aise','Ça va','C’est juste, il faut faire attention','Vous y arrivez difficilement ou vous ne pouvez pas y arriver sans faire de dette']
reports=json.loads((PDFS/'manifest.json').read_text());output=[];audit=[]
for report in reports:
 doc=pymupdf.open(PDFS/(report['code']+'.pdf'));topic=None;seen=set()
 for page_index,page in enumerate(doc):
  if page_index < 15: continue  # Exclude summaries and other health chapters.
  text=page.get_text(sort=True);lines=text.splitlines()
  for line in lines:
   plain=fold(line.strip())
   if '...' in plain:continue
   if plain.startswith('episodes depressifs :'):topic='Dépression'
   elif plain.startswith('trouble anxieux generalise :'):topic='Anxiété'
   elif plain.startswith('conduites suicidaires :'):topic='Pensées suicidaires'
  if not topic or topic in seen:continue
  for index,line in enumerate(lines):
   if fold(line.strip()) != 'situation financiere percue':continue
   section=lines[index+1:index+12];extracted=[]
   for row in section:
    plain=fold(row.strip())
    which=0 if re.match(r"a l[' ]aise",plain) else 1 if plain.startswith('ca va') else 2 if plain.startswith("c'est juste") else 3 if plain.startswith("c'est difficile") else None
    if which is None:continue
    nums=list(re.finditer(r'\d+[,.]\d+',row))
    if len(nums)<3:
     audit.append({'region':report['code'],'indicator':topic,'page':page_index+1,'row':row,'status':'Non diffusé (Nd/SD) ou ligne incomplète'});continue
    estimate,low,high=[float(n.group().replace(',','.')) for n in nums[:3]]
    prefix=row[:nums[0].start()];sample=re.search(r'([\d ]+)\s*$',prefix)
    if not sample:raise ValueError(('Sample absent',report['name'],row))
    sample=int(sample.group().replace(' ',''))
    if sample<30:raise ValueError(('Below publication threshold',report['name'],row))
    extracted.append({'territoryCode':report['code'],'territory':report['name'],'indicator':topic,'financial':financial[which],'estimate':estimate,'low':low,'high':high,'sample':sample,'source':report['url']+'#page='+str(page_index+1),'sourcePage':page_index+1,'sourceRow':row.strip(),'intervalValid':0<=low<=estimate<=high<=100})
   if extracted:
    output.extend(extracted);seen.add(topic);break
 audit.append({'region':report['code'],'coverage':sorted(seen)})
payload={'reports':reports,'points':output,'audit':audit,'notes':['Columns Ensemble (all sexes), weighted prevalences and exact confidence intervals; national estimates remain from Odissé.','Les cellules Nd/SD ne valent pas zéro. Guadeloupe, anxiété, à l’aise : Nd malgré n=76 ; aucun rapport financier calculé. Les IC incohérents ne sont pas dessinés.','Occitanie depression: use Table 1, page 56 (28.5%), rather than the inconsistent key-point summary (28.8%).']}
(ROOT/'data/raw/barometre-regional/social-regional-extracted.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
print('Extracted',len(output),'points; intervals inconsistent:',sum(not p['intervalValid'] for p in output))
print(json.dumps(audit,ensure_ascii=False))
