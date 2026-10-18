# F-4b · Építő — a Saját fiók lap (`apps/web/app/sajat-fiok/SajatFiok.tsx` + `sajat-fiok.css`) az R-3 v2 rajz szerint

CÉL: a rajz hat artboardja (`R3-sajat-fiok v2.dc.html` — a v2 a hiteles): 01 alaphelyzet (oldalsáv + fejléc + három blokk + Munkatereim + Értesítések-hivatkozás + a törlés
halk sora) · 02 A: egy munkatér, B: a rendszergazdai blokk · 03 jelszóváltás A: mentés közben, B: siker, C: a kiléptetés válasza · 04 a négy hibaút · 05 kilépés egy
munkatérből (alsó megerősítő sáv + az utolsó tulajdonos zárt esete) · 06 telefon. A felső sávot MÁS rakja rá — te a `<main>` tartalmát írod. Két fájl.

FORRÁS: a rajz HTML-je (a hiteles szöveg, szerkezet, tokennevek), a `feliratok.json` (62 kulcs + a lent nevezett kiegészítők — CSAK ezeket hívd), az `ATADO.md`
(+ v2 szakasz), a `tipusok.ts` (a lap szerződése: `import type { SajatFiokNezet, MunkaterSor, KilepValasz } from "../../sajatfiok/tipusok"`), a `kliens.tsx`
(`hivas(url, modszer, torzs)` → `{ ok, statusz, torzs }`; `MentesAllapot`), a `Kapcsolo.tsx` NEM kell. Minta: a Beállítások lap (`Beallitasok.tsx` — melléklet) — így épül
egy lap ebben a rendszerben (t(), nyelv, időformátum részekből, `km-` előtag). Az oldalsáv mintája: az R-4 lap bal oszlopa NEM épült meg — itt épül: `km-sf-oldalsav`.

A GÉPEZET (kész; a válaszok alakja):
- `PUT /api/fiok/nev` `{ nev }` → 200 `{ fiok: { nev } }`; üres → 400 `{ hiba: "ERVENYTELEN_ADAT" }`.
- `PUT /api/fiok/jelszo` `{ jelenlegi, uj }` → 200 `{ fiok: { masEszkozokKileptetve: number } }`; rossz jelenlegi → 400 `{ hiba: "ROSSZ_JELENLEGI_JELSZO" }`; rövid → 400 `{ hiba: "ERVENYTELEN_ADAT" }`.
- `POST /api/fiok/kileptetes-mindenhol` `{}` → 200 `{ fiok: { torolt: number } }` (a TÖBBI munkamenet; ez az eszköz marad — a rajz ezt mutatja).
- `POST /api/nyelv` `{ nyelv: "hu"|"ro"|"en" }` → 200; utána `window.location.reload()` (a feliratok a kiszolgálóról jönnek).
- `POST /api/tagok/kilep` `{ szervezet_id }` → 200 `KilepValasz`; az egyetlen tulajdonos → 409 `{ hiba: "UTOLSO_TULAJDONOS" }`. Siker után: ha `kovetkezo_szervezet_id` van → `window.location.href = "/sajat-fiok"`
  (a sáv már a következő munkatérrel jön); ha null → `window.location.href = "/szervezet/uj"`.
- A név, az e-mail, az utolsó belépés, a belépések listája, a munkaterek: a `nezet` propból (a kiszolgáló adja).

