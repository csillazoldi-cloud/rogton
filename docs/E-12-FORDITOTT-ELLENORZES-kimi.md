# E-12 Fordított ellenőrzés — v6 prototípus ellen

## Felesleg (van nálunk, nincs a v6-ban) — HIBA

| Képernyő | Elem (idézd a szöveget / az osztály nevét) | Hol a kódban (fájl) | Javaslat |
|----------|-------------------------------------------|---------------------|----------|
| 1. lépés | `km-csatolas` — a dokumentum-csatolás egyszerű `<label>` `<input type="file">` megoldás, nincs külön fájlnév-megjelenítő blokk és törlés gomb | `Lepes1.tsx` | A v6 szerint a csatolt fájl neve megjelenik külön dobozban törlés gombbal (`docName`, `docAttached`, `remove`); a mi egyszerű label-input megoldásunk nem egyezik a v6 struktúrájával — átalakítani vagy kérdés, hogy szándékos-e a leegyszerűsítés |
| 1. lépés | `onboarding1.dokumentum` szöveg — a v6-ban `{{ t.attachDoc }} <span>{{ t.attachDocOpt }}</span>` két részből áll | `Lepes1.tsx`, `hu.json` | A `dokumentum` kulcs egybe van vonva, a v6 szétválasztja a főcímet és az opcionális jelzést; szétválasztani `attachDoc` + `attachDocOpt` kulcsokra |
| 1. lépés | `onboarding1.arculat_weboldal_is` szöveg: `"✓ A weboldal is forrás"` — a v6-ban nincs pipa, sima gombcímke `brandSiteLabel` | `Lepes1.tsx`, `hu.json` | A pipa (`✓`) plusz szöveg helyett a v6 dinamikus címkét használ (`brandSiteLabel`); ha a v6 szerint gombnyomásra változik a címke, a mi fix szövegünk eltér — ellenőrizni, szándékos-e |
| 2. lépés | `km-ob-folyamat` — a v6-nak nincs külön folyamatjelző sávja a 2. lépésen, csak az 1. lépésen van `isProcessing` | `Lepes2.tsx` | A v6 `OB-02` képernyőjén nincs `isProcessing` állapot; a mi `javaslatFut` spinnerünk felesleges lehet, ha a v6 nem így kezeli — kérdés, szándékos-e a visszacsatolás |
| 2. lépés | `onboarding2.javaslatok_ujra` gomb szövege — a v6-ban `retrySuggest` (csak a hangnem finomításnál van `refineCustom`/`apply`) | `Lepes2.tsx`, `hu.json` | A v6 `step2Failed` esetén `retrySeed` van, de az a teljes seed újrakérése; a mi `javaslatok_ujra` gombunk a hiba sávban van, ami hasonló — ellenőrizni, hogy a v6 `retrySuggest` kulcsa egyezik-e |
| 2. lépés | `frissJavaslat` felvillanás (`data-friss`) — a v6-ban nincs ilyen vizuális visszacsatolás az AI-javaslatok érkezésére | `Lepes2.tsx` | A v6 `seedStep2` után nincs `justSeeded` állapot; a felvillanás felesleges, ha a v6 nem tartalmazza — eltávolítani vagy megerősíteni |
| 3. lépés | `km-ob-eredet-megj` — a v6 `OB-03` képernyőjén nincs ilyen globális eredet-megjegyzés a sorok alatt | `Lepes3.tsx` | A v6-ban az egyes sorok `mkRow` függvényében van eredet részlet, globális megjegyzés nincs; ha a v6 nem így működik, felesleges |
| 3. lépés | `onboarding3.eredet_megj` kulcs — a v6-ban nincs ilyen globális szöveg | `hu.json` | Törölni, ha a v6 nem így működik |
| 3. lépés | `km-ob-jovahagyas-megj` — a v6 `OB-03` képernyőjén nincs külön jóváhagyás-magyarázat a gombok alatt | `Lepes3.tsx` | A v6-ban nincs `jovahagyas_megj` megfelelője; felesleges, ha a v6 nem tartalmazza |
| 3. lépés | `onboarding3.jovahagyas_megj` kulcs — a v6-ban nincs ilyen szöveg | `hu.json` | Törölni, ha a v6 nem így működik |
| 3. lépés | `km-ob-jovahagyas-tiltva` — a v6-ban nincs külön tiltva-üzenet, a gomb `disabled` állapota elég | `Lepes3.tsx` | A v6 `approve` gombja `disabled` lehet, de külön magyarázó szöveg nincs; felesleges |
| 3. lépés | `onboarding3.jovahagyas_tiltva` kulcs — a v6-ban nincs ilyen szöveg | `hu.json` | Törölni, ha a v6 nem így működik |
| Keret | `km-ob-allapot` — a v6 fejlécében nincs mentés-állapot kijelzés (a v6-nak nincs `MentesAllapot` komponense) | `keret.tsx` | A v6 `e12-v6-lepesek.html` nem tartalmaz mentés-állapotot a fejlécben; felesleges, ha a v6 nem így működik |
| Keret | `onboarding.mentes_kesz`, `mentes_folyik`, `mentes_hiba`, `mentve_ekkor`, `ujraprobalas` kulcsok — a v6-ban nincs ilyen | `hu.json` | A v6 nem tartalmazza ezeket; feleslegesek, ha a v6 nem így működik |
| Keret | `km-elonezet` — a v6 `e12-v6-lepesek.html` nem tartalmaz előnézeti oldalsávot | `keret.tsx` | A v6-nak nincs `previewRows` vagy hasonló struktúrája a mellékelt HTML-ben; az egész előnézet felesleges lehet, ha a v6 nem így működik — **ez nagy eltérés, bizonytalan** |
| Keret | `ElonezetSor` komponens — a v6-ban nincs ilyen | `keret.tsx` | Felesleges, ha a v6 nem tartalmaz előnézetet |
| Keret | `arculatAllapotSzoveg` függvény az előnézetben — a v6-ban nincs ilyen | `keret.tsx` | Felesleges, ha nincs előnézet |
| Keret | `km-ob-lepessor` — a v6 lépésjelzője más struktúrájú lehet (a v6 HTML-ben nincs részletezve, de a `isStep1/2/3` logika más) | `keret.tsx` | A v6 `sc-if value="{{ isStep1 }}"` stb. módon vált, a mi komponens-alapú megoldásunk eltér; a lépésjelző megjelenése egyezhet, de a struktúra más |

