# Design-kérés — R-5 · Csomag (pilot), Kimenő értesítések, AI-kapcsoló — artboardról artboardra

2026-09-13 · Aitmetica SRL · Írta: az orchestrator, Vilmos döntése (D-F35) után. Ez az **utolsó rajzkör**: a négy előző rajz (R-2, R-3 v2, R-4, R-6) beépült és kint
van a teszten (https://saas.mediapartizan.ro — a képek: `/allapot/kepek/r2/ … r6/`). Ami itt nincs megrajzolva, az nem épül meg. Ami itt gépezet nélkül áll, azt
nem szabad rajzolni — a `kerdesek.md`-be való.

## 0. Mi ez a három dolog, és miért egy körben

| # | Mi | Kinek | Hova kerül | Miért most |
|---|---|---|---|---|
| A | **Csomag** csempe | tulajdonos és rendszergazda | a Gépház rácsába | az F-7 (Előfizetés) képernyője; a pilotban egy csomag van, ár nélkül — de a felhasználó lássa, mi az övé, és mi következik |
| B | **Kimenő értesítések** csempe + lap | tulajdonos (a munkatér felülírása), rendszergazda (a közös alap) | Gépház csempe → saját lap `/gephaz/kimeno` | kész, próbázott gépezet képernyő nélkül (T-23) |
| C | **AI-kapcsoló** | tulajdonos | a Beállítások lap Adatpolitika fülén (R-4 03. artboard), a felhő-kapcsoló doboza mellé | kész, próbázott gépezet képernyő nélkül (T-23) |

## 1. Amiből építkezz — ez ma van

- **Felső sáv** mindenhol (R-1 v4). **Gépház** (`/gephaz`, R-1 v4 8. artboard): csempék rácsa, `--tile-min` (300px) szerint 3 hasáb 1440-en, 1 hasáb telefonon.
  Ma a rendszergazda 4 csempét lát (Fiókok · Theme · Feliratok · Költség), a tulajdonos 2-t (Költség · Munkatér a pénznem-választóval). **A két új csempe ebbe a rácsba jön**,
  a csempék felépítése (cím · mérőszám/állapot · egy mondat · hivatkozás „→") a meglévőké. A néző a Gépházt nem látja.
- **Beállítások lap** (`/beallitasok`, R-4): Értesítések · Adatpolitika fül. Az Adatpolitika fül tulajdonos-nézetén jobbra a „felhő-kapcsoló" doboza áll **„még nem működik"**
  jelöléssel — a C ide jön, mellé.
- **Tokenek**: R-1 v4 `:root` + az R-4 hat tokenje (`--keszul`, `--keszul-bg`, `--keszul-border`, `--olvasatlan`, `--kapcsolo-w`, `--kapcsolo-h`); a tizenöt térközfok. **Új token nem kell.**
- **Kapcsoló-komponens** (R-4): be / ki / letiltott („még nem működik"). **A jelölés nyelve** (R-4): szaggatott `--keszul-border` keret, `--keszul-bg` alap, `jelzes.meg_nem_mukodik`
  jelvény, és **mindig egy mondat**, miért nem működik és mi kell hozzá.
- **Elv, ami mind a négy rajzban él:** amit a szerepe miatt nem tehet, azt **nem mutatjuk** (nem szürkén, egyáltalán nem); kikapcsolt vezérlő csak ott, ahol a funkció készül.

## 2. A gépezet — pontosan ezek a végpontok és válaszok vannak

### A · Csomag

| Mit | Végpont | Ki | A válasz (a pilotban) |
|---|---|---|---|
| a munkatér csomagja és a rendszer moduljai | `GET /api/csomag` | tag | `{ "csomag": { "kod": "pilot", "modulok": ["hirfigyelo"], "ar_havi": null, "penznem": null }, "modulok": [{ "modul": "hirfigyelo", "benne": true }] }` |
| a csomag neve, magyarázata | feliratkulcs | — | `csomag.pilot_nev` = „Pilot" · `csomag.pilot_megj` = „A pilot csomag: a Hírfigyelő modul, ár és fizetés nélkül. Az árazás a pilot után dől el." |
| a modul-kapu | a hírfigyelő minden végpontja | — | ha a modul nincs a csomagban → 403 `MODUL_NEM_ELERHETO` („Ez a modul nincs a munkatér csomagjában."); a sáv Modulok lenyílója csak a csomag moduljait mutatja |

**Nincs**: csomagváltás, ár, fizetés, számla, kártya, próbaidő, lemondás. Ezek **nem** kerülnek a rajzra — csak a „még nem működik" sor és a `kerdesek.md`.

### B · Kimenő értesítések (webes horog)

| Mit | Végpont | Ki | A válasz |
|---|---|---|---|
| a beállítás három szintje | `GET /api/ertesites` | tag | `{ "beallitas": { "kozos": {…}, "szervezeti": {…}, "hatasos": {…} } }` — mindhárom `fajta → "kimeno" \| "nincs"`; a `kozos` és a `szervezeti` **csak a felülírt** fajtákat tartalmazza, a `hatasos` mind a 25-öt (alap: mind `nincs`) |
| a munkatér felülírása | `PUT /api/ertesites` | tulajdonos | törzs: `{ "futas_hiba": "kimeno", "keret_kimerult": "kimeno" }` — csak a felülírt fajták; egy fajta törlése a felülírásból = kihagyod a törzsből (**örökli** a közöset) |
| a közös alap | `PUT /api/ertesites/kozos` | rendszergazda | ugyanaz az alak |
| a horog címe | a NAS `.env`-jében (`ERTESITES_WEBHOOK_URL`) — **titok, a felületen soha** | — | a lap csak ezt mondja: „a kimenő csatorna be van kötve" / „nincs bekötve" (ezt egy új mező adja: `GET /api/ertesites` → `bekotve: true|false`, **megépítjük** a rajzhoz) |
| mi megy ki | — | — | eseményenként **egy rövid üzenet**: a fajta címe és egy mondat (`esemeny.<fajta>_cim`, `_szoveg`), a munkatér azonosítója, az idő — **a tartalom soha** (cikk, profil, jelszó) |

**A 25 eseményfajta**, csoportosítva (a neveik megvannak: `esemeny.<fajta>_cim`):

| Csoport | Fajták |
|---|---|
| Fiók és belépés | `belepes`, `kilepes`, `jelszo_valtas`, `kileptetes_mindenhol`, `belepesi_kiserletek` (rendszerszintű) |
| Tagok | `meghivo_kiadva`, `meghivo_visszavonva`, `meghivo_elfogadva`, `tag_felveve`, `szerep_valtozott`, `tag_eltavolitva`, `tag_kilepett` |
| Hírfigyelő futás | `futas_indult`, `futas_kesz`, `futas_hiba`, `futas_beragadt`, `forras_hibas`, `ai_nem_valaszol`, `keret_kimerult` |
| Beállítás és profil | `tema_alkalmazva`, `feliratok_alkalmazva`, `profil_jovahagyva`, `ai_kapcsolo_valtozott`, `fajl_feltoltve` |
| Rendszer | `mentes_kimaradt` |

### C · AI-kapcsoló (a munkatéré)

| Mit | Végpont | Ki | A válasz / hatás |
|---|---|---|---|
| állás | `GET /api/beallitas/ai` | tag | `{ "beallitas": { "ai_engedelyezve": true } }` |
| kapcsolás | `PUT /api/beallitas/ai` `{ "engedelyezve": false }` | tulajdonos | **kikapcsolva egyetlen AI-hívás sem indul a munkatér nevében**: a hírfigyelő letölti a híreket, de nem értékel — a találat „az AI nem elérhető" jelölést kap, a futás lefut; az onboarding AI-javaslatai sem készülnek. Az esemény: `ai_kapcsolo_valtozott` (a naplóban és az értesítésben látszik) |

**Különbség a felhő-kapcsolótól** (ami „még nem működik" marad): az AI-kapcsoló **mindent** leállít; a felhő-kapcsoló majd csak a felhős szolgáltatót tiltaná, a házon belülit engedné.
A rajz mondja ki ezt egy mondatban, a két doboz egymás mellett áll.

## 3. Az artboardok — ezt kérem, ebben a sorrendben

### 01 · Gépház, tulajdonos — asztali 1440

A mai két csempe (Költség · Munkatér) mellett **két új**: **Csomag** és **Kimenő értesítések**. A rács így 4 csempés (2×2 vagy 3+1 — a rács dönt, a `--tile-min` szerint).

**Csomag csempe** (a csempe teljes tartalma, felülről):
1. cím: `csomag.cim` = „Csomag"
2. a csomag neve nagy jelvényként vagy mérőszám helyén: `csomag.pilot_nev` = „Pilot"
3. egy sor: `csomag.modulok_cimke` = „Modulok" · a modul neve (`hf.modTitle` — megvan: „Hírfigyelő") · `csomag.benne` jelvény = „benne" (`--ok`)
4. a mondat: `csomag.pilot_megj` (megvan)
5. **jelölt sor a jövőnek**: `csomag.arazas_cim` = „Árazás és fizetés" + `jelzes.meg_nem_mukodik` jelvény + kikapcsolt kapcsoló NÉLKÜL (itt nincs mit kapcsolni — csak a szaggatott keretes sor) +
   `csomag.arazas_miert` = „A pilot után dől el. Amíg nincs ár, a csomag nem jár le, és nem kér fizetést."
6. **nincs gomb, nincs hivatkozás** (a csempe tájékoztat) — ez az egy csempe, aminek nincs „→"-ja; a rajz jegyzete mondja ki, miért.

**Kimenő értesítések csempe**:
1. cím: `kimeno.cim` = „Kimenő értesítések"
2. állapot-sor: `kimeno.bekotve` = „A kimenő csatorna be van kötve" (`--ok` pont) **vagy** `kimeno.nincs_bekotve` = „A kimenő csatorna nincs bekötve" (`--text-dim`, nem hibaszín — nem hiba, csak nincs)
3. mérőszám: `kimeno.kimeno_szam` = „{n} eseményről megy ki üzenet" — `n` = a `hatasos`-ban a `kimeno`-k száma (a pilot alapján 0: „0 eseményről megy ki üzenet")
4. a mondat: `kimeno.megj` = „Egy rövid üzenet megy ki egy webes horogra, ha a kiválasztott események megtörténnek. A tartalom soha nem megy ki, csak a fajta és egy mondat."
5. hivatkozás: `kimeno.megnyitas` = „Beállítás →" → `/gephaz/kimeno`

### 02 · Gépház, rendszergazda — asztali 1440

A mai négy csempe (Fiókok · Theme · Feliratok · Költség) + **Csomag** + **Kimenő értesítések** (6 csempe, 3 hasáb). A Csomag csempe a rendszergazdánál **ugyanaz**, plusz egy
halk sor: `csomag.rendszergazda_megj` = „Ma minden munkatér a Pilot csomagban van. Csomagváltás nincs — a pilot után." A Kimenő értesítések csempe a rendszergazdánál a
**közös alapról** szól: a 3. sor `kimeno.kozos_szam` = „a közös alap: {n} eseményről megy ki üzenet", a hivatkozás ugyanoda.

### 03 · Kimenő értesítések lapja — tulajdonos, asztali 1440 (`/gephaz/kimeno`)

Fejléc: `kimeno.cim` + a vissza-út a Gépházra (mint a Theme/Feliratok lapon). Alatta:

1. **állapot-doboz** a csatornáról: `kimeno.bekotve` / `kimeno.nincs_bekotve`, és a mondat `kimeno.csatorna_megj` = „A horog címét a rendszergazda állítja be a kiszolgálón; a felületen nem
   látszik. Ha nincs bekötve, a beállítás megmarad, és él, amint a csatorna bekötődik."
2. **a lista** — a 25 fajta az 5 csoportban (a csoport címe kulcs: `kimeno.csoport_fiok`, `_tagok`, `_futas`, `_beallitas`, `_rendszer`). **Egy sor** = a fajta neve (`esemeny.<fajta>_cim`) ·
   a közös alap oszlopa (**csak olvasható**: „kimenő" / „nincs" — `kimeno.alap_kimeno`, `kimeno.alap_nincs`) · a munkatér oszlopa: **háromállású** választó: `kimeno.orokli` = „örökli"
   (nincs felülírás) · `kimeno.kimeno` = „kimenő" · `kimeno.nincs` = „nincs" · a **hatásos** oszlop: egy pont + szó (`kimeno.hatasos_kimeno`/`kimeno.hatasos_nincs`).
   A `belepesi_kiserletek` sor **csak a rendszergazdánál** (rendszerszintű esemény — a tulajdonos lapján nincs ott).
3. **mentés**: a lap alján `kimeno.mentes` = „Beállítás mentése" gomb + a mentés állapota (mint a Theme lapon: „Mentve 10:12"); a mentés a `PUT /api/ertesites`-t hívja a felülírt
   fajtákkal. A rajz jegyzete: a háromállású választó helyett lehet két kapcsoló is — de a rajz dönt, egy megoldással.
4. jegyzet a lap alján: `kimeno.nem_ugyanaz` = „Ez a munkatér külső csatornája. Hogy neked a felületen miről szóljunk, azt a Beállítások → Értesítések fülön állítod." →
   hivatkozás `/beallitasok`.

### 04 · Kimenő értesítések lapja — rendszergazda, asztali 1440

Ugyanaz a lap, de a **közös alapot** állítja: a munkatér oszlopa nincs, a közös alap oszlopa **kapcsoló** (kimenő / nincs), a hatásos oszlop nincs (a közös alap = a hatásos, ahol
a munkatér nem ír felül). A `belepesi_kiserletek` sor itt van. Mentés: `PUT /api/ertesites/kozos`. Egy mondat a tetején: `kimeno.kozos_megj` = „A közös alap minden munkatérre
érvényes, ahol a tulajdonos nem ír felül. Alapból semmiről nem megy ki üzenet."

### 05 · Adatpolitika fül, tulajdonos — az AI-kapcsoló doboza (asztali 1440)

Az R-4 03. artboardja **változatlan**, egy új dobozzal a felhő-kapcsoló doboza **mellett** (bal oldalon a szolgáltató doboza marad; a jobb oszlopban két doboz egymás alatt, vagy
a jobb doboz kétfelé — a rajz dönt): **„Az AI a munkatérben"** (`ai_kapcsolo.cim`), egy **működő** kapcsoló (be = `ai_kapcsolo.be` = „az AI dolgozik", ki = `ai_kapcsolo.ki` = „az AI
kikapcsolva"), alatta három mondat:
- `ai_kapcsolo.mit_tesz` = „Kikapcsolva egyetlen AI-hívás sem indul a munkatér nevében. A hírfigyelő letölti a híreket, de nem értékeli őket — a találatok »az AI nem elérhető« jelölést kapnak."
- `ai_kapcsolo.d19` = „A hírek letöltése ettől függetlenül fut: abban a lépésben ügyféladat nem hagyja el a rendszert."
- `ai_kapcsolo.kulonbseg` = „Ez nem a felhő-kapcsoló: az mindent leállít, ami AI; a felhő-kapcsoló majd csak a felhős szolgáltatót tiltaná, a házon belülit engedné."
Két állapot: **A** bekapcsolva (alap) · **B** kikapcsolva — a kapcsoló mellett `ai_kapcsolo.kikapcsolva_mikor` = „Kikapcsolva {ido} · {ki}" (az `ai_kapcsolo_valtozott` eseményből;
ha nincs adat, a sor elmarad). **Nézőnek és szerkesztőnek a doboz nincs ott** — ők az R-4 04. artboardját látják, változatlanul.

### 06 · A hírfigyelő, kikapcsolt AI-val — asztali 1440

Egy állapot a hírfigyelő áttekintőjén (`/hirfigyelo`, meglévő lap): a lap tetején egy **figyelmeztető sáv** (nem hiba: `--warn`): `ai_kapcsolo.hirfigyelo_sav` = „Az AI ki van kapcsolva
ebben a munkatérben — a hírek letöltődnek, az értékelés áll. Bekapcsolni az Adatpolitika fülön tudod." + hivatkozás `/beallitasok?ful=adatpolitika` (**csak tulajdonosnak** a hivatkozás;
másnak a mondat hivatkozás nélkül). A találatok listáján a meglévő „AI nem elérhető" jelölés áll — azt nem kell újrarajzolni, csak a rajz mutassa a sávot a lap tetején.

