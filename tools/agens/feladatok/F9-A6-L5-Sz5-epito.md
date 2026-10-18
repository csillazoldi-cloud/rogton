# Feladat — ÉPÍTŐ (F9-A6 + F9-L5 + F9-Sz5): elakadt értékelés a kártyán · a meghívó teljes címe · a felület nyelve egy helyen

TypeScript 7 strict, Next.js 16, React 19. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret — csak a meglévő CSS-osztályok. Felirat CSAK kulcsból, három nyelven. Magyar azonosítók és megjegyzések, mint a mellékelt fájlokban. TELJES fájlt adsz vissza, ahol ezt írom; RÉSZLET-fájlt (`_RESZLET-….md`, CSERE-blokkok) a nagy fájlhoz:
```
### CSERE 1
--- RÉGI
<a mellékelt fájlból SZÓ SZERINT kimásolt, egyedi sorok>
--- ÚJ
<az új sorok>
--- VÉGE
```

## MÉRT tények (2026-09-14/15, a teszten)

A-6. Egy AI-hiba után a hír napokig „függőben” (`kartya.ertekeles_allapot === "fuggoben"`); a jelzés a lista tetején áll (`km-hf-at-figyelmeztetes`: `hf.stAiPend` vagy `hf.ertekeles_keszul {n}`), a kártyán semmi nem mondja meg, melyik hír érintett; teendő nincs. Létezik az újraértékelés végpontja: `POST /api/hirfigyelo/ertekeles-ujra` (szerkesztő/tulajdonos; 202 + `{ hirfigyelo: { sor } }`, 409 FUT_MAR ha fut valami) — a sor tételére a `varjSor(sorId)` segéd vár (a fájl már importálja), utána `ujraBetolt()`.
L-5. A meghívó létrehozása (`POST /api/tagok/meghivo`) a `link` mezőben `/meghivo/<jegy>`-et ad; a Tagok lap ezt mutatja és másolja. A T-30 javítása óta van `nyilvanosCim(keres, "/út")` segéd (`apps/web/hitelesites/nyilvanos-cim.ts`, mellékelve), ami a proxy fejléceiből abszolút, nyilvános URL-t ad.
Sz-5. A fejléc nyelvválasztója (`Nyelvvalaszto.tsx`, a `useFeliratok().nyelv` = a süti) és a Saját fiók „felület nyelve” mezője (`SajatFiok.tsx`, `nezet.fiok.nyelv`) MINDKETTŐ a `POST /api/nyelv`-re ír (süti + fiók), de a MEGJELENÍTETT érték két forrásból jön: a süti és a fiók mezője eltérhet (belépés előtt választott nyelv; másik böngésző). A belépés (`POST /api/fiok/belepes`) ma nem állítja a nyelv-sütit a fiók nyelvére. A süti neve `NYELV_SUTI` (`@km/design-system`), alakja a `/api/nyelv` útvonalban: `${NYELV_SUTI}=${nyelv}; Path=/; SameSite=Lax; Max-Age=${60*60*24*365}${secure}` (`secure` = `; Secure` production-ben). A belépett fiók a `aktualisFiok(token)`-ből (`../../../../hitelesites`) jön, benne `nyelv: "hu" | "ro" | "en" | null`.

## Mit kell megírni

