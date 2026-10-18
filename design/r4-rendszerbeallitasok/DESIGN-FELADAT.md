# Rajz-feladat a Claude Designnak — R-4 · Rendszerbeállítások: értesítések és adatpolitika

Kommunikációs munkatér · Aitmetica SRL · 2026-09-11
Ami a rajzon nincs, az nem kerül a képernyőre; ami a rajzon többlet, az hiba.
Ami hiányzik vagy gyanús: kérdés Vilmoshoz, nem improvizáció.
Előzmény: `design/r1-kezdokepernyo/`, `design/r2-tagok/`, `design/r3-sajat-fiok/`.

---

## 1. Miért kell ez a képernyő

Két lyuk van a rendszerben, és mindkettő ugyanarra a kérdésre felel: *mit csinál a gép magától,
és mi hagyja el a házat.*

**Ma semmi nem szól, ha baj van.** Az adatok megvannak — a hozzáférésnapló minden belépési
kísérletet megőriz 30 napig, a futások állapota látszik, az AI-keret állása mérve van —, de
senki nem nézi őket. Az elfogadási jegyzőkönyv ezt néven nevezett kockázatként rögzíti.

**És nincs adatpolitika terméki funkcióként.** Az adatút le van írva és megmérve, de az ügyfél
nem lát belőle semmit, és nem is állíthat rajta.

## 2. Vilmos döntései — ezek rögzítettek (2026-09-11)

**D1 · Az értesítés két csatornán megy: a felületen és telefonon.**
A **felület** mindenki csatornája: a kezdőképernyőn és egy „Mi történt" listán. A **telefonos
riasztás** az üzemeltetőé (Telegram) — ez nem az ügyfélé, és a rajzon csak annyi látszik belőle,
hogy be van-e kötve. E-mail ebben a körben nincs; ha később lesz postafiók, az harmadik
csatornaként jön, és a felület nem változik.

**D2 · Élesben az AI a felhőben fut.** A Dell marad fejlesztésre és Vilmos saját munkájára.

**D2 következménye, amit a rajznak tudnia kell:** így **nem lesz „helyi vagy felhős" kapcsoló**,
mert élesben helyi AI nincs — egy ilyen kapcsoló olyat ígérne, amit a rendszer nem tud betartani.
Ami helyette van, és igaz: **kimondjuk az adatutat**, és adunk **egy valódi kapcsolót** arra,
hogy egy szervezetnél menjen-e ki AI-hívás egyáltalán.

## 3. Hol él a lap

Ugyanaz a minta, mint a Theme-beállításoknál és a Feliratoknál: **két szint.**

- **Közös alap** — a rendszergazda állítja, minden munkatérre hat
- **Szervezeti felülírás** — a munkatér tulajdonosa állítja, csak rá hat

A rendszergazda szintválasztót lát, a tulajdonos csak a sajátját. A néző nem látja a lapot.

## 4. Első fül — Értesítések

### 4.1 Mi jelezzen — kapcsolók

Mindegyik mögött valódi, ma is létező jel van:

| Esemény | Honnan tudjuk |
|---|---|
| Egy forrás kiesett vagy korlátozottá vált | a forrás állapota: `hibas` / `korlatozott` |
| Az AI nem válaszolt, az értékelés függőben maradt | `AI_NEM_ELERHETO`, a futás `ai_fuggoben` állapota |
| Elfogyott a havi AI-keret | `AI_KERET_KIMERULT` |
| A napi figyelés nem futott le | a napi ütemezés és az utolsó futás összevetése |
| A mentés nem futott le | a mentésnapló |
| Sok sikertelen belépés egy fiókra | a belépési kísérletek naplója |

### 4.2 Hova menjen

- **A felületre: mindig.** Ez nem kapcsolható ki — ha nem látszik sehol, akkor nem történt meg.
- **Telefonra: csak az üzemeltetőnek**, és csak a súlyosakról. A rajzon egy sor mutatja, hogy
  a csatorna be van-e kötve, plusz egy „Próbaüzenet" gomb. **A csatorna titka a vaultban él,
  a felületen soha nem látszik.**

### 4.3 A „Mi történt" lista

Egy egyszerű lista: mikor, mi, melyik munkatérben, és megjelölhető olvasottnak. Ez az, ami a
kezdőképernyő (R-1) mögött áll.

## 5. Második fül — Adatpolitika

### 5.1 Az adatút — kimondva, nem elrejtve

A lap **megmondja, mi hagyja el a rendszert.** Ez mérésből tudjuk, nem feltételezés:

