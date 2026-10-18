# A hf.* feliratok adatfájljának (JSON) utánhúzása a migrációkból: a migrációk sorrendjében az utolsó érték nyer.
import json,re,glob,sys,os
import pathlib; REPO=str(pathlib.Path(__file__).resolve().parents[2])
sql_fajlok=sorted(glob.glob(f'{REPO}/apps/web/adatbazis/migraciok/*.sql'))
ertek={'hu':{},'ro':{},'en':{}}
minta=re.compile(r"\('(hf\.[^']+)',\s*'(hu|ro|en)',\s*'((?:[^']|'')*)'\)")
for f in sql_fajlok:
    s=open(f,encoding='utf-8').read()
    for k,ny,sz in minta.findall(s):
        ertek[ny][k]=sz.replace("''","'")
valt=0
for ny in ('hu','ro','en'):
    p=f'{REPO}/packages/news-monitor-feliratok/feliratok/hf.{ny}.json'
    j=json.load(open(p,encoding='utf-8'))
    uj=dict(j)
    for k,v in ertek[ny].items():
        if uj.get(k)!=v: uj[k]=v; valt+=1
    hianyzo=[k for k in ertek[ny] if k not in j]
    kulonbozo=[k for k in j if k in ertek[ny] and ertek[ny][k]!=j[k]]
    print(ny, 'json volt', len(j), '→', len(uj), '| hiányzott', len(hianyzo), '| eltért', len(kulonbozo), kulonbozo[:5])
    out=json.dumps(dict(sorted(uj.items())),ensure_ascii=False,indent=2)+'\n'
    open(p,'w',encoding='utf-8').write(out)
print('változás:',valt)
