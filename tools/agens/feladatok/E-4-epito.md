# Feladat — ÉPÍTŐ (E-4): a nyelvkezelés és a feliratok gépezete

Next.js 16 (app router), React 19, TypeScript 7 strict (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
`verbatimModuleSyntax`), Drizzle + pg, zod 4. Az `apps/web` fájljai relatív úttal importálják egymást; más csomag
csak a nevén (`@km/contracts`, `@km/design-system`). Mellékelve: a séma (`felirat`, `tema` tábla), a kapcsolat-réteg
(`db()`), a design-system csomag felülete (`NYELVEK`, `Nyelv`, `ALAP_NYELV`, `NYELV_SUTI`, `TemaDefinicio`, `cssValtozok`).

Írd meg:

1. `apps/web/nyelv/index.ts` — kiszolgálóoldali segédek:
```ts
import "server-only";
export function nyelvKeresbol(cookieErtek: string | undefined, acceptLanguage: string | null): Nyelv;
// 1. a süti (ha érvényes NYELVEK-beli), 2. az Accept-Language első egyezése (hu/ro/en), 3. ALAP_NYELV
export async function feliratok(nyelv: Nyelv): Promise<Record<string, string>>;
// az adott nyelv MINDEN felirata a `felirat` táblából, egy Map-ből kiszolgálva; ha egy kulcs az adott nyelven
// hiányzik, a magyar (ALAP_NYELV) értéke jön helyette. Gyorsítótár: folyamaton belül, 60 másodpercig
// (module-szintű Map + időbélyeg), hogy ne legyen minden kérésre lekérdezés.
export function felirat(f: Record<string, string>, kulcs: string, ertekek?: Record<string, string | number>): string;
// f[kulcs] a {nev} alakú helyőrzők behelyettesítésével; ha nincs ilyen kulcs: maga a kulcs jön vissza
// (így a hiány látszik a képernyőn, de nem dob hibát)
export async function aktivTema(): Promise<TemaDefinicio>;
// a `tema` tábla aktív sora (aktiv = true), `TemaDefinicio.parse`-szal ellenőrizve; ugyanolyan 60 mp-es
// gyorsítótárral. Ha nincs aktív sor vagy hibás: a `@km/design-system/tema-alap.json` az alapérték
// (import temaAlap from "@km/design-system/tema-alap.json" — resolveJsonModule engedélyezve), és
// console.error-ral naplózva, hogy tartalék megy.
```
2. `apps/web/app/api/nyelv/route.ts` — `POST { nyelv }` (zod: `Nyelv`): beállítja a `NYELV_SUTI` sütit
   (Path=/, SameSite=Lax, 1 év, NEM httpOnly — a kliens is olvashatja; `Secure` csak production-ben),
   válasz 204. Hibás érték: 400 `{ hiba: "ERVENYTELEN_ADAT" }`. `export const dynamic = "force-dynamic"`.
3. `apps/web/nyelv/kliens.tsx` — `"use client"` segéd:
```ts
export function FeliratokSzolgaltato({ f, nyelv, children }: { f: Record<string,string>; nyelv: Nyelv; children: ReactNode }): JSX.Element;
export function useFeliratok(): { f: Record<string,string>; nyelv: Nyelv; t: (kulcs: string, ertekek?: Record<string,string|number>) => string };
```
   (React context; a `t` ugyanazt a behelyettesítést végzi, mint a kiszolgálói `felirat`).

Szabályok: nincs `any`; nincs emberi nyelvű szöveg a kódban (a kiszolgáló csak kulcsot/kódot ad); a `felirat`
tábla lekérdezése `db().select().from(sema.felirat).where(eq(sema.felirat.nyelv, nyelv))` stílusban; csak a
felsorolt 3 fájlt add vissza.
