# @km/vizual-core

## 1. Mit csinál

Sablonból (recept) és a fiók arculatából (márkaréteg) közösségi médiás képet állít össze.
A recept csak azt mondja meg, milyen mezők vannak, milyen szerepben, milyen sorrendben és szabályokkal;
a betű, a szín, a logó és az elrendezés a márkarétegből jön. Ugyanaz a recept két fióknál két másképp
kinéző, de egyformán szabályos képet ad.

Részei:
- `marka.ts` — a márkaréteg adatformája (betűk, színek, méretlépcsők, stílusok, elrendezés-változatok receptenként).
- `recept.ts` — a recept adatformája (a `@km/vizual-receptek` csomag JSON-jai).
- `tartalom.ts` — a szerkesztő által kitöltött tartalom alakja.
- `html.ts` — `osszeallit()`: recept + márka + tartalom + választás → önálló HTML-lap (tiszta függvény).
- `meres.ts` — a kész lap mérésének alakja és a böngészőben futtatandó mérőszkript (`MERO_SZKRIPT`, adatként).
- `ellenorzo*.ts` — a szabályrendszer (`szabalyok.json`) egy képre vonatkozó szabályainak ellenőrzése a mérésen.

## 2. Mit kér a befogadótól

- a betűfájlok címét (`OsszeallitasOpciok.betuCim`);
- R-16 K5: KÉT betű (`HelyzetArculat.betu_cim` · `betu_szoveg`, hiányukban a régi `betu`): a cím, a szám és a név (logó helyett) a cím-betűvel,
  minden más a szöveg-betűvel; `sajat_betuk` (≤ 2, `data:font/…` adat-URL) → `@font-face`, mögötte a Public Sans tartalék (a hiányzó ékezetre).
- R-16 K6 (gepezet 13): a `BetuUtvonal` portot (host.ts) — a szöveg körvonala SVG-útvonalként (képpont, alapvonal y = 0, a festék bal
  széle x = 0). A képgyártó valósítja meg fontkittel (`apps/kepgyar/src/betu-utvonal.ts`: karakterenként latin → latin-ext → Public Sans);
  a magban betűolvasó nincs.
- egy böngészőt, amely a HTML-t kirajzolja, lefuttatja a `MERO_SZKRIPT`-et és képet készít róla.
  **Az előnézet és a letöltés ugyanabból a kirajzolásból készüljön** (ugyanaz a böngésző, ugyanazok a kapcsolók) —
  mérve 2026-09-23: két különböző indítású Chromium ugyanarra a lapra a képpontok ~5%-ában eltért.

## 3. Mit ad vissza

R-16 K6: `nevlogoSvg({ nev, stilus: "nev"|"kor"|"negyzet", szinek, valtozat: "vilagos"|"sotet"|"egyszinu"|"negyzetes" }, port)` →
`{ svg, szelesseg, magassag, tinta, szinek }` — tiszta SVG, csak útvonal (nincs `<text>`, szkript, külső hivatkozás); a név nagybetűvel,
40 karaktertől két sorra törve, ami így sem fér, kisebb (levágás soha); `NevlogoKeres` a képgyártó `POST /nevlogo` törzse.

`osszeallit()` → `{ html, kepalairas, hibak }` · `ellenoriz()` → `{ talalatok, kivul, nincs_ellenorzo, tiltott }`.

## 4. Hibakódok (a `hibak` listában)

`HIANYZO_SZIN`, `HIANYZO_STILUS`, `HIANYZO_LEPCSO`, `HIANYZO_EMBLEMA`, `HIANYZO_IKON`, `ERVENYTELEN_ERTEK`,
`ISMERETLEN_ALLAPOT`, `NEM_TAMOGATOTT`.

## 5. Beillesztés

1. A csomag és a `@km/vizual-receptek` felvétele a workspace-be.
2. Egy kirajzoló a befogadóban (a próba-eszköz: `tools/vizual/kepgyar.ts`, Playwright + Chromium).
3. `pnpm --filter @km/vizual-core proba` — böngésző nélkül fut.
