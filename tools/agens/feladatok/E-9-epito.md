# Feladat — ÉPÍTŐ (E-9): arculat-javaslat és a profil jóváhagyása (R-06)

TypeScript 7 strict, Next.js 16 app router, Drizzle 0.45. Mellékelve: `apps/web/onboarding/javaslatok.ts` (MINTA:
ugyanígy hívj AI-t: `keretEllenoriz`, `szolgaltato`, `prompt`, `meresRogzit`, `jsonRobusztusan`, `JavaslatHiba`),
`apps/web/onboarding/piszkozat.ts` (MINTA: `szervezetKent`, `Eredmeny<T>`, séma-ellenőrzés), a szerződés részlete
(`ArculatTervezet`, `ArculatLepes`, `ArculatJavaslatValasz`, `SzervezetProfil`, `JovahagyasValasz`, `ProfilValasz`,
`OnboardingPiszkozat`), az adatbázis-séma részlete (`szervezetProfil`, `onboardingPiszkozat`), egy meglévő route
(`apps/web/app/api/onboarding/javaslatok/route.ts` — MINTA a route-okhoz, PONTOSAN ezeket az importokat használd,
ne találj ki modult).

Írd meg (négy fájl, mind `=== FÁJL: <út> ===` blokkban):

## 1. `apps/web/onboarding/arculat.ts`
```ts
import "server-only";
/** Arculati tervezet javaslata az 1. lépés forrásaiból (v6 seedStep2 → brand draft). Javaslat, nem szabály. */
export async function arculatotJavasol(szervezetId: string, piszkozat: OnboardingPiszkozat, felulet: string): Promise<ArculatJavaslatValasz>;
```
- Importáld a `javaslatok.ts`-ből: `JavaslatHiba`, `tartalomnyelv`, és exportáld ott a `jsonRobusztusan`-t (add vissza a
  módosított `javaslatok.ts`-t is — csak az `export` kulcsszó kerül elé, más nem változik).
- Ha nincs `bemutatkozas.osszefoglalo` és nincs `bemutatkozas.leiras` → `JavaslatHiba("ERVENYTELEN_ADAT", { forras: "ures" })`.
- `szoveg`: „A szervezet neve: …", „Tevékenység-összefoglaló: …" (összefoglaló, vagy ha nincs, leírás), „Megjelölt
  arculati források: logó / arculati kézikönyv / vizuális referenciák / a weboldal is" (amelyik igaz a
  `bemutatkozas.arculat_forrasok`-ból; ha egyik sem: „nincs megadott arculati forrás").
