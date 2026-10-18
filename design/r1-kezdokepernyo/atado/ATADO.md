# ATADO — R-1 · Kezdőképernyő és navigáció (v2)

Rajz: `rajz/r1-kezdokepernyo.dc.html` — egyetlen, önmagában megnyitható fájl, mind a 7 artboarddal.
A 2026-09-11-i, D1–D3 döntéseket tartalmazó feladatlap szerint (`FELADATLAP.md`).

A csomag többi fájlja: `feliratok.json` (minden szöveg kulccsal, en · hu · ro) · `tokenek.md` (használt és új tokenek) · `adatkotes.md` (melyik elem melyik adatból dolgozik) · `kerdesek.md` (eltérések és nyitott kérdések).

Az állandó felső sáv a munkapéldányban külön komponens (`Felso-sav.dc.html`); ebben a csomagban artboardonként a megfelelő állapotára feloldva van beépítve, hogy a fájl önmagában megnyitható legyen.

## 1. Mi változott az első körhöz képest

| Első kör | Most, a D1–D3 szerint |
|---|---|
| A kezdőlapon „Megjelenés és szövegek” csempe és külön „Rendszerszint” blokk | **Nincs.** A négy rendszerszintű lap a **Gépház** ajtó mögött van (4. artboard) |
| A felső sávban Theme-beállítások · Feliratok · Költség · Fiókok lapok | **Gépház** egyetlen elemként, csak rendszergazdának |
| „Az AI összképe” csempe a találatokról | **Nincs.** A kezdőlap nem részletez (D2): állapotot és számot mutat, és továbbvisz |
| „Munkatér” csempe a tagokkal | **Nincs.** A munkatér a sávba tartozik, nem csempe |
| „Arculat” a profil-csempén belül | **Önálló csempe**, saját tovább-linkkel |
| Kézi indítás gomb a hírfigyelő csempén | **Elhagyva** — az 5. pont csempetartalma nem tartalmazza. A kézi indítás a modul Áttekintés lapján marad. Ha mégis kell a csempére, egy szó és visszateszem |
| A lap tetején időzóna-megjegyzés | **Egy mondat: mi történt a legutóbbi belépés óta** |
| 4. artboard: rendszergazda kezdőlap | **4. artboard: Gépház** |
| 6. artboard: váltó + Modulok egy sávban | **Két sáv: egy munkatér (szöveg) és több munkatér (nyitott váltó)**, Modulok nyitva |

## 2. Artboardok

| # | Mit | Méret |
|---|---|---|
| 1 | Kezdőképernyő — normál (van profil, futott a figyelés, vannak találatok) | asztali 1440 |
| 2 | Kezdőképernyő — első használat | asztali 1440 |
| 3 | Kezdőképernyő — néző szerep | asztali 1440 |
| 4 | Gépház — a négy rendszerszintű lap egy helyen, rövid állapottal | asztali 1440 |
| 5 | Kezdőképernyő — normál | telefon 390 |
| 6 | A felső sáv közelről: Modulok nyitva, a munkatér mindkét állapotában | asztali 1440 |
| 7 | A felső sáv telefonon, lenyíló nyitva | telefon 390 |

## 3. Melyik csempe melyik adatból dolgozik (az 5. pont neveivel)

