# F-2 · Építő — a felső sáv és a kezdőképernyő (`apps/web/app/_kozos/FelsoSav.tsx`, `apps/web/app/kezdolap/`)

CÉL: a R-1 v3 rajz 1., 2., 3., 5., 6., 7. artboardja él a webalkalmazásban: egy állandó **FelsoSav** komponens és a **/kezdolap** lap
négy állapotban (normál, első használat, néző, telefon). Az adat KÉSZ típusokból jön (`apps/web/kezdolap/tipusok.ts`, hiteles, nem
módosítod); a kiszolgálói összeállítót (`kezdolapNezet`, `felsoSavAdat` az `apps/web/kezdolap/index.ts`-ben) párhuzamosan más írja —
te a típusokra építs, a bejárat `import { kezdolapNezet, felsoSavAdat } from "../../kezdolap"`.

FORRÁS: a mellékelt artboard-HTML-ek (a rajz hiteles szövege és szerkezete, inline stílusokkal — a tokenneveket és a szerkezetet ONNAN
veszed), a `feliratok.json` (minden látható szöveg kulcsa), a szerződés (`docs/KEZDOLAP-SZERZODES.md`), a meglévő minták:
`app/hirfigyelo/page.tsx` (kiszolgálói lap: süti → `aktualisFiok` → `aktualisSzervezet` → átirányítások), `app/_kozos/fiok.css`
(osztálynevek stílusa, `km-` előtag; a fejléc, a `km-gomb-szellem`, a `km-nyelv`, a `km-jelveny`), `app/_kozos/Nyelvvalaszto.tsx`,
`app/szervezet/uj/KilepesGomb.tsx`, `nyelv/kliens.tsx` (`useFeliratok().t(kulcs, { n: 7 })`), `app/_kozos/hibaszoveg.ts` (`apiHivas`).

MIT CSINÁLJ — a fájlok:

