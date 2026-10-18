# F-5 + F-6 · Tesztelő — élő próbák: eseménynapló, értesítés, AI-kapcsoló, fájlfeltöltés (`apps/web/probak/esemeny-fajl.proba.ts`)

CÉL: az élő rendszer ellen bizonyítani a két új gépezetet. Egy fájl, két `describe`.

FORRÁS: a mellékelt `segedek.ts` (`keres`, `veletlenEmail`, `takaritas`, `lezar`, `PROBA_CIM`) és a `hozzaferes.proba.ts` (fiók+szervezet létrehozása,
meghívó kiadása/beváltása — ezekkel keltünk eseményeket). A jelszó "ProbaJelszo123!". A `keres` JSON-t küld; a NYERS fájlküldéshez használj `fetch`-et
(`PROBA_CIM + "/api/arculat/fajl"`, `method: "POST"`, `headers: { cookie: sutik, "x-fajl-nev": encodeURIComponent(nev), "x-fajl-cel": "logo", "content-type": "application/octet-stream" }`, `body: bajtok`).

A VÉGPONTOK:
- `GET /api/esemenyek?limit=50` (tag) → 200 `{ esemeny: Esemeny[] }`, legújabb elöl; `Esemeny = { id, szervezet_id, fajta, sulyossag, fiok_id, ido, adat }`.
- `GET /api/ertesites` (tag) → 200 `{ beallitas: { kozos, szervezeti, hatasos } }`; `PUT /api/ertesites` (tulajdonos) `{ futas_hiba: "kimeno" }` → 200; nézőként 403;
  ismeretlen fajta `{ valami: "kimeno" }` → 400.
- `GET /api/beallitas/ai` (tag) → 200 `{ beallitas: { ai_engedelyezve: true } }`; `PUT /api/beallitas/ai` (tulajdonos) `{ engedelyezve: false }` → 200; utána
  `POST /api/onboarding/osszefoglalo` (szerkesztő, egy AI-t hívó végpont; törzs `{ forras_tipus: "leiras", leiras: "Ez egy próba leírás, elég hosszú." }`) → 409 `AI_KIKAPCSOLVA`;
  visszakapcsolva → nem 409. Az események közt megjelenik `ai_kapcsolo_valtozott`.
- `POST /api/arculat/fajl` (szerkesztő): PNG-fejlécű bájtok (`89 50 4E 47 0D 0A 1A 0A` + 100 tetszőleges bájt) → 201 `{ fajl: { id, tipus: "png", meret, nev, cel } }`;
  SVG szöveg (`<svg xmlns="http://www.w3.org/2000/svg"></svg>`, `x-fajl-nev: logo.png`!) → 415 `SVG_NEM_ENGEDETT`; GIF fejléc (`GIF89a`) → 415 `TIPUS_NEM_ENGEDETT`;
  üres törzs → 400 `URES`; nézőként → 403.
- `GET /api/arculat/fajl?cel=logo` (tag) → 200 `{ fajl: FajlMeta[] }` 1 elem; `GET /api/arculat/fajl/{id}` → 200, `content-type: image/png`, a törzs hossza = meret;
  más szervezet tagjaként → 404; ismeretlen id → 404.
- Az események közt `fajl_feltoltve` NEM követelmény (a fájl-modul eseménye a naplóba még nem kötött) — ne várd el.

MIT CSINÁLJ: `describe("esemenynaplo, ertesites, AI-kapcsolo (F-5)")` és `describe("fajlfeltoltes (F-6)")`; `beforeAll`: A fiók + szervezet (tulajdonos), B fiók,
akit A meghív nézőnek és B bevált (így B néző A munkaterében), C fiók saját szervezettel (másik munkatér). Esetek (külön `it`-ek): a fenti pontok mind; a napló:
A `GET /api/esemenyek` tartalmaz `belepes`, `meghivo_kiadva`, `meghivo_elfogadva` fajtát (a beforeAll műveletei után); B (néző) is olvashatja; C nem látja A eseményeit.
`afterAll`: `takaritas()`, `lezar()`. Szigorú TypeScript: típusozd a törzseket; a `Uint8Array` a `fetch` `body`-jában rendben van.

HATÁR: csak ez az egy új fájl. TILOS: közvetlen SQL; `any`; `console.log`; tanakodás — csak a kód, legfeljebb 3 sor magyarázat.
Visszaadás: `=== FÁJL: apps/web/probak/esemeny-fajl.proba.ts ===` blokkban, teljes tartalommal.
