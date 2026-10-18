# Feladat — ÉPÍTŐ A (E-28): a referencia-host SQLite-tárolója (`HirfigyeloTar` a Node beépített `node:sqlite`-jával)

A hírfigyelő MAGJA (`@km/news-monitor-core`) semmit nem tud a tárolásról: a HOST adja a `HirfigyeloTar` interfészt. A webalkalmazás Postgresszel valósítja meg;
most egy MÁSODIK host készül (`apps/referencia-host`), amely UGYANAZT az interfészt SQLite-fájllal valósítja meg. Ez bizonyítja, hogy a mag hordozható.
Mellékletben: `tar.ts` (a teljes interfész + a memóriabeli megvalósítás — a VISELKEDÉS MÉRCÉJE: a te tárolódnak pontosan ugyanúgy kell viselkednie).

Nincs új npm-függőség: kizárólag a Node beépített `node:sqlite` modulja (`DatabaseSync`, `StatementSync`). Semmilyen ORM, semmilyen `better-sqlite3`.

## Amit készítesz

### 1. `apps/referencia-host/src/csatlakozok/sqlite-tar.ts`

```ts
import { DatabaseSync } from "node:sqlite";
import { cikkKulcs, type HirfigyeloTar /* + a szükséges típusok */ } from "@km/news-monitor-core";

/** SQLite-tár: a HirfigyeloTar teljes megvalósítása egyetlen fájlban. `utvonal` lehet ":memory:" is (a próbákhoz). */
export function sqliteTar(utvonal: string): HirfigyeloTar & { db: DatabaseSync; zar(): void };
```

A táblák (a `db.exec(...)` a megnyitáskor hozza létre őket, `CREATE TABLE IF NOT EXISTS`; `PRAGMA journal_mode = WAL;` és `PRAGMA foreign_keys = ON;`):

| tábla | oszlopok | miért |
|---|---|---|
| `verzio` | `szervezet_id TEXT PRIMARY KEY, adat TEXT NOT NULL` | a `verziokMent` a TELJES listát cseréli — egy sor, JSON-tömb |
| `tervezet` | `szervezet_id TEXT, fiok_id TEXT, adat TEXT, PRIMARY KEY(szervezet_id, fiok_id)` | `adat` NULL = nincs tervezet |
| `forras` | `szervezet_id TEXT, id TEXT, sorszam INTEGER, adat TEXT NOT NULL, PRIMARY KEY(szervezet_id, id)` | |
| `futas` | ugyanígy | |
| `talalat` | ugyanígy | |
| `esemeny` | ugyanígy | |
| `visszajelzes` | ugyanígy | |
| `javaslat` | ugyanígy | |
| `minta` | ugyanígy | |
| `kivonat` | `szervezet_id TEXT, kulcs TEXT, id TEXT NOT NULL, lejar TEXT NOT NULL, sorszam INTEGER, adat TEXT NOT NULL, PRIMARY KEY(szervezet_id, kulcs)` + `CREATE INDEX IF NOT EXISTS kivonat_id_idx ON kivonat(szervezet_id, id)` | a `kulcs` a `cikkKulcs(szervezetId, k.kanonikus_url)` (A-10: ugyanaz a cikk egyszer); `lejar` külön oszlop a lejárat-törléshez; `id` szerint kell keresni |

`sorszam`: monoton növekvő beszúrási sorszám — a memóriabeli tár a beszúrás sorrendjében adja vissza a listákat, és a mag több helyen erre épít. Egy `sorszam` tábla
(`nev TEXT PRIMARY KEY, ertek INTEGER`) vagy egy `SELECT COALESCE(MAX(sorszam),0)+1` a megfelelő táblából — ez utóbbi az egyszerűbb; a lekérdezések mindig
`ORDER BY sorszam` szerint adják vissza a sorokat. FRISSÍTÉSKOR (ugyanaz az `id` már létezik) a `sorszam` NEM változhat.

Minden mentés `INSERT ... ON CONFLICT(...) DO UPDATE SET adat = excluded.adat` (a `sorszam`-ot nem írja felül). Minden `adat` `JSON.stringify(…)`, minden olvasás
`JSON.parse(String(sor.adat))` és `as` a megfelelő típusra (a séma-ellenőrzés a magban történik, itt nem kell újra zod-ozni).

