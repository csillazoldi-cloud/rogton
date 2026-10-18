# Feladat — ÉPÍTŐ (F10-M1): a hír címe a beállított nyelven, és a hír három olvasata (mit tehetsz vele · a cégednek · a vevőidnek) — a mag és a prompt

Vilmos döntése (2026-09-16, R-9 rajz): a Hírek lapon és a Kezdőlapon a cím a BEÁLLÍTOTT tartalomnyelven áll (magyar), alatta halványan az eredeti; a kártyán a leghangsúlyosabb sor az, hogy MIT TUD KEZDENI a hírrel a felhasználó; a hír részleteiben három doboz: „A cégednek", „A vevőidnek", „Egy tartalom, amit ma megírhattok". Mindez EGY AI-hívásból jön (a relevancia-értékelésből), nincs külön fordító hívás.

TypeScript 7 strict, zod 4.5, vitest. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`. Magyar azonosítók és megjegyzések. A mag (`packages/news-monitor-core`) tiszta: nincs hálózat, tárolás. TELJES fájl, ahol ezt írom; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE` blokkok; a RÉGI SZÓ SZERINT a mellékletből és egyedi — ha egy sor többször áll a fájlban, vegyél hozzá szomszédos sorokat) a nagy fájlokhoz.

## MÉRT tények (2026-09-16)
- `Ertekeles` (talalat.ts, mellékelve): fontossag, temacimke, miert (max 300), indoklas (max 800), osszefoglalo (max 400), szabaly_verzio, ertekelve, csonkolt_alapjan. A `Talalat.ertekeles` jsonb-ként tárolódik a hoston (nincs oszloponkénti séma) — NEM kell migráció az új mezőkhöz.
- `RelevanciaValasz` (ai.ts, mellékelve) ugyanezek a mezők. A `relevanciaSzelidit` (szelidit.ts, mellékelt részlet) a szöveges mezőket vágja.
- `kartyakEpit` (kartya.ts, mellékelve) a `Kartya`-t a fő találat értékeléséből tölti; `cim` a kivonat címe.
- `folyamat.ts`-ben KÉT helyen épül `talalat.ertekeles = { … }` a válaszból (a napi futásban és az `ertekelesUjra`-ban, mellékelt részletek). Az `ertekelesUjra` ma CSAK a `fuggoben` találatokat értékeli újra.
- A prompt (`hf_relevancia.hu.md`, mellékelve) v6; `{{nyelv}}` a beállított tartalomnyelv neve.
- A host promptépítője (`apps/web/hirfigyelo/ai.ts`, mellékelt részlet): `maxKiToken = 1000` a relevanciánál.
- A Kezdőlap 3 címe: `apps/web/kezdolap/index.ts` (mellékelt részlet) `elso_cimek: { talalat_id, cim, kategoria }[]`, a típus `apps/web/kezdolap/tipusok.ts` 31. sora (mellékelve).

## Mit kell megírni

### 1. TELJES: `packages/news-monitor-core/src/talalat.ts`
Az `Ertekeles` sémába a `csonkolt_alapjan` után három VÁLASZTHATÓ mező (a régi, tárolt értékelések nem tartalmazzák — ezért `.optional()`, nem `.default`):
```ts
  /** F10-M1: a cikk címe a beállított tartalomnyelven (a modell fordítja; ha a cím már azon a nyelven van, ugyanaz) */
  cim_forditott: z.string().trim().max(200).optional(),
  /** F10-M1: mit jelent ez a hír a szervezetnek (pénz, vevők, kötelezettség) — „A cégednek" doboz; háttérhírnél üres */
  cegednek: z.string().trim().max(300).optional(),
  /** F10-M1: mit jelent a szervezet vevőinek/közönségének — „A vevőidnek" doboz; háttérhírnél üres */
  vevoidnek: z.string().trim().max(300).optional(),
```
Más nem változik.

### 2. TELJES: `packages/news-monitor-core/src/ai.ts`
`RelevanciaValasz`: ugyanez a három mező, de `.default("")`-tal (a modell válaszában lehetnek üresek): `cim_forditott: z.string().trim().max(200).default("")`, `cegednek: z.string().trim().max(300).default("")`, `vevoidnek: z.string().trim().max(300).default("")`. Más nem változik.

