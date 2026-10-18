# Feladat — ÉPÍTŐ (E-26): a Hírfigyelő FINOMHANGOLÁS lapja a v7 prototípus szerint (Next 16, React 19)

A prototípus a FELÜLETI mérce: ami rajta van, az kell; ami nincs rajta, azt nem találjuk ki; minden vezérlő mögött VALÓDI gépezet (API) van.
Mellékelve: `proto-finomhangolas.html` (a HF-III szakasz inline stílusokkal, `{{ }}` kötésekkel), `proto-logika-finomhangolas.js` (mikor mi látszik; a `chip`, `ghost`,
`primary` stílusok a beállítás-logikából), `hf-feliratok-hu.json` (a feliratok `hf.<kulcs>` néven; a mellékletben nem szereplő, de létező kulcsok: `hf.mintaLejart`,
`hf.verEredet_ai`, `hf.verEredet_kezi`, `hf.verEredet_javaslat`, `hf.verEredet_visszaallitas`, `hf.sugKeszul`, `hf.sugHiba`, `hf.cmpHiba`, `hf.sugTemak {temak} {kizarasok}`,
`hf.sugBasisSor {nem} {fontos}`, `hf.nincs`, `hf.betoltes`, `hf.betoltes_hiba`, `hf.ujra`, `hf.csakNezo`), `API-LAP.md` (a kiszolgáló — az „E-26” szakasz a lényeg),
`kliens.ts` (`hfKeres`, `idoRovid`, `forrasNev`), `HirfigyeloKeret.tsx` + `hirfigyelo.css` (kész váz; `aktiv="finomhangolas"`; `LAP_UT`), `visszajelzes.ts`, `minta.ts`,
`folyamat-finomhangolas.reszlet.ts` (a `GET finomhangolas` válaszának típusa), `beallitas.css.minta` (a stílus-konvenció: `km-hf-be-…`), `hirfigyelo-felulet.proba.ts` (minta).

A prototípus ↔ a valódi adatok (ezt a leképezést tartsd):
- **tuneEmpty**: nincs `minta` ÉS nincs `visszajelzes` → a szaggatott doboz `tuEmpty` + `pSetup →` link (`/hirfigyelo/beallitas`). Különben tuneHasContent.
- **Cím-sor**: `tuTrialTitle {v}` (v = `minta.szabaly_verzio`, minta nélkül az aktív verzió), `tuTrialNote`. Ha `mintaLejart` → `km-hf-uzenet[data-fajta=figyelem]` a `hf.mintaLejart`
  szöveggel (D-12), a tételek maradnak, de a „Kipróbálom” letiltva.
- **tuneRows** = `tetelek`: fontosság-jelvény (mint az Áttekintésen: fontos `--src-ai-bg`/`--src-ai`, érdekes `--src-web-bg`/`--src-web`, háttér `--src-empty-bg`/`--src-empty`;
  értékeletlen → „…”), meta = `forrasNev(forras_cim)`, cím; gombok `fbImportant` / `fbNotRel` (chip-stílus, a bekapcsolt = a tétel LEGUTÓBBI visszajelzése:
  `visszajelzesek` szűrve `talalat_id`-re, `letrehozva` szerint a legutóbbi; `fajta` fontos → Fontos be; nem_relevans → Nem releváns be); `markYes` → `POST visszajelzes
  { talalat_id, fajta: "fontos" }`; `markNo` → `POST visszajelzes { talalat_id, fajta: "nem_relevans", okok: [] }` + megnyílik az ok-választó (`fbWhy` + 4 chip:
  `rOther`→`masik_ceg`, `rTopic`→`nem_ez_a_tema`, `rGeneric`→`tul_altalanos`, `rDup`→`ismetlodo`); ok-chip → `POST visszajelzes { talalat_id, fajta: "nem_relevans", okok: [ok] }`
  (új sor, a legutóbbi számít) és az ok-választó bezárul; `fbDone` (`fbThanks` zöld szöveg), ha van visszajelzés ÉS (fontos VAGY van ok). Néző: a gombok letiltva.
