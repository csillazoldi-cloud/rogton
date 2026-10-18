# Feladat — ÉPÍTŐ (E-6): az onboarding-piszkozat gépezete

Next.js 16 (app router), TypeScript 7 strict, Drizzle + pg, zod 4. Az `apps/web` fájljai relatív úttal
importálják egymást; más csomag csak a nevén (`@km/contracts`). Mellékelve: a séma (`onboardingPiszkozat`
tábla — SORSZINTŰ VÉDELEM: csak `szervezetKent(szervezetId, tx => …)` alatt látszik/írható), a kapcsolat-réteg,
a hitelesítő modul felülete (`aktualisFiok(token)` → `FiokNezet | null`, `munkamenetTokenKeresbol(keres)`),
és a szerződés (`OnboardingPiszkozat`, `PiszkozatValasz`, `URES_PISZKOZAT`, `HibaValasz`).

Írd meg:

1. `apps/web/onboarding/piszkozat.ts`
```ts
import "server-only";
/** A bejelentkezett ember AKTUÁLIS szervezete: a FiokNezet.szervezetek első eleme; ha nincs: null. */
export function aktualisSzervezet(fiok: FiokNezet): { id: string; nev: string } | null;
/** A szervezet piszkozata `szervezetKent` alatt; ha nincs sor: URES_PISZKOZAT és frissitve: null.
 *  A jsonb-t `OnboardingPiszkozat.safeParse`-szal ellenőrzi; hibás/régi tartalomnál URES_PISZKOZAT-ot ad
 *  és console.error-ral naplóz (nem dob). */
export function piszkozatBetolt(szervezetId: string): Promise<PiszkozatValasz>;
/** A teljes piszkozat mentése (upsert: INSERT … ON CONFLICT (szervezet_id) DO UPDATE), `szervezetKent` alatt;
 *  a bemenet `OnboardingPiszkozat.safeParse`; visszaadja a mentett tartalmat és a frissitve időt. */
export function piszkozatMent(szervezetId: string, be: unknown): Promise<Eredmeny<PiszkozatValasz>>;
// Eredmeny<T> ugyanaz, mint a hitelesítő modulban: { ok: true; ertek: T } | { ok: false; hiba: HibaKod; mezok?: … }
```
2. `apps/web/app/api/onboarding/piszkozat/route.ts` — `GET` és `PUT`, `export const dynamic = "force-dynamic"`:
   - süti → `aktualisFiok`; nincs: 401 `{ hiba: "NINCS_BELEPVE" }`
   - nincs szervezete: 409 `{ hiba: "NINCS_JOG" }` (a felület a /szervezet/uj-ra visz)
   - GET → 200 `PiszkozatValasz`
   - PUT JSON-törzs → `piszkozatMent`; 200 `PiszkozatValasz`; hibás törzs 400 `ERVENYTELEN_ADAT` (mezok-kel)
   - minden válasz `cache-control: no-store`; váratlan hiba 500 `BELSO_HIBA` (console.error)
3. `apps/web/app/api/onboarding/osszefoglalo/route.ts` — `POST`, ugyanaz a belépés-ellenőrzés; törzs:
   `{ nev?: string; forras_tipus: "weboldal" | "leiras"; weboldal?: string; leiras?: string }` (zod).
   **E-6-ban ez TESZT-CSATLAKOZÓ**: nem hív AI-t. 700 ms várakozás után visszaad
   `{ osszefoglalo: string; forras: "teszt" }` — az összefoglaló egy 2–3 mondatos, MAGYAR minta-szöveg, amely
   a kapott névből és (weboldal esetén) a címből, (leírás esetén) a leírás első 160 karakteréből áll össze,
   ilyen mintával: „{nev} — a megadott forrás alapján: {részlet}. (Ez minta-javaslat; az AI-összefoglaló az E-7
   lépésben jön.)" Ha se weboldal, se leírás nincs: 400 `ERVENYTELEN_ADAT` `{ mezok: { forras: "ures" } }`.
   A modul felületét úgy írd, hogy az E-7-ben a teszt-csatlakozó helyére valódi AI-hívás kerülhessen:
   `apps/web/onboarding/osszefoglalo.ts` → `export async function osszefoglalot_keszit(be): Promise<{ osszefoglalo: string; forras: "teszt" | "ai" }>`,
   a route csak ezt hívja.

Szabályok: nincs `any`; a kiszolgáló csak kódot ad, kivéve a teszt-összefoglaló minta-szövegét (az szándékosan
magyar, E-7-ig); csak a 4 fájlt add vissza (`piszkozat.ts`, `osszefoglalo.ts`, két `route.ts`).
