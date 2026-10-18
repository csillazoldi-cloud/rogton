# Feladat — ÉPÍTŐ (F9-A8 + F9-A9): forrás-korlát a csomagon (5 a próbaidőszakban) és a csomagnevek adatként (Radar · Studio · Newsroom · Agency)

TypeScript 7 strict, Next.js 16, React 19, drizzle-orm, zod 4.5. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret — csak a meglévő CSS-osztályok. Felirat CSAK kulcsból, három nyelven. Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban.

Két fajta kimenet van:
- TELJES fájl (a lista mondja, melyik) — a teljes tartalommal;
- RÉSZLET-fájl a nagy fájlokhoz (`_RESZLET-….md` néven): ebben CSERE-blokkok vannak, amiket a beépítő szó szerinti kereséssel alkalmaz. Alakja PONTOSAN:
```
### CSERE 1
--- RÉGI
<a mellékelt fájlból SZÓ SZERINT kimásolt, egyedi sorok>
--- ÚJ
<az új sorok>
--- VÉGE
```
A RÉGI blokknak betűre egyeznie kell a mellékelt fájllal (behúzás, idézőjelek), és csak egyszer szabad előfordulnia a fájlban.

## Döntések (Vilmos, 2026-09-14) és MÉRT tények

- A csomagok neve: **Radar · Studio · Newsroom · Agency**. A mai egyetlen csomag (`pilot`) neve mostantól **Radar**, megjelenítve „Radar (próbaidőszak)”; ár nincs.
- A teszt- és próbaidőszakban **legfeljebb 5 forrás** figyelhető. A többi csomagnál nincs korlát (null).
- Ma: `csomag` tábla (`kod`, `modulok`, `ar_havi`, `penznem`, `letrehozva`), egy sor: `pilot`, modulok `{hirfigyelo}`; a `szervezet.csomag_kod` alapértéke `'pilot'`, minden munkatér `pilot`. A `@km/contracts` `Csomag` sémája (`kod, modulok, ar_havi, penznem`), `ALAP_CSOMAG_KOD = "pilot"`. A hibakódok listája (`HibaValasz`) tartalmazza a `MODUL_NEM_ELERHETO`-t, `FORRAS_KORLAT` még nincs.
- A `POST /api/hirfigyelo/forrasok` ma korlát nélkül vesz fel forrást. A `GET` `{ hirfigyelo: { forrasok } }`-t ad.
- A `Forrasok.tsx` a listát a GET-ből tölti (`hfKeres<{ forrasok: Forras[] }>`), a hozzáadás 403-ra ma `hf.saveFailTitle`-t mutat.
- A Beállítások lap (`Gephaz.tsx`) Csomag sora: `t("csomag.cim")` + `t("csomag.probaidoszak")` — a csomag kódját a `nezet.csomag.kod` adja.

## Mit kell megírni

### 1. RÉSZLET: `_RESZLET-contracts.md` (a mellékelt `packages/contracts/src/index.ts`-hez)
- CSERE 1: `export const ALAP_CSOMAG_KOD = "pilot";` → `export const ALAP_CSOMAG_KOD = "radar"; // F9-A9: a próbaidőszak csomagja a Radar (volt: pilot)`
- CSERE 2: a `Csomag` sémában a `penznem` sora után új mező: `  /** F9-A8: legfeljebb ennyi forrás figyelhető; null = nincs korlát (a próbaidőszakban 5) */\n  forras_max: z.number().int().positive().nullable(),`
- CSERE 3: a `"MODUL_NEM_ELERHETO", // F-7a: a modul nincs a munkatér csomagjában` sor után új sor: `  "FORRAS_KORLAT", // F9-A8: a csomag forrás-korlátja betelt (a próbaidőszakban 5)`

### 2. RÉSZLET: `_RESZLET-sema.md` (a mellékelt sema-részlethez)
- CSERE 1: a `csomag` tábla `penznem: text("penznem"),` sora után: `  forrasMax: integer("forras_max"), // F9-A8: null = nincs korlát`

### 3. TELJES: `apps/web/csomag/index.ts` (mellékelve)
A `csomagBetolt` a `forras_max` mezőt is adja (`sor.forrasMax ?? null`); a tartalék objektumban `forras_max: null`. Más nem változik.

