# Feladat — ÉPÍTŐ (E-10): a profil módosítása a fiókoldalon, a szervezet részletei

TypeScript 7 strict, Next.js 16 app router, Drizzle 0.45. Mellékelve: `apps/web/onboarding/jovahagyas.ts` (MINTA:
`szervezetKent`, séma-ellenőrzés, `Eredmeny<T>`; a `profilBetolt` itt van), a szerződés részlete (`SzervezetProfil`,
`ProfilModositas`, `SzervezetReszletek`, `MezoForras`), az adatbázis-séma részlete (`szervezet`, `fiok`, `tagsag`,
`szervezetProfil`), és egy meglévő route (`apps/web/app/api/profil/route.ts` — a GET; PONTOSAN ezeket az importokat
használd, ne találj ki modult; a PUT-ot ebbe a fájlba írd, a GET marad).

Írd meg (három fájl, mind `=== FÁJL: <út> ===` blokkban):

## 1. `apps/web/onboarding/profil.ts`
```ts
import "server-only";
/** A jóváhagyott profil módosítása a fiókoldalon (E-10). A forrás/„módosítva” jel a v6 userEdit szabálya szerint. */
export async function profilModosit(szervezetId: string, be: unknown): Promise<Eredmeny<SzervezetProfil>>;
```
- `ProfilModositas.safeParse(be)` → hibánál `{ ok: false, hiba: "ERVENYTELEN_ADAT", mezok }` (a `mezok` képzése mint a
  mintában: `p.path.join(".")` → `p.code`).
- `szervezetKent(szervezetId, async (tx) => …)`: a `sema.szervezetProfil` sora; ha nincs → `{ ok: false, hiba: "NINCS_JOG" }`
  (nincs jóváhagyott profil). `SzervezetProfil.safeParse(sor.adatok)` → hibás tartalomnál `ERVENYTELEN_ADAT`.
- Mezőnként, ha a bemenetben szerepel:
  - `nev` → `profil.nev = nev`.
  - `osszefoglalo` → `profil.osszefoglalo = …`; forrás-szabály (userEdit): ha `osszefoglalo_forras` "" vagy "sajat" →
    `osszefoglalo_forras = "sajat"`, `osszefoglalo_modositva = false`; különben a forrás marad és `osszefoglalo_modositva = true`.
  - `celkozonseg`, `cel`, `hangnem_leiras` → ugyanez a szabály a saját `*_forras` / `*_modositva` mezőikkel;
    `hangnem_leiras` mentésekor `hangnem_minta = ""` (a minta a régi hangnemhez tartozott), `hangnem_nyelv` marad.
  - `nyelvek` → `profil.nyelvek = nyelvek`, `nyelvek_forras = "sajat"`.
  - `arculat` → `profil.arculat = arculat` változtatás nélkül (az állapotgépet a felület viszi, a séma ellenőrzi).
- Utána a `kesobbre` újraszámolása: "celkozonseg" ha üres, "cel" ha üres, "nyelvek" ha üres a tömb, "hangnem" ha üres a
  leírás, "arculat" ha `arculat.allapot !== "jovahagyott"`.
- `profil.frissitve = new Date().toISOString()`; `SzervezetProfil.safeParse(profil)` → hibánál `ERVENYTELEN_ADAT`.
- `tx.update(sema.szervezetProfil).set({ adatok: ellenorzott, frissitve: most }).where(eq(sema.szervezetProfil.szervezetId, szervezetId))`.
- Visszatérés `{ ok: true, ertek: ellenorzott }`.

## 2. `apps/web/szervezet/reszletek.ts`
```ts
import "server-only";
/** A szervezet és tagjai a fiókoldalhoz (E-10). `szervezetKent` alatt: csak a saját szervezet látszik. */
export async function szervezetReszletek(szervezetId: string): Promise<SzervezetReszletek | null>;
```
- `szervezetKent` alatt: a `sema.szervezet` sora (id, nev, letrehozva) — ha nincs, null; a tagok:
  `tx.select({ fiok_id: sema.tagsag.fiokId, nev: sema.fiok.nev, szerep: sema.tagsag.szerep }).from(sema.tagsag).innerJoin(sema.fiok, eq(sema.fiok.id, sema.tagsag.fiokId)).where(eq(sema.tagsag.szervezetId, szervezetId)).orderBy(sema.tagsag.letrehozva)`.
- Visszatérés `SzervezetReszletek` alakban (`letrehozva` ISO szöveg).

## 3. `apps/web/app/api/profil/route.ts` — a meglévő GET mellé PUT
Belépés-ellenőrzés mint a GET-ben (401/409); `const be = await keres.json().catch(() => null)`;
`profilModosit(szervezet.id, be)` → 200 `{ profil }`; `NINCS_JOG` 409, `ERVENYTELEN_ADAT` 400 (a `mezok`-kal), egyéb 500.
Add vissza a TELJES fájlt (GET + PUT).

Szabályok: nincs új csomag; nincs `any`; `cache-control: no-store`; `export const dynamic = "force-dynamic"`.
Ne írj próbát, azt a tesztelő írja.
