# Feladat — ÉPÍTŐ (E-19b): a modul folyamatai (`folyamat.ts`) + a minimális tesztalkalmazás (`apps/proba-host`)

Mellékelve: `HIRFIGYELO-SZERZODES.md` (a SPEC — a 2.12 pontot építed; a 2.1–2.11 már KÉSZ), és a kész mag forrásai:
`index.ts`, `host.ts`, `ai.ts`, `tar.ts`, `futas.ts`, `talalat.ts`, `dedup.ts`, `kivonat.ts`, `minta.ts`, `visszajelzes.ts`,
`beallitas.ts`, `forras.ts` (ezeket NE módosítsd — csak használd; ha valami hiányzik belőlük, a `folyamat.ts`-ben oldd meg és
jelöld `// SPEC-KÉRDÉS:`).

1. `packages/news-monitor-core/src/folyamat.ts` — a 2.12 tábla MINDEN függvénye a leírt szabályokkal (jog-ellenőrzés `jogosult()`-tal
   először; `NINCS_JOG`), az `index.ts`-be `export * from "./folyamat";` (ez az egyetlen engedett módosítás az index-ben — add vissza a
   teljes index.ts-t). A `figyelesFuttat` lépései a spec 1)–10) pontjai szerint, a napi korlát `HF_NAPI_CIKK = 60` exportált konstans.
   Az `ugyanaz` a gyanús párokra hívja az `ai("hf_ugyanaz_az_esemeny", …)`-t — mivel az `esemenybeSorol` szinkron `ugyanaz`-t vár,
   előbb gyűjtsd össze a gyanús párokat (`gyanusPar`), kérdezd meg az AI-t (soronként, `Promise` egymás után), majd egy
   `Map<"idA|idB", boolean>`-ból adj szinkron `ugyanaz`-t. Az AI-válaszokat MINDIG `aiValaszEllenoriz`-en át használd.
   Tiszta marad: nincs `Date.now()` (a `k.most()`), nincs véletlen (`k.idAdo()`), nincs I/O a paraméterként kapott csatlakozókon kívül.
2. `apps/proba-host/` — minimális tesztalkalmazás, NEM Next, csak Node + TypeScript:
   - `package.json` (`@km/proba-host`, private, type module, függőség: `@km/news-monitor-core` és `@km/contracts` workspace:*, `zod`; scriptek:
     `tipus`, `proba: "vitest run"`, `indit: "node --experimental-strip-types src/indit.ts"`; devDependency vitest 5.0.0), `tsconfig.json`
     (mint a csomagoké), `vitest.config.ts` (include `probak/**/*.proba.ts`).
   - `src/host.ts` — a HOST csatlakozói: `rogzitettProfil` (egy `SzervezetProfil` a `@km/contracts` sémája szerint kitöltve — „Minta Műhely”
     bútorműhely, hu+ro nyelvek, jóváhagyott arculat mezői kitöltve; parse-olva, hogy érvényes legyen), `kontextus` (tulajdonos, rögzített
     uuid-k), `rogzitettLetolto: Letolto` (két beépített forrás: `https://pelda.hu/feed` → 4 cikk, ebből 2 ugyanarról az eseményről más
     címmel; `https://hibas.pelda.hu/` → `{ ok: false, hibaOk: "időtúllépés" }`; minden más → `{ ok: false, hibaOk: "ismeretlen" }`),
     `tesztAi: AiHivo` (determinisztikus: relevancia a kivonat címéből — ha a témanév benne van → `fontos`, különben `hatter`;
     `ugyanaz_az_esemeny` → az ujjlenyomat vagy a cím első 3 szava szerint; `szabaly_javaslat` → az aktív beállítás + egy új kizárás a
     visszajelzés `sajat_indok`-jából; `osszkep` → a találat-azonosítókra hivatkozó rövid szöveg; `beallitas_javaslat` → a profil nevéből egy
     téma), `idAdo` számláló, `most` rögzített és léptethető.
   - `src/indit.ts` — végigviszi a folyamatot a konzolra írva (magyarul, röviden): beállítás mentése (ai_elokeszites) → forrás hozzáadás
     (3 cím: a jó, a hibás, egy facebook) → ellenőrzés → futtatás (próba) → áttekintés (találatok, hibás forrás) → visszajelzés →
     javaslat → kipróbálás (összehasonlítás) → elfogadás (új verzió) → újrafuttatás (ugyanannyi találat, nincs duplikátum).
   - A modul kódjához NEM nyúl; csak a `@km/news-monitor-core` bejáratán át importál.
3. Határőr: nincs teendőd (a szabályok megvannak).

Add vissza az ÖSSZES fájlt külön blokkban (`=== FÁJL: … ===`), teljes tartalommal. TypeScript 7 + exactOptionalPropertyTypes, zod 4.
