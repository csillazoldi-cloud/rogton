# Ellenőrzés — R-3 · Saját fiók, v2 (a Design végső csomagja, „Onboarding felület prototípus10.zip", 2026-09-13 08:54)

A csomag négy rajzot hoz együtt (R-2, R-3 v2, R-4, R-6). Az R-4 és az R-6 fájlai **bájtra azonosak** a beépítettekkel; az R-2-ben csak az `ATADO.md`
egy mondata változott (a rajz megnyitásáról — `support.js` az `unpkg` helyett), a rajz és a kulcsok azonosak. **Új: az R-3 v2.** Mérve az `atado/`
csomagon (python a `feliratok.json`-on és a két `.dc.html` törzsén; `_artboardok.mjs` a képekhez; a gépezet a kódból). Minden szám mérés.

## 1. Összegzés

**Hibátlan, beépíthető.** 6/6 artboard (a v2 a hiteles), 0 pixel-térköz, 62 kulcs három nyelven hiánytalanul (ebből 4 már a rendszerben van), új token
nincs (a `--keszul` hármas az R-4-ből, az már megvan). Minden kattintható elem mögött létező végpont áll; **egy** gépezeti kiegészítés kell: a rajz a
MÁSIK munkatérből is kilép, a mai `POST /api/tagok/kilep` csak az aktuálisból tud — a végpont opcionális `szervezet_id`-t kap (D-F34).

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok (v2) | **6/6** (01 alaphelyzet · 02 egy munkatér A / rendszergazdai blokk B · 03 jelszóváltás A/B/C · 04 négy hibaút · 05 kilépés egy munkatérből · 06 telefon) |
| px-térköz a rajz törzsében | **0** (v1 és v2 is); hex: 18 — mind a `:root` |
| Feliratkulcsok | **62** (`sajat.*` 56, `nav.*` 2, `jelzes.meg_nem_mukodik`, `kozos.megse`, …), mind három nyelven; **4 már megvan** (`kozos.megse`, `jelzes.meg_nem_mukodik`, `nav.beallitasok`, `nav.sajat_fiok_sor`) → 58 új |
| Kulcs, ami a rajzon szövegként áll, kulcs nélkül | a rendszergazdai blokk 4 hivatkozása (Fiókok · Theme · Feliratok · Költség) és a telefon rövid mondatai (bevezető, jelszó-következmény, megőrzés) — **pótolva** a 0058-ban (`sajat.gazda_*`, `sajat.*_rovid`) |
| Tokenek | új nincs; a rajz 11 olyan tokent használ, amit az R-4 nem — mind létezik a designrendszerben (`--pad-field-x`, `--shadow-pop`, `--ok-strong`, `--err-bg` …) |
| Végpont-megfelelés | Név → `PUT /api/fiok/nev` ✔ · Jelszó → `PUT /api/fiok/jelszo` (a válasz `masEszkozokKileptetve`) ✔ · Kiléptetés → `POST /api/fiok/kileptetes-mindenhol` (`torolt`) ✔ · Nyelv → `POST /api/nyelv` ✔ · Kilépek → `POST /api/tagok/kilep` **csak az aktuálisból** → kiegészül |
| Adat, ami nem végpontból jön | az utolsó belépés (a fiók sora), az „Utolsó belépéseim" 3 sora (a belépési napló: `belepesi_kiserlet`, 30 nap — a megőrzés a kódban is 30, `NAPLO_MEGORZES_NAP`), a tulajdonosok száma munkaterenként (az „utolsó tulajdonos" zárt gombhoz) — a lap kiszolgálói adatforrása adja |
| A bejárat | a sáv fiók-neve (eddig `/fiok` = ügyfélprofil) → `/sajat-fiok`; telefonon a menü legalsó sora; az oldalsáv (A fiókod: Saját fiók · Beállítások {n} új) itt épül meg — az R-4 01. artboardja is ezt kérte |
| A rajz megnyitása | hálózat kell (Google-betűk) + `support.js` a rajz mellett — az átadó kimondja |

## 3. A Design kérdései — válaszok

| # | Kérdés | Válasz |
|---|---|---|
| 1 | Egy vagy két mondat a jelszóváltás és a kiléptetés sikerére? | **Két mondat**, a rajz szerint (más a kontextus). |
| 2 | Mit mutat a lap, ha a fiók egyetlen munkatérnek sem tagja? | Előfordulhat (az utolsó tagságot a gépezet nem tiltja). **Nem kell hatodik artboard:** a kilépés válasza megmondja, van-e következő munkatér; ha nincs, a lap a munkatér-létrehozó képernyőre visz (`/szervezet/uj`) — az már megvan, és onnan indul minden fiók. |
| 3 | Kilépés az aktuális munkatérből — hova kerül? | A gépezet dönt: a maradék munkaterek közül az **első** lesz az aktuális (a fiókon tárolt választás, D-F25), a lap újratöltődik a másik munkatérrel; ha nem maradt, `/szervezet/uj`. Új artboard nem kell. |
| 4 | Az „utolsó belépésem" pontossága | A fiók sora a **mostani** belépést tárolja (belépéskor frissül). A v2 listája ezt feloldja: az utolsó 3 belépés látszik, köztük a mostani is — az idegen belépés ott látszik. A régi címke a listánál nem kell. |
| 5 (v2) | A „kiléptetés minden eszközről" ezen a gépen is léptessen ki? | **Marad a mai gépezet:** a többi eszköz lép ki, ez marad (D-F19 — a jelszóváltásnál is így). A rajz ezt mutatja, a szövegek ezt mondják. Vilmos szava, ha mást akar — a rajtad-listára kerül. |

## 4. Döntések ebből (D-F34)

A sáv fiók-neve a `/sajat-fiok`-ra visz (nem az ügyfélprofilra); **a felület nyelve** átköltözik az ügyfélprofil oldalsávjából a Saját fiók lapra (az ügyfélprofil
oldalsávjából a nyelvválasztó elmarad — a sávban marad a gyors váltó). A `POST /api/tagok/kilep` opcionális `szervezet_id`-t kap, és visszaadja a következő aktuális
munkatér azonosítóját. Az e-mail mezője a „még nem működik" jelöléssel zárt (levélküldés nincs). A fiók törlésének sora gomb és jelölés nélkül (tudatos). A
rendszergazdai blokk csak a rendszergazdánál. A telefonos rövid mondatok külön kulcsok.

## 5. Javaslat

**Beépíthető.** F-4b: `SajatFiok` lap + oldalsáv, a `sajatfiok` adatforrás, a kilépés kiegészítése, a sáv és az ügyfélprofil oldalsávjának módosítása, 0058 feliratok, próbák, képek a 6 artboard mellé.