A KOMPONENS:
```ts
export function SajatFiok({ nezet }: { nezet: SajatFiokNezet })   // "use client"
```
- **Oldalsáv** (`sajat.oldalsav_cim` „A fiókod"): két sor — `sajat.cim` (aktív, kiemelt) és `nav.beallitasok` → `<a href="/beallitasok">` mellette `ertesites.oldalsav_szam` `{ n }` jelvény,
  ha `nezet.ertesites_olvasatlan > 0`. Telefonon az oldalsáv elmarad (a 06. artboard nem mutatja).
- **Fejléc**: `sajat.cim` + `sajat.bevezeto` (telefonon `sajat.bevezeto_rovid`).
- **Adataim** (`sajat.adatok_cim`): Név mező (`sajat.nev_cimke`, `sajat.nev_megj`), `sajat.nev_mentes_gomb` → PUT; hiba ERVENYTELEN_ADAT → a mező ALATT `fiok.hiba_ervenytelen_adat` +
  `sajat.nev_hiba_mit`, a mező kerete `var(--err-strong)`. **E-mail**: `sajat.email_cimke` + `jelzes.meg_nem_mukodik` jelvény, a mező ZÁRT (`readOnly`), szaggatott `var(--keszul-border)`
  keret, `var(--keszul-bg)` alap, `var(--font-code-active)`; alatta `sajat.email_megj` (telefonon `sajat.email_megj_rovid`). Siker a mentésnél: a gomb mellett rövid „✓" állapot (`MentesAllapot`, ha van ilyen a kliens.tsx-ben — nézd meg; különben `kozos.mentve`, ha létezik — ha nem, a gomb feliratának visszaállása elég, új kulcsot NEM találsz ki).
- **Jelszó** (`sajat.jelszo_cim`): `sajat.jelenlegi_cimke`, `sajat.uj_cimke` (+ `sajat.jelszo_hossz` alatta), `sajat.uj_megegyszer_cimke`; a **felületi ellenőrzés**: ha az új < 10 karakter → a mező alatt
  `sajat.jelszo_rovid` + `sajat.jelszo_rovid_mit`, a gomb ZÁRT; ha a kettő nem egyezik → `sajat.jelszo_nem_egyezik` + `sajat.jelszo_nem_egyezik_mit`, a gomb zárt. A gomb FÖLÖTT a figyelmeztető blokk
  (`sajat.jelszo_kovetkezmeny_cim` + `sajat.jelszo_kovetkezmeny`; `var(--warn)`/`--warn-border`/`--warn-bg`; telefonon a rövid `sajat.jelszo_kovetkezmeny_rovid` egy sorban). Gomb `sajat.jelszo_mentes_gomb`;
  mentés közben pörgő + `sajat.jelszo_mentes_kozben` (03/A). Siker (03/B): a blokk helyén `sajat.jelszo_kesz_cim` (a `var(--ok-strong)` pont), `sajat.jelszo_kesz_szoveg` `{ n }`, `sajat.jelszo_kesz_megj`; a mezők
  kiürülnek. Hiba ROSSZ_JELENLEGI_JELSZO: a jelenlegi mező alatt `fiok.hiba_rossz_jelenlegi_jelszo` + `sajat.jelszo_hiba_mit`; az ÚJ jelszó mezőket NEM üríted.
- **Belépések** (`sajat.belepesek_cim`): `sajat.utolso_belepesek_cimke`, a `nezet.belepesek` sorai: idő `MM-dd HH:mm` (részekből, `timeZone: "Europe/Bucharest"`, `var(--font-code-active)`), a cím
  (`var(--text-dim)`, kód-betű), jelvény `sajat.belepes_sikeres` (`var(--ok)`, `--ok-bg`) / `sajat.belepes_sikertelen` (`var(--err)`, `--err-bg`); alatta `sajat.belepesek_megorzes` (telefonon
  `sajat.belepesek_megorzes_rovid`). Ha a lista üres: `sajat.utolso_belepes_cimke` + `nezet.utolso_belepes` formázva (vagy semmi). Elválasztó; `sajat.kileptetes_megj`; gomb `sajat.kileptetes_gomb` → POST;
  siker: zöld sáv (03/C) `sajat.kileptetes_kesz` `{ n }`, ha n = 0 → `sajat.kileptetes_nulla` (NEM hiba). Elválasztó; **A felület nyelve**: `sajat.nyelv_cimke`, `<select>` (Magyar · Română · English —
  a nyelvnevek adat, a rendszer `Nyelvvalaszto`-ja is így írja), `sajat.nyelv_megj`; váltás → POST /api/nyelv + reload.
- **Munkatereim** kártya: fej `sajat.munkatereim_cim` + `sajat.munkatereim_szam` `{ n }`, jobbra `sajat.munkatereim_megj`; ha 1 munkatér: a fej alatt `sajat.egy_munkater_megj` (02/A). Sorok: név +
  `sajat.aktualis` jelvény, ha `aktualis`; szerep-jelvény `t(\`nav.szerep_${szerep}\`)` (tulajdonos `var(--src-ai)`/`--src-ai-bg`, szerkesztő `--src-web`, néző `--src-empty`); jobbra a `sajat.kilepek_gomb`.
  **Utolsó tulajdonos**: a gomb ZÁRT (disabled, `var(--line-dash)`, `--text-faint`), mellette KÉT mondat: `hozzaferes.hiba_utolso_tulajdonos` (`var(--warn)`) + `sajat.kilepek_zart_mit` (telefonon a rövid
  `sajat.kilepek_zart_rovid` egy sorban). Kilépek → a sor kiemelt (`var(--focus-ring)` alap) + `sajat.megerositesre_var` jelvény, és **alsó, rögzített megerősítő sáv** (05.): `sajat.kilepek_megerosit_cim` `{ munkater }`,
  `sajat.kilepek_megerosit_szoveg`, gombok `kozos.megse` / `sajat.kilepek_megerosit_gomb` → POST. 409 UTOLSO_TULAJDONOS (ha mégis) → a sor mellett a két mondat.
- **Rendszergazdai blokk** (02/B) CSAK `nezet.fiok.rendszergazda` esetén: `sajat.gazda_cim` + `sajat.gazda_jelveny` jelvény, `sajat.gazda_megj`, négy hivatkozás: `sajat.gazda_fiokok` → `/fiokok`,
  `sajat.gazda_tema` → `/tema`, `sajat.gazda_feliratok` → `/feliratok`, `sajat.gazda_koltseg` → `/koltseg` (`var(--accent-link)`). Nem rendszergazdánál a blokk NINCS ott.
- **Értesítések és adatpolitika** kártya: `sajat.ertesitesek_cim`, `sajat.ertesitesek_megj`, jobbra `<a href="/beallitasok">` `nav.beallitasok` + „→" (`var(--accent-link)`).
- Legalul halk sor: `sajat.torles_megj` (gomb NINCS, jelölés NINCS — tudatos).
- **Telefon** (`max-width: 640px`): egy oszlop, a blokkok egymás alatt a 06. sorrendjében (Adataim · Jelszó · Munkatereim · Belépések · Értesítések); a gombok teljes szélességűek; a mezők címkéi
  a jelszónál elmaradhatnak (a rajz szerint placeholder nélkül, csak a mezők) — de az `aria-label` legyen ott.
- Minden szöveg `t()`-ből (`useFeliratok()` → `{ t, nyelv }`; `t(kulcs, ertekek?)` — legfeljebb KÉT argumentum); adat: név, e-mail, idők, címek, számok. Osztályelőtag `km-sf-`. CSS csak tokenekkel;
  minden térköz `var(--ter-N)`; pixel-térköz és puszta `0` tilos (`var(--ter-0)`); `border-radius: 50%` mellé `/* tokenőr: ok — kör */`. Beviteli mezők `min-height: var(--control-min)`, `box-sizing: border-box`.

HATÁR: a két fájl. A `page.tsx`, a sáv, a `tipusok.ts`, a végpontok: NEM nyúlsz. TypeScript szigorú (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` → az opcionális propok `| undefined`;
`verbatimModuleSyntax` → `import type`). Relatív importban nincs `.js`. Beégetett szín/betű/méret/lekerekítés TILOS.
KÉSZ, HA: `pnpm --filter web tipus` zöld, tokenőr zöld; a lap a hat artboard állapotát adja.
Visszaadás: a két fájl teljes tartalommal, külön `=== FÁJL: <út> ===` blokkban. Semmi más szöveg.