## Hiány (van a v6-ban, nincs nálunk) — KÉRDÉS

| Képernyő | v6 elem (a `t.kulcs` és a jelölés) | Megjegyzés |
|----------|-----------------------------------|------------|
| 1. lépés | `t.s1t1`, `t.s1hl`, `t.s1t2` — a cím három részből áll, nálunk `onboarding1.cim_eleje` + `cim_kiemelt` kétrészes | A v6 cím: `"Kezdjük azzal,"` + `"mivel foglalkozol."` + középen a kiemelt; nálunk `cim_eleje` + `cim_kiemelt`, de a `s1t2` (záró rész) hiányzik — kérdés, szándékos-e a kétrészesre egyszerűsítés |
| 1. lépés | `t.namePh` — a név mező placeholder külön kulcs, nálunk `onboarding1.nev_pl` | Egyezik funkcionálisan, de a kulcsnév eltér — nem probléma, ha a szöveg ugyanaz |
| 1. lépés | `t.urlTabStyle`, `t.textTabStyle` — a v6 tab gombjai dinamikus stílust kapnak, nálunk fix `aria-pressed` alapú | A v6 `role="tablist"` megoldása stílusváltással működik, nálunk CSS osztályokkal — funkcionálisan egyezik, de a v6 dinamikusabb |
| 1. lépés | `t.descHelp` + `<a href="#" onClick="{{ loadSample }}">{{ t.loadSample }}</a>` — a leírásnál van minta betöltés link, nálunk nincs | **Hiányzik a minta betöltés funkció** — kérdés, szándékosan hagytuk-e ki |
| 1. lépés | `t.docAttached`, `t.remove` — a dokumentum csatolva állapot szövegei, nálunk nincsenek | A v6 külön dobozban mutatja a fájlnevet törléssel; nálunk egyszerűbb a megoldás — szándékos? |
| 1. lépés | `t.brandTitle`, `t.brandHelp`, `t.optional` — az arculat blokk címe, súgója, opcionális jelvénye külön kulcsok; nálunk `arculat_cim`, `arculat_opcionalis`, `arculat_leiras` | Funkcionálisan hasonló, de a v6 `brandTitle`/`brandHelp` elnevezései eltérnek — nem probléma, ha a szöveg lefedettség egyezik |
| 1. lépés | `brandLogoLabel`, `brandGuideLabel`, `brandRefsLabel`, `brandSiteLabel` — dinamikus címkék az arculat gombokhoz; nálunk fix `arculat_logo`, `arculat_kezikonyv`, `arculat_referenciak`, `arculat_weboldal_is` | A v6 gombnyomásra változtathat címkét (pl. kipipálva), nálunk fix szövegek — **viselkedési eltérés** |
| 1. lépés | `t.retryGen`, `t.pasteText`, `t.useAsSummary` — a hiba sáv gombjai; nálunk `ujraprobalom`, `bemasolom`, `ezt_hasznalom` | Funkcionálisan hasonló, de a v6 `useAsSummary` (`canManualAccept`) csak akkor jelenik meg, ha lehetséges; nálunk `ezt_hasznalom` csak leírás módnál — ellenőrizni, a feltételek egyeznek-e |
| 1. lépés | `t.phaseText` — a feldolgozás fázis szövege dinamikus (`phaseText`), nálunk fix `fazis1`/`fazis2` | A v6 `phaseText` változó, nálunk két fix kulcs — funkcionálisan egyezik, de a v6 rugalmasabb |
| 1. lépés | `t.procNote` — a feldolgozás alatti megjegyzés, nálunk `folyamat_megj` | Egyezik funkcionálisan |
| 1. lépés | `t.summaryBadgeStyle`, `t.summaryBadgeLabel` — az összefoglaló jelvénye dinamikus stílussal; nálunk `jelvenySrc` data attribútummal | A v6 inline stílust használ, nálunk CSS osztály — megjelenésben egyezhet |
| 1. lépés | `t.notFact` — a forrás megjegyzés része, nálunk `nem_teny` | Egyezik |
| 1. lépés | `t.pendingTitle`, `t.pendingNote`, `t.acceptNew`, `t.keepCur` — a függő javaslat szövegei; nálunk `fuggo_cim`, `fuggo_megj`, `elfogadom_ujat`, `megtartom` | Egyeznek funkcionálisan |
| 1. lépés | `t.clarifyLabel`, `t.clarifyOpt`, `t.clarifyPh` — a kérdés (clarify) mező; nálunk `kerdes_cimke`, `kerdes_opcionalis`, `kerdes_pl` | Egyeznek, de a v6 `showClarify` feltételhez kötött, nálunk `forras_tipus === "weboldal"` és `gepelt === null` és `!fuggo` — **eltérő feltétel** |
| 2. lépés | `t.s2a`, `t.s2hl`, `t.s2b` — a cím három részből áll, nálunk `onboarding2.cim_eleje` + `cim_kiemelt` + `cim_vege` | **Egyezik** — mindhárom rész megvan |
| 2. lépés | `t.sub2` — nálunk `onboarding2.alcim` | Egyezik |
| 2. lépés | `t.errAiTitle`, `t.aiDownBody`, `t.retrySuggest` — a 2. lépés hiba szövegei; nálunk `onboarding1.err_ai_cim`, `onboarding2.err_ai_szoveg`, `onboarding2.javaslatok_ujra` | A v6 `errAiTitle` külön kulcs, nálunk az 1. lépés `err_ai_cim`-jét újrahasznosítjuk — **kérdés, szándékos-e az azonos cím** |
| 2. lépés | `t.audLabel`, `t.audBadgeStyle`, `t.audBadgeLabel`, `t.audDeferLabel`, `t.audPh`, `t.deferredNote` — célközönség; nálunk `celkozonseg`, `Jelveny`, `kesobb`, `celkozonseg_pl`, `kesobbre_hagyva` | Funkcionálisan egyeznek |
| 2. lépés | `t.goalLabel`, `t.goalBadgeStyle`, `t.goalBadgeLabel`, `t.goalDeferLabel`, `t.goalPh` — kommunikációs cél; nálunk `cel`, `Jelveny`, `kesobb`, `cel_pl` | Funkcionálisan egyeznek |
| 2. lépés | `t.langsLabel`, `t.langsHelp`, `t.langBadgeStyle`, `t.langBadgeLabel`, `t.suggestPrefix`, `t.noLangs`, `t.langSearch` — nyelvek; nálunk `nyelvek`, `nyelvek_sugo`, `Jelveny`, `javasoljuk`, `nincs_nyelv`, `nyelv_kereses` | Funkcionálisan egyeznek |
| 2. lépés | `t.toneLabel`, `t.toneBadgeStyle`, `t.toneBadgeLabel`, `t.toneDeferLabel`, `t.tonePh`, `t.toneSampleLabel`, `t.refine`, `t.refineDirect`, `t.refineNeutral`, `t.toneNotePh`, `t.apply`, `t.newSuggestion` — hangnem; nálunk `hangnem`, `Jelveny`, `kesobb`, `hangnem_pl`, `minta_cimke`, `finomitas`, `kozvetlenebb`, `targyilagosabb`, `megjegyzes_pl`, `alkalmaz`, `uj_javaslat` | Funkcionálisan egyeznek, de a v6 `contentLangNote` dinamikus, nálunk `tartalomnyelv_cimke` — egyezik |
| 2. lépés | `t.backLabel`, `t.toStep3Label` — gomb szövegek; nálunk `vissza`, `tovabb_ellenorzes` + `nyil` | A v6 dinamikus címkéket használ, nálunk fix szövegek — funkcionálisan egyeznek |
| 3. lépés | A v6 `OB-03` képernyője a mellékletben csonkolt (`<sc-if value="{{ isStep3 }}">` után vége), de a struktúra részleges — **bizonytalan, mi hiányzik** | A v6 3. lépésének teljes struktúrája nem áll rendelkezésre; a mi `Lepes3.tsx` alapján kell összehasonlítani, de a v6 részletei hiányoznak |

