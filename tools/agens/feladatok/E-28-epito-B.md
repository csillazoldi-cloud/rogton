# Feladat — ÉPÍTŐ B (E-28): a referencia-host SAJÁT ütemezője és HTTP-kiszolgálója (Next és React NÉLKÜL)

A hírfigyelő MAGJA (`@km/news-monitor-core`) nem ütemez és nem szolgál ki kérést: a HOST adja. A webalkalmazásnak Postgres-alapú sora és Next-útvonalai vannak;
most egy MÁSODIK host készül (`apps/referencia-host`), amelynek SAJÁT, minimális sora (SQLite) és SAJÁT, sima `node:http` kiszolgálója van. Ez bizonyítja, hogy a mag
hordozható. Nincs Next, nincs React, nincs Express — csak a Node beépített `node:http`-je és `node:sqlite`-ja. Nincs új npm-függőség.

Ami MÁR MEGVAN, és amit használsz (mellékletben a szerződésük):
- `sqliteTar(utvonal)` → `HirfigyeloTar & { db: DatabaseSync; zar(): void }` — a `db` a MEGNYITOTT SQLite-kapcsolat, a te `sor` táblád is ebbe kerül (ÉPÍTŐ A készíti).
- `kornyezetKeszit()` → `{ k: Kornyezet, ktx: HostKontextus, tar, beallitasok }` — a négy csatlakozó összefűzve (a host másik darabja készíti, TE CSAK HÍVOD).
- A magból: `figyelesFuttat(k, ktx, { proba })`, `ertekelesUjra(k, ktx)`, `attekintes(k, ktx)`, `aktivVerzio(verziok)` — a pontos aláírásokat lásd a mellékelt `MAG-API.md`-ben.

## Amit készítesz

### 1. `apps/referencia-host/src/csatlakozok/utemezo.ts`

Tábla (a megnyitáskor, `CREATE TABLE IF NOT EXISTS`):

```sql
CREATE TABLE IF NOT EXISTS sor (
  id TEXT PRIMARY KEY, szervezet_id TEXT NOT NULL, fajta TEXT NOT NULL, adat TEXT NOT NULL,
  allapot TEXT NOT NULL, kiserlet INTEGER NOT NULL DEFAULT 0, letrehozva TEXT NOT NULL,
  kezdve TEXT, vege TEXT, hiba_ok TEXT, eredmeny TEXT
);
```

Típusok és függvények (a webalkalmazás sorával AZONOS fogalmak, hogy a bekötési leírás egységes legyen):

```ts
export type SorFajta = "futas" | "ertekeles_ujra" | "napi";
export type SorAllapot = "var" | "fut" | "kesz" | "hiba";
export type SorTetel = { id: string; szervezet_id: string; fajta: SorFajta; adat: Record<string, unknown>; allapot: SorAllapot; kiserlet: number; letrehozva: string; kezdve: string | null; vege: string | null; hiba_ok: string | null; eredmeny: Record<string, unknown> | null };

export function sorKeszit(db: DatabaseSync, idAdo: () => string, most: () => Date): Sor;

export interface Sor {
  /** Sorba tesz; ha a szervezetnek MÁR van „var” vagy „fut” tétele: FUT_MAR. */
  sorbaTesz(szervezetId: string, fajta: SorFajta, adat: Record<string, unknown>): { ok: true; sor: SorTetel } | { ok: false; hiba: "FUT_MAR" };
  tetel(id: string): SorTetel | null;
  tetelek(szervezetId: string): SorTetel[];           // legújabb elöl
  /** A legrégebbi „var” tételt „fut”-ra állítja és visszaadja (kezdve = most), vagy null. */
  kovetkezoKivesz(): SorTetel | null;
  kesz(id: string, eredmeny: Record<string, unknown>): void;   // allapot=kesz, vege=most
  hiba(id: string, ok: string): void;                          // allapot=hiba, vege=most, kiserlet+1
}
```

Az ütemező:

```ts
export interface UtemezoOpciok { intervallumMs?: number; /* alap 5000 */ }
export function utemezo(fuggosegek: { sor: Sor; futtat: (t: SorTetel) => Promise<Record<string, unknown>>; napiEsedekes: () => Promise<string[]>; most: () => Date; naplo?: (uzenet: string) => void }, opciok?: UtemezoOpciok): { indit(): void; leallit(): void; egyKor(): Promise<void> };
```

- `egyKor()`: (1) `napiEsedekes()` → a visszaadott szervezet-azonosítókat `sorbaTesz(sz, "napi", {})`-tel besorolja (a `FUT_MAR` nem hiba, csak kihagyás);
  (2) `kovetkezoKivesz()` → ha van tétel, `futtat(t)` → `kesz(t.id, eredmeny)`, kivétel esetén `hiba(t.id, uzenet)`. EGYSZERRE EGY tétel.
- `indit()`: `setInterval(...)` az `egyKor()`-re, de EGYSZERRE CSAK EGY kör fusson (őrzőjelző); a `setInterval` `unref()`-elt legyen, hogy a próbák ne akadjanak el.
  `leallit()`: `clearInterval`.
- `egyKor()` SOHA nem dobhat: minden hiba a `naplo`-ba és a sor `hiba` állapotába megy (a webalkalmazás futtatójánál egy indulási sorrend-hiba egyszer már megállította a
  háttérfuttatást — itt ez nem fordulhat elő).
