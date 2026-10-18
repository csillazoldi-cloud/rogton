# E-3 — közös szerződés (ezt kapja az építő és a tesztelő is)

Projekt: „Kommunikációs munkatér", Next.js 16 (app router), React 19, TypeScript 7 (strict,
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`), Drizzle 0.45 + `pg`,
zod 4 (a `@km/contracts` csomagból). Csomagkezelő: pnpm. Az `apps/web` alkalmazáson belül a
fájlok EGYMÁST relatív úttal importálják (nincs `@/` alias). Más csomagot csak a nevén át (`@km/contracts`).

## Adatbázis (mellékelve: `apps/web/adatbazis/sema.ts`, `apps/web/adatbazis/kapcsolat.ts`)
- `fiok` (id, email kisbetűs+egyedi, nev, jelszo_hash, letrehozva) — NINCS sorszintű védelem, a host adata.
- `szervezet` (id, nev) — védett: csak `szervezetKent(id, tx => …)` alatt látszik/írható, VAGY
  `fiokKent(fiokId, …)` alatt olvasható az, aminek a fiók tagja.
- `tagsag` (szervezet_id, fiok_id, szerep) — védett ugyanígy.
- `munkamenet` (id, fiok_id, token_lenyomat egyedi, lejar, letrehozva) — NINCS védelem.
- Az alkalmazás a `km_app` szereppel lép be; ami védett, ahhoz KÖTELEZŐ a `szervezetKent` / `fiokKent`.
- Új szervezet létrehozása: az azonosítót az alkalmazás generálja (`crypto.randomUUID()`), és
  `szervezetKent(ujId, tx => …)` alatt szúrja be a szervezetet (explicit `id`-vel) ÉS a tulajdonos tagságot
  — a védelmi szabály csak így engedi.

## Szerződés (mellékelve: `packages/contracts/src/index.ts`)
Bemeneti sémák: `RegisztracioKeres`, `BelepesKeres`, `SzervezetLetrehozasKeres`. Kimenet: `FiokNezet`.
Hibaválasz mindig `HibaValasz` = `{ hiba: HibaKod, mezok?: Record<string,string> }`.
Süti: `MUNKAMENET_SUTI` ("km_munkamenet"), élettartam `MUNKAMENET_ELETTARTAM_NAP` (30 nap).

## A hitelesítő modul felülete — `apps/web/hitelesites/index.ts`
```ts
export type Eredmeny<T> = { ok: true; ertek: T } | { ok: false; hiba: HibaKod; mezok?: Record<string,string> };
export function regisztral(be: unknown): Promise<Eredmeny<{ fiokId: string }>>;
// be = RegisztracioKeres; hibák: ERVENYTELEN_ADAT (mezok-kel), GYENGE_JELSZO, EMAIL_FOGLALT
export function belep(be: unknown): Promise<Eredmeny<{ token: string; lejar: Date; fiokId: string }>>;
// be = BelepesKeres; hiba: ERVENYTELEN_ADAT, ROSSZ_BELEPES (rossz e-mail ÉS rossz jelszó esetén is ugyanez;
// üres jelszo_hash-ű fiók (teszt-fiók) sem léphet be)
export function kilep(token: string): Promise<void>;           // a munkamenet sorát törli; ismeretlen token: csendben
export function aktualisFiok(token: string | undefined): Promise<FiokNezet | null>;
// null, ha nincs token / nincs ilyen munkamenet / lejárt (a lejártat törli is)
export function szervezetLetrehoz(fiokId: string, be: unknown): Promise<Eredmeny<{ szervezetId: string }>>;
// be = SzervezetLetrehozasKeres; a hívó tulajdonos lesz
```
- Jelszó: `@node-rs/argon2` (`hash`, `verify`), argon2id, alapbeállítás. Saját hash-elés TILOS.
- Token: 32 véletlen bájt `base64url` (node:crypto), az adatbázisba csak a `sha256` hex lenyomat kerül.
- E-mail összehasonlítás kisbetűsen (a séma már így adja).
- A kiszolgáló SOHA nem ad emberi nyelvű szöveget, csak hibakódot.

## Süti-segéd — `apps/web/hitelesites/suti.ts`
```ts
export function munkamenetSutiBeallit(valasz: Response, token: string, lejar: Date): void; // httpOnly, secure, sameSite=lax, path=/
export function munkamenetSutiTorol(valasz: Response): void;
export function munkamenetTokenKeresbol(keres: Request): string | undefined; // a Cookie fejlécből
```
(A `secure` attribútum csak akkor, ha `process.env.NODE_ENV === "production"` — a próbák http-n futnak.)

## API-pontok (app router `route.ts` fájlok, `export const dynamic = "force-dynamic"`)
| Módszer, út | Bemenet | Siker | Hibák |
|---|---|---|---|
| POST `/api/fiok/regisztracio` | JSON RegisztracioKeres | 201 `{ id }` | 400 ERVENYTELEN_ADAT / GYENGE_JELSZO, 409 EMAIL_FOGLALT |
| POST `/api/fiok/belepes` | JSON BelepesKeres | 200 `{ id }` + süti | 400 ERVENYTELEN_ADAT, 401 ROSSZ_BELEPES |
| POST `/api/fiok/kilepes` | — (süti) | 204 + süti törölve | — (mindig 204) |
| GET `/api/fiok/en` | — (süti) | 200 FiokNezet | 401 NINCS_BELEPVE |
| POST `/api/szervezet` | JSON SzervezetLetrehozasKeres (süti) | 201 `{ id }` | 401 NINCS_BELEPVE, 400 ERVENYTELEN_ADAT |
Hibás JSON-törzs → 400 ERVENYTELEN_ADAT. Váratlan hiba → 500 BELSO_HIBA (a részlet a kiszolgáló naplójába, nem a válaszba).
Minden válasz `cache-control: no-store`.