## Eltérő viselkedés (megvan, de máshogy)

| Képernyő | v6 | Nálunk | Súly |
|----------|-----|--------|------|
| 1. lépés | A dokumentum-csatolás külön dobozban jelenik meg fájlnévvel és törlés gombbal (`docName`, `docAttached`, `remove`) | Egyszerű `<label>` `<input type="file">`, a fájlnév a label szövege lesz, nincs törlés gomb | közepes |
| 1. lépés | Az arculat gombok dinamikus címkéket kapnak (`brandLogoLabel` stb.), kattintásra változhat az állapotuk jelzése | Fix szövegek (`arculat_logo`, `arculat_kezikonyv` stb.), az `aria-pressed` jelzi az állapotot, de a szöveg nem változik | kicsi |
| 1. lépés | A `clarify` (kérdés) mező csak `showClarify` feltételre jelenik meg (bizonytalan, mikor) | Csak ha `forras_tipus === "weboldal"` ÉS `gepelt === null` ÉS `!fuggo` | közepes |
| 1. lépés | A `useAsSummary` (`canManualAccept`) gomb megjelenése dinamikus | A mi `ezt_hasznalom` gomb csak `hibaTipus === "ai"` és `forras_tipus === "leiras"` és `leiras.trim().length > 10` esetén — **eltérő feltétel** | közepes |
| 2. lépés | A v6 `seedStep2` egyszer fut belépéskor, nincs vizuális visszacsatolás a sikeres javaslat érkezésére | `frissJavaslat` felvillanás (`data-friss`) jelzi az AI-javaslatok érkezését | kicsi |
| 2. lépés | A v6 `step2Failed` esetén `retrySeed` gomb van | Mi `javaslatok_ujra` gombot mutatunk, de a hiba kezelése hasonló | kicsi |
| Keret | A v6 fejlécében nincs mentés-állapot kijelzés | Van `MentesAllapot` komponens ponttal, szöveggel, újrapróbálás gombbal | közepes |
| Keret | A v6-nak nincs előnézeti oldalsávja a mellékelt HTML-ben | Van `km-elonezet` oldalsáv `ElonezetSor`-okkal | **nagy** — bizonytalan, mert a v6 HTML csonkolt lehet |
| Keret | A v6 lépésjelzője `sc-if` alapú, komponens-szintű váltással | Mi `OnboardingKeret`-ben közös lépésjelzőt használunk `km-ob-lepessor` osztállyal | kicsi — a megjelenés hasonló lehet |