### 4. TELJES migráció: `apps/web/adatbazis/migraciok/0074_f9_a8_a9_csomagok.sql`
Fejléc: `-- F9-A8 + F9-A9 (Vilmos döntése 2026-09-14): csomagnevek adatként (Radar · Studio · Newsroom · Agency), forrás-korlát (a próbaidőszakban 5), a pilot kód átnevezése radar-ra`. Lépések, ebben a sorrendben, minden utasítás után `;--> statement-breakpoint`:
1. `ALTER TABLE "csomag" ADD COLUMN IF NOT EXISTS "forras_max" integer;`
2. `INSERT INTO "csomag" ("kod", "modulok", "forras_max") VALUES ('radar', ARRAY['hirfigyelo'], 5), ('studio', ARRAY[]::text[], NULL), ('newsroom', ARRAY[]::text[], NULL), ('agency', ARRAY[]::text[], NULL) ON CONFLICT ("kod") DO UPDATE SET "modulok" = EXCLUDED."modulok", "forras_max" = EXCLUDED."forras_max";`
3. `ALTER TABLE "szervezet" ALTER COLUMN "csomag_kod" SET DEFAULT 'radar';`
4. `UPDATE "szervezet" SET "csomag_kod" = 'radar' WHERE "csomag_kod" = 'pilot';`
5. A `pilot` sor MARAD (nem törlünk), de a `forras_max`-a is 5: `UPDATE "csomag" SET "forras_max" = 5 WHERE "kod" = 'pilot';`
6. Feliratok (`INSERT INTO "felirat" … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();`):
   - `csomag.radar_nev`: „Radar” · „Radar” · „Radar”
   - `csomag.radar_megj`: „Próbaidőszak — a Hírek modul, ár és fizetés nélkül” · „Perioadă de probă — modulul Știri, fără preț și plată” · „Trial period — the News module, without price or payment”
   - `csomag.studio_nev`: „Studio” ×3 · `csomag.newsroom_nev`: „Newsroom” ×3 · `csomag.agency_nev`: „Agency” ×3
   - `csomag.studio_megj`, `csomag.newsroom_megj`, `csomag.agency_megj`: „Később érhető el” · „Disponibil mai târziu” · „Available later”
   - `csomag.probaidoszak_cimke`: „próbaidőszak” · „perioadă de probă” · „trial”
   - `hf.forras_szamlalo`: „{n} oldal az {m}-ből” · „{n} site din {m}” · „{n} of {m} sites”
   - `hf.forras_korlat_mondat`: „A próbaidőszakban {m} oldalt figyelhetsz.” · „În perioada de probă poți urmări {m} site-uri.” · „During the trial you can monitor {m} sites.”

### 5. TELJES: `apps/web/app/api/hirfigyelo/forrasok/route.ts` (mellékelve)
- `GET`: a válasz `{ hirfigyelo: { forrasok, forras_max } }`, ahol `forras_max` a `szervezetCsomag(eredmeny.szervezet.id)` (`../../../../csomag`) `forras_max` mezője (hiba esetén null — `catch`).
- `POST`: a `forrasHozzaad` ELŐTT: `const cs = await szervezetCsomag(eredmeny.szervezet.id).catch(() => null);` — ha `cs?.forras_max` szám, és `(await k.tar.forrasok(eredmeny.szervezet.id)).length >= cs.forras_max` → `return hiba({ hiba: "FORRAS_KORLAT" }, 403);` (megjegyzés: `// F9-A8: a csomag forrás-korlátja — a próbaidőszakban 5`).

### 6. TELJES: `apps/web/app/hirfigyelo/beallitas/Forrasok.tsx` (mellékelve)
- Új állapot `forrasMax: number | null` (kezdetben null); a `betolt()` a GET válaszából `v.torzs.forras_max ?? null`-t teszi bele (a típus: `hfKeres<{ forrasok: Forras[]; forras_max?: number | null }>`).
- A lista fölé (a csoportok ELŐTT, ha `forrasMax !== null && forrasok !== null`) egy sor: `<div className="km-hf-be-megj">{t("hf.forras_szamlalo", { n: forrasok.length, m: forrasMax })}</div>`.
- A hozzáadó blokk (`szerkesztheto && …`) feltétele bővül: ha `forrasMax !== null && forrasok !== null && forrasok.length >= forrasMax`, a blokk HELYETT egy mondat: `<div className="km-hf-be-uzenet" data-fajta="info">{t("hf.forras_korlat_mondat", { m: forrasMax })}</div>`.
- A hozzáadás 403 `FORRAS_KORLAT` válaszára: `setHozzaadHiba(null)` és `void betolt()` (a lista újratöltése mutatja a mondatot). Minden más változatlan.

### 7. TELJES: `apps/web/app/gephaz/Gephaz.tsx` (mellékelve)
A Csomag sor: `km-gh-sor-nev` = `{t("csomag.cim")}: {t(`csomag.${nezet.csomag.kod}_nev`)} ({t("csomag.probaidoszak_cimke")})`; `km-gh-sor-kov` = `t(`csomag.${nezet.csomag.kod}_megj`)`. A „még nem működik” (árazás) rész marad.

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; `pnpm tokenor` 0; a csomag-próbák zöldek. Az 5. forrás felvehető, a 6. nem (403 FORRAS_KORLAT), és a lap megmondja; a Beállítások lapon „Csomag: Radar (próbaidőszak)”; `GET /api/csomag` `kod: "radar"`, `forras_max: 5`. Add vissza: 2 RÉSZLET-fájl + 5 teljes fájl.
