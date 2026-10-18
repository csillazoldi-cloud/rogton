# Ágensek — szereposztás és költségnapló

Claude Cowork · 2026-09-06

A szabály: **kódolás előtt megmondom, hány ágens, milyen szerepben, mennyi ideig.** Kódolás közben
maximális párhuzamos munka. A napló mindig mutatja, mibe került.

---

## 1. A szereposztás

| Szerep | Mit csinál | Hol fut | Mikor kell |
|---|---|---|---|
| **Építő** (2–4 db) | egy-egy csomagot ír, egymástól elhatárolt fájlokon | fizetős ágens | minden kódoló lépésnél |
| **Tesztelő** (1) | próbákat ír és futtat, a hibautakat is | fizetős ágens | minden kódoló lépés végén |
| **Visszaellenőrző** (1) | a kész képernyőt a rajzhoz méri; a többlet is hiba | fizetős ágens | képernyős lépések végén |
| **Fordító** (1) | a román és angol szöveg; a magyar az eredeti | fizetős vagy helyi | E-4-től folyamatosan |
| **Előszűrő** | tömeges, olcsó, nem kritikus munka: nyelvfelismerés, osztályozás, ismétléskeresés | **helyi Qwen a Dellen** | főleg a hírfigyelőnél |
| **Összefogó** (én) | terv, sorrend, szerződések, ellenőrzés, feltöltés, jelentés | ez a beszélgetés | végig |

**Elhatárolás:** két ágens soha nem kap írási jogot ugyanarra a fájlra. A munkát csomaghatárok
mentén osztom szét, és minden ágens megkapja a szerződést, amit tartania kell.

**Miért nem több:** négy építőnél feljebb nem a sebesség nő, hanem az ütközés. Ha egy lépés
nagyobb, inkább kettébontom.

---

## 2. Mi fut a helyi gépen és mi nem

| Feladat | Hol | Miért |
|---|---|---|
| Nyelvfelismerés, osztályozás, ismétléskeresés, egyszerű címkézés | Dell, helyi modell | tömeges, olcsó, nem kritikus |
| Kódírás, tesztírás, felülvizsgálat | fizetős ágens | itt a minőség számít, nem a darabszám |
| Profiljavaslat, hangnem, arculatelemzés | felhős AI (a termékben) | ezt majd megmérjük, nem hisszük |

**Mérve 2026-09-06:** a Dellen `gemma4:31b` (19,9 GB) és `qwen3.8:27b` (17,7 GB) — együtt nem
férnek el a 32 GB-os kártyán, tehát sorba kell állniuk. A `qwen3:4b` megbízhatatlan, nem
tervezünk vele. A ComfyUI ugyanezt a kártyát használja.

---

## 3. A költségnapló

Minden fizetős ágenshívás ide kerül, még aznap. Az oszlopok:

| Dátum | Lépés | Szerep | Modell | Feladat | Tokenek be/ki | Becsült ár | Eredmény |
|---|---|---|---|---|---|---|---|
| 2026-09-06 | beállítás | — | — | a mai munka (tervezés, mérés, dokumentumok, tesztoldal) végig ebben a beszélgetésben futott | — | **fizetős ágens nem volt használva** | kész |
| 2026-09-06 | E-1, E-2 | összefogó | — | váz, határőr, adatbázis — egyedül, ebben a beszélgetésben | — | 0 | kész |
| 2026-09-06 | E-3 | építő | DeepSeek `deepseek-chat` (V4-Flash áron) | hitelesítő modul + süti-segéd | 5 502 / 2 193 | 0,0014 USD | beépítve, 2 javítással (EMAIL_FOGLALT felismerése, GYENGE_JELSZO sorrend) |
| 2026-09-06 | E-3 | építő | DeepSeek `deepseek-chat` | 5 API-pont | 5 766 / 1 531 | 0,0012 USD | beépítve változtatás nélkül |
| 2026-09-06 | E-3 | tesztelő | Kimi `kimi-k2.7-code-highspeed` | próbák — **üres válasz**: a gondolkodás felemésztette a 9 000 tokenes keretet | 3 855 / 9 000 | ~0,04 USD (k2.6 áron becsülve) | elvetve, modellváltás |
| 2026-09-06 | E-3 | tesztelő | Kimi `kimi-k2.6` (gondolkodás nélkül) | 16 próba + segédek + beállítás | 3 855 / 6 578 | 0,030 USD | beépítve, 1 javítással (kapcsolat lezárása); mind a 16 zöld |
| 2026-09-07 | E-4 | építő | DeepSeek (válasz: `deepseek-v4-flash`) | nyelvkezelés: süti, feliratbetöltés, aktív téma, /api/nyelv, kliens-kontextus | 3 870 / 1 718 | 0,0010 USD | beépítve, 1 javítással (a süti-beállítás rossz volt a route-ban) |
| 2026-09-07 | E-4 | fordító | Kimi `kimi-k2.6` | 47 felirat románul és angolul | 1 885 / 1 833 | 0,0091 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-6 | építő | DeepSeek (`deepseek-v4-flash`) | piszkozat betöltés/mentés, 2 API-pont, teszt-csatlakozó az összefoglalóhoz | 6 184 / 2 401 | 0,0015 USD | beépítve, 2 javítással (rossz relatív utak; hibás Drizzle-szűrő + típusok) |
| 2026-09-07 | E-6 | fordító | Kimi `kimi-k2.6` | 46 új felirat románul és angolul | 3 627 / 2 017 | 0,0115 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-6 | tesztelő | Kimi `kimi-k2.6` | 11 próba a piszkozatra és az összefoglalóra | 3 586 / 4 232 | 0,0203 USD | beépítve, 2 javítással (rossz API-út; `?.`) — mind zöld |
| 2026-09-07 | E-7 | építő | DeepSeek (`deepseek-v4-flash`) | Anthropic-csatlakozó + biztonságos weboldal-letöltő | 3 615 / 3 684 | 0,0015 USD | beépítve, 3 javítással (típus-import, IPv6 literál, más protokoll) |
| 2026-09-07 | E-7 | tesztelő | Kimi `kimi-k2.6` | 17 próba (letöltő, összefoglaló, keret) | 4 528 / 2 632 | 0,0148 USD | beépítve, 4 javítással (async/rejects, 201, oszlopnév) — mind zöld |
| 2026-09-07 | E-8 | építő | DeepSeek (`deepseek-v4-flash`) | javaslatok + hangnem-finomítás (javaslatok.ts, 2 API-pont) | 10 130 / 5 989 | 0,0031 USD | beépítve, a 2 API-pontot újraírtam (kitalált modulokra hivatkozott); `?.trim()` javítás |
| 2026-09-07 | E-8 | tesztelő | Kimi `kimi-k2.6` | 7 próba a javaslatokra és a hangnem-finomításra | 6 705 / 2 106 | 0,0148 USD | beépítve változtatás nélkül — mind zöld (51 összesen) |
| 2026-09-07 | E-9 | építő | DeepSeek (`deepseek-v4-flash`) | arculat-javaslat, jóváhagyás (profil-tábla + piszkozat törlése), 3 API-pont | 9 209 / 6 636 | 0,0031 USD | beépítve, 1 javítással (az arculati források szerkezetét tömbnek hitte) |
| 2026-09-07 | E-9 | tesztelő | Kimi `kimi-k2.6` | 13 próba a jóváhagyásra és az arculatra | 6 976 / 3 648 | 0,0212 USD | beépítve, 2 javítással (típus; a hangnemet kitöltötte, majd hiányzónak várta) — mind zöld (64 összesen) |
| 2026-09-07 | E-10 | építő | DeepSeek (`deepseek-v4-flash`) | profil-módosítás (PUT /api/profil), szervezet részletei | 7 711 / 2 647 | 0,0018 USD | beépítve, 1 javítással (üres mezőbe írt érték saját érték, nem módosított javaslat) |
| 2026-09-07 | E-10 | tesztelő | Kimi `kimi-k2.6` | 11 próba a profil módosítására | 8 902 / 3 503 | 0,0225 USD | beépítve, 1 javítással (a saját előkészítéséből hiányzott a forrás) — mind zöld (75 összesen) |
| 2026-09-07 | E-11 | tesztelő | Kimi `kimi-k2.6` | 17 próba a hibautakra (forrás, AI-keret, mentés, jóváhagyás) | 9 321 / 3 915 | 0,0245 USD | beépítve változtatás nélkül — 2 VALÓDI HIBÁT talált (kimerült keret 500 a javaslatoknál), javítva; mind zöld (92 összesen) |
| 2026-09-07 | E-12 | ellenőr | Kimi `kimi-k2.6` | fordított ellenőrzés: a v6 jelölése ↔ a mi képernyőink, elemről elemre | 36 994 / 6 322 | 0,0604 USD | 6 valódi eltérést talált (javítva); a jelentés fele téves, mert a mellékletből kimaradt a v6 fejléce és előnézete (az én hibám) — `docs/E-12-FORDITOTT-ELLENORZES-kimi.md` |
| 2026-09-07 | E-12b | — | (fizetős ágens nélkül, Claude egyedül) | a modulok szétválasztása: profile-core, onboarding-core, apps/web/profil, határőr-szabályok | — | 0 USD | 92 próba zöld, kirakva |
| 2026-09-07 | E-13 | építő | DeepSeek (`deepseek-v4-flash`) | a téma API-pontjai (7 fájl: szervezeti szint + közös alap) | 4 403 / 2 598 | 0,0013 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-13 | tesztelő | Kimi `kimi-k2.6` | 16 próba a téma két szintjére (elválasztás, lap feje, verziók, jogok) | 13 239 / 8 031 | 0,0447 USD | beépítve 2 javítással (a válasz `{ tema }` burka; a tokenszám 46, nem 43 — az én feladatleírásom hibája) — mind zöld (108 összesen) |
| 2026-09-07 | E-14 | epito | DeepSeek (`deepseek-v4-flash`) | a Theme-lap stíluslapja (tema.css) + az élő előnézet (ElonezetPanel.tsx) a v6-ból | 24 969 / 5 160 | 0 0049 USD | beépítve 2 apró javítással (típusimport  JSX.Element → ReactElement) |
| 2026-09-07 | E-14 | fordito | Kimi `kimi-k2.6` | a D-09 miatti 12 saját felirat románul és angolul | 860 / 586 | 0 0032 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-14 | ellenor | Kimi `kimi-k2.6` | fordított ellenőrzés: a v6 Theme-lap ↔ Tema.tsx/ElonezetPanel.tsx | 21 971 / 5 258 | 0 0419 USD | 2 valódi eltérést talált (ob1card felirat  tab-sorrend)  javítva; a többi kulcsnév-zaj — `docs/E-14-FORDITOTT-ELLENORZES-kimi.md` |
| 2026-09-07 | E-14b | fordító | Kimi `kimi-k2.6` | a verziólista 10 szövege románul és angolul | 1 000 / 700 | 0,0027 USD | beépítve 2 javítással („alkalmazás” ≠ „mentés”; „anterioară”) |
| 2026-09-07 | E-16 | építő | DeepSeek (`deepseek-v4-flash`) | a feliratok API-pontjai (7 fájl, a téma tükre) | 5 141 / 2 644 | 0,0015 USD | beépítve 1 javítással (két importútvonal mélysége) |
| 2026-09-07 | E-16 | tesztelő | Kimi `kimi-k2.6` | 10 próba a feliratok két szintjére (elválasztás, a lap feliratai, tartaléknyelv, verziók, jogok) | 15 459 / 7 400 | 0,0443 USD | beépítve 2 javítással (verziószámok a 6. eset miatt; a közös szint korábbi futásból maradó verziója; dupla lezárás) — mind zöld (123 összesen) |
| 2026-09-07 | E-16 | fordító | Kimi `kimi-k2.6` | a szerkesztő 77 szövege románul és angolul | 2 725 / 3 642 | 0,0172 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-16 | ellenőr | Kimi `kimi-k2.6` | fordított ellenőrzés: az E-15 rajz ↔ Feliratok.tsx/feliratok.css | 33 748 / 4 792 | 0,0512 USD | 2 valódi eltérést talált (telefonon rövid gombok; félkövér Tervezet mentése), javítva; a többi osztálynév-zaj — `docs/E-16-FORDITOTT-ELLENORZES-kimi.md` |
| 2026-09-07 | E-17 | fordító | Kimi `kimi-k2.6` | az export/import fájl 6 szövege románul és angolul | 410 / 198 | 0,0012 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-17b | fordító | Kimi `kimi-k2.6` | a fiókprofil 12 új szövege románul és angolul | 858 / 581 | 0,0031 USD | beépítve változtatás nélkül |
| 2026-09-07 | E-17b | ellenőr | Kimi `kimi-k2.6` | fordított ellenőrzés: a Fiokprofil-mockup ↔ Fiok.tsx/fiok.css | 27 380 / 4 393 | 0,0436 USD | 0 valódi eltérés (a szándékos többletet ismerte) — `docs/E-17b-FORDITOTT-ELLENORZES-kimi.md` |
| 2026-09-07 | E-18 | ellenőr | Kimi `kimi-k2.6` | záró fordított ellenőrzés: a v6 Theme-képernyő ↔ Tema.tsx/ElonezetPanel/tema.css | 50 265 / 4 682 | 0,0665 USD | 0 valódi eltérés; a jegyzetek térköze javítva — `docs/E-18-FORDITOTT-ELLENORZES-tema-kimi.md` |
| 2026-09-07 | E-18 | ellenőr | Kimi `kimi-k2.6` | záró fordított ellenőrzés: az E-15 rajz ↔ Feliratok.tsx/feliratok.css | 41 742 / 2 643 | 0,0502 USD | 2 telefonos eltérés (kártya-párna, a visszaállítás gomb helye), javítva — `docs/E-18-FORDITOTT-ELLENORZES-feliratok-kimi.md` |
| 2026-09-07 | E-19 | építő | DeepSeek (`deepseek-v4-flash`) | a hírfigyelő magja: 12 forrásfájl + csomag a szerződés (0.1) szerint | 13 013 / 13 540 | 0,0056 USD | beépítve 10 javítással (időzóna, `bovitett`, rendezés, `required`, ujjlenyomat, 4 típushiba) |
| 2026-09-07 | E-19 | tesztelő (a) | Kimi `kimi-k2.6` | 5 próbafájl (beállítás, források, kivonat, találat, dedup) a spec alapján | 8 883 / 8 677 | 0,0431 USD | beépítve; 2 spec-pontosítást hozott |
| 2026-09-07 | E-19 | tesztelő (b) | Kimi `kimi-k2.6` | 5 próbafájl (futás, minta, visszajelzés, AI, host/tár) a spec alapján — a (a)-val PÁRHUZAMOSAN, egy hívásban | 8 877 / 9 891 | 0,0480 USD | beépítve — 111 próba zöld |
| 2026-09-07 | E-19 | tesztelő (elveszett) | Kimi `kimi-k2.6` | az első, 10 fájlos tesztelő-futás: a `device_bash` hívás végén a háttérben MEGHALT, válasz nem jött — a költsége nem került a naplóba (becslés ≈ 0,04 USD) | ? | ≈ 0,04 USD | tanulság: párhuzamos ágensek egy hívásban, `wait`-tel, ≤ 170 mp |
| 2026-09-07 | E-19b | építő | DeepSeek (`deepseek-v4-flash`) | a modul folyamatai (`folyamat.ts`, a szerződés 2.12) + `apps/proba-host` | 24 508 / 14 274 | 0,0074 USD | beépítve 8 javítással (profil a környezetben, hibás forrás újrapróbálása, keret-jelzés, típusok) |
| 2026-09-07 | E-19b | tesztelő | Kimi `kimi-k2.6` | 27 folyamat-próba a spec 2.12 alapján, a kód ismerete nélkül | 14 862 / 13 384 | 0,0677 USD | beépítve 3 javítással a próbákban (a „ugyanaz a cikk” fixtúra, a keret-eset állapota, `osszkep` mező) — 138 + 3 próba zöld |
| 2026-09-07 | E-20 | építő A | DeepSeek (`deepseek-v4-flash`) | a hírfigyelő táblái, migráció 0027, Postgres-tár, csatlakozók, az API első fele | 36 133 / 16 000 | 0,0095 USD | a válasz hosszkorlátjába (16 000 token) ütközött — A2 folytatta; beépítve javításokkal (séma-kör, `length`) |
| 2026-09-07 | E-20 | építő A2 | DeepSeek (`deepseek-v4-flash`) | az API hiányzó 11 útvonala + hibakódok | 12 907 / 4 413 | 0,003 USD | beépítve 2 javítással (útvonal, visszajelzés sémája) |
| 2026-09-07 | E-20 | építő B | DeepSeek (`deepseek-v4-flash`, 24 000 token) | AI-hívó, közös letöltő (robots, RSS/Atom), 6 prompt, teszt-adapter bővítése, kiemelések (`apps/web/ai`, `apps/web/letoltes`) | 24 575 / 19 597 | 0,0089 USD | beépítve 3 javítással (tokenőr-kivétel, teszt-adapter szöveges indok, az onboarding keret-hibatípusa) |
| 2026-09-07 | E-20 | tesztelő | Kimi `kimi-k2.6` | 10 élő API-próba (jogok, elválasztás, verziók, források, valódi RSS, A-10, visszajelzés → javaslat → döntés) | 13 956 / 8 048 | 0,0455 USD | beépítve 2 javítással (szervezet nélküli kód, `!`) — 133 próba zöld |
| 2026-09-08 | E-22 | építő A | DeepSeek (`deepseek-v4-flash`, 24 000 token) | `hf_sor` várólista + migráció 0028, `sor.ts`, `futtato.ts` (napi ütemezés, `esedekes`), `instrumentation.ts`, API (202, sor-útvonal) | 37 139 / 9 285 | 0,0078 USD | beépítve 6 javítással (`sql` import, SECURITY DEFINER a napi ütemezéshez, hibakód, `RETURNING id`, 409 beállítás nélkül, futáslista visszatéve) |
| 2026-09-08 | E-22 | építő B | DeepSeek (`deepseek-v4-flash`) | `helyi-ollama` csatlakozó (Ollama /api/chat, JSON, GPU-sor), D-13 lap, compose-változók | 10 815 / 5 787 | 0,0031 USD | beépítve 2 javítással (csomagfüggőségek; a GPU-sor versenyhelyzete) |
| 2026-09-08 | E-22 | tesztelő a | DeepSeek (`deepseek-v4-flash`) | a 10 élő hírfigyelő-próba átírása a várólistás folyamatra | 9 940 / 8 888 | 0,0039 USD | beépítve 1 javítással (a nem létező futás-részlet útvonalat kérte → megépítve) — 133 zöld |
| 2026-09-08 | E-22 | tesztelő b | DeepSeek (`deepseek-v4-flash`) | 5 próba az Ollama-sorra (párhuzamos hívások sorban, elérhetőség, hiba) | 7 014 / 3 995 | 0,0021 USD | beépítve 1 javítással (`ollamaElerheto` alakja) — talált egy VALÓDI versenyhelyzetet a sorban, javítva |
| 2026-09-08 | E-22 | tesztelő (2×) | Kimi `kimi-k2.6` | ugyanaz, mint tesztelő a | — | ismeretlen (nem ért véget) | a hívás végével kétszer megszakadt, kimenet nélkül; a költsége a Kimi számláján látszik, itt nem mérhető |
| 2026-09-08 | E-23 | építő A | DeepSeek (`deepseek-v4-flash`, 28 000 token) | a mag: `kartya.ts` (egy esemény = egy kártya), `osszefoglalo`, `tartalomotlet` mező, `tartalomotletKer`, `attekintes.kartyak` | 22 736 / 28 000 | 0,011 USD | a válasz hosszkorlátjába ütközött (a próbafájl ismétlődő szóba futott — „szó szó szó…”); a forrásfájlok jók, 3 elírás javítva (`talatId`, `talat`, `import type`); a próbákat én írtam (9 eset) |
| 2026-09-08 | E-23 | építő B | DeepSeek (`deepseek-v4-flash`) | migráció 0029, séma/tár, tartalomötlet-útvonal, teszt-csatlakozó összefoglalója, 2 élő próba | 26 063 / 7 520 | 0,0058 USD | beépítve 2 javítással (az összefoglaló a figyelmeztető sorokat is beszedte; a hibakódok képezése 404/429/502) — 135 zöld |
| 2026-09-08 | E-23 | ellenőr | DeepSeek (`deepseek-v4-flash`) | a 6 prompt felülvizsgálata a követelmények ellen, 3 prompt v2, próbakészlet (12 cikk + 8 pár), `hf-prompt-proba.py` | 13 479 / 12 979 | 0,0055 USD | beépítve változtatás nélkül; a „nyelv” észrevétele (román felhasználónál magyar válasz) → nyitott kérdés Vilmosnak |
| 2026-09-08 | E-24 | építő A | DeepSeek (`deepseek-v4-flash`, 30 000 token) | Áttekintés lap + részletpanel + CSS a prototípus szerint | 25 979 / 13 119 | 0,0073 USD | beépítve 5 javítással (import-utak, `t` típusa, tokenőr-kivételek, keretszín, időzóna) |
| 2026-09-08 | E-25 | építő B | DeepSeek (`deepseek-v4-flash`, 30 000 token) | Beállítás lap (egyben) | 21 674 / 30 000 | 0,0114 USD | ELDOBVA — ismétlődő `useState`-sorokba futott (a 30 000 token elfogyott); tanulság: egy lap ≤ ~450 sor egy ágensnek |
| 2026-09-08 | E-24 | építő C | DeepSeek (`deepseek-v4-flash`) | `beallitasJavaslatKer` + útvonal, a fiókprofil „Modulok” sora, 9 élő próba, mag-próba | 13 574 / 5 070 | 0,0033 USD | beépítve; a mag-próbáját a saját kitalált sémájával írta → átírtam (4 eset) |
| 2026-09-08 | E-24 | lektor | Kimi `kimi-k2.6` | a 160 román/angol felirat átnézése | 10 399 / 3 941 | 0,0256 USD | 60 javaslat, 25 beépítve (a „Budapest” időzóna-javaslatai tévesek) — `docs/E-24-FELIRATOK-LEKTOR.md` |
| 2026-09-08 | E-25 | építő B1 | DeepSeek (`deepseek-v4-flash`, 24 000 token) | Beállítás lap: űrlap, tervezet, mentés, próbafuttatás, AI-javaslat | 18 911 / 7 867 | 0,0049 USD | beépítve 6 javítással (típusnév-ütközés, oszlopok, chipek, néző-ág, jelvény, `page.tsx` importjai) |
| 2026-09-08 | E-25 | építő B2 | DeepSeek (`deepseek-v4-flash`, 24 000 token) | Beállítás lap: források oszlopa + a lap teljes CSS-e | 19 597 / 6 571 | 0,0046 USD | beépítve 1 javítással (saját oszlopcím ki) + 5 pótolt osztály |
| 2026-09-08 | E-24 | fordított ellenőr | DeepSeek (`deepseek-v4-flash`) | a két lap mérése a prototípus ellen (vasszabály) | 32 724 / 3 850 | 0,0057 USD | 2 javítás belőle (a „miért” doboz függő értékelésnél, csonkolt jelzés a panelre); a többi „többlet” elfogadott követelmény |
| 2026-09-08 | E-26 | építő | DeepSeek (`deepseek-v4-flash`, 24 000 token) | Finomhangolás lap + CSS a prototípus szerint | 20 010 / 10 385 | 0,0057 USD | beépítve 6 javítással (típusok, `page.tsx`, effekt-őr, chip-stílus, nyelv) |
| 2026-09-08 | E-26 | tesztelő | DeepSeek (`deepseek-v4-flash`) | 8 élő próba a finomhangolás folyamatára | 8 536 / 5 081 | 0,0026 USD | beépítve 4 javítással (kitalált séma és útvonal, `eredet`, `PROBA_CIM`, időkorlát) — 1 VALÓDI HIBÁT talált (eldöntött javaslat újra dönthető volt), javítva |
| 2026-09-08 | E-26 | fordított ellenőr | DeepSeek (`deepseek-v4-flash`) | a Finomhangolás lap mérése a prototípus ellen | 11 997 / 4 300 | 0,0029 USD | 3 javítás belőle (javaslat-doboz csak kész javaslattal, verziók sorrendje, visszaállítás után alaphelyzet); a többi megengedett többlet |
| 2026-09-08 | E-28 | építő A | DeepSeek (`deepseek-v4-flash`, 20 000 token) | a referencia-host SQLite-tára (`HirfigyeloTar` a `node:sqlite`-tal) + próbái | 4 662 / 7 410 | 0,0027 USD | beépítve 4 javítással (csomag-bejárat helyett belső importok, kivonat-sorrend, lejárat dátumként, sorszám olvashatóbban); a PRÓBÁIT KIDOBTAM — kitalált mezőnevekkel írta (`nev`, `url`, `forrasId`), újraírtam a valódi sémákkal |
| 2026-09-08 | E-28 | építő B | DeepSeek (`deepseek-v4-flash`, 22 000 token) | saját sor + ütemező (SQLite), `node:http` kiszolgáló, napi esedékesség, próbák | 5 748 / 7 042 | 0,0028 USD | beépítve 4 javítással (`napiEsedekes` kitalált `tar.beallitasAktiv`-ot hívott, `attekintes` await nélkül, üres kérés-törzs, felesleges import) |
| 2026-09-08 | E-28 | tesztelő | DeepSeek (`deepseek-v4-flash`) | 6 végigfutás-próba a második hostra (SQLite-fájl, dedup, jogok, verziók) | 5 175 / 2 448 | 0,0014 USD | beépítve 1 javítással (nem létező cél-érték); ez a próba a HORDOZHATÓSÁG bizonyítéka |
| 2026-09-08 | E-28 | fordított ellenőr (1.) | DeepSeek (`deepseek-v4-flash`, 8 000 token) | a host átvizsgálása | 20 874 / 8 000 | 0,0052 USD | ELDOBVA — ugyanazt a (téves) megállapítást írta le ~80-szor, a keret elfogyott; tanulság: a jelentés hosszát és az ismétlés tilalmát ki kell mondani |
| 2026-09-08 | E-28 | fordított ellenőr (2.) | DeepSeek (`deepseek-v4-flash`, 3 000 token) | ugyanaz, „legfeljebb 15 sor, ismétlés tilos” | 12 060 / 1 720 | 0,0022 USD | 16 megállapítás, 7 beépítve — 2 VALÓDI HIBÁT talált (a leálláskor „fut”-ban ragadt tétel; a hibára futott napi futás körönként újraindult volna) |
| 2026-09-08 | E-29 | tesztelő | DeepSeek (`deepseek-v4-flash`, 14 000 token) | a közös letöltő csomag 13 próbája (címnormalizálás, SSRF, RSS/Atom/HTML, robots, korlátok) | 6 034 / 2 590 | 0,0016 USD | beépítve 3 javítással (a `vi.mock` próbán belülre került → a fájl tetejére emelve, IPv6 a címben szögletes zárójel nélkül, kódkerítés a fájlban); +1 saját próba (DNS-visszakötés) |
| 2026-09-08 | E-29 | fordított ellenőr | DeepSeek (`deepseek-v4-flash`, 3 000 token) | a két kiemelt csomag, a generátor és a határőr-szabályok átvizsgálása | 9 890 / 1 620 | 0,0019 USD | 14 megállapítás, 3 beépítve — a legfontosabb VALÓDI: a `server-only` őr elveszett a mozgatással (a webalkalmazás bejáratára visszatéve); a Postgres-idézőjelezésről szóló két észrevétele téves |
| 2026-09-08 | E-29b | tesztelő | DeepSeek (`deepseek-v4-flash`, 12 000 token) | 6 próba a futás biztonsági fékeire (pár-korlát, határidő, cím nélküli cikk) | 7 260 / 2 480 | 0,0017 USD | beépítve 1 javítással (a `kivonatok()` második paraméterét kihagyta); a próbák visszavonás-próbával ellenőrizve: a fék kivételekor 3 bukik el |
| 2026-09-08 | E-29b | fordított ellenőr | DeepSeek (`deepseek-v4-flash`, 2 500 token) | a CDATA-javítás és a fékek átvizsgálása | 8 100 / 1 340 | 0,0015 USD | 10 megállapítás, 2 beépítve (cím-tartalék `dc:title`/`media:title`; határidő a forrásciklusban is); egy állítása TÉVES volt (az ujjlenyomat-próba állítólag a javítás nélkül is átmenne — kipróbálva: nem) |
| 2026-09-08 | E-29c | tesztelő | DeepSeek (`deepseek-v4-flash`, 12 000 token) | 7 élő próba az AI-válaszok nyelvére (nyelvváltás mentése, a sortétel nyelve) | 7 900 / 2 700 | 0,0019 USD | beépítve 1 javítással (a második futást ugyanabban a szervezetben indította → FUT_MAR; saját szervezetre átírva) |
| 2026-09-08 | E-29c | fordított ellenőr | DeepSeek (`deepseek-v4-flash`, 2 500 token) | a nyelv útjának átvizsgálása | 8 400 / 1 500 | 0,0017 USD | 12 megállapítás, 1 beépítve — VALÓDI: aki még nem váltott nyelvet, annál a kérés nyelve döntsön (süti/böngésző), ne essünk vissza magyarra; a süti-előtag és a gyorsítótár-keveredés vádja téves |
| 2026-09-08 | E-30 | építő | DeepSeek (`deepseek-v4-flash`, 22 000 token) | a referencia-host két HTML-oldala, a lapváz és a CSS (702 sor) | 6 300 / 8 900 | 0,0034 USD | beépítve 6 javítással (`aktiv.temak` helyett `aktiv.beallitas.temak`, `veg` mező neve, hiányzó import, beégetett „Kizárások:” felirat, a fejléc és a menü feliratosítása, duplikált CSS-osztály) |
| 2026-09-08 | E-30 | fordított ellenőr | DeepSeek (`deepseek-v4-flash`, 2 500 token) | a felület átvizsgálása (escape, feliratok, tokenek, gomb, nyelv) | 7 400 / 1 400 | 0,0016 USD | 12 megállapítás, 1 beépítve (duplikált CSS-osztály); a két „SÚLYOS” escape-vád és a „két párhuzamos futás” vád ELLENŐRIZVE ÉS TÉVES |
| 2026-09-08 | E-32 | fordított ellenőr | DeepSeek (`deepseek-v4-flash`, 1 400 token) | a kirakás átvizsgálása: útvonal-előtag szivárgás, 303 átirányítás, nginx-blokk, compose-elszigeteltség, jelszó-szkript | 10 008 / 364 | 0,0015 USD | 7 állítás, **egy valódi hibát sem talált**; a legérzékenyebbet (szivárog-e ki az előtag alól) utána élőben is megmértem — nem szivárog |
| 2026-09-08 | DOKU | fordított ellenőr (1.) | DeepSeek (`deepseek-v4-flash`, 1 600 token) | a rendszerdokumentáció átvizsgálása | 31 519 / 1 600 | 0,0049 USD | ELDOBVA — ugyanazt a (nem is állítás értékű) megjegyzést írta le hatszor; a mellékletből hiányzott a csomagonkénti próbaszám, ezért „nem ellenőrizhető"-t ismételt |
| 2026-09-08 | DOKU | fordított ellenőr (2.) | DeepSeek (`deepseek-v4-flash`, 1 200 token) | ugyanaz, kiegészített ténylistával és szigorúbb ismétléstiltással | 25 000 / 1 200 | 0,0040 USD | 9 megállapítás, **1 valódi**: a lejárt munkamenetek takarítása pontatlanul volt leírva (csak a lekérdezett sor törlődik) — javítva, és a hiány felvezetve a nyitott pontok közé |
| 2026-09-13 | F-8.1 c–e | építő | DeepSeek (`deepseek-flash`) | Attekintes.tsx: nyelvcímke ki, „N új" számolt, AI-kiesés számmal + 1 új kulcs 3 nyelven | 10 619 / 8 891 | 0,0040 USD | beépítve változtatás nélkül (a fájl CRLF-fel jött — LF-re váltva) |
| 2026-09-13 | F-8.1 f | építő | DeepSeek (`deepseek-flash`) | Költség lap a munkatér pénznemében (3 fájl), a statikus „szerkesztő" jelvény ki | 13 717 / 5 362 | 0,0034 USD | beépítve 1 javítással (a `Penznem` típust a `@km/contracts`-ból importálta — az a `kezdolap/tipusok`-ban van; a feladatlapom hibája) |
| 2026-09-13 | F-8.1 k/1 | építő | DeepSeek (`deepseek-flash`) | a mag 0.3.0: `forrasTorol` port, `forras-muvelet.ts` (cím módosítása, eltávolítás), 6 próba | 34 712 / 5 350 | 0,0064 USD | beépítve változtatás nélkül — 188 mag-próba zöld |
| 2026-09-13 | F-8.1 k/2 | építő | DeepSeek (`deepseek-flash`) | `PUT/DELETE /api/hirfigyelo/forrasok/[id]` + 6 élő próba | 13 998 / 3 064 | 0,0028 USD | beépítve változtatás nélkül; az élő próba a helyi építésen fut |
| 2026-09-13 | F-8.1 h | építő | Qwen `qwen3.8-128k:27b` (helyi) | migráció 0061: 26 kulcs × 3 nyelv (a Feliratok lap csoportnevei, a mentés gomb) | 7 202 / 1 982 | 0 | beépítve változtatás nélkül (78 sor, első futásra, 34 mp) |
| 2026-09-13 | F-8.4b | építő | deepseek (`deepseek-flash`) | R7e-epito-design-system | 15593 / 12379 | 0.0056 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4b | építő | kimi (`kimi-k2.6`) | R7e-kimi-control-min-hirfigyelo | 14798 / 13855 | 0.0695 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4b | építő | kimi (`kimi-k2.6`) | R7e-kimi-control-min-tobbi | 25777 / 24000 | 0.1205 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4b | építő | kimi (`kimi-k2.6`) | R7e-kimi-control-min-fiok | 16052 / 15115 | 0.0757 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4c | építő | deepseek (`deepseek-flash`) | R7b-epito-felsosav | 6959 / 4127 | 0.0021 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4c | építő | kimi (`kimi-k2.6`) | R7b-kimi-kezdolap | 42896 / 6348 | 0.0661 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4c | építő | deepseek (`deepseek-flash`) | R7b-epito-forrasok | 5152 / 4466 | 0.0020 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4c | építő | deepseek (`deepseek-flash`) | R7b-epito-attekintes | 12695 / 8705 | 0.0042 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4c | építő | deepseek (`deepseek-flash`) | R7b-epito-beallitas | 12617 / 6266 | 0.0035 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4c | építő | deepseek (`deepseek-flash`) | R7b-epito-finomhangolas | 11645 / 8276 | 0.0039 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4d | építő | deepseek (`deepseek-flash`) | R7a-epito-lepes3-kesz | 10051 / 4122 | 0.0026 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4d | építő | deepseek (`deepseek-flash`) | R7a-epito-belepes | 7154 / 4438 | 0.0022 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4d | építő | deepseek (`deepseek-flash`) | R7a-epito-lepes2 | 8223 / 5729 | 0.0028 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| 2026-09-13 | F-8.4d | építő | kimi (`kimi-k2.6`) | R7a-kimi-keret-lepes1 | 31729 / 6457 | 0.0560 USD | beépítve (a részletek: HANDOFF 09-13 késő este) |
| **2026-09-13 R-7 (F-8.4) összesen** | | | 14 menet: DeepSeek 9 · Kimi 5 · Qwen 0 | az R-7e/R-7b/R-7a beépítése a rajzból | 221341 / 124283 | **0.417 USD** | egy javítás menetenként átlag alatt (a hibák: elveszett import, kitalált mező, CRLF) |
| 2026-09-13 | F-8.4e | építő | deepseek (`deepseek-flash`) | R7c-B-kimeno | 6527 / 4288 | 0.0021 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | deepseek (`deepseek-flash`) | R7c-C-megjelenes | 13285 / 4294 | 0.0031 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | deepseek (`deepseek-flash`) | R7c-A-gephaz | 11794 / 4723 | 0.0030 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | deepseek (`deepseek-flash`) | R7c-G-fiok | 8550 / 5898 | 0.0028 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | deepseek (`deepseek-flash`) | R7c-H-tagok | 8999 / 6800 | 0.0032 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | deepseek (`deepseek-flash`) | R7c-F-feliratok | 10746 / 8543 | 0.0039 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | kimi (`kimi-k2.6`) | R7c-D-beallitasok | 35626 / 5353 | 0.0553 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4f | építő | deepseek (`deepseek-flash`) | R7d-B-adatkezeles | 12456 / 2394 | 0.0024 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4f | építő | deepseek (`deepseek-flash`) | R7d-A-nyitolap | 19493 / 5796 | 0.0044 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| 2026-09-13 | F-8.4e | építő | kimi (`kimi-k2.6`) | R7c-E-sajatfiok | 15388 / 12976 | 0.0665 USD | beépítve (4 típushiba + 18 tokenőr-hiba javítva a 10 menetre) |
| **2026-09-13 R-7c/R-7d összesen** | | | 10 menet: DeepSeek 8 · Kimi 2 | a beállítások-szint és a nyitólap a rajzból | 142864 / 61065 | **0.147 USD** | |
| **2026-09-06/08 összesen** | | | | | 912 840 / 429 501 (ahol mért) | **≈ 0,98 USD** | |

