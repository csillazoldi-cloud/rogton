# Feladat — ÉPÍTŐ B (E-23): a webalkalmazás oldala — tartalomötlet-útvonal, az összefoglaló a promptban és a teszt-csatlakozóban, tárolás

Az ÉPÍTŐ A ezzel párhuzamosan a magban (`packages/news-monitor-core`) ezt készíti — erre építs, ne írd meg újra:
- `Ertekeles` + `RelevanciaValasz` új mező: `osszefoglalo` (string, max 400, default "");
- `Talalat` új mező: `tartalomotlet: { szoveg: string; nyelv: string; keszult: string } | null` (default null);
- új folyamat: `tartalomotletKer(k, ktx, talalatId): Promise<Eredmeny<{ talalat: Talalat }>>` (jog `futtat`; hibák: `NINCS_ILYEN_TALALAT`, `AI_NEM_ELERHETO`, `AI_KERET_KIMERULT`, `AI_ROSSZ_VALASZ`);
- az `attekintes` válasza kap `kartyak: Kartya[]` mezőt (a mag számolja, a webnek semmi dolga vele).

Mellékelve: `apps/web/hirfigyelo/ai.ts` (a hat hf-feladat prompt-összeállítása), `apps/web/hirfigyelo/tar.ts` (Postgres-tár, a `sorTalalatta` és a `talalatMent`),
`apps/web/adatbazis/sema.ts` részlete (`hfTalalat`), a `0028` migráció (minta), `packages/ai-adapters/src/alap.ts` (a teszt-csatlakozó `hf_relevancia` ága),
`prompts/hf_relevancia.hu.md`, `prompts/hf_tartalomotlet.hu.md`, az API `talalatok/[id]/jelol/route.ts` (minta), `_kozos.ts`, `packages/contracts/src/index.ts` (HibaKod),
a `probak/hirfigyelo.proba.ts` részlete (a `keres`, `fiokLetrehozas`, `varjMeg` segédek és a 6. próba).

Készítsd el (add vissza az ÖSSZES érintett fájlt teljes egészében; a `sema.ts`-ből és a `tar.ts`-ből CSAK a módosított részt add vissza „=== RÉSZLET ===” jelöléssel, NE az egészet):

1. **Migráció `apps/web/adatbazis/migraciok/0029_hirfigyelo_tartalomotlet.sql`**: `ALTER TABLE "hf_talalat" ADD COLUMN "tartalomotlet" jsonb;` (a `--> statement-breakpoint` stílus a 0028 szerint).
   **`sema.ts`** `hfTalalat`: `tartalomotlet: jsonb("tartalomotlet")`. **`tar.ts`**: a `sorTalalatta` adja vissza `tartalomotlet: sor.tartalomotlet ?? null`; a `talalatMent` `ertek`-je
   tartalmazza `tartalomotlet: t.tartalomotlet` (az `ertekeles` mintájára).
2. **`prompts/hf_relevancia.hu.md`** (v2): a JSON-válasz kap `"osszefoglalo"` kulcsot: 1–2 mondat, max 400 karakter, MIRŐL szól a cikk (tárgyilagos, a cikk saját nyelvén, ha az nem
   magyar, akkor is magyarul — a felület nyelve később dönt); a „Szabályok” közé egy sor róla. Minden más marad (ADAT-blokk, védelem).
3. **`packages/ai-adapters/src/alap.ts`** — a teszt-csatlakozó `hf_relevancia` ága adja vissza az `osszefoglalo` mezőt is: a `Cikk címe:` sor utáni ADAT-blokk első 2 mondata,
   max 400 karakter, `[MINTA]` előtaggal. A `hf_tartalomotlet` ága ellenőrizd, hogy `{ szoveg, nyelv: "hu" }`-t ad (ha nincs, add hozzá: `"[MINTA] Tartalomötlet: …"` a címből).
4. **Új útvonal `apps/web/app/api/hirfigyelo/talalatok/[id]/tartalomotlet/route.ts`**: `POST` → `tartalomotletKer(k, ktx, id)` → `eredmenyValasz` (a mag hibakódjai HTTP-kódra:
   `NINCS_ILYEN_TALALAT` 404, `AI_KERET_KIMERULT` 429, `AI_NEM_ELERHETO`/`AI_ROSSZ_VALASZ` 502 — nézd meg az `eredmenyValasz`-t a `_kozos.ts`-ben és egészítsd ki, ha a kód hiányzik a képezésből).
   `GET` ugyanitt → a találat (a tár `talalatok`-jából az `id`), 404, ha nincs — a részletpanel újranyitáskor innen olvassa a már meglévő ötletet.
5. **`packages/contracts/src/index.ts`**: `HibaKod` += `"NINCS_ILYEN_TALALAT"` (megjegyzés: E-23).
6. **`probak/hirfigyelo.proba.ts`** — CSAK az új próbákat add vissza egy `=== RÉSZLET ===` blokkban, amit a 6. próba UTÁN kell beilleszteni (a `describe`-on belül), a meglévő segédekkel:
   - **11. kártyák**: a 6. próba futása után `GET attekintes` → `kartyak` tömb nem üres; minden kártyán `forras_szam ≥ 1`, `forrasok.length === forras_szam`, `cim` nem üres,
     `osszefoglalo` nem üres (a teszt-AI `[MINTA]`-val kezdi), `fontossag` ∈ {fontos, erdekes, hatter}, `szabaly_verzio` szám, `megtekintes` „uj” vagy „megtekintett”;
     a kártyák száma ≤ a találatok száma.
   - **12. tartalomötlet csak kérésre**: egy találat `tartalomotlet` null a `GET talalatok/{id}/tartalomotlet`-ben; `POST` → 200, `talalat.tartalomotlet.szoveg` nem üres,
     `nyelv` „hu”; második `POST` → ugyanaz a `keszult` (nem hívott újra); a néző (`nezoSutik`) `POST` → 403; nem létező id → 404; a MÁSIK szervezet (`bSutik`) a találatra → 404.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), zod 4, Next 16 (a `params` Promise), drizzle 0.45; magyar nevek és megjegyzések;
nincs új npm-függőség; a válaszok `{ hirfigyelo: … }` burokban, a `hiba()`/`valasz()` segédekkel.