## Egyezik

### 1. lépés (OB-01)
- Cím struktúra: kiemelt rész a közepén (bár a v6 háromrészes, mi kétrészesnek tűnünk, de a funkcionalitás hasonló)
- Alcím / súgó szöveg
- Név mező: címke, input, placeholder, súgó
- Forrás váltó: két tab gomb (`weboldal` / `leiras`)
- Weboldal mező: címke, input (mono), placeholder, súgó — csak weboldal módban
- Leírás mező: címke, textarea, placeholder — csak leírás módban
- Dokumentum csatolás: funkcionálisan van (bár a megjelenés eltér)
- Arculat blokk: cím, opcionális jelvény, súgó, négy gomb (logo, kézikönyv, referenciák, weboldal_is)
- Feldolgozás állapot: spinner, fázis szöveg, megjegyzés
- Hiba állapot: cím, szöveg, gombok (újrapróbálás, bemásolom, ezt használom)
- Összefoglaló kész állapot: cím, jelvény, szerkeszthető textarea, forrás megjegyzés, nem tény figyelmeztetés
- Függő javaslat: cím, megjegyzés, szöveg, elfogad/megtart gombok
- Kérdés (clarify) mező: címke, opcionális jelzés, input, placeholder — feltételesen
- Gombok: összefoglaló készítés / tovább / újragenerálás