- **Javaslat** (`sugVisible`): a `javaslatok` közül a legutóbbi `fuggo` vagy `kiprobalt` állapotú, amelynek `szabaly_verzio` = az aktív verzió. Ha NINCS ilyen, és a még fel nem
  használt visszajelzések száma ≥ 2 (fel nem használt = az `id` nem szerepel egyetlen javaslat `mi_alapjan`-jában sem), a lap AUTOMATIKUSAN kér egyet: `POST javaslat {}` —
  közben `hf.sugKeszul` (pörgő), hibánál `hf.sugHiba` (csendes, a visszajelzések megmaradnak). A doboz: `✦ sugTitle`; `sugCurrent` = az AKTÍV beállítás tömör leírása
  (`hf.sugTemak` a témák neveivel és a kizárásokkal, `hf.nincs` ha üres); `sugProposed` = a javaslat `indoklas`-a + alatta a különbség (a `javasolt` témái/kizárásai, amelyek
  az aktívban nincsenek: „+ …”, amelyek eltűnnek: „− …”); `sugBasis` = `hf.sugBasisSor` (a `mi_alapjan` visszajelzései közül hány nem_relevans / fontos); `sugImpact` =
  `varhato_hatas`. Állapotok: `sugReady` (fuggo vagy kiprobalt, nincs friss összehasonlítás) → `sugTry` / `sugAccept` / `sugReject`; `sugTrying` → `POST javaslat/{id}/kiprobal`
  közben pörgő + `sugTrying`; `sugCompared` → `cmpTitleText` (`cmpTitle` — `cmpOld {v}` vs. `cmpNew`), sorok = `osszehasonlitas` (cím a `tetelek`-ből; `valtozas` elorebb →
  `↑ cmpKept` zöld, hatrebb → `cmpDown` szürke, valtozatlan → `cmpSame`), `cmpCaveat`, majd `sugAccept` / `sugReject`; 409 MINTA_LEJART → `hf.mintaLejart` üzenet a dobozban;
  más hiba → `hf.cmpHiba`. `sugAccept` → `POST javaslat/{id}/dont { dontes: "elfogad" }` → `✓ verApplied {v}` (v = `ujVerzio.verzio`), a doboz eltűnik, a verziólista frissül
  (ÚJRATÖLT: `GET finomhangolas`). `sugReject` → `dont { elvet }` → `rejected` doboz.
- **profileTouchOn**: ha a látható javaslat `profil_erintett` → a `profileTouch` doboz + `profileOpen →` link a `/fiok`-ra.
- **Verziók** (`verTitle`): a `verziok` csökkenő sorrendben: `v{verzio}`, leírás = `hf.verEredet_<eredet>` + ` · ` + `idoRovid(letrehozva)`, az aktívnál `verActive` jelvény,
  a többinél `restore` gomb → `POST beallitas/visszaallit { verzio }` → újratölt; `verHitNote` alul. Néző: nincs visszaállítás gomb.
- Betöltés: `GET finomhangolas` (hiba → `km-hf-uzenet[data-fajta=hiba]` + `hf.ujra`; 401 → `/belepes`); néző szerep → a `hf.csakNezo` figyelmeztetés felül.

Készítsd el (add vissza minden fájlt teljes egészében; TÖMÖR kód, egy `useState` a betöltött adatnak + néhány állapot; a komponens ≤ ~400 sor):
1. **`apps/web/app/hirfigyelo/finomhangolas/page.tsx`** — a Beállítás lap `page.tsx`-ének mintájára (belépés → `/belepes`, szervezet → `/szervezet/uj`, `profilBetolt` →
   `/onboarding/1`; `generateMetadata = () => oldalcim("hf.oldalcim")`; `dynamic = "force-dynamic"`; importok: `../../../hitelesites`, `../../../profil`, `../../../nyelv/oldalcim`,
   `@km/contracts` `MUNKAMENET_SUTI`; CSS: `../../_kozos/fiok.css`, `../finomhangolas.css`; `<Finomhangolas profilNev={profil.nev} szerep={szerep} />`).
2. **`apps/web/app/hirfigyelo/finomhangolas/Finomhangolas.tsx`** (`"use client"`): a fenti viselkedés; `data-screen-label="HF-III Finomhangolás"` a szekción; a szekció
   `max-width: 860px` (a prototípus szerint).
3. **`apps/web/app/hirfigyelo/finomhangolas.css`**: a prototípus inline stílusai osztályokká (`km-hf-fh-…`), CSAK tokenekkel (szín, betűméret, lekerekítés `var(--…)`; a h1 22px →
   `var(--fs-h2)`; a pörgő `border-radius: 50%; /* tokenőr: ok — kör alak */`); a chipek a prototípus `chip` stílusa (`data-be="true|false"`); telefonon a gombok
   `min-height: var(--control-min)`, a sorok tördelődnek.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React 19, Next 16; `useFeliratok()` a `../../../nyelv/kliens`-ből; a `HirfigyeloKeret` a
`../_kozos/HirfigyeloKeret`-ből, a `hfKeres`/`idoRovid`/`forrasNev` a `../_kozos/kliens`-ből; típusok a `@km/news-monitor-core`-ból (`Beallitas`, `BeallitasVerzio`,
`SzabalyJavaslat`, `Visszajelzes`, `Minta`, `FinomhangolasTetel`); NINCS beégetett szín/méret/felirat; magyar nevek és megjegyzések; nincs új npm-függőség.
