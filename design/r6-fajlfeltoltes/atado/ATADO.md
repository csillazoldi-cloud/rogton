# R-6 · Fájlfeltöltés az arculathoz — átadó

2026-09-12 · Aitmetica SRL · a sorrend harmadik tétele (R-2 → R-3 → **R-6** → R-4)

## 0. A hiteles rajzfájl és a hálózat

A hiteles rajz: **`rajz/R6-arculat-fajlok.dc.html`**. Egyetlen fájl, benne **hat artboard** (01–06).

**A megnyitásához hálózat kell** (a betűk a Google Fontsról), és a **`support.js` a rajz mellett kell** legyen — a csomag `rajz/` mappájában ott van.

Tokenkészlet az R-1 v4 `:root`-ja, szó szerint. **Új token nincs.**

## 1. Ez nem lap, hanem komponens

Az arculat-blokk **két helyen, ugyanígy** jelenik meg: az onboarding 3. lépésén és az ügyfélprofilon. A rajz az ügyfélprofil-beli megjelenést mutatja (01. artboard, a felső sávval), a többi artboard magát a blokkot nagyítja ki. **Egy komponens, két hely** — az onboardingban ugyanez a markup áll, más környezetben.

## 2. A hat artboard

| # | Mi | Méret |
|---|---|---|
| 01 | Az arculat-blokk üresen, az ügyfélprofil lapon, a felső sávval — négy cél egymás mellett | asztali 1440 |
| 02 | Feltöltés — **A:** közben · **B:** kész, előnézettel · **C:** néző szerep, csak olvasás | asztali 1440 |
| 03 | A négy hibaút — SVG · nem engedett típus · túl nagy · üres | asztali 1440 |
| 04 | Az előnézet szabályai — széles · magas · átlátszó · PDF | asztali 1440 |
| 05 | Csere — **A:** a megerősítés és a tervezet következménye · **B:** a lista csere után, eltávolítás nélkül | asztali 1440 |
| 06 | Az arculat-blokk telefonon — a négy cél egymás alatt | telefon 390 |

## 3. Amit a rajz eldöntött

**Nincs Eltávolítás gomb — de a régi példány sem tűnik el a szem elől.** A gépezetben nincs törlés, ezért a rajzon Csere van. A csere után a **régi fájl a listában marad**, halkabb sorban, „az 1. jóváhagyott tervezetben" jelöléssel és Megnyitás gombbal. Így a felhasználó érti, miért nem törölhet: a korábbi jóváhagyott tervezet arra a fájlra hivatkozik.

**A csere megnevezi a tervezet-következményt.** A megerősítés nem azt kérdezi, hogy „biztos?", hanem elmondja: az arculati tervezet új változatot kap, újra jóvá kell hagyni, és **amíg az új nincs jóváhagyva, a tartalomgyártás a régit követi**. Ez a 6.2 szabály felületi megfogalmazása.

**Nincs százalékos haladásjelző.** A feltöltés és az ellenőrzés egy lépés, a hossza nem mérhető előre — pörgő jelző és egy mondat áll a helyén. A rajz jegyzete ezt ki is mondja.

**A típus a tartalomból dől el, és ez látszik a felületen.** Két helyen: a feltöltés közben („a típust a fájl tartalmából állapítjuk meg, nem a nevéből"), és a `TIPUS_NEM_ENGEDETT` hibánál („az átnevezés nem segít"). Különben a felhasználó átnevezi a fájlt, és nem érti, miért nem megy.

**Az SVG hibája megmondja, mit kérjen.** Nem csak azt, hogy nem megy: kérje PNG-ben, átlátszó háttérrel, legalább 512 pixel szélesen. Alatta egy halkabb mondat az okról (futtatható kódot is tartalmazhat) — mert ok nélkül a tilalom önkényesnek hat.

**Egy méretkorlát van, és a rajz mindenhol 10 MB-ot ír.** A régi feladatlap 2/20 MB-ot említett — az elévült. A hibamondat mellett ott a megjegyzés: „a korlát minden célra ugyanaz".

**A logó előnézete világos ÉS sötét háttéren látszik.** Nem azért, mert két fájl van — hanem hogy kiderüljön, hol tűnik el a logó. A mondat ki is mondja: sötét háttérre külön fájlt most nem tudunk tárolni (egy `logo` cél van).

**PDF-ből nincs képes előnézet.** A típus, az oldalszám és a méret áll a helyén. Kitalált miniatűrt nem mutatunk — ez a 04. artboard negyedik esete.

**A hibák a feltöltő mező helyén állnak, a fájl nevével.** Ha több fájlt dobtak be egyszerre, látszik, melyikkel van a baj. A hibás fájl nem kerül a listába, és a korábbi példány érintetlen.

**A néző szerepnél a feltöltő mezők nem jelennek meg** — nem zárt állapotban, hanem egyáltalán. A meglévő fájlok viszont megnyithatók.

## 4. Halott vezérlő

| A rajzon | Végpont |
|---|---|
| feltöltő mezők (négy cél) | `POST /api/arculat/fajl` · fejléc: `x-fajl-nev`, `x-fajl-cel` |
| a fájlok listája célonként | `GET /api/arculat/fajl?cel=<cel>` |
| Megnyitás | `GET /api/arculat/fajl/{id}` |
| Csere | ugyanaz a `POST` — új példány, a régi megmarad |
| a tervezet-jelvény és a „jóváhagyott tervezetben" jelölés | `ArculatTervezet.logo_fajl_id` |

**Ami nincs a rajzon, mert nincs mögötte gépezet:** Eltávolítás, fájl átnevezése, több fájl egyszerre kijelölése, sötét háttérre szánt külön logó-hely, képes PDF-előnézet, feltöltés visszavonása félúton.

## 5. Feliratkulcsok

Új kulcsok: **`arculat_fajl.*`** (44), mind a három nyelven. A `meglevo_kulcsok` blokkban a `fajl.hiba_*` ötös — **ha a rendszerben más a szövegük, a rendszeré a hiteles**.

Minden hibakódhoz **két vagy három** felirat tartozik: a rendszerbeli hibamondat, a rajz „mit tegyek" mondata, és ahol az ok nem magától értetődő, egy harmadik, halkabb magyarázat.
