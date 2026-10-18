# F-4 · Tesztelő — élő próbák a Saját fiók végpontjaira (`apps/web/probak/sajat-fiok.proba.ts`)

CÉL: az élő rendszer ellen bizonyítani, hogy a jelszóváltás, a névmódosítás és a „kiléptetés minden más eszközről” a szerződés szerint működik.

FORRÁS: a mellékelt `segedek.ts` (`keres`, `veletlenEmail`, `takaritas`, `lezar`) és a `tema.proba.ts` eleje (regisztráció
`POST /api/fiok/regisztracio` {nev,email,jelszo} → 201; belépés `POST /api/fiok/belepes` → 200, sütik `belepes.sutik.join("; ")`).
A jelszó: "ProbaJelszo123!". A `GET /api/fiok/en` (sütivel) → 200 `{ id, nev, email, … }`.

A VÉGPONTOK (siker `{ fiok: … }`, hiba `{ hiba }`), mind belépett fiókkal, szervezet NEM kell:
- `PUT /api/fiok/jelszo` `{ jelenlegi, uj }` → 200 `{ fiok: { masEszkozokKileptetve: number } }`; rossz jelenlegi → 400 `ROSSZ_JELENLEGI_JELSZO`;
  rövid `uj` (< 10 karakter) → 400 `GYENGE_JELSZO`; utána a régi jelszóval `POST /api/fiok/belepes` → 400/401 (`ROSSZ_BELEPES`), az újjal 200.
  A váltás a fiók MINDEN MÁS munkamenetét kilépteti, a mostanit nem.
- `PUT /api/fiok/nev` `{ nev }` → 200 `{ fiok: { nev } }`; üres név → 400 `ERVENYTELEN_ADAT`; `GET /api/fiok/en` az új nevet adja.
- `POST /api/fiok/kileptetes-mindenhol` → 200 `{ fiok: { torolt: number } }`: a fiók összes MÁS munkamenete megszűnik, a mostani marad.
- E-mail-módosításra NINCS végpont: `PUT /api/fiok/email` → 404 vagy 405 (nem 200).
- Süti nélkül mind → 401.

MIT CSINÁLJ: `describe("sajat fiok — jelszo, nev, kileptetes (F-4)")`; `beforeAll`: egy fiók, KÉT belépéssel (két külön sütikészlet:
`sutik1`, `sutik2` — két „eszköz”). Esetek:
1. `PUT /api/fiok/nev` sutik1-gyel `{ nev: "Új Név" }` → 200, `GET /api/fiok/en` → "Új Név"; üres név → 400.
2. `POST /api/fiok/kileptetes-mindenhol` sutik1-gyel → 200, `torolt` = 1; utána `GET /api/fiok/en` sutik2-vel → 401, sutik1-gyel → 200.
3. Lépj be újra a 2. eszközzel (új sutik2). `PUT /api/fiok/jelszo` sutik1-gyel rossz jelenlegivel → 400 `ROSSZ_JELENLEGI_JELSZO`;
   rövid újjal → 400 `GYENGE_JELSZO`; jó adatokkal → 200 és `masEszkozokKileptetve` = 1; utána sutik2 → 401, sutik1 → 200;
   belépés a régi jelszóval → nem 200; az újjal → 200.
4. `PUT /api/fiok/email` `{ email: "x@y.hu" }` → státusz nem 200.
5. Süti nélkül `PUT /api/fiok/nev` → 401, `PUT /api/fiok/jelszo` → 401, `POST /api/fiok/kileptetes-mindenhol` → 401.
`afterAll`: `takaritas()`, `lezar()`. Szigorú TypeScript: típusozd a törzseket. A `keres` segéd `sutik` opcióval küldi a sütit.

HATÁR: csak ez az egy új fájl. Segédet nem találsz ki. TILOS: közvetlen SQL; `any`; `console.log`; tanakodás a kimenetben — csak a kód.
Visszaadás: `=== FÁJL: apps/web/probak/sajat-fiok.proba.ts ===` blokkban, teljes tartalommal.