1. `apps/web/app/_kozos/FelsoSav.tsx` (`"use client"`) — `export function FelsoSav({ adat, aktiv }: { adat: FelsoSavAdat; aktiv: "kezdolap" | "ugyfelprofil" | "gephaz" | "modul" })`.
   Balról jobbra a 6. artboard szerint: termékjel (`K`, `aria-hidden`) + `kozos.app_nev`; a **munkatér neve MINDIG lenyíló gomb**
   (`aria-haspopup="menu"`, `aria-expanded`), a lenyílóban: `nav.ez_a_munkater` fejléc + a munkatér neve + a szerep (`nav.szerep_*`);
   ha `adat.munkaterek.length > 1`, alatta `nav.munkatereim` fejléc és a többi munkatér sora szereppel — kattintásra
   `apiHivas("/api/szervezet/valt", { szervezet_id })`, majd `router.push("/kezdolap"); router.refresh()`. **A Tagok sor NEM kerül be**
   (a szerződés 7. pontja). A lapok: `nav.kezdolap` (→ `/kezdolap`), `nav.modulok` lenyíló (egy valódi sor: `hf.modTitle` → `/hirfigyelo`,
   mellette `nav.uj_talalat_jelzes` jelvény, ha `uj_talalat > 0`; alatta KÉT üres szaggatott helyfoglaló `aria-hidden="true"`, és a
   `nav.tovabbi_modulok` mondat), `nav.ugyfelprofil` (→ `/fiok`), és CSAK ha `adat.gephaz`: `nav.gephaz` (→ `/gephaz`). Az aktív lap
   `aria-current="page"`. Jobbra: `Nyelvvalaszto` (osztály `km-sav-nyelv`), a fiók neve, jelvény: `nav.szerep_rendszergazda` ha
   `fiok.rendszergazda`, különben `nav.szerep_nezo` ha `szerep === "nezo"` (a 3. artboard), `KilepesGomb`.
   **Telefonon** (5. és 7. artboard, `max-width: 640px`): a sáv két sorba tör: termékjel + név + a munkatér neve alatta kisebb betűvel, jobbra
   egy hamburger gomb (`aria-label` `nav.menu` / `nav.menu_bezar`, `aria-expanded`); nyitva a 7. artboard szerinti lista: Kezdőképernyő
   (kiemelt, ha aktív), MODULOK fejléc, Hírfigyelő sor `{n} új` jelvénnyel, két szaggatott helyfoglaló + `nav.tovabbi_modulok`, Ügyfélprofil,
   Gépház sor `nav.gephaz_negy_csempe` jelvénnyel (`{ n: adat.gephaz_csempek }`) — csak ha `adat.gephaz`; alul nyelvválasztó + Kilépés,
   legalul `nav.sajat_fiok_sor` (`{ nev, szerepek }`, a szerepek: a szerep neve, és ha rendszergazda, „ · rendszergazda"). Minden sor és gomb
   legalább `var(--control-min)` magas. A lenyílók `Escape`-re és kívülre kattintásra záródnak.
   A rajz „A · EGY MUNKATÉR" / „B · KÉT VAGY TÖBB" jegyzetei NEM kerülnek a termékbe.
2. `apps/web/app/_kozos/felsosav.css` — csak tokenek: színek `var(--…)`, betű `var(--font-…-active)`, méret `var(--fs-…)`, lekerekítés
   `var(--r-…)`, MINDEN térköz (`gap`, `padding`, `margin`, lenyíló eltolás) `var(--ter-N)` (0…14) vagy a származtatottak (`--gap`, `--pad-card`,
   `--pad-block`, `--pad-field-y/x`, `--btn-pad-y/x`, `--gap-tile`, `--pad-tile`). Pixel-térköz és puszta `0` TILOS (`var(--ter-0)`). Alakérték
   (a termékjel 26×26, a 8px-es pötty, `--control-min`) maradhat pixel. A sáv `position: sticky; top: var(--ter-0)`, háttér `var(--header-bg)`,
   alsó vonal `var(--bw) solid var(--line)`. A lenyíló: `var(--bg-elev)`, `var(--shadow-pop)`, `var(--r-card)`.
3. `apps/web/app/kezdolap/page.tsx` (kiszolgálói) — süti → `aktualisFiok`; nincs → `redirect("/belepes")`; `aktualisSzervezet` nincs →
   `redirect("/szervezet/uj")`; a szerep a `fiok.szervezetek`-ből; `const nezet = await kezdolapNezet(fiok, szervezet, szerep)`;
   `const sav = felsoSavAdat(fiok, szervezet, szerep, nezet.hirfigyelo?.uj ?? 0)`; `generateMetadata = () => oldalcim("kezdolap.oldalcim")`;
   `dynamic = "force-dynamic"`; importálja a `../_kozos/fiok.css`, `../_kozos/felsosav.css`, `./kezdolap.css` fájlokat; kirajzolja
   `<FelsoSav adat={sav} aktiv="kezdolap" />` és `<Kezdolap nezet={nezet} />`.
4. `apps/web/app/kezdolap/Kezdolap.tsx` (`"use client"`) — `export function Kezdolap({ nezet }: { nezet: KezdolapNezet })`, a `t` a `useFeliratok`-ból,
   a `nyelv` a dátumokhoz (`Intl.DateTimeFormat(nyelv, …)`).
   - **Első használat** (`nezet.elso_hasznalat`): a 2. artboard — középen egy kártya: `kezdolap.elso_cim`, `kezdolap.elso_szoveg`, gomb
     `kezdolap.elso_gomb` (→ `/onboarding/1`, csak ha a szerep nem néző; nézőnek a gomb helyett a `kezdolap.nezo_megj` mondat), mellette
     `kezdolap.elso_lepesek`; elválasztó; `hf.modTitle` + `kezdolap.elso_hf_szoveg`. Más csempe NINCS.
   - **Normál / néző** (1. és 3. artboard): `h1` `kezdolap.cim`; alatta `kezdolap.mi_tortent` (`{ uj, hiba }` a hírfigyelő csempéből; ha
     `hirfigyelo === null`, a mondat elmarad). A rács (`grid-template-columns: repeat(auto-fill, minmax(var(--tile-min), 1fr))`, `gap: var(--gap-tile)`):
     a) **Hírfigyelő** (2 hasáb széles asztalon): cím `hf.modTitle` + `kezdolap.csempe_modul` jelvény, jobbra `kezdolap.hf_link` (→ `/hirfigyelo`);
        nagy szám `uj` (`--fs-metric`) + `kezdolap.hf_uj_cimke`; két oszlop: `kezdolap.hf_utolso_futas` → dátum+idő, vagy `kezdolap.hf_utolso_futas_nincs`;
        `kezdolap.hf_kovetkezo_futas` → ha ma: `kezdolap.ma` (`{ ido }`) + ` · ` + `idozona`, ha más nap: dátum+idő, ha `null`: `kezdolap.hf_kovetkezo_kezi`;
        ha `fut`: `kezdolap.hf_fut` pörgővel (`aria-live="polite"`); jelvények: `kezdolap.hf_forrashiba` (`{ n: forrashiba }`, csak ha > 0, hiba-szín),
        `kezdolap.hf_ertekeles_fuggoben` (`{ n: fuggoben }`, csak ha > 0); ha `keret_kimerult`: `kezdolap.keret_elfogyott` mondat.
        Nézőnek (`nezet.szerep === "nezo"`) a csempe alján `kezdolap.nezo_megj`. **Indítógomb NINCS.** Ha `hirfigyelo === null`: a csempe
        csak a címet és a `kezdolap.hf_utolso_futas_nincs` sort mutatja.
     b) **Ügyfélprofil**: `kezdolap.profil_cim` + jelvény `kezdolap.profil_jovahagyva` (ok-szín); `kezdolap.profil_jovahagyva_meta` (`{ datum, nev }`);
        ha `hianyzo.length > 0`: `kezdolap.profil_hianyzo` (`{ n }`) hiba-színnel + a részek jelvényei (`mezo.<resz>` kulcsok: `mezo.celkozonseg`,
        `mezo.cel`, `mezo.nyelvek`, `mezo.hangnem`, `mezo.arculat` — MEGLÉVŐ kulcsok); telefonon egy sorban `kezdolap.profil_hianyzo_sor`
        (`{ n, reszek }`); link `kezdolap.profil_link` (→ `/fiok`).
     c) **Arculat**: `kezdolap.arculat_cim`; jelvény `kezdolap.arculat_<allapot>` (`nincs|tervezet|kesobb|jovahagyott`; jóváhagyottnál ok-szín);
        `kezdolap.arculat_megj` csak jóváhagyottnál; link `kezdolap.arculat_link` (→ `/fiok#km-fp-arculat`).
     d) **Források**: `kezdolap.forrasok_cim` + `kezdolap.forrasok_ossz` (`{ n: osszes }`); öt sor pötty+név+szám a rajz sorrendjében
        (`hasznalhato`, `korlatozott`, `hibas`, `nem_tamogatott`, `ellenorzes_alatt` → `kezdolap.forras_*`); a korlátozott és a hibás sor kiemelt
        kerettel CSAK ha a száma > 0; link `kezdolap.forrasok_link` (→ `/hirfigyelo/beallitas`). Telefonon pötty nélkül.
     e) **AI-keret**: cím `kezdolap.keret_cim` (`{ honap }` — a hónap neve a felület nyelvén, `Intl.DateTimeFormat(nyelv, { month: "long" })`);
        nagy szám: az összeg a pénznem jelével (`Intl.NumberFormat(nyelv, { style: "currency", currency: penznem })`) + `kezdolap.koltseg_becsult`;
        `kezdolap.koltseg_reszletek` (`{ hivas, gepido }` — `gepido` = `kezdolap.gepido` `{ ora, perc }`, ha < 1 óra `kezdolap.gepido_perc`);
        haladássáv (`role="progressbar"`, `aria-valuenow`, szélesség `min(100, becsult/keret*100)%` inline stílusban, mert adat);
        `kezdolap.keret_maradt` (`{ maradt, keret }`); ha `maradt.ertek === 0`: `kezdolap.keret_elfogyott`; alatta `kezdolap.penznem_megj`
        (telefonon `kezdolap.penznem_megj_rovid`); telefonon a három szám egy sorban: `kezdolap.koltseg_reszletek_sor` (`{ hivas, gepido, osszeg }`);
        link `kezdolap.koltseg_link` (→ `/koltseg`).
     f) **Mentetlen tervezet** — CSAK ha `tervezet.tema || tervezet.feliratok` ÉS a szerep tulajdonos (a néző-artboardon nincs): figyelem-keret,
        `kezdolap.tervezet_cim`, `kezdolap.tervezet_szoveg` (`{ lap }` = `nav.theme` vagy `nav.feliratok`), link `kezdolap.tervezet_link` (`{ lap }`,
        → `/tema` vagy `/feliratok`); ha mindkettő, két sor.
   Minden látható szöveg `t(...)`-ből; a számok `Intl.NumberFormat(nyelv)`.
