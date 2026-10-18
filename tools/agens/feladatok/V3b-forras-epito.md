# Feladat — ÉPÍTŐ (V3b): forrás hírfolyam nélkül = hibás, „NINCS_HIRFOLYAM"

Folytatás (a V3 3. pontja; a V3 többi része már kész). Vilmos döntése: egy portál FŐOLDALÁT nem olvassuk. Ha a forrás nem ad hírfolyamot (RSS/Atom), és a címe gyökér (útvonal nélkül), a forrás `hibas`, ok: `nincs_hirfolyam`; a lap ezt mondja: „Ez az oldal nem ad hírfolyamot — a főoldalát nem olvassuk. Adj meg egy rovatot vagy egy másik oldalt."

TS 7 strict. CSAK RÉSZLET-fájlok (`### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI szó szerint a mellékletből, egyedi, 2–8 sor), legfeljebb 3 CSERE fájlonként. Plusz EGY teljes próbafájl. Nincs `any`.

## MÉRT tények
- `packages/news-monitor-core/src/forras.ts` (mellékelve): `ForrasTipus = "rss" | "weboldal"`; `forrasEllenorzesEredmeny` (105–116.) a `weboldal` típust `hasznalhato`/`korlatozott`-nak veszi. A kanonikus cím: `kanonikusCim` (a `/`-t a gyökér után megtartja).
- `apps/web/app/hirfigyelo/beallitas/Forrasok.tsx` (mellékelve): a `HIBA_FELIRAT` (27.) az `hiba_ok` → felirat-kulcs térkép; a `hibas` állapot `hf.srcProblem` + `hibaSzoveg`.
- A felirat kulcsa MÁR létezik a `0090_v3_kartyak.sql`-ben: `hf.forras_nincs_hirfolyam` — nem kell új migráció.

## Mit kell megírni
1. `_RESZLET-forras.md` → `packages/news-monitor-core/src/forras.ts`: a `forrasEllenorzesEredmeny`-ben, az `e.tipus === null` ág UTÁN: ha `e.tipus === "weboldal"` és a cím gyökér (`new URL(cim).pathname` üres vagy `/`, és nincs `search`) → `{ ...f, allapot: "hibas", ellenorzott: true, tipus: e.tipus, hiba_ok: "nincs_hirfolyam" }`. Segédfüggvény ugyanabban a fájlban: `export function gyokerCim(cim: string): boolean` (érvénytelen URL → false).
2. `_RESZLET-Forrasok.md` → `Forrasok.tsx`: a `HIBA_FELIRAT`-ba `nincs_hirfolyam: "hf.forras_nincs_hirfolyam"`.
3. TELJES: `packages/news-monitor-core/probak/forras-hirfolyam.proba.ts` (vitest, a mellékelt `forras.proba.ts` mintájára): gyökér + weboldal → `hibas`/`nincs_hirfolyam`; rovat-cím (`https://x.hu/gazdasag`) + weboldal → nem hibás; gyökér + rss → `hasznalhato`.

Más fájlhoz ne nyúlj.
