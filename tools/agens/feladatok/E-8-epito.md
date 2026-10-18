# Feladat — ÉPÍTŐ (E-8): AI-javaslatok a 2. lépéshez és a hangnem finomítása

TypeScript 7 strict, Next.js 16 app router. Mellékelve: a meglévő `apps/web/onboarding/osszefoglalo.ts` (MINTA:
ugyanezt a szerkezetet kövesd — szolgáltató-választás, keret-ellenőrzés, `meresRogzit`, prompt-betöltés, hibaosztály),
a szerződés (`JavaslatokValasz`, `HangnemFinomitasKeres/Valasz`, `OnboardingPiszkozat`), az ai-adapters felülete.

Írd meg:

## 1. `apps/web/onboarding/javaslatok.ts`
```ts
import "server-only";
export class JavaslatHiba extends Error { kod: "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "ERVENYTELEN_ADAT"; mezok?: Record<string,string> }
/** A tartalomnyelv: a piszkozat nyelvei közül az első hu/ro; ha nincs, a felület nyelve (hu/ro/en). */
export function tartalomnyelv(piszkozat: OnboardingPiszkozat, felulet: string): Tartalomnyelv;
/** Javaslatok a 2. lépéshez a piszkozat 1. lépése alapján (név, összefoglaló, célközönség-kérdés válasza, forrás). */
export async function javaslatokatKeszit(szervezetId: string, piszkozat: OnboardingPiszkozat, felulet: string): Promise<JavaslatokValasz>;
/** A hangnem finomítása: irány (kozvetlenebb | targyilagosabb | egyedi + megjegyzés). */
export async function hangnemetFinomit(szervezetId: string, be: HangnemFinomitasKeres, felulet: string): Promise<HangnemFinomitasValasz>;
```
- A prompt fájlok: `apps/web/prompts/javaslatok.hu.md` és `hangnem_finomitas.hu.md` (mellékelve) — a `{{nyelv}}` a felület
  nyelvének magyar neve (magyar/román/angol), a `{{tartalomnyelv}}` a tartalomnyelv magyar neve (hu→magyar, ro→román,
  en→angol, de→német, fr→francia, it→olasz, es→spanyol, sk→szlovák, sr→szerb, hr→horvát, uk→ukrán, pl→lengyel, cs→cseh,
  nl→holland, pt→portugál, sv→svéd, tr→török, ar→arab).
- A feladat szövege (`szoveg`) tényeket sorol: „A szervezet neve: …", „Tevékenység-összefoglaló: …", „A felhasználó
  szerint a célközönség: …" (ha van), „Forrás: weboldal <cím> | saját leírás". Ha nincs összefoglaló és nincs leírás →
  `JavaslatHiba("ERVENYTELEN_ADAT", { forras: "ures" })`.
- Hívás: `sz.hiv({ feladat: "javaslatok", rendszer, szoveg, nyelv: felulet, maxKiToken: 600, idokorlatMs: 30_000 })`.
- A válasz szövegéből a JSON-t ROBUSZTUSAN vedd ki: az első `{` és az utolsó `}` közti rész; ```json kerítés levágva;
  `JSON.parse` + `JavaslatokValasz.safeParse` (a `forras` és `tartalomnyelv` mezőt te teszed hozzá: forras = "teszt" | "ai"
  a szolgáltató szerint; tartalomnyelv = a kiszámolt). A `nyelvek` tömbből az érvénytelen kódokat dobd ki (ne bukjon).
  Ha nem elemezhető → `AiHiba("AI_ROSSZ_VALASZ")` → a hívónak `JavaslatHiba("AI_NEM_ELERHETO")`.
- Mérés: minden hívás (siker és hiba) `meresRogzit`-tel, mint az összefoglalónál — a függvényt NE másold, hanem exportáld
  az `osszefoglalo.ts`-ből (`export async function meresRogzit(...)`, `export async function keretEllenoriz()`,
  `export function szolgaltato()`, `export async function prompt(fajl: string, nyelv: string, tartalomnyelv?: string)`)
  — add vissza a módosított `osszefoglalo.ts`-t is (a `prompt` most fájlnevet is kap; a gyorsítótár fájlonként).

## 2. `apps/web/app/api/onboarding/javaslatok/route.ts` — POST, törzs nélkül
Belépés-ellenőrzés mint a többi route-ban (`aktualisFiok`, `aktualisSzervezet` → 401/409); a piszkozat betöltése
(`piszkozatBetolt`); a felület nyelve (`nyelvKeresbol` a sütiből/Accept-Language-ből, mint az összefoglaló route-ban);
→ `javaslatokatKeszit` → 200 `JavaslatokValasz`. Hibák: ERVENYTELEN_ADAT 400, AI_KERET_KIMERULT 429, AI_NEM_ELERHETO 503,
egyéb 500 BELSO_HIBA. `cache-control: no-store`.

## 3. `apps/web/app/api/onboarding/hangnem/route.ts` — POST, törzs: `HangnemFinomitasKeres`
Ugyanaz a belépés-ellenőrzés; zod safeParse → 400 mezok-kel; → `hangnemetFinomit` → 200 `HangnemFinomitasValasz`.

Csak ezt a 4 fájlt add vissza (javaslatok.ts, osszefoglalo.ts módosítva, 2 route). Nincs `any`.
