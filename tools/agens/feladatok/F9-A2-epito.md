# Feladat — ÉPÍTŐ (F9-A2): a Hírek lap ne várjon az összképre; az összkép tárolva, futásonként egyszer

TypeScript 7 strict, Next.js 16 app router, React 19, drizzle-orm (Postgres), zod 4.5. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza, TELJES fájltartalommal. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret (tokenőr) — csak a meglévő CSS-osztályok. Felirat CSAK kulcsból (`t("hf.…")`), három nyelven (hu eredeti, ro, en). Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. CSAK az alább felsorolt fájlokat adod vissza; a mellékelt fájlokból ami nem szerepel a listán, azt NEM írod át.

## MÉRT tények (2026-09-14/15, a teszten)

- A Hírek lap (`apps/web/app/hirfigyelo/Attekintes.tsx`, `betolt()`) az áttekintés (`GET /api/hirfigyelo/attekintes`) UTÁN, még a `setBetoltve(true)` ELŐTT hívja a `GET /api/hirfigyelo/osszkep`-et, ami egy AI-hívás (8–15 mp). Ezért a lap 8–15 mp-ig „Betöltés…”-t mutat, pedig a kártyák már megvannak.
- Az összkép MINDEN lapnyitáskor újra készül (új AI-hívás, új költség a Költség lapon), pedig a találatok nem változtak. Az `ujraBetolt()` is újra hívja.
- Az összkép hívása 2026-09-15 14:22 óta már jó választ ad (F9-A1 javítva) — ez a feladat NEM az AI-válaszról szól, hanem a betöltés sorrendjéről és a tárolásról.

## Mit kell megírni

### 1. ÚJ migráció: `apps/web/adatbazis/migraciok/0069_hf_osszkep_tarolva.sql`

(a) Új tábla — a `hf_futas` mintájára (a mellékelt `0027` részlet mutatja a sorszintű védelem alakját):
```sql
CREATE TABLE "hf_osszkep" (
  "szervezet_id" uuid PRIMARY KEY REFERENCES "public"."szervezet"("id") ON DELETE cascade,
  "futas_id" uuid,                 -- melyik (utolsó sikeres) futáshoz készült
  "osszkep" jsonb,                 -- { szoveg, hivatkozott_talalatok, bizonytalan } vagy NULL, ha a hívás hibázott
  "hiba_ideje" timestamptz,        -- az utolsó SIKERTELEN hívás ideje (1 órán belül nem ismételjük)
  "frissitve" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "hf_osszkep" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hf_osszkep_sajat" ON "hf_osszkep" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_osszkep" TO "km_app";
```
(b) Feliratok (a `0062` minta szerint, `INSERT … ON CONFLICT … DO UPDATE`):
- `hf.betoltes` ÚJ ÉRTÉKE: hu „Betöltjük a korábban összegyűjtött híreidet.” · ro „Încărcăm știrile adunate mai devreme.” · en „Loading the news we collected earlier.”
- `hf.betoltes_lassu` (új): hu „A hírek betöltése a szokásosnál tovább tart.” · ro „Încărcarea știrilor durează mai mult decât de obicei.” · en „Loading the news is taking longer than usual.”
- `hf.ujraprobalom` (új): hu „Újrapróbálom” · ro „Încerc din nou” · en „Try again”
Fejléc-megjegyzés az elején: `-- F9-A2: az összkép tárolva futásonként; a Hírek lap betöltő mondatai`.

### 2. ÚJ fájl: `apps/web/adatbazis/_RESZLET-sema-hf-osszkep.ts`

CSAK a drizzle táblaleírás, amit a beépítő a `sema.ts` végére illeszt (a `hfFutas` mintájára, ugyanazokkal az importokkal, amik a sema.ts-ben már megvannak: `pgTable, uuid, jsonb, timestamp, pgPolicy, sql`, és a `szervezet` tábla + az `aktualisSzervezet` a fájlban létezik):
```ts
export const hfOsszkep = pgTable("hf_osszkep", { szervezetId: uuid("szervezet_id").primaryKey().references(() => szervezet.id, { onDelete: "cascade" }), futasId: uuid("futas_id"), osszkep: jsonb("osszkep"), hibaIdeje: timestamp("hiba_ideje", { withTimezone: true }), frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow() }, (t) => [ pgPolicy("hf_osszkep_sajat", { for: "all", to: "km_app", using: sql`szervezet_id = ${aktualisSzervezet}`, withCheck: sql`szervezet_id = ${aktualisSzervezet}` }) ]).enableRLS();
```
(Ebben a fájlban NE legyen import — a részlet a sema.ts-be kerül.)

### 3. ÚJ fájl: `apps/web/hirfigyelo/osszkep.ts`

