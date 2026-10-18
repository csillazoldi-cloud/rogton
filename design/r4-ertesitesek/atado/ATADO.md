# R-4 · Értesítések és adatpolitika — átadó

2026-09-13 · Aitmetica SRL · a sorrend negyedik, utolsó tétele (R-2 → R-3 → R-6 → **R-4**)

## 0. A hiteles rajzfájl és a hálózat

A hiteles rajz: **`rajz/R4-ertesitesek-adatpolitika.dc.html`**. Egyetlen fájl, benne **hét artboard** (01–07).

**A megnyitásához hálózat kell** (a betűk a Google Fontsról), és a **`support.js` a rajz mellett kell** legyen — a csomag `rajz/` mappájában ott van.

Tokenkészlet az R-1 v4 `:root`-ja, szó szerint. **Négy új token** — lásd `tokenek.md`. Beégetett érték a rajzon nincs.

## 1. Egy lap, két fül, és a bejárat

A lap útja a rajzon `/beallitasok`; két fül: **Értesítések** · **Adatpolitika** (a Fiókok lap mintájára, E-50). Felül az R-1 v4 sávja, külön fejléc nélkül.

**A bejárat rajta van a rajzon** (01. artboard, bal oldali oszlop): a saját fiók oldalsávjának harmadik sora, *Beállítások*, mellette az olvasatlan szám. A sávba **harang** kerül, számmal — ugyanide visz, az Értesítések fülre. A Költség lapnál ez maradt ki, itt nem ismétlődik meg.

## 2. A hét artboard

| # | Mi | Méret |
|---|---|---|
| 01 | Értesítések fül, teli lista — a bejárat, az öt soros lista, a hat esemény kapcsolója, a három csatorna | asztali 1440 |
| 02 | Értesítések fül, üres állapot — „Még nincs értesítésed" | asztali 1440 |
| 03 | Adatpolitika fül — a három adatút-sor, a szolgáltató doboza, a kikapcsolt felhő-kapcsoló, lábrész | asztali 1440 |
| 04 | Adatpolitika, közönséges tag nézete — **A:** amit lát · **B:** ami nincs ott | asztali 1440 |
| 05 | Értesítések telefonon — egy oszlop | telefon 390 |
| 06 | Adatpolitika telefonon — egy oszlop | telefon 390 |
| 07 | **Szaggatott vázlat** — a jövőbeli bekapcsolt állapot és egy emiatt megállt feladat | 1440, nem épül meg |

## 3. Amit a rajz eldöntött

**A „még nem működik" jelölésnek saját vizuális nyelve van, és sosem áll egyedül.** Három eleme van, együtt: **szaggatott keret**, halk kék-szürke `--keszul` alap (kifejezetten **nem** hibaszín, nem is a figyelmeztető narancs), és **mindig egy mondat arról, miért nem működik és mi kell hozzá**. A kapcsoló maga kikapcsolt, halványabb, és nem kattintható. A jelölést a rajz három helyen használja — e-mail, telefonos értesítés, felhő-kapcsoló —, és máshol újrahasznosítható.

**Kikapcsolt vezérlő csak ott van, ahol a funkció készül.** Amit a felhasználó a szerepe miatt nem tehet meg, azt a lap **nem mutatja szürkén, hanem egyáltalán nem mutatja** (04. artboard): a rendszergazdai csoport a közönséges tagnál nincs ott, a felhő-kapcsoló a nézőnél nincs ott. Ez ugyanaz az elv, amit az R-2 és az R-6 is követ.

**A lista sorai visznek valahova.** Minden sor alatt ott áll, melyik munkatérben történt, és hová visz (találatok, források, költség, futás részletei). Olvasott/olvasatlan: tömör pont + teli szövegszín az olvasatlanon, pont nélkül és halkabban az olvasotton — nem csak opacitással, hogy a kontraszt megmaradjon.

**Üres listánál a „Mind olvasottnak jelölöm" gomb nem jelenik meg** — nem kikapcsolva. A két beállító blokk viszont ott marad: az üres lista nem üres lap.

**Az adatút három sora nem egyenrangú.** A 2. sor — a cikk szövege, a munkatér profilja, a figyelési beállítás → az AI-szolgáltatóhoz — kiemelt keretet, nagyobb betűt és tömör „ügyféladatot visz" jelvényt kap; az 1. és a 3. halkabb. Ez az a sor, amire egy közintézmény rákérdez.

**A szolgáltató doboza tájékoztatás, nem vezérlő:** nincs benne semmi kattintható, és ki is mondja, hogy a szolgáltató kiválasztása nem ezen a lapon történik. A név, a házon belül/felhő jelölés és az ország a rendszer adatából jön — a rajzon szögletes zárójeles helykitöltő áll, hogy a mérésből ne csináljunk tényt.

**A felhő-kapcsoló kiírja, mit fog csinálni.** Három mondat a kapcsoló alatt: megáll, nem vált át felhőre; a hírek letöltése ettől függetlenül megy tovább (D-19); a megállás a felületen és a naplóban is látszik. A 07. artboard ezt a három mondatot mutatja meg állapotként.

**Az alapértelmezés: minden értesítés be.** A rajz így mutatja (9.1 kérdés), egyetlen kapcsoló kivételével — a „Beragadt egy futás" kikapcsolva áll, hogy a kikapcsolt (de működő) állapot is látszódjon a rajzon, és elváljon a „még nem működik" jelöléstől.

**A rendszergazdai csoport külön dobozban áll** (9.2 kérdés), saját címmel és jelvénnyel, hogy egyetlen blokk törlésével kivehető legyen, ha Vilmos úgy dönt.

## 4. Halott vezérlő

A rajzon kattintható minden, aminek gépezete van: az értesítéslista sorai, a „Mind olvasottnak jelölöm", a hat esemény-kapcsoló, a „A felületen" csatorna, a fülek, a harang, a tájékoztató hivatkozása.

**Ami kikapcsolt, és ezt a rajz meg is indokolja:** e-mail csatorna (nincs levélküldés a rendszerben), telefonos értesítés (nincs megépítve, D-21), felhő-kapcsoló (nincs eldöntve, hol fut élesben az AI).

**Ami nincs a rajzon, mert nem ide tartozik:** az AI-szolgáltató kiválasztása, a havi keret állítása (Költség lap), fiókkezelés és jelszóváltás (R-3), az adatkezelési tájékoztató szövege.

## 5. Feliratkulcsok

Új kulcsok: **`ertesites.*`**, **`adatpolitika.*`**, **`jelzes.meg_nem_mukodik`**, `beallitasok.*`, `nav.beallitasok` — mind a három nyelven a `feliratok.json`-ban. A `rajz.*` kulcsok a rajz jegyzetei, **nem kerülnek a felületre**.

A `jelzes.meg_nem_mukodik` szándékosan **egy, közös kulcs**: ugyanaz a két szó mindhárom helyen, a magyarázó mondat viszont helyenként külön kulcs.

## 6. Mérés és tényállítás

A számok (10 találat, 15 perc, a szolgáltató és az ország) a 2026-09-09-i mérésből valók, és a rajzon **példaadatok**. A kód írása előtt újra kell mérni; a lap nem ebből a rajzból állít tényt.
