"""Build the Pages source from the user's original HTML. Does not modify the input file."""
from pathlib import Path
import sys,re,base64,hashlib,json,io
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
source=Path(sys.argv[1]);root=Path(__file__).resolve().parents[1];site=root/'site';assets=site/'assets';assets.mkdir(exist_ok=True,parents=True)
raw=source.read_bytes();html=raw.decode('utf8')
pattern=re.compile(r'data:([A-Za-z0-9.+-]+/[A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)')
items={m.group(0):(m.group(1),m.group(2)) for m in pattern.finditer(html)}
def export(item):
 uri,(mime,value)=item;data=base64.b64decode(value);old_sha=hashlib.sha256(data).hexdigest();ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg','font/woff2':'woff2','font/woff':'woff','application/font-woff':'woff','application/x-font-ttf':'ttf'}.get(mime,mime.split('/')[-1].replace('+','_'))
 # Lossless WebP only when smaller; dimensions and pixels are verified.
 if mime=='image/png':
  im=Image.open(io.BytesIO(data))
  if not getattr(im,'is_animated',False):
   buf=io.BytesIO();im.save(buf,format='WEBP',lossless=True,exact=True,method=4);candidate=buf.getvalue()
   if len(candidate)<len(data):
    check=Image.open(io.BytesIO(candidate))
    if check.size==im.size and check.convert('RGBA').tobytes()==im.convert('RGBA').tobytes():
     data=candidate;ext='webp'
 name=hashlib.sha256(data).hexdigest()[:24]+'.'+ext;p=assets/name
 if not p.exists():p.write_bytes(data)
 return uri,'./assets/'+name,{'source_sha256':old_sha,'path':'assets/'+name,'bytes':len(data),'mime':mime}
rows=list(ThreadPoolExecutor(max_workers=4).map(export,items.items()));mapping={u:p for u,p,m in rows};html=pattern.sub(lambda m:mapping[m.group(0)],html)
# Remove the obsolete sidebar CSS patch and renderer patch, retaining all learning code.
start=html.index('/* Chỉ tác động sidebar; không đổi kích thước cột hay cấu trúc nội dung bên phải. */')
end=html.index('/* Đánh số hiển thị độc lập với ID trò chơi;',start);html=html[:start]+html[end:]
start=html.index('function sbSidebarMarkup(');end=html.index('// Chỉ gắn phạm vi cân đối cho menu Luyện tập',start)
html=html[:start]+'function sbMount(){}\n\n'+html[end:]
# External image paths need not be converted back into Blob URLs.
for name,arg in [('care3ImageUrl','uri'),('sp500ImageUrl','uri'),('vuImageUrl','uri'),('tpImageUrl','uri')]:
 html=html.replace('function '+name+'('+arg+'){try{','function '+name+'('+arg+'){if(!'+arg+'.startsWith("data:"))return '+arg+';try{')
html=html.replace('function school500ImageSource(){try{','function school500ImageSource(){if(!SCHOOL500_REFERENCE.startsWith("data:"))return SCHOOL500_REFERENCE;try{').replace('function pgImageSource(){try{','function pgImageSource(){if(!PG_REFERENCE.startsWith("data:"))return PG_REFERENCE;try{')
# Delete old UI buttons/config pane and their code path. No endpoint/key input remains.
start=html.index('<div class="dt-tools"><button');end=html.index('<div class="dt-log"',start);html=html[:start]+html[end:]
start=html.index('<section class="dt-config" hidden>');end=html.index('</section></section>`',start);html=html[:start]+html[end+10:]
html=re.sub(r'^function dtConfig\(\).*$',"function dtConfig(){return {url:window.DAI_NGAN_CONFIG?.tutorEndpoint||'',enabled:!!window.DAI_NGAN_CONFIG?.tutorEndpoint}}",html,flags=re.M)
html=re.sub(r'^function dtSettings\(show\).*$',"function dtSettings(){dtToggle(true)}",html,flags=re.M)
html=re.sub(r'^function dtSaveConfig\(\).*$',"function dtSaveConfig(){}",html,flags=re.M)
# Consolidate all 3 dtRemote definitions into one implementation in tutor.js.
html=re.sub(r'^(?:async function dtRemote\(|dtRemote=async function\().*\n','',html,flags=re.M)
html=html.replace('const bkOriginalRemote=dtRemote;','')
# Final settings override depended on the removed pane; remove it.
html=re.sub(r'^const csPreviousSettings=dtSettings;dtSettings=.*\n','',html,flags=re.M)
html=re.sub(r'^function dtToggle\(open\).*$',"function dtToggle(open){dtState.open=!!open;const h=document.getElementById('dn-tutor');h.querySelector('.dt-panel').hidden=!open;h.querySelector('.dt-launch').hidden=!!open;h.querySelector('.dt-launch').setAttribute('aria-expanded',String(!!open));if(open)h.querySelector('textarea').focus();else{dtCancel();stopSpeech();h.querySelector('.dt-launch').focus()}}",html,flags=re.M)
# Source UI cleanup at its origin; the book grade/context selector is retained.
html=html.replace("const cfg=h.querySelector('.dt-config');if(cfg&&!cfg.querySelector('.bk-ai-disclosure'))", "const cfg=null;if(cfg&&!cfg.querySelector('.bk-ai-disclosure'))")
html=html.replace("h.querySelector('.dt-tools').after(box)","h.querySelector('.dt-head').after(box)")
html=html.replace('boot();</script>', '</script>')
scripts=re.findall(r'<script>([\s\S]*?)</script>',html);assert len(scripts)==1
core=scripts[0];html=html.replace('<script>'+core+'</script>','<script src="./public-config.js"></script>\n<script src="./app-core.js"></script>\n<script src="./app-shell.js"></script>\n<script src="./tutor.js"></script>\n<script src="./start.js"></script>')
html=html.replace('<div id="app"></div>','<div id="dn-shell"><aside id="sb" aria-label="Menu chính"></aside><main id="view"><div id="app"></div></main></div>')
styles=re.findall(r'<style([^>]*)>([\s\S]*?)</style>',html);css='\n'.join(x[1] for x in styles);html=re.sub(r'<style[^>]*>[\s\S]*?</style>','',html);html=html.replace('</head>','<link rel="stylesheet" href="./app-core.css"><link rel="stylesheet" href="./app-shell.css"></head>')
(site/'index.html').write_text(html);(site/'app-core.js').write_text(core);(site/'app-core.css').write_text(css)
# Compare embedded learning data as JSON; only visualMap data URIs are path-rewritten.
def learning(text):
 d=json.loads(re.search(r'window.EMBEDDED_DATA=(.*?);\s*(?:\n|const)',text,re.S)[1]);d['content'].pop('visualMap',None);return d
assert learning(raw.decode())==learning(core)
manifest={'source_name':source.name,'source_bytes':len(raw),'source_sha256':hashlib.sha256(raw).hexdigest(),'embedded_occurrences':len(pattern.findall(raw.decode())),'unique_data_uris':len(items),'files':list({m['path']:m for _,_,m in rows}.values()),'learning_data_equal':True,'asset_bytes':sum(p.stat().st_size for p in assets.iterdir())}
(root/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in manifest.items() if k!='files'},ensure_ascii=False));print('HTML',len(html.encode()),'JS',len(core.encode()),'CSS',len(css.encode()))