| Mi megy ki | Kihez | Mikor |
|---|---|---|
| a cikkek kivonata és a szervezet profilja | az AI-szolgáltatóhoz | minden értékeléskor |
| a figyelt oldalak lekérése | a forrásoldalakhoz | minden futáskor |
| **a felület betűkészlete** | a Google-höz | minden oldalbetöltéskor, **minden látogató böngészőjéből** |

A harmadik sor ma valóság, és nyitott tétel: saját kiszolgálóról kiváltható, de még nincs
kiváltva. **A rajz mondja ki, ne hallgassa el** — amíg így van, ez része az adatútnak.

Amit a rendszer **nem** tárol: az `ai_hivas` napló a kiküldött szöveget nem őrzi meg, csak
számokat (tokenek, idő, költség, siker vagy hibakód).

### 5.2 A kapcsoló, ami igaz

**„Ennél a munkatérnél menjen ki AI-hívás?"** — be vagy ki.

Ha **ki**: a figyelés továbbra is **gyűjt** (letölti a cikkeket), de **nem értékel** — nincs
fontosság, nincs indoklás, nincs összefoglaló, nincs tartalomötlet. A találatok nyersen állnak.
**A rajz ezt mondja ki előre**, mielőtt valaki átbillenti, és a kikapcsolt állapotban is
folyamatosan látszik, mi az ára.

A havi keret nem ide tartozik: az a Költség lapon él, ide csak hivatkozás megy rá.

## 6. Amit ehhez a laphoz MEG KELL ÉPÍTENI — ma nincs meg

- **eseménynapló**: mi történt, mikor, melyik munkatérben, olvasott-e
- **az események keletkezése** a meglévő helyeken (forrásállapot, AI-hiba, keret, elmaradt napi
  futás, elmaradt mentés, sikertelen belépések)
- **értesítési beállítás tárolása két szinten** (közös alap + szervezeti felülírás)
- **kimenő üzenet csatorna**, a titok a vaultban
- **szervezetenkénti „AI-hívás ki/be" kapcsoló**, és az érvényesítése minden AI-hívás előtt

**Egy figyelmeztetés:** a mentés ma **nem fut magától** — a napi indítás beállítása a Synology
feladatütemezőjében Vilmos egyszeri kattintása. Amíg ez nincs meg, a „mentés kimaradt" jelzés
minden nap szólni fogna. A rajzra rákerülhet, de a kapcsoló alapból legyen kikapcsolva, és egy
mondat mondja meg, miért.

## 7. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | **Értesítések fül — szervezeti szint** (a tulajdonos nézete) | asztali 1440 |
| 2 | **Értesítések fül — közös alap** (rendszergazda, szintválasztóval és a telefonos csatorna állapotával) | asztali 1440 |
| 3 | **Adatpolitika fül** — az adatút táblája, a kapcsoló **bekapcsolva** | asztali 1440 |
| 4 | **Adatpolitika fül** — a kapcsoló **kikapcsolva**: mi változik, kimondva | asztali 1440 |
| 5 | **„Mi történt" lista** — események, olvasott és olvasatlan | asztali 1440 |
| 6 | A lap | telefon 390 |

## 8. Kötelező szabályok a rajzhoz

- **Csak tokenből.** Nincs beégetett szín, betű, betűméret, lekerekítés, térköz. Ha új érték kell,
  ne pixelben írd be: adj vissza külön listát, mi az új token, mi az alapértéke és miért kell.
- **Minden látható szöveg felirat-kulcsból jön**, három nyelven: magyar, román, angol.
  Az alapnyelv az angol.
- **Halott vezérlő tilos.** Csak olyan kapcsoló kerülhet a rajzra, amihez a 4., 5. vagy 6. pont
  szerint van vagy lesz gépezet.
- **Semmilyen titok nem látszik a felületen** — se csatorna-azonosító, se kulcs. Csak az, hogy
  be van-e kötve.
- **Sötét felület** — a világos változat a tokenekből jön.
- **Illeszkedjen a Theme-beállítások lapjához**: ez annak a testvére — két szint, szintválasztó,
  tervezet és alkalmazás, üzenetsáv ugyanott.
- **A megerősítő sáv a képernyő aljára rögzüljön**, ne a kártya aljára (E-50 tanulsága).

## 9. Amit az átadóban kérek vissza

- a `.dc.html` rajz és egy `ATADO.md`
- **minden szöveg kulccsal, három nyelven** — az adatút mondatai és a kikapcsolás
  következményét kimondó szöveg is
- **mely tokeneket használtad**; ha új kell, külön lista indoklással
- melyik kapcsoló melyik jelből dolgozik (a 4.1 és 6. pont neveivel)
- telefonon mi marad el és mi tör sorba