| # | Csempe | Adat | Tovább |
|---|---|---|---|
| 1 | **Hírfigyelő** | utolsó sikeres futás ideje (vagy „még nem futott”) · következő tervezett futás a munkatér időzónájában, vagy „kézi indítás” · új találatok száma · ha fut: „figyelés fut a háttérben” · részleges forráshiba: hány forrás akadt el · „értékelés függőben”, ha az AI nem válaszolt | Hírfigyelő → Áttekintés |
| 2 | **Ügyfélprofil** | jóváhagyva-e, mikor, ki hagyta jóvá · hány rész hiányzik és melyek | Ügyfélprofil |
| 3 | **Arculat** | az arculat állapota: nincs megadva · tervezet · későbbre hagyva · jóváhagyott | Ügyfélprofil, az arculat blokkjához |
| 4 | **Források** | forrásszám állapot szerint: használható · korlátozott · hibás · nem támogatott · ellenőrzés alatt; a korlátozott és a hibás kiemelt kerettel | Hírfigyelő → Figyelés beállítása |
| 5 | **AI-keret** | a hónap hívásszáma, AI-gépideje, becsült költsége · mennyi maradt a keretből (ha elfogyott, kimondva) | Költség |
| 6 | **Mentetlen tervezet** | csak akkor látszik, ha van mentetlen tervezet a Theme- vagy a Feliratok-lapon; a szöveg megnevezi, melyiken | az érintett lapra |

A lap tetején: `kezdolap.mi_tortent` — egy mondat a legutóbbi belépés óta történtekről (új találatok száma, elakadt források).

**Gépház (4. artboard)** csempéi: Theme-beállítások (van-e mentetlen tervezet, mikor lépett érvénybe az alkalmazott téma), Feliratok (van-e tervezet, a három nyelv és az angol tartaléknyelv), Költség (munkaterenkénti költség, összeg), Fiókok (fiókok és munkaterek száma, felfüggesztett fiókok, utolsó belépés).

A 6. pont tiltott elemei (értesítés, „olvasatlan”, számlázás, fájlfeltöltés, tag meghívása, szerepátállítás, több modul, e-mail, keresés, naptár) **nem szerepelnek**. Minden vezérlő mögött létező gépezet van: nyelvválasztó (nyelv API), Kilépés (kilépés API), munkatér-váltó (tagság adatmodell), lapok közti hivatkozások a létező lapokra. A Modulok lenyílóban a két szaggatott, üres sáv **nem vezérlő**: helyfoglalás, `aria-hidden`, hogy látszódjon, öt modul is elfér.

## 4. Szerepek a rajzon

| Szerep | Mit lát a rajzon |
|---|---|
| tulajdonos / szerkesztő | 1. artboard: mind a hat csempe, a tervezet-csempe is |
| néző | 3. artboard: futtatás és jelölés nélkül, tervezet-csempe nélkül; a hírfigyelő csempéjén egy mondat mondja ki, hogy a futtatás nem érhető el |
| rendszergazda | a sávban a Gépház is; a Gépház lapja a 4. artboard |

**Nyitott pont:** a 4. pont szerint „a Theme és a Feliratok a tulajdonosé is”, a 7. pont szerint viszont a Gépház **csak rendszergazdának** látszik. A rajz a 7. pontot követi (a tulajdonos sávjában nincs Gépház). Ha a tulajdonosnak is kell ajtó a Theme- és a Feliratok-lapra, az egy sor a sávban — szólj, és beteszem.

## 5. Használt tokenek

Csak `var(--…)`. A rajz `:root` blokkja az `apps/web/app/tokenek.css` és a `@km/design-system` `szarmaztat()` tükre; a valódi lapon a `layout.tsx` írja be az adatbázis aktív témájából.

**Alaptokenek:** `--bg` `--bg-elev` `--text` `--text-mut` `--text-dim` `--text-faint` `--on-primary` `--primary` `--primary-2` `--accent` `--accent-text` `--accent-link` `--ok` `--err` `--focus` `--shadow-color` `--shadow-strength` `--font-display` `--font-body` `--font-code` `--fw-head` `--fw-strong` `--fs-h1` `--fs-base` `--fs-title` `--r-card` `--r-block` `--r-btn` `--r-field` `--r-badge` `--bw` `--pad-card` `--pad-block` `--control-min` `--lh` `--gap` `--glass-alpha` `--motion`

