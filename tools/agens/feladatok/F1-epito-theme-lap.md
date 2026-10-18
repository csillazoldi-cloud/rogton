# F-1 · Építő — a Theme-beállítások lap csoportjai és a Térköz-csoport (`apps/web/app/tema/`)

CÉL: a Theme-lap hat csoportfület kap (Szín · Betű · Betűméret · Forma · Térköz · Egyéb), a Térköz fülön a tizenöt fokú
térköz-skála szerkeszthető a rajz szerint (a köz rajzával és a használat számával), a megerősítő sáv a lap aljára rögzül.

FORRÁS: a mellékelt `Tema.tsx` és `tema.css` (ezeket írod át), a rajz 4. artboardjának leírása (lent), és a feliratkulcsok.
A designrendszer VÁLTOZOTT (egy másik ágens csinálja, párhuzamosan) — erre építs:
- ÚJ alaptokenek: `--ter-0` … `--ter-14` (alap: 0,2,4,6,8,10,12,14,16,20,24,32,40,56,80 px). A `--ter-0` értéke mindig "0px",
  nem szerkeszthető. A többi fok 0-tól a következő fok kétszereséig állítható; a `TOKEN_SZABALYOK["--ter-N"]` `{tipus:"size",min,max}`.
- A HÉT RÉGI token (`--gap`, `--pad-card`, `--pad-block`, `--pad-field-y`, `--pad-field-x`, `--btn-pad-y`, `--btn-pad-x`)
  NINCS TÖBBÉ az `AlapTokenek`-ben — a Tema.tsx-ből az ezekre mutató csúszkák KIKERÜLNEK (a régi „Térközök és méretek” szekció
  `--pad-card` csúszkája és az „Advanced” `--gap`, `--btn-pad-y`, `--btn-pad-x` csúszkája). A `--control-min` marad (Egyéb).
- A használat-számláló adata: `import terHasznalat from "./ter-hasznalat.json"` — alakja `{ "--ter-0": 12, "--ter-1": 53, … }`
  (szám = hány helyen használja a kód). Ezt a fájlt más készíti; te csak beolvasod. Ha egy fok hiányzik, a `ter.hasznalat_nincs` felirat.

A 4. ARTBOARD (asztali 1440), amit meg kell építeni — ami itt nincs, az nem kerül a képernyőre:
- Fejléc: a lap címe (`tema.title`, marad), mellette jelvény: `ter.theme_szam` felirat `{n}` = az alaptokenek száma
  (`TOKEN_KULCSOK.length`), `{cs}` = 6; jobbra a meglévő „mentetlen tervezet” jelző (a mai `km-tema-piszkos`, feliratai maradnak).
  A fejléc MEGLÉVŐ vezérlői maradnak: szintválasztó (rendszergazda), GazdaNav, Nyelvvalaszto, „Alapértékek”, „Tervezet mentése”,
  a „Vissza a fiókhoz” link. Az „Elvetés” és az „Alkalmazás” gomb a fejlécből ÁTKÖLTÖZIK az alsó sávba (lásd lent) — nem duplázódik.
- Csoportfülek a fejléc alatt, egy sorban, bal oldalt: `ter.cs_szin` `ter.cs_betu` `ter.cs_meret` `ter.cs_forma` `ter.cs_terkoz`
  `ter.cs_egyeb`; az aktív fül kitöltött (mint a mai `km-tema-mod-gomb[data-be="true"]`). Kliens-állapot (`useState`), alap: Szín.
  Beosztás: Szín = a mai színek szekció + a haladó „árnyékszín”; Betű = a három betűválasztó + arab betűk + `--fw-head`, `--fw-strong`;
  Betűméret = a hat `--fs-*` csúszka + `--lh`; Forma = a négy lekerekítés + `--bw`; Térköz = az új csoport; Egyéb = effektek
  (blur, glass, shadow-strength, foto-hero, foto-zaro, fatyol, jegyzet), mozgás, `--sat-glass`, `--control-min`, export/import, verziók.
  A jobb oldali ELŐNÉZET-oszlop marad, minden fülnél látszik.
- A Térköz csoport: cím `ter.theme_csoport_cim`; súgó `ter.theme_csoport_sugo`; alatta egy táblázatszerű lista, egy sor egy fok,
  a lépcső sorrendjében 0-tól 14-ig. Egy sor: a fok neve kódbetűvel (`--ter-4`), egy SZÁMMEZŐ (`input type="number"`, px, min/max a
  `TOKEN_SZABALYOK`-ból, lépés 1, `--ter-0`-nál `disabled`), a köz RAJZA (egy vízszintes sáv, amelynek szélessége PONTOSAN a fok
  értéke pixelben: `style={{ width: tokenek["--ter-N"] }}`, magassága `var(--ter-7)`, háttere `var(--src-web)`; a 0-nál egy `--bw`
  vékony vonal `var(--line)` színnel), jobbra a használat: `ter.hasznalat_db` `{n}`-nel, vagy `ter.hasznalat_nincs`.
  A lista alatt jegyzet: `ter.theme_zart`. A szerkesztés `tokenBeallit("--ter-N", ertek + "px")`-t hív; nem szerkeszthető
  (`!szerkesztheto`) állapotban a mezők `disabled`.
- ALSÓ SÁV, a lap aljára rögzítve (`position: sticky; bottom: 0` a fő tartalom alján, vagy `position: fixed` — legyen mindig látható):
  bal oldalt `ter.sav_szoveg` `{n}` = hány `--ter-*` fok tér el a `adat.alkalmazott` értékétől (0-nál is kiírjuk a mondatot);
  jobb oldalt két gomb: `ter.sav_elvet` (a meglévő `elvet()`), `ter.sav_alkalmaz` (a meglévő `alkalmaz()`, kiemelt stílus).
  Minden fülön látszik. A `disabled` feltételek ugyanazok, mint a mai fejlécgomboknál.
- Telefonon (≤ 900px): a fülek sorba törnek; a Térköz sorai: név · szám · sáv egy sorban, a használat alatta.

HATÁR: csak `apps/web/app/tema/Tema.tsx` és `apps/web/app/tema/tema.css` (és ha kell, egy új `apps/web/app/tema/TerkozCsoport.tsx`).
Máshoz nem nyúlsz. A `page.tsx`, az API, az `ElonezetPanel.tsx` változatlan. Új feliratkulcsot NEM találsz ki: csak a fentiek és a
Tema.tsx-ben ma is használt `tema.*` kulcsok.
KÉSZ, HA: típusellenőrzés zöld; a lapon nincs beégetett szín, betű, méret, lekerekítés — ÉS TÉRKÖZ SEM: a `tema.css`-ben minden
`margin`, `padding`, `gap` érték `var(--ter-N)` (a meglévő pixelértékeket is írd át: a legközelebbi fokra, holtversenyben a
kisebbre; 0 → `var(--ter-0)`; pl. `padding: 14px 24px` → `padding: var(--ter-7) var(--ter-10)`). A `width/height` alakértékek maradhatnak px-ben.
TILOS: halott vezérlő (minden gomb és mező mögött gépezet); a hét régi token bármilyen említése; új API-hívás; `any`.
Visszaadás: a fájlok TELJES tartalommal, `=== FÁJL: apps/web/app/tema/Tema.tsx ===` és `=== FÁJL: apps/web/app/tema/tema.css ===`
blokkban. A Tema.tsx legyen ≤ 520 sor; ha nem fér, a Térköz csoportot tedd külön komponensbe (`TerkozCsoport.tsx`), külön blokkban.
