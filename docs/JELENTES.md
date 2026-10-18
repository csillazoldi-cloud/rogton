# JELENTÉS — az F-futam (2026-09-12)

A megbízás: `docs/ORCHESTRATOR-MEGBIZAS.md`. A számok mind mérésből (`docs/MERES.md`), a döntések a `docs/DONTESNAPLO.md`-ben (D-F01…D-F26),
a nyitott tételek a `docs/TEENDOK.md`-ben. Az élő állapotlap: https://saas.mediapartizan.ro/allapot/ — a lépéseknél a „ki" mező mutatja, melyik ágens dolgozott.

## 1. Mi készült el

| Csomag | Állás | Hol látszik |
|---|---|---|
| F-0 Terepfelmérés | **kész** | `docs/MERES.md` 1. — a mai számok a rögzítettek mellett; határőr/tokenőr/típus zöld; az állapotlap a valóságra hozva |
| F-1 Térköz-skála | **kész — kint a teszten (19:41, a főággal együtt)** | 15 fok tokenből (`--ter-0…14`), a 13 stíluslap 654 helye átírva, a tokenőr tiltja a pixeles térközt, Theme-lap hat fülre, Térköz-csoport a rajz szerint; képek: https://saas.mediapartizan.ro/allapot/kepek/f1/ |
| F-2 Kezdőképernyő és Gépház | **kész — kint a teszten (19:46; a v4 kör 22:10-kor)** | az R-1 v3 rajz 8 artboardja: felső sáv (állandó komponens, a munkatér neve mindig lenyíló, telefonon hamburger), `/kezdolap` hat csempével egy lekérdezésből, négy állapotban, `/gephaz` két nézetben; pénznem munkatér-beállítás tárolt árfolyammal; munkatér-váltás; 111 felirat; képek a rajz mellett: https://saas.mediapartizan.ro/allapot/kepek/f2/ |
| F-3 Tagok, meghívás, szerepek | **kész — kint a teszten (09-13 00:12)**: Tagok lap, meghívó beváltó lap, a sáv Tagok sora; képek: https://saas.mediapartizan.ro/allapot/kepek/r2/ | `packages/hozzaferes-core` (az első modul a modulszabály szerint, második befogadóban is), `meghivo` tábla, 8 végpont a közös kapun; a Tagok lap a `design/r2` rajzra vár |
| F-4 Saját fiók | **kész — kint a teszten (09-13 09:19)**: a Saját fiók lap (`/sajat-fiok`) — adataim (a név menthető, az e-mail zárt „még nem működik"), jelszóváltás a felületi ellenőrzéssel és a következmény kimondva, az utolsó belépések listája (30 nap), kiléptetés minden más eszközről, a felület nyelve, munkatereim kilépéssel bármelyikből, a rendszergazdai blokk; a sáv fiók-neve ide visz; képek: https://saas.mediapartizan.ro/allapot/kepek/r3/ | jelszóváltás (a többi eszközt kilépteti), névmódosítás, kiléptetés mindenhol, `POST /api/tagok/kilep` bármelyik saját munkatérből; e-mail zárva, fióktörlés nincs |
| F-5 Értesítések és adatpolitika | **kész — kint a teszten (09-13 08:36)**: a Beállítások lap (`/beallitasok`, Értesítések · Adatpolitika) — fiók-szintű értesítéslista olvasott-jelöléssel, harang a sávban, hat esemény-kapcsoló, a felületi csatorna; az adatpolitika három adatút-sora és a szolgáltató doboza rendszeradatból; a felhő-kapcsoló a rajz szerint „még nem működik"; képek: https://saas.mediapartizan.ro/allapot/kepek/r4/ | `packages/esemeny-core` 0.2.0 (25 fajta), eseménynapló, értesítés két szintje + fiók-szint (`ertesites_fiok`, `ertesites_olvasott`), kimenő horog (alapból semmi nem megy ki), AI-kapcsoló minden AI-hívás előtt, 4 új esemény kibocsátása |
| F-6 Fájlfeltöltés | **kész — kint a teszten (09-13 07:50)**: az „Arculati anyagok" blokk az ügyfélprofilon és az onboarding 3. lépésén (négy cél, húzás/kattintás, hibautak, előnézet két háttéren, csere megerősítéssel és új tervezettel, korábbi példány halványan, néző csak olvasás); képek: https://saas.mediapartizan.ro/allapot/kepek/r6/ | `packages/fajl-core` (a típus a tartalomból, SVG tiltva), `arculat_fajl` + mappa, a mentés része, 3 végpont, `logo_fajl_id` a tervezetben, `ArculatAnyagok` komponens |
| F-7 Előfizetés | **kész — kint a teszten (09-13 11:09)**: pilot (D-F35) — egy csomag, ár és fizetés nélkül; a Gépház **Csomag** csempéje (a rács első helyén, az „Árazás és fizetés" sor „még nem működik" jelöléssel) és **Kimenő értesítések** csempéje + a `/gephaz/kimeno` lap (a 25 fajta, két szint, háromállású választó); az **AI-kapcsoló** az Adatpolitika fülön és a hírfigyelő sávja kikapcsolt AI-val (T-23); képek: https://saas.mediapartizan.ro/allapot/kepek/r5/ | `csomag` tábla, `szervezet.csomag_kod`, modul-kapu (`MODUL_NEM_ELERHETO`), `GET /api/csomag`, `GET /api/ertesites` + `bekotve`, `ai_engedelyezve` az áttekintőben; 13 próba |

## 2. Mit mértem

Részletesen: `docs/MERES.md`. A lényeg:

| Mérés | Érték |
|---|---|
| pixelben írt térköz a stíluslapokban | 902 → **0** (677 deklaráció átírva a determinisztikus eszközzel; a tokenőr őrzi) |
| alaptokenek | 53 → 61 |
| a csomagok saját próbái | design-system 8 · hozzaferes-core 21 · esemeny-core 12 · fajl-core 24 · news-monitor-core 182 · letolto 31 · a többi 15 — **mind zöld** |
| a webalkalmazás élő próbái | 217 → **254** (24 → 26 fájl), a jogosultsági mátrix 43 → 57 módosító végponttal — **mind zöld** (a nap végi futás száma a MERES-ben) |
| a második befogadó | **40 zöld** — hírfigyelő, hozzáférés, esemény, fájl: mind a négy modul fut a második rendszerben is (a modulszabály 10. pontja) |
| határőr | 16 → **25 szabály**, 0 sértés |
| ágensköltség ma | a `docs/agens-naplo.jsonl` szerint (DeepSeek, Kimi, Qwen sorai) |

## 3. Mit döntöttem el helyetted

A teljes lista: `docs/DONTESNAPLO.md` (D-F01…D-F26). A fontosak:

- **D-F01** A munka a Dellen fut (a megbízás a Gigabyte-ot feltételezte): helyi Postgres Docker nélkül, a kód innen megy a GitHubra; a fordítás és a kirakás marad a Gigabyte-é.
- **D-F03** A lemezre másolt régebbi doksik nem írták felül az újabbakat (félretéve a `_torolni/`-ba).
- **D-F08** A hét régi térköz-token származtatott lett; a régi szervezeti felülírások elvesznek (a teszten csak próbaszervezetek vannak).
- **D-F10** A Theme-lapon a v6 elemei (előnézet, szintválasztó, export/import, verziók) maradtak — a rajz csak a Térköz-csoportot rajzolta.
- **D-F11** A stíluslapok átírását eszköz végezte, nem ágens (a Kimi a számkulcsot rosszul párosította).
- **D-F14** A rajzok hiányában a képernyő nélküli gépezet ment előre (F-3…F-6), a sorrendtől eltérve.
- **D-F16 / D-F20 / D-F21** A modulok hibakódjainak és a fiókszintű eseményeknek a helye.
- **D-F22** A pénznem munkatér-beállítás (EUR alap), az átszámítás TÁROLT árfolyammal (nem élő; a rendszergazda állítja); a pénznem vezérlője a rajzon nincs, ezért a képernyőn sincs — a végpont és a próbája megvan.
- **D-F23** A Gépház a tulajdonosnak (2 csempe) és a rendszergazdának (4 csempe) látszik, a szerkesztőnek nem (az ellenőrzés javaslata). **D-F24** A Tagok sor nem kerül élesbe az R-2 gépezete előtt. **D-F25** A munkatér-váltás a fiókon tárolt választás; a felső sáv először a kezdőlapon és a Gépházon; belépés után a `/kezdolap` a cél. **D-F26** Két méret-token pótolva a rajz kérésére (`--tile-min`, `--fs-metric`).
- **D-F18** Egy saját hiba: az F-3-at a teljes próbasor előtt egyesítettem — percekre hibás főág; azóta a teljes sor az egyesítés feltétele.

## 4. Mi nem készült el, és miért

- ~~F-2-ből két darab~~ — a pénznem vezérlője és a felső sáv a régi lapokon az R-1 v4 rajzból még ma megépült (F-2d, D-F29).
- ~~F-4 képernyője~~, ~~T-23~~, ~~T-26~~ — mind lezárva 09-13-án; **a Design öt rajza (R-2, R-3, R-4, R-5, R-6) mind beépült**, az F-7 is kint van a teszten.
- ~~A kirakás a tesztre~~ — **megoldva 19:41:** Vilmos felvette a Dell kulcsát, a T-7 oka a robot saját naplója volt (D-F27); a főág (F-1…F-6 gépezete és az F-2 képernyői) kint van a teszten, a migrációk 0044…0052 lefutottak. Két kirakási kör piros volt (Dockerfile-lista, hiányzó mappa — T-19, T-20), a tesztoldal 19:37–19:41 közt nem ment. ~~ült** egyik csomagnál sem.
- **F-7** — blokkolt, a megbízás szerint.
- Kisebb, tudatos hiányok: `fajl_feltoltve` esemény a naplóba; `mentes_kimaradt` feladója; `AI_KIKAPCSOLVA` külön mondata a hírfigyelő felületén (T-12, T-13).

## 5. Mi vár Vilmosra

1. ~~A Gigabyte~~ — megoldva (a kulcs fent, a robot megy magától).
2. ~~Az R-5 rajz~~ — megjött és beépült 09-13-án. **A megbízás nyolc csomagja (F-0…F-7) mind kész és kint a teszten.** Ami tőled vár: T-25 (a teszt doboza és a Dell Ollamája), T-27 (kell-e a kimenő üzenetek naplója), az árazás a pilot után.
2b. **Az árfolyamok kezdőértékei** (1 USD = 0,92 EUR · 360 HUF · 4,60 RON) — jók-e, vagy add ide a sajátodat (D-F22, T-16); és kell-e rajz a pénznem vezérlőjéhez (T-14).
3. **F-7:** a modul-lista és az árak (üzleti döntés).
4. A régi nyitott tételek: a nyitólap adatai, román/angol emberi lektor, az AI helye élesben, a Google-betűk.

## 6. Képernyőképek

- F-1: https://saas.mediapartizan.ro/allapot/kepek/f1/ — 18 pár (előtte: a tesztoldal; utána: a helyi építés), asztali és telefon.
- F-2: https://saas.mediapartizan.ro/allapot/kepek/f2/ — a 8 artboard mellett 14 élő kép (a helyi éles építésről, próbafiókkal és egy valódi próbafutás számaival): normál, első használat, néző, telefon, a felső sáv lenyílói, Gépház két nézetben.
- F-3: https://saas.mediapartizan.ro/allapot/kepek/r2/ — a 7 artboard mellett a helyi építés és a teszt képei (Tagok lap, beváltó lap).
- F-6: https://saas.mediapartizan.ro/allapot/kepek/r6/ — a 6 artboard mellett 7 élő és 7 tesztoldali kép (üres blokk, feltöltés, hibaút, csere A/B, néző, telefon).
- F-5: https://saas.mediapartizan.ro/allapot/kepek/r4/ — a 6 megépülő artboard mellett 8 élő és 8 tesztoldali kép (teli és üres lista, adatpolitika, néző, telefon, mind olvasott után).
- F-7: https://saas.mediapartizan.ro/allapot/kepek/r5/ — a 7 artboard mellett 7 élő és 7 tesztoldali kép (Gépház csempék, Kimenő lap, AI-kapcsoló be/ki, hírfigyelő kikapcsolt AI-val, telefon); a rendszergazda-nézet (02., 04.) próbafiókkal nem készül.
- F-4: https://saas.mediapartizan.ro/allapot/kepek/r3/ — a 6 artboard mellett 9 élő és 9 tesztoldali kép (alaphelyzet, egy munkatér, jelszóváltás sikere, kiléptetés válasza, négy hibaút, kilépés megerősítése, telefon).

## 7. Az állapotlap

https://saas.mediapartizan.ro/allapot/ — a nap folyamán minden befogadott darab után frissült (a `nas/allapot-kirak.sh` közvetlenül a NAS-ra teszi,
mert a Gigabyte robotja nem futott). Az utolsó frissítés ideje a lap fejlécében.

---

**Záró mondat (a nap végén pontosítva):** *ennyi készült el, ez nem, ezért* — a gépezet és a térköz-skála elkészült és megmérve; a kirakás és a képernyők nem,
mert a Gigabyte-ra nincs belépés és a rajzok hiányoznak.
