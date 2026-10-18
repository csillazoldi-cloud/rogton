# Rajz-feladat a Claude Designnak — R-6 · Fájlfeltöltés az arculathoz

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.
Előzmény: `design/r1-kezdokepernyo/`, `r2-tagok/`, `r3-sajat-fiok/`, `r4-rendszerbeallitasok/`.

---

## 1. Miért kell ez — és mi ez pontosan

**Ez nem új lap, hanem egy meglévő blokk kiegészítése.** Az arculat blokk ma **két helyen**
jelenik meg, ugyanabból a közös komponensből: az onboarding 3. lépésén és az ügyfélprofil
lapján. Amit itt megrajzolsz, az mindkettőn megjelenik.

A mai állapot: az arculat **csak szöveg** — színkódok, betű-iránymutatás, képvilág, követendő és
kerülendő példák. **Logót nem lehet feltölteni**, arculati kézikönyvet sem, mintát sem. A gomb
ott van („+ Logó", „Kézikönyv", „Referenciák"), de a rendszer ma **csak a fájl nevét** menti el,
magát a fájlt nem. Ez ma az egyetlen hely a felületen, ahol gomb áll gépezet nélkül.

## 2. Vilmos döntései — ezek rögzítettek (2026-09-11)

**D1 · A fájlok egyszerű mappában tárolódnak, tárolási kapu mögött.** Nem lesz új doboz a
NAS-on — ugyanaz a megfontolás, amiért a háttérsorhoz sem lett Redis: a gép 16 GB-on öt
projektet futtat. A hívó kód nem tudja, hol a fájl; ha később MinIO vagy felhős tároló jön,
a felület és a kód nem változik.

**D2 · Csak kép és PDF tölthető fel: PNG, JPG, WebP, PDF. SVG nem.** Oka: az SVG nem sima kép,
hanem szöveges fájl, ami futtatható tartalmat is hordozhat. A logó megjelenítéséhez a kép elég,
az arculati kézikönyv pedig úgyis PDF. Ha később kell az SVG, az külön lépés lesz — a rajz akkor
sem változik.

## 3. Mi kerül a blokkba

| Feltöltő hely | Mire való | Javasolt korlát |
|---|---|---|
| **Logó — világos háttérre** | a felületen és a kreatívokon megjelenő jel | 2 MB |
| **Logó — sötét háttérre** | ugyanaz, sötét alapra; **nem kötelező** | 2 MB |
| **Arculati kézikönyv** | PDF, ha az ügyfélnek van ilyen | 20 MB |
| **Mintaképek** | követendő példák, legfeljebb 5 db | 2 MB / db |

A méretek **javaslatok** — Vilmos egy szóval átírhatja.

Minden feltöltött fájlnál látszik: a **neve**, a **mérete**, egy **előnézet** (képnél a kép,
PDF-nél az első oldal vagy egy PDF-jelölés), és két művelet: **Csere** és **Eltávolítás**.

## 4. Amit a rendszer MA TUD

- az arculat állapotgépe: **nincs megadva · tervezet · későbbre hagyva · jóváhagyott**
- a jóváhagyás **teljes pillanatképet** ment, és a korábbi jóváhagyott változat megmarad
- a piszkozat ma is tárolja, hogy **mit jelölt meg** forrásként az ügyfél (logó, kézikönyv,
  referenciák, a weboldal is), és a fájl **nevét**
- a mintakártya **kizárólag** a tervezet értékeiből épül, a rendszer színeit nem örökli
- a szervezetek adatai sorszintű védelem alatt állnak — egy szervezet a másikét nem látja

## 5. Amit ehhez MEG KELL ÉPÍTENI — ma nincs meg

- fájl feltöltése, tárolása, és **kiszolgálása csak a saját szervezetének**
- **típusellenőrzés a fájl tartalma alapján**, nem a kiterjesztéséből — átnevezett fájl nem csúszhat át
- méretkorlát, és érthető hibaüzenet, ha túllépi
- **a fájl nem íródik felül**: cserénél új példány keletkezik, a régi marad (lásd 6.2)
- eltávolításnál nem törlünk — a fájl a `_torolni/` elv szerint félrekerül
- **a feltöltött fájlok bekerülnek a mentésbe** — ma csak az adatbázist mentjük

## 6. A szabályok, amiknek a rajzon látszaniuk kell

**6.1 · Az SVG elutasítása legyen segítőkész, ne rideg.**
Ezt a rendszert nem technikusok használják — a szabálykönyv külön kimondja. Ha valaki SVG-t
próbál feltölteni, ne „nem támogatott formátum" jelenjen meg, hanem az, hogy **mit csináljon**:
kérje el a logót PNG-ben, lehetőleg nagy méretben, átlátszó háttérrel.

**6.2 · A jóváhagyott arculat képe nem változhat meg utólag.**
A rendszer szabálya, hogy a jóváhagyás egy **konkrét, változatlan** változathoz tartozik. Ha
valaki új logót tölt fel, abból **új tervezet** lesz — a korábbi jóváhagyott változat a **régi
logóval** marad meg. A rajzon látszania kell, hogy a kettő egyszerre létezik.

**6.3 · A néző nem tölthet fel.** Neki a fájlok látszanak, a gombok nem.

**6.4 · A feltöltés nem blokkolja a lapot.** Amíg megy, a többi mező szerkeszthető marad,
és a feltöltés állapota látszik. Ha megszakad, az addigi adat megmarad — hamis sikert nem mutatunk.

## 7. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | **Arculat blokk — üres**: a négy feltöltő hely, még semmi feltöltve | asztali 1440 |
| 2 | **Arculat blokk — feltöltve**: két logó, egy kézikönyv, két mintakép, előnézettel és műveletekkel | asztali 1440 |
| 3 | **Feltöltés közben, és a három hibaút**: túl nagy fájl · nem engedett típus (SVG, a segítő szöveggel) · megszakadt feltöltés | asztali 1440 |
| 4 | **A mintakártya a feltöltött logóval** — világos és sötét változatban | asztali 1440 |
| 5 | **A jóváhagyott változat és az új tervezet egymás mellett**, a régi és az új logóval | asztali 1440 |
| 6 | Az arculat blokk | telefon 390 |

## 8. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz. Ha új érték kell,
  ne pixelben írd be: adj vissza külön listát, mi az új token, mi az alapértéke és miért kell.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  Az alapnyelv az angol. **A hibaüzenetek is** — különösen a 6.1 szerinti segítő szöveg.
- **Halott vezérlő tilos.** Csak olyan gomb kerülhet a rajzra, aminek a 4. vagy 5. pont szerint
  van vagy lesz mögötte gépezet.
- **Sötét felület** — a világos változat a tokenekből jön.
- **Ez a blokk két helyen jelenik meg** (onboarding 3. lépés és ügyfélprofil), ugyanabból a
  komponensből. Ami itt készül, mindkettőn megjelenik — ezt a rajz vegye figyelembe.
- **Az ügyfél logója SOHA nem örökli a rendszer színeit**, és a rendszer témája nem hat rá.
  Ez rögzített követelmény: az ügyfél arculata külön tartomány.

## 9. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven** — a hibaüzenetek is
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- hogyan viselkedik az előnézet, ha a kép nagyon széles, nagyon magas, vagy átlátszó hátterű
- telefonon mi marad el és mi tör sorba
