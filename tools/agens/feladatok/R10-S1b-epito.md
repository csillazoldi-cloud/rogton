# Feladat — ÉPÍTŐ (R10-S1b): a sémaváltás gépezete (a tár, a kapu, a két végpont) — KIS, célzott változtatások

Folytatás: a sémák (`packages/design-system/src/semak.ts`: `SEMAK`, `semaKeres`, `SemaKod`, `Sema`) és a `0088_semak.sql` migráció (a `tema` és a `szervezet_tema` táblán `sema_kod text` oszlop) MÁR ELKÉSZÜLTEK. A Drizzle-séma is (`semaKod: text("sema_kod")` mindkét táblán). Most CSAK a gépezet hiányzik.

**Szigorú keret:** összesen legfeljebb 6 CSERE a `tar.ts`-ben és 2 a `tema-szintek.ts`-ben; ne írd újra a fájlt, ne fogalmazd át, amit nem kell. A RÉGI blokk 3–8 sor, szó szerint a mellékletből, egyedi. Kimenet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkokban. TypeScript 7 strict, zod 4.5, nincs `any`, magyar azonosítók.

## Mit kell megírni

### 1. RÉSZLET: `_RESZLET-tema-szintek.md` → `packages/design-system/src/tema-szintek.ts`
- CSERE 1: a `SzervezetTemaAllapot` objektumban a `hatasos: AlapTokenek,` sor után: `  /** R-10: az alkalmazott verzió sémakódja (ejkek · vilagos · sotet), ha sémából jött */\n  sema_kod: z.string().nullable().default(null),`
- CSERE 2: a `KozosTemaAllapot` objektumban a `verziok: z.array(TemaVerzioFej),` sor után ugyanez a mező.

### 2. RÉSZLET: `_RESZLET-tar.md` → `apps/web/tema/tar.ts` (legfeljebb 6 CSERE)
- `szervezetTervezetMent(szervezetId, felulirasok, semaKod: string | null = null)`: a beszúrt/frissített tervezet sorába `semaKod` is kerül (Drizzle: `semaKod`).
- `kozosTervezetMent(tokenek, semaKod: string | null = null)`: ugyanígy a `tema` sorba.
- `szervezetTemaAllapot`: a visszaadott objektumba `sema_kod: alk?.semaKod ?? null` (az ALKALMAZOTT sor mezője; a lekérdezés a `semaKod` oszlopot is olvassa).
- `kozosAllapot`: ugyanígy `sema_kod` az alkalmazott `tema` sorból.
Semmi mást ne változtass. Ha egy függvény a mellékletben másképp néven van, ahhoz igazodj.

### 3. RÉSZLET: `_RESZLET-tema-index.md` → `apps/web/tema/index.ts` (1 CSERE: a fájl végére két új export)
```ts
const SemaKeres = z.object({ kod: z.string().min(1).max(40) });
/** R-10: sémaváltás a szervezet szintjén — tervezet a séma tokenjeiből, azonnal alkalmazva (új verzió). */
export async function szervezetSemaValt(szervezetId: string, be: unknown): Promise<TemaEredmeny<SzervezetTemaAllapot>> { … }
/** R-10: sémaváltás a közös alapon (rendszergazda). */
export async function kozosSemaValt(be: unknown): Promise<TemaEredmeny<KozosTemaAllapot>> { … }
```
Lépések: `SemaKeres.safeParse(be)` (hiba → a fájl meglévő hibaalakja, `HIBAS_KERES`); `semaKeres(kod)` → null esetén `{ ok: false, hiba: { hiba: "ISMERETLEN_SEMA" }, status: 400 }` a fájl `TemaEredmeny` alakja szerint; szervezet: `tar.szervezetTervezetMent(id, sema.tokenek, sema.kod)` → `tar.szervezetAlkalmaz(id)` → `tar.temaGyorsitotarUrit()` → `tar.szervezetTemaAllapot(id)`; közös: `egyesit(await tar.kozosAlkalmazott(), sema.tokenek)` → `tar.kozosTervezetMent(…, sema.kod)` → `tar.kozosAlkalmaz()` → ürítés → `tar.kozosAllapot()`. Az importokat (`semaKeres`, `egyesit`, `z`) a fájl meglévő import-sorába tedd (külön CSERE, ha kell — akkor összesen 2).

### 4. TELJES: `apps/web/app/api/tema/sema/route.ts`
A mellékelt `alkalmaz/route.ts` mintájára: `PUT`, `kapu(keres, "tulajdonos")`, `tulajdonos()` → 403 `NINCS_JOG`, törzs JSON → `szervezetSemaValt(szervezet.id, torzs)` → `eredmenyValasz`.

### 5. TELJES: `apps/web/app/api/tema/kozos/sema/route.ts`
A mellékelt `kozos/route.ts` mintájára: `PUT`, `rendszergazda(keres)` → `kozosSemaValt(torzs)` → `eredmenyValasz`.

### 6. TELJES: `packages/design-system/src/semak.proba.ts` (vitest, adatbázis nélkül)
- mindhárom séma átmegy a `TemaFelulirasok.parse`-on;
- az „ejkek" minden kulcsa egyenlő a `tema-alap.json` `tokens` értékével;
- a „vilagos" `--aurora-opacity` === "0" és `--bg` === "#F7F7F5";
- `szarmaztat(egyesit(alap, vilagos.tokenek))["--glow-primary"] === "none"`, az ejkéknél nem "none".

Más fájlhoz ne nyúlj.