### 2. lépés (OB-02)
- Cím: három részes (eleje, kiemelt, vége) — **megvan nálunk is**
- Alcím
- Hiba sáv: cím, szöveg, újrapróbálás gomb
- Célközönség blokk: cím, jelvény, később gomb, textarea / későbbre hagyva szöveg
- Kommunikációs cél blokk: cím, jelvény, később gomb, textarea / későbbre hagyva szöveg
- Tartalomnyelvek blokk: cím, jelvény, súgó, javasolt nyelvek gombok, kiválasztott nyelvek chipek, kereső input, nyelv opciók lista
- Hangnem blokk: cím, jelvény, később gomb, input, minta szöveg (ha van), finomítás gombok (közvetlenebb, tárgyilagosabb), egyedi megjegyzés input + alkalmaz, függő javaslat (cím, leírás, minta, elfogad/megtart)
- Navigáció: vissza, tovább gombok

### 3. lépés (OB-03) — részleges, a v6 csonkolt
- Cím: három részes (eleje, kiemelt, vége) — **megvan**
- Alcím
- Profil sorok: címke, jelvény, szerkesztés gomb, érték / üres / későbbre hagyva
- Eredet részlet: jelvényre kattintva megnyílik (a v6 `mkRow` logikája alapján feltételezett)
- Arculat blokk: cím, jelvény, később gomb, súgó, színek, betűk, képvilág, követendő/kerülendő, lekerekítés, nyelv, mintakártya, jóváhagyás/visszavonás
- Hiányzók figyelmeztetése
- Jóváhagyás gomb: feltételesen tiltva, folyamat állapot
- Navigáció: vissza gomb

### Keret
- Fejléc: szervezet név, nyelvválasztó, kilépés gomb — a v6 "munkacím" helyén a szervezet név (ismert eltérés)
- Lépésjelző: 1-2-3 lépés, számláló "n / 3. lépés" — a v6 szerint ugyanez (ismert eltérés: mi CSS osztályainkkal)