**Származtatott tokenek:** `--font-display-active` `--font-body-active` `--font-code-active` `--grad-primary` `--accent-tint-weak` `--accent-border-soft` `--focus-ring` `--glow-primary` `--ok-strong` `--ok-bg` `--err-strong` `--err-bg` `--err-border` `--warn` `--warn-border` `--warn-bg` `--src-web` `--src-web-bg` `--src-ai` `--src-ai-bg` `--src-empty` `--src-empty-bg` `--glass-bg` `--glass-border` `--glass-shadow` `--shadow-pop` `--line` `--line-soft` `--line-dash` `--field-bg` `--field-border` `--panel-soft` `--panel-soft-2` `--btn-ghost-bg` `--btn-ghost-border` `--btn-ghost-text` `--fs-h2` `--fs-md` `--fs-sm` `--fs-xs` `--control-min-s` `--dur-spin`

### 5.1 Új tokenek — kérés, indoklással

| Token | Alapérték | Miért |
|---|---|---|
| `--gap-tile` | `14px` | A csemperács térköze. A `--gap` (12px) a mezők és gombsorok térköze, ahhoz szűk; a `--pad-block` (22px) túl széles. A kettő közé kell egy önálló érték, különben a rács pixelben íródik. |
| `--pad-tile` | `18px` | A csempe belső tere. A `--pad-block` (22px) a nagy paneleké, a `--pad-card` (36px) az üvegkártyáé; hatcsempés rácsban mindkettő elnyeli a tartalmat. |
| `--tile-min` | `300px` | A rács egy csempéjének minimális szélessége. Ez dönti el, hol tör sorba a rács — témából állítható értéknek kell lennie, nem beégetett töréspontnak. |
| `--fs-metric` | `30px` | A csempék nagy száma (új találatok, költség, fiókszám). A `--fs-h1` (34px) a lapcímeké, a `--fs-h2` (24px) a lapon belüli címeké; a mérőszám a kettő közé esik. |

Tartomány-javaslat a sémához: `--gap-tile` 4–24, `--pad-tile` 8–40, `--tile-min` 200–520, `--fs-metric` 18–48. A Theme-beállítások lapon így 57 token látszik.

## 6. Feliratok — minden látható szöveg, három nyelven

Minden szövegelem a `data-fkulcs` attribútumban hordozza a kulcsát. Az eredeti magyar; az alapnyelv (tartalék) az **angol**.

### 6.1 Felső sáv (`kozos.*`, `nav.*`)

| Kulcs | hu | ro | en |
|---|---|---|---|
| `kozos.app_nev` | Kommunikációs munkatér | Spațiu de comunicare | Communications workspace |
| `kozos.nyelv` | A felület nyelve | Limba interfeței | Interface language |
| `nav.kezdolap` | Kezdőképernyő | Ecran de start | Home |
| `nav.modulok` | Modulok | Module | Modules |
| `nav.ugyfelprofil` | Ügyfélprofil | Profilul clientului | Client profile |
| `nav.gephaz` | Gépház | Camera motoarelor | Engine room |
| `nav.kilepes` | Kilépés | Ieșire | Sign out |
| `nav.munkater_nev` | *(adat)* | *(date)* | *(data)* |
| `nav.munkater_nev_2` | *(adat)* | *(date)* | *(data)* |
| `nav.munkatereim` | Munkatereim | Spațiile mele | My workspaces |
| `nav.szerep_tulajdonos` | tulajdonos | proprietar | owner |
| `nav.szerep_szerkeszto` | szerkesztő | editor | editor |
| `nav.szerep_nezo` | néző | vizitator | viewer |
| `nav.szerep_rendszergazda` | rendszergazda | administrator | administrator |
| `nav.sajat_fiok` | *(adat: a fiók neve)* | *(date)* | *(data)* |
| `nav.sajat_fiok_sor` | {nev} · {szerepek} | {nev} · {szerepek} | {nev} · {szerepek} |
| `nav.uj_talalat_jelzes` | {n} új | {n} noi | {n} new |
| `nav.tovabbi_modulok` | A további modulok ebbe a listába kerülnek; öt sor elfér benne. | Modulele următoare intră în această listă; încap cinci rânduri. | Further modules go into this list; it holds five rows. |

