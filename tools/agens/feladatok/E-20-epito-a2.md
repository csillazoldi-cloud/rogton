# Feladat — ÉPÍTŐ A2 (E-20): a Hírfigyelő hiányzó API-útvonalai (a folytatás — az A kör a válasz hosszkorlátjába ütközött)

Mellékelve: a KÉSZ `_kozos.ts` (a `belepettSzervezet`, `hiba`, `valasz`, `eredmenyValasz`), a KÉSZ `hirfigyelo/index.ts` (`kornyezet`, `hostKontextus`),
egy KÉSZ útvonal mintának (`beallitas/route.ts`), és a mag `folyamat.ts` (a hívandó függvények és szignatúráik). Ezekhez NE nyúlj.

Készítsd el pontosan ugyanebben a stílusban (`export const dynamic = "force-dynamic"`, try/catch → 500 `BELSO_HIBA`, belépés → szervezet →
`hostKontextus` (null → 403) → `kornyezet` → a mag függvénye → `eredmenyValasz`; a `[id]` útvonalaknál `ctx: { params: Promise<{ id: string }> }`,
`const { id } = await ctx.params`; a törzs zod-dal ellenőrizve, hibás → 400 `ERVENYTELEN_ADAT`):
- `apps/web/app/api/hirfigyelo/forrasok/route.ts` — GET (a tár `forrasok`-ja → `{ hirfigyelo: { forrasok } }`), POST `{ cim }` → `forrasHozzaad(k, ktx, cim, "kezi")`
- `apps/web/app/api/hirfigyelo/forrasok/[id]/ellenoriz/route.ts` — POST → `forrasEllenoriz`
- `apps/web/app/api/hirfigyelo/futas/route.ts` — POST `{ proba?: boolean }` → `figyelesFuttat(k, ktx, { proba: !!proba })` (szinkron); GET → a tár `futasok`-ja
- `apps/web/app/api/hirfigyelo/ertekeles-ujra/route.ts` — POST → `ertekelesUjra`
- `apps/web/app/api/hirfigyelo/talalatok/[id]/megtekint/route.ts` — POST → `talalatMegtekint`
- `apps/web/app/api/hirfigyelo/talalatok/[id]/jelol/route.ts` — POST `{ jeloles: "nincs"|"mentett"|"elrejtett" }` → `talalatJelol`
- `apps/web/app/api/hirfigyelo/visszajelzes/route.ts` — POST `{ talalat_id, fajta, okok, sajat_indok? }` → `visszajelzesRogzit(k, ktx, { id: crypto.randomUUID(), …, letrehozva: new Date().toISOString() })`
- `apps/web/app/api/hirfigyelo/javaslat/route.ts` — POST → `javaslatKer`
- `apps/web/app/api/hirfigyelo/javaslat/[id]/kiprobal/route.ts` — POST → `javaslatKiprobal`
- `apps/web/app/api/hirfigyelo/javaslat/[id]/dont/route.ts` — POST `{ dontes: "elfogad"|"elvet" }` → `javaslatDont`
- `apps/web/app/api/hirfigyelo/osszkep/route.ts` — GET → `osszkep`
- `=== FÁJL: contracts-hibakod-reszlet.ts ===`: a `HibaKod` enum ÚJ sorai: `NINCS_BEALLITAS`, `FUT_MAR`, `NINCS_ILYEN_JAVASLAT`, `MINTA_LEJART`, `NINCS_ILYEN_FORRAS` (csak ezek a sorok, magyar megjegyzéssel).

Ha a mag függvényének a visszatérése nem `{ ok, … }`-alakú, nézd meg a `folyamat.ts`-ben. TypeScript 7 + exactOptionalPropertyTypes. Add vissza minden fájlt külön blokkban.