```ts
import "server-only";
// F9-A2: az összkép TÁROLVA — futásonként egyszer készül, nem lapnyitásonként.
```
Export: `osszkepTarolt(k: Kornyezet, ktx: HostKontextus): Promise<Eredmeny<{ osszkep: OsszkepValasz; tarolt: boolean }>>` — a `Hiba`, `Kornyezet`, `HostKontextus`, `OsszkepValasz` típusok és az `osszkep` folyamat a `@km/news-monitor-core`-ból (az `Eredmeny<T>` NINCS exportálva: a fájlban helyben `type Eredmeny<T> = { ok: true } & T | Hiba;`); a `sema`, `szervezetKent` a `../adatbazis/kapcsolat`-ból (a mellékelt `tar.ts` részlet mutatja a `szervezetKent(szervezetId, async (tx) => …)` mintát; `eq` a drizzle-orm-ból).
Lépések:
1. `const futasok = await k.tar.futasok(ktx.szervezet_id)`; az utolsó sikeres futás = a legkésőbbi `kezdet` azok közül, ahol `allapot` ∈ {"kesz","reszleges","ai_fuggoben"}; ha nincs → `{ ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "nincs_futas" }`.
2. A tárolt sor (`sema.hfOsszkep`, `szervezetKent` alatt, `select … where szervezetId`). Ha van sor, `futas_id === utolsó.id` és `osszkep` nem null → `OsszkepValasz.safeParse(sor.osszkep)`; sikernél `{ ok: true, osszkep: adat, tarolt: true }`.
3. Ha van sor, `futas_id === utolsó.id`, `osszkep` null és `hiba_ideje` 1 óránál fiatalabb → `{ ok: false, hiba: "ERVENYTELEN_ADAT", reszlet: "osszkep_varakozik" }` (nem hívunk AI-t).
4. Különben: `const e = await osszkep(k, ktx)` (a mag folyamata — ez hívja az AI-t). Sikernél a sor mentése (`insert … onConflictDoUpdate` a `szervezetId` kulcson: `futasId`, `osszkep`, `hibaIdeje: null`, `frissitve: new Date()`), és `{ ok: true, osszkep: e.osszkep, tarolt: false }`. Hibánál a sor mentése `osszkep: null, hibaIdeje: new Date(), futasId: utolsó.id`, és a mag hibája visszaadva.

### 4. MÓDOSÍTOTT fájl: `apps/web/app/api/hirfigyelo/osszkep/route.ts` (mellékelve)

`osszkep(k, ktx)` helyett `osszkepTarolt(k, ktx)` a `../../../../hirfigyelo/osszkep`-ből; minden más változatlan (a válasz alakja a `eredmenyValasz` szerint: `{ hirfigyelo: { osszkep, tarolt } }`).

### 5. MÓDOSÍTOTT fájl: `apps/web/app/hirfigyelo/Attekintes.tsx` (mellékelve, TELJES fájlt adsz vissza; CSAK az alábbi változások, minden más sor betűre ugyanaz)

- A `betolt()`-ban: az áttekintés megérkezése után AZONNAL `setBetoltve(true)`; az összkép hívása ne legyen `await`-elve a betöltés útjában — egy külön `osszkepBetolt(kartyak)` `useCallback`-ba kerül (ugyanaz a logika: csak ha van `ertekeles_allapot === "kesz"` kártya; 200 → `setOsszkep`, különben `setOsszkep(null)`, `setOsszkepHiba(true)`), és `void osszkepBetolt(a.torzs.kartyak)`-ként indul a `betolt()` és az `ujraBetolt()` végén. (A két helyen ma duplán álló összkép-kód ebbe az egy függvénybe kerül.)
- A betöltő állapot (`if (!betoltve)`): a szöveg `t("hf.betoltes")` marad (az értéke a migrációval változik); ÚJ: egy `lassu` állapot (`useState(false)`), amit egy `useEffect` 5 mp után igazra állít, amíg `!betoltve` (a timer törlődik, ha betöltve). Ha `lassu`: a mondat alatt `t("hf.betoltes_lassu")` és egy gomb `t("hf.ujraprobalom")` (`className="km-hf-uzenet-gomb"`, `onClick={() => { setLassu(false); void betolt(); }}`). A meglévő `km-hf-uzenet` doboz marad, `aria-live="polite"`.
- Semmi más nem változik: a kártyák, a részletpanel, a sáv, a futás-figyelés, a jelölések mind érintetlenek.

### 6. ÚJ próba: `apps/web/probak/hf-osszkep-tarolt.proba.ts` — NEM kell; a Qwen írja külön. Te NEM írsz próbát.

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; `pnpm tokenor` 0; a Hírek lap 3 mp alatt kártyákat mutat; a Költség lapon az „Összkép a napról” sor lapnyitásonként NEM nő. Add vissza az 5 fájlt (migráció, _RESZLET-sema, osszkep.ts, route.ts, Attekintes.tsx).