Árak, 2026-09-06-án nézve: DeepSeek V4-Flash 0,14 / 0,28 USD per millió token (be/ki); Kimi k2.6 0,95 / 4,00.
A `deepseek-chat` név a mérés szerint még kiszolgál (a válasz `model` mezője mostantól a naplóba kerül);
harmadik feles árlisták szerint a név kifutóban van — ha egyszer nem felel, a `deepseek-v4-flash` a váltás.
A gépi napló: `docs/agens-naplo.jsonl` (minden hívás egy sor).

**Az ár becsült**, a szolgáltató árlistája és a mért tokenszám alapján. A hónap végén a valódi
számlához hasonlítom, és ha eltér, azt is ideírom.

---

## 4. Hol fut a flotta — 2026-09-11 óta a Dellen (T2), hadrendben

**Mérve 2026-09-11 23:35, a Dellen.** A flotta három ágense egy hívásban, párhuzamosan, ugyanarra a pici feladatra
(`tools/agens/feladatok/FLOTTA-proba.md`): mind a három ugyanazt a helyes fájlt adta vissza.

| Ágens | Modell (a válasz szerint) | Idő | Ár | Mire való |
|---|---|---|---|---|
| `deepseek` | `deepseek-flash` | 1,1 mp | 0,0001 USD | építő |
| `kimi` | `kimi-k2.6` | 1,7 mp | 0,0006 USD | tesztelő, lektor, ellenőr |
| `qwen` | `qwen3.8-128k:27b` (helyi, Ollama; ugyanaz a súly 131072 szövegkerettel — 2026-09-13-tól alap) | 8,0 mp hidegen | **0** | előszűrő, tömeges/olcsó munka, második vélemény |

