# Feladat — ÉPÍTŐ (E-13): a téma API-pontjai (szervezeti szint és közös alap)

TypeScript 7 strict, Next.js 16 app router. Mellékelve: `apps/web/tema/index.ts` (a MŰVELETEK — ezeket hívod, PONTOSAN
ezekkel a nevekkel; nem írsz újat), `apps/web/app/api/profil/route.ts` (MINTA: belépés-ellenőrzés, `hiba()` segéd,
`cache-control: no-store`, `export const dynamic = "force-dynamic"`), a szerződés részlete (`FiokNezet` — benne
`rendszergazda: boolean` és `szervezetek[].szerep`).

Írd meg a következő fájlokat (mind `=== FÁJL: <út> ===` blokkban), mindegyik a minta importjaival
(`aktualisFiok`, `aktualisSzervezet` a `../../../hitelesites`-ből — a mélységet a fájl helyéhez igazítsd;
`munkamenetTokenKeresbol` a `hitelesites/suti`-ból; a műveletek a `tema`-ból):

## Közös segéd: `apps/web/app/api/tema/_kozos.ts`
```ts
import type { HibaValasz } from "@km/contracts";
import type { FiokNezet } from "@km/contracts";
export function hiba(h: HibaValasz, status: number): Response;              // mint a mintában
export function valasz(torzs: unknown, status = 200): Response;             // Response.json(torzs, { status, headers: { "cache-control": "no-store" } })
/** A belépett ember és az aktuális szervezete; hibánál a kész Response. */
export async function belepettSzervezet(keres: Request): Promise<{ fiok: FiokNezet; szervezet: { id: string; nev: string } } | Response>;
  // nincs belépés → hiba(NINCS_BELEPVE, 401); nincs szervezet → hiba(NINCS_JOG, 409)
/** Csak a szervezet TULAJDONOSA módosíthatja a szervezet témáját (D-09). */
export function tulajdonos(fiok: FiokNezet, szervezetId: string): boolean;  // fiok.szervezetek.find(sz => sz.id === szervezetId)?.szerep === "tulajdonos"
/** Csak a rendszergazda állítja a közös alapot. */
export async function rendszergazda(keres: Request): Promise<FiokNezet | Response>;
  // nincs belépés → 401; !fiok.rendszergazda → hiba(NINCS_JOG, 403)
/** Egy TemaEredmeny → Response: ok → valasz({ tema: ertek }); hibák: ERVENYTELEN_ADAT → 400 a { hiba, tema_hibak, figyelmen_kivul } törzzsel;
    NINCS_TERVEZET → 409; NINCS_ILYEN_VERZIO → 404; NINCS_JOG → 403; egyéb → 500. */
export function eredmenyValasz<T>(e: TemaEredmeny<T>): Response;
```
(`TemaEredmeny` a `../../../tema` index-ből importálható típus.)

## Szervezeti szint (a tulajdonos)
1. `apps/web/app/api/tema/route.ts`
   - `GET`: belepettSzervezet → `valasz({ tema: await szervezetTemaAllapot(szervezet.id) })` (minden tag olvashatja).
   - `PUT`: belepettSzervezet; ha nem tulajdonos → 403 NINCS_JOG; `const be = await keres.json().catch(() => null)`;
     `eredmenyValasz(await szervezetTervezetMent(szervezet.id, be))`.
   - `DELETE`: tulajdonos; `eredmenyValasz(await szervezetTervezetElvet(szervezet.id))`.
2. `apps/web/app/api/tema/alkalmaz/route.ts` — `POST`: tulajdonos; `eredmenyValasz(await szervezetAlkalmaz(szervezet.id))`.
3. `apps/web/app/api/tema/visszaallit/route.ts` — `POST`: tulajdonos; törzs `{ verzio }`; `eredmenyValasz(await szervezetVisszaallit(szervezet.id, be))`.

## Közös alap (a rendszergazda)
4. `apps/web/app/api/tema/kozos/route.ts` — `GET`: rendszergazda → `valasz({ tema: await kozosAllapot() })`; `PUT`: rendszergazda →
   `eredmenyValasz(await kozosTervezetMent(be))`; `DELETE`: rendszergazda → `eredmenyValasz(await kozosTervezetElvet())`.
5. `apps/web/app/api/tema/kozos/alkalmaz/route.ts` — `POST`: rendszergazda → `eredmenyValasz(await kozosAlkalmaz())`.
6. `apps/web/app/api/tema/kozos/visszaallit/route.ts` — `POST`: rendszergazda → `eredmenyValasz(await kozosVisszaallit(be))`.

Minden pont `try/catch`-ben: kivételnél `console.error("Tema <pont> hiba:", h)` és 500 BELSO_HIBA (mint a mintában).
Szabályok: nincs új csomag; nincs `any`; nincs új felület; nem írsz próbát (azt a tesztelő írja). Add vissza a 7 fájlt.
