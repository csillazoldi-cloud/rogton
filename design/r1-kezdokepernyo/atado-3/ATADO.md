# R-1 · Kezdőképernyő és navigáció · 2. javítókör (v4) — átadó

2026-09-12 · Aitmetica SRL · előzmény: a v3 csomag (`r1-kezdokepernyo-javitokor.dc.html`, nyolc artboard)

## 0. A hiteles rajzfájl és a hálózat

A hiteles rajz: **`rajz/R1-kezdokepernyo v4.dc.html`**. Egyetlen fájl, benne **tíz artboard**.

**A megnyitásához hálózat kell** — a React és a Babel az `unpkg.com`-ról töltődik. Offline a lap üresen marad. Ez változatlan a v3-hoz képest.

A rajz `:root` blokkja a mérce — és ez ma **egybeesik a kóddal**: a főág `packages/design-system/src/tema-alap.json`-ja az F-1/F-2 után mind a tizenöt térközfokot és a két pótolt tokent tartalmazza. (Egy korábbi körben régebbi másolatból dolgoztam, és azért hiányoltam őket.) A mérce: a tizenöt `--ter-0…14` térközfok, plusz `--tile-min`, `--fs-metric`, `--gap-tile`, `--pad-tile`, `--control-min-s`. **Új token ebben a körben sem kell.** Pixelérték nem került a rajzra; minden új térköz a `--ter-*` fokokból jön.

## 1. Mi változott a v3-hoz képest — tételesen

### 1.1 Pénznem-vezérlő (a feladatlap 1. tétele)

A **8. artboard** (Gépház — tulajdonos nézet) rácsa kettőről **háromhasábosra** nőtt, és a harmadik csempe a **Munkatér**. Benne egyetlen sor: a `gephaz.penznem_cimke` címke és egy lenyíló gomb a mai értékkel (`penznem.EUR` → „euró”), alatta a `gephaz.penznem_megj` mondat.

A csempe **két állapotban** szerepel:
- a rácsban a **zárt** lenyíló (`aria-expanded="false"`),
- a rács alatt ugyanaz a csempe **nyitott** lenyílóval (`aria-expanded="true"`, `role="listbox"`, négy `role="option"` sor: euró · dollár · forint · lej, az euró kiválasztva).

**A rajzon a nyitott lenyíló a folyamatban áll**, nem lebegve — így semmit nem fed el a csempén, és az artboard nyomtatva is olvasható. A csempén ott a jegyzet, hogy élesben lebeg, `top: calc(100% + var(--ter-2))` eltolással, a gomb jobb szélére igazítva; a panel minimális szélessége 160px (alakérték, nem térköz).

A lenyíló gomb és az opciósorok magassága `--control-min-s` (36px), mint a felső sáv vezérlőinek — nem `--control-min` (44px). A 44px érintőméret a telefonos nézetre szól; az asztali Gépház vezérlői a sávval egy méretben állnak. A nyitott állapot fókuszgyűrűt kap (`--focus`, `--focus-ring`).

**A rajz jegyzete a 8. artboardon** kimondja: választás után a kezdőképernyő **AI-keret csempéje** az új pénznemben mutatja az összegeket (becsült költség, keret, maradék), **tárolt árfolyammal** átszámolva — a hívásszám és a gépidő nem változik. A vezérlő mögött a `PUT /api/beallitas/penznem` áll, csak tulajdonosnak.

**A 4. artboardon (rendszergazda nézet) ez a csempe nincs** — és ezt ott is kiírja egy jegyzet: a rendszergazda a közös alapot állítja, nem egy munkatér pénznemét; az árfolyamok rendszerszintű átírása külön kérdés, nincs megrajzolva.

### 1.2 A felső sáv a régi lapokon (a feladatlap 2. tétele)

**Két új artboard:**

