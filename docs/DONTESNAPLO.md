# DÖNTÉSNAPLÓ — az F-futam (2026-09-12-től)

A megbízás (`docs/ORCHESTRATOR-MEGBIZAS.md` 3.1) szerint: részletkérdésen nem állunk meg — döntünk, ide írjuk, haladunk.
Minden sor három mondat: mi volt a kérdés, mit választottunk (a legkevesebb új gépezet, visszafordítható), mi a másik út.
Ami itt nem szerepel, az csend — és az hiba.

## D-F01 · 2026-09-12 · a futam helye
Kérdés: a megbízás a Gigabyte-on futó Claude-ot feltételezi; ez a munkamenet a **Dellen** (T2, Windows) fut, ahol nem volt pnpm, sem próba-adatbázis.
Döntés: az ellenőrzések (határőr, tokenőr, típus) és a próbák a Dellen futnak, helyi Docker-Postgresen (`tools/proba-kornyezet/`), a kód innen megy a GitHubra, a fordítás és a kirakás marad a Gigabyte robotjáé (D-22 nem sérül: a Dellen nem épül doboz).
Másik út: ssh a Gigabyte-ra minden ellenőrzéshez — nincs hozzá kulcs a vaultban; ha Vilmos ad, egy sor a scriptben.

## D-F02 · 2026-09-12 · a futam dokumentumainak helye
Kérdés: a megbízás `DONTESNAPLO.md`, `MERES.md`, `TEENDOK.md`, `JELENTES.md` néven kér lapokat, hely nélkül.
Döntés: mind a `docs/` mappában, ezen a néven.
Másik út: a tárhely gyökere — egy `git mv`, semmi más.

## D-F03 · 2026-09-12 · a lemezre másolt régebbi dokumentumok
Kérdés: a megbízással együtt a `docs/` mappába régebbi változatok kerültek (5 fájl tartalma tért el: `AGENSEK.md`, `HETEDIK-SZAKASZ.md` −847 sor, `RENDSZERLEIRAS.md`, `TESZTELESI-UTMUTATO.md`, `agens-naplo.jsonl` −94 sor). Két azonos volt egy régebbi commit tartalmával, a többi az E-35 „még nem futott a NAS-on” állapotát írta le, ami azóta megtörtént.
Döntés: a mentett (újabb) változat maradt érvényben; a lemezen talált példányok a `_torolni/2026-09-12-regi-docs-a-lemezrol/` mappában és egy git-stashben vannak. Nem töröltünk.
Másik út: ha Vilmos szerint a régebbi példányban volt szándékos módosítás, a `_torolni` mappából egy összefésülés — 10 perc.