### 3. TELJES: `packages/news-monitor-core/src/kartya.ts`
`Kartya` új mezők a `cim` után: `cim_forditott: z.string()` (üres, ha nincs), `cegednek: z.string()`, `vevoidnek: z.string()`. A `kartyakEpit` tölti: `cim_forditott: foTalalat.ertekeles?.cim_forditott ?? ""`, `cegednek: foTalalat.ertekeles?.cegednek ?? ""`, `vevoidnek: foTalalat.ertekeles?.vevoidnek ?? ""`. Megjegyzés a mezők fölé: `// F10-M1: a cím a beállított nyelven + a hír két olvasata (a cégednek · a vevőidnek)`. Más nem változik.

### 4. RÉSZLET: `_RESZLET-folyamat.md` (a mellékelt folyamat-részletekhez)
- CSERE 1 és CSERE 2: MINDKÉT `talalat.ertekeles = { … }` blokkban az `osszefoglalo: r.osszefoglalo,` sor után: `          cim_forditott: r.cim_forditott, cegednek: r.cegednek, vevoidnek: r.vevoidnek, // F10-M1`. A két blokk csak az `ertekelve:` sorában tér el (`most.toISOString()` ill. `k.most().toISOString()`) — a RÉGI blokkba vedd bele az `osszefoglalo: r.osszefoglalo,` sortól az `ertekelve: …` sorig terjedő 3 sort, hogy egyedi legyen.
- CSERE 3: az `ertekelesUjra`-ban a `const fuggoben = talalatok.filter((t) => t.ertekeles_allapot === "fuggoben");` sor helyett:
```ts
  // F10-M1: a függők mellett azok a kész értékelések is, amelyekből még hiányzik a fordított cím (a mező előtti futásokból) — legfeljebb HF_NAPI_CIKK darab
  const fuggoben = [
    ...talalatok.filter((t) => t.ertekeles_allapot === "fuggoben"),
    ...talalatok.filter((t) => t.ertekeles_allapot === "kesz" && !t.ertekeles?.cim_forditott),
  ].slice(0, HF_NAPI_CIKK);
```
(`HF_NAPI_CIKK` a fájlban már létezik — a mellékelt részletben használva.)

### 5. RÉSZLET: `_RESZLET-szelidit.md` (a mellékelt szelidit-részlethez)
A `relevanciaSzelidit`-ben az `indoklas` vágása után: `  if (typeof ki.cim_forditott === "string") ki.cim_forditott = szovegRovidit(ki.cim_forditott.trim(), 200);\n  if (typeof ki.cegednek === "string") ki.cegednek = szovegRovidit(ki.cegednek.trim(), 300);\n  if (typeof ki.vevoidnek === "string") ki.vevoidnek = szovegRovidit(ki.vevoidnek.trim(), 300);` (megjegyzés: `// F10-M1`).

