# F-2 · Tesztelő — élő próbák a kezdőképernyő, a Gépház, a pénznem és a munkatér-váltás végpontjaira (`apps/web/probak/kezdolap.proba.ts`)

CÉL: egy új próbafájl az élő rendszer ellen bizonyítja, hogy a hat végpont a szerződés szerint válaszol — a jogokkal és a hibautakkal.

FORRÁS: a mellékelt `segedek.ts` (`keres`, `veletlenEmail`, `takaritas`, `lezar`), a `sajat-fiok.proba.ts` eleje (fiók + belépés + sütik),
a `hozzaferes.proba.ts` (meghívó → második tag, más szereppel). A szerződés a `docs/KEZDOLAP-SZERZODES.md`; a típusok a
`apps/web/kezdolap/tipusok.ts`. Jelszó: "ProbaJelszo123!". Regisztráció: `POST /api/fiok/regisztracio` {nev,email,jelszo} → 201;
belépés `POST /api/fiok/belepes` → 200, sütik `belepes.sutik.join("; ")`; szervezet `POST /api/szervezet` {nev} → 201 (aki létrehozza,
tulajdonos). Második tag: A `POST /api/tagok/meghivo` `{ szerep: "nezo" }` → 201 `{ hozzaferes: { jegy } }`; B (szervezet NÉLKÜL) `POST /api/meghivo/elfogad`
`{ jegy }` → 200.

A VÉGPONTOK (siker `{ kezdolap }` / `{ gephaz }` / `{ penznem }` / `{ arfolyam }` / `{ szervezet }`, hiba `{ hiba: "<KÓD>" }`):
- `GET /api/kezdolap` (bármely tag) → 200 `{ kezdolap: KezdolapNezet }`: `munkater.id`, `munkater.penznem` ("EUR" alapból), `szerep`, `elso_hasznalat`
  (új szervezetnél `true`, mert nincs jóváhagyott profil), `hirfigyelo` (`null` új szervezetnél), `profil` (`null`), `arculat` ("nincs"), `forrasok` (mind 0,
  `osszes` 0), `koltseg` (`honap` "YYYY-MM", `becsult.usd` 0, `becsult.penznem` = a munkatér pénzneme, `keret.usd` > 0, `maradt.ertek` ≥ 0), `tervezet`
  (`{ tema: false, feliratok: false }`).
- `GET /api/gephaz`: tulajdonosnak 200 `{ gephaz: { nezet: "tulajdonos", koltseg: null, fiokok: null, tema: { tervezet: false, felulirt: 0, … }, feliratok: { … } } }`;
  nézőnek 403 `NINCS_JOG`; süti nélkül 401; szervezet nélküli fióknak 409 `NINCS_SZERVEZET`.
- `PUT /api/beallitas/penznem` `{ penznem: "RON" }` tulajdonosnak → 200 `{ penznem: "RON" }`, utána `GET /api/kezdolap` → `munkater.penznem` "RON" és
  `koltseg.keret.penznem` "RON", `koltseg.keret.ertek` ≈ `koltseg.keret.usd × arfolyam.RON` (±0,01); `{ penznem: "GBP" }` → 400 `ERVENYTELEN_ADAT`;
  nézőnek `{ penznem: "EUR" }` → 403; süti nélkül 401.
- `GET /api/beallitas/arfolyam` belépettnek → 200 `{ arfolyam: { EUR, USD, HUF, RON } }`, `USD` 1, mind > 0. `PUT /api/beallitas/arfolyam`
  `{ penznem: "HUF", egy_usd: 360 }` NEM rendszergazdának → 403 `NINCS_JOG`.
- `POST /api/szervezet/valt`: A-nak egy MÁSODIK saját szervezettel (A létrehoz még egyet `POST /api/szervezet` → 201, ettől az lesz az aktuális? —
  NEM feltétlenül: mérd meg, `GET /api/kezdolap` `munkater.id`-je melyik); `{ szervezet_id: <az első> }` → 200 `{ szervezet: { id, nev } }`, majd
  `GET /api/kezdolap` `munkater.id` = az első; `{ szervezet_id: <a második> }` → 200 és a `munkater.id` a második; idegen szervezet (B-nek A második
  szervezete, ahol B nem tag) → 403 `NINCS_JOG`; `{ szervezet_id: "nem-uuid" }` → 400.
- Lapok: `GET /kezdolap` sütivel → 200, a törzs tartalmazza a `km-` osztályú sávot (`FelsoSav`) — ellenőrizd, hogy a HTML-ben szerepel a
  `Kezdőképernyő` vagy a `Home` szó (a felület nyelve szerint bármelyik); süti nélkül → 307/302 a `/belepes`-re (a `keres` nem követi az
  átirányítást? — ha követi, a végső lap URL-je/törzse a belépőlap: fogadd el a 200-at, ha a törzsben `belepes` szerepel). `GET /gephaz` nézőnek →
  átirányítás a `/kezdolap`-ra (ugyanígy mérve).

MIT CSINÁLJ: `describe("kezdolap, gephaz, penznem, munkater-valtas (F-2)")`; `beforeAll`: A fiók + szervezet (tulajdonos); B fiók szervezet nélkül,
A meghívja nézőnek, B beváltja; C fiók szervezet nélkül. Esetek külön `it`-ekben, a fenti sorrendben (1…10). `afterAll`: `takaritas()`, `lezar()`.
Szigorú TypeScript (`noUncheckedIndexedAccess`): a törzseket típusozd (`as { kezdolap: KezdolapNezet }`, `as { hiba: string }`); a típusokat
`import type { KezdolapNezet, GephazNezet } from "../kezdolap/tipusok"`.
HATÁR: csak ez az egy fájl. A `segedek.ts`-hez nem nyúlsz.
Visszaadás: a fájl teljes tartalma egy `=== FÁJL: apps/web/probak/kezdolap.proba.ts ===` blokkban. Semmi más szöveg.
