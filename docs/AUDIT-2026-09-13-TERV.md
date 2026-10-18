# Az audit javítási terve — F-8 szakasz

Kommunikációs munkatér · Aitmetica SRL · 2026-09-13 · írta: az orchestrator (Claude)
Forrás: `docs/AUDIT-2026-09-13.md` (külső audit, ChatGPT). Állapotlap: https://saas.mediapartizan.ro/allapot/ — F-8 szakasz.

**Státusz-jelölés ebben a lapban** (EGYUTTMUKODES 21.): `MÉRT` = a kódon vagy a teszten megmértük, igaz ·
`NEM MÉRT` = csak a teszten mérhető, még nem néztük · `JAVASLAT` = az audit ötlete, még nem követelmény ·
`DÖNTÉS` = Vilmos szava kell hozzá · `RAJZ` = képernyőt változtat, csak Claude Design rajza után épülhet.

---

## 0. A lényeg egy oldalon

1. **Az audit jó.** A 15 kódon mérhető állításból 13 igaz, 2 részben igaz, 0 téves. A három P0 mind valódi hiba (2. pont).
2. **Kétféle munka van benne, és a kettő nem ugyanaz az út.**
   - **Szöveg és hiba** — rajz nélkül mehet, azonnal: a felhasználónak szóló szövegeket megírjuk, Vilmos utólag javít (EGYUTTMUKODES 3.); a mért hibákat javítjuk.
   - **Képernyő-szerkezet** — csak rajzzal (EGYUTTMUKODES 8.: „Minden képernyőmunka rajzzal kezdődik. Kivétel nincs."). Ez az **R-7 rajzkör**, öt lapon.
3. **Néhány audit-javaslat ütközik korábbi döntéssel vagy Vilmos adatát kéri** — ezek a 3. pontban, egyesével, a rajtad-listán. **Nem építjük meg, amíg nem szól.**
4. **Sorrend** (az audité, egy módosítással): hibák → szöveg → rajz (első használat, hírek, beállítások) → AI-szöveg → újrateszt valódi kezdővel. A szöveg előrébb jött, mert rajz nélkül megy, és a rajzkör közben fut.
5. **A flotta**: Claude (mérés, felbontás, átvétel, döntés), DeepSeek (kód, prompt), Kimi (sokfájlos szöveg, lektor, fordított ellenőrzés), Qwen (próbák, előszűrés, tömeges kulcs-munka — ingyen), Claude Design (rajz). Összes ágens-idő ~30–40 óra; ágens-költség becsülve **≈ 1,5 USD** (az eddigi 0,98 USD/8 csomag arányából). Részletek a 6. pontban.

---

## 1. Mit mértünk — az audit állításai a kódon

Mérve 2026-09-13 15:10–16:30 a Dellen, a főág mai állapotán (a7a385f). Ahol `file:sor` áll, az a bizonyíték.

| # | Az audit állítása | Eredmény | Bizonyíték |
|---|---|---|---|
| 1 | P0 · értesítés megnyitása `https://0.0.0.0:3000/…`-ra visz | **MÉRT** | `apps/web/app/beallitasok/nyit/[id]/route.ts:15-25` — öt `NextResponse.redirect(new URL(cél, _keres.url))`; a `_keres.url` a doboz belső címe (0.0.0.0:3000), nem a nyilvános. Az nginx a `Host`-ot továbbadja (`nas/nginx.conf:48`), de a Next a kötési címből építi az URL-t |
| 2 | P0 · a fejléc eltakarja a részletpanel tetejét | **MÉRT** | panel `position: fixed; top: 0; z-index: 40` (`hirfigyelo/attekintes.css:381-395`), a felső sáv `sticky; z-index: 50` (`_kozos/felsosav.css:5-11`). A Bezárás gomb megvan (`Attekintes.tsx:597`), Escape is zár — csak takarásban van |
| 3 | P0 · nyitólap helyőrzői (árazás, kapcsolat, adatkezelés) | **MÉRT** | `0038_nyitolap.sql:132,144,150` — `[ÁRAZÁS…]`, `[KAPCSOLAT…]`, `[ADATKEZELÉSI TÁJÉKOZTATÓ…]`; az adatkezelés lap: `nyitolap.keszul_cim` „még készül" (`:156`). **Vilmos adata**, a rajtad-listán 09-12 óta |
| 4 | „Összefoglaló: román" mellett magyar szöveg | **MÉRT** | `Attekintes.tsx:584-610` — a `hf.sumLangTag` az ELSŐ FORRÁS nyelvét írja, nem az összefoglalóét (az a futás nyelve) |
| 5 | az „N új" nem frissül jelölés után | **MÉRT** | `Attekintes.tsx:53,208,275` — `ujDbHelyi` sosem kap számot, a csökkentés soha nem fut; a mentés/elrejtés nem tölt újra |
| 6 | „AI-kiesés" az egész lista fölött, bár a legtöbb kész | **MÉRT** | `Attekintes.tsx:280` — bármely egy függő tétel elég, darabszám nincs; igaz esetben az Összkép is eltűnik (`:294`) |
| 7 | Finomhangolás: nincs újrapróbálás; a negatív ok kötelező | **MÉRT** | `Finomhangolas.tsx:63` a hibaállapotot kizárja az automatikus újrakérésből, gomb nincs (`:313`); ok nélkül nem rögzíthető (`:98-113`), „mégsem" nincs |
| 8 | forrássoron nincs újrapróbálás/módosítás/eltávolítás | **MÉRT** | `beallitas/Forrasok.tsx:158-179` — gomb csak `ellenorzes_alatt` állapotnál; **gépezet sincs**: az API-ban GET/POST lista + `POST forrasok/[id]/ellenoriz`, törlés és módosítás végpont **nincs** |
| 9 | „Új téma" csak Enterrel | **MÉRT** | `Beallitas.tsx:352-362` — a forrásnál van gomb, a témánál nincs |
| 10 | próba csak mentés után | **MÉRT** | `Beallitas.tsx:198,483` — `vanAktiv` csak mentett aktív verziótól igaz; a magyarázat csak alul (`hf.trialNote`) |
| 11 | 2. lépés: nincs „készül" állapot; késői válasz felülír-e | **MÉRT / részben** | töltésjelző nincs (`Lepes2.tsx:25,47-49,123`); a felülírást a mag kizárja (`onboarding-core/src/index.ts:22-27` — csak üres mezőt tölt) — az audit gyanúja itt **nem igaz**, a várakozási állapot hiánya igaz |
| 12 | mintakártya idegen iparági szöveg | **MÉRT** | `_kozos/ArculatBlokk.tsx:12-16` — **beégetett** szöveg (hu/ro/ar, angol nincs), nem feliratkulcs, nem a profilból |
| 13 | „Mentés és kilépés" kijelentkeztet | **MÉRT** | `onboarding/_kozos/keret.tsx:66-71` — ment, majd `/api/fiok/kilepes`, `/belepes`; mindhárom lépésen, megerősítés nélkül. **Szándékos volt** (v6 prototípus) — hogy maradjon-e, DÖNTÉS |
| 14 | regisztráció/belépés: egy globális hiba, mezőnkénti nincs; jelszó-visszaállítás link nincs | **MÉRT** | `BelepesUrlap.tsx:40`, `RegisztracioUrlap.tsx:44` egy `Hibadoboz`; a mező csak `aria-invalid`-ot kap (`Keretek.tsx:56-66`). A `/jelszo-visszaallitas` lapra **egyetlen hivatkozás sincs** — a jegyet a rendszergazda adja (E-34), ez a mai rend |
| 15 | e-mail/telefon csatorna „még nem működik" kapcsolóval | **MÉRT** | `Beallitasok.tsx:322-366` — az R-4 rajz **jelölés-nyelve** (D-F33), szándékos. Hogy maradjon-e, DÖNTÉS |
| 16 | pénznem: kezdőlap EUR, költség lap USD; „szerkesztő" jelvény | **MÉRT** | `koltseg/KoltsegSajat.tsx:15-17` fix `$`; a kezdőlap a munkatér pénznemében (`Kezdolap.tsx:17`); a jelvény statikus felirat, nem a szerep (`KoltsegSajat.tsx:102`) |
| 17 | Feliratok lap: nyers csoportnevek („hf", „ai_kapcsolo") | **MÉRT** | `Feliratok.tsx:93-97` — 19 csoportnak van neve (`hu.json:446-464`), a migrációkból jött előtagoknak (hf, ai_kapcsolo, koltseg, jelzes, ertesites, kimeno, csomag…) nincs → nyersen látszik. A gomb a TÉMA kulcsát használja (`tema.apply`) |
| 18 | 13 px-es szövegek, 25–33 px-es mezők | **MÉRT / részben** | `--fs-base` 15px, `--fs-sm` = base−2 = **13px**, `--fs-xs` = **12px** (`design-system/src/index.ts:56`, `tema-alap.json:35`); 486 `--fs-sm/xs` használat az alkalmazásban. `--control-min` **44px** (`tema-alap.json:58`), de csak 52 helyen hivatkozott — a 25 px-es „Új téma" mező nem ebből él. A pontos mezőlista mérés (F-8.1) |
| 19 | „0 forrás elakadt" vs. „1 hibás forrás" | **MÉRT** | két időablak: a legutóbbi futás hibás forrásai (`kezdolap/index.ts:102-119`) vs. a források mai állapota (`:126-139`) |
| 20 | kezdőlap: profil, arculat, források, AI-keret külön kártya | **MÉRT** | 6 csempe (`Kezdolap.tsx:126,195,238,254,285,328`) — az R-1 v4 rajz szerint. Változtatása RAJZ |

**Ami csak a teszten mérhető** (`NEM MÉRT`, az F-8.1 első lépése méri, képpel): a 2. lépés üres mezői (11.), a beállítás-lap forrás „nem válaszol" állapota a saját weboldalra, a mobil fülsor kilógása 390 px-en, a mobilmenü üres sávjai, a tartalomötlet hossza, az összefoglalók nyelvi minősége (12 cikk).

**Amit az audit maga sem állít tényként**: rangsorolás pontossága (egy próbaminta), akadálymentesség, kontraszt. Ezeket nem kezeljük mért hibaként.

---

## 2. A három P0 — mi a javítás

| P0 | Javítás | Fajta | Ki | Óra |
|---|---|---|---|---|
| értesítés-átirányítás | a cél **relatív** út legyen, vagy a nyilvános cím a `Host`/`X-Forwarded-Host` fejlécből (van már `keresCime()` a `hitelesites/korlat.ts`-ben — hasonló segéd a címre); egy fájl, öt sor; próba: a válasz `Location` fejléce nem tartalmaz `0.0.0.0`-t. **Utána élő mérés a teszten** egy valódi értesítéssel | kód, rajz nem változik | DeepSeek építő · Qwen próba · Claude mér | 1 |
| részletpanel a sáv alatt | a panel a sáv **fölé** (z-index a sáv fölött) saját, mindig látható fejléccel — a rajz (E-24 prototípus) panelt mutat, a takarás hiba, nem terv; próba: képernyőkép 1440-en és 390-en, a Bezárás látszik | kód (CSS 2 sor) | Claude | 0,5 |
| nyitólap helyőrzői | **Vilmos adata**: kapcsolat (e-mail, székhely), árazás mondata (a pilotra: „ár és fizetés nélkül" — D-F35 szerint ez leírható), adatkezelési tájékoztató szövege. Amíg nincs: a szögletes zárójeles szerkesztői szöveg helyett **semleges mondat** („Az árazás a próbaidőszak után dől el." / „Kapcsolat: hamarosan." nem jó — az is ígéret). Javaslat: a lábléc kapcsolat-sora és az árazás-sor **elmarad**, amíg nincs adat (nincs halott elem); az adatkezelés lap marad „készül", de dátummal és a kapcsolat nélkül nem javul → **DÖNTÉS** | szöveg + Vilmos | Claude + Vilmos | 0,5 + Vilmos |

---

## 3. Amin Vilmos dönt — egyesével, következménnyel

Ezek a rajtad-listára kerültek. **Nem építjük meg egyiket sem, amíg nem szól** (a hallgatás nem engedély). A többi munka ettől függetlenül megy.

**3.1 Szótár — a menük és lapok neve** (az audit „Egységes magyar szótár" táblája)
- *Most:* Kezdőképernyő · Modulok → Hírfigyelő · Ügyfélprofil · Gépház · Theme-beállítások · Feliratok · Adatpolitika · Finomhangolás.
- *Az audit javaslata:* Kezdőlap · Hírek · Szervezet adatai · Beállítások · Megjelenés · Felület szövegei · Adatkezelés · Találatok pontosítása.
- *Következmény:* csak feliratkulcsok (egy migráció, három nyelven), a rajzok szövege változik, szerkezete nem. Ha igen: az F-8.2-ben megy, rajz nélkül. Ha nem: a többi szövegtisztítás akkor is megy. Soronként is mondhatsz igent vagy nemet.

**3.2 „Mentés és kilépés" az első beállításban** (1. tábla 13.)
- *Most:* ment, és **kijelentkeztet** — a v6 prototípus így rajzolta.
- *Lehetőség A:* ment és a **kezdőlapra** visz, belépve marad (az audit javaslata; a gomb neve „Mentés és vissza"). *B:* marad a kijelentkeztetés, de a gomb kimondja („Mentés és kijelentkezés").
- *Következmény:* A = a keret egy sora + felirat, rajz-jegyzet az R-7a-ban; B = csak felirat.

**3.3 A „még nem működik" jelölés sorsa** (1. tábla 15.; audit 18., 19., 20.)
- *Most:* az R-4 rajz nyelve (D-F33): ami készül, szaggatott kerettel, letiltott kapcsolóval és egy mondattal látszik (e-mail, telefon, felhő-kapcsoló, e-mail-cím módosítása, árazás).
- *Az audit:* ezek zavarnak, tűnjenek el az alapnézetből; elég egy mondat („Az értesítéseket itt, az alkalmazásban látod.").
- *Következmény:* ha az audit szerint: az R-7c rajzban ezek a dobozok elmaradnak (a rendszergazda-nézeten maradhatnak). Ha marad: csak a mondatok lesznek emberibbek (F-8.2). Ez a termék bemutatkozásának kérdése, ezért a tiéd.

**3.4 Jelszó-visszaállítás a belépő lapról** (1. tábla 14.)
- *Most:* a jegyet a **rendszergazda** adja ki (E-34), a lapra nincs hivatkozás; e-mail-küldés a rendszerben nincs.
- *Lehetőség A:* „Elfelejtetted a jelszavad?" hivatkozás egy lapra, ami kimondja: „Írj a rendszergazdának: <cím>" (kell a kapcsolat-adat, 2. pont). *B:* valódi e-mailes visszaállítás — e-mail-küldő kell (új gépezet, szolgáltató, költség, adatút-sor az Adatpolitikán).
- *Következmény:* A = egy hivatkozás + egy lap, az R-7a rajzban; B = külön csomag, a pilot után.

**3.5 Magyar cím a román hírekhez** (audit 11., 13.)
- *Most:* a cím a forrás nyelvén marad; az összefoglaló és az indoklás a fiók nyelvén készül (D-11, MERES 14.).
- *Lehetőség:* az értékelő prompt adjon egy fordított címet is (`cim_forditott` mező a magban → a mag 0.3 kiadása, a kártya mutatja, az eredeti alatta). Költség: ugyanabban a hívásban, ~+30 token/cikk, mérhető.
- *Következmény:* ha igen: F-8.3-ban a prompt + mag + kártya (RAJZ: a kártyán új sor — az R-7b-ben megrajzolva). Ha nem: a kártya a forrás nyelvét jelöli, magyar cím nincs.

**3.6 A nyitólap három adata** (2. pont) — már fent van a rajtad-listán 09-12 óta: kapcsolat, árazás mondata, adatkezelési tájékoztató.

---

## 4. Ami ütközik a mai szabályokkal — és a feloldás

| Az audit kéri | A szabály / döntés | Feloldás |
|---|---|---|
| sok képernyő-átrendezés (kezdőlap csempék, onboarding lépések, Gépház csoportok, Theme egyszerű nézet…) | „Semmi nem kerülhet a képernyőre, ami nincs a rajzon" | **R-7 rajzkör** (5. pont) — Claude Design, artboardról artboardra, a mai gépezet felsorolásával; kód csak a rajz ellenőrzése után |
| a nem működő funkciók eltüntetése | R-4 jelölés-nyelv (D-F33): ami készül, jelölve látszik | **DÖNTÉS** (3.3) |
| „Gépház" → „Beállítások" és a többi név | a rajzokon a mai nevek állnak | szöveg-kérdés, **DÖNTÉS** (3.1); a rajz szerkezete nem változik |
| forrássoron Újrapróbálás / Cím módosítása / Eltávolítás | „Halott vezérlő tilos" — módosító és törlő végpont **nincs** | a gépezet épül **előbb** (DeepSeek: a mag tár-portja + 2 végpont + próbák), a gomb csak az R-7b rajz után |
| Finomhangolás: Újrapróbálás gomb | új vezérlő → rajz | az R-7b listáján; a meglévő minta (onboarding 2. lépés `Lepes2.tsx:127`) az alap |
| mezőnkénti hibaüzenet a regisztrációnál/belépésnél | új elem → rajz | R-7a; a **globális** hibaszöveg viszont most javul (F-8.2): „Add meg az e-mail-címed." stb. |
| betűméret 16 px, mezők 44–48 px | tokenből minden (R-11); a `--fs-sm` ma base−2 | az R-7e rajz mondja ki a skálát; a beépítés token-alapérték + migráció (mint a 0044/0052). A `--fs-sm/xs` **kivonásos** származtatása (12–13 px) helyett **arányos** — ez a design-system változása, D-jegyzettel |
| a tartalomötlet legyen rövid, külön „Posztvázlat" | „a közvetlen szövegírás új funkció" — az audit maga is így mondja | a rövidítés prompt-kérdés (F-8.3); a posztvázlat **nem épül** — a termék ígéretének bővítése, Vilmos dolga (3.2/5. megállási ok) |

---

## 5. A munka csomagjai — sorrendben

Minden csomag az állapotlap egy lépése (F-8.x). A KÉSZ mindenhol a hármas feltétel: kint a teszten · élő képernyőn ellenőrizve · képernyőkép Vilmosnál.

### F-8.1 · Mért hibák javítása — rajz nélkül (P0 + kód-hibák) · ~6 óra · azonnal indul

| # | Mi | Bizonyíték | Ki |
|---|---|---|---|
| a | értesítés-átirányítás relatív úton / nyilvános címmel; próba a `Location`-re | 1. tábla 1. | DeepSeek · Qwen próba |
| b | a részletpanel a sáv fölé, fejléce mindig látszik; kép 1440 + 390 | 1. tábla 2. | Claude |
| c | „összefoglaló: {nyelv}" → a futás nyelve; a forrás nyelve külön marad | 1. tábla 4. | DeepSeek |
| d | az „N új" számláló a kliens állapotából frissül mentés/elrejtés után; a felső sáv jelvénye is | 1. tábla 5. | DeepSeek |
| e | az „AI-kiesés" sáv **számmal**: „{n} hír értékelése még készül — a többit olvashatod"; az Összkép nem tűnik el | 1. tábla 6. | DeepSeek (kód) · Claude (szöveg) |
| f | Költség lap a munkatér pénznemében (a kezdőlap mintája); a statikus „szerkesztő" jelvény **elmarad** | 1. tábla 16. | DeepSeek |
| g | kezdőlap: „{n} forrás elakadt" és a Források csempe **egy** időablakból | 1. tábla 19. | DeepSeek |
| h | Feliratok lap: `feliratok.csoport_*` a hiányzó előtagokra (hf, ai_kapcsolo, koltseg, jelzes, ertesites, kimeno, csomag, esemeny, arculat_fajl, gazdanav…) — mérés a DB kulcslistájából; a gomb saját kulcsot kap („Szövegek mentése a szervezetnél") | 1. tábla 17. | Qwen (kulcslista, három nyelv) · Claude átvétel |
| i | mintakártya: beégetett szöveg → feliratkulcs (`arculat.minta_szoveg`, `_gomb`), **semleges** szöveg, angolul is | 1. tábla 12. | Qwen |
| j | mérés a teszten: a NEM MÉRT lista (1. pont vége) képekkel, `tools/kepernyokep/kep.mjs` 1440 + 390; a 25–33 px-es mezők **listája** (melyik nem `--control-min`-ből él) | — | Claude |
| k | forrás módosítása és eltávolítása: **gépezet** (a mag tár-portja, `PUT/DELETE /api/hirfigyelo/forrasok/[id]`, próbák, a referencia-hostban is) — a gomb az R-7b után | 1. tábla 8. | DeepSeek mag + web · Qwen próba |

Fájlhatárok: a) `beallitasok/nyit/`; c–e) `hirfigyelo/Attekintes.tsx` + css (**egy** ágens, egy menet); f) `koltseg/`; g) `kezdolap/index.ts`; h–i) migráció 0061 + `ArculatBlokk.tsx`; k) `packages/news-monitor-core` + `api/hirfigyelo/forrasok` + `apps/referencia-host`. Párhuzamosan: a · c–e · f · g · k (öt sáv), h–i utána (egy migráció).

