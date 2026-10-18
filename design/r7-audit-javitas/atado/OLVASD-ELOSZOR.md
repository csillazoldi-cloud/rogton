# OLVASD ELŐSZÖR — R-7 · Az audit javításai

2026-09-13 · Aitmetica SRL · öt lap, egy körben, egy csomagban.
A csomag a 2026-09-13-i használhatósági audit **szerkezeti** javításait rajzolja meg. A szövegjavítások és a mért hibák rajz nélkül mennek — azok nincsenek benne.

**A rajz a szerződés.** Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba. Amihez nem volt gépezet a kérés 2. pontjában, azt nem rajzoltuk — az a `kerdesek.md`-ben van.

## Mi van a csomagban

| Lap | Fájl | Artboardok |
|---|---|---|
| **R-7a · Első beállítás** | `R-7a-elso-beallitas/rajz/R7a-elso-beallitas.dc.html` | 8 (01 Regisztráció · 02 Belépés + 02/B · 03–04 1. lépés · 05 2. lépés A/B/C · 06 3. lépés · 07 Kész · 08 telefon) |
| **R-7b · Kezdőlap és Hírek** | `R-7b-kezdolap-hirek/rajz/R7b-kezdolap-hirek.dc.html` | 10 (01–03 Kezdőlap · 04–07 Hírek · 08–09 Figyelés beállítása · 10 Találatok pontosítása) |
| **R-7c · Beállítások-szint** | `R-7c-beallitasok/rajz/R7c-beallitasok.dc.html` | 11 (01–02 Beállítások · 03 Értesítések · 04 Adatkezelés · 05 Kimenő · 06 Megjelenés · 07 Felület szövegei · 08 Saját fiók · 09 Csapattagok · 10 Szervezet adatai · 11 telefon) |
| **R-7d · Nyitólap és adatkezelés** | `R-7d-nyitolap/rajz/R7d-nyitolap.dc.html` | 3 |
| **R-7e · Közös vizuális alap** | `R-7e-vizualis-alap/rajz/R7e-skala.dc.html` | 1 (minták) + a tokenek értéke |

Minden laphoz ugyanaz a négy-öt dokumentum: `ATADO.md` (artboardonként mi épül), `feliratok.json` (hu · ro · en), `adatkotes.md` (melyik felirat melyik végpontból), `kerdesek.md` (a döntések B változata + a kérdéseim), `tokenek.md`. Az R-7e-nél csak `tokenek.md` — ott az érték a tartalom.

A `.dc.html` fájlok megnyitásához a mellettük lévő `support.js` kell (és hálózat a betűkészlethez). Asztali 1440, telefon 390; az artboardok neve `NN · Lap · Nézet`.

## A döntés-jelölések a rajzon

Mindenhol az **audit változata (A)** van megrajzolva, az artboard sarkában „DÖNTÉS 3.x” jelöléssel. A B változat egy mondatban az adott lap `kerdesek.md`-jében.

| Jelölés | Hol látszik a rajzon |
|---|---|
| DÖNTÉS 3.1 — menü- és lapnevek | R-7b 01, R-7c 01 (Kezdőlap · Hírek · Szervezet adatai · Beállítások · Megjelenés · Felület szövegei · Adatkezelés · Találatok pontosítása) |
| DÖNTÉS 3.2 — „Mentés és vissza” | R-7a 03, 05, 06 |
| DÖNTÉS 3.3 — a „még nem működik” dobozok | R-7c 03, 04, 08 (a tulajdonos nézetén nem látszanak) |
| DÖNTÉS 3.4 — jelszó-visszaállítás | R-7a 02 és 02/B |
| DÖNTÉS 3.5 — magyar cím a román hírhez | R-7b 05, 06, 07, 10 |
| DÖNTÉS 3.6 — árazás, kapcsolat, tájékoztató | R-7d 01, 03 |

## Két dolog, amit a rajz maga döntött el (és amit felülírhatsz)

- **A skála új értékei minden lapon érvényesek**, nem csak az R-7e-n: alapszöveg 16 px, arányos származtatás, 46 px-es mezők, semleges (nem narancs) AI-jelvény és link. Így a négy képernyő-lap már az elfogadott skálát mutatja. Az értékek régi → új bontásban: `R-7e-vizualis-alap/tokenek.md`.
- **Két új token a tartalomszélességre**: `--urlap-max: 680px` és `--lista-max: 1180px` — indoklás és tartomány ugyanott.

## Nincs benne (szándékosan)

Ár, fizetés, csomagváltás, számla; e-mail-küldés; posztvázlat-írás a tartalomötletből; böngésző/eszköz neve a belépéseknél; „hol látszik” előnézet a Felület szövegeinél; kimenő üzenetek naplója; a kapcsolat címe. Nincs új lépés az első beállításban, és a három lépés nincs összevonva.

## Amit visszakérek

A négy lap `kerdesek.md`-je összesen 18 kérdést tartalmaz, számozva. A kérés 8. pontjának négy kérdésére a válasz a helyén van: 1. és 2. az `R-7b/kerdesek.md`-ben, 3. az `R-7c/kerdesek.md`-ben, 4. az `R-7e-vizualis-alap/tokenek.md` végén.
