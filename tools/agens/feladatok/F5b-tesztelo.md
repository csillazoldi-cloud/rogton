# F-5b · Tesztelő — `apps/web/probak/beallitasok.proba.ts` (vitest, a FUTÓ kiszolgáló ellen, HTTP + SQL)

CÉL: a fiók-szintű értesítés gépezetének élő próbái. A minta: `kezdolap.proba.ts` (melléklet) — így épül itt egy próbafájl (regisztráció, belépés, szervezet a
`keres()`-sel; `sql()` közvetlen SQL a próba-adatbázison km_tulaj-ként; `takaritas()`/`lezar()` az `afterAll`-ban). A szerződés: `tipusok.ts` (melléklet).

A VÉGPONTOK (mind `kapu(…, "tag")` — belépett, van munkatere):
- `GET /api/ertesites/sajat` → 200 `{ beallitas: SajatBeallitas }` — új fióknál MIND be (`esemenyek.*: true`, `feluleten: true`).
- `PUT /api/ertesites/sajat` (a TELJES SajatBeallitas) → 200 `{ beallitas }`; hiányzó kulcs vagy nem-boolean → 400 `{ hiba: "ERVENYTELEN_ADAT" }`.
- `GET /api/ertesites/lista` → 200 `{ lista: { sorok, olvasatlan, osszes } }` — a fiók munkatereinek eseményei az öt fajtából (`futas_kesz, forras_hibas, keret_kimerult, ai_nem_valaszol, futas_beragadt`), ido szerint csökkenő, max 50; a KIKAPCSOLT fajta nem szerepel.
- `POST /api/ertesites/olvasott` `{ esemeny_id }` → 200 `{ lista }` (az a sor olvasott); `{ mind: true }` → 200, minden sor olvasott, `olvasatlan: 0`; más törzs → 400.
- `GET /beallitasok/nyit/<esemeny_id>` → 3xx átirányítás (a sor célja: `futas_kesz` → `/hirfigyelo`, `keret_kimerult` → `/koltseg`); a sor utána olvasott. (A `keres()` nem követ átirányítást? — nézd meg a segedek.ts-t; ha követi, a végső út 200-as lapja is elfogadható: ellenőrizd a válasz `url`-jét vagy a `location` fejlécet.)
- A `belepesi_kiserletek` (rendszerszintű, `szervezet_id NULL`) sor csak RENDSZERGAZDÁNAK jelenik meg — a próbafiók nem az, tehát a listában NEM lehet ilyen sor akkor sem, ha beszúrsz egyet.

ESEMÉNYEK BESZÚRÁSA (a gépezet írja őket élesben; a próbában SQL-lel, km_tulaj-ként, a `sql()` segéddel):
`INSERT INTO esemeny (szervezet_id, fajta, sulyossag, fiok_id, ido, adat) VALUES ($1, 'futas_kesz', 'info', NULL, now() - interval '1 minute', '{"uj_talalatok": 10}'::jsonb) RETURNING id`
— a szervezet azonosítója a `POST /api/szervezet` válaszából (`szervezet.id`). Szúrj be: futas_kesz (uj_talalatok 10), forras_hibas (`{"forras":"https://pelda.hu/rss"}`), keret_kimerult (`{}`), és egy `belepes` fajtát (`info`) — ez utóbbi NEM tartozik az ötbe, a listában nem szerepelhet.

ESETEK (legalább 10, `describe("Beállítások — értesítések (F-5b)")`):
1. alapbeállítás: mind be; 2. PUT érvénytelen (hiányzó `feluleten`) → 400; 3. PUT: `futas_kesz: false` → 200 és a GET is ezt adja vissza;
4. lista: a 3 beszúrt sor (a `belepes` nincs), mind olvasatlan, `olvasatlan === osszes === 3`, sorrend ido szerint csökkenő, a sor `munkater.nev` a szervezet neve, `cel` a fajtának megfelelő (`futas_kesz`→`talalatok`, `forras_hibas`→`forrasok`, `keret_kimerult`→`koltseg`), `ertekek.n === 10` a futas_kesz sornál, `ertekek.forras` a forras_hibas sornál;
5. a kikapcsolt fajta eltűnik: PUT `futas_kesz: false` → a lista 2 sor; visszakapcsolva 3;
6. egy sor olvasottnak jelölése → az a sor `olvasott: true`, `olvasatlan` eggyel kevesebb; 7. `mind: true` → `olvasatlan 0`, minden sor olvasott; 8. rossz törzs → 400;
9. a megnyitó út átirányít a célra és olvasottnak jelöl; 10. egy MÁSIK fiók (B, saját szervezettel) listája üres — A eseményeit nem látja; 11. belépés nélkül a `GET /api/ertesites/lista` 401.
Az esemény-sorok takarítása: a `takaritas()` a próbafiókokat és szervezeteiket törli (CASCADE viszi az eseményt) — ha nem, `DELETE FROM esemeny WHERE szervezet_id = $1` az `afterAll`-ban.

HATÁR: egy fájl. TypeScript szigorú (`noUncheckedIndexedAccess` → tömb-index `| undefined`, ezért `expect(x).toBeDefined()` után `x!` vagy szűkítés). Relatív importban nincs `.js`.
A `keres()` visszatérése: nézd meg a segedek.ts-ben (melléklet) — a státusz és a törzs neveit onnan vedd, ne találd ki.
Visszaadás: a fájl teljes tartalommal, `=== FÁJL: apps/web/probak/beallitasok.proba.ts ===` blokkban. Semmi más szöveg.
