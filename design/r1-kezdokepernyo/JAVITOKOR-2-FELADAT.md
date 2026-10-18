# Rajz-feladat a Claude Designnak — R-1 · Kezdőképernyő és navigáció · **2. javítókör** (v4), és ami még hátravan

2026-09-12 este · Aitmetica SRL · előzmény: `atado-2/` (v3), `ELLENORZES-JAVITOKOR.md`, és a megépült képernyők:
https://saas.mediapartizan.ro/allapot/kepek/f2/ (rajz · helyi építés · tesztoldal, egymás mellett).

**A v3 rajz megépült és kint van a teszten.** Ez a kör nem újrarajzolás: a v3 hét tétele marad, és **három** dolog jön hozzá,
ami a megépítés közben derült ki. A rajz hiteles fájlja továbbra is egy `.dc.html`, a nyolc artboard megmarad, ezek bővülnek.

## 1. Amit Vilmos azóta eldöntött — ezek rögzítettek

| # | Döntés | Mit jelent a rajzra |
|---|---|---|
| D-F23 | **A Gépház a tulajdonosnak és a rendszergazdának látszik, a szerkesztőnek NEM** (az ELLENORZES 5/1 javaslata). | A rajz `tulajdonos` kapcsolója ezt mondja; a szerkesztő sávján a Gépház ajtó nincs. |
| D-F24 | **A Tagok sor nem kerül élesbe**, amíg az R-2 gépezete nincs meg. | A rajzon maradhat megjelölve, ahogy a v3-ban; élesben nincs. |
| D-F22 | **A pénznem a munkatér beállítása** (euró · dollár · forint · lej), az összegek **tárolt** árfolyammal számolódnak át — élő árfolyam nincs; a kezdőértékek (1 USD = 0,92 EUR · 360 HUF · 4,60 RON) jóváhagyva, a rendszergazda írhatja át. | Ehhez **kell egy vezérlő**, ami a v3 rajzon nincs — ez a kör 1. tétele. |
| D-F25 | A felső sáv **állandó komponens**; a munkatér-váltás a fiókon tárolt választás; belépés után a `/kezdolap` a cél. | A sáv a régi lapokra is kerül — ez a kör 2. tétele. |
| D-F26 | Két méret-token pótolva a rendszerben: `--tile-min` (300px) és `--fs-metric` (30px). | Használd őket változatlanul; új token továbbra sem kell. |

## 2. Az 1. tétel — a pénznem vezérlője (nincs a rajzon, ezért ma nincs a képernyőn)

A végpont megvan (`PUT /api/beallitas/penznem`, csak tulajdonos), próbája zöld; **a tulajdonos ma nem tudja átállítani**, mert a rajz nem
mutat hozzá vezérlőt, és ami nincs a rajzon, nem kerül a képernyőre.

Kérés: **egy** hely a vezérlőnek. A javaslatom (egy szó, és átteszem, ha másképp döntesz): a **Gépház tulajdonos nézete (8. artboard)**
kap egy harmadik, kis csempét — *Munkatér* — benne egyetlen sor: „Pénznem: euró ▾" (a négy lehetőség egy lenyílóban), és egy mondat, hogy az
összegek tárolt árfolyammal számolódnak, nem élő árfolyamból. Miért ide: ez munkatér-szintű beállítás, a tulajdonosé, és a Gépház tulajdonos
nézete pont „a saját munkaterére állít". Nem a Költség lapra: az rendszerszintű, és a tulajdonos nem látja.

A rajzon látszódjon: a lenyíló zárt és nyitott állapota; mi történik választás után (a kezdőlap AI-keret csempéje az új pénznemben —
elég egy mondat a rajz jegyzetében); a **rendszergazda nézetén (4. artboard) ez a csempe NINCS** (a rendszergazda a közös alapot állítja, nem
egy munkatér pénznemét — az árfolyamok rendszerszintű állítása külön kérdés, most nem rajzoljuk).

Feliratkulcsok, amiket kérek a `feliratok.json`-ba: `gephaz.munkater_cim`, `gephaz.penznem_cimke`, `gephaz.penznem_megj` (a szövegük a te
dolgod, három nyelven), és a négy pénznem neve. Ez utóbbiak a **rendszerben** már léteznek (a 0051 migráció), a rajz `feliratok.json`-jában
viszont **nincsenek** — vedd át őket szó szerint, ne találj ki másikat:

| Kulcs | hu | ro | en |
|---|---|---|---|
| `penznem.EUR` | euró | euro | euro |
| `penznem.USD` | dollár | dolar | dollar |
| `penznem.HUF` | forint | forint | forint |
| `penznem.RON` | lej | leu | leu |

## 3. A 2. tétel — a felső sáv a régi lapokon

A v3 sávja (6. és 7. artboard) ma a kezdőlapon és a Gépházon áll. A régi lapoknak saját, korábban rajzolt fejlécük van, ezért nem cseréltem
le őket rajz nélkül. A lapok és a mai fejlécük:

