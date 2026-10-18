# Ellenőrzés — R-0 · Térköz-skála (Design átadó)

Kommunikációs munkatér · Aitmetica SRL · 2026-09-12
Mérve a csomag tartalmán: a rajzfájlon futtatott keresés, a rajz böngészőben megjelenített képe,
és a meglévő stíluslapok újraszámolása. Minden szám alább **mérés**.

---

## 1. Összegzés

**A skála elfogadható, és a rajz a saját szabályát is betartja.** Egy komoly hiba van a
csomagban (a rajz hálózat nélkül nem jelenik meg, és az átadó ennek az ellenkezőjét állítja),
egy tévedés az átadóban (a fájlnevek a 18 helynél), és egy elszámolás az átállási kulcsban.

## 2. Amit megmértem

| Mit | Eredmény |
|---|---|
| Artboardok | **5/5**, a feladatlap szerinti sorrendben és névvel |
| Beégetett HEX szín / `rgb()` | **0 / 0** |
| Beégetett betűméret / lekerekítés | **0 / 0** |
| Pixelben írt térköz a rajz törzsében | **8** — mind a 3. artboard „ELŐTTE" paneljén, ahol ez **szándékos és kimondott** |
| Felirat-kulcsok | 104, **mind a három nyelven hiánytalan** |
| Kulcs a rajzon, ami hiányzik a JSON-ból | **1** (lásd 3.4) |
| A csomagba tett feladatlap | **azonos** az általam küldöttel — ez az R-1 hibája volt, most rendben |
| A skála adatai | 15 fok, az átadó táblájával egyezik |

**A legfontosabb pozitívum:** a rajz nem beszél a térközről, hanem használja is. Nyolc pixelérték
van benne, mind a szándékos összehasonlító panelen. Ezt a szabályt betartotta.

## 3. Hibák

### 3.1 A rajz hálózat nélkül NEM jelenik meg — az átadó az ellenkezőjét állítja

Az `ATADO.md` 0. pontja: *„Egyetlen fájl… külső css, js és kép nélkül; böngészőben megnyitva
magától megjelenik… hálózat nélkül is megjelenik, akkor a rendszer betűivel."*

**Megmértem: nem így van.** A fájl három külső forrásból tölt futtatható kódot:

```
https://unpkg.com/react@18.3.1/umd/react.production.min.js
https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js
https://unpkg.com/@babel/standalone@7.29.0/babel.min.js
```

Elzárt hálózaton megnyitva a lap **üres**: 0 karakter látható szöveg, 0 pixel magas törzs,
a konzolban `[dc] failed to load React or boot`. Nem a betűk hiányoznak — **semmi nem jelenik meg.**

Ez nem elméleti kérdés: **a skála táblája — a lap központi tartalma — nem áll a fájlban készen**,
hanem a futtatókörnyezet állítja elő adatból. Aki hálózat nélkül nyitja meg, nem látja a tizenöt fokot.

Az R-1-nél ugyanez volt, és a feladatlap 10. pontja épp ezt kérte. Kérés változatlanul:
**vagy legyen a csomagban egy statikus változat is, vagy az átadó mondja ki, hogy hálózat kell hozzá.**

### 3.2 Az átadó 4. pontjában a fájlnevek nem stimmelnek

Az átadó a 18 nagy elmozdulásnál megnevezi, melyik fájlban vannak, és azt írja:
*„fájlszinten pontos, sorszinten nem"*. Újraszámoltam a stíluslapokat:

| Érték | Az átadó szerint | A mérés szerint |
|---|---|---|
| 90px | `fiok.css` | `fiok.css` (2) **+ `hirfigyelo/_kozos/hirfigyelo.css` (1)** |
| 64px | `tema.css` | **`fiok.css` (2)** |
| 60px | `fiok.css`, `attekintes.css` | **`feliratok.css` (1), `tema.css` (1)** |
| 48px | `fiok.css`, `beallitas.css` | **a kódban nincs** — csak az R-1 rajzán fordul elő |
| 36px | `fiok.css` (`--pad-card`) | **`feliratok.css` (1), `attekintes.css` (1)** |
| 28px | `finomhangolas.css`, `feliratok.css` | **`fiok.css` (3)** |
| 70px | `fiok.css` | `fiok.css` (1) ✓ |

A `kerdesek.md` 3.1 pontja helyesen kimondja, hogy a mérést nem futtatta újra — a fájloszlopot
tehát nem lett volna szabad kitölteni. **Ez a tábla nem használható a javításnál**; a helyes
fájllista fent van.

Ez nem a skálát kérdőjelezi meg, csak a menetlevelet — de a 18 hely épp az, ahol a képernyő
tényleg változik, tehát ott kell a legpontosabbnak lenni.

### 3.3 Egy határ elcsúszott az átállási kulcsban

A kulcs utolsó sora: *„68 … 90 → `--ter-14` (80px)"*.

A saját szabálya szerint — *legközelebbi fok, holtversenyben a sűrűbb felé* — a **68px
holtverseny** (56-tól 12, 80-tól 12), tehát a **sűrűbb**, az `--ter-13` (56px) jár neki.
A helyes határ: **69 … 90 → `--ter-14`**, és **49 … 68 → `--ter-13`**.

A mai kódban nincs 68px, tehát ma nem okoz kárt — de a kulcs épp azért készült, hogy az
átírás gépies legyen, ezért pontosnak kell lennie.

### 3.4 Egy kulcs hiányzik a feliratokból

`ter.ea_tag` — a 3. artboard példakártyáján a „Kis Anna" név. Ez **adat, nem felirat**, tehát
nem fordítás kell hozzá, csak annyi, hogy szerepeljen az `adatbol_jon` listában, ahogy a többi
példaadat. A másik 103 kulcs hiánytalan.

## 4. Amit a Design maga jelzett, és amiben igaza van

- **A mérés tíz napos.** A javítás előtt újra kell futtatni a mai kódon. Ezt én sem tudom innen
  megtenni: a gyökér a GitHub, és a gépeden futó parancssor a szeptember 8-i Windows-frissítés
  óta nem működik.
- **A fokonkénti használati számok becsültek.** A rajzon lévő számok összege ~965, a mért összes
  1021 — a különbség a húsz ritka értékben van. A rajz ezeket adatként kezeli, tehát az
  újramérés után egy helyen kell átírni őket.
- **A 3. artboard pixelértékei szándékosak.** Így van; ellenőriztem, más helyen nincs pixel.

## 5. Ami döntést kér

| # | Mi | Javaslatom |
|---|---|---|
| 1 | **Kerekítés iránya**: holtversenyben sűrűbb vagy levegősebb felé | maradjon a **sűrűbb** — így jött ki a 790/179/34/18 mérleg |
| 2 | **Használati számláló** (`--ter-4 · 248 helyen`): megépítjük vagy elhagyjuk | építéskor számolt szám — nem tárolunk mérési adatot az adatbázisban |
| 3 | **Fok-jelölés színe**: két új token vagy a meglévő `--src-web` | **két új token** — a „web forrás" jelvény mást jelent, ne keveredjen |
| 4 | **Monotonitás-ellenőrzés** a Theme lapon (fok ne lehessen nagyobb a következőnél) | **kell**, és a hibaút is rajzoljon hozzá |
| 5 | **A 18 hely javítása**: egyszerre vagy a `--pad-card`-dal kezdve | a Design sorrendje jó: **előbb a `--pad-card`**, aztán a többi |

Az 1-es az egyetlen, ami a rajzot és a négy számot is átírja; a többi négy a gépezetről szól.