### 1. TELJES: `apps/web/app/hirfigyelo/Attekintes.tsx` (mellékelve; csak az alábbi változások)
- Új `useCallback` `ertekelesUjra`: `POST /api/hirfigyelo/ertekeles-ujra` (`hfKeres`), ha 202 és `v.torzs.sor?.id` → `setUjraFut(true)`; `varjSor(id)` után `setUjraFut(false)` és `void ujraBetolt()`; 409 vagy más → `setUjraFut(false)` (nincs külön hibaüzenet). Állapot: `const [ujraFut, setUjraFut] = useState(false)`.
- A lista tetején a `km-hf-at-figyelmeztetes` doboz: `keretKimerult` → marad; különben ha `fuggoDb > 0` → CSAK a szám: `t("hf.ertekeles_hianyzik_n", { n: fuggoDb })`; ha `fuggoDb === 0` és `aiKieses` (a futás `ai_fuggoben`) → a mai `t("hf.stAiPend")`.
- A `Kartya` komponens (a `function Kartya({ kartya, … })`) új prop: `onUjraertekel?: () => void` és `ujraFut?: boolean`. Ha `kartya.ertekeles_allapot === "fuggoben"`: az összefoglaló helyén (ahol ma `kartya.osszefoglalo` áll — az üres is) egy sor `<div className="km-hf-at-kartya-osszefoglalo">{t("hf.kartya_nincs_osszefoglalo")}</div>`, alatta a gombok sorában (a meglévő `km-hf-at-kartya-gombok` elején) ha `szerep !== "nezo"` és `onUjraertekel`: `<button className="km-hf-at-gomb-ghost" onClick={onUjraertekel} disabled={ujraFut}>{ujraFut ? t("hf.osszefoglalo_ujra_fut") : t("hf.osszefoglalo_ujra")}</button>`. Az „Eredeti cikk” link a kártyán ma is elérhető a részletpanelben — a kártyán az első forrás URL-je: `<a href={elsoForras.url} target="_blank" rel="noopener noreferrer" className="km-hf-at-gomb-ghost">{t("hf.eredeti_cikk")}</a>` CSAK a függő kártyán, ha van `elsoForras`.
- A két helyen, ahol a `<Kartya …/>` renderelődik (`onNyit`-tal), add át: `onUjraertekel={() => void ertekelesUjra()}` és `ujraFut={ujraFut}`.
- Semmi más nem változik.

### 2. TELJES: `apps/web/app/api/tagok/meghivo/route.ts` (mellékelve)
`link: nyilvanosCim(keres, `/meghivo/${e.ertek.jegy}`).toString()` — az import `../../../../hitelesites/nyilvanos-cim`-ből; megjegyzés: `// F9-L5: a teljes, nyilvános cím (a proxy fejléceiből), nem a belső út`. Más nem változik.

### 3. TELJES: `apps/web/app/api/fiok/belepes/route.ts` (mellékelve)
A sikeres belépés válaszán (a `munkamenetSutiBeallit` után): `// F9-Sz5: a nyelv-süti a fiók nyelvére áll, hogy a fejléc és a Saját fiók ugyanazt mutassa` — `const fiok = await aktualisFiok(eredmeny.ertek.token).catch(() => null); if (fiok?.nyelv) { const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""; valasz.headers.append("set-cookie", `${NYELV_SUTI}=${fiok.nyelv}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`); }` — importok: `aktualisFiok` a `../../../../hitelesites`-ből, `NYELV_SUTI` a `@km/design-system`-ből. Más nem változik.

### 4. RÉSZLET: `_RESZLET-sajatfiok.md` (a mellékelt SajatFiok-részlethez)
- CSERE 1: `              value={nezet.fiok.nyelv ?? "hu"}` → `              value={nyelv} // F9-Sz5: a felület tényleges nyelve (ugyanaz, mint a fejlécé)` — a `nyelv` a fájlban már létezik (`const { t, nyelv } = useFeliratok();`).

### 5. TELJES migráció: `apps/web/adatbazis/migraciok/0076_f9_a6_elakadt_ertekeles.sql`
Fejléc: `-- F9-A6: az elakadt értékelés a kártyán szól, a lista tetején csak a szám`. `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();`:
- `hf.ertekeles_hianyzik_n`: hu „{n} hír értékelése hiányzik.” · ro „Lipsește evaluarea a {n} știri.” · en „{n} stories are missing their rating.”
- `hf.kartya_nincs_osszefoglalo`: hu „Ehhez a hírhez még nincs összefoglaló — az eredeti cikket elolvashatod.” · ro „Această știre nu are încă rezumat — poți citi articolul original.” · en „This story has no summary yet — you can read the original article.”
- `hf.osszefoglalo_ujra`: hu „Összefoglaló újrapróbálása” · ro „Reîncearcă rezumatul” · en „Retry the summary”
- `hf.osszefoglalo_ujra_fut`: hu „Az összefoglaló készül…” · ro „Rezumatul se pregătește…” · en „Preparing the summary…”
- `hf.eredeti_cikk`: hu „Eredeti cikk” · ro „Articolul original” · en „Original article”

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm hatar` 0; `pnpm tokenor` 0. Meg lehet mondani, melyik hír érintett; a gomb újraértékel; a Másolás `https://…/meghivo/…`-t ad; a fejléc és a Saját fiók ugyanazt a nyelvet mutatja. Add vissza: Attekintes.tsx, meghivo/route.ts, belepes/route.ts, _RESZLET-sajatfiok.md, 0076 migráció.