- `napiEsedekes` MEGVALÓSÍTÁSA IS A TIÉD, `apps/referencia-host/src/csatlakozok/napi.ts` néven:
  `export function napiEsedekes(tar: HirfigyeloTar, szervezetId: string, most: () => Date, utolsoNapiFutas: (sz: string) => string | null): Promise<string[]>` —
  az aktív beállítás `idozites`-e alapján (`{ mod: "kezi" | "napi", ora, perc, idozona }`): `mod !== "napi"` → üres; különben ha az `idozona` szerinti MAI napon az
  `ora:perc` már elmúlt, ÉS az `utolsoNapiFutas` (ISO vagy null) nem a mai napra esik → a szervezet esedékes. Az időzóna szerinti helyi nap/óra kiszámítása
  `Intl.DateTimeFormat("en-CA", { timeZone: idozona, year, month, day, hour, minute, hour12: false })` `formatToParts`-jával (NINCS új függőség, nincs kézi eltolás).

### 2. `apps/referencia-host/src/kiszolgalo.ts`

Sima `node:http` kiszolgáló, JSON-válaszokkal. `export function kiszolgalo(f: { k: Kornyezet; ktx: HostKontextus; sor: Sor; }): http.Server` és
`export function indit(server: http.Server, port: number): Promise<void>`.

| útvonal | mit tesz | válasz |
|---|---|---|
| `GET /allapot` | él-e | 200 `{ allapot: "ok", ido: <ISO>, szervezet_id }` |
| `GET /attekintes` | `attekintes(k, ktx)` | 200 `{ attekintes: … }` vagy a hiba szerinti kód |
| `GET /talalatok` | `attekintes(k, ktx)` `talalatok` + `kartyak` | 200 `{ talalatok, kartyak }` |
| `POST /futtat` | törzs `{ proba?: boolean }`; `sorbaTesz(ktx.szervezet_id, "futas", { proba })` | **202** `{ sor }`, `FUT_MAR` → 409 `{ hiba: "FUT_MAR" }` |
| `GET /sor` | `sor.tetelek(ktx.szervezet_id)` | 200 `{ sor }` |
| `GET /sor/{id}` | `sor.tetel(id)` | 200 `{ sor }` vagy 404 `{ hiba: "NINCS_ILYEN" }` |
| bármi más | | 404 `{ hiba: "NINCS_ILYEN_UTVONAL" }` |

- A mag hibakódjainak leképezése HTTP-re: `NINCS_JOG` → 403, `NINCS_BEALLITAS` → 409, `FUT_MAR` → 409, `ERVENYTELEN_ADAT` → 400, `NINCS_ILYEN_*` → 404,
  `AI_KERET_KIMERULT` → 429, `AI_NEM_ELERHETO` / `AI_ROSSZ_VALASZ` → 502, minden más → 500. Egy `export function hibaKod(hiba: string): number` végezze.
- A kérés törzsét legfeljebb 64 kB-ig olvasd; hibás JSON → 400 `{ hiba: "ERVENYTELEN_ADAT" }`. `content-type: application/json; charset=utf-8`.
- A kiszolgáló SOHA ne dobjon: minden útvonal `try/catch`, kivétel → 500 `{ hiba: "BELSO_HIBA" }` (a részlet a naplóba, NEM a válaszba).
- Ez a kiszolgáló EGY szervezetet szolgál ki (a referencia-host egy ügyfél gépén futó kis doboz): a `ktx`-ből veszi a szervezetet, nincs belépés, nincs süti.
  A felület (HTML) NEM ide tartozik — az egy későbbi lépés.

### 3. `apps/referencia-host/probak/utemezo.proba.ts` (vitest)

1. `sorbaTesz` kétszer ugyanannak a szervezetnek → a második `FUT_MAR`; a tétel `kesz` után újra lehet sorba tenni.
2. `kovetkezoKivesz` a legrégebbit adja, `fut` állapotba teszi; üres sorra `null`.
3. `egyKor()`: egy „futas” tétel + hamis `futtat` → a tétel `kesz`, az `eredmeny` a `futtat` visszatérése.
4. `egyKor()` hibával: a `futtat` kivételt dob → a tétel `hiba`, a `hiba_ok` a kivétel üzenete, és az `egyKor()` NEM dob.
5. `napiEsedekes`: `mod: "kezi"` → üres; `mod: "napi"`, 07:00 Europe/Bucharest, a „most” 08:00 helyi, utolsó futás tegnap → esedékes; ugyanez ma reggel 07:30-as
   utolsó futással → NEM esedékes.
6. A kiszolgáló: `GET /allapot` 200; ismeretlen útvonal 404 `NINCS_ILYEN_UTVONAL`; `POST /futtat` 202 és a válaszban a sor tétele (a `Kornyezet` a próbában lehet
   minimális csonk — csak azt kell tudnia, amit a hívott útvonal használ). A kiszolgálót `server.listen(0)` véletlen porton indítsd, és a próba végén zárd.

## Szabályok

TypeScript 7 szigorú kapcsolókkal: `exactOptionalPropertyTypes` (a NEM MEGADOTT mező és az `undefined` KÜLÖNBÖZŐ — feltételesen fűzd hozzá az opcionális mezőket),
`noUncheckedIndexedAccess` (tömbindexelés → `T | undefined`), `verbatimModuleSyntax` (típusimport `import type`), ESM: a saját fájljaidra `.js` kiterjesztésű relatív
import (`from "./csatlakozok/utemezo.js"`). Magyar függvény- és változónevek, magyar megjegyzések. NINCS `any`. Nincs `console.log` a könyvtári kódban (a `naplo`
függvényt hívd). Nincs új npm-függőség.

A választ ADD VISSZA MINDEN FÁJLT TELJES EGÉSZÉBEN, fájlonként ```ts blokkban, a blokk fölött a fájl útvonalával.
