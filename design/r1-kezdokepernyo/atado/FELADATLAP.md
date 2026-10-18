# Rajz-feladat a Claude Designnak — R-1 · Kezdőképernyő és navigáció

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ez a lap a Designnak szól. Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon
többlet, az hiba. Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.

---

## 1. Mi ez a termék

Több ügyfélnek eladható, iparágfüggetlen, AI-központú **kommunikációs munkakörnyezet**.
A felhasználója egy cég kommunikációs munkatársa — nem fejlesztő, nem technikus. A rendszer
szíve a **közös ügyfélprofil** (mit csinál a cég, kinek, milyen céllal, milyen hangnemben),
amit az onboarding vesz fel egyszer, és amiből minden modul dolgozik.

Ma **egy szakmai modul** van benne: a **hírfigyelő** (RSS és weboldalak figyelése, AI-értékelés,
találatok indoklással). A többi modul később jön.

## 2. Mit kell megrajzolni, és miért

**Ma belépés után a felhasználó az ügyfélprofil szerkesztőjére esik**, és a többi lap csak
URL-ből érhető el — a lapok egymásról sokáig nem is tudtak. Nincs olyan képernyő, ami
megmondaná: *mi történt azóta, hogy nem néztem, és mi vár rám*.

Két dolog kell egy rajzban:

1. **Kezdőképernyő** — ez fogadja a belépés után.
2. **Állandó navigáció** — egy felső sáv, ami minden belső lapon ugyanaz.

## 3. Kinek szól — a szerepek

| Szerep | Mit lát |
|---|---|
| **tulajdonos** | mindent a saját munkaterében, beállíthat és futtathat |
| **szerkesztő** | ugyanazt, beállíthat és futtathat |
| **néző** | csak néz: a futtatás és a jelölés gombjai nem látszanak neki |
| **rendszergazda** (külön jelölés a fiókon) | ezen felül a rendszerszintű lapok: Theme, Feliratok, Költség, Fiókok |

Egy ember **több munkatérhez** is tartozhat — az adatmodell tudja, a felület ma nem.

## 4. Amit a rendszer MA TUD megmutatni

**Csak ezekből szabad csempét rajzolni.** Mindegyik mögött valódi gépezet van, mérve.