### 6.2 Kezdőképernyő (`kezdolap.*`)

| Kulcs | hu | ro | en |
|---|---|---|---|
| `kezdolap.cim` | Kezdőképernyő | Ecran de start | Home |
| `kezdolap.mi_tortent` | A legutóbbi belépésed óta {uj} új találat jött, és {hiba} forrás elakadt. | De la ultima conectare au venit {uj} rezultate noi și {hiba} surse s-au blocat. | Since your last sign-in {uj} new matches arrived and {hiba} sources stalled. |
| `kezdolap.csempe_modul` | modul | modul | module |
| `kezdolap.hf_uj_szam` | {n} | {n} | {n} |
| `kezdolap.hf_uj_cimke` | új találat | rezultate noi | new matches |
| `kezdolap.hf_utolso_futas` | Utolsó sikeres futás | Ultima rulare reușită | Last successful run |
| `kezdolap.hf_utolso_futas_nincs` | Még nem futott | Nu a rulat încă | Has not run yet |
| `kezdolap.hf_kovetkezo_futas` | Következő tervezett futás | Următoarea rulare programată | Next scheduled run |
| `kezdolap.hf_kovetkezo_kezi` | Kézi indítás | Pornire manuală | Manual run only |
| `kezdolap.hf_fut` | figyelés fut a háttérben | monitorizarea rulează în fundal | monitoring is running in the background |
| `kezdolap.hf_forrashiba` | {n} forrás elakadt | {n} surse s-au blocat | {n} sources stalled |
| `kezdolap.hf_ertekeles_fuggoben` | {n} találat értékelése függőben | Evaluarea a {n} rezultate în așteptare | Assessment pending for {n} matches |
| `kezdolap.hf_link` | Áttekintés → | Prezentare → | Overview → |
| `kezdolap.profil_cim` | Ügyfélprofil | Profilul clientului | Client profile |
| `kezdolap.profil_jovahagyva` | jóváhagyva | aprobat | approved |
| `kezdolap.profil_nincs_jovahagyva` | nincs jóváhagyva | neaprobat | not approved |
| `kezdolap.profil_jovahagyva_meta` | {datum} · {nev} | {datum} · {nev} | {datum} · {nev} |
| `kezdolap.profil_hianyzo` | {n} rész hiányzik | Lipsesc {n} secțiuni | {n} sections missing |
| `kezdolap.profil_hianyzo_sor` | {n} rész hiányzik — {reszek} | Lipsesc {n} secțiuni — {reszek} | {n} sections missing — {reszek} |
| `kezdolap.profil_link` | Ügyfélprofil → | Profilul clientului → | Client profile → |
| `kezdolap.arculat_cim` | Arculat | Identitate vizuală | Brand identity |
| `kezdolap.arculat_nincs` | nincs megadva | nespecificat | not provided |
| `kezdolap.arculat_tervezet` | tervezet | schiță | draft |
| `kezdolap.arculat_kesobb` | későbbre hagyva | amânat | deferred |
| `kezdolap.arculat_jovahagyott` | jóváhagyott | aprobat | approved |
| `kezdolap.arculat_megj` | A modulok a jóváhagyott arculatból dolgoznak. | Modulele lucrează din identitatea aprobată. | Modules work from the approved brand identity. |
| `kezdolap.arculat_link` | Arculat a profilban → | Identitatea în profil → | Brand identity in the profile → |
| `kezdolap.forrasok_cim` | Források | Surse | Sources |
| `kezdolap.forrasok_ossz` | {n} forrás | {n} surse | {n} sources |
| `kezdolap.forras_hasznalhato` | használható | utilizabilă | usable |
| `kezdolap.forras_korlatozott` | korlátozott | limitată | limited |
| `kezdolap.forras_hibas` | hibás | defectă | failing |
| `kezdolap.forras_nem_tamogatott` | nem támogatott | nesuportată | unsupported |
| `kezdolap.forras_ellenorzes_alatt` | ellenőrzés alatt | în verificare | under check |
| `kezdolap.forrasok_link` | Figyelés beállítása → | Configurarea monitorizării → | Monitoring setup → |
| `kezdolap.keret_cim` | AI-keret — {honap} | Buget AI — {honap} | AI budget — {honap} |
| `kezdolap.koltseg_becsult` | becsült | estimat | estimated |
| `kezdolap.koltseg_reszletek` | {hivas} hívás · {gepido} AI-gépidő | {hivas} apeluri · {gepido} timp AI | {hivas} calls · {gepido} AI machine time |
| `kezdolap.koltseg_reszletek_sor` | {hivas} hívás · {gepido} · {osszeg} becsült | {hivas} apeluri · {gepido} · {osszeg} estimat | {hivas} calls · {gepido} · {osszeg} estimated |
| `kezdolap.keret_maradt` | {maradt} maradt a {keret}-s keretből | Au rămas {maradt} din bugetul de {keret} | {maradt} left of the {keret} budget |
| `kezdolap.keret_elfogyott` | A keret elfogyott; az értékelés függőben marad. | Bugetul s-a epuizat; evaluarea rămâne în așteptare. | The budget is used up; assessment stays pending. |
| `kezdolap.koltseg_link` | Költség → | Costuri → | Cost → |
| `kezdolap.tervezet_cim` | Mentetlen tervezet | Schiță nesalvată | Unsaved draft |
| `kezdolap.tervezet_szoveg` | A {lap} lapon van egy nem alkalmazott tervezet. | Pe pagina {lap} există o schiță neaplicată. | There is an unapplied draft on the {lap} page. |
| `kezdolap.tervezet_link` | {lap} → | {lap} → | {lap} → |
| `kezdolap.nezo_megj` | Néző szerepben a futtatás és a jelölés nem érhető el. | În rolul de vizitator rularea și marcarea nu sunt disponibile. | In the viewer role running and marking are unavailable. |
| `kezdolap.elso_cim` | Töltsük ki az ügyfélprofilt | Să completăm profilul clientului | Let us fill in the client profile |
| `kezdolap.elso_szoveg` | Minden modul a közös ügyfélprofilból dolgozik: mit csinál a cég, kinek, milyen céllal, milyen hangnemben. Amíg nincs jóváhagyott profil, a hírfigyelő nem tud értékelni. | Toate modulele lucrează din profilul comun al clientului: ce face firma, pentru cine, cu ce scop, pe ce ton. Fără un profil aprobat monitorizarea nu poate evalua. | Every module works from the shared client profile: what the company does, for whom, to what end, in what tone. Without an approved profile the news monitor cannot assess. |
| `kezdolap.elso_gomb` | Ügyfélprofil kitöltése | Completează profilul | Fill in the client profile |
| `kezdolap.elso_lepesek` | Három lépés, közben menthető. | Trei pași, se poate salva pe parcurs. | Three steps, saved as you go. |
| `kezdolap.elso_hf_szoveg` | Még nem futott. A profil jóváhagyása után itt jelenik meg a futás állapota és az új találatok száma. | Nu a rulat încă. După aprobarea profilului aici apare starea rulării și numărul rezultatelor noi. | Has not run yet. After the profile is approved, run status and new match count appear here. |