**9 · Ügyfélprofil a sávval** (asztali 1440). A v3 sáv változatlanul, aktív lap: Ügyfélprofil. A lap tartalma szaggatott helyfoglalókkal jelezve — ez az artboard a sáv és a lapcím viszonyát mutatja, nem a v6 rajzot ismétli.

**A mentés-állapot helye: a lapcím mellett**, nem a sávban. A rajz ki is mondja, miért: a sáv állandó komponens, minden lapon ugyanaz — ha a mentés-állapot bekerülne, minden lapon ott lenne egy olyan jelzés, aminek a lapok többségén nincs értelme. A lapcím melletti hely viszont annak a lapnak a sajátja, amelyik ment. A hibaállapot ugyanitt áll, hibaszínnel és újrapróbálással; külön sáv nem kerül a fejléc alá. A „vissza a fiókhoz” link elmarad.

**10 · Hírfigyelő Áttekintés a sávval** (asztali 1440). Felül a v3 sáv (aktív: **Modulok**, kiemelve), **alatta a modul saját fülsora**: modulnév + „modul” jelvény + Áttekintés · Figyelés beállítása · Finomhangolás + a sor végén a „7 új” jelzés. A modul saját nyelvválasztója és a „vissza a fiókhoz” link elmarad — mindkettőt a sáv viszi.

**A rendszergazda-navigáció sorsa — a rajz dönt:** a Theme, Feliratok, Költség és Fiókok lapról **a négy lap közti váltó elmarad.** Az érv a (10) jegyzetében: ahol a modulnak több lapja van (hírfigyelő: három), ott a fülsor a sáv alatt marad, mert az a modulon **belüli** mozgás. A négy rendszerszintű lap között nincs ilyen belső mozgás — mindegyik önálló lap, és mindegyikhez a Gépházon át vezet az út, egy kattintással. Két navigációs sor egymás alatt ugyanarra a célra fölösleges.

**Telefonon** (jegyzet, nem külön artboard): a sáv ugyanúgy hamburger, mint a 7. artboardon; a modul fülsora alatta vízszintesen görgethető sor, az aktív füllel balra igazítva; a „7 új” jelzés a sor végén marad.

### 1.3 Részleges futás — az állapot, amit a rajz nem ismert (a feladatlap 3. tétele)

A hírfigyelő csempén az „Utolsó sikeres futás” sor helyére **feltételesen** egy másik sor kerül: **„Utolsó futás: 2026-09-12 19:59 · az értékelés függőben”** — új kulccsal (`kezdolap.hf_utolso_futas_reszleges`).

Ez a csere **három helyen** történik: az 1. artboard (normál) és a 3. artboard (néző szerep) csempéin, valamint az 5. artboard telefonos csempéjén. A 10. artboard modul-fejléce eleve ezt az állapotot mutatja.

A váltó a Tweaks panelen: **`nincsTeljesFutas`** (alapértéke `false`, tehát a rajz alapból a „sikeres” sort mutatja). Bekapcsolva a teljes rajz átvált a részleges állapotra.

**Ez nem hibaállapot, hanem várakozás.** A „függőben” rész a `--src-empty` semleges színt kapja, nem a `--warn` vagy `--err` színt — a forráshiba jelzése (`kezdolap.hf_forrashiba`) marad figyelmeztető színű, mert az tényleg hiba. Így a két eset a csempén is elválik: a sárga pötty hibát jelent, a semleges szürke várakozást.

## 2. Feliratkulcsok

Új kulcsok ebben a körben, mind a három nyelven (a `feliratok.json` `uj_kulcsok_ebben_a_korben` blokkja is felsorolja):

| Kulcs | hu |
|---|---|
| `kezdolap.hf_utolso_futas_reszleges` | Utolsó futás |
| `kezdolap.hf_utolso_futas_reszleges_sor` | Utolsó futás: {ido} · az értékelés függőben |
| `penznem.EUR` · `.USD` · `.HUF` · `.RON` | euró · dollár · forint · lej |

