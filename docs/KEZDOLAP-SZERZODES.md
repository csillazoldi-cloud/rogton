# Kezdőképernyő és Gépház — szerződés (F-2, R-1 v3)

2026-09-12. A rajz: `design/r1-kezdokepernyo/atado-2/` (8 artboard, `ATADO.md`, `adatkotes.md`, `feliratok.json`). Ez a lap azt
rögzíti, amit a kód megvalósít: adatszerkezetek, végpontok, tárolás, jogok. A típusok hiteles helye `apps/web/kezdolap/tipusok.ts`.

## 1. Mi épül

- **Kezdőképernyő** (`/kezdolap`): hat csempe EGY lekérdezésből — Hírfigyelő, Ügyfélprofil, Arculat, Források, AI-keret, és a
  feltételes Mentetlen tervezet. Négy állapot: normál (1. artboard), első használat (2.), néző (3.), telefon (5.).
- **Felső sáv** (`FelsoSav`, állandó komponens): termékjel + név, a munkatér neve **mindig lenyíló** (benne „Ez a munkatér" + a
  szerep; több munkatérnél a lista, kattintásra vált), a lapok (Kezdőképernyő · Modulok ▾ · Ügyfélprofil · Gépház), nyelvválasztó,
  a fiók neve, „rendszergazda"/„néző" jelvény, Kilépés. Telefonon hamburger (7. artboard).
- **Gépház** (`/gephaz`): rendszergazda nézet 4 csempével (4. artboard), tulajdonos nézet 2 csempével (8. artboard).
- **Pénznem** munkatér-beállítás (D5): euró · dollár · forint · lej; végpont van, vezérlő a rajzon nincs (→ 7. pont).
- **Munkatér-váltás**: a fiók aktuális munkatere tárolt választás (`fiok.aktualis_szervezet_id`); a bejárat `aktualisSzervezet()`
  változatlan — a fiók szervezet-listájában a választott áll elöl.

## 2. Adatszerkezetek

`apps/web/kezdolap/tipusok.ts`: `Penznem`, `Osszeg`, `HirfigyeloCsempe`, `ProfilCsempe`, `ArculatAllapot`, `ForrasokCsempe`,
`KoltsegCsempe`, `KezdolapNezet`, `GephazNezet`, `FelsoSavAdat`. Minden mező kötelező (nincs `undefined`); ami hiányozhat, `null`.

## 3. Végpontok (mind `force-dynamic`, a közös `kapu()`-n át, hibaválasz `{ hiba }`)

| Módszer és út | Szint | Törzs | Válasz |
|---|---|---|---|
| `GET /api/kezdolap` | tag | – | 200 `{ kezdolap: KezdolapNezet }` |
| `GET /api/gephaz` | belepett; **tulajdonos** az aktuális munkatérben VAGY **rendszergazda**, különben 403 `NINCS_JOG`; szervezet nélkül 409 | – | 200 `{ gephaz: GephazNezet }` — rendszergazdának `nezet: "rendszergazda"` (akkor is, ha tulajdonos is) |
| `PUT /api/beallitas/penznem` | tulajdonos | `{ penznem: "EUR"\|"USD"\|"HUF"\|"RON" }` | 200 `{ penznem }`; más érték 400 `ERVENYTELEN_ADAT` |
| `GET /api/beallitas/arfolyam` | belepett | – | 200 `{ arfolyam: { EUR, USD, HUF, RON } }` (egy USD ennyi egység) |
| `PUT /api/beallitas/arfolyam` | rendszergazda | `{ penznem, egy_usd: number > 0 }` | 200 `{ arfolyam }`; hibás 400 |
| `POST /api/szervezet/valt` | belepett | `{ szervezet_id: uuid }` | 200 `{ szervezet: { id, nev } }`; ha a fiók nem tagja 403 `NINCS_JOG`; hibás uuid 400 |

## 4. Honnan jön az adat (a `kezdolapNezet` / `gephazNezet` összeállítása)

