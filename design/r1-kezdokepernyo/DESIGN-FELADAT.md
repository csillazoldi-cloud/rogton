# Rajz-feladat a Claude Designnak — R-1 · Kezdőképernyő és navigáció

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.

---

## 1. Mi ez a termék

Több ügyfélnek eladható, iparágfüggetlen, AI-központú **kommunikációs munkakörnyezet**.
A felhasználója egy cég kommunikációs munkatársa — nem fejlesztő, nem technikus. A rendszer
szíve a **közös ügyfélprofil** (mit csinál a cég, kinek, milyen céllal, milyen hangnemben),
amit az onboarding vesz fel egyszer, és amiből minden modul dolgozik.

Ma **egy szakmai modul** van benne: a **hírfigyelő** — RSS-ek és weboldalak figyelése,
AI-értékelés, találatok indoklással. A többi modul később jön.

## 2. Mit kell megrajzolni, és miért

Ma belépés után a felhasználó az ügyfélprofil szerkesztőjére esik, és a többi lap csak URL-ből
érhető el. Nincs olyan képernyő, ami megmondaná: *mi történt azóta, hogy nem néztem, és mi vár rám.*

Két dolog kell egy rajzban:

1. **Kezdőképernyő** — ez fogadja a belépés után.
2. **Állandó navigáció** — egy felső sáv, ami minden belső lapon ugyanaz.

## 3. Vilmos döntései — ezek rögzítettek (2026-09-11)

**D1 · A kezdőképernyő az ÜGYFÉLÉ.** A napi munka van elöl. A négy rendszerszintű lap
(Theme-beállítások, Feliratok, Költség, Fiókok) **külön ajtó mögé kerül: „Gépház"**.
A kezdőképernyőn ezek nem jelennek meg csempeként.

**D2 · Külön kezdőlap készül, csempékkel.** A kezdőlap **nem részletez**: nem mutat találatokat,
nem duplikálja a Hírfigyelő áttekintő lapját. Állapotot és számot mutat, és továbbvisz.
Ok: így a második és harmadik modul is befér, újratervezés nélkül.

**D3 · A munkatér-váltó bekerül, de feltételesen.** Akinek egy munkatere van, annak csak a
munkatér **neve** áll a sávban, váltó nélkül. Akinek több, annak lenyíló. Halott vezérlőt nem
szállítunk.

## 4. Kinek mit szabad

| Szerep | Mit lát |
|---|---|
| **tulajdonos** | a teljes kezdőlapot; beállíthat és futtathat; a Theme és a Feliratok az övé is |
| **szerkesztő** | ugyanazt, beállíthat és futtathat |
| **néző** | csak néz: a futtatás és a jelölés gombjai nem látszanak neki |
| **rendszergazda** | ezen felül a **Gépház** ajtó a felső sávban |

## 5. A kezdőlap csempéi — pontosan ezek, se többet, se kevesebbet

Mindegyik mögött valódi, mért gépezet van. A csempe rövid: egy állapot, egy-két szám, egy tovább-link.