**A `penznem.*` négyes nem új kulcs:** a rendszerben a **0051 migrációval** már létezik, csak a rajz `feliratok.json`-jából hiányzott. Szó szerint átvettem mind a három nyelven (románul `euro/dolar/forint/leu`, angolul `euro/dollar/forint/leu`) — nem fogalmaztam újra. A `feliratok.json` ezért két listára bontja: `ujak` és `atvett_a_rendszerbol`.
| `gephaz.munkater_cim` | Munkatér |
| `gephaz.penznem_cimke` | Pénznem |
| `gephaz.penznem_megj` | Az összegek tárolt árfolyammal számolódnak át, nem élő árfolyamból. |

A `_reszleges` a csempe címkéje (a `hf_utolso_futas` helyén), a `_sor` az egysoros megfogalmazás a modul fejlécében.

A meglévő kulcsok változatlanok. A `kezdolap.penznem_megj` és `penznem_megj_rovid` megmarad — az a kezdőképernyő AI-keret csempéjének magyarázata, a `gephaz.penznem_megj` pedig a vezérlő mellett álló mondat. A kettő nem ugyanaz.

## 3. Halott vezérlő

A rajzon kattinthatóként megjelenő új elem egyetlen darab: a **pénznem-lenyíló**, és mögötte ott a `PUT /api/beallitas/penznem` végpont, zöld próbával. A **Tagok sor** változatlanul megjelölve marad (D-F24: az R-2 gépezete nélkül nem mehet élesbe). A 9. és 10. artboard szaggatott helyfoglalói nem vezérlők, hanem a meglévő lapok tartalmának helyjelzései.

## 3b. Amit a rajz átnézése után javítottam

- A nyitott pénznem-lenyíló **abszolút pozícióból a folyamatba** került: korábban kilógott a csempéből és elfedte a mellette álló jegyzetet.
- A lenyíló gomb és az opciósorok **44px-ről 36px-re** (`--control-min-s`), a felső sáv vezérlőivel egy méretben — 44px-en indokolatlanul nagyok voltak az asztali nézetben.
- A **„Ügyfélprofil kitöltése” gomb** (2. artboard) 68px magas volt 44 helyett: `display:inline-block` + `min-height:var(--control-min)` mellett a `--ter-6` függőleges belső tér hozzáadódott a minimális magassághoz. Most `inline-flex` + `align-items:center` + `box-sizing:border-box`, függőleges belső tér nélkül — így a `--control-min` tényleg a gomb magassága. **Szabály a többi laphoz is:** ahol `min-height` van, ott `box-sizing:border-box` és `inline-flex` kell, különben a belső tér hozzáadódik.
- A **6. artboard két lebegő lenyílója** kilógott a saját artboardjából: az „A · egy munkatér” sáv Modulok-panelje átnyúlt a „B” feliratra, a „B · két vagy több munkatér” munkatér-váltója pedig elfedte „A sáv szerkezete” jegyzetet. A sáv alatti helyfoglaló magassága 230→270px, illetve 190→370px — annyi, amennyit a panel tényleges magassága kér. A lenyílók **maradnak lebegők**, mert a rajz épp azt mutatja; csak a hely lett meg alattuk.
- A 8. artboard **felirata** („két csempe”) és a rajz **bevezetője** („Nyolc artboard”, „csak két csempével”) frissült a mai állapotra.

## 4. Amit ez a kör nem tartalmaz

- **Az árfolyamok rendszerszintű átírása.** A feladatlap külön kérdésnek nevezi, és nem kéri rajzolni. A 4. artboard jegyzete ezt ki is mondja.
- **Theme/Feliratok/Költség/Fiókok artboard.** A feladatlap jegyzetet kért, nem rajzot — a (10) jegyzete dönt.
- **A telefonos változat a 9. és 10. artboardhoz.** A feladatlap egy mondatot kért; az a (10) jegyzetében van.
- **Az R-2…R-6 lapok.** Változatlanul várnak; a felső sávot ők is ezt kapják.