### 6. TELJES: `packages/news-monitor-promptok/promptok/hf_relevancia.hu.md`
A mellékelt v6-ból v7: fejléc `v7 · 2026-09-16 · F10-M1: a cím a beállított nyelven; a „miert" = mit tehetsz vele; két új olvasat (cegednek, vevoidnek)`. Változások:
- A JSON-alak: `{"osszefoglalo": "…", "cim_forditott": "…", "fontossag": …, "temacimke": …, "miert": "…", "cegednek": "…", "vevoidnek": "…", "indoklas": "…"}`.
- Új mezőleírás az „osszefoglalo" után: `- "cim_forditott": a cikk CÍME {{nyelv}} nyelven, max 120 karakter — hű fordítás, nem új cím; a tulajdonneveket, cégneveket nem fordítod; ha a cím már {{nyelv}} nyelvű, változatlanul másolod.`
- A „miert" leírása ÚJ: `- "miert": EGY mondat, max 200 karakter, az olvasónak címezve, többes szám második személyben: MIT TEHET ezzel a hírrel a szervezet — egy konkrét bejegyzés-, akció- vagy teendő-ötlet (pl. „Írhattok arról, mit jelent a két év díjmentes számla egy kis pékségnek.", „Kínálhattok reggeli csomagot a szülőknek 7 és 8 között."). Nem az, hogy miért fontos — az a "cegednek".`
- Új: `- "cegednek": EGY-KÉT mondat, max 300 karakter: mit jelent ez a hír a szervezetnek — pénz, vevők, kötelezettség, határidő. Konkrétan, a profil adataiból.` és `- "vevoidnek": EGY-KÉT mondat, max 300 karakter: mit jelent a szervezet vevőinek vagy közönségének (a profil "celkozonseg" mezője). Ha nincs rájuk hatása, ezt mondd ki egy mondatban.`
- Háttérhírnél: a „miert" marad PONTOSAN „Háttérhír; most nem kell tennetek semmit." (többes szám!), a "cegednek" és a "vevoidnek" ÜRES string.
- A tiltott szavak szabálya (kategórianevek, „beállítás", „cél") az új mezőkre is vonatkozik; a `{{nyelv}}` szabály a négy szöveges mezőre + a cim_forditott-ra.
- Minden más mondat (közérthetőség, fontosság-küszöb, csonkolt, ADAT-védelem) SZÓ SZERINT marad — a `{{nyelv}}` helyek és a `<<ADAT …>>` bekezdés is.

### 7. RÉSZLET: `_RESZLET-web-ai.md` (a mellékelt web ai.ts részlethez)
`maxKiToken = 1000;` → `maxKiToken = 1400;` a relevancia ágon, a megjegyzés végére: `; F10-M1: három új szöveges mező (cim_forditott, cegednek, vevoidnek) → 1400`.

### 8. RÉSZLET: `_RESZLET-kezdolap.md` (a mellékelt kezdolap index + tipusok részlethez)
- `tipusok.ts`: `elso_cimek: { talalat_id: string; cim: string; kategoria: … }[]` → `elso_cimek: { talalat_id: string; cim: string; cim_eredeti: string | null; kategoria: … }[]` (megjegyzés: `// F10-M1: cim = a beállított nyelven, ha van fordítás; cim_eredeti = az eredeti, ha eltér`).
- `index.ts`: `.map((k) => ({ talalat_id: k.fo_talalat_id, cim: k.cim, kategoria: k.fontossag ?? "hatter" }))` → `.map((k) => ({ talalat_id: k.fo_talalat_id, cim: k.cim_forditott || k.cim, cim_eredeti: k.cim_forditott && k.cim_forditott !== k.cim ? k.cim : null, kategoria: k.fontossag ?? "hatter" }))`.

### 9. Próbák
- TELJES: `packages/news-monitor-core/probak/ai.proba.ts` (mellékelve) + egy eset: a relevancia-válasz a három új mezővel (`cim_forditott: "Díjmentes céges számla két évig"`, `cegednek: "x"`, `vevoidnek: "y"`) → `ok: true`, és az `ertek` tartalmazza őket; egy eset a mezők NÉLKÜL → `ok: true`, és `cim_forditott === ""`.
- TELJES: `packages/news-monitor-core/probak/kartya.proba.ts` (mellékelve) + egy eset: az értékelésben `cim_forditott: "Fordított cím"` → a kártya `cim_forditott === "Fordított cím"`, a `cim` az eredeti marad; értékelés nélkül `cim_forditott === ""`.
- A promptok próbája (`packages/news-monitor-promptok/probak/…`, mellékelt részlet) csak azt nézi, hogy a `{{nyelv}}` helyek kitöltődnek — ne írd át.

## Elfogadás (a beépítő méri)
A mag 223+ próbája zöld; `pnpm tipus` zöld; a promptok próbája zöld. Add vissza: talalat.ts, ai.ts, kartya.ts, _RESZLET-folyamat.md, _RESZLET-szelidit.md, hf_relevancia.hu.md, _RESZLET-web-ai.md, _RESZLET-kezdolap.md, ai.proba.ts, kartya.proba.ts.
