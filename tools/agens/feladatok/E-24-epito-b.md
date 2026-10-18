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

Készítsd el (add vissza minden fájlt teljes egészében):
1. **`apps/web/app/hirfigyelo/beallitas/page.tsx`** (kiszolgálói, a `tema-page.tsx.minta` mintájára: belépés → `/belepes`, szervezet → `/szervezet/uj`, `profilBetolt` → nincs →
   `/onboarding/1`; `generateMetadata = () => oldalcim("hf.oldalcim")`; `dynamic = "force-dynamic"`; importálja `../../_kozos/fiok.css` és `../beallitas.css`; `<Beallitas profilNev szerep />`).
2. **`apps/web/app/hirfigyelo/beallitas/Beallitas.tsx`** (`"use client"`): a fenti viselkedés; a `Beallitas` zod-sémát a `@km/news-monitor-core`-ból importáld a mentés előtti helyi
   ellenőrzéshez (`safeParse`; hiba esetén a `saveFailTitle`/`saveFailBody` + a hibás mező kiemelése `--err-border`-rel). `data-screen-label="HF-II Figyelés beállítása"` a szekción.
3. **`apps/web/app/hirfigyelo/beallitas.css`**: a prototípus inline stílusai osztályokká (`km-hf-be-…`), CSAK tokenekkel (szín, betűméret, lekerekítés `var(--…)`; a h1 22px →
   `var(--fs-h2)`); a kétoszlopos rács `repeat(auto-fit, minmax(340px, 1fr))`; telefonon egy oszlop, a gombok `min-height: var(--control-min)`; a fókusz-stílusok (`:focus`) a
   prototípus `style-focus`-a szerint (`--focus`, `--focus-ring`).

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React 19, Next 16; `useFeliratok()` a `../../../nyelv/kliens`-ből; `hfKeres` (nem nyers `fetch`);
NINCS beégetett szín/méret/felirat; magyar nevek és megjegyzések; nincs új npm-függőség.
