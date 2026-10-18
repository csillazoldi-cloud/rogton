# OLVASD ELŐSZÖR — VZ-3 · Képek: színváltozatok a cég arculatából

2026-09-24. A VZ-2 kitöltő, a Kész lap és a hét kép **változatlan**. Egy új sor jön a kép-blokkba: a „Hová kerül?” alá, a kép fölé kerül 2–5 kis mintakép, mindegyik alatt egy rövid szó.

| Fájl | Mi van benne |
|---|---|
| `rajz/VZ3-szinek.dc.html` | a kitöltő kép-blokkja, 6 állapot, telefon 390 + asztali 1440 · alatta VZ-3b: a kártyák |
| `rajz/VZ3-valtozatok.dc.html` | az öt változat a hét helyzetre, két céggel, poszt méretben; a kihagyottak helyén a gép indoka |
| `rajz/vz3-kep.js` | **a gép szabálya futtatható formában**: paletta, olvashatósági vizsgálat, azonosak kiszűrése |
| `rajz/vz2-kep.js` | a képvázlat (VZ-2), két visszafelé kompatibilis kiegészítéssel: a címke doboz is lehet (`pill`), a hír háttere külön állítható (`hirHatter`) |
| `rajz/support.js` | a futtató |
| `ATADO.md` · `szabaly.md` · `feliratok.json` · `tokenek.md` · `kerdesek.md` · `tervezo-proba.md` | |

## Egy dolog, ami eltér a kéréstől (és miért)
A kérés 1. állapota a Kész munka négy változattal, a 3. az Akció kettővel. **A két cég valódi színeivel a szabály pont ezt adja** — de csak azért, mert a rajzon a Kész munka címkéje **kiemelő színű doboz**, benne sötét vagy fehér szöveggel (nem kiemelő színű kis betű). Ha a címke kis betűs színes felirat maradna (VZ-2), a homok és az arany szín a krém háttéren (1,9–2,0) és a zöldön (3,3) is kiesne, és a Kész munkánál is csak 2 változat maradna. Részletek: `szabaly.md`.

## Kiegészítés: Átmenet
Vilmos kérésére a szövegek mögött átmenetes háttér is lehet. Ez az ötödik változat. A szabálya a `szabaly.md`-ben van, a rajz a 6. állapot.