| Lap | Mai fejléce | Mi kell |
|---|---|---|
| Ügyfélprofil (`/fiok`, a v6/E-17b rajz) | termékjel + név + morzsa „Aitmetica SRL", jobbra mentés-állapot, a fiók neve, Kilépés | a v3 sáv, aktív lap: Ügyfélprofil; a **mentés-állapot** jelzésének (mentve · mentés… · hiba) hely a sáv alatt vagy a lapcím mellett — a rajz döntse el |
| Hírfigyelő 3 lapja (`/hirfigyelo`, `/beallitas`, `/finomhangolas`, a v7 rajz) | modulnév + „modul" jelvény + a három fül + nyelvválasztó + „vissza a fiókhoz" | a v3 sáv (aktív: Modulok ▾ → Hírfigyelő), **alatta** a modul saját fülsora marad (Áttekintés · Figyelés beállítása · Finomhangolás); a „vissza a fiókhoz" link elmarad, mert a sáv viszi |
| Theme-beállítások, Feliratok (`/tema`, `/feliratok`) | saját fejléc: cím + szintjelvény + tervezet-jelvény + gombok (Alkalmazás, Elvetés…) + a rendszergazda-navigáció (Theme · Feliratok · Költség · Fiókok) | a v3 sáv (aktív: Gépház), alatta a lap saját eszközsora marad; a **rendszergazda-navigáció** (a négy lap közti váltó) elmarad-e — ha a Gépház ajtó viszi, igen; ha a négy lap közt gyors ugrás kell, maradjon a sáv alatt. A rajz mondja ki. |
| Költség, Fiókok (`/koltseg`, `/fiokok`) | ugyanaz a rendszergazda-fejléc | ugyanaz, mint fent |

Kérés: **kettő** új artboard elég — (9) az Ügyfélprofil lap a v3 sávval asztalon, és (10) a Hírfigyelő Áttekintés lap a v3 sávval **és** a modul
fülsorával asztalon; a Theme/Feliratok/Költség/Fiókok esetét egy jegyzet döntse el a (10)-en (a rendszergazda-navigáció marad vagy megy). Telefonon
elég egy mondat, hogy a sáv ugyanúgy hamburger, a modul fülsora pedig alatta görgethető sor.

## 4. A 3. tétel — egy állapot, amit a rajz nem ismer, a teszt megmutatta

A tesztoldalon a hírfigyelő a valódi AI-val értékel. Egy futás így végződhet: **a letöltés kész, 10 találat jött, de az értékelés függőben maradt**
(az AI nem válaszolt időben). Ilyenkor a csempe ma ezt mutatja: „Utolsó sikeres futás: Még nem futott" + „10 új találat" + „10 találat értékelése
függőben" — igaz, de ellentmondásosnak hat (van 10 találat, de „még nem futott"). Kép: a galéria 01. tesztoldali képe.

Kérés: a hírfigyelő csempén **egy sor erre az állapotra**: mikor volt az utolsó futás, ha nem volt teljesen sikeres — pl. „Utolsó futás: 2026-09-12 19:59 · az
értékelés függőben" — új kulccsal (`kezdolap.hf_utolso_futas_reszleges`, `{ido}`), a „sikeres" sor helyett, amikor ez az eset áll. A rajz jegyzete mondja ki, hogy
ez nem hiba-állapot, hanem várakozás.

## 5. Ami ezen a körön kívül vár rád — változatlan feladatlapokkal

A `design/r2-tagok`, `r3-sajat-fiok`, `r4-rendszerbeallitasok`, `r5-elofizetes`, `r6-fajlfeltoltes` mappák `DESIGN-FELADAT.md`-i **érvényesek, rajz még
nincs hozzájuk**. Két dolog, amit tudj, mert azóta épült meg:

- **A felső sáv létezik** (v3, 6–7. artboard) — az R-2…R-6 lapok is ezt kapják, ne rajzolj nekik külön fejlécet.
- **A gépezet mind az öthez kész** (végpontok, próbák): tagok és meghívó (8 végpont), saját fiók (jelszó, név, kiléptetés mindenhol), eseménynapló + értesítés
  két szinten + AI-kapcsoló, fájlfeltöltés (a típus a tartalomból, SVG tiltva, 5 MB). A feladatlapok „amit meg kell építeni" pontjai ezért nagyrészt már
  megvannak — a rajz azt mutassa, ami VAN. Ha egy feladatlap olyat kér, ami a mai gépezettel nem jön ki, írd a `kerdesek.md`-be, ne rajzold rá.
- Az R-2 Tagok lap elkészültével a felső sáv **Tagok sora** élesíthető (D-F24) — a rajzon már ott van, a kulcsai (`nav.tagok`, `nav.tagok_szam`) a rendszerben.

## 6. Kötelező szabályok (mint a v3-nál)

- **A mérce a v3 rajz `:root`-ja** — és ez ma egybeesik a kóddal: a GitHub főágán a `packages/design-system/src/tema-alap.json` mind a tizenöt
  térközfokot és a két pótolt tokent (`--tile-min` 300px, `--fs-metric` 30px) tartalmazza (az F-1 2026-09-12 délelőtt, az F-2 este került fel). Ha
  egy régebbi másolatban ezek hiányoznak, az a másolat régi — a főág a hiteles.
- Minden térköz a tizenöt fokból (`--ter-0…14`), színek/betűk/lekerekítés a meglévő tokenekből; **új token nem kell**.
- Minden látható szöveg feliratkulccsal, három nyelven (hu eredeti, ro, en), a `feliratok.json`-ban; a meglévő kulcsokat használd, ne duplázd.
- Halott vezérlő tilos: ami a rajzon kattintható, annak van gépezete (a fenti listában megmondtam, minek van).
- A rajz megnyitásához hálózat kell — az átadó mondja ki, mint a v3-nál.

## 7. Amit az átadóban kérek vissza

- a `.dc.html` (a nyolc artboard + a 9. és 10.), és az `ATADO.md`;
- a pénznem-vezérlő zárt és nyitott állapota a 8. artboardon, és a jegyzet, hogy a 4.-en nincs;
- a `feliratok.json` az új kulcsokkal (2. és 4. pont), a meglévők változatlanul;
- `kerdesek.md`: amit nem tudtál eldönteni, és amit a feladatlap kért, de a gépezet nem tud;
- a v3-hoz képest **mi változott** — tételesen, mint a v3 `ATADO.md` 1. pontja.
