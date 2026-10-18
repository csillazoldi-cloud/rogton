# Tibor a munka ELEJÉN — rajz-zár és kirakás-ellenőrzés (R-15)

Vilmos, 2026-09-26: „miért a kirakásnál nézi Tibor? miért nem a munka, a kódolás elkezdése előtt?”
Ezért a sorrend:

## 1. Rajz-zár — KÓDOLÁS ELŐTT (ez a fő kapu)

1. A Design megrajzolja a lapot (`.dc.html`, asztali 1440 + telefon 390).
2. **Rajz-próba** (felhő, Playwright): `python3 tools/tibor-proba/rajz_proba.py <rajz.dc.html> --ki rajz-<lap>`
   — minden képernyőt kiemel a vászonból, és ugyanazzal a mérővel méri, mint az élő lapot (T1–T10 számai).
3. **Tibor-bíráló** (ahol az Ollama elérhető — ma a Mac Linux-környezete): `python3 tools/tibor-biro/tibor_biro.py --ki rajz-<lap> --max 3`
   (ismételve, amíg 0-val vagy 1-gyel nem lép ki; lapnézetenként ~1 perc).
4. **Rajz-zár:** `python3 tools/tibor-proba/zar.py --ki rajz-<lap> --rajz`
   - NYITVA → kódolható.
   - ZÁRVA → vissza a Designhoz, a `jelentes.md` + `biralat.md` sorával: mit nem értett Tibor, hova nyomott volna.

## 2. Építés után, a kirakásnál — csak ellenőrzés

A kész lapon ugyanaz fut (`tibor_proba.py` → `tibor_biro.py --csak <lap>` → `zar.py`): azt nézi, hogy **jól építettem-e meg**
a rajzot, és hogy semmi más nem romlott (`alap.json`, a racsni csak felfelé mozdul, `--frissit`). Ha zárva: javítás vagy `git revert`.
A teljes, 30 lapnézetes bírálat naponta egyszer elég.

## A rajz szerződése (a Designnak, `design/R15/R15-KIEGESZITES-2.md`)

- Egy képernyő = egy elem `data-r15-kepernyo="telefon"` vagy `"asztali"` jelöléssel, a lap neve a befoglaló `section[data-screen-label]`.
- Teljes képernyő, nem részlet; az első képernyő 390×844 / 1440×900 — ezt nézi Tibor görgetés nélkül.
- A fő gomb `data-r15="fo-gomb"`, a többi alapelem a `tokenek.md` 3. pontja szerint jelölve.
- Jelölés nélkül a próba becsül (390/1440 széles legkülső doboz; a fő gomb a látványból) — és jelzi, hogy becsült.

**Kipróbálva (09-26, a szabálylapon):** a T2 jó és rossz példája: a próba a jót zöldnek, a rosszat pirosnak mérte;
a bíráló a jóra 6 pontot (sárga), a rosszra 4-et és „nem tudom, mi a dolgom”-ot adott. A szabálylap példái részletek,
nem teljes képernyők — ezért a többi példa pirosa ott nem mérvadó.