### 07 · Telefon 390 — a Gépház a két új csempével, és a Kimenő értesítések lapja

Egy oszlop; a Kimenő lapon a 25 sor csoportonként **összecsukható** (a csoport címe kattintható, alapból az első csoport nyitva), a soron a fajta neve alatt a választó teljes
szélességben. A rendszergazda-nézet telefonon nem kell külön (ugyanaz a szerkezet).

## 4. Feliratkulcsok — előtagok és a meglévők

Új előtagok: **`csomag.*`** (a `csomag.pilot_nev`, `csomag.pilot_megj` már megvan — ne duplázd), **`kimeno.*`**, **`ai_kapcsolo.*`**. Meglévők, amiket a rajz használ: `esemeny.<fajta>_cim`
(25), `jelzes.meg_nem_mukodik`, `hf.modTitle`, `nav.gephaz`, `gephaz.*` (a Gépház címei), `kozos.megse`, `kozos.rendben`. A javasolt magyar mondatok fent állnak — a Design
pontosíthatja; a **román és angol** a Design dolga, mint eddig. Ami adat, nem felirat: a csomag kódja, a számok, az idők, a fajták belső nevei.

## 5. Kérdések, amikre a `kerdesek.md`-ben várom a választ (vagy a döntést)

1. A kimenő lista háromállású választója (örökli · kimenő · nincs) vagy két kapcsoló (felülírom? · kimenő/nincs) — melyik olvashatóbb 25 sorral?
2. A Csomag csempe a tulajdonosnál a rács melyik helyére kerüljön (első, hogy lássa, mi az övé — vagy utolsó, mert nincs benne tennivaló)?
3. Kell-e a Kezdőképernyőre egy csempe-jelzés, ha az AI ki van kapcsolva (a hírfigyelő csempéje ma „részleges futás"-t tud mutatni) — vagy elég a 06. sáv?

## 6. A csomag alakja és a szabályok

Ugyanaz, mint eddig: `rajz/R5-csomag-kimeno-ai.dc.html` (egy fájl, minden artboard) + `support.js`, `ATADO.md`, `feliratok.json` (hu · ro · en), `adatkotes.md`, `kerdesek.md`,
`tokenek.md` — a `SynologyDrive/SaaS/be/` mappába. Csak tokenből (új token nem kell); minden szöveg kulccsal; **halott vezérlő tilos** — ami itt nincs a 2. pontban, annak nincs
gépezete; sötét felület; a felső sáv minden lapon; a hálózat-igényt az átadó mondja ki. **Ár, fizetés, számla, csomagváltás: nincs a rajzon** (D-F35).