### 6.3 Gépház (`gephaz.*`)

| Kulcs | hu | ro | en |
|---|---|---|---|
| `gephaz.cim` | Gépház | Camera motoarelor | Engine room |
| `gephaz.jelveny` | csak rendszergazda | doar administrator | administrator only |
| `gephaz.bevezeto` | A rendszerszintű lapok. Az ügyfél kezdőképernyőjén ezek nem jelennek meg. | Paginile de nivel sistem. Nu apar pe ecranul de start al clientului. | The system-level pages. They do not appear on the client home screen. |
| `nav.theme` | Theme-beállítások | Setări Theme | Theme settings |
| `nav.feliratok` | Feliratok | Etichete | Labels |
| `nav.koltseg` | Költség | Costuri | Cost |
| `nav.fiokok` | Fiókok | Conturi | Accounts |
| `gephaz.mentetlen_tervezet` | mentetlen tervezet | schiță nesalvată | unsaved draft |
| `gephaz.nincs_tervezet` | nincs tervezet | fără schiță | no draft |
| `gephaz.theme_allapot` | {n} token · az alkalmazott téma {datum}-án lépett érvénybe | {n} tokenuri · tema aplicată a intrat în vigoare la {datum} | {n} tokens · the applied theme took effect on {datum} |
| `gephaz.theme_link` | Theme-beállítások → | Setări Theme → | Theme settings → |
| `gephaz.feliratok_allapot` | Magyar · román · angol; az alapnyelv az angol | Maghiară · română · engleză; limba de bază este engleza | Hungarian · Romanian · English; the base language is English |
| `gephaz.feliratok_link` | Feliratok → | Etichete → | Labels → |
| `gephaz.koltseg_allapot` | {honap}, becsült · {n} munkatér összesen {osszeg} | {honap}, estimat · {n} spații, în total {osszeg} | {honap}, estimated · {n} workspaces, {osszeg} in total |
| `gephaz.koltseg_link` | Költség → | Costuri → | Cost → |
| `gephaz.fiok_cimke` | fiók · {n} munkatér | conturi · {n} spații | accounts · {n} workspaces |
| `gephaz.felfuggesztett` | {n} felfüggesztett fiók | {n} conturi suspendate | {n} suspended accounts |
| `gephaz.utolso_belepes` | Utolsó belépés: {nev}, {idopont} | Ultima conectare: {nev}, {idopont} | Last sign-in: {nev}, {idopont} |
| `gephaz.fiokok_link` | Fiókok → | Conturi → | Accounts → |

