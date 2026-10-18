# Feladat — ÉPÍTŐ B (E-25): a Hírfigyelő FIGYELÉS BEÁLLÍTÁSA lapja a v7 prototípus szerint (Next 16, React 19)

A prototípus a FELÜLETI mérce: ami rajta van, az kell; ami nincs rajta, azt nem találjuk ki; minden vezérlő mögött VALÓDI gépezet (API) van.
Mellékelve: `proto-beallitas.html` (a prototípus HTML-je: a HF-II szakasz inline stílusokkal, `{{ }}` kötésekkel), `proto-logika-beallitas.js` (a számított értékek),
`hf-feliratok-hu.json` (MINDEN felirat kulcsa `hf.<kulcs>` néven — `t("hf.savedOk", { v })`; a szövegeket NE égesd be; a mellékletben nem szereplő, de a
feladatban említett kulcsok is léteznek: `hf.srcUnsupported`, `hf.srcUnsupportedDetail`, `hf.savedNoChange`, `hf.javaslatFolyik`, `hf.javaslatHiba`, `hf.temaHozzaad`, `hf.csakNezo`,
`hf.betoltes_hiba`, `hf.ujra`, `hf.futas_hiba`), `API-LAP.md` (a kiszolgáló válaszai), `kliens.ts` (kész: `hfKeres`, `varjSor`, `idoRovid`, `forrasNev`), `HirfigyeloKeret.tsx` +
`hirfigyelo.css` (kész váz — a lapod ebbe kerül, `aktiv="beallitas"`; a `ELERHETO_LAPOK`/`LAP_UT` innen), `beallitas.ts` (a `Beallitas` séma: célok, témák, fókusz, nyelvek,
kizárások, időzítés, szabad szöveg), `forras.ts`, `tema-page.tsx.minta`, `tema.css.minta`.

A prototípus mezői ↔ a `Beallitas` séma (ezt a leképezést tartsd):
- célok chipek `goalBrand/goalPro/goalIdea` ↔ `celok`: `sajat_marka` / `szakmai` / `tartalomotlet` (legalább egy kell);
- témák chipek ↔ `temak[].nev` (× eltávolít); új téma: egy kis beviteli mező a chipek után (`hf.temaHozzaad` helykitöltővel, Enter = hozzáad) — a prototípus „applyFree”-je a szabad
  szövegből tesz témát, ez a kézi út;
- `variantsLabel` mező ↔ `temak[0].nevvaltozatok` (vesszővel; az első téma = a szervezet neve); `geoLabel` ↔ `foldrajzi_fokusz`; `exclLabel` ↔ `kizarasok` (vesszővel);
- `disambigLabel: …` sor ↔ `temak[0].megkulonboztetes`, ha üres: a prototípus példamondata `disambigEx {name}` (a profil neve);
- `suClarify` kérdés (csak első használatkor) ↔ a válasz a `szabad_szoveg`-hez fűzve („Saját név: …”);
- `freeLabel` textarea + `✦ freeBtn` ↔ `POST /api/hirfigyelo/beallitas/javaslat { szabad_szoveg }` → a válasz `tervezet` a mezőkbe (az AI-tól jött értékek), a textarea ürül; közben
  `hf.javaslatFolyik`, hibánál `hf.javaslatHiba` (a mezők maradnak);
- források (`colFrom`): `GET forrasok`; csoportok: `srcGroupPress` = `eredet: "kezi"`, `✦ srcGroupAi` = `eredet: "ai_javaslat"` (+ `srcAiWarn`, ha van `ellenorzes_alatt` köztük);
  a `srcGroupOwn` csoport csak akkor látszik, ha van ilyen (most nincs — üres csoport nem jelenik meg, mint a prototípusban); állapot-jelvény: `ellenorzes_alatt`→`srcChecking`
  (+ `srcVerify` gomb → `POST forrasok/{id}/ellenoriz`), `hasznalhato`→`srcOk` (meta: `srcLastOk {t}` az `utolso_sikeres`-ből), `korlatozott`→`srcLimited` (meta `srcProblem {p}`,
  p = `srcLimitedDetail`), `hibas`→`srcErr` (meta `srcProblem {p}`, p = `hiba_ok` vagy `srcErrDetail`), `nem_tamogatott`→`hf.srcUnsupported` (meta `srcProblem {p}`,
  p = `hf.srcUnsupportedDetail`, `--err` szín); új forrás: mező (`srcAddPh`, `dir="ltr"`) + `srcAddBtn` → `POST forrasok { cim }` → a lista frissül; alul `honestyNote`;
