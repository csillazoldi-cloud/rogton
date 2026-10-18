# Feladat — ÉPÍTŐ A (E-24): a Hírfigyelő ÁTTEKINTÉS lapja + a részletpanel a v7 prototípus szerint (Next 16, React 19)

A prototípus a FELÜLETI mérce: ami rajta van, az kell; ami nincs rajta, azt nem találjuk ki. Vasszabály: a képernyőn semmi nem lehet, ami nincs a rajzon.
Mellékelve: `proto-attekintes.html` (a prototípus HTML-je: az Áttekintés szakasz + a részletpanel — inline stílusokkal, `{{ }}` kötésekkel),
`proto-logika-attekintes.js` (a számított értékek: melyik állapotban mi látszik, a jelvények színei, a szűrők), `hf-feliratok-hu.json` (MINDEN felirat kulcsa
`hf.<kulcs>` néven — a `t("hf.stNew", { n })` így hívja; a szövegeket NE égesd be), `API-LAP.md` (a kiszolgáló válaszai), `kliens.ts` (kész: `hfKeres`, `varjSor`,
`idoRovid`, `nyelvNev`, `forrasNev`), `HirfigyeloKeret.tsx` + `hirfigyelo.css` (kész: a fejléc, fülek, profil-sor — a lapod ebbe kerül), `kartya.ts` (a `Kartya` típus),
`futas.ts`, `beallitas.ts`, `tema-page.tsx.minta` (egy meglévő lap kiszolgálói része: belépés, szervezet), `tema.css.minta` (a stílus-konvenció), `Nyelvvalaszto.tsx`.

Készítsd el (add vissza minden fájlt teljes egészében):

1. **`apps/web/app/hirfigyelo/page.tsx`** (kiszolgálói, a `tema-page.tsx.minta` mintájára): `cookies` → `aktualisFiok` (nincs → `redirect("/belepes")`), `aktualisSzervezet`
   (nincs → `/szervezet/uj`), `profilBetolt(szervezet.id)` (nincs → `redirect("/onboarding/1")` — a modul a közös profilra épül), `generateMetadata = () => oldalcim("hf.oldalcim")`,
   `dynamic = "force-dynamic"`, importálja a `../_kozos/fiok.css`-t és a `./attekintes.css`-t, és `<Attekintes profilNev={profil.nev} szerep={szerep} />`-et ad
   (a `szerep` a `fiok.szervezetek.find(sz => sz.id === szervezet.id)?.szerep ?? "nezo"`). Importok: `../../hitelesites` (`aktualisFiok`, `aktualisSzervezet`), `../../profil` (`profilBetolt`),
   `../../nyelv/oldalcim`, `@km/contracts` (`MUNKAMENET_SUTI`).
