# Ellenőrzés — R-4 · Értesítések és adatpolitika (a Design csomagja, „Onboarding felület prototípus9.zip", 2026-09-13 08:03)

Mérve az `atado/` csomagon (python a `feliratok.json`-on és a `.dc.html` törzsén; `_artboardok.mjs` a képekhez; a gépezet a kódból). Minden szám mérés.

## 1. Összegzés

**A rajz maga hibátlan: 7/7 artboard, 0 pixel-térköz, 80 kulcs három nyelven hiánytalanul, 6 új token (mind megnevezve a `tokenek.md`-ben), beégetett
érték a törzsben nincs** (a 18 hex mind a `:root` tokenkészlete, nem a törzs). **A gépezettel viszont négy helyen eltér** — ezek nem rajzhibák, hanem a
rajz olyat kér, amit a kérés (`design/DESIGN-KERES-R2-R6.md` 4.) másképp írt le, vagy ami ma nincs:

| # | A rajz | Ma a gépezet | Döntés (D-F33) |
|---|---|---|---|
| 1 | **fiók-szintű értesítéslista** olvasott/olvasatlan jelöléssel, haranggal, „Mind olvasottnak jelölöm" | az eseménynapló **munkatér-szintű** (`GET /api/esemenyek`), olvasott-jelölés **nincs** (D-F21) — a kérés ezt ki is mondta | **megépül** (F-5b gépezet): `ertesites_fiok` (a fiók kapcsolói + „mind olvasott" vízjel) és `ertesites_olvasott` (soronként); a lista a fiók MINDEN munkateréből, a saját kapcsolói szerint; a harang a sávban |
| 2 | **hat esemény-kapcsoló**: napi futás kész · forrás nem válaszol · keret elfogyott · AI nem válaszol · beragadt futás · sok sikertelen belépés | a 21 fajtából **kettő** létezik (`futas_kesz`, `keret_kimerult`); a másik négy **ma nem íródik a naplóba** (a forrás hibás állapota, az AI-hiba, a 15 perces elengedés és a belépési korlát megtörténik, de esemény nem lesz belőle) | **megépül a négy esemény** (`forras_hibas`, `ai_nem_valaszol`, `futas_beragadt`, `belepesi_kiserletek`), az esemény-mag 0.2.0; a kapcsoló így nem halott |
| 3 | a kapcsolók **fiók-szintűek** („kit hogyan érjenek el"), a felületi csatorna kapcsolható | a mai `GET/PUT /api/ertesites` a **kimenő horog** munkatér-szintű beállítása (`kimeno`/`nincs`) — más dolog | a két szint **külön marad**: a rajz kapcsolói az új fiók-szintű beállítást állítják (`/api/ertesites/sajat`); a horog beállítása gépezet marad képernyő nélkül (T-23) |
| 4 | a „felhő-kapcsoló" **kikapcsolt, „még nem működik"**; az AI-kapcsoló (kikapcsolva egyetlen AI-hívás sem indul) **nincs a rajzon** | `PUT /api/beallitas/ai` **létezik**, próbázott — a kérés kérte a rajzra | a rajz szerint épül: a felhő-kapcsoló jelölt, nem kattintható; az AI-kapcsoló **képernyő nélkül marad** — T-23: a következő Design-kérésbe (hova kerüljön) |

## 2. A mérés

| Mit | Eredmény |
|---|---|
| Artboardok | **7/7** (01 értesítések teli · 02 üres · 03 adatpolitika · 04 közönséges tag A/B · 05 telefon értesítések · 06 telefon adatpolitika · 07 vázlat, **nem épül**) |
| px-térköz a rajz törzsében | **0**; hex a törzsben: 0 (a 18 hex a `:root`) |
| Feliratkulcsok | **80** új (`nav.beallitasok`, `beallitasok.*` 4, `ertesites.*` 40, `jelzes.meg_nem_mukodik`, `adatpolitika.*` 34), mind három nyelven; a `rajz.*` jegyzetek nem kerülnek a felületre |
| Kulcs, ami a rajzon szövegként áll, de a JSON-ban nincs | a sor céljának 4 szövege („a találatokhoz", „a források listájához", „a költség lapra", „a futás részleteihez") — a `{cel}` helyőrző értékei; **pótolva** a 0057-ben (`ertesites.cel_*`), plusz a rendszergazdai sor szövege, a „Rendszer" munkatér-jelölés, az ország-feliratok |
| Tokenek | 6 új: `--keszul`, `--keszul-bg`, `--keszul-border`, `--olvasatlan`, `--kapcsolo-w` (38px), `--kapcsolo-h` (22px) — a rendszerben **nincs** kapcsoló-komponens, ezért a két méret is kell; mind a Theme-lapon állítható (D-F26 mintája) |
| Végpont-megfelelés | ami a rajzon kattintható: lista-sor (megnyitás), Mind olvasott, 6 kapcsoló, felületi csatorna, fülek, harang, tájékoztató link — **mind kap gépezetet** (új: `GET /api/ertesites/lista`, `GET/PUT /api/ertesites/sajat`, `POST /api/ertesites/olvasott`, `/beallitasok/nyit/[id]`); kikapcsolt és indokolt: e-mail, telefon, felhő-kapcsoló |
| A bejárat | a rajz 01. artboardján a **Saját fiók oldalsávja** (R-3) — az R-3 még nem jött meg; a **harang a sávban** ugyanide visz, az épül most; az oldalsáv sora az R-3-mal |
| A rajz megnyitása | hálózat kell (Google-betűk) + `support.js` a rajz mellett — az átadó kimondja |

## 3. A Design kérdései — válaszok

| # | Kérdés | Válasz |
|---|---|---|
| 1 | Alapérték: minden értesítés be? | **Igen**, mind be (a „Beragadt" is — a rajzon csak a bemutatás miatt áll kikapcsolva). |
| 2 | A rendszergazdai csoport marad? | **Marad**, külön dobozban; közönséges tagnál nincs ott. Az esemény (`belepesi_kiserletek`) rendszerszintű, munkatér nélkül — a lista „Rendszer" jelöléssel mutatja. |
| 3 | „Beragadt" kikapcsolva a rajzon | értem; élesben be. |
| 4 | A lap útja | `/beallitasok`, a rajz szerint. A Gépház-csempe (a kérés 4. pontja) **elmarad**: a rajz a fiók oldaláról nyitja, és a lap mindenkié, nem csak a tulajdonosé. |
| 5 | Fiókonként vagy munkatérenként? | **Fiókonként**, a rajz szerint; a lista minden munkatérből jön, sorában a munkatér neve. |
| 6 | Meddig vár a megállt AI-feladat (07.) | a 07. nem épül; a mai gépezet: a futás 15 perc után „beragadt"-ként enged el (T-21), az AI-hiba nem állítja meg a futást, csak a találat marad értékeletlen — ez a válasz, amíg a felhő-kapcsoló nem él. |
| 7 | A felhő-kapcsoló szintje | nem épül most; ha épül, munkatér-szintű (a tulajdonosnál), mint az AI-kapcsoló. |
| 8 | Megőrzés | a lista az utolsó **50** sort mutatja; az események a naplóban maradnak (külön megőrzési szabály nincs, T-24 a rajtad-listán nem áll — a pilot előtt eldöntendő). |
| 9 | „A futás részletei" célja | a hírfigyelő áttekintője (`/hirfigyelo`) — ott áll a futás állapota; külön lap nincs. |
| 10 | Adatkezelési tájékoztató | a `/adatkezeles` lap **megvan**; a rajz „a szövege még készül" jelzése marad, amíg Vilmos szövege nincs (a lap maga is ezt mondja). |

## 4. Amit a rajz nélkül nem tudtunk, és most mértünk (a 6. pont: „a kód írása előtt újra kell mérni")

2026-09-13: a három adatút a kódban változatlan — (1) a `packages/letolto` a forrás oldalát kéri le; (2) a hírfigyelő AI-hívója (`apps/web/hirfigyelo/ai.ts`)
a cikk kivonatát és a profilt küldi a `HF_AI_SZOLGALTATO` szolgáltatónak; (3) a `layout.tsx` a Google-betűket tölti (`fonts.googleapis.com`). A szolgáltató
doboza a **hírfigyelő** szolgáltatóját mutatja (az a 2. sor szereplője), nevét a leírólapjából (`leirolap.nev`), helyét a `szolgaltatoHol()`-ból; a mérés napja a lapon: 2026-09-13.

## 5. Javaslat

**Beépíthető, a D-F33 döntéseivel.** F-5b: a négy új esemény és kibocsátásuk; a fiók-szintű értesítés gépezete (2 tábla, 3 végpont + a megnyitó út);
a `Beallitasok` lap (két fül) és a `Kapcsolo` közös komponens; a harang a sávban; 6 token; 0057 feliratok; próbák; képek a 6 artboard mellé.
