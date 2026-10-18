# F-3 · Tesztelő — élő próbák a tagság- és meghívó-végpontokra (`apps/web/probak/hozzaferes.proba.ts`)

CÉL: egy új próbafájl az élő rendszer ellen bizonyítja, hogy a meghívás, elfogadás, szerep-állítás, eltávolítás és kilépés
végpontjai a szerződés szerint működnek — a jogokkal és a hibautakkal együtt.

FORRÁS: a mellékelt `segedek.ts` (a `keres`, `veletlenEmail`, `takaritas`, `lezar` segédek) és a `tema.proba.ts` eleje (fiók +
szervezet létrehozása: `POST /api/fiok/regisztracio` {nev,email,jelszo} → 201; `POST /api/fiok/belepes` → 200, sütik
`belepes.sutik.join("; ")`; `POST /api/szervezet` {nev} → 201, aki létrehozza, TULAJDONOS). A jelszó: "ProbaJelszo123!".

A VÉGPONTOK (ez a szerződés; a válasz sikerkor `{ hozzaferes: … }`, hibakor `{ hiba: "<KÓD>" }`):
- `GET /api/tagok` (bármely tag) → 200 `{ hozzaferes: Tag[] }`, `Tag = { fiok_id, szerep, csatlakozott }`.
- `POST /api/tagok/meghivo` `{ szerep: "nezo"|"szerkeszto"|"tulajdonos", email?: string }` (szerkesztő vagy tulajdonos) → 201
  `{ hozzaferes: { meghivo: { id, szerep, allapot: "kiadott", lejar, … }, jegy: string, link: string } }`. A `jegy` legalább 32 karakter.
- `GET /api/tagok/meghivo` (szerkesztő/tulajdonos) → 200, a lista elemei `allapot_most` mezővel.
- `DELETE /api/tagok/meghivo/{id}` (szerkesztő/tulajdonos) → 200; másodszor 410 `MEGHIVO_VISSZAVONVA`.
- `POST /api/meghivo/elfogad` `{ jegy }` (belépett fiók, szervezet nem kell) → 200 `{ hozzaferes: { szervezet_id, szerep } }`;
  ismeretlen jegy → 404 `NINCS_ILYEN_MEGHIVO`; másodszor ugyanaz a jegy → 410 `MEGHIVO_FELHASZNALVA`; már tag → 409 `MAR_TAG`.
- `PUT /api/tagok/{fiokId}` `{ szerep }` (csak tulajdonos) → 200; a saját fiókra 409 `MAGAT_NEM`; szerkesztőként 403 `NINCS_JOG`.
- `DELETE /api/tagok/{fiokId}` (csak tulajdonos) → 200; az egyetlen tulajdonosra (saját magára) 409 `MAGAT_NEM`.
- `POST /api/tagok/kilep` (bármely tag) → 200; az egyetlen tulajdonosnak 409 `UTOLSO_TULAJDONOS`.
- Süti nélkül minden módosító 401.

FONTOS a fiókról: egy fióknak több szervezete lehet; a rendszer AKTUÁLIS szervezete a fiók ELSŐ szervezete. Ezért a meghívott B fiók
NE hozzon létre saját szervezetet a beváltás előtt — regisztrál, belép, és rögtön beváltja a jegyet: így az A szervezete lesz az első.

MIT CSINÁLJ: `describe("tagsag es meghivo a webalkalmazasban (F-3)")`; `beforeAll`: A fiók + szervezet (tulajdonos); B fiók
szervezet nélkül; C fiók szervezet nélkül. Esetek (mind külön `it`):
1. A `GET /api/tagok` → 1 tag, A tulajdonos.
2. A meghív szerkesztőt → 201, jegy ≥ 32 karakter, `allapot` "kiadott"; `GET /api/tagok/meghivo` 1 elem, `allapot_most` "kiadott".
3. B beváltja → 200, szerep "szerkeszto"; A `GET /api/tagok` → 2 tag.
4. B (szerkesztő) meghív tulajdonost → 403 `NAGYOBB_SZEREP`; nézőt → 201.
5. C beváltja B nézői meghívóját → 200; C `GET /api/tagok` → 3 tag; C (néző) `POST /api/tagok/meghivo` → 403 `NINCS_JOG`.
6. B beváltja a saját nézői jegyét (már tag) → 409 `MAR_TAG`; ismeretlen jegy → 404.
7. A átállítja B-t nézőre → 200; B `PUT /api/tagok/{C}` → 403 `NINCS_JOG`; A `PUT` a saját fiókjára → 409 `MAGAT_NEM`.
8. A meghív még egyet, majd `DELETE /api/tagok/meghivo/{id}` → 200; a jegy beváltása (C-vel? — C már tag; használj egy D fiókot) → 410 `MEGHIVO_VISSZAVONVA`.
9. A `POST /api/tagok/kilep` → 409 `UTOLSO_TULAJDONOS`; C kilép → 200; A `GET /api/tagok` → 2 tag.
10. A eltávolítja B-t → 200; `GET /api/tagok` → 1 tag; A `DELETE /api/tagok/{A}` → 409 `MAGAT_NEM`.
11. Süti nélkül `POST /api/tagok/meghivo` → 401.
`afterAll`: `takaritas()`, `lezar()`. Szigorú TypeScript (`noUncheckedIndexedAccess`): a törzseket típusozd
(`as { hozzaferes: … }`, `as { hiba: string }`).

HATÁR: csak ez az egy új fájl. Segédet nem találsz ki: ami a `segedek.ts`-ben nincs, azt itt írd meg helyben.
KÉSZ, HA: `pnpm --filter web proba -- hozzaferes` zöld a futó rendszer ellen.
TILOS: közvetlen SQL a tagságra vagy a meghívóra; `any`; `console.log`.
Visszaadás: `=== FÁJL: apps/web/probak/hozzaferes.proba.ts ===` blokkban, teljes tartalommal.

MEGJEGYZÉS (2. kör): a jegyeket és az azonosítókat a `describe` szintjén deklarált változókban add tovább az esetek közt
(`let jegySzerkeszto = ""; let jegyNezo = ""; let bFiokId = ""; …`) — az `it`-ek sorban futnak, a korábbi eset állítja be, a későbbi
használja. NE tanakodj a kimenetben: csak a kód jöjjön, magyarázat legfeljebb 3 sor a blokk után. A fiók azonosítója a
`GET /api/fiok/en` válaszának `id` mezője (sütivel).
