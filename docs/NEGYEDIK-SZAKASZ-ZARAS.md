# A 4. szakasz zárása — Brand és Theme (E-13…E-18), 2026-09-07

Mit bizonyít ez a lap: a 4. szakasz (`docs/NEGYEDIK-SZAKASZ.md`) minden lépése kész és kint van a teszten
(https://saas.mediapartizan.ro), az átadó **A-07** és **A-09** átvételi pontja teljesült, a D-09 döntés (a témát ÉS a feliratokat a
szervezetek tulajdonosai is állítják, közös alap + szervezeti felülírás) a kódban van. A módszer minden lépésnél ugyanaz volt:
terv → kód → helyi próbák → gépi végigjátszás 3 nyelven + telefonon → fordított ellenőrzés (Kimi) a terv ellen → kirakás → kívülről
ellenőrzés → képernyőkép Vilmosnak → könyvelés.

## 1. Mi készült el (lépésenként)

| Lépés | Mi | Bizonyíték |
|---|---|---|
| E-13 | A téma két szintje: `tema` (közös alap, tervezet/alkalmazott/korábbi) + `szervezet_tema` (RLS); szabályok a `design-system`-ben (`tema-szintek.ts`); `/api/tema…` és `/api/tema/kozos…`; a lap feje a hatásos témát adja; `fiok.rendszergazda` | 16 próba (`tema.proba.ts`), `docs/KIRAKAS.md` E-13, élő API-ellenőrzés |
| E-14, E-14b | A Theme-felület a v6 szerint (`/tema`): 7 szekció, élő előnézet, üzenetek, importhibák; két szint (jelvény + rendszergazdának szintválasztó); a tervezetet csak a szerkesztő látja; **verziólista + visszaállítás** (Vilmos kérte) | `docs/E-14-ELLENORZES.md`, `docs/E-14-FORDITOTT-ELLENORZES-kimi.md` (2 eltérés javítva), végigjátszás 3 nyelven + telefon |
| E-15 | A feliratok szerkesztőjének rajza (Claude Design) — Vilmos jóváhagyta | `docs/NEGYEDIK-SZAKASZ.md`, a rajz (artifact) |
| E-16 | A feliratok két szintje (`kozos_felirat_verzio`, `szervezet_felirat_verzio`), szabályok (`feliratok.ts`: hatásos lánc szervezet → közös → alap, tartaléknyelv), `/api/feliratok…`, a szerkesztő (`/feliratok`) a rajz szerint | 10 próba (`feliratok.proba.ts`), `docs/E-16-ELLENORZES.md`, `docs/E-16-FORDITOTT-ELLENORZES-kimi.md` (2 eltérés javítva) |
| E-17 | Export / import fájlba mindkét felületen — ugyanaz a csomag és ellenőrzés, mint a mezőnél; hibás fájl semmit nem ír | `docs/KIRAKAS.md` E-17, végigjátszás (`/tmp/e17-jatek.py`) |
| E-17b | A fiókprofil átrajzolása Vilmos új mockupja szerint (a gépezet marad) | `docs/KIRAKAS.md` E-17b, `docs/E-17b-FORDITOTT-ELLENORZES-kimi.md` (0 valódi eltérés) |
| E-18 | Hibautak, záró fordított ellenőrzés mindkét admin-felületen, 3 nyelv + telefon, A-07/A-09 bizonyítás — ez a lap | lent |

Migrációk: 0018–0025 (kézzel írt SQL, `nas/adatbazis/migral.sh` futtatja, a NAS-on mind lefutott). Próbák: **123 zöld** (11 fájl).
Őrök: `pnpm hatar` (122 modul, 0 határsértés — a szerkezet az ALAPTERV modultáblája szerint: a `design-system` és a `*-core`
csomagok tiszták, adatbázis csak az `apps/web` tárrétegében), `pnpm tokenor` (97 fájl, nincs beégetett szín/betű/méret/lekerekítés),
`pnpm tipus` (6 csomag).

## 2. Hibautak (E-18) — „a sikertelen mentés/alkalmazás után az előző marad”

Gépi végigjátszás (`/tmp/e18-jatek.py`, helyi tesztkörnyezet, ugyanaz a build, mint a NAS-on): a böngésző kérései elé hibát
tettünk (a kérés megszakad, vagy a kiszolgáló 500-at ad), és utána a KISZOLGÁLÓ állapotát kérdeztük le, nem csak a képernyőt.