2. **`apps/web/app/hirfigyelo/Attekintes.tsx`** (`"use client"`): a `HirfigyeloKeret aktiv="attekintes"` belsejében a prototípus HF-I szakasza, 1:1:
   - **Betöltés:** mountkor párhuzamosan `GET attekintes` + `GET beallitas` + (ha van értékelt találat) `GET osszkep`. Hiba → `km-hf-uzenet[data-fajta=hiba]` a `hf.betoltes_hiba`
     szöveggel + `hf.ujra` gomb (újratölt). 401 → `router.push("/belepes")`.
   - **Első használat** (`beallitas.aktiv === null`): a prototípus üvegkártyája (`ovFirstTitle`, `ovFirstBody`, CTA `ovFirstCta` → `<a href="/hirfigyelo/beallitas">`).
   - **StatusStrip** (a `notFirstUse` ág): pont (zöld `--ok-strong`; sárga `--warn`, ha `forrasHibak` nem üres az utolsó futásban) + `stLastRun {t}` (az `utolsoSikeres.veg` vagy
     `.kezdet` `idoRovid`-dal) vagy `stNever`; `·`; `stNextRun {t} ({tz})` ha az aktív beállítás `idozites.mod === "napi"` (`t` = a `kovetkezo` ISO `idoRovid`-dal, `tz` = `idozites.idozona`),
     különben `stNextManual`; `·`; `stNew {n}` (n = `ujDb`; ha 0 → `stNoNew`, halvány színnel); ha az utolsó futásnak volt hibás forrása → `⚠ stPartialShort {n}` gomb
     (→ `/hirfigyelo/beallitas`); jobbra `stRunNow` gomb (csak ha nem fut és a szerep nem `nezo`) — kattintásra `POST futas {}` → 202 → a sáv „fut” állapotba (pörgő + `stRunning`,
     `aria-live="polite"`), `varjSor(sor.id)` → a végén ÚJRATÖLT (attekintes + osszkep); 409 FUT_MAR → fut-állapot és várakozás; más hiba → `hf.futas_hiba` üzenet.
     Ha betöltéskor `sorban` ≠ null → eleve fut-állapot és `varjSor(sorban.id)`.
   - **AI-kiesés sáv** (`stAiPend`, `--warn`): ha az utolsó futás `allapot === "ai_fuggoben"` VAGY van `ertekeles_allapot === "fuggoben"` találat. Keret-kimerülés (`keret_kimerult`
     találat): ugyanez a sáv a `hf.keret_kimerult` szöveggel (D-12: érthetően látszik).
   - **Nincs új találat** doboz (`ovNoNewTitle`/`ovNoNewBody`, zöld pipa): ha van sikeres futás és `ujDb === 0` és nincs kártya az aktuális szűrőben — a prototípus szerint
     akkor, ha az utolsó futás 0 újat hozott (`utolsoSikeres.uj_talalatok === 0`) és nem fut.
   - **Összkép** (`ovSummaryTitle`, jelvény `ovSummaryBadge`, szöveg = `osszkep.szoveg`, alatta `ovSummaryCaveat`): csak ha az `osszkep` betöltődött (200) és nincs AI-kiesés.
     Ha `osszkep.bizonytalan`, a caveat kiemelve (`--warn` szín) — a prototípus feliratával.
   - **Szűrők** (`role="tablist"`): `fNew` (megtekintes uj ÉS nem elrejtett), `fSaved` (jeloles mentett), `fHidden` (jeloles elrejtett), `fAll` (minden, ami nem elrejtett — a prototípus
     „Mind”-je a nem elrejtetteket mutatja) — a kártya `megtekintes`/`jeloles` mezőiből. `hiddenNote` doboz, ha az ülésben rejtettél el és a szűrő nem „Elrejtett”. Üres szűrő → `emptyFilter`.
   - **HitCard** kártyánként (a `kartyak` tömb): fontosság-jelvény (`impHigh/impMed/impLow` — színek: fontos `--src-ai-bg`/`--src-ai`, érdekes `--src-web-bg`/`--src-web`,
     háttér `--src-empty-bg`/`--src-empty`; ha `ertekeles_allapot !== "kesz"` → „…” jelvény `--src-empty`-vel és a „miért” helyett `hf.ertekeles_fuggoben`), témacímke
     (`topicBrand/topicPro/topicIdea` ← `sajat_megjelenes/szakmai/tartalomotlet`), meta = források nevei (`forrasNev(forras_cim)`, ` · `-tal) + ` · ` + az első forrás `megjelenes`
     `idoRovid`-dal, jobbra `verMadeWith {v}` (`szabaly_verzio`); cím; összefoglaló; „`whyLabel` miért” doboz; ha `forras_szam > 1` → `⧉ groupN {n}`; gombok: `save`/`✓ saved`
     (POST jelol mentett|nincs), `notRel` (POST jelol elrejtett → a kártya az „Elrejtett” szűrőbe kerül, `hiddenNote` bekapcsol) vagy `restore` (elrejtettnél, POST jelol nincs),
     `details →` (részletpanel). A jelölés a FŐ találatra (`fo_talalat_id`) megy; a válasz után a kártya frissül (optimista frissítés is jó, hibánál visszaáll).
     `csonkolt_alapjan` → a kártya alján a `hf.csonkolt` megjegyzés (a 3d. pont: a részletpanel is jelzi).
   - **DetailPanel** (`aside`, fix jobb oldalon `width:min(440px,100vw)`, telefonon teljes szélesség, `aria-label`, Escape zár, a lista pozíciója és a szűrő megmarad): fontosság +
     témacímke + `verMadeWith`; cím; `detSummary · sumLangTag {l}` (l = az első forrás nyelve `nyelvNev`-vel) + az `indoklas` (ha üres, az `osszefoglalo`); `detWhy` + miért; `detSources`
     lista: forrásonként `forrasNev` + `idoRovid(megjelenes)` · `srcLangTag {l}` + `detOrig ↗` link (az `url`-re, új fülön); **tartalomötlet**: ha nincs → `✦ detIdeaBtn` gomb
     (POST tartalomotlet; közben `detIdeaWorking` és letiltva; 429 → `hf.otlet_keret`, 502/egyéb → `hf.otlet_hiba` üzenet a gomb alatt), ha van → az AI-javaslat doboz
     (`detIdeaLabel · ideaLangTag {l}`, a szöveg dőlten, `detIdeaNote`). Néző szerepnél a gomb nem látszik (nincs joga). A panel megnyitása `POST megtekint`-et küld, ha a kártya
     `megtekintes === "uj"` (a 3c. pont: a részlet megnyitása teszi megtekintetté) — a kártya „új” számlálója ennek megfelelően csökken (`ujDb` − 1 helyben).
3. **`apps/web/app/hirfigyelo/attekintes.css`**: a prototípus inline stílusai osztályokká (`km-hf-at-…`), CSAK tokenekkel (`var(--…)` — színre, betűméretre, lekerekítésre kötelező;
   px csak térközre/szélességre). A h1 24px → `var(--fs-h2)`; a részletpanel címe 17px → `var(--fs-title)`. Az animációk: `km-hf-fade-up`, `km-hf-porog` (a közös CSS-ben).
   Telefon (`max-width: 720px`): a panel `width: 100vw`, a sáv elemei tördelődnek, a gombok `min-height: var(--control-min)`.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React 19, Next 16 (`useRouter` a `next/navigation`-ből); `useFeliratok()` a `../../nyelv/kliens`-ből
(`t(kulcs, { n })`, `nyelv`); a `hfKeres`-t használd (nem nyers `fetch`); NINCS beégetett szín/méret/felirat; magyar nevek és megjegyzések; `data-screen-label="HF-I Áttekintés"` a szekción,
`data-screen-label="HF-Részletpanel"` a panelen (a fordított ellenőrzéshez). Nincs új npm-függőség.
