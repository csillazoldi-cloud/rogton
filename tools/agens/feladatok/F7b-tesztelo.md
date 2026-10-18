# F-7b · Tesztelő — `apps/web/probak/r5-gephaz.proba.ts` (vitest, a FUTÓ kiszolgáló ellen, HTTP)

CÉL: egy próbafájl, ami az R-5 lapok adatforrását bizonyítja: a Gépház csempéinek új mezői, a hírfigyelő áttekintőjének AI-jelzője, az AI-kapcsoló hatása, a
Kimenő lap elérése szerep szerint. A minta: `kezdolap.proba.ts` (melléklet) — regisztráció, belépés, szervezet a `keres()`-sel; `takaritas()`/`lezar()` az `afterAll`-ban.
A `keres()` visszatérése `{ statusz, fejlecek, sutik, torzs }`; a sütiket `belA.sutik.join("; ")`-vel adod tovább a `sutik` opcióban. A `segedek.ts` is melléklet.

TÉNYEK (igazak, nem kell ellenőrizni):
- `POST /api/szervezet` `{ nev }` → 201, a törzs `{ id }`. Aki létrehozza, az a tulajdonos.
- `GET /api/gephaz` (tulajdonos) → 200; a törzs `{ gephaz: GephazNezet }` — ebben `gephaz.csomag = { kod: "pilot", modulok: [{ modul: "hirfigyelo", benne: true }] }` és
  `gephaz.kimeno = { bekotve: boolean, kimeno_szam: number }` (`kimeno_szam` új szervezetnél 0, mert a közös alap alapból semmit nem küld ki).
- `PUT /api/ertesites` (tulajdonos) `{ "futas_hiba": "kimeno" }` → 200; utána `GET /api/gephaz` → `gephaz.kimeno.kimeno_szam === 1`. `PUT /api/ertesites` `{}` → 200 (visszaáll), `kimeno_szam === 0`.
- `GET /api/hirfigyelo/attekintes` (tag) → 200, a törzs `{ hirfigyelo: { …, ai_engedelyezve: boolean } }` — új szervezetnél `true`.
- `PUT /api/beallitas/ai` (tulajdonos) `{ "engedelyezve": false }` → 200; utána az áttekintő `ai_engedelyezve === false`; `{ "engedelyezve": true }` → vissza `true`.
- `GET /gephaz/kimeno` (lap): tulajdonosnak 200 (a törzs HTML, benne a `km-ki-` osztálynév); belépés nélkül átirányítás a belépésre (a `fetch` követi: a végső válasz 200, de a HTML-ben NINCS `km-ki-`).
  Egy MÁSIK fiók, akit nézőnek hívnak meg (lásd lent), a lapot nem éri el: a végső HTML-ben nincs `km-ki-` (a kezdőlapra irányít).
- Meghívó: `POST /api/tagok/meghivo` (tulajdonos) `{ szerep: "nezo" }` → 201, a törzs `{ hozzaferes: { jegy } }`; a másik fiók: `POST /api/meghivo/elfogad` `{ jegy }` → 200.
- Néző: `PUT /api/beallitas/ai` → 403; `PUT /api/ertesites` → 403.

ESETEK (`describe("R-5 — Gépház csempék, AI-kapcsoló, Kimenő lap (F-7b)")`), legalább 7:
1. a Gépház csomag-mezője pilot, a modul benne; 2. `kimeno_szam` 0 → felülírás után 1 → visszaállítva 0; 3. az áttekintő `ai_engedelyezve` true;
4. AI kikapcsolva → false, visszakapcsolva → true; 5. a Kimenő lap tulajdonosnak 200 és `km-ki-`; 6. belépés nélkül nincs `km-ki-`; 7. néző: a lapon nincs `km-ki-`, és a két PUT 403.

HATÁR: egy fájl. TypeScript szigorú (`noUncheckedIndexedAccess` → tömb-index `| undefined`). Relatív importban nincs `.js`. A HTML-törzs `string` — `keres<string>(...)`.
Csak a fájlt add vissza, gondolkodás nélkül: `=== FÁJL: apps/web/probak/r5-gephaz.proba.ts ===` … `=== FÁJL VÉGE ===`. Semmi más szöveg.