| Eset | Mit láttunk | Az előző marad? |
|---|---|---|
| Theme: a tervezet mentése megszakad (hálózat) | „A tervezet mentése nem sikerült — az előző működő téma érintetlen.” A szerkesztett érték a mezőben marad, a gombok élnek | igen: alkalmazott `--primary #aa0000`, tervezet nincs, a lap `--primary` #aa0000 |
| Theme: az alkalmazás 500-at ad (a tervezet mentése előtte sikerül) | „Az alkalmazás nem sikerült — az előző működő téma maradt érvényben.” | igen: alkalmazott #aa0000; a tervezet (#00aa00) csak az előnézetben; újratöltés után a lap #aa0000, az előnézet #00aa00 |
| Theme: az alkalmazás megszakad, majd újra jó | hiba-üzenet, majd a második kattintásra alkalmazva (verzió 2, a lap #00aa00) | igen, és a javítás után megy |
| Theme: a szint betöltése 500-at ad (rendszergazda, szintváltás) | „A téma betöltése nem sikerült. Mentés és alkalmazás letiltva…” + „Betöltés újra”; a két gomb tiltva; újra → betöltve, gombok élnek | igen |
| Theme: visszaállítás nem létező verzióra (API) | 404 `NINCS_ILYEN_VERZIO`, alkalmazott és tervezet változatlan | igen |
| Feliratok: mentés megszakad / alkalmazás 500 / betöltés 500 | ugyanaz a három üzenet a feliratok szövegével; az onboarding fejléce a korábban alkalmazott szöveget mutatja | igen |

**Talált és javított hiba:** a Theme-lap betöltési hibaútjának három felirata (`tema.betoltes_loading/_load_err/_retry`) hiányzott
a csomagból — a lap a nyers kulcsot mutatta. Pótolva három nyelven (migráció **0025**). Ezt csak a hibaút végigjátszása hozta elő:
a sikeres ág soha nem érinti.

## 3. Záró fordított ellenőrzés (Kimi, a terv ellen)

- **Theme ↔ v6 `Theme-beallitasok.dc.html`** (`docs/E-18-FORDITOTT-ELLENORZES-tema-kimi.md`): felesleg nincs (a D-09 és az
  E-14b/E-17 kiegészítések ismertek); a 7 szekció minden vezérlője, tartománya és lépésköze egyezik; egyetlen megjelenési
  kérdés: a szekció-jegyzetek térköze (a v6 inline 10/12/8/6 px) — **javítva** (`km-tema-jegyzet-szinek/-formak/-mozgas/-io`).
- **Feliratok ↔ E-15 rajz** (`docs/E-18-FORDITOTT-ELLENORZES-feliratok-kimi.md`): két valódi telefonos eltérés — a kártya
  párnája 12 px, és a „Visszaállítás a közösre” gomb a nyelvek ALATT (nem a fejlécben) — **mindkettő javítva**
  (`km-feliratok-vissza-also`, `@media` 12 px). A betöltés/jog/importhiba üzenetsávok nincsenek a rajzon, de a v6 Theme-lap
  mintái (ugyanaz a `km-tema-uzenet`), szándékosak.
- **Fiókprofil ↔ mockup**: 0 valódi eltérés (E-17b).

## 4. Végigjátszás három nyelven és telefonon (E-18, a javítások után)

`/tmp/e14-jatek.py` (Theme) és `/tmp/e16-jatek.py` (Feliratok) hu/ro/en 1440 px-en és hu 390 px-en: mindkét lapon a teljes kör
(szerkesztés → tervezet → alkalmazás → a másik lapon látszik → elvetés → alapértékek / visszaállítás a közösre → import hibás és jó
csomaggal → verziók), oldalhiba nélkül. Képernyőképek: `/tmp/e18-vj/…`. A fiókprofil: `/tmp/e17b-jatek.py` (E-17b).

## 5. A-07 és A-09

- **A-07 (Theme-váltás minden UI-komponensre hat; brandkreatívra nem):** a lap feje a `hatasosTema(szervezetId)` tokenjeit adja
  (`layout.tsx`), minden képernyő csak tokenből színez (tokenőr); az alkalmazás után a másik lap `--primary`-ja is az új
  (`e14-jatek`: „másik lap --primary”); a mintakártya a brandprofil színeiből épül, a tokenőr-kivétel jelöli (E-10/E-17b).
- **A-09 (hibás import nem rontja el a működő konfigurációt):** mezőből és fájlból, kliensen és kiszolgálón ugyanaz az ellenőrzés
  (`temaEllenoriz`, `feliratCsomagEllenoriz`; próbák `tema.proba.ts` 5–6, `feliratok.proba.ts` 3); hibás csomag → tételes lista,
  semmi nem íródik; a hibautak (2. pont) szerint a sikertelen mentés/alkalmazás után is az előző marad.

## 6. Ágensköltség a szakaszban

`docs/AGENSEK.md`: E-13…E-18 összesen ≈ 0,33 USD (DeepSeek építő, Kimi tesztelő/fordító/ellenőr); az E-18 két ellenőre 0,0665 +
0,0502 USD. A teljes projekt eddig ≈ 0,57 USD (a tábla 37 sora).

## 7. Nyitva marad (Vilmosra vár)

- Egyszer be kell lépnie, hogy a fiókja megkapja a rendszergazda-jelölést (`RENDSZERGAZDA_EMAIL` a NAS `.env`-ben) — utána a `/tema`
  és `/feliratok` lapon megjelenik a szintválasztó (közös alap).
- Nézze meg a `/fiok`, `/tema`, `/feliratok` lapokat a teszten (az új fiókprofil is).
- A v6 „Minta betöltése” link az 1. lépésen — kell-e (régi kérdés).
- Anthropic-kulcs a vaultba (a D-10 híd addig is megy).

## 8. Következik

Az **5. szakasz — Hírfigyelő**: a terv (mint a NEGYEDIK-SZAKASZ) a `HIRFIGYELO-ATADO.md` és a `Hirfigyelo-prototipus.dc.html`
alapján (`design/fiokprofil-hirfigyelo-v7.zip`); a nyitott döntéseket egyenként visszük Vilmos elé (relevancia-pontozás, duplikátum-
szűrés, forrásellenőrzés mélysége, keresőszolgáltatás, e-mail-összefoglaló, szabályverziók tárolása, host-jogosultsági szerződés,
RO/EN átnézés). Kód csak a „mehet” után.