- időzítés (`colWhen`): rádió `schManual`/`schDaily` ↔ `idozites.mod` `kezi`/`napi`; `schTime` `<input type="time">` ↔ `ora`/`perc`; a `schTz {tz}` szöveg az `idozites.idozona`-t
  mutatja (alap `Europe/Bucharest`); alatta `emailFuture`;
- `nyelvek`: a mentett/javasolt érték marad (nincs mező a prototípuson);
- gombok: `trialBtn` → `POST futas { proba: true }` → 202 → `trialRunningBtn` (letiltva) + `varjSor` → a végén `trialDone` doboz (+ `trialGo →` link a
  `/hirfigyelo/finomhangolas`-ra CSAK ha `ELERHETO_LAPOK.has("finomhangolas")`); 409 NINCS_BEALLITAS → először menteni kell (a `saveFailBody` helyett a `suDraft` jelvény már mutatja —
  ilyenkor a próbafuttatás gomb letiltva, amíg nincs aktív verzió); `saveStartBtn` → `PUT beallitas` → 200 `uj` ≠ null → `✓ savedOk {v}` (a jelvény `suActive {v}`), `uj` null →
  `✓ hf.savedNoChange {v}`; 400 → `saveFailTitle`/`saveFailBody` (a mezők maradnak, újrapróbálható), hálózati hiba ugyanígy; közben `savingBtn`; alul `trialNote`.
- **Tervezet** (3c: a mentetlen szerkesztés nem módosítja a futó figyelést): minden mezőváltozás után 800 ms-mal `PUT beallitas/tervezet` (a jelvény `suDraft`); betöltéskor ha van
  `tervezet`, az jön a mezőkbe (különben az `aktiv.beallitas`); sikeres mentés után `DELETE tervezet` nem kell (a mag törli). Első használatkor (nincs aktív, nincs tervezet) a lap
  automatikusan kér egy AI-javaslatot a profilból (`POST beallitas/javaslat {}`) — a prototípus „AI által előkészített, nem jóváhagyott beállítás” állapota; amíg jön: `hf.javaslatFolyik`.
- **Néző** szerep: minden mező letiltva, a gombok nem látszanak, felül `km-hf-uzenet[data-fajta=figyelem]` a `hf.csakNezo` szöveggel.

MUNKAMEGOSZTÁS: ezt a lapot KETTEN építitek. TE (B2) a FORRÁSOK oszlopát és a lap teljes CSS-ét készíted; az űrlapot és a lapot B1.

Készítsd el (add vissza minden fájlt teljes egészében):
1. **`apps/web/app/hirfigyelo/beallitas/Forrasok.tsx`** (`"use client"`):
   `export function Forrasok({ szerkesztheto, onValtozas }: { szerkesztheto: boolean; onValtozas?: (forrasok: Forras[]) => void })` — a prototípus `colFrom` blokkja 1:1:
   mountkor `GET /api/hirfigyelo/forrasok` (hiba → `km-hf-uzenet[data-fajta=hiba]` + `hf.ujra`); csoportok (`srcGroupPress` = `eredet: "kezi"`, `✦ srcGroupAi` = `eredet: "ai_javaslat"`
   + `srcAiWarn`, ha van köztük `ellenorzes_alatt`; üres csoport nem jelenik meg; `srcGroupOwn` most üres); soronként: a cím (`font-family: var(--font-code-active)`, `dir="ltr"`),
   állapot-jelvény (`ellenorzes_alatt`→`srcChecking` `--src-empty`; `hasznalhato`→`srcOk` `--ok`; `korlatozott`→`srcLimited` `--warn`; `hibas`→`srcErr` `--err`;
   `nem_tamogatott`→`hf.srcUnsupported` `--err`), meta jobbra (`srcLastOk {t}` az `utolso_sikeres`-ből `idoRovid`-dal; `srcProblem {p}` — p: `hiba_ok` vagy `srcErrDetail` /
   `srcLimitedDetail` / `hf.srcUnsupportedDetail`), `srcVerify` gomb csak `ellenorzes_alatt`-nál és ha `szerkesztheto` → `POST forrasok/{id}/ellenoriz` → a sor frissül (közben letiltva);
   alul a hozzáadás sora (mező `srcAddPh`, `dir="ltr"`, + `srcAddBtn`, letiltva 4 karakter alatt vagy ha nem `szerkesztheto`) → `POST forrasok { cim }` → a lista frissül, a mező ürül;
   400/409 → a hibakód szövege (`hf.futas_hiba` helyett egy rövid `km-hf-uzenet[data-fajta=hiba]` a válasz `hiba` kódjával — `ERVENYTELEN_ADAT` → `hf.saveFailTitle`); legalul `honestyNote`.
   Minden változás után `onValtozas?.(forrasok)`. A `Forras` típus a `@km/news-monitor-core`-ból.
