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

MUNKAMEGOSZTÁS: ezt a lapot KETTEN építitek. TE (B1) a lapot és az űrlapot készíted; a FORRÁSOK oszlopát (a `colFrom` blokk: csoportok, állapotok, ellenőrzés, hozzáadás,
`honestyNote`) egy másik építő (B2) készíti `apps/web/app/hirfigyelo/beallitas/Forrasok.tsx` néven, ezzel a szerződéssel — TE csak beilleszted a helyére:
`export function Forrasok({ szerkesztheto, onValtozas }: { szerkesztheto: boolean; onValtozas?: (forrasok: Forras[]) => void }): JSX.Element` — maga tölti be a forrásokat
(`GET forrasok`), kezeli a hozzáadást és az ellenőrzést; a `Forras` típust a `@km/news-monitor-core`-ból veszi. A CSS-t is B2 írja (`beallitas.css`, `km-hf-be-…` osztályok) — TE
használd ezeket az osztályneveket a saját JSX-edben (találd ki őket beszédesen, pl. `km-hf-be-cim`, `km-hf-be-jelveny`, `km-hf-be-racs`, `km-hf-be-oszlop`, `km-hf-be-oszlopcim`,
`km-hf-be-kartya`, `km-hf-be-kartyacim`, `km-hf-be-chip[data-be]`, `km-hf-be-mezo`, `km-hf-be-textarea`, `km-hf-be-cimke`, `km-hf-be-tema`, `km-hf-be-tema-torol`, `km-hf-be-megj`,
`km-hf-be-radio`, `km-hf-be-ido`, `km-hf-be-uzenet[data-fajta=hiba|ok|info]`, `km-hf-be-gombsor`, `km-hf-be-gomb`, `km-hf-be-gomb-elsodleges`, `km-hf-be-gomb-szellem`) és a
válaszod VÉGÉN sorold fel egy listában, melyik osztályt mire használtad (B2 ebből dolgozik). Írj TÖMÖR kódot: egy `useState` a teljes `Beallitas` űrlaphoz + néhány
állapot (betöltés, mentés, javaslat, próba) — NEM mezőnként külön state. A fájl legfeljebb ~450 sor.

Készítsd el (add vissza minden fájlt teljes egészében):
1. **`apps/web/app/hirfigyelo/beallitas/page.tsx`** (kiszolgálói, a `tema-page.tsx.minta` mintájára: belépés → `/belepes`, szervezet → `/szervezet/uj`, `profilBetolt` → nincs →
   `/onboarding/1`; `generateMetadata = () => oldalcim("hf.oldalcim")`; `dynamic = "force-dynamic"`; importálja `../../_kozos/fiok.css` és `./beallitas.css`; `<Beallitas profilNev szerep />`).
2. **`apps/web/app/hirfigyelo/beallitas/Beallitas.tsx`** (`"use client"`): a fenti viselkedés a források oszlopa NÉLKÜL (oda `<Forrasok szerkesztheto={…} />` kerül); a `Beallitas`
   zod-sémát a `@km/news-monitor-core`-ból importáld (`Beallitas as BeallitasSema`) a mentés előtti helyi ellenőrzéshez (`safeParse`; hiba esetén `saveFailTitle`/`saveFailBody` + a hibás
   mező `data-hiba="true"`). `data-screen-label="HF-II Figyelés beállítása"` a szekción.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), React 19, Next 16; `useFeliratok()` a `../../../nyelv/kliens`-ből; a `HirfigyeloKeret` a
`../_kozos/HirfigyeloKeret`-ből, a `hfKeres`/`varjSor`/`idoRovid` a `../_kozos/kliens`-ből; NINCS beégetett szín/méret/felirat; magyar nevek és megjegyzések; nincs új npm-függőség.