**Hírfigyelő**
- utolsó sikeres futás időpontja (vagy „még nem futott")
- következő tervezett futás, a munkatér időzónájában — vagy „kézi indítás"
- új találatok száma
- fut-e éppen a háttérben
- részleges forráshiba: hány forrás nem dolgozható fel
- „AI-értékelés függőben" állapot (ha a helyi AI nem válaszolt)
- az AI összképe a találatokról, forráshivatkozással
- források száma állapot szerint: ellenőrzés alatt · használható · korlátozott · hibás · nem támogatott

**Ügyfélprofil**
- jóváhagyva-e, mikor, ki hagyta jóvá
- hány rész hiányzik belőle, és melyek
- az arculat állapota: nincs megadva · tervezet · későbbre hagyva · jóváhagyott

**AI-költség**
- a hónap hívásszáma, AI-gépideje és becsült költsége
- a munkatér kerete és hogy mennyi fogyott belőle
- ha a keret elfogyott: az értékelés függőben marad

**Megjelenés és szövegek** (rendszergazdának és tulajdonosnak)
- van-e mentetlen tervezet a Theme- vagy a Feliratok-lapon

**Rendszerszint** (csak rendszergazdának)
- fiókok és munkaterek száma, felfüggesztett fiókok, utolsó belépések
- munkaterenkénti költség

**Mindig**
- a munkatér neve, a tagok szereppel, a saját fiók neve
- a felület nyelve (magyar · román · angol)

## 5. Amit a rendszer MA NEM tud — ez NEM kerülhet a rajzra

Gomb gépezet nélkül nem szállítható. Ezek ma nincsenek megépítve:

- értesítés, riasztás, „olvasatlan" jelzés
- számlázás, előfizetés, csomag, ár
- fájlfeltöltés (logó, arculati kézikönyv)
- tag meghívása, szerep átállítása
- több modul — ma egy van
- e-mail bármilyen formában
- keresés a lapok között
- naptár, ütemezett tartalom, közzététel

## 6. A navigáció — a ma létező lapok

A felső sávból ezek érhetők el:

| Lap | Kinek |
|---|---|
| Kezdőképernyő | mindenkinek |
| Hírfigyelő — Áttekintés · Figyelés beállítása · Finomhangolás | mindenkinek (a néző csak néz) |
| Ügyfélprofil | mindenkinek |
| Theme-beállítások | tulajdonos és rendszergazda |
| Feliratok | tulajdonos és rendszergazda |
| Költség | tag a sajátját, rendszergazda mindenkiét |
| Fiókok | csak rendszergazda |
| Kilépés, nyelvválasztó | mindenkinek |

**A modulok helyét is rajzold meg**, úgy, hogy ma egy sor áll benne (Hírfigyelő), de holnap
öt fér el. **A munkatér-váltót is** rajzold be, akkor is, ha ma a legtöbb embernek egy munkatere van.

## 7. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz — minden érték
  elnevezett tokenből jön. A teljes készlet (53 token) a Theme-beállítások lapon látszik.
  **Ha új méret vagy érték kell, ne írd be pixelben: adj vissza egy külön listát, mi az új token,
  mi az alapértéke és miért kell.** (A nyitólapnál így született négy új méret-token.)
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  **Az alapnyelv az angol** — ha valamelyik hiányzik, az angol látszik. Az átadóban minden
  szöveget kulccsal adj meg.
- **Halott vezérlő tilos.** Csak olyan gomb, kapcsoló, mező kerülhet a rajzra, aminek az 5. pont
  szerint van mögötte gépezet.
- **Sötét felület** — a rendszer sötét témán fut; a világos változat a tokenekből jön, nem külön rajzból.
- **Illeszkedjen a meglévő lapokhoz**: `Nyitolap.dc.html`, `Fiokok.dc.html`,
  `Fiokprofil-optimalizalt.dc.html`, `Hirfigyelo-prototipus.dc.html`, `Theme-beallitasok.dc.html`.
  Ez nem új arculat, hanem a meglévő folytatása.

## 8. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | Kezdőképernyő — **normál** (van profil, futott már a hírfigyelő, vannak találatok) | asztali 1440 |
| 2 | Kezdőképernyő — **első használat** (nincs jóváhagyott profil, a hírfigyelő még nem futott) | asztali 1440 |
| 3 | Kezdőképernyő — **néző szerep** | asztali 1440 |
| 4 | Kezdőképernyő — **rendszergazda** (a rendszerszintű csempékkel) | asztali 1440 |
| 5 | Kezdőképernyő — normál | telefon 390 |
| 6 | A felső sáv közelről: munkatér-váltó nyitva, modulok nyitva | asztali 1440 |
| 7 | A felső sáv telefonon (lenyíló) | telefon 390 |

## 9. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven** (magyar az eredeti, román és angol mellette)
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- melyik csempe melyik adatból dolgozik (a 4. pont szerinti nevekkel)
- telefonon mi marad el és mi tör sorba

## 10. Nyitott kérdés — ezt NE döntsd el magadtól

**A kezdőképernyő elsősorban az ügyfél kommunikációs munkatársának szól, vagy az üzemeltetőnek?**

- Ha az ügyfélnek: a rendszerszintű lapok (Theme, Feliratok, Költség, Fiókok) egy külön ajtó
  mögé kerülnek, és a kezdőképernyőn a napi munka van.
- Ha az üzemeltetőnek: a rendszer állapota kerül előre, és az ügyfél munkája alá.

**Vilmos dönt.** Amíg nem döntött, rajzold meg az ügyfél változatát, a rendszergazda csempéit
pedig külön, elkülönített sávban (4. artboard) — így bármelyik döntés esetén használható a rajz.

---

## Utólagos döntések (2026-09-11, a rajz készítése közben)

A 10. pont kérdésére és a rajz közbeni kérdésekre adott válaszok:

- **D1 · A kezdőképernyő az ügyfélé.** A négy rendszerszintű lap (Theme, Feliratok, Költség,
  Fiókok) egy külön ajtó — a **Gépház** — mögé kerül, ami csak rendszergazdának látszik.
  A 4. artboard ezért a Gépház lapja, nem egy rendszergazda-kezdőlap.
- **D2 · A kezdőlap nem részletez.** A csempe állapotot és számot mutat, és továbbvisz.
  Az „AI összképe a találatokról” ezért nem csempe.
- **D3 · A munkatér-váltó csak két munkatértől nyílik.** Egy munkatérnél a név sima szöveg,
  nyíl nélkül.
- A felső sáv egyetlen állandó sáv, alsáv nélkül; a modul fülei a „Modulok” lenyílóban.
- A „Modulok” lenyíló csak a modulok listáját adja; a lapokra a modul kezdőlapjáról lépsz.
- Az első használat egyetlen üvegkártya, csempék nélkül.
- Telefonon az AI összkép rövidítve marad — de mivel a D2 szerint ez a csempe kimarad,
  a telefonos nézetből sem esik el adat.