- Hívás: `sz.hiv({ feladat: "arculat_javaslat", rendszer: await prompt("arculat", felulet, tnyelv), szoveg, nyelv: felulet, maxKiToken: 500, idokorlatMs: 30_000 })`.
- A válasz JSON kulcsai: `elsodleges, masodlagos, hatter` (#rrggbb), `betu_iranymutatas, kepvilag, kovetendo, kerulendo`
  (szöveg), `lekerekites` (0–24 egész). Ellenőrzés: `ArculatTervezet.safeParse({ ...elemzett, betu_cim: "", betu_szoveg: "",
  nyelv: tnyelv, eredet, modositva: false })` — `eredet` = "forras", ha bármelyik arculati forrás meg van jelölve (a
  weboldal csak akkor számít, ha `forras_tipus === "weboldal"` és van `weboldal`), különben "ai". Ha nem elemezhető →
  `AiHiba("AI_ROSSZ_VALASZ")` → `JavaslatHiba("AI_NEM_ELERHETO")`. Mérés sikerre és hibára is, mint a mintában.
- Visszatérés: `{ tervezet, forras: sz.leirolap.azonosito === "teszt" ? "teszt" : "ai" }`.

## 2. `apps/web/onboarding/jovahagyas.ts`
```ts
import "server-only";
/** A profil jóváhagyása (R-06): a piszkozat → szervezet_profil, a piszkozat törlődik. Egy tranzakcióban, szervezetKent alatt. */
export async function profiltJovahagy(szervezetId: string, fiokId: string): Promise<Eredmeny<SzervezetProfil>>;
/** A szervezet jóváhagyott profilja, vagy null. */
export async function profilBetolt(szervezetId: string): Promise<SzervezetProfil | null>;
```
- `profiltJovahagy`: `szervezetKent(szervezetId, async (tx) => …)` — betölti a piszkozat sorát (`sema.onboardingPiszkozat`,
  `OnboardingPiszkozat.safeParse`); ha nincs sor → `{ ok: false, hiba: "NINCS_PISZKOZAT" }`. Ha `bemutatkozas.nev` vagy
  `bemutatkozas.osszefoglalo` üres (trim) → `{ ok: false, hiba: "HIANYOS_PROFIL", mezok: { nev?: "ures", osszefoglalo?: "ures" } }`.
  Egyébként összeállítja a `SzervezetProfil`-t:
  - `nev, osszefoglalo, osszefoglalo_forras` a bemutatkozásból (`osszefoglalo_forras` "" esetén "sajat");
  - `celkozonseg` = a kommunikáció értéke, de ÜRES, ha `celkozonseg_kesobb`; ugyanígy `cel`; `hangnem_leiras/minta/nyelv`
    üres, ha `hangnem_kesobb`; a `*_forras` mezők a kommunikációból (üresre "" marad);
  - `nyelvek, nyelvek_forras`; `arculat` = a piszkozat `arculat` ága változatlanul;
  - `kesobbre`: azok a kulcsok, amelyek üresek vagy későbbre hagyottak: "celkozonseg" (ha üres/kesobb), "cel", "nyelvek"
    (ha üres a tömb), "hangnem" (ha üres a leírás/kesobb), "arculat" (ha `arculat.allapot !== "jovahagyott"`);
  - `jovahagyva` = most ISO, `jovahagyta` = fiokId.
  `SzervezetProfil.safeParse` → ha nem megy át: `{ ok: false, hiba: "ERVENYTELEN_ADAT", mezok }` (mint a piszkozatMent-ben).
  Beszúrás `sema.szervezetProfil`-ba `onConflictDoUpdate` (target szervezetId; set adatok, jovahagyva, jovahagyta,
  frissitve), majd `tx.delete(sema.onboardingPiszkozat).where(eq(sema.onboardingPiszkozat.szervezetId, szervezetId))`.
  Visszatérés `{ ok: true, ertek: profil }`.
- `profilBetolt`: `szervezetKent` alatt select; `SzervezetProfil.safeParse(sor.adatok)`; hibás tartalomnál `console.error` és null.

## 3. `apps/web/app/api/onboarding/arculat/route.ts` — POST, törzs nélkül
Pontosan a mellékelt javaslatok-route mintájára (ugyanazok az importok), csak `arculatotJavasol`-t hív → 200
`ArculatJavaslatValasz`; hibák: ERVENYTELEN_ADAT 400, AI_KERET_KIMERULT 429, AI_NEM_ELERHETO 503, egyéb 500.

## 4. `apps/web/app/api/onboarding/jovahagyas/route.ts` — POST, törzs nélkül
Belépés-ellenőrzés mint a mintában (401/409); `profiltJovahagy(szervezet.id, fiok.id)` → 200 `{ profil }`;
`NINCS_PISZKOZAT` 409, `HIANYOS_PROFIL` 400 (a `mezok`-kal), `ERVENYTELEN_ADAT` 400, egyéb 500.
A `fiok` (`FiokNezet`) mezője: `fiok.id`.

## 5. `apps/web/app/api/profil/route.ts` — GET
Belépés-ellenőrzés (401/409); `profilBetolt(szervezet.id)` → 200 `{ profil }` (null is lehet). `cache-control: no-store`.

Szabályok: nincs új csomag; nincs `any`; a hibák a mintában látható `hiba()` segéddel mennek; a `dynamic = "force-dynamic"`
exportot minden route-ban add meg. Ne írj próbát, azt a tesztelő írja.
