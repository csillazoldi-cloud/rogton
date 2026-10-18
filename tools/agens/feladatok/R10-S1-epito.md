# Feladat — ÉPÍTŐ (R10-S1): három séma adatként + a váltás gépezete

Vilmos döntése (2026-09-18): a felületnek három, egy kattintással váltható színsémája lesz — **Éjkék** (a mostani), **Világos**, **Sötét**. A séma = tokenkészlet, amit a meglévő téma-tár új verzióként alkalmaz. Kód a felületben nem változik, csak tokenértékek.

TypeScript 7 strict, zod 4.5, vitest, Drizzle. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`. Magyar azonosítók és megjegyzések. TELJES fájl, ahol ezt írom; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE` blokkok; a RÉGI SZÓ SZERINT a mellékletből és egyedi) a nagy fájlokhoz.

## MÉRT tények (2026-09-18, a repóból)
- Az alaptéma: `packages/design-system/src/tema-alap.json` (`tokens` kulcs alatt; a kulcsnevek a mellékletben). `AlapTokenek` zod-séma: `tokenek.ts`; `TemaFelulirasok = AlapTokenek.partial()` (`tema-szintek.ts`); `egyesit(alap, felulirasok)`; `szarmaztat(t)` (`index.ts`) számolja a származtatott tokeneket — köztük `--glow-primary`, `--glow-primary-strong`, `--glow-warm`, `--aurora-1/2/3`, `--orb-size-sm`.
- A tár: `apps/web/tema/tar.ts` — `szervezetTervezetMent(szervezetId, felulirasok) → verzió`, `szervezetAlkalmaz(szervezetId)`, `szervezetTemaAllapot(szervezetId)`; közös szint: `kozosTervezetMent(tokenek)`, `kozosAlkalmaz()`, `kozosAllapot()`; `temaGyorsitotarUrit()`.
- A kapu: `apps/web/tema/index.ts` (zod-ellenőrzés + `TemaEredmeny`), végpontok `apps/web/app/api/tema/route.ts` (PUT = tervezet mentése, tulajdonos), `alkalmaz/route.ts`, `kozos/route.ts` (rendszergazda), `_kozos.ts` (kapu, `tulajdonos()`, `rendszergazda()`).
- Táblák (`apps/web/adatbazis/sema.ts`): `tema(id, nev, verzio, definicio jsonb, aktiv, letrehozva)`, `szervezet_tema(szervezet_id, verzio, felulirasok jsonb, allapot, letrehozva, alkalmazva)`.
- Migrációk: `apps/web/adatbazis/migraciok/`, az utolsó `0087_jelszo_link_gomb.sql`; a feliratok `INSERT INTO "felirat" ("kulcs","nyelv","szoveg")` sorokkal mennek (minta mellékelve).

## A három séma értékei (CSAK ezek a kulcsok; a többi token nem változik)

| kulcs | Éjkék | Világos | Sötét |
|---|---|---|---|
| `--bg` | a tema-alap.json értéke | `#F7F7F5` | `#15161C` |
| `--bg-elev` | a tema-alap.json értéke | `#FFFFFF` | `#1D1F27` |
| `--text` | … | `#1C1C1A` | `#ECEDF1` |
| `--text-mut` | … | `#63635C` | `#A2A5B3` |
| `--text-dim` | … | `#75756E` | `#8E91A0` |
| `--text-faint` | … | `#8A8A82` | `#7C8090` |
| `--on-primary` | … | `#FFFFFF` | `#FFFFFF` |
| `--primary` | … | `#4A63E7` | `#5563E8` |
| `--primary-2` | … | `#4A63E7` | `#5563E8` |
| `--accent` | … | `#C2410C` | `#FF8A65` |
| `--accent-text` | … | `#9A3412` | `#FFB39F` |
| `--accent-link` | … | `#3B52D1` | `#9DA8FF` |
| `--ok` | … | `#1F7A4D` | `#7FE0A0` |
| `--err` | … | `#B42318` | `#FFB3A3` |
| `--focus` | … | `#4A63E7` | `#8A98FF` |
| `--shadow-color` | … | `#000000` | `#000000` |
| `--shadow-strength` | … | `8` | `35` |
| `--font-display` | … | `'Manrope',sans-serif` | `'Manrope',sans-serif` |
| `--accent-warm` | … | `#C2410C` | `#FF8A65` |
| `--accent-gold` | … | `#B7791F` | `#FFB86B` |
| `--aurora-opacity` | … | `0` | `0` |
| `--orb-size` | … | `0px` | `0px` |
| `--glass-alpha` | … | `4` | `8` |
| `--r-card` | … | `14px` | `14px` |
| `--r-btn` | … | `10px` | `10px` |

Az **Éjkék** értékeit NEM kézzel írod be: a `tema-alap.json`-ból olvasod ki futásidőben ugyanezekre a kulcsokra (így a mostani téma mindig visszaállítható).

## Mit kell megírni