2. **`apps/web/app/hirfigyelo/beallitas.css`**: a lap TELJES stílusa a prototípus inline stílusaiból, CSAK tokenekkel (szín, betűméret, lekerekítés `var(--…)`; a h1 22px → `var(--fs-h2)`).
   B1 ezeket az osztályokat használja — mindet definiáld a prototípus megfelelő eleme szerint: `km-hf-be-fej` (cím + jelvény sora), `km-hf-be-cim` (h1), `km-hf-be-jelveny[data-aktiv]`
   (tervezet: `--src-ai-bg`/`--src-ai`; aktív: `--ok-bg`/`--ok`), `km-hf-be-alcim`, `km-hf-be-kerdes` (a clarify doboz) + `km-hf-be-kerdes-cimke`, `km-hf-be-racs` (`repeat(auto-fit,
   minmax(340px,1fr))`, gap 16), `km-hf-be-oszlop`, `km-hf-be-oszlopcim[data-szin=mit|honnan|mikor]` (`--accent-text` / `--src-web` / `--ok`, nagybetűs), `km-hf-be-kartya`,
   `km-hf-be-kartyacim` (kis nagybetűs), `km-hf-be-chipek`, `km-hf-be-chip[data-be=true|false]` (a prototípus `chip` stílusa: be → `--focus` keret, `--focus-ring` háttér, `--src-web`
   szöveg), `km-hf-be-mezo` + `:focus` (`--focus`, `--focus-ring`), `km-hf-be-textarea`, `km-hf-be-cimke` (kis címke az input fölött), `km-hf-be-mezoracs` (`minmax(240px,1fr)`),
   `km-hf-be-tema` (chip ×-szel) + `km-hf-be-tema-torol`, `km-hf-be-megj` (apró szürke), `km-hf-be-megkulonboztetes`, `km-hf-be-radiosor`, `km-hf-be-radio`, `km-hf-be-ido`
   (`input[type=time]`), `km-hf-be-uzenet[data-fajta=hiba|ok|info]` (a `saveErr` / `savedOk` / `trialDone` dobozok), `km-hf-be-uzenet-cim`, `km-hf-be-gombsor`, `km-hf-be-gomb-elsodleges`
   (a prototípus `primary`: `--grad-primary`, `--glow-primary`; `:disabled` → `--btn-disabled-bg`, `--text-faint`), `km-hf-be-gomb-szellem` (a `ghost`), `km-hf-be-link-gomb`
   (szövegszerű, `--accent-text`), és a források oszlopához: `km-hf-be-forras-csoport`, `km-hf-be-forras-csoportcim[data-szin=press|ai]`, `km-hf-be-forras`, `km-hf-be-forras-cim`,
   `km-hf-be-forras-allapot[data-allapot=…]`, `km-hf-be-forras-meta[data-szin=err|warn|faint]`, `km-hf-be-forras-gomb`, `km-hf-be-forras-figyelem`, `km-hf-be-forras-hozzaad`,
   `km-hf-be-forras-mezo`, `km-hf-be-oszinte` (a `honestyNote`). Telefon (`max-width: 720px`): egy oszlop, gombok `min-height: var(--control-min)`, a chipek tördelődnek.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React 19; `useFeliratok()` a `../../../nyelv/kliens`-ből; `hfKeres`, `idoRovid`, `forrasNev` a
`../_kozos/kliens`-ből; NINCS beégetett szín/méret/felirat; magyar nevek és megjegyzések; nincs új npm-függőség.