### F-8.2 · Szövegtisztítás — rajz nélkül · ~5 óra · az F-8.1-gyel párhuzamosan

A felhasználónak szóló szövegek nem kérnek előzetes jóváhagyást (EGYUTTMUKODES 3.) — megírjuk, Vilmos utólag javít. **Nem** tartozik ide, ami a 3.1 döntésre vár (menünevek) és ami szerkezet.

| # | Mi | Honnan |
|---|---|---|
| a | fejlesztői nyelv ki: „0 tokent írsz felül", „67 a közös alapból", „webes horog", „örökli", „2. sor adata", „A látogató címe odalátszik", „hívás", „AI-gépidő", „Beragadt egy futás" → az audit javaslatai (18., 19., 22. pont, szótár alsó fele) | Gépház, Kimenő, Adatpolitika, Értesítések, Költség |
| b | belső állapot-magyarázatok ki: „Azóta nincs piszkozat — a hiteles profil ez az egy", „Az onboardingból átvéve, itt nem kérdezzük újra", „A sáv lenyílója ilyenkor is nyílik", „Ami itt nincs" blokk szövege (a blokk maga a rajzon van — a **szövege** rövidül, a doboz sorsa R-7c) | Ügyfélprofil, Hírfigyelő, Saját fiók, Gépház |
| c | hibaüzenetek emberi nyelven: „Valamelyik mező nem jó" → „Add meg az e-mail-címed." / „Add meg a jelszavad." / „Az e-mail-cím vagy a jelszó nem megfelelő."; regisztráció: „Add meg a neved." stb. (a globális dobozban — mezőnkénti az R-7a után) | `hiba.*` kulcsok |
| d | egységes tegezés; „Pilot" → „Próbaidőszak"; „Meghívó kiadása" → „Meghívólink létrehozása"; „Nem releváns" → „Nem érdekel"; „Próbafuttatás" → „Próba indítása"; szerepleírások az audit 21. szerint; „Kinek szól?" → „Név vagy megjegyzés — nem kötelező" | Tagok, Hírfigyelő, Gépház |
| e | Theme-lap magyar–angol keveredése: „Desktop" → „Számítógép", „Hover" → „Egérrel fölé mutatva", a csoportcímek; **a token-nevek és számok maradnak** (a lap a rendszergazdáé — a laikus nézet R-7c) | Theme |
| f | az „első beállítás" mondatai: „Összefoglaló készítése" → „Javaslat készítése"; „Mivel foglalkozol, kiknek…" → „Mivel foglalkoztok?" + súgó-példa; a 2. lépés címkéi („Kiknek szólnak a tartalmaid?", „Mit szeretnél elérni?", „Milyen nyelven írjunk?", „Milyen stílusban írjunk?"); „Előkészítettünk néhány javaslatot" csak **kész** javaslatnál | onboarding |
| g | a hírfigyelő üres állapota: „Az AI … előkészített egy figyelési javaslatot" csak akkor, ha **valóban** elkészült; különben „Még nem gyűjtünk híreket. Add meg az első hírportált…" | Hírfigyelő |
| h | román és angol a magyarral együtt (Kimi), utána Qwen **ellenőrzi** a három nyelv egyezését kulcsonként (ingyen, tömeges) | mind |

