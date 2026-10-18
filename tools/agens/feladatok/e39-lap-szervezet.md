Te egy React/TypeScript fejlesztő vagy egy meglévő Next.js 16 alkalmazásban. A feladat: EGY képernyő
megírása a mellékelt RAJZ szerint. A rajz a mérce: ami nincs rajta, az ne kerüljön a képernyőre;
ami rajta van, az kerüljön rá.

MELLÉKLETEK
1. `Koltseg-szervezet.dc.html` — a RAJZ. A benne lévő szerkezetet és stílust kell átültetni.
   Az adatai mintaadatok; a valódi adat az API-ból jön.
2. `Tema.tsx` — egy MEGLÉVŐ lap ebből az alkalmazásból: ebből másold a szerkezeti mintákat.
3. `tema.css` — a meglévő lap CSS-e: ebből látod, hogyan írunk CSS-t.

AMIT ÍRNOD KELL — pontosan két fájl:

=== FÁJL: apps/web/app/koltseg/KoltsegSajat.tsx ===
"use client" komponens. Bemenete:
`{ kezdo: SajatNezet; feliratok: Record<string,string>; szervezetNev: string }`.
A SajatNezet mezői: honap, usd, keret_usd, hivasok, helyi_hivasok, felho_hivasok, ido_ms,
feladatok: { feladat, hivasok, ido_ms, usd }[].
- A felső kártya: elhasznált keret (usd) / keret_usd, mellette a maradék (keret_usd - usd, nem mehet
  nulla alá), alatta a sáv a százalékkal (usd/keret_usd*100, 100%-ra vágva).
  80% fölött a sáv színe `linear-gradient(120deg,#ff4520,#ff7a55)`, alatta `var(--grad-primary)`.
- A "Mire ment el" táblázat a `feladatok` tömbből. A feladat gépi neve helyett EMBERI nevet írj ki
  a feliratokból, ezekkel a kulcsokkal: `koltseg.f_<feladat>` (pl. a "hf_relevancia" feladatnál
  `koltseg.f_hf_relevancia`); ha a kulcs nincs a feliratok között, magát a gépi nevet írd ki.
- A "Hol dolgozik az AI" kártya: helyi_hivasok (koltseg.hivas_ingyen, {n} helyén a szám) és
  felho_hivasok (koltseg.hivas_fizetos). A pontok színe: helyi = var(--ok), felhő = var(--warn).
- A hónapválasztó a mostani és az előző 11 hónapot kínálja (YYYY-MM), és váltáskor
  `GET /api/koltseg?honap=YYYY-MM` kéréssel tölt újra; a válasz `{ koltseg: SajatNezet }`.
- Minden szöveg a `feliratok` térképből jön (kulcs → szöveg); hiányzó kulcsnál a kulcs jelenjen meg.
  A `{n}` helyettesítőt cseréld le a számra.
- Az időt így írd ki: 60000 ms fölött "{n} perc" (koltseg.perc), alatta "{n} mp" (koltseg.masodperc).
- A pénzt két tizedesjeggyel, magyar tizedesvesszővel, utána " $".

=== FÁJL: apps/web/app/koltseg/koltseg-sajat.css ===
A lap CSS-e. MINDEN érték token legyen (var(--...)). Osztálynév-előtag: `.km-koltsajat`.
Telefonon is működjön (720 px alatt egy oszlop).

SZABÁLYOK
- TypeScript, szigorú típusok, `any` nélkül. React 19, Next 16.
- Ne találj ki új mezőt, gombot vagy szöveget, ami nincs a rajzon.
- A válaszod CSAK a két fájlblokk legyen, `=== FÁJL: út ===` és `=== FÁJL VÉGE ===` közé zárva.