**Hogyan:** a Dellen, a tárhely mappájában (`C:\Users\remoteadmin\aitmetica-saas`):

```
cd tools/agens
python agens.py --szolgaltato deepseek|kimi|qwen --feladat feladatok/X.md --kimenet ../../.agens-ki/X --lepes E-nn --szerep epito
```

- A kulcsok a **tárhely melletti `vault/` mappában** vannak (`deepseek-key.txt`, `kimi-key.txt`); a `.gitignore` kihagyja,
  a futtató ezt a helyet nézi elsőként. A `qwen`-hez nem kell kulcs.
- A nyers kimenet a `.agens-ki/` mappába megy (szintén kihagyva a feltöltésből); a napló a `docs/agens-naplo.jsonl`.
- **Párhuzamosan:** több `python agens.py … &` egy shell-hívásban, végén `wait` — a Dellen a háttérfolyamat nem hal meg,
  de a bevált forma ez. A `qwen`-ből **egyszerre egy** menjen: a kártya (32 GB) egy 27 milliárdos modellt tart bent
  (mérve: 21,4 GB foglalt a futás után, 32k szövegkerettel). A fizetősekkel párhuzamosan mehet.
- A `--modell qwen3.8-128k:27b` a hosszabb szövegkeretű helyi változat; a `--max-tokens` a válasz hossza.
- A helyi Qwen gondolkodása ki van kapcsolva (a kimeneti keretet enné); hőfok 0,2.

