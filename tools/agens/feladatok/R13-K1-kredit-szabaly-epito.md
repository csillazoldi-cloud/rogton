# Feladat — ÉPÍTŐ (R13-K1): a kreditrendszer tiszta szabályai + próbái

Vilmos döntései (2026-09-22): pénz helyett **kredit**. Minden mai AI-művelet **1 kredit**. A munkatér havonta kap
kreditet (`munkater_havi`), a tulajdonos osztja szét a tagok között. Aki nem kapott **külön összeget**, az a ki nem
osztott rész **egyenlő részét** kapja. Ha egy tagé elfogy, **csak neki** áll le az AI-munka. Ha a gép egy hírt
több tagnak olvas el, az 1 kredit **megoszlik** közöttük (tört kredit — ezredre pontosan tároljuk, egy tizedesre
mutatjuk).

Ez a feladat CSAK a tiszta szabályokat kéri (nincs adatbázis, nincs hálózat, nincs React): egy TypeScript modul és a
vitest-próbái. TypeScript strict, nincs `any`. Magyar azonosítók (ékezet nélkül) és magyar megjegyzések.
`=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===`, TELJES fájlok.

## Fájlok

1. `apps/web/kredit/szabaly.ts`
2. `apps/web/probak/kredit-szabaly.proba.ts` (vitest: `import { describe, it, expect } from "vitest";`,
   a modult `../kredit/szabaly`-ból importálja; adatbázis és hálózat nélkül fut)

## A modul exportjai — pontosan ezek

```ts
/** Az egység: ezred kredit. Minden összeg belül EGÉSZ ezred (lebegőpontos hiba nélkül). */
export const EZRED = 1000;

/** Egy mai AI-művelet ára krediten (Vilmos: minden mai művelet 1 kredit). */
export const MUVELET_AR = 1;

/** A munkatér alap havi kreditje, ha a rendszergazda nem adott meg mást (teszt: ≈ a régi 5 USD-s keret). */
export const ALAP_MUNKATER_HAVI = 1000;

/** Kreditből ezred (kerekítve a legközelebbi egészre). */
export function ezredbe(kredit: number): number;
/** Ezredből kredit. */
export function kreditbe(ezred: number): number;

/** A hónap kulcsa ("YYYY-MM") a megadott időzónában (alap: "Europe/Bucharest"), `Intl.DateTimeFormat`-tal. */
export function honapKulcs(d: Date, idozona?: string): string;

export type TagKeret = { fiok_id: string; kulon: number | null }; // kulon: a tulajdonos által megadott havi kredit, null = egyenlő rész

/**
 * A tagok havi kerete EZREDBEN.
 * - A külön megadott összegek (kulon !== null, negatív → 0) úgy maradnak, ahogy vannak — akkor is, ha az összegük
 *   több, mint a munkatér havi kreditje (a tulajdonos döntése; a munkatér összkerete a felső határ máshol fog).
 * - A maradék = max(0, munkaterHavi − a külön megadottak összege); ezt a kulon === null tagok EGYENLŐEN kapják,
 *   ezredre lefelé kerekítve; a kerekítésből megmaradó ezredek a lista ELEJÉN álló egyenlő-részes tagokhoz kerülnek
 *   egyesével (így az egyenlő részek összege pontosan a maradék).
 * - Üres tagokra üres Map.
 */
export function haviKeretek(munkaterHavi: number, tagok: TagKeret[]): Map<string, number>;

/**
 * Egy költség (kreditben) szétosztása a fiókok között EZREDBEN: egyenlően, lefelé kerekítve, a maradék ezredek a
 * lista elején állókhoz egyesével. Az eredmény összege PONTOSAN ezredbe(osszeg). Ismétlődő fiók_id egyszer számít.
 * Üres listára üres Map.
 */
export function megoszt(osszeg: number, fiokok: string[]): Map<string, number>;

export type Egyenleg = { keret: number; felhasznalt: number }; // mindkettő EZREDBEN

/** Maradt ezred (lehet 0, soha nem negatív). */
export function maradt(e: Egyenleg): number;

/**
 * Indítható-e egy művelet ennek a tagnak: a tagnak maradt > 0 ÉS a munkatér egészének maradt > 0.
 * (Egy tört kredit is elég az indításhoz — a művelet után lehet kicsit negatív; ezt a `maradt` 0-nak mutatja.)
 */
export function indithato(tag: Egyenleg, munkater: Egyenleg): boolean;

/** Kijelzés egy tizedesre, a nyelv szerinti tizedesjellel ("hu" → "312,5", "ro" → "312,5", "en" → "312.5");
 *  egész számnál tizedes nélkül ("312"). Bemenet: ezred. */
export function kijelzes(ezred: number, nyelv: "hu" | "ro" | "en"): string;
```

## Próbák (legalább ezek)
- `ezredbe(1)` = 1000, `ezredbe(0.3333)` = 333, `kreditbe(1500)` = 1.5.
- `honapKulcs(new Date("2026-09-30T22:30:00Z"))` = "2026-10" (Bukarestben már október), `honapKulcs(new Date("2026-09-30T20:00:00Z"))` = "2026-09".
- `haviKeretek(1000, [a null, b null, c null])` → 333334 / 333333 / 333333 (ezredben), összeg 1 000 000.
- `haviKeretek(1000, [a 400, b null, c null])` → a 400000, b 300000, c 300000.
- `haviKeretek(1000, [a 1200, b null])` → a 1200000, b 0.
- `haviKeretek(500, [])` → üres.
- `megoszt(1, ["a","b","c"])` → 334 / 333 / 333, összeg 1000; `megoszt(1, ["a"])` → 1000; `megoszt(1, ["a","a","b"])` → a 500, b 500; `megoszt(1, [])` → üres.
- `maradt({keret: 1000, felhasznalt: 1500})` = 0.
- `indithato({1000, 999}, {5000, 100})` = true; `indithato({1000, 1000}, {5000, 100})` = false; `indithato({1000, 0}, {5000, 5000})` = false.
- `kijelzes(312500, "hu")` = "312,5"; `kijelzes(312000, "en")` = "312"; `kijelzes(333, "hu")` = "0,3"; `kijelzes(0, "hu")` = "0".

A blokkokon kívül legfeljebb 10 sor magyarázat.