### 6.4 Csak a rajz jegyzetei (nem kerülnek a termékbe)

`rajz.sav_egy_cim`, `rajz.sav_tobb_cim`, `rajz.sav_megj_cim`, `rajz.sav_megj`. A `hf.modTitle` a meglévő hírfigyelő-feliratokból jön (`packages/news-monitor-feliratok`).

## 7. Telefon (390) — mi marad el, mi tör sorba

- **Elmarad:** semmi adat. A csempék ugyanazok, ugyanabban a sorrendben.
- **Sorba tör:** a felső sáv hamburgerré válik (7. artboard); a hatcsempés rács egy hasábra (a `--tile-min` 300px-e 390-en egy hasábot ad); a hírfigyelő csempéjén a két időpont címke–érték párokká.
- **Tömörödik:** a profil hiányzó részei egy sorba (`kezdolap.profil_hianyzo_sor`) a jelvények helyett; az AI-keret három száma egy sorba (`kezdolap.koltseg_reszletek_sor`); a forrásállapotok színes pont nélkül, címke–szám párokként, a korlátozott és a hibás színes szöveggel kiemelve.
- **Érintőméret:** minden gomb és lenyíló-sor `--control-min` (44px) magas.
- A Gépház telefonon ugyanez a négy csempe, egy hasábban; a sávban a Gépház a lenyíló egy sora.

## 8. Amit szándékosan nem rajzoltam meg

- **Modul-fülek a felső sávban** — a Modulok lenyíló csak a modulok listáját adja; a Hírfigyelő három lapja a modul saját fejlécében marad (`HirfigyeloKeret.tsx`).
- **Kézi indítás a csempén** — az 5. pont csempetartalma nem tartalmazza (lásd 1. pont).
- **Tag meghívása, szerep átállítása, arculati fájl feltöltése, értesítés** — nincs mögötte gépezet (6. pont).
- **Világos téma** — a tokenekből jön, külön rajz nélkül.
- **Munkatér-váltó nyila egy munkatérnél** — D3.