**Ami a Dellen még nincs:** `pnpm` — tehát a próbákat itt nem futtatjuk, az a Gigabyte dolga (D-22). Az ágensek
kimenetét itt építjük be, feltöltjük, és a Gigabyte robotja fordít és rak ki.

---

## 5. Amit ez a lap nem old meg

- Nem tudom előre pontosan, mennyi lesz egy lépés ára — becsülök, aztán mérek.
- A helyi modell sebességét nem mértem még valós feladaton ebben a projektben; az E-4-nél fogom.
- A kártya beosztása (nappali/éjszakai sávok) a marosvásárhelyiek projektnél már téma volt;
  ha a két projekt egyszerre akarja a kártyát, azt közösen kell rendezni. **[nyitott]**

## A Qwen elvágott válasza — mérve 2026-09-13

Egy futás (F-5b, próbaíró) 4391 kimeneti tokennél, mondat közben szakadt meg — a 12 000-es hosszkorlát és a 32k-s keret alatt, fájl-blokk nélkül. Ugyanaz a
feladat kétszer megismételve (a 27b és a 128k-s változattal) mindkétszer teljes fájlt adott (`done_reason: stop`); a Qwen próbafájlja 11 esetből 10 zöld, 1 elgépelés.
Az eset tehát **eseti megszakadás**, nem képességhiány. Amit az `agens.py` azóta tesz: a helyi válasz megállási okát (`done_reason`) naplózza, és **egy ismétlést** tesz,
ha az ok nem `stop`, vagy nincs a válaszban `=== FÁJL:` blokk; az alapmodell a 128k-s változat (a másik projekt tanulsága: a 32k-s keret némán vágja a prompt elejét,
ha a mellékletek nagyok). A feladatlap Qwennek **ne tegyen fel nyitott kérdést** („nézd meg, ha…, ha…") — azon gondolkodik prózában a fájl helyett; a tényeket állítsd.
