# Feladat — ÉPÍTŐ (V5b): a reggeli csomag a hírfigyelő AI-jával, egy újrapróba, fájl-kimenet bekötése, próbák

Folytatás: a V5 1–2. pontja és az `apps/web/visszajelzes/export.ts` MÁR KÉSZ (mellékelve). Most CSAK ez a négy dolog. CSAK RÉSZLET-fájlok (`### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI szó szerint a mellékletből, egyedi, 2–8 sor), legfeljebb 5 CSERE fájlonként; plusz KÉT teljes próbafájl. TS 7 strict, nincs `any`.

## MÉRT tények
- `apps/web/visszajelzes/index.ts` (mellékelve): 211. `const sz = szolgaltato();` — az általános AI. A hírfigyelőé: `hirfigyeloSzolgaltato()` az `apps/web/hirfigyelo/ai.ts`-ből (mellékelve; innen: `import { hirfigyeloSzolgaltato } from "../hirfigyelo/ai"`). A `bekuld` (24.), `allapotValt` (125.), `napiCsomagKeszit` (199.) végén kell a fájl-kimenet.
- `apps/web/visszajelzes/export.ts` (mellékelve): `listaFajlbaIr(vjk)`, `csomagFajlbaIr(csomag)`; a teljes listát a `lista({})` adja.
- `apps/web/hirfigyelo/futtato.ts` (mellékelve) 103–128.: a csomag 05:00-kor; hiba esetén `console.error`, újrapróba nincs.
- A visszajelzés-react csomagban (`packages/visszajelzes-react/src/index.tsx`, mellékelve az ÚJ változat) `export function poziciotBefog(poz, meret, ablak)` — 58. sor. A csomagnak még nincs `probak/` mappája; a vitest a `probak/*.proba.ts`-t futtatja (mint a `packages/news-monitor-core`).

## Mit kell megírni
1. `_RESZLET-index.md` → `apps/web/visszajelzes/index.ts`: import `hirfigyeloSzolgaltato` + `listaFajlbaIr, csomagFajlbaIr` az `./export`-ból; a 211. sor `hirfigyeloSzolgaltato()`; a `bekuld` és az `allapotValt` sikeres ága végén `void listaFajlbaIr(await lista({})).catch((h) => console.warn("[visszajelzes] lista fajl:", h));`; a `napiCsomagKeszit` sikeres ága végén ugyanígy `csomagFajlbaIr(csomag)` + a lista. A fő művelet nem bukhat el a fájl miatt.
2. `_RESZLET-futtato.md` → `apps/web/hirfigyelo/futtato.ts`: a csomag hibája (`!c.ok` vagy kivétel) egy sorral `console.warn("[visszajelzes] napi csomag:", …)`, és egy `csomagUjraProba: number | null` időbélyeg (ms) áll be `Date.now() + 10*60_000`-re; a tick-ben, ha `csomagUjraProba !== null && Date.now() >= csomagUjraProba`, EGYSZER újra hívja `napiCsomagKeszit`-et ugyanarra a napra, és `csomagUjraProba = null` (sikertől függetlenül).
3. TELJES: `packages/visszajelzes-react/probak/pozicio.proba.ts` (vitest): `poziciotBefog` — jobb szélen → x ≤ ablak.w − w − 12 (balra kerül); alsó szélen → y ≤ ablak.h − h − 12; közép → változatlan.
4. TELJES: `apps/web/probak/visszajelzes-export.proba.ts` (élő, a mellékelt `csomag.proba.ts` és `segedek.ts` mintájára): beküldés után `${FAJL_MAPPA ?? "./adatok/fajlok"}/visszajelzes/lista.json` létezik és tartalmazza a beküldött szöveget.

Más fájlhoz ne nyúlj.
