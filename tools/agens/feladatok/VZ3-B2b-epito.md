# Feladat — ÉPÍTŐ (VZ3-B2b): szabályellenőrző, számlálás, kötelező elemek, tiltott elemek és kombinációk

Kontextus: egy közösségi médiás képgyártó modul (`packages/vizual-core`). A kép HTML-ből készül, a böngésző megméri
(mellékelt `meres.ts`: `LapMeres`, `ElemMeres` — minden kirajzolt mező betűje, mérete, színe, háttere, sorai, doboza).
A szabályellenőrző kerete kész (mellékelt `ellenorzo.ts`: `Szabaly`, `Talalat`, `EllenorzoKontextus`, `Ellenorzo`,
`erintettElemek`, `hossz`, `feloldas`, `kontraszt`). A szabályok gépi alakja a mellékelt `szabalyok-B2b.json`; a méretkonvenció,
a szótárak és a paraméterek leírása a `szabalyok-keret.json`.

**A feladatod:** a `packages/vizual-core/src/ellenorzo-b2b.ts` fájl, amely `Ellenorzo` függvényeket ad a mellékelt szabályok `feltetel.check` fajtáira:

```ts
import type { Ellenorzo } from "./ellenorzo.ts";
export const ELLENORZOK_B2b: Record<string, Ellenorzo> = { "min_size": (sz, k) => [...], ... };
/** azok a szabály-azonosítók, amelyeket a mérésből NEM lehet eldönteni (hiányzik hozzá adat) — indokkal */
export const NEM_DONTHETO_B2b: Record<string, string> = { "F2": "a fotórekord mezői nincsenek a mérésben" };
```

Szabályok a megírásnál:
- Minden `check` fajtához EGY függvény, amely a `sz.feltetel` mezőit (a JSON-ban látható neveket) olvassa, és a szabály MINDEN
  példányára működik (egy fajtához több szabály is tartozik, eltérő paraméterekkel).
- `@`-kal kezdődő érték = márkaparaméter: `feloldas(ertek, k)`. Hossz `{px, ref, tengely}` alakban: `hossz(ertek, k.meres)`.
  Ha a paraméter nincs meg (`undefined`), a függvény NEM talál hibát, hanem egy `figyelmeztetes` találatot ad:
  `uzenet: "hiányzó márkaparaméter: <név>"`.
- `when` / `except` / `exceptRole` jellegű feltételeket vedd figyelembe, ha a mérésből eldönthetők (pl. `contentMatches` regex a `szoveg`-en).
- Találat: `{ szabaly: sz.id, szigorusag: sz.szigorusag, mezo, uzenet: sz.uzenet, reszlet: "<mért> vs <határ>" }`.
- A szabály csak a `erintettElemek(sz, k.meres)` elemekre vonatkozik, kivéve ha a feltétel mást mond (pl. kompozíció-szintű számlálás).
- Ha egy szabály a mérésből nem dönthető el (pl. fotó-metaadat, nyelvtan, a szerkesztő szándéka), NE találj ki adatot: tedd a
  `NEM_DONTHETO_B2b`-be egy mondatos indokkal, és a függvény erre a szabályra adjon üres listát.
- TypeScript 7 strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`, nincs `any`, nincs külső import (csak `./ellenorzo.ts`,
  `./meres.ts` típusai), magyar azonosítók, rövid magyar megjegyzések. Importnál a `.ts` kiterjesztés kötelező.

**Most CSAK az első fájlt írd meg** — a próbát más írja. Tömören: fajtánként egy rövid függvény, ismétlés nélkül.

Kimenet pontosan egy `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokk, más semmi. Az utak:
`packages/vizual-core/src/ellenorzo-b2b.ts`.
