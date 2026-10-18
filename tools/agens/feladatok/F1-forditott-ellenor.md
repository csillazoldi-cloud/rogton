# F-1 · Fordított ellenőr — a Theme-lap Térköz-csoportja a rajz ellen

CÉL: felsorolni, miben tér el a megépített képernyő a rajztól. Ami a rajzon nincs, de a képernyőn van: hiba. Ami a rajzon van, de nincs
megépítve: hiba. Amit a rajz nem mutat, de a lap régi része (v6 szerint) — előnézet, szintválasztó, export/import, verziók — az NEM eltérés (tudatos döntés, D-F10).

A RAJZ (4. artboard, asztali 1440) — ez a szerződés:
- Fejléc: „Theme-beállítások” cím; jelvény „{n} token · {cs} csoport”; jobbra „mentetlen tervezet” jelző.
- Alatta csoportfülek egy sorban: Szín · Betű · Betűméret · Forma · Térköz · Egyéb — az aktív kitöltött.
- Térköz fül: cím „Térköz-skála”; súgó (a fokok a lépcső sorrendjében; a köz maga is látszik; hány helyen dolgozik a fok; a nullás fok nem állítható).
- Táblázatos lista, 15 sor, --ter-0 … --ter-14 sorrendben; egy sor: a fok neve kódbetűvel · érték-mező px-ben (a --ter-0 mezője tiltott, „0px”) ·
  a köz rajza: vízszintes sáv, amelynek szélessége a fok értéke pixelben (a 0-nál egy vékony vonal) · jobbra „N helyen” (vagy „—”).
- A lista alatt jegyzet: „Fok nem vehető fel és nem törölhető: a skála zárt…”.
- A lap ALJÁRA rögzített sáv: bal oldalt „A tervezet {n} fokot módosít. Az alkalmazás minden lapra egyszerre hat.”; jobbra „Tervezet elvetése” és „Alkalmazás” gombok.
- 5. artboard (telefon 390): a lépcső ugyanaz; a sorok: név · érték · sáv; a fejlécben a cím és a „Térköz” jelvény.
- Feliratok: minden látható szöveg feliratkulcsból (ter.*, tema.*), három nyelven.

MIT CSINÁLJ: olvasd végig a mellékelt `Tema.tsx`, `TerkozCsoport.tsx`, `tema.css` fájlokat, és add vissza egyetlen fájlban a megállapításokat:
=== FÁJL: docs/F1-FORDITOTT-ELLENORZES-deepseek.md ===
LEGFELJEBB 15 sor, ismétlés TILOS, minden sor: [ELTÉRÉS|RENDBEN|KÉRDÉS] · hol (fájl:sor) · mi · miért számít.
Külön nézd: (1) van-e a Térköz fülön olyan elem, ami a rajzon nincs; (2) hiányzik-e a rajz valamelyik eleme; (3) van-e halott vezérlő
(gomb/mező gépezet nélkül); (4) a --ter-0 tényleg zárt-e; (5) beégetett érték (szín, betű, méret, TÉRKÖZ px) a CSS-ben; (6) a fülek
állapota megmarad-e szintváltásnál; (7) a „mentetlen tervezet” jelző és a sáv {n} száma ugyanazt méri-e, amit a rajz ír.
=== FÁJL VÉGE ===
Máshoz nem nyúlsz, kódot nem írsz.