5. `apps/web/app/kezdolap/kezdolap.css` — a rács és a csempék, ugyanazokkal a szabályokkal, mint a 2. pontban; `@media (max-width: 640px)`:
   egy hasáb, a hírfigyelő két időpontja címke–érték sorpárokká, a tömörített alakok.

HATÁR: az itt felsorolt öt fájl. A `kezdolap/tipusok.ts`, `kezdolap/index.ts`, a `nyelv/`, a `_kapu.ts`, más lapok: NEM nyúlsz.
FIGYELEM: a `t()` hiányzó kulcsra a kulcsot adja vissza — CSAK a `feliratok.json`-ban és a fent felsorolt meglévő kulcsok között lévőt hívd.
TypeScript szigorú: `noUncheckedIndexedAccess` (`lista[0]` lehet `undefined`), `exactOptionalPropertyTypes`, `verbatimModuleSyntax`
(`import type`). Relatív importban nincs `.js`. `next/link` `Link` a belső hivatkozásokra. Beégetett szín, betű, méret, lekerekítés,
pixel-térköz: TILOS (a tokenőr elbuktatja).
KÉSZ, HA: `pnpm --filter web tipus` zöld, a tokenőr és a térköz-számláló zöld; a lap a négy állapotban a rajz szerkezetét adja.
Visszaadás: az öt fájl teljes tartalommal, külön `=== FÁJL: … ===` blokkban. Semmi más szöveg.