## D-F04 · 2026-09-12 · a tokenőr Windows-hibája
Kérdés: a tokenőr a Dellen 33 hibát jelzett a `letolto.proba.ts`-ben (`&#225;` HTML-entitásokat hex színnek nézett), mert a `/probak/` kivétel `/`-t vár, a Windows-útvonal `\`-t ad.
Döntés: a kivétel-ellenőrzés előtt az útvonalat `/`-re normalizáljuk (`tools/hatar/tokenor.mjs`, egy sor). Linuxon változatlan a viselkedés.
Másik út: a próbafájl sorai `tokenőr: ok` megjegyzéssel — 4 sor zaj a kódban, és a következő Windows-futásnál ugyanez jönne elő máshol.

## D-F05 · 2026-09-12 · az állapotlap régi lépéseinek óraszáma
Kérdés: az állapotlap a lépésekhez órát ír; az E-19…B-01 lépések (2026-09-07…09-11) sehol nem rögzítettek óraszámot.
Döntés: a hiányzó lépések **becsült** órával kerültek fel (1–4 óra, a KIRAKAS.md leírásainak terjedelme szerint), a „ki” mező viszont MÉRT: a `docs/agens-naplo.jsonl` alapján. A lap összesített százaléka nem függ az óráktól (a szakaszok átlaga).
Másik út: óra nélkül felvenni — akkor az „Összesen X óra” sor hazudna a másik irányba (kevesebbet mutatna).

## D-F06 · 2026-09-12 · a „Most rajtad áll” lista
Kérdés: a listán 12 tétel állt, köztük „nézd meg a Theme-felületet” (E-14) és „lépj be egyszer” — mind 2026-09-07-i, azóta a Theme és a Feliratok kint van és használatban.
Döntés: a lista újraírva a megbízás 3.2 öt oka szerint: 7 tétel maradt (F-7 árak/modul-lista, nyitólap adatai, emberi lektor, az AI helye élesben, Google-betűk, jelszó-visszaállítás végigkattintása, Anthropic-kulcs).
Másik út: ha valamelyik levett tétel Vilmos szerint még nyitott, egy sor a JSON-ban.

## D-F07 · 2026-09-12 · a design/r1…r6 mappák hiánya
Kérdés: a megbízás forrásként `design/r1-kezdokepernyo/` … `design/r6-fajlfeltoltes/` mappákat nevez meg; a tárhelyen egyik sincs, csak a `design/Design rendszer tokenei.zip` (az R-0 átadója) érkezett.
Döntés: az F-1 az R-0 zipből épül; az F-2…F-6 rajz nélkül **nem kezdhető** (a rajz a szerződés) — a `TEENDOK.md`-be és a „rajtad” listára kerül, hogy a rajzok hiányoznak, és amíg nincsenek, az F-1 után a rajz nélkül is elvégezhető részek mennek (mag-csomag, próbák, feliratok).
Másik út: ha a rajzok másik mappában vannak (SynologyDrive), egy másolás a `design/` alá.

## D-F08 · 2026-09-12 · a hét régi térköz-token sorsa
Kérdés: a `--gap`, `--pad-card`, `--pad-block`, `--pad-field-y/x`, `--btn-pad-y/x` tárolt alaptokenek voltak (a Theme-lapon csúszkával); az átadó szerint a skálára kell mutatniuk.
Döntés: származtatott tokenek lettek (`szarmaztat()`: `--pad-card: var(--ter-11)` stb.), kikerültek a tárolt készletből; a 0044 migráció a tárolt közös alapból és a szervezeti felülírásokból is kiveszi a hét kulcsot, a betöltő az ismeretlen kulcsot elengedi (nem esik vissza a tartalék témára). Egy szervezet régi `--pad-card` felülírása így elveszik — a teszten csak próbaszervezetek vannak.
Másik út: a hét tokent megtartani tárolt tokennek, és a skálát csak az új lapokon használni — ez pont az, amit Vilmos 2026-09-11-én elvetett („a meglévőkön is”).

## D-F09 · 2026-09-12 · a fok-jelölés színe a Theme-lapon
Kérdés: a `tokenek.md` két új színtokent javasol a köz rajzához (`--ter-jel`, `--ter-jel-bg`), vagy a meglévő `--src-web` / `--src-web-bg` párost.
Döntés: a meglévő páros (nincs új gépezet); a sáv `--src-web`, a fejléc-jelvény `--src-web-bg`. A `kerdesek.md` 2.3 maga ajánlja ezt a második utat.
Másik út: két új származtatott szín a `szarmaztat()`-ban — 2 sor, ha Vilmos zavarónak találja, hogy a fok-jel úgy néz ki, mint a „web forrás” jelvény.

## D-F10 · 2026-09-12 · mi marad a Theme-lapon, amit a 4. artboard nem rajzol
Kérdés: a rajz csak a Térköz-csoportot és a lap keretét (fejléc, fülek, alsó sáv) mutatja; a v6 szerinti előnézet-oszlop, a szintválasztó, az export/import, a verziók nincsenek rajta.
Döntés: ezek MARADNAK (a v6 rajza a mesterük, működő gépezet mögöttük, Vilmos kérte a verziólistát); az „Elvetés” és az „Alkalmazás” a fejlécből az alsó sávba költözött (a rajz szerint), nem duplázódik. A régi „Térközök és méretek” csúszkák (`--pad-card`, `--gap`, `--btn-pad-*`) kikerültek.
Másik út: az előnézet és a haladó elemek elrejtése a Térköz fülön — rajz kellene róla.

## D-F11 · 2026-09-12 · a stíluslapok átírása: eszköz, nem ügynök
Kérdés: a megbízás a sokfájlos gépies átírást a Kimire adná. A Theme-lap stíluslapját a Kimi átírta, de a fokokat rosszul párosította (12px → `--ter-3`, ami 6px; a `tokenőr: ok` megjegyzéseket is elhagyta).
Döntés: a 13 stíluslap 654 deklarációját a determinisztikus `tools/meres/terkoz-atir.py` írta át az átadó kulcsa szerint (mérhető, ismételhető); a Kimi CSS-e helyett az eredeti + eszköz + a Kimi ÚJ szabályai kézzel. A Kimi feladattípusa: felület-szerkezet igen, számkulcsos átírás nem — ez a napló szerinti átrendezés (0.1 pont).
Másik út: a Kimi kimenetének kézi javítása — több idő, kevesebb biztonság.

## D-F12 · 2026-09-12 · képernyőkép a gép saját böngészőjével
Kérdés: a képernyőképekhez böngésző kell; a Dellen nincs Playwright-böngésző, a Cowork-féle képernyőkép-út nincs.
Döntés: `tools/kepernyokep/kep.mjs` — `playwright-core` (nem tölt le böngészőt) a gép Edge-ével; próbafiókkal belép, asztali+telefon képet készít; a tesztoldalt a NAS-on át nézi (`--resolve`). Ez az eszköz a „kész” harmadik feltételének (képernyőkép Vilmosnak) állandó szerszáma.
Másik út: teljes Playwright telepítés Chromium-letöltéssel (~150 MB) — nem kell.

## D-F13 · 2026-09-12 · az állapotlap közvetlenül a NAS-ra megy
Kérdés: az állapotlap a főág változásával a Gigabyte robotján át kerülne ki; 2026-09-12 10:50-kor feltöltöttem, 11:15-kor a lap még a 09-11-i adatot mutatta (mérve a NAS-on át) — a robot nem rakta ki.
Döntés: `nas/allapot-kirak.sh` — a lap két fájlja a NAS `public/allapot` mappájába megy közvetlenül, a NAS-kapun át (másodpercek, a NAS nem fordít). A `nas-parancs.sh` és a `jelszo-kerdes.py` Windowson (Dell) is fut (nincs `setsid`, `.cmd` burok az askpass-hoz, a tárhely melletti vault).
Másik út: a robot rendbetétele a Gigabyte-on — a Dellről nem érem el (nincs ssh-kulcs); Vilmosra vár (rajtad-lista).

## D-F14 · 2026-09-12 · a sorrend: F-3 gépezete az F-2 előtt
Kérdés: a megbízás sorrendje F-2 (kezdőképernyő, rajz: design/r1) → F-3. A `design/r1…r6` mappák NINCSENEK a tárhelyen (T-1); rajz nélkül képernyő nem épül.
Döntés: a 3.3/5. pont szerint a rajz nélkül elvégezhető rész megy előre: az F-3 magja (`@km/hozzaferes-core`), a webalkalmazás végpontjai és a második befogadó — képernyő nélkül. A Tagok képernyő és a `/meghivo/<jegy>` lap a rajz megérkezése után épül; addig a link csak az API válaszában létezik (halott vezérlő nincs, mert vezérlő sincs).
Másik út: várni a rajzokra — órák állnának.

## D-F15 · 2026-09-12 · a modul hibakódjai az API nyelvén
Kérdés: a `HibaValasz.hiba` a contracts zárt `HibaKod` listája; a modul saját kódjai (NAGYOBB_SZEREP, MAR_TAG, …) nem voltak benne, a végpontok típushibával buktak.
Döntés: a kilenc kód bekerült a contracts `HibaKod`-jába — ez a befogadó fordítása (ugyanazok a szavak), a MODULSZABÁLY 11. pontja szerint a contracts-ban típus és séma lehet. A HTTP-státusz a szerződés 6. pontja szerint.
Másik út: külön `HozzaferesHibaValasz` séma a végpontokon — több típus, semmi haszon.

## D-F16 · 2026-09-12 · MAGAT_NEM az UTOLSO_TULAJDONOS előtt
Kérdés: az utolsó tulajdonos SAJÁT lefokozása/eltávolítása két szabályt is sért; melyik indok szóljon?
Döntés: a szerződés sorrendje (2) MAGAT_NEM → (4) UTOLSO_TULAJDONOS marad; így a saját fiókra mindig MAGAT_NEM jön (kilépni a `kilep` művelettel lehet, amit az utolsó tulajdonosnak az UTOLSO_TULAJDONOS tilt). A mag próbája és a szerződés ehhez igazítva.
Másik út: a (4) előre — akkor a felirat „az utolsó tulajdonos…” szólna a saját műveletnél; egy sor csere, ha Vilmos ezt akarja.

## D-F17 · 2026-09-12 · ágens-hibák, amiket a próbák fogtak meg (nem mentek be ellenőrzés nélkül)
- DeepSeek (web): a `db().execute()` eredményét tömbnek vette (`{ rows }`), a jegy szerinti keresés minden jegyre 404-et adott; a `params`-t szinkronnak (Next 16-ban ígéret); a tagság `csatlakozott` oszlopát kitalálta (`letrehozva`); a védelmi szabályban `km.aktualis_szervezet` (a valódi `app.szervezet_id`); a mátrix-sorokból hiányzott a `fajl`. Mind javítva, a 11 élő próba zöld.
- Kimi (referencia-host): a `zar()` a `Kornyezet` típusán kívül; a próbában A tagságát nem tette a tárba (így „nem volt utolsó tulajdonos”). Javítva, 36 próba zöld.
- Qwen (próbák): 1. körben a jegy továbbadásán tanakodva a kimeneti keretbe futott (8000 token); 2. körben 11 eset, ebből 2 elvárás hibás (201/200, a felhasznált jegy MAR_TAG helyett FELHASZNALVA). Javítva.

## D-F18 · 2026-09-12 · a meghívó fiók-hivatkozásai és egy saját hiba
Kérdés: a `meghivo.letrehozta` / `elfogadta` hivatkozás a fiókra ON DELETE nélkül készült; a teljes próbasor takarítása (`DELETE FROM fiok`) 17 fájlban elhasalt rajta. **Saját hiba:** az F-3-at a teljes próbasor eredményének elolvasása ELŐTT egyesítettem a főágra (a részpróbák zöldek voltak) — a főág percekig hibás állapotot hordozott. Ez a megbízás 5.3 pontjának megsértése; nem ismétlődhet: a főágra egyesítés előtt a TELJES sor eredménye kell.
Döntés: 0046 migráció — a kiadó fiókjával a meghívói törlődnek (CASCADE), az elfogadó fiókja SET NULL; a séma ugyanígy. A termékben fiók törlése nincs (R-3), ez a próbák és a rendszergazdai takarítás útja.
Másik út: a próbák takarítását a meghívó törlésével bővíteni — a valódi hivatkozási szabály maradt volna rossz.

## D-F19 · 2026-09-12 · F-4 gépezet a rajz előtt; a jelszóváltás kilépteti a többi eszközt
Kérdés: a Saját fiók (R-3) rajza (design/r3) hiányzik; a gépezet a megbízás szövegéből egyértelmű. Külön kérdés: a jelszóváltás után mi legyen a többi eszköz munkamenetével?
Döntés: három végpont képernyő nélkül (`PUT /api/fiok/jelszo`, `PUT /api/fiok/nev`, `POST /api/fiok/kileptetes-mindenhol`), e-mail-módosító végpont NINCS, fióktörlés NINCS. A jelszóváltás a fiók MINDEN MÁS munkamenetét törli (a mostani marad) — aki jelszót vált, általában azért teszi, mert a régi kikerülhetett; a válasz megmondja, hány eszköz lett kiléptetve. A hibakód `ROSSZ_JELENLEGI_JELSZO` (400 — a 403 a rendszerben a szerep hiányát jelenti) — nem `ROSSZ_BELEPES`, hogy a felület pontos mondatot adhasson.
Másik út: a jelszóváltás ne nyúljon a többi munkamenethez — egy sor (a `ne(...)` feltétel) elhagyása.

## D-F20 · 2026-09-12 · az AI-kapcsoló a hírfigyelő zárt szótárában
Kérdés: a szervezet AI-kapcsolója (R-4) minden AI-hívás előtt megáll (`AI_KIKAPCSOLVA`), de a hírfigyelő magja (`@km/news-monitor-core` 0.2) zárt hibakód-listát kér az AI-hívótól, amelyben ez nincs — a mag módosítása nagy verziót és a második befogadó igazítását jelentené.
Döntés: a webalkalmazás hírfigyelő-illesztője a kikapcsolt AI-t a mag nyelvén „AI_NEM_ELERHETO"-nak adja (a mag szempontjából igaz: nem elérhető); az OK az eseménynaplóban (`ai_kapcsolo_valtozott`) és a szervezet beállításában látszik. Az onboarding és a többi AI-végpont a saját szótárában viszi tovább az `AI_KIKAPCSOLVA`-t (409).
Másik út: a mag `AiHivo` kódlistájának bővítése `AI_KIKAPCSOLVA`-val — 0.3-as kiadás, mindkét befogadó illesztője frissül; ha Vilmos a hírfigyelő felületén külön mondatot akar erre, ez a lépés.

## D-F21 · 2026-09-12 · fiókszintű események a munkatér naplóján kívül
Kérdés: a belépés, kilépés, jelszóváltás, „kiléptetés mindenhol" nem egy munkatérhez tartozik (egy fióknak több is lehet); hova kerüljön?
Döntés: szervezet nélkül (`szervezet_id` NULL) — a munkatér naplójában nem jelennek meg, a rendszergazda naplója (`GET /api/esemenyek/rendszer`) mutatja. A tárolás egy táblában; a km_app szabálya a saját szervezet sorait és a szervezet nélkülieket engedi (a naplólista szervezetre szűr, a szervezet nélkülieket csak a rendszergazda-végpont adja ki). A Kimi SECURITY DEFINER függvényes változatát nem vettem át: kevesebb gépezet ugyanarra.
Másik út: a belépést a fiók minden munkaterébe beírni — n sor egy eseményre; ha a tulajdonosoknak látni kell, ki lépett be a munkatérből, ez a bővítés.

## D-F22 · 2026-09-12 · a pénznem munkatér-beállítás (D5), tárolt árfolyammal, vezérlő nélkül
Kérdés: a rajz (R-1 v3) kimondja, hogy a pénznem a munkatér beállítása (euró · dollár · forint · lej), és „nem árfolyamból számolunk". Az AI-költséget viszont a szolgáltatók USD-ben árazzák, és a rendszer `becsult_usd`-ben méri — négy tárolt érték hívásonként nem létezik.
Döntés: `szervezet.penznem` (alap EUR — a rajz példája; az ELLENORZES-JAVITOKOR 5/3 javaslata szerint a rajz euróban marad) + egy `arfolyam` tábla négy TÁROLT sorral (EUR 0,92 · USD 1 · HUF 360 · RON 4,60 egy USD-re), amit a rendszergazda állít (`PUT /api/beallitas/arfolyam`); élő árfolyam-lekérés NINCS. A csempe a munkatér pénznemében mutat, a mért USD-t is visszaadja. A pénznem állítására a rajzon nincs vezérlő → a képernyőn sincs; a végpont (`PUT /api/beallitas/penznem`) és a próbája megvan, a vezérlő rajzot vár (TEENDOK).
Másik út: a kezdőértékek helyett Vilmos árfolyamai — egy `PUT` hívás vagy SQL. **Vilmos 2026-09-12 20:05: „igen, jók" — a kezdőértékek maradnak.**

## D-F23 · 2026-09-12 · a Gépház a tulajdonosnak és a rendszergazdának, a szerkesztőnek nem
Kérdés (ELLENORZES-JAVITOKOR 5/1, kerdesek.md 2.1): a rajzon a Gépház mindenkinek látszik, aki nem néző — a szerkesztőnek is. A Theme- és felirat-felülírás viszont szervezeti döntés.
Döntés: a Gépház ajtaja a tulajdonosnak (2 csempe) és a rendszergazdának (4 csempe) látszik; a szerkesztőnek nem — a `GET /api/gephaz` neki 403, a `/gephaz` lap a kezdőlapra küldi. Ez az ellenőrzés javaslata; a rajz `tulajdonos` kapcsolója szerint egy szó.
Másik út: a szerkesztő is lássa — a `felsoSavAdat` és a `gephazNezet` egy-egy feltétele.

## D-F24 · 2026-09-12 · a Tagok sor nem kerül élesbe
Kérdés (ELLENORZES-JAVITOKOR 5/2): a munkatér-lenyíló Tagok sora (`nav.tagok`, `nav.tagok_szam`) az R-2 gépezetére vár; a rajz megjelölve mutatja.
Döntés: élesben a sor NEM jelenik meg (nincs halott vezérlő); a feliratkulcsai a migrációban bent vannak, hogy az R-2 kör csak bekapcsolja. A lenyíló így egy munkatérnél is tartalmaz valamit: „Ez a munkatér" + a név + a szerep — tehát nem üres.
Másik út: zárt, egy mondattal jelölt sor — az ellenőrzés kifejezetten ellene javasolt.

## D-F25 · 2026-09-12 · a munkatér-váltás a fiókon tárolt választás; a felső sáv először az új lapokon
Kérdés: az `aktualisSzervezet()` ma a fiók ELSŐ szervezetét adja (26 hívóhely); a rajz lenyílója váltást ígér. Hova kerüljön a választás, és hova a felső sáv?
Döntés: `fiok.aktualis_szervezet_id` — az `aktualisFiok()` a választottat teszi a lista elejére, így a 26 hívóhely változatlanul jó; `POST /api/szervezet/valt` csak a saját tagságok közt enged. A felső sáv (`FelsoSav`) most a kezdőlapon és a Gépházon jelenik meg; a régi lapok (fiók, hírfigyelő, Theme, Feliratok, Költség, Fiókok) saját rajzolt fejlécét egy külön kör cseréli (TEENDOK), mert azok rajzán ez a sáv nincs. A belépés után a `/kezdolap` a cél (eddig `/onboarding/1`); az onboardingot a kezdőlap első-használat kártyája nyitja.
Másik út: süti a választásnak — minden hívóhelyen külön olvasás, a háttérfutásban semmi; ezért nem.

## D-F26 · 2026-09-12 · két új méret-token a csempékhez (--tile-min, --fs-metric)
Kérdés: az R-1 átadó `tokenek.md` 3. pontja két méret-tokent kért — `--tile-min` (300px, a rács hasábjának minimális szélessége: ez dönti el, hol tör sorba) és `--fs-metric` (30px, a csempék mérőszáma). A design-systemben egyik sem létezett; nélkülük a rács egy hasábra esett (mérve: a kezdőlap első képernyőképén a hat csempe két hasábban, mert a `minmax(var(--tile-min), 1fr)` érvénytelen volt).
Döntés: mindkettő ALAPTOKEN (`AlapTokenek`, tema-alap.json, a Theme-lapon csúszka: a mérőszám a Betűméret fülön, a hasábszélesség az Egyéb/haladó részben), 0052 migráció a tárolt közös alap kiegészítésével (a tárolt érték nyer, mint a 0044-nél). Méretek, nem térközök — nem a skálából jönnek (R-0 5.). Az R-1 rajz többi tokenje (`--control-min-s`, `--fs-h2`, `--dur-spin`, `--shadow-pop`…) már származtatottként megvolt.
Másik út: beégetett 300px/30px a CSS-ben — a tokenőr elbuktatná, és a rajz kifejezetten témából állíthatót kért.

## D-F27 · 2026-09-12 · a T-7 oka és a javítása: a robot a saját naplójától állt meg
Kérdés: a Gigabyte robotja (`tools/gigabyte-robot/robot.sh`) percenként fut, de 2026-09-11 21:14 óta egyszer sem rakott ki — miért? Mérve a Gigabyte-on (Vilmos felvette a Dell kulcsát): a robot naplója percenként „kihagyva — a Gigabyte másolatában elmentetlen fájlok vannak". A két „elmentetlen" fájl: a robot SAJÁT naplója (`docs/robot-naplo.jsonl`, a tárhely mappájába írja) és egy 09-11-i képernyőkép (`docs/kepek/nyitolap-….png`). A robot így a saját lábára lépett: ír a másolatba, aztán piszkosnak látja.
Döntés: a két útvonal a `.gitignore`-ba (a `git status --porcelain` az ignorált fájlt nem mutatja); a Gigabyte-on a két fájl a `_torolni/`-ba (nem törlünk), a másolat a főágra húzva, és a robot egyszer kézzel (`robot.sh --most`), utána megy magától. A kirakást a tesztre a robot végzi — ez a D-02 óta a rend; élesítés (cPanel) marad Vilmosé.
Másik út: a robot a naplót a tárhelyen kívülre írja (pl. `~/.local/state`) — tisztább, de a robot.sh változtatását igényli; ha kell, következő kör.

## D-F28 · 2026-09-12 · a tárhely tükre a Synology Drive-ban, bejövő mappával
Kérdés (Vilmos): ne küldözgessünk fájlokat — ami Claude mappájában van, jelenjen meg minden gépén.
Döntés: a Gigabyte robotja minden zöld kirakás után a tárhely munkafáját (a `.git`, `node_modules`, `vault`, `_torolni` nélkül) a `~/SynologyDrive/SaaS/tarhely/` mappába tükrözi (`tools/gigabyte-robot/tukor.sh`, rsync); a Synology Drive kiviszi Vilmos minden gépére. A tükör csak olvasni való (a következő kirakás felülírja). A másik irány: Vilmos a `SynologyDrive/SaaS/be/` mappába tesz, Claude a Gigabyte-ról olvassa és ő teszi a tárhelyre; a feldolgozottat `be/_feldolgozva/` alá teszi át. A régi kézi másolat a `SynologyDrive/SaaS`-ban a `_torolni/regi-tarhely-masolat-2026-09-12/` alá került (nem törlés); a `vault`, a `Claude outputs`, a `mentes-kod`, az `_atmenet`, a `NAS-NAPLO.md` és a zip a helyén maradt.
Másik út: Synology Drive a Dellen és a git a Drive-mappában — a git tárolója és a szinkron egymásba akadna (ütközések, sérült tároló); ezért nem.

## D-F29 · 2026-09-12 · a rendszergazda-lapok négyes váltója elmarad; a felső sáv minden belépett lapon
Kérdés: a v4 rajz (10. artboard) döntött: a Theme/Feliratok/Költség/Fiókok lapról a négy lap közti váltó (GazdaNav) elmarad, mert a Gépház ajtó egy kattintás, és két navigációs sor egymás alatt ugyanarra a célra fölösleges; a modul (hírfigyelő) fülsora viszont marad a sáv alatt, mert az a modulon belüli mozgás. A mentés-állapot a lapcím mellé kerül (Ügyfélprofil), a Theme/Feliratok saját eszközsorában marad.
Döntés: a rajz szerint. A felső sáv (FelsoSav) mostantól minden belépett lapon: Ügyfélprofil, a hírfigyelő három lapja, Theme, Feliratok, Költség, Fiókok; a régi fejlécek („vissza a fiókhoz", a lapok saját nyelvválasztója, GazdaNav) elmaradnak — a sáv viszi mindet. A `gazdanav.*` kulcsok és a `GazdaNav` komponens a `_torolni/`-ba nem kerülnek, egyszerűen nem hívja őket senki (a kód marad, a határőr nem tiltja).
Másik út: a GazdaNav megtartása a sáv alatt — a rajz kifejezetten ellene döntött.

## D-F30 · 2026-09-12 · az R-2 rajz döntései és a Design kérdéseinek válaszai
Kérdés: a Design hat kérdést tett fel (lejárat, a szerkesztő visszavonása, a szerkesztő nézete, az eltávolított tag neve, a kilépés helye, hiányzó gépezet).
Döntés: (1) a meghívó fix 7 nap, a párbeszéd kimondja előre (új kulcs, a rajz változatlan); (2) a szerkesztő bármely meghívót visszavonhat (a modul így dönt); (3) a szerkesztő nézetén Meghívás van, Szerep/Eltávolítás nincs — 8. artboard nem kell; (4) a jóváhagyó neve a fiókból jön, nem a tagságból — az eltávolított tag neve marad a jóváhagyás mellett (kódjavítás az F-3e-ben); (5) kilépés csak az R-3 Saját fiók lapon; a beváltó lapon nincs felső sáv; a `MAR_TAG` semleges. A beváltó laphoz új nyilvános végpont: `GET /api/meghivo/{jegy}` (csak név, munkatér, szerep, állapot), és a belépőlap `vissza` címe.
Másik út: a jegy-megtekintés nélkül a beváltó lap csak belépés után mutatna bármit — a rajz 07/B-je ezt kéri, ezért épül.

## D-F31 · 2026-09-13 · az R-6 rajz döntései és a Design kérdéseinek válaszai
Kérdés: a Design négy kérdést tett fel (sötét logó külön célja; hány fájl egy célon; kézikönyv vs. dokumentum az AI-ban; azonnali AI-feldolgozás).
Döntés: (1) külön `logo_sotet` cél most nincs — a rajz megoldása (a logó két háttéren, kimondva) marad; ha gyakori a gond, ötödik cél (TEENDŐ, Vilmos szava); (2) korlát nincs egy célon; a logónál egy „használatban" (`logo_fajl_id`), a referenciáknál/dokumentumoknál a feltöltő mező feltöltés után is marad; (3) az AI ma nem olvassa a fájlokat — a négy cél rendezés, a különbség az AI-ban későbbi lépés; (4) azonnali feldolgozás nincs, állapotjelző nem kell. A blokk önálló komponens (`ArculatAnyagok`), két helyen: a profil lapján saját kártyaként, az onboarding 3. lépésén az arculat-blokkban. PDF-nél oldalszám nincs (nem mérjük) — a rajz oldalszáma elmarad. A feltöltött fájl mérete 10 MB minden célra (a gépezet szerint), Eltávolítás nincs.
Másik út: külön lap az anyagoknak — a rajz és a régi feladatlap egyértelműen a blokkot kéri.

## D-F32 · 2026-09-13 · a csere megerősítője és a logó útja a tervezetbe (F-6b, a rajz mellett mérve)
Kérdés: a Kimi vázlata a csere megerősítését a fájlválasztás ELŐTT kérte (üres „új" bélyeggel), és a logót közvetlenül írta a tervezetbe; a friss logó „{v}" helyőrzővel, halványan állt. Mi a rajz szerinti viselkedés?
Döntés: a Csere a fájlválasztót nyitja, a megerősítő kártya (05/A: mostani → új, a következmény kimondva) a fájl kiválasztása UTÁN és CSAK jóváhagyott arculatnál nyílik — nem jóváhagyott tervezetnél és a kézikönyvnél nincs következmény, a fájl azonnal felmegy. A logó az `arculatModosit` állapotgépen át kerül a tervezetbe (jóváhagyott → új tervezet, verzió+1), ezért a fejlécen „N. tervezet · nincs jóváhagyva" jelvény áll, amíg a logó nem jóváhagyott tervezetben van; a korábbi példány jelvénye a rá hivatkozó jóváhagyott verzió számát írja, hivatkozás nélkül jelvény nincs. Ha nincs tervezet (allapot `nincs`/`kesobb`), a fájl felmegy, tervezet nem indul.
Másik út: a feltöltés is kérjen megerősítést jóváhagyott arculatnál — a rajz 02/B nem kér, a fejléc jelvénye mutatja a következményt.

## D-F33 · 2026-09-13 · az R-4 rajz döntései: fiók-szintű értesítések olvasott-jelöléssel, négy új esemény, a két szint külön
Kérdés: az R-4 rajz fiók-szintű értesítéslistát rajzolt olvasott/olvasatlan jelöléssel és haranggal (a kérés D-F21 szerint „ne legyen"), hat esemény-kapcsolót (ebből négy esemény ma nem íródik), és a felhő-kapcsolót „még nem működik"-nek, míg a létező AI-kapcsolót nem rajzolta. Mi épül?
Döntés: (1) a fiók-szintű értesítés MEGÉPÜL — `ertesites_fiok` (kapcsolók + „mind olvasott" vízjel) és `ertesites_olvasott` (soronként); a lista a fiók minden munkateréből, az utolsó 50 sor; a harang a sávban a `/beallitasok`-ra visz; D-F21 ezzel feloldva. (2) Négy új eseményfajta: `forras_hibas` (a forrás állapota hibásra vált), `ai_nem_valaszol` (egy futásban az AI nem válaszolt — egyszer, a futás végén, a függő találatok számával), `futas_beragadt` (a 15 perces elengedés), `belepesi_kiserletek` (a belépési korlát betelt — rendszerszintű, csak a rendszergazda látja; e-mail és cím NEM kerül a naplóba); az esemény-mag 0.2.0. (3) A kimenő horog munkatér-szintű beállítása (`/api/ertesites`) és a fiók-szintű kapcsolók (`/api/ertesites/sajat`) két külön dolog, külön maradnak; a horognak és az AI-kapcsolónak (`/api/beallitas/ai`) továbbra sincs képernyője — T-23 a következő Design-kérésbe. (4) A felhő-kapcsoló a rajz szerint kikapcsolt és jelölt („még nem működik"), a 07. artboard nem épül. (5) Alapérték: minden értesítés be; a lap útja `/beallitasok`; a Gépház-csempe elmarad (a lap mindenkié). (6) Hat új token a Theme-lapon is (D-F26 mintája); kapcsoló-komponens (`Kapcsolo`) a közösben, mert eddig nem volt.
Másik út: a rajz olvasott-jelölés nélkül, csak a munkatér naplójával — a rajz gerince az olvasatlan szám, nélküle a harang és a lista értelmetlen; a négy hiányzó eseményt kihagyni halott kapcsolót hagyott volna.

## D-F34 · 2026-09-13 · az R-3 v2 rajz döntései: a Saját fiók bejárata, a nyelv helye, a kilépés bármelyik munkatérből
Kérdés: a Design végső csomagja hozta az R-3 v2-t (Saját fiók, 6 artboard). A rajz a sáv fiók-nevéből nyílik (az eddig az ügyfélprofilra vitt), a felület nyelvét ide teszi, a MÁSIK munkatérből is kilép (a mai végpont csak az aktuálisból), és öt kérdést tett fel.
Döntés: (1) a sáv fiók-neve a `/sajat-fiok`-ra visz, ott kiemelt; telefonon a menü legalsó sora is link; az ügyfélprofil (`/fiok`) marad az Ügyfélprofil menüpont. (2) A felület nyelve átköltözik a Saját fiók lapra; az ügyfélprofil oldalsávjából a nyelvválasztó elmarad, a sávban marad a gyors váltó. (3) A `POST /api/tagok/kilep` opcionális `szervezet_id`-t kap (a fiók bármely saját munkatere), és visszaadja a következő aktuális munkatér azonosítóját: az aktuálisból kilépve a maradék első lesz az aktuális (D-F25), ha nem maradt, a lap a `/szervezet/uj`-ra visz — hatodik artboard nem kell. (4) A jelszóváltás és a kiléptetés sikere két külön mondat; a „kiléptetés minden eszközről" a mai gépezet szerint a TÖBBI eszközt lépteti ki (D-F19) — ha Vilmos mást akar, végpont- és rajzváltozás (rajtad-lista). (5) Az „Utolsó belépéseim" a belépési naplóból (30 nap, `NAPLO_MEGORZES_NAP`), a mostani belépéssel együtt; a régi „utolsó belépésem" címke elmarad, ha van lista. (6) Az e-mail zárt („még nem működik", levélküldés nincs); a fiók törlésének sora gomb és jelölés nélkül; a rendszergazdai blokk csak a rendszergazdánál; a telefon rövid mondatai külön kulcsok (0058).
Másik út: a nyelvválasztó maradjon az ügyfélprofilon is — két helyen ugyanaz a beállítás félreérthető, a rajz kimondta a költözést.

## D-F35 · 2026-09-13 · Vilmos négy döntése a befejezéshez (T-26, logo_sotet, T-24, F-7)
Kérdés: a hét kész csomag után négy nyitott tétel állt Vilmoson: a kiléptetés hatóköre, a sötét logó célja, az értesítések megőrzése, az F-7 csomagszerkezete.
Döntés (Vilmos, 2026-09-13 09:45, előre adott válaszlehetőségekből): (1) **T-26** — a „kiléptetés minden eszközről" marad a mai: a többi eszköz lép ki, ez a gép belépve marad (D-F19); a rajz és a gépezet változatlan. (2) **logo_sotet** — most nem: egy logó, két háttéren mutatva (R-6); ötödik cél csak ha az ügyfeleknél gyakori a gond. (3) **T-24** — az értesítések és az eseménynapló megőrzése **30 nap**, ugyanannyi, mint a belépési naplóé (egységes szabály): a 30 napnál régebbi eseménysorok óránként törlődnek (a soronkénti olvasott-jelölés velük), a lista addig is az utolsó 50 sort mutatja. (4) **F-7** — **pilot: egy csomag, ár nélkül**: a csomagkezelés váza épül (melyik munkatér melyik modult használhatja; ma egy csomag, „Pilot", benne a Hírfigyelő), ár és fizetés nem; az ár később egy szóval bővíthető. Az R-5 Design-kérés ebből indul, a T-23 (AI-kapcsoló és kimenő horog képernyője) ugyanabban a körben.
Másik út: 90 napos megőrzés — Vilmos a rövidebbet választotta, a belépési naplóval egységesen.

## D-F36 · 2026-09-13 · az R-5 rajz döntései (Csomag csempe, Kimenő lap, AI-kapcsoló) és a 25 eseménycím
Kérdés: az R-5 rajz hét artboardja hova és hogyan épül; a Design 6 kérdése (`kerdesek.md`); a 25 eseményfajta címe a rendszerben ékezet nélkül állt („Belepes").
Döntés: (1) a Kimenő értesítések lapja `/gephaz/kimeno`, a Gépház alatt; szerkesztőnek és nézőnek nem jár. (2) A Csomag csempe a tulajdonos rácsának első helyén, hivatkozás nélkül; az „Árazás és fizetés" sor a jelölés-nyelv harmadik alakja (soron, vezérlő nélkül). (3) Az AI-kapcsoló doboza az Adatpolitika fül jobb oszlopában a felhő-kapcsoló FÖLÖTT; a kikapcsolt állapot `--warn`; a hírfigyelő áttekintője `ai_engedelyezve` mezőt ad, a sáv abból él, hivatkozás csak tulajdonosnak. (4) A `bekotve` rendszerszintű; az „örökli" sor a közös alappal mozdul; a kimenő üzenetek naplója nem épül (T-27). (5) A 25 `esemeny.<fajta>_cim` a rajz ékezetes, tárgyilagos címeit kapja (0060 felülírja a 0048/0057 ékezet nélküli szövegét) — a „rendszeré a hiteles" szabály itt a rendszer hibáját fedte volna. (6) Asztalon a Kimenő lap minden csoportja nyitva, telefonon csak az első (a képernyő szélessége dönt).
Másik út: külön lap a Csomagnak — a pilotban nincs mit állítani, a csempe elég (a rajz döntése).

## D-F37 · 2026-09-13 · T-25: a tesztoldal hírfigyelője OpenAI API-ra áll át (a Dell Ollamája helyett)
Kérdés: a tesztoldal app-doboza nem éri el a Dell Ollamáját a Tailscale-címen (T-25), ezért a hírfigyelő értékelése a teszten „az AI nem válaszolt"-tal zárt. Vilmos döntése: „állítsuk át openai api-ra".
Döntés: új csatlakozó `openai` (`packages/ai-adapters/src/openai.ts`, Chat Completions, `OPENAI_API_KEY` + `OPENAI_MODELL`, alap `gpt-5-mini`; árlista a 2025-08-i OpenAI-árak, a Költség lap ebből számol; a havi keret — `AI_HAVI_KERET_USD`, alap 5 USD — erre is érvényes). A kulcs útja: `vault/openai-key.txt` → `kirak.sh --titkok` → a NAS `.env` `OPENAI_API_KEY` sora (a tartalom sehol nem íródik ki). A NAS `.env`-ben `HF_AI_SZOLGALTATO=openai`, app-újraindítás. Az adatpolitika lap ezt mutatja majd: „OpenAI (API) · felhőben fut · Egyesült Államok" — a 2. adatút-sor szereplője ettől fogva az OpenAI. A Dell Ollamája marad a Dellen (az ágensek Qwenje), a teszt hírfigyelője nem használja.
Másik út: a NAS Tailscale-útvonalának javítása a dobozból — üzemeltetési munka, a Dell rendelkezésre állásától függ; Vilmos a felhős utat választotta.

## D-F38 · 2026-09-13 · a Synology Drive kliens a Gigabyte-on felhasználói szolgáltatás (fejetlen, Xvfb alatt)
Kérdés: az OpenAI-kulcs nem ért a Gigabyte-ra a vaultba; kiderült, hogy a Gigabyte 09-12 18:20-as újraindítása óta a Synology Drive kliens nem futott — az asztali autostart (`~/.config/autostart`) csak grafikus bejelentkezéssel indul, a gépen pedig nincs ilyen. 18 órán át semmi nem szinkronizált: a tükör (`tarhely/`) sem ment ki Vilmoshoz, a vault sem jött be.
Döntés: két felhasználói systemd-egység a Gigabyte-on (`tools/gigabyte-robot/systemd/xvfb.service`, `synology-drive.service`; a felhasználó `Linger=yes`, tehát bekapcsoláskor indulnak): egy virtuális kijelző (`Xvfb :99`) és a Drive launcher (`Type=forking`, a hivatalos `synology-drive stop` állítja le). A launcher indítja a daemon-t, az ui-t és a connect-et; a daemon nem függ a kijelzőtől. Ellenőrizve: a szinkron 12:20-kor újraindult, a vaultban 12:04-es kulcs megjött, a tükör kimegy. A kirakás (`tukor.sh`) ezután is a Drive mappájába ír — az egység nélkül a tükör csak helyben frissülne.
Másik út: a szinkront a NAS oldaláról (rsync a Drive tárolójába) — a Drive saját verziózását és a Windows-klienst kerülné meg; a kliens tartós indítása egyszerűbb és a meglévő úton marad.

## D-F39 · 2026-09-13 · a Dell (T2) a SaaS mappát hálózati meghajtóként látja (S:), nem külön szinkronklienssel
Kérdés: Vilmos kérte, hogy a Dell is lássa a SynologyDrive/SaaS mappát (vault, be/, tarhely/). Szinkronkliens (harmadik példány) vagy közvetlen elérés?
Döntés: **közvetlen SMB-elérés**: a mappa a NAS-on Vilmos home-jában van (`homes/<user>/Katinka/SaaS`, ezt tükrözi a gépe és a Gigabyte), a Dellen `S:` = `\nas-saas\home\Katinka\SaaS`, tartós leképezés, a belépő a Windows hitelesítő-tárolójában. Így nincs harmadik szinkron, nincs ütközés, a Dell azonnal ugyanazt látja. Két buktató, ami egy órát vitt: (1) a Dellen már élt egy SMB-ülés a NAS-hoz a másik projekt robotfiókjával (`dellbot`), és a Windows egy kiszolgálónévhez egy belépőt enged — ezért a NAS LAN-címe külön néven (`nas-saas`) került a hosts fájlba; (2) a `vault/nas-belepes.txt` jelszava **vezető szóközzel** áll a fájlban (`jelszo: …`), amit az SSH-út és az smbclient levág, a PowerShell-es beolvasás nem — ezért „rossz jelszó". A NAS naplója mutatta meg, hogy a Dell próbái el sem jutottak hitelesítésig. A `dellbot` ülését nem érintettük.
Másik út: Synology Drive kliens a Dellre Vilmos fiókjával — csak kézi, grafikus belépéssel telepíthető, és harmadik szinkronpéldány lenne.

## D-F40 · 2026-09-13 · a külső audit státusza és a feldolgozás módja (F-8)
Kérdés: Vilmos egy ChatGPT-készítette használhatósági auditot adott (`docs/AUDIT-2026-09-13.md`, 23 lap, 3 P0), azzal, hogy vegyük át, amit mond, és készüljön javítási terv a flottával. Az audit dokumentum — a szabály szerint nem tény, amíg nincs mérve; és a képernyő-szerkezet változása rajz nélkül tilos.
Döntés: (1) az audit **megvalósítási javaslat** státuszú; a kódon mérhető állításait előbb megmértük (15-ből 13 igaz, 2 részben, 0 téves — `docs/AUDIT-2026-09-13-TERV.md` 1. tábla), a teszten mérhetőket az F-8.1 első lépése méri képpel. (2) A munka két úton megy: **szöveg és mért hiba rajz nélkül, azonnal** (F-8.1, F-8.2, F-8.3 — a felhasználónak szóló szöveg nem kér előzetes jóváhagyást); **képernyő-szerkezet csak az R-7 rajzkör után** (F-8.4, öt lap). (3) Ami korábbi döntéssel ütközik (D-F33 jelölés-nyelv, a v6 „Mentés és kilépés", a rendszergazdai jelszó-jegy, a menünevek) vagy Vilmos adatát kéri (nyitólap), az a rajtad-listára került, nem épül szó nélkül. (4) Az audit „Posztvázlat" ötlete nem épül: a termék ígéretének bővítése (3.2/5.). (5) Új szakasz az állapotlapon: **F-8 Használhatósági audit javítása**, lépései F-8.0…F-8.5.
Másik út: az audit minden pontját egyben, rajz nélkül megépíteni — gyorsabb lenne, de a „semmi nincs a képernyőn, ami nincs a rajzon" szabályt sértené, és a v6/R-1…R-6 rajzokkal ütköző képernyőket adna; vagy mindent rajzra várni — akkor a három P0 hetekig kint maradna.

## D-F41 · 2026-09-13 · az F-8.1 három kis döntése: a mintakártya szövege, a nyelvcímke, a mag 0.3.0
Kérdés: (1) a 3. lépés mintakártyájának szövege beégetett volt („Kézzel készült, tartós darabok" — idegen iparág, audit 8.); feliratkulcs legyen? (2) a részletpanel „összefoglaló: román" címkéje a FORRÁS nyelvét írta; mit írjon helyette? (3) a forrássor „Cím módosítása" és „Eltávolítás" gombjához a mag tár-portja bővül — melyik verzió?
Döntés: (1) a mintakártya szövege **nem feliratkulcs**: az ügyfél arculati tervezetének NYELVÉN (hu · ro · en · ar — az arab a jobbról balra írás próbája) kell megjelennie, nem a felület nyelvén, ezért marad a kis szótár a `ArculatBlokk.tsx`-ben, de **semleges** mondattal („Így néz ki egy rövid szöveg a saját színeiddel és betűiddel." · „Tovább") — az angol változat pótolva. (2) a hamis címke **elmarad**; helyes érték nem adható, mert az összefoglaló nyelve (a futás nyelve) nincs a kártyán tárolva — a forrás nyelve a forrássorokon marad; a tárolás a mag következő kiadásának kérdése (T-38), az R-7b rajz „forrás: román · összefoglaló: magyar" sora addig nem építhető. (3) `@km/news-monitor-core` **0.3.0**: a `HirfigyeloTar` új portja (`forrasTorol`) töréses (MODULSZABÁLY 8.); mindkét befogadó illesztője frissült, a mag próbái (188) és a referencia-host próbái (40) zöldek; a két új művelet külön fájlban (`forras-muvelet.ts`), mert a `folyamat.ts` 782 sor.
Másik út: (1) t()-kulcs a felület nyelvén — az arab próba elveszne; (2) a felület nyelvét írni — akkor igaz lenne a mai futásokra, de nem a más nyelven indított futásokra; (3) 0.2.1 — a port bővítése a második befogadót eltörné frissítés nélkül, ezért nem „javítás".

## D-F42 · 2026-09-13 · az R-7 csomag ellenőrzése: mi nem épül, az F-8.2 beolvad, a sorrend
Kérdés: a Design R-7 csomagja (öt lap, 334 kulcs) megjött; mi építhető a mai gépezettel, és hogy viszonyul a terv F-8.2 szövegtisztításához?
Döntés: (1) **nem épül**: a Megjelenés egyszerű nézetének logója (R-13: a brand nem a téma) és világos/sötét váltója (nincs világos paletta), az „összefoglaló: {nyelv}" címke (T-38) és a fordított cím (3.5, mag 0.4) — a rajzon maradnak, a képernyőn nincsenek, a Design két kérdést kap. (2) **kis gépezet épül a rajzhoz**: a kezdőlap Hírek csempéje 3 címet ad (`elso_cimek`); a `--primary-2` származtatottá válik; két új alaptoken (`--urlap-max`, `--lista-max`); a betűskála arányos. (3) **az F-8.2 beolvad az R-7 beépítésébe** — a rajz kulcsai a szövegek; külön lektor csak a rajzon nem szereplő szövegekre, a végén. (4) sorrend: R-7e → R-7b → R-7a → R-7c → R-7d, laponként kirakva. (5) a hat döntéshez kötött elem Vilmos szava nélkül nem épül; a szerkezet igen (a menünevek feliratkulcsok, a mai értékkel). Részletek: `design/r7-audit-javitas/ELLENORZES.md`.
Másik út: az F-8.2-t külön futtatni a rajz előtt — ugyanazokat a kulcsokat kétszer írnánk át; vagy a rajzot egyben, döntések nélkül építeni — a „hallgatás nem engedély" szabályt sértené.

## D-F43 · 2026-09-13 · Vilmos hét döntése az R-7-re (előre adott válaszlehetőségekből, 18:35)
Kérdés: mehet-e az R-7 beépítése, és a terv 3.1–3.6 hat kérdése.
Döntés: **mehet mind az öt lap** a sorrendben (R-7e → R-7b → R-7a → R-7c → R-7d). **3.1 A** — az audit nevei (Kezdőlap · Hírek · Szervezet adatai · Beállítások · Megjelenés · Felület szövegei · Adatkezelés · Találatok pontosítása). **3.2 A** — „Mentés és vissza": ment és a kezdőlapra visz, belépve marad. **3.3 B** — a „még nem működik" dobozok MARADNAK az R-4 jelölés-nyelvével a tulajdonosnál is (a rajz A-ját itt nem építjük: az R-7c 03/04/08 tulajdonosi nézetén a dobozok az R-4 szerint állnak, emberibb mondattal). **3.4 A** — „Elfelejtetted a jelszavad?" hivatkozás a rendszergazdához irányító lapra; a kapcsolat-cím nélkül a hivatkozás rejtve. **3.5 A** — magyar (fordított) cím a román hírek kártyáján: a mag 0.4 (`Talalat.cim_forditott`, `nyelv`) + a prompt mezője (T-38-cal együtt). **3.6** — Vilmos megadja az adatokat (kapcsolat, árazás mondata, tájékoztató) — a szövege még nem érkezett meg; amíg nincs, a sorok elmaradnak (a rajz szerint).
Másik út: — (a döntések az övéi).

## D-F44 · 2026-09-13 · az R-7b 08 rajz és a beállítás-mag: célok, szabad szöveg, „Mikor?" — mi lesz velük
Kérdés: a Design R-7b 08. artboardja („Hírfigyelés beállítása") a mai lap három elemét nem rajzolta: a figyelési célok chipjeit (`celok`, a magban KÖTELEZŐ, min 1), a szabad szövegmezőt („saját szavakkal" + „Beállítás frissítése ebből") és a „Mikor?" kézi/napi rádiót. A „semmi nincs a képernyőn, ami nincs a rajzon" szabály és a mag ütközik.
Döntés: (1) a `celok` nem látszik; a tervezet értéke megmarad, üresnél mentéskor az alap (`sajat_marka`) áll be — a mag szabálya teljesül, a felhasználót nem kérdezzük; (2) a szabad szöveg nem látszik, az értéke megmarad; az AI-javaslat a profilból készül (a végpont szöveg nélkül is dolgozik), a rajz javaslat-sávja ezt mutatja; (3) a „Mikor?" rádiót a rajz „Napi figyelés bekapcsolása" gombja váltja: sikeres próba után a tervezet `idozites.mod` napira áll és ment — új gépezet nincs. A saját név nem a szabad szöveghez fűződik, hanem külön téma lesz (`temak[]`), így a rádió állása visszaolvasható. A hármat a Designnak jelzem (K-R7b-6): ha később kell a célok választója, a Pontosítás szakaszba fér.
Másik út: a célok chipjeit a rajz ellenére kint hagyni — a szabály sérülne; vagy a rajzot visszaküldeni — egy nap csúszás egy nem látott mezőért.
