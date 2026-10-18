# Első építési egység — a közös profil és az onboarding végig működő útja

Claude Cowork · 2026-09-06 · az átadó 18. fejezet 3. pontja

## 1. Mi a cél, egy mondatban

Üres profilból, weboldal megadása nélkül is végig lehessen menni a három lépésen, a piszkozat
tényleg mentődjön és visszatöltődjön, a jóváhagyott profil pedig a központi fiókoldalon
szerkeszthető legyen — magyarul, románul és angolul.

Ez az átadó 3. szakasza. Amit bizonyít: **A-01, A-02, A-03, A-04, A-05, A-06**, és teljesíti az
**R-05, R-06, R-14, R-15, R-16, R-17, R-18** követelményt.

## 2. Amit ez az egység NEM tartalmaz

Hogy ne legyen félreértés a végén: nincs benne arculati verziókezelés (4. szakasz), nincs
Theme-adminfelület (4. szakasz), nincs hírfigyelő (5. szakasz), nincs második befogadó rendszer
(6. szakasz), és nincs fizetés. Ezek külön egységek.

## 3. A lépések

Minden lépés végén kimegy a tesztoldalra, és kapsz róla képernyőképet. Amelyik lépés képernyőt
érint, az **rajzzal indul és a te jóváhagyásoddal folytatódik**.

| # | Mi készül | Mit látsz a teszten a végén | Idő | Ágens |
|---|---|---|---|---|
| E-1 | A tárhely váza, a csomagok helye, a **határőr** (ami elbukik, ha egy modul olyat használ, amit nem szabad), és egy üres alkalmazás | A `saas.mediapartizan.ro` már nem a mostani üres lapot mutatja, hanem a valódi alkalmazás üres kezdőképernyőjét. Ezzel bizonyítjuk, hogy a lánc működik: kód → feltöltés → tesztoldal magától frissül. | 1,5 óra | 1 |
| E-2 | Adatbázis a NAS-on, az első táblák (szervezet, felhasználó), **két teszt szervezet** | Egy belső ellenőrző oldal mutatja: két külön szervezet adata létezik és nem látja egymást | 1 óra | 1 |
| E-3 | Belépés e-mail + jelszóval, szervezet létrehozása | Regisztrálsz, belépsz, létrejön a szervezeted | 2 óra | 2 |
| E-4 | A megjelenés tokenkészlete és a három nyelv váza, a v6 csomag `tema-alap.json` szerkezetéből | Ugyanaz a képernyő magyarul, románul, angolul; a nyelvváltás nem veszít adatot | 2 óra | 2 |
| E-5 | **Rajz:** onboarding 1. lépés (Claude Design) | Megkapod a rajzot, jóváhagyod vagy javíttatod | 1 óra | 1 |
| E-6 | Az 1. lépés kódban, piszkozat-mentéssel | Kitöltöd, kilépsz, visszajössz — ott folytatod, ahol abbahagytad | 3 óra | 3 |
| E-7 | AI-csatlakozó és teszt-csatlakozó; a tevékenység-összefoglaló javaslata | Beírsz egy weboldalt vagy pár mondatot, és kapsz egy javítható összefoglalót | 2 óra | 2 |
| E-8 | **Rajz + kód:** 2. lépés (célközönség, cél, nyelvek, hangnem) | Végigmegy a második lépés | 3 óra | 3 |
| E-9 | **Rajz + kód:** 3. lépés (ellenőrzés, eredetjelölés, jóváhagyás) | Jóváhagyod a profilt, és látod, mi honnan jött | 3 óra | 3 |
| E-10 | A központi fiókoldal minimuma | A jóváhagyott profil ott szerkeszthető, nem az onboardingban | 2 óra | 2 |
| E-11 | A hibautak: mentési hiba, AI-kiesés, forráshiba | Mindhárom hibát előidézzük, és látod, hogy nem tűnik el adat és nincs hamis sikeroldal | 2 óra | 2 |
| E-12 | Fordított ellenőrzés + végigjátszás mindhárom nyelven, telefonos mérettel is | Képernyőképek mindenről, és a lista, hogy melyik elfogadási feltétel teljesült | 1,5 óra | 2 |

**Összesen kb. 24 óra munka.** Ez nem 24 óra várakozás neked: az E-2, E-4 és E-7 párhuzamosan
mehet az előtte lévővel, mert nem érnek egymáshoz. Reális ütem, ha nincs elakadás: **három nap**,
és az első nap végén már kattintható az 1. lépés.

## 4. Hol lehet igazán elakadni

Ezeket előre kimondom, hogy ne érjen meglepetés:

- **E-1:** a NAS-on új adag indul (alkalmazás, adatbázis, háttérmunkás). Ha kevés a hely vagy a
  memória, ez most derül ki. Ellenőrzöm, mielőtt bármit telepítek.
- **E-3:** a jelszókezelés az a pont, ahol nem szabad sietni. Kész, bevált könyvtárat használunk,
  nem sajátot írunk.
- **E-7:** itt kell először valódi AI-szolgáltató. Addig teszt-csatlakozóval megy minden, hogy a
  folyamat kipróbálható legyen kulcs nélkül is.
- **TypeScript 7:** friss fordító. Ha az első nap akadozik, visszalépünk a 6-os ágra — ez a terv
  része, nem kudarc.

## 5. Amire szükségem van tőled

| Mikor | Mi |
|---|---|
| E-1 előtt | csak a szavad, hogy induljon |
| E-5, E-8, E-9 előtt | a rajz jóváhagyása (ez a te öt perced, de nélküle nincs kód) |
| E-7 előtt | döntés az első AI-szolgáltatóról és az adatpolitikáról — akkor kérdezem, egy kérdésben |
| E-12 után | a te végigjátszásod: amit te nem próbáltál ki, az nincs kész |

## 6. Az egység akkor kész, ha

- [ ] Üres profilból, weboldal nélkül végigvihető az onboarding (A-01)
- [ ] Az AI javaslata és a kézi javítás elkülönül, újragenerálás nem veszít adatot (A-02)
- [ ] AI-kiesés és forráshiba külön látszik, kézi folytatás működik (A-03)
- [ ] Mentési hiba nem mutat sikert, visszatéréskor tényleg visszatöltődik a piszkozat (A-04)
- [ ] A jóváhagyott profil a központi fiókoldalon szerkeszthető (A-05)
- [ ] HU/RO/EN felület és hibaüzenetek, a nyelvváltás megőrzi a munkát (A-06)
- [ ] Két teszt szervezet adata nem keveredik (A-11 első bizonyítása)
- [ ] Minden képernyő megegyezik a rajzával, többlet nincs
- [ ] Te végigmentél rajta, és kaptál képernyőképet mindenről