Ki: **Kimi** (egészben látja a ~1500 kulcsot — a következetesség az ő feladata; három nyelv) · **Qwen** (kulcs-egyezés ellenőrzése, szótár-alkalmazás ellenőrzése) · Claude (átvétel: a „minden szöveg kulcsból" mérése a lektor után). Egy migráció (0061 vagy 0062). Nem nyúl komponenshez — csak ahol a szöveg **feltétele** változik (f, g: egy-egy `if`).

### F-8.3 · AI-szövegminőség — promptok és mérés · ~6 óra · az F-8.1 után indul

| # | Mi | Mérés |
|---|---|---|
| a | értékelő prompt v3: **legfeljebb 2–3 rövid mondat**, rövidítés csak feloldva, **magyar helynevek** (Marosvásárhely, nem Târgu Mureș-i), nincs szakzsargon; a **részletes összefoglaló a cikk tartalma**, az indoklás külön, egy mondat — a mező-szétválasztás megvan (`osszefoglalo` / `indoklas`), a prompt keveri | `tools/agens/hf-prompt-proba.py` a 12 cikkes készleten, Qwen előszűrő: szó-lista (tiltott szavak: „relevanciával bír", „célspecifikus"…), majd **élőben a teszten OpenAI-jal** (0,01 USD/futás), 10/10 olvasható |
| b | rangsorolás: a „fontos" küszöbe szigorúbb; a „háttér" kategória **ne** a fő listába (a megjelenítés R-7b: „További helyi hírek" külön rész) — a prompt a kategóriát adja, a lista a rajz dolga | ugyanaz a készlet + 8 pár; a besorolás eloszlása mérve előtte/utána |
| c | tartalomötlet: **egy** ötlet, 1–2 mondat indok, normál betű (a dőlt és a narancs keret a rajz dolga → R-7b) | 5 találaton élő mérés, a hossz mérve |
| d | ha a 3.5 döntés igen: fordított cím a magban (0.3) + prompt-mező | a mag próbái + a két befogadó |

Ki: **DeepSeek** (prompt v3, mag) · **Qwen** (előszűrő szólista, tömeges futtatás) · Claude (élő mérés a teszten, MERES 15.). A promptok a `packages/news-monitor-promptok` csomagban — mindkét befogadó ugyanazt kapja (MODULSZABÁLY).

### F-8.4 · R-7 rajzkör — Claude Design · a kérés kimegy az F-8.1 indításával; beépítés a rajzok érkezése szerint

Egy Design-kérés, öt lapon (mint a `design/DESIGN-KERES-R5.md`): a mai gépezet felsorolva végpontonként, **ami gépezet nélkül áll, azt nem szabad rajzolni**. A kérés: `design/DESIGN-KERES-R7.md` (az F-8.4 első lépése írja meg, a 3. pont döntéseivel vagy azok nélkül — ami DÖNTÉS, az a `kerdesek.md`-be kerül, két változattal).

| Lap | Mi változik (az audit pontjai) | Épít | Óra |
|---|---|---|---|
| **R-7a Első beállítás** (onboarding 1–3, kész, regisztráció, belépés) | 1. lépés: név + weboldal/leírás, a fájlok és az arculat **későbbre**; előnézet üres mondattal, mobilon összecsukva; lépéssáv „1/3 · Bemutatkozás"; 2. lépés „Készítjük a javaslatokat…" állapot, mezők sorokban; 3. lépés egy szerkeszthető összefoglaló, arculat **külön lapon** az első eredmény után, semleges eredetjelvény; Kész: fő gomb „Hírforrások megadása"; mezőnkénti hibák; a 3.2 és 3.4 döntés szerint | Kimi (lapok) · DeepSeek (a piszkozat-állapotgép, ha az arculat kikerül a 3. lépésből: onboarding-core) · Qwen próbák | 10 |
| **R-7b Kezdőlap és Hírek** | kezdőlap: egy fő művelet, a hírek elöl, üzemállapot egy sorban, arculat-csempe ki; hírek: üres állapot gombbal, kártya 1–2 soros cím + 2–3 sor összefoglaló + 1 mondat indok, „További helyi hírek" a háttér-kategóriának, részletpanel saját fejléccel, tartalomötlet semleges dobozban, mobil fülek; beállítás lap **egy oszlop**, forrássor műveletei (F-8.1 k gépezetére), „Hozzáadás" gomb, saját név választógomb, „Pontosítás" alá a kizárások; finomhangolás: helyben „Próba indítása", Újrapróbálás, ok „nem kötelező", javaslathoz ugró gomb | DeepSeek (Attekintes, Beallitas — egy lap ≤ 450 sor/ágens) · Kimi (kezdőlap) · Qwen próbák | 12 |
| **R-7c Beállítások-szint** (Gépház, Értesítések, Adatpolitika, Kimenő, Theme, Feliratok, Saját fiók, Tagok) | Gépház csoportok (Szervezet · Csapattagok · Megjelenés · Használat · Haladó); Értesítések lista külön a kapcsolóktól; Adatpolitika három kérdés, semleges panel, az AI-kapcsoló következménye mellette; Kimenő a Haladó alá, üres állapottal, csoportok csukva; Theme **egyszerű nézet** (logó, fő szín, világos/sötét, betűméret) + a mai a „haladó" mögött; Feliratok: a kiválasztott nyelv nyitva; Saját fiók 1–2 oszlop, belépések „Ma 14:18 · Chrome, Windows" (a böngésző-adat **mérendő**: van-e a naplóban); Tagok a szervezet beállításai közt; a 3.3 döntés szerint | Kimi (sok lap, kis változás) · DeepSeek (Theme egyszerű nézet: a token-részhalmaz leképezése) | 10 |
| **R-7d Nyitólap és adatkezelés** | nyitóblokk az audit szövegével, példa-találatkártya a fogalomkártya helyett, egyszerű háttér, a fejlesztési megjegyzések ki; adatkezelés lap közös fejléccel; a 3.6 adatai | Qwen (a lap kicsi, jól körülírt) | 4 |
| **R-7e Közös vizuális alap** (token-skála) | betűskála arányos (`--fs-base` 16, `--fs-sm` ~14, `--fs-xs` ~12,5 — a Design mondja ki), mező-magasság `--control-min` **mindenhol** (a lista F-8.1 j-ből), egy kiemelőszín, narancs csak figyelmeztetésre, AI-eredet semleges, egységes tartalomszélesség, kártya csak különálló tartalomra | DeepSeek (design-system: arányos származtatás, migráció) · Kimi (sokfájlos átírás a mezőkön, mint az F-1 térköz-átírása — determinisztikus szkripttel) | 6 |

Minden lap végén **fordított ellenőrzés** (Kimi vagy DeepSeek, ≤ 15 sor, ismétlés tilos — MERES 8. tanulsága), képek `tools/kepernyokep/r7-kepek.mjs`, galéria `/allapot/kepek/r7/`.

### F-8.5 · Újrateszt valódi kezdővel + külső felülvizsgálati csomag · 2 óra + Vilmos

- Az audit 5. elfogadási feltétele: egy kezdő felhasználó **magyarázat nélkül** hoz létre figyelést, talál egy hírt, módosít egy témát, visszatér egy hibából. Ki legyen: **Vilmos dönti** (ő, vagy egy általa választott ember). Mi: egy egyoldalas feladatlap, semmi súgó; Claude nézi a képeket és az eseménynaplót.
- **Külső felülvizsgálati csomag** ChatGPT-nek (EGYUTTMUKODES 21.): mi változott az auditra, mit mértünk, mit nem csináltunk meg és miért — hogy a második audit ugyanazokat a lapokat nézze.

---

## 6. A flotta — ki, mit, mennyi ideig, mennyiért

| Ágens | Szerep | Csomagok | Párhuzamos sávok | Becsült ár |
|---|---|---|---|---|
| **Claude** (én) | felbontás, feladatlapok, mérés a teszten, átvétel (határőr · tokenőr · típus · próbák · diff · kép), döntésnapló, állapotlap, Design-kérés, jelentés | mind | — | előfizetés |
| **DeepSeek** (`deepseek-v4-flash`) | kód: végpontok, komponens-javítás, mag-port, prompt v3, design-system származtatás | F-8.1 a,c–g,k · F-8.3 · R-7b,c,e | egyszerre 3–4, **külön fájlhatáron**; egy lap ≤ ~450 sor egy menetben (E-25 tanulsága), kimenet ≤ 24 000 token | ~0,3 USD |
| **Kimi** (`kimi-k2.6`) | sokfájlos szöveg és következetesség; három nyelv; fordított ellenőrzés; a kisebb lapok | F-8.2 · R-7a,c · R-7e átírás · minden fordított ellenőrzés | **soha** nem ugyanazon a fájlon DeepSeekkel; a lektor a migráció **után** | ~1,0 USD |
| **Qwen** (Dell, `qwen3.8-128k:27b`) | próbák, tömeges kulcs-munka, előszűrő szólista, a három nyelv egyezésének gépi ellenőrzése, a kis lapok (nyitólap) | F-8.1 h,i, próbák · F-8.2 h · F-8.3 előszűrő · R-7d | **egyszerre egy**; a feladatlap tényeket mond, nem kérdez (MERES 10.) | 0 |
| **Claude Design** | az R-7 öt lapja | F-8.4 | egy kérés, öt lap; a csomag a `SynologyDrive/SaaS/be/` mappába | — |

**Ütem:** F-8.1 és F-8.2 **ma indul** és párhuzamosan fut (a szöveg nem nyúl komponenshez, a hibajavítás nem nyúl feliratokhoz — a két migráció külön szám). A Design-kérés az F-8.1 indításával megy ki. F-8.3 az F-8.1 után (az élő mérés az OpenAI-n). R-7 beépítése a rajzok érkezése szerint, lapról lapra kirakva. Minden kis lépés után ki a tesztre; a lépések az állapotlapon látszanak indításkor.

**Költség:** a ~40 óra ágens-munkából a fizetős rész ~1,3–1,6 USD (az eddigi 8 csomag 0,98 USD-jából arányítva; a Kimi lektor a legdrágább, ~0,05 USD/ menet). A napló `docs/AGENSEK.md` 3. és `docs/agens-naplo.jsonl`.

**Ami megállít** (ORCHESTRATOR-MEGBIZAS 3.2): a 3. pont hat döntése és a nyitólap adatai. Semmi más. Pénz, titok, éles rendszer, adatvesztés nem érintett; a termék ígérete a posztvázlatnál lenne — azt nem építjük.

---

## 7. Amit tudatosan NEM csinálunk meg az auditból

| Az audit pontja | Miért nem (most) |
|---|---|
| „Posztvázlat készítése" a tartalomötletből | új funkció — a termék ígéretének bővítése (5. megállási ok); az audit is így mondja |
| e-mailes jelszó-visszaállítás, e-mail értesítés | e-mail-küldő nincs a rendszerben (T-10); külön döntés és csomag |
| akadálymentességi / kontraszt-megfelelőség | az audit sem állítja; külön mérés, ha Vilmos kéri |
| a Feliratok szerkesztő elrejtése az ügyfél elől | a lap a **rendszergazdáé** és a tulajdonosé (R-09 követelmény: minden szöveg központilag szerkeszthető) — a Gépház csoportosítása (R-7c) a „Haladó" alá teszi, nem tünteti el |
| a hírek „Hírek" menüpontja a Modulok lenyíló helyett | a lenyíló a csomag-kaput mutatja (F-7a, D-F35): ami a csomagban van; egy modulnál lehet közvetlen — **R-7b kérdése** a Designnak, nem tiltás |
| a Theme-lap technikai neveinek eltüntetése | a lap a rendszergazdáé; a laikus **egyszerű nézet** épül (R-7c), a haladó marad |

---

## 8. Hivatkozások — melyik követelményt szolgálja

R-08 (igényes felület), R-09 (szövegek központi szerkesztése — F-8.2 ebből él), R-11/R-12 (téma: R-7e tokenből), R-14/R-15 (három nyelv: minden szöveg három nyelven), R-16 (kézi javítás védelme — 1. tábla 11. mérve: teljesül), R-17 (forrás/eredet követhető — semleges jelölés, nem eltüntetés), R-18 (megszakítható onboarding — 3.2), A-03 (AI-kiesés külön látszik — F-8.1 e), A-06 (HU/RO/EN — F-8.2 h), A-16 (az ellenőrzések tényleg elvégzettek — ez a lap 1. pontja).

---

## 9. Elfogadás — mikor mondjuk, hogy az F-8 kész

Az audit öt feltétele, a mi mércénkkel:

1. az értesítés a nyilvános lapra visz (élő mérés); a folyamatban lévő AI-munka „készül" állapotot mutat, nem üres űrlapot; minden gomb neve az eredményét mondja — **képekkel**;
2. új felhasználó az első próbahírek előtt nem találkozik arculati vagy technikai döntéssel — **egy végigkattintás képsora**;
3. 390 px-en minden fő lépés elérhető oldalirányú keresgélés nélkül — **képek 390-en**, `kep.mjs`;
4. nincs szögletes zárójeles szöveg, nincs nyers kulcs a felületen — **gépi mérés**: a felirat-tábla és a képernyők szövege;
5. egy valódi kezdő magyarázat nélkül végigmegy az öt lépésen — **Vilmos szava**.

Amíg mind az öt nincs, az F-8 `folyamatban`, és az állapotlap ezt mutatja.