| Mező | Forrás (létező gépezet) |
|---|---|
| `munkater.penznem` | `szervezet.penznem` |
| `elso_hasznalat` | `profilBetolt(szervezetId) === null` |
| `hirfigyelo` | `attekintes(kornyezet, hostKontextus)` a `@km/news-monitor-core`-ból: `utolso_sikeres = utolsoSikeres?.veg ?? kezdet`; `kovetkezo`; `fut = aktivFutas !== null`; `uj = ujDb`; `forrashiba` = a LEGUTÓBBI (nem feltétlenül sikeres) futás `hibas_forrasok` különböző `forras_id`-inak száma; `fuggoben` = a találatok közül `ertekeles_allapot ∈ {fuggoben, keret_kimerult}`; `keret_kimerult` = van `keret_kimerult`. Az `idozona` az aktív beállítás `idozites.idozona`-ja (alap `Europe/Bucharest`). Ha `NINCS_BEALLITAS` → `null`. |
| `profil` | `profilBetolt`: `jovahagyva`, `kesobbre` → `hianyzo`; a jóváhagyó neve a `szervezetReszletek().tagok`-ból (`fiok_id === jovahagyta`), ha nincs, `""` |
| `arculat` | `profil.arculat.allapot`, profil nélkül `"nincs"` |
| `forrasok` | a hírfigyelő tár `forrasok(szervezetId)` állapot szerint számolva (`ForrasAllapot`) |
| `koltseg` | `sajatNezet(szervezetId, honapVagyMost(null))`: `hivasok`, `ido_ms`, `becsult = usd`, `keret = keret_usd`, `maradt = max(0, keret − usd)`; mind `Osszeg` a munkatér pénznemében a tárolt árfolyammal (`ertek = usd × egy_usd[penznem]`, 2 tizedesre kerekítve) |
| `tervezet` | `szervezetTemaAllapot(szervezetId).tervezet !== null`; `szovegek.szervezetAllapot(szervezetId).tervezet !== null` |
| Gépház `tema` (rendszergazda) | `tema.kozosAllapot()`: `tervezet !== null`, `tokenek = Object.keys(alkalmazott.tokenek).length`, `felulirt = 0`, `alkalmazva` = a `verziok` alkalmazott tagjának `alkalmazva` |
| Gépház `tema` (tulajdonos) | `szervezetTemaAllapot`: `felulirt = Object.keys(alkalmazott?.felulirasok ?? {}).length`, `tokenek = Object.keys(alap).length − felulirt`, `alkalmazva` ugyanígy |
| Gépház `feliratok` | `szovegek.kozosAllapot()` / `szervezetAllapot()`: `tervezet !== null`; `felulirt` = az alkalmazott felülírások kulcsainak száma (a három nyelv kulcsainak uniója) |
| Gépház `koltseg` (csak rendszergazda) | `gazdaNezet(honap)`: `munkaterek = osszes.szervezetek`, `osszeg = osszes.usd` (a rendszergazda AKTUÁLIS munkaterének pénznemében; ha nincs munkatere, USD) |
| Gépház `fiokok` (csak rendszergazda) | `fiokok.nezet(sajatFiokId, honap)`: `fiokok.length`, `munkaterek.length`, `felfuggesztett` = `felfuggesztve !== null`, `utolso_belepes` = a legnagyobb `utolso_belepes` fiók neve és ideje |
| `FelsoSavAdat.uj_talalat` | a kezdőlap `hirfigyelo.uj`-a, vagy 0 |
| `FelsoSavAdat.gephaz` | `szerep === "tulajdonos" || fiok.rendszergazda` (D-F23) |

Egy csempe hibája (pl. a hírfigyelő tár nem válaszol) **nem dönti a lapot**: a csempe `null`-t vagy nullákat kap, a hibát a
kiszolgáló naplózza.

## 5. Tárolás (migráció `0050_kezdolap_penznem.sql`)

- `szervezet.penznem text NOT NULL DEFAULT 'EUR' CHECK (penznem IN ('EUR','USD','HUF','RON'))`.
- `fiok.aktualis_szervezet_id uuid NULL REFERENCES szervezet(id) ON DELETE SET NULL`.
- `arfolyam (penznem text PRIMARY KEY CHECK (…), egy_usd numeric(12,6) NOT NULL CHECK (egy_usd > 0), frissitve timestamptz NOT NULL DEFAULT now())`,
  kezdőértékek: EUR 0,92 · USD 1 · HUF 360 · RON 4,60 (**tárolt, nem élő**; a rendszergazda állítja). `GRANT SELECT, UPDATE ON arfolyam TO km_app`.
- A feliratok külön migrációban (`0051_kezdolap_feliratok.sql`, a `feliratok.json`-ból generálva).

## 6. Jogok

A kezdőlap minden tagnak; a Gépház a tulajdonosnak és a rendszergazdának (a szerkesztőnek NEM — D-F23); a pénznem a tulajdonosé; az
árfolyam a rendszergazdáé; a munkatér-váltás a belépett fióké a saját munkaterei közt. A módosító végpontok a jogosultsági mátrixban.

## 7. Ami tudatosan nincs

- **Tagok sor** a lenyílóban: nem jelenik meg élesben (R-2 gépezete nincs; D-F24).
- **Pénznem-vezérlő**: a rajzon nincs, ezért a képernyőn sincs — a végpont és a próbája megvan; a vezérlő az R-1 következő körének
  vagy a Költség lapnak a rajzára vár (TEENDŐ).
- **Felső sáv a régi lapokon** (fiók, hírfigyelő, Theme, Feliratok, Költség, Fiókok): azoknak saját rajzolt fejlécük van; a cseréjük
  külön kör (TEENDŐ). Most a kezdőlap és a Gépház kapja.
- A hírfigyelő csempén **nincs indítógomb** (D6).