### 1. TELJES: `packages/design-system/src/semak.ts`
```ts
import type { TemaFelulirasok } from "./tema-szintek";
import alap from "./tema-alap.json";
export type SemaKod = "ejkek" | "vilagos" | "sotet";
export type Sema = { kod: SemaKod; nev: Record<"hu" | "ro" | "en", string>; leiras: Record<"hu" | "ro" | "en", string>; tokenek: TemaFelulirasok };
export const SEMA_KULCSOK = [ …a táblázat kulcsai… ] as const;
export const SEMAK: readonly Sema[] = [ …Éjkék (a kulcsok értéke `alap.tokens[k]`), Világos, Sötét… ];
export function semaKeres(kod: string): Sema | null;
```
Nevek: hu „Éjkék / Világos / Sötét", ro „Albastru de noapte / Luminos / Întunecat", en „Night blue / Light / Dark". Leírások (hu): „A mostani: sötét, indigó kiemelés, fényudvarral." · „Törtfehér alap, kék gombok, nyugodt." · „Meleg sötétszürke, kék-lila csak a gombon." — ro/en fordítással.
A `SEMA_KULCSOK` és minden token átmegy a `TemaFelulirasok` sémán (a modul betöltésekor `TemaFelulirasok.parse`, hogy elgépelt kulcs ne kerülhessen ki).

### 2. RÉSZLET: `_RESZLET-design-index.md` → `packages/design-system/src/index.ts`
- CSERE 1: az exportok közé `export * from "./semak";`.
- CSERE 2: a `szarmaztat`-ban a három `--glow-*` érték: ha `parseInt(t["--aurora-opacity"] || "50", 10) === 0`, akkor `"none"` (mindhárom), különben a mai képlet. Megjegyzés: `// R-10: effekt nélküli sémánál nincs ragyogás`.

### 3. RÉSZLET: `_RESZLET-sema-ts.md` → `apps/web/adatbazis/sema.ts`
`tema` és `szervezet_tema` táblán új oszlop: `sema_kod: text("sema_kod")` (nullable).

### 4. TELJES: `apps/web/adatbazis/migraciok/0088_semak.sql`
- `ALTER TABLE "tema" ADD COLUMN "sema_kod" text;` és ugyanez a `"szervezet_tema"`-n.
- Feliratok (hu/ro/en), kulcsok: `tema.sema.cim` („Séma"), `tema.sema.magyarazat` („Egy kattintás, és az egész munkatér átvált. A korábbi séma a verziók között marad, bármikor visszaállítható."), `tema.sema.aktiv` („Ezt használjátok"), `tema.sema.valt` („Erre váltok"), `tema.sema.valtas_folyamatban` („Átváltás…"), `tema.sema.valtva` („Átváltva: {nev}"), `tema.sema.hiba` („Nem sikerült átváltani. Próbáld újra.").

### 5. RÉSZLET: `_RESZLET-tar.md` → `apps/web/tema/tar.ts`
- `szervezetTervezetMent(szervezetId, felulirasok, semaKod?: string | null)`: a beszúrásnál `sema_kod: semaKod ?? null`.
- `kozosTervezetMent(tokenek, semaKod?: string | null)`: ugyanígy.
- `szervezetTemaAllapot` és `kozosAllapot` válaszában új mező: `sema_kod: string | null` (az ALKALMAZOTT verzióé). A `SzervezetTemaAllapot` / `KozosTemaAllapot` zod-sémát (`tema-szintek.ts`) bővítsd `sema_kod: z.string().nullable().default(null)`-lal — RÉSZLET-ként ugyanebbe a fájlba.

### 6. RÉSZLET: `_RESZLET-tema-index.md` → `apps/web/tema/index.ts`
Két új függvény:
- `szervezetSemaValt(szervezetId, be: unknown)`: `be` = `{ kod }` zod-dal; `semaKeres(kod)` — ismeretlen kód → `{ ok: false, hiba: "ISMERETLEN_SEMA" }`; `szervezetTervezetMent(id, sema.tokenek, kod)` → `szervezetAlkalmaz(id)` → `temaGyorsitotarUrit()` → a friss `szervezetTemaAllapot`.
- `kozosSemaValt(be)`: a közös alapra ugyanez: `egyesit(kozosAlkalmazott(), sema.tokenek)` → `kozosTervezetMent(…, kod)` → `kozosAlkalmaz()` → ürítés → `kozosAllapot()`.

### 7. TELJES: `apps/web/app/api/tema/sema/route.ts` és `apps/web/app/api/tema/kozos/sema/route.ts`
- `PUT` a meglévő minta szerint (`kapu(keres, "tulajdonos")` + `tulajdonos()` ellenőrzés → 403 `NINCS_JOG`; a közösnél `rendszergazda()`), a törzs `{ kod }`, válasz `eredmenyValasz(...)`.

### 8. TELJES: `packages/design-system/src/semak.proba.ts` (vitest)
- mindhárom séma átmegy a `TemaFelulirasok`-on; az Éjkék minden kulcsa egyenlő a `tema-alap.json` értékével; a Világos `--aurora-opacity` „0"; `szarmaztat(egyesit(alap, vilagos))["--glow-primary"] === "none"`, az Éjkéknél nem.

Más fájlhoz ne nyúlj. A felület (TemaEgyszeru) egy másik ügynök feladata.
