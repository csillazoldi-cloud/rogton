# Feladat — ÉPÍTŐ (F9-A7): 48 órás szűrő — a 48 óránál régebbi cikkeket nem vizsgáljuk

TypeScript 7 strict, zod 4.5, vitest. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`. Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. A mag (`packages/news-monitor-core`) tiszta: nincs benne hálózat, tárolás, dátum-könyvtár — csak a beépített `Date`.

Két fajta kimenet van:
- TELJES fájl — a teljes tartalommal;
- RÉSZLET-fájl a nagy fájlokhoz (`_RESZLET-….md`): CSERE-blokkok, amiket a beépítő szó szerinti kereséssel alkalmaz. Alakja PONTOSAN:
```
### CSERE 1
--- RÉGI
<a mellékelt fájlból SZÓ SZERINT kimásolt, egyedi sorok>
--- ÚJ
<az új sorok>
--- VÉGE
```
A RÉGI blokknak betűre egyeznie kell a mellékelt fájllal, és csak egyszer szabad előfordulnia.

## Döntés (Vilmos, 2026-09-14) és MÉRT tények

- **A 48 óránál régebbi anyagokat nem vizsgáljuk.** Ahol nincs dátum, a cikk bekerül (nem dobjuk el vakon), de a futás végén a napló jelzi, hány ilyen volt.
- A gyűjtés a `folyamat.ts`-ben (mellékelt részlet): forrásonként `k.letolto(f)` → `letoltes.cikkek[]` (`{ cim, url, megjelenes: string | null, szoveg, nyelv }`; a `megjelenes` ISO-időbélyeg vagy null) → `kivonatKeszit(...)` → `k.tar.kivonatMent`. A futás „mostja” a `most: Date` változó; a futás végén `k.esemeny?.({ fajta: "futas_kesz", … })` megy ki, a `HirfigyeloEsemeny` típusnak van `reszlet?: string` mezője.
- A `futas.ts` (mellékelve, teljes) a futás tiszta szabályait tartja (`Futas` séma, `indithato`, `futasAtmenet`).
- A fixtúra és a mag próbái: `packages/news-monitor-core/probak/*.proba.ts` (vitest; a `futas.proba.ts` mellékelve mintának).

## Mit kell megírni

### 1. TELJES: `packages/news-monitor-core/src/futas.ts` (mellékelve)
A fájl végére:
```ts
/** F9-A7 (Vilmos döntése 2026-09-14): a 48 óránál régebbi cikkeket nem vizsgáljuk. */
export const HF_CIKK_MAX_KOR_ORA = 48;

/** A cikk kora a futás mostjához képest: "friss" (≤ 48 óra vagy a jövőben), "regi" (régebbi), "datum_nelkul" (nincs vagy értelmezhetetlen dátum). */
export function cikkFrissesseg(megjelenes: string | null, most: Date, maxOra: number = HF_CIKK_MAX_KOR_ORA): "friss" | "regi" | "datum_nelkul";
```
(Az értelmezhetetlen dátum = `Number.isNaN(new Date(megjelenes).getTime())` → "datum_nelkul".)

### 2. RÉSZLET: `_RESZLET-folyamat.md` (a mellékelt `folyamat.ts` részlethez)
- CSERE 1 — az import: a `import { … } from "./futas";` sorba (SZÓ SZERINT a mellékletből másold ki a mai import-sort) bekerül a `cikkFrissesseg`.
- CSERE 2 — a számlálók: a `let felbeszakadt = false; // …` sor UTÁN két új sor: `let regiKihagyva = 0; // F9-A7: 48 óránál régebbi cikkek, kihagyva` és `let datumNelkul = 0; // F9-A7: dátum nélküli cikkek — bekerülnek, de a napló jelzi`.
- CSERE 3 — a cikk-ciklusban a `if (!cikk.cim.trim()) continue; // cím nélkül nem cikk …` sor UTÁN:
```ts
      const frissesseg = cikkFrissesseg(cikk.megjelenes, most);
      if (frissesseg === "regi") { regiKihagyva += 1; continue; } // F9-A7: a 48 óránál régebbi cikket nem tároljuk és nem értékeljük
      if (frissesseg === "datum_nelkul") datumNelkul += 1;
```
- CSERE 4 — a futás végén a `futas_kesz` esemény: `k.esemeny?.({ fajta: "futas_kesz", szervezet_id: szervezetId, futas_id: futasId, uj_talalatok: ujKartyak });` helyett ugyanez egy `reszlet` mezővel: `...(regiKihagyva > 0 || datumNelkul > 0 ? { reszlet: `regi_kihagyva=${regiKihagyva} datum_nelkul=${datumNelkul}` } : {})`.

### 3. TELJES próba: `packages/news-monitor-core/probak/frissesseg.proba.ts`
vitest; `cikkFrissesseg` a `../src/futas`-ból. Esetek: 47 órás → "friss"; 49 órás → "regi"; pontosan 48 óra → "friss"; jövőbeli → "friss"; null → "datum_nelkul"; "nem dátum" → "datum_nelkul"; a `maxOra` paraméter tiszteletben tartva (24-gyel a 30 órás "regi"). Plusz egy futás-próba a `futas.proba.ts` mintájára, ha abban van a teljes `futasInditas`-t hajtó minta (mellékelve): egy forrás három cikkel — friss (most−1 óra), régi (most−72 óra), dátum nélküli — a futás után a tárban KÉT kivonat van (a régi nincs), és a `futas_kesz` esemény `reszlet`-je `regi_kihagyva=1 datum_nelkul=1`. Ha a mintában nincs ilyen teljes futás-próba, ezt a részt hagyd ki, és írd a válasz végére egy sorban: „futás-próba: nincs minta”.

### 4. RÉSZLET: `_RESZLET-beallitas.md` (a mellékelt `Beallitas.tsx` részlethez)
- CSERE 1: a `<Forrasok szerkesztheto={szerkesztheto} napiFigyeles={beallitas.idozites.mod === "napi"} />` sor UTÁN egy sor: `          <div className="km-hf-be-megj">{t("hf.korlat_48h")}</div>` (megjegyzés fölé: `{/* F9-A7: a 48 órás korlát kimondva */}`).

### 5. TELJES migráció: `apps/web/adatbazis/migraciok/0075_f9_a7_48h_felirat.sql`
Fejléc: `-- F9-A7: a 48 órás korlát mondata a beállítás lapon`. `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();`:
- `hf.korlat_48h`: hu „Az elmúlt 2 nap híreit nézzük.” · ro „Ne uităm la știrile din ultimele 2 zile.” · en „We look at the news from the last 2 days.”

## Elfogadás (a beépítő méri)
A mag próbái zöldek (`pnpm --filter ./packages/news-monitor-core proba`), `pnpm tipus` zöld; próbafutás után nincs 48 óránál régebbi cikk a listán. Add vissza: futas.ts, _RESZLET-folyamat.md, frissesseg.proba.ts, _RESZLET-beallitas.md, 0075 migráció.