| # | Csempe | Mit mutat | Hova visz |
|---|---|---|---|
| 1 | **Hírfigyelő** | utolsó sikeres futás ideje (vagy „még nem futott") · következő tervezett futás a munkatér időzónájában, vagy „kézi indítás" · új találatok száma · ha épp fut: „figyelés fut a háttérben" · ha részleges forráshiba: hány forrás akadt el · ha az AI nem válaszolt: „értékelés függőben" | Hírfigyelő → Áttekintés |
| 2 | **Ügyfélprofil** | jóváhagyva-e, mikor és ki hagyta jóvá · hány rész hiányzik és melyek | Ügyfélprofil |
| 3 | **Arculat** | az állapota: nincs megadva · tervezet · későbbre hagyva · jóváhagyott | Ügyfélprofil, az arculat blokkjához |
| 4 | **Források** | hány forrás van, állapot szerint: használható · korlátozott · hibás · nem támogatott · ellenőrzés alatt. Ha van hibás vagy korlátozott, az kiemelve | Hírfigyelő → Figyelés beállítása |
| 5 | **AI-keret** | a hónap hívásszáma, AI-gépideje és becsült költsége · mennyi maradt a keretből · ha elfogyott, azt kimondva | Költség |
| 6 | **Mentetlen tervezet** | **csak akkor látszik**, ha van mentetlen tervezet a Theme- vagy a Feliratok-lapon | az érintett lapra |

A lap tetején egy mondat: mi történt a legutóbbi belépés óta. Alatta a csempék.

**Az „első használat" változatban** (nincs jóváhagyott profil): a csempék helyett egyetlen,
nagy hívás az onboardingra, és a hírfigyelő csempéje azt mondja, hogy még nem futott.

## 6. Amit a rendszer MA NEM tud — ez NEM kerülhet a rajzra

Gomb gépezet nélkül nem szállítható. Ezek ma nincsenek megépítve:

- értesítés, riasztás, „olvasatlan" jelzés
- számlázás, előfizetés, csomag, ár
- fájlfeltöltés (logó, arculati kézikönyv)
- tag meghívása, szerep átállítása
- több modul — ma egy van
- e-mail bármilyen formában
- keresés a lapok között
- naptár, ütemezett tartalom, közzététel

## 7. A felső sáv

Balról jobbra:

- a termék neve
- **munkatér neve** — egy munkaternél csak szöveg; többnél lenyíló váltó (D3)
- **Modulok** — lenyíló. Ma egy sor van benne: *Hírfigyelő*. Úgy rajzold meg, hogy öt is elférjen
- **Ügyfélprofil**
- **Gépház** — csak rendszergazdának; mögötte: Theme-beállítások · Feliratok · Költség · Fiókok
- nyelvválasztó (magyar · román · angol)
- a fiók neve és Kilépés

## 8. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | Kezdőképernyő — **normál** (van profil, futott a hírfigyelő, vannak találatok) | asztali 1440 |
| 2 | Kezdőképernyő — **első használat** (nincs jóváhagyott profil, még nem futott figyelés) | asztali 1440 |
| 3 | Kezdőképernyő — **néző szerep** | asztali 1440 |
| 4 | **Gépház** — a rendszergazda ajtaja mögött a négy lap egy helyen, rövid állapottal | asztali 1440 |
| 5 | Kezdőképernyő — normál | telefon 390 |
| 6 | A felső sáv közelről: Modulok nyitva, és a munkatér **mindkét** állapotában (egy / több) | asztali 1440 |
| 7 | A felső sáv telefonon (lenyíló) | telefon 390 |

## 9. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz — minden érték
  elnevezett tokenből jön. A teljes készlet (53 token) a Theme-beállítások lapon látszik.
  **Ha új méret vagy érték kell, ne írd be pixelben: adj vissza egy külön listát, mi az új token,
  mi az alapértéke és miért kell.** (A nyitólapnál így született négy új méret-token.)
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  **Az alapnyelv az angol** — ha valamelyik hiányzik, az angol látszik.
- **Halott vezérlő tilos.** Csak olyan gomb, kapcsoló, mező kerülhet a rajzra, aminek az 5. pont
  szerint van mögötte gépezet.
- **Sötét felület** — a rendszer sötét témán fut; a világos változat a tokenekből jön, nem külön rajzból.
- **Illeszkedjen a meglévő lapokhoz**: `Nyitolap.dc.html`, `Fiokok.dc.html`,
  `Fiokprofil-optimalizalt.dc.html`, `Hirfigyelo-prototipus.dc.html`, `Theme-beallitasok.dc.html`.
  Ez nem új arculat, hanem a meglévő folytatása.

## 10. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven** (magyar az eredeti, román és angol mellette)
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- melyik csempe melyik adatból dolgozik (az 5. pont neveivel)
- telefonon mi marad el és mi tör sorba