A 23 metódus viselkedése PONTOSAN a mellékelt `memoriaTar` szerint:
- `verziok` → üres tömb, ha nincs sor; `verziokMent` a teljes tömböt írja (csere).
- `tervezet(szervezetId, fiokId)` → `null`, ha nincs sor VAGY az `adat` NULL; `tervezetMent(..., null)` NULL-t ír (a sor megmarad).
- `forrasMent` / `futasMent` / `talalatMent` / `esemenyMent` / `visszajelzesMent` / `javaslatMent` / `mintaMent`: van már ilyen `id` → felülírás, különben hozzáfűzés a végére.
- `kivonatMent` → `"letezik"`, ha a `kulcs` már megvan (és NEM írja felül!), különben beszúr és `"uj"`.
- `kivonatok(szervezetId, ids)` → a megadott `id`-jű kivonatok, `sorszam` sorrendben (üres `ids` → üres tömb; ne építs `IN (...)`-t üres listával).
- `lejartKivonatokTorol(szervezetId, most)` → törli, ahol `new Date(lejar) <= most`, és a törölt sorok SZÁMÁT adja vissza (`DELETE ... WHERE szervezet_id = ? AND lejar <= ?` az ISO-szöveg összehasonlításával — az ISO-időbélyeg szövegként is helyesen rendeződik, ha `Z` végű; a `most.toISOString()`-gel hasonlíts).
- Minden metódus `async`, de belül szinkron `node:sqlite`-hívás — ez rendben van.
- Több szervezet adata ugyanabban a fájlban él, és a szervezet szerinti szűrés MINDEN lekérdezésben kötelező.

`zar()`: `db.close()`. A `db`-t is add ki, hogy a host más táblákat (sor) tehessen ugyanabba a fájlba.

Az előkészített utasításokat (`db.prepare(...)`) a függvény elején készítsd el egyszer, ne minden híváskor.

### 2. `apps/referencia-host/probak/sqlite-tar.proba.ts` (vitest)

Legalább ezek:
1. **Ugyanaz a viselkedés, mint a memóriatáré**: ugyanazt a műveletsort futtatva a `memoriaTar()`-on és a `sqliteTar(":memory:")`-on ugyanazok a válaszok (forrás mentés+frissítés, futás, találat, esemény, visszajelzés, javaslat, minta, verziók, tervezet).
2. **`kivonatMent` kétszer ugyanazzal a `kanonikus_url`-lel** → `"uj"`, majd `"letezik"`, és a tárolt adat az ELSŐ marad.
3. **Sorrend**: három forrás mentése, majd a középső frissítése → a `forrasok()` sorrendje változatlan.
4. **`lejartKivonatokTorol`**: két lejárt + egy élő kivonat → 2-t ad vissza, az élő megmarad.
5. **Fájlba írás és újranyitás**: `sqliteTar(<ideiglenes fájl>)`, mentés, `zar()`, majd új `sqliteTar(<ugyanaz a fájl>)` → az adatok megvannak. (Az ideiglenes fájl `node:fs` `mkdtempSync(join(tmpdir(), "km-ref-"))` alá kerüljön, és a próba végén törlődjön.)
6. **Két szervezet elkülönül**: az egyik szervezet találatai nem látszanak a másiknál.

## Szabályok

TypeScript 7 szigorú kapcsolókkal: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` (a tömbindexelés eredménye `T | undefined` — kezeld!), `verbatimModuleSyntax`
(típusimport `import type`), ESM (`"type": "module"` — a saját fájljaidra `.js` kiterjesztésű relatív import: `from "./sqlite-tar.js"`). Magyar függvény- és
változónevek, magyar megjegyzések. NINCS `any`; ha kell, `as` a mellékletben látható típusokra. Nincs új npm-függőség. Nincs `console.log`.

A választ ADD VISSZA MINDEN FÁJLT TELJES EGÉSZÉBEN, fájlonként ```ts blokkban, a blokk fölött a fájl útvonalával.
