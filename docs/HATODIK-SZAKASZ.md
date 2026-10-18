# 6. szakasz — Hordozhatóság (A-12): ugyanaz a mag két különböző rendszerben · TERV (2026-09-08) — kód csak Vilmos „mehet”-je után

## 0. Mit kell bizonyítani (az átadó 6. sora + 10.3 + A-12)

„Ugyanazokat a csomagokat második hostba bekötni. Üzleti logika másolása nélkül működik; bekötési leírás és verziófrissítési próba.”
A második host adja a **profil-, tárolási-, AI- és ütemezési csatlakozót**; a modul nem tartalmazhat host-specifikus elágazást. A Misszió backendjébe való
valódi integráció későbbi cél, az ügyfél rendszeréhez felhatalmazás nélkül nem nyúlunk — ezért a második host most egy **saját, minimális referencia-host**.

Mi van már: `apps/proba-host` (E-19b) — a mag memóriatárral, rögzített profillal, teszt-AI-val, két beépített forrással; 3 próba. Ez a bekötés bizonyítéka,
de NEM második rendszer: nincs saját tárolása, ütemezése, felülete, és nem fut sehol.

## 1. Mi készül (javaslat)

| # | Lépés | Mit látsz a teszten a végén | Idő | Ágens |
|---|---|---|---|---|
| E-28 | **Referencia-host váza** (`apps/referencia-host`): kis Node-kiszolgáló Next/React NÉLKÜL; saját csatlakozók: tárolás **SQLite-ban** (a Node beépített `node:sqlite`-ja — nincs új függőség, nincs adatbázis-doboz), a profil egy `profil.json`-ból, AI a közös `@km/ai-adapters`-ből (teszt vagy a Dell), ütemezés saját, kis sorral; a hírfigyelő mag változatlanul, a csomagból | a referencia-host parancssorból lefuttat egy figyelést, a találatok SQLite-fájlban | 4 óra | 2 DeepSeek építő (tár + ütemezés / kiszolgáló + profil), 1 tesztelő |
| E-29 | **A közös darabok kiemelése** csomagba, hogy a második host ne másoljon: a letöltő (`apps/web/letoltes` → `packages/letolto`: SSRF, robots.txt, RSS/Atom), és a modul feliratai (`hf.*` HU/RO/EN a csomag mellé, az `apps/web` migrációja ebből) | a webalkalmazás változatlanul működik (152 próba), a referencia-host ugyanazt a letöltőt és feliratokat használja | 3 óra | 1 DeepSeek építő, 1 tesztelő |
| E-30 | **Referencia-host felülete**: 2 kiszolgálói oldal (találatok listája + futtatás; beállítás megtekintése) tokenekből (a `design-system` `tema-alap.json`-jából generált CSS), 3 nyelven a csomag feliratából — NEM a prototípus kártyája újra (az a webalkalmazásé), hanem a minimális „második rendszer” nézete | a referencia-host oldalán a találatok, HU/RO/EN | 3 óra | 1 DeepSeek építő, 1 fordított ellenőr |
| E-31 | **Bekötési leírás + verziófrissítési próba**: `docs/HIRFIGYELO-BEKOTES.md` (mit ad a host: 4 csatlakozó + kontextus, lépésről lépésre a referencia-host példáján); a mag verziója 0.1.0 → **0.2.0** egy szerződés-kompatibilis változással (új, választható mező), mindkét host próbái zöldek frissítés után; a határőr új szabálya: a referencia-host sem importálhat az `apps/web`-ből | `docs/HORDOZHATOSAG.md`: A-12 bizonyítva mindkét hoston | 2 óra | 1 DeepSeek ellenőr |
| E-32 | **Kirakás a NAS-ra** kis dobozként (Node + SQLite-fájl, kb. 100 MB memória; a `nas/docker-compose.yml`-ben a `referencia` szolgáltatás, a nginx alatt `/referencia/`), NAS-szabályok szerint | a referencia-host él a tesztoldalon, futtat, találatokat mutat | 2 óra | — |
| E-33 | **Zárás**: HATODIK-SZAKASZ-ZARAS.md, az állapotlap 6. állomása 100% | | 1 óra | — |

**Összesen kb. 15 óra — előzetes becslés.** Ágensköltség lépésenként mérve (`docs/AGENSEK.md`).

## 2. Döntések — egyesével, akkor, amikor az adott darab épül

1. **D-14 — Mi a második host?** (E-28 előtt) — lent, a beszélgetésben.
2. **D-15 — A közös darabok kiemelése** (E-29 előtt): a letöltő és a feliratok csomagba — vagy a referencia-host a sajátját írja (másolás = pont az, amit el akarunk kerülni).
3. **D-16 — A referencia-host a NAS-ra kerül-e** (E-32 előtt): kis doboz a tesztoldalon (látható bizonyíték, kb. 100 MB) vagy csak a próbák bizonyítják.

## 3. Mit NEM csinálunk ebben a szakaszban

Nem integrálunk valódi külső rendszerbe (Misszió): felhatalmazás és kódfelmérés nélkül nem. Nem építünk „minden jövőbeli rendszert kiszolgáló keretrendszert”. Az
onboarding és a profilszerkesztés nem kerül a referencia-hostba — a host ADJA a profilt (10.3), nem gyűjti.

## 4. Elfogadási feltételek (a végén bizonyítjuk)

| # | Feltétel | Bizonyíték |
|---|---|---|
| I-1 | A-12: azonos csomag két hostban, ügyfélspecifikus kód és másolás nélkül | a referencia-host `package.json`-ja ugyanazokat a csomagokat húzza; a határőr: a mag nem tud egyik hostról sem; `git grep` a másolásra |
| I-2 | A második host a 4 csatlakozót maga adja (profil, tárolás, AI, ütemezés) | `apps/referencia-host/src/csatlakozok/` — SQLite-tár a teljes tár-interfészre, saját ütemező |
| I-3 | Verziófrissítési próba: a mag 0.2.0-ra emelve, mindkét host zöld, a változás a szerződésben dokumentálva | próbák + `docs/HIRFIGYELO-SZERZODES.md` verziósor |
| I-4 | Bekötési leírás, amiből egy harmadik host is elindulna | `docs/HIRFIGYELO-BEKOTES.md` — az ellenőr ágens „új fejlesztőként” végigmegy rajta |
| I-5 | A referencia-host él a tesztoldalon, 3 nyelven, tokenekből | kirakás + képernyőkép (ha D-16 igen) |

---

# E-28 — Referencia-host váza · KÉSZ (2026-09-08)

## Mi készült

`apps/referencia-host` — a hírfigyelő MÁSODIK hostja: sima Node, se Next, se React, se Postgres. A mag (`@km/news-monitor-core`) UGYANAZ a csomag, mint a
webalkalmazásban; a host csak a csatlakozókat adja.

| fájl | mit ad a host |
|---|---|
| `src/csatlakozok/sqlite-tar.ts` | **tárolás**: a teljes `HirfigyeloTar` (21 metódus) egy SQLite-fájlban, a Node beépített `node:sqlite`-jával — nincs új függőség, nincs adatbázis-doboz |
| `src/csatlakozok/utemezo.ts` | **ütemezés**: saját sor (SQLite `sor` tábla) + kör; egyszerre egy tétel, egyszerre egy kör |
| `src/csatlakozok/napi.ts` | a napi esedékesség az aktív beállítás `idozites`-e szerint, időzónahelyesen (`Intl`, `hourCycle: h23`) |
| `src/csatlakozok/ai.ts` | **AI**: teszt-csatlakozó (determinisztikus, hálózat nélkül) vagy a helyi modell a közös `@km/ai-adapters`-en át |
| `src/csatlakozok/letolto.ts` | **letöltő** — E-28-ban RÖGZÍTETT (minta-cikkek); E-29-ben a közös letöltő csomag váltja fel |
| `src/beallitasok.ts` + `profil.json` | **profil**: a host ADJA a profilt (10.3), nem gyűjti; a fájl zod-dal ellenőrzött, hibás fájlnál a host el sem indul |
| `src/kornyezet.ts` | a négy csatlakozó összefűzése egyetlen `Kornyezet`-té — ez az egész bekötés |
| `src/kiszolgalo.ts` | `node:http` kiszolgáló: `/allapot`, `/attekintes`, `/talalatok`, `POST /futtat` (202 + sor), `/sor`, `/sor/{id}` |
| `src/indit.ts` | parancssor: `pnpm figyel` (egy figyelés) és `pnpm kiszolgal` (ütemező + HTTP) |

## Mérés (2026-09-08, a felhő-munkatérben)

- `pnpm figyel` üres adatbázison: kezdő beállítás mentve (verzió 1) → forrás `hasznalhato` → **futás `kesz`, 3 új esemény, 4 új találat**; a fájlban:
  `verzio 1, forras 1, futas 1, kivonat 4, talalat 4, esemeny 3`, az első találat `kesz` / `fontos`, összefoglalóval.
- Ugyanaz mégegyszer: **0 új esemény, 0 új találat** — a deduplikáció (A-10) a második hostban is működik.
- `pnpm kiszolgal`: `/allapot` 200, `POST /futtat` **202** + sortétel, a háttérben lefutott a kézi ÉS a napi tétel is (`kesz`), `/talalatok` 4 találat / 3 kártya,
  ismeretlen útvonal 404.
- Próbák: **26 zöld** (SQLite-tár 8, sor/ütemező/kiszolgáló 12, végigfutás 6). A magé **158 zöld**, a webalkalmazásé **152 zöld** — változatlanul.
- `pnpm tipus`, `pnpm hatar` (220 modul, 0 sértés), `pnpm tokenor` (169 fájl) zöld.

## Amit a fordított ellenőrzés hozott (VASSZABÁLY)

Két VALÓDI hiba, javítva: (1) ha a folyamat futás közben állt le, a „fut” állapotú sortétel örökre beragadt volna — most újranyitáskor visszakerül a sorba;
(2) a hibára futott NAPI futást az ütemező körönként (5 mp) újraindította volna egész nap — most a hibás napi futás is „ma megvolt”-nak számít.
Öt kisebb javítás: `MINTA_LEJART` → 409 (eddig 500), a 64 kB-nál nagyobb kérés-törzsnél a kapcsolat zárása, rossz százalék-kódolású útvonalnál 400 az 500 helyett,
beszédesebb `NINCS_ILYEN_SOR`, és a napi számítás éjfélkori kétértelműségének megszüntetése. Az első ellenőr-ágens futása használhatatlan volt (ismétlésbe futott) —
a tanulság a `docs/AGENSEK.md`-ben.

## Amit E-28 SZÁNDÉKOSAN nem tartalmaz

- **Felület**: a referencia-hostnak most csak JSON-válaszai vannak; a 2 oldal E-30.
- **Valódi letöltő**: rögzített minta-cikkek — a közös letöltő kiemelése D-15/E-29 döntése.
- **Promptok**: az `ollama` mód a hosttól kapja a rendszerutasításokat (`prompt_konyvtar`); E-28-ban nincs ilyen könyvtár, tehát a valódi AI még nem hívható innen.
- **NAS**: a tesztoldal érintetlen (a kirakás E-32, D-16 után).

## Nyitott, a következő lépésekhez

- A memóriabeli tár (`memoriaTar`) a SAJÁT listáját adja vissza, nem másolatot: a hívó véletlenül átírhatná a tárolt adatot. Az SQLite-tár (és a Postgres-tár)
  másolatot ad. Nem hiba a mai használatban (csak próbákban szerepel), de a bekötési leírásba (E-31) bele kell írni, hogy a tár MÁSOLATOT adjon vissza.
- A sor egy tétele nincs időkorláttal: ha egy `futtat` sosem tér vissza, a kör beragad. Az AI-hívásnak van saját korlátja (180 mp), így ma nem fordulhat elő —
  az ütemező szintű időkorlát E-30/E-31 kérdése.

---

# E-29 — A közös darabok kiemelése · KÉSZ (2026-09-08)

## Mi készült (D-15 döntése: kiemelés, nem másolás)

| csomag | mi került bele | ki használja |
|---|---|---|
| **`@km/letolto`** | a teljes letöltő az `apps/web/letoltes`-ből: SSRF-védelem (magáncímek, felhő-metaadat, IPv6, DNS-visszakötés), robots.txt, RSS/Atom-elemzés, weboldal-szövegkinyerés, méret- és átirányítás-korlát | a webalkalmazás onboardingja és hírfigyelője, ÉS a referencia-host |
| **`@km/news-monitor-feliratok`** | a modul 189 felirata három nyelven, JSON-adatfájlban | a migráció ebből KÉSZÜL (`tools/feliratok/general.mjs` → 0032); a referencia-host közvetlenül olvassa (nincs adatbázisa) |

A kód a mozgatáskor egyetlen sorral változott: az `import "server-only"` kikerült a csomagból (host-semlegesnek kell lennie). Az ŐR nem veszett el:
a webalkalmazás két bejárata (`apps/web/hirfigyelo/letolto.ts`, `apps/web/onboarding/letolto.ts`) most maga hozza a `server-only`-t, tehát a letöltő
továbbra sem kerülhet böngészőbe.

## Új határőr-szabályok (gépezet, nem papír) — ELLENŐRIZVE

Mindhármat szándékosan elrontva próbáltam ki:
- `a-masodik-host-nem-nyul-a-webalkalmazasba`: a referencia-host `apps/web`-ből importálva → **3 hiba** (a szabály fog).
- `a-kozos-letolto-host-semleges`: `server-only` a csomagba téve → **hiba** (a szabály fog).
- `a-modul-feliratai-host-semlegesek`: a felirat-csomag nem függhet keretrendszertől, adatbázistól, sem a magtól.

## Mérés

- **A referencia-host a VALÓDI, közös letöltővel** (felhő-munkatér, `letolto: "valodi"`, forrás `https://marosvasarhelyiek.ro/feed`):
  futás kész, **10 valódi cikk** az SQLite-fájlban, értékeléssel — pl. „Újraindultak az iskolajáratok Marosvásárhelyen” (fontos),
  „Nyárias marad a szeptember eleje Maros megyében” (háttér). Ez A-12 bizonyítéka: ugyanaz a letöltő, ugyanaz a mag, másik rendszer.
- Próbák: `@km/letolto` **14 új** (címnormalizálás, SSRF — köztük DNS-visszakötés —, RSS 2.0, Atom, HTML, robots-tiltás, hálózati hiba, átirányítás- és méretkorlát;
  mind hálózat nélkül), `@km/news-monitor-feliratok` **5 új**, a webalkalmazás **153** (152 + a felirat-szinkron őre), a mag 158, a referencia-host 26, a próba-host 3.
- `pnpm tipus`, `pnpm hatar` (226 modul, 0 sértés), `pnpm tokenor` (172 fájl) zöld.
- **A tesztoldalon élőben**: migráció 0032 lefutott (189 kulcs × 3 nyelv az adatbázisban: „Hírfigyelő / Monitorizare presă / Press Monitor”);
  új RSS-forrás felvétele és ellenőrzése a közös letöltővel `rss` / használható; belső cím (`127.0.0.1`) felvételekor `nem_tamogatott` / `nem_nyilvanos`.

## Amit a fordított ellenőrzés hozott

A `server-only` elvesztése volt a legfontosabb megállapítás — javítva (lásd fent). Két kisebb javítás a generátorban: sortörést tartalmazó feliratot nem enged
(a migrációban olvashatatlan lenne), és **nem ír felül meglévő migrációt** (kipróbálva: hibával leáll). A generátor korlátja kimondva: beszúr és felülír, de nem TÖRÖL —
ha egy kulcs kikerül az adatfájlból, a törlő sort kézzel kell megírni; a szinkron-próba jelzi, ha ilyen kulcs maradt az adatbázisban.

## Nyitott

- A **marosvásárhelyiek.ro hírcsatornája a NAS IP-címéről nem tölthető le**: a webhely botvédelme JavaScript-ellenőrző oldalt ad vissza. A felhőből ugyanez a forrás
  hibátlanul működik (10 cikk). Nem a mi hibánk, de a tesztoldalon magyar forrásokkal dolgozni csak a webhely fehérlistája (vagy más kimenő útvonal) után lehet.
- A felirat-csomag `readFileSync`-kel olvassa az adatfájlt az `import.meta.url`-ből számolt útvonalról. Ez a mai két hostban működik (egyik sem csomagolja be a csomagot),
  de ha egyszer bundle-elt kimenet készül, az útvonal eltörhet — a bekötési leírásba (E-31) bele kell írni.

---

# E-29b — Az élő mérés talált egy VALÓDI hibát: az üres cikkek · JAVÍTVA (2026-09-08)

## Mit mértünk

Az E-29 kirakása után a tesztoldalon valódi figyelést indítottunk egy nagy hírcsatornán (BBC). A futás **27 percig tartott, 496 AI-összehasonlítással 32 cikkre**,
és a végén 32 találat lett — **üres címmel és üres szöveggel** (az adatbázisban ellenőrizve: `cim=''`, `length(szoveg)=0`, mind ugyanaz az ujjlenyomat: `cbf29ce484222325`,
azaz az ÜRES szöveg FNV-1a értéke).

## Az ok (E-20 óta bent volt, csak nem látszott)

A hírcsatorna-elemző a mezőkből így vágta ki a HTML-t: `szoveg.replace(/<[^>]*>/g, " ")`. A `<![CDATA[ … ]]>` burok NYITÁSA (`<![CDATA[`) is illeszkedik erre a mintára,
és mivel a burkon belül nincs `>` a lezárásig, a minta a TELJES tartalmat kivágta. Ahol a hírcsatorna CDATA-t használ (a BBC igen, és a WordPress-oldalak
`content:encoded` mezője is), ott a cím és a szöveg is eltűnt.

Ebből következett a lassúság: üres szöveg → minden cikk ujjlenyomata `fnv1a("")` → `gyanusPar` MINDEN párra igazat ad → mind a 496 párt megkérdeztük az AI-tól.

## A javítás

| hol | mi |
|---|---|
| `packages/letolto` | új `xmlMezoSzoveg`: a CDATA-burkot ELŐBB feloldja, csak utána irt címkét; a burkon belüli HTML is eltűnik, a szöveg marad; a link és a cím is ezen megy át; cím nélküli tétel nem lesz cikk (a cím tartaléka `dc:title` / `media:title`) |
| `packages/news-monitor-core` | **`HF_PAR_KORLAT = 60`**: futásonként legfeljebb ennyi AI-összehasonlítás; a korlát feletti párok külön eseményben maradnak, a futás `reszleges`. **`hatarido`**: a `figyelesFuttat` választható határideje — a forrásletöltés, a párkérdések és az értékelés előtt is nézzük; a futás magától befejeződik és MENTI, amit elért. Cím nélküli cikkből nem lesz kivonat. |
| `apps/web/hirfigyelo/futtato.ts` | a háttérfutás 14 perces határidőt kap (a sor 15 perces lejárata előtt egy perccel) — eddig a tétel lejárt, de a munka gazdátlanul futott tovább (mérve: még 12 percig) |
| `apps/referencia-host` | ugyanaz a határidő a saját sorában |

## Mérés a javítás UTÁN (ugyanaz a hírcsatorna, ugyanaz a tesztoldal)

| | előtte | utána |
|---|---|---|
| cikk címmel | 0 / 32 | **32 / 32** |
| átlagos szöveghossz | 0 karakter | **112 karakter** |
| `hf_ugyanaz_az_esemeny` AI-hívás | **496** | **0** |
| relevancia-hívás | 32 | 32 (5,6 mp/cikk) |
| a futás hossza | 27 perc, lejárt | **~3 perc, `kesz`** |
| értékelés | — | 32/32 kész (28 háttér, 2 érdekes, 2 fontos) |

A marosvásárhelyiek.ro cikkeinek átlagos szöveghossza is **507 → 2174 karakterre** nőtt (a `content:encoded` szintén CDATA-ban van), tehát az AI eddig ott is
a cikkek töredékét látta.

## Próbák — visszavonás-próbával ellenőrizve

`@km/letolto`: 5 új CDATA-próba (19 összesen). `@km/news-monitor-core`: 6 új fék-próba (164 összesen).
**Ellenőriztem, hogy a próbák tényleg fognak**: a CDATA-javítást visszavonva 4 próba elbukik, a pár-korlátot kivéve 3 próba elbukik; visszaállítás után mind zöld.
(A fordított ellenőr azt állította, hogy az ujjlenyomat-próba a javítás nélkül is átmenne — kipróbáltam: nem megy át.)

## A fordított ellenőrzésből beépítve

Cím-tartalék (`dc:title`, `media:title`), mielőtt eldobnánk egy tételt; és a határidő ellenőrzése a forrásletöltés ciklusában is.

---

# E-29c — Az AI a FELÜLET nyelvén válaszol · KÉSZ (2026-09-08)

Vilmos döntése: az AI a felület nyelvén írjon (azén, aki a figyelést indította; a napi futásnál a tulajdonoséban).

## Mit kellett megcsinálni

1. **A nyelv-kapcsoló beépítése**: az öt hírfigyelő-prompt (`hf_relevancia`, `hf_osszkep`, `hf_szabaly_javaslat`, `hf_tartalomotlet`, `hf_ugyanaz_az_esemeny`)
   eddig NEM tartalmazott `{{nyelv}}` helyet — magyarul íródtak, ezért a válasz is magyar volt. Mindegyik kapott egy sort a szabályok közé.
   A `hf_beallitas_javaslat` SZÁNDÉKOSAN kimaradt: annak válasza nem próza, hanem beállítás-szerkezet (témanevek, kizárások), amit nem fordítunk.
2. **A nyelv eljuttatása a háttérfutásig**: a nyelvváltás eddig CSAK sütibe ment, a háttérfutásban viszont nincs süti. Migráció 0033: `fiok.nyelv`;
   a nyelvváltó útvonal belépett fióknál a fiókra is menti (a felület nem változik). A sorba tett tétel viszi a nyelvet; a futtató a tételből veszi,
   hiányában a szervezet tulajdonosának fiókjából, végül magyar.
3. **A fordított ellenőrzésből**: aki még nem VÁLTOTT nyelvet (a fiókján nincs mentett nyelv), annál a KÉRÉS nyelve (süti, majd böngésző) dönt —
   így egy román böngészőjű, román felületű új felhasználó sem kap magyar választ (`apps/web/nyelv/keresbol.ts`).

## A mérés, ami irányt adott

Az első kirakás után a román fiók MÉGIS magyar összefoglalókat kapott, pedig a sortételben `nyelv: "ro"` állt, és a teljes lánc (útvonal → sor → futtató →
AI-hívó → prompt) helyesnek bizonyult a lefordított kódban is. Az angol fiók viszont HELYESEN angolul kapta.

Közvetlen mérés a Dell modelljén, ugyanazzal a cikkel és magyar témabeállítással:

| változat | eredmény |
|---|---|
| a magyar „…MINDIG román nyelven írd” sor a szabályok között | **magyar** válasz |
| ugyanez a sor a prompt ELEJÉN | **magyar** válasz |
| ugyanez a sor a prompt VÉGÉN | **magyar** válasz |
| a mondat MAGÁN A CÉLNYELVEN, elöl és hátul (*„Scrie TOATE câmpurile text… în limba ROMÂNĂ.”*) | **román** válasz ✅ |

Tanulság, ami a bekötési leírásba is bekerül: **a nyelvi utasítást a célnyelven kell megfogalmazni** — a magyar környezet különben magával viszi a modellt.
Ezért a `prompt()` a nyelvfüggő promptot (amelyben van `{{nyelv}}`) a célnyelvi mondattal keretezi elöl és hátul.

## Élő bizonyíték a tesztoldalon

- Román felületű fiók + ANGOL cikkek (BBC) → az összefoglalók **románul**: „Articolul relatează că Harry și Meghan au fost surprinși…”, „Prințul George a început prima zi…”.
- Angol felületű fiók ugyanazokkal a cikkekkel → **angolul**.
- Nyelvet nem váltott fiók román sütivel → a sortétel `nyelv: "ro"`.

## Próbák

`apps/web/probak/nyelv-ai.proba.ts`: 10 élő próba (nyelvváltás mentése, hibás érték, a tétel nyelve kézi és értékelés-újra futásnál, nyelv nélküli fiók,
a prompt keretezése, a süti-tartalék). A webalkalmazás összesen **163 zöld**. Visszavonás-próbával ellenőrizve: a keretezés kivételekor 2 próba elbukik.

## Ami tudatosan kimaradt

A `hf_beallitas_javaslat` nem kap nyelvi keretet (lásd fent). A promptok továbbra is EGY nyelven (magyarul) íródnak — nem három fájl, hanem egy fájl + célnyelvi keret.

---

# E-30 — A referencia-host felülete · KÉSZ (2026-09-08)

## Mi készült

Két, KISZOLGÁLÓN összeállított HTML-oldal a második hostban — nincs React, nincs Next, nincs kliensoldali JavaScript, nincs új npm-függőség:

| útvonal | mit ad |
|---|---|
| `GET /` | a találatok listája: állapotsor (utolsó futás ideje / „fut a háttérben”), az új találatok száma, „Futtatás most” gomb, majd a kártyák (fontosság-jelvény, „Új” jelvény, cím, összefoglaló, „Miért fontos neked?”, forrás(ok)) |
| `GET /beallitas` | CSAK megtekintés: mit figyelünk (témák, kizárások), honnan (források + állapotuk), mikor (napi időpont vagy kézi) |
| `POST /inditas` | a gomb: sorba teszi a figyelést, majd 303-mal visszaküld a listára (böngészőnek, nem JSON) |

A JSON-válaszok útvonalai (`/allapot`, `/attekintes`, `/talalatok`, `/futtat`, `/sor`) VÁLTOZATLANOK.

**Három nyelven**, a KÖZÖS felirat-csomagból (`@km/news-monitor-feliratok`) — a fejléc, a menü, a jelvények, az állapotsor mind onnan jön; a lapon egyetlen
beégetett felületi szöveg sincs. Nyelvválasztás: `?nyelv=` → nyelv-süti → böngésző nyelve → magyar; a választás sütibe kerül, így a lapváltás megtartja.

**A színek, betűk, méretek a KÖZÖS tokenekből** (`@km/design-system` `cssValtozok()`): ugyanaz a téma, mint a nagy alkalmazásé, egyetlen `<style>` blokkban.
A tokenőr a referencia-host felületét is méri (178 fájl) — beégetett szín/betű/méret nincs benne.

**Biztonság**: minden megjelenített adat (cím, összefoglaló, forráscím, témanév) `htmlBiztos`-on megy át — a hírek szövege idegen forrás, HTML-t tartalmazhat.
A lap `content-security-policy` fejlécet küld (`default-src 'none'`), és nincs benne script.

## Mérés — élő futás a saját hírforrásoddal

`KM_REF_PROFIL=profil.demo.json pnpm figyel` a `https://marosvasarhelyiek.ro/feed` forrással: **10 cikk, 9 kártya**; a lap mindhárom nyelven kiszolgálva
(magyar: „Hírfigyelő / Áttekintés / Fontos / Új”, román: „Monitorizare presă / Prezentare / Important / Nou”, angol: „Press Monitor / Overview / Important / New”).
A „Futtatás most” gomb: `POST /inditas` → 303 → a lista, és a gomb utána letiltva („Próbafutás folyamatban…”).
Képernyőképek: `ref-talalatok-hu.png`, `ref-talalatok-ro.png`, `ref-beallitas-hu.png`.

## Amit a fordított ellenőrzés hozott

Egy valódi (apró) találat: a `.verzio` CSS-osztály kétszer szerepelt — javítva. **A két „súlyos” escape-vádját ellenőriztem: tévesek** — a forráscímek és a
`hf.srcProblem` szövege is `htmlBiztos`-on megy át. A „két párhuzamos futás indítható kézzel” vád szintén téves: a `sorbaTesz` a kiszolgálón `FUT_MAR`-t ad,
a gomb letiltása csak a felület udvariassága.

## Nyitott — az E-31-hez

- **A referencia-host AI-ja még a teszt-csatlakozó**: az összefoglaló a cikk szövegének eleje, az indoklás rögzített magyar mondat — ezért látszik a román
  lapon is magyarul a kártya SZÖVEGE (a felület maga helyesen román). A valódi AI-hoz a hírfigyelő PROMPTJAIT is közössé kell tenni (ugyanúgy, ahogy E-29-ben
  a feliratokat), mert ma az `apps/web/prompts` alatt élnek, és a második host nem nyúlhat oda. **Ez az E-31 első feladata.**
- A `profil.json` a determinisztikus alapértelmezés (a próbák ezt használják); a bemutatóhoz `profil.demo.json` van, a `KM_REF_PROFIL` környezeti változóval.

---

# E-31 — Közös promptcsomag + verziófrissítési próba + bekötési leírás · KÉSZ (2026-09-08)

## Mi készült

**1. `packages/news-monitor-promptok` — a hírfigyelő AI-utasításai közös csomagban.** Az E-30 nyitott pontja: a promptok az
`apps/web/prompts` alatt éltek, a második host pedig nem nyúlhat a webalkalmazásba (határőr-szabály). A 6 rendszerutasítás
(`hf_relevancia`, `hf_ugyanaz_az_esemeny`, `hf_osszkep`, `hf_szabaly_javaslat`, `hf_tartalomotlet`, `hf_beallitas_javaslat`)
átkerült a csomagba; **mindkét host UGYANAZT a szöveget küldi a modellnek**.

A csomag `prompt(feladat, nyelv)` függvénye tartalmazza az E-29c-ben MÉRT nyelvi keretet is: a válasz nyelvét kérő mondat
a prompt elejére ÉS a végére kerül (a modell a magyar nyelvű utasítást figyelmen kívül hagyta, a célnyelvűt megfogadta).

**2. A mag 0.1.0 → 0.2.0** — egy szerződés-kompatibilis változással: `Kartya.esemeny_ideje` (a kártya forrásai közül a
legkorábbi megjelenés, `nullable().optional()`). Ez az I-3 átvételi feltétel gyakorlati próbája: **a 0.1.0-ra írt host kódja
változatlanul fordul és fut**. A szerződés verziótáblája (`docs/HIRFIGYELO-SZERZODES.md` 5.) rögzíti, mi mehet kisverzióban
és mi kér főverziót.

**3. `docs/HIRFIGYELO-BEKOTES.md` (285 sor)** — a bekötési leírás: mit ad a host (4 csatlakozó + kontextus), a teljes
21 metódusos tár-interfész, a letöltő és a duplikátum-szűrés magyarázata, az AI-csatlakozó, az ütemezés, az első használat
hívási sorrendje, a jogosultság és a nyelv, a feliratok, a verziókompatibilitási szabályok és egy ellenőrzőlista.

**4. Két új határőr-szabály**: a modul feliratai és promptjai host-semlegesek (nem importálhatnak host-kódot).

## Mérés

| mit | eredmény |
| --- | --- |
| próbák | promptok 5, letöltő 19, feliratok 5, mag 166, referencia-host 26, webalkalmazás 161 — **mind zöld** |
| `pnpm tipus` / `pnpm hatar` / `pnpm tokenor` | zöld / 237 modul, 0 sértés / 180 fájl, 0 beégetett érték |
| 0.2.0 frissítés után mindkét host | zöld, kódváltoztatás nélkül (I-3) |

## Amit a kirakás talált (két Dockerfile-hiba)

1. Az új csomagok `package.json`-jai hiányoztak a függőségi rétegből → az összerakás elszállt.
2. A promptok és a feliratok **adatfájlok**: a Next önálló csomagja nem látja őket (futásidőben `import.meta.url`-ből
   olvassuk), ezért a futtató dobozból kimaradtak. Tünet: néma `AI_NEM_ELERHETO` (ENOENT a prompt-fájlra). Javítás: két
   `COPY` sor a Dockerfile-ban. **Ez a csapda bekerült a bekötési leírásba** — egy harmadik host ugyanebbe lépne bele.

---

# E-32 — A referencia-host a tesztoldalon · KÉSZ (2026-09-08)

## Mi készült

**Saját, kicsi doboz a NAS-on** (`referencia` szolgáltatás a `nas/docker-compose.yml`-ben): Node + `tsx`, az adat egy
SQLite-fájl a `referencia-adat` köteten. **Nincs Next, nincs Postgres, nincs Redis.** Az nginx a `/referencia/` alatt adja;
a fő alkalmazás (`/`) érintetlen.

**Útvonal-előtag (`alap_ut`) a hostban** — hogy egy megosztott kiszolgáló mögött is elférjen:

- `utvonalLevag()` a kiszolgálóban: `/referencia/beallitas` → `/beallitas`; ami nem az előtag alá esik, arra 404 (a gyökér
  nem szivárog ki)
- a lap hivatkozásai és az űrlap célja az előtaggal indulnak; a futtatás utáni 303 is oda tér vissza
- előtag nélkül minden változatlan (az alapértelmezés nem tört el) — **6 új próba** fedi

**`profil.nas.json`**: valódi letöltő, `marosvasarhelyiek.ro/feed`, a Dell Ollamája (`ai: "ollama"`), 30 másodperces
ütemezőkör. A determinisztikus `profil.json` (a próbáké) érintetlen; a `KM_REF_PROFIL` választ közöttük.

**`nas/jelszo-kerdes.py`**: a NAS-jelszót kérdező szkript eddig a `/tmp`-ben lakott és egy gép-újraindulással elveszett —
most a tárhelyben van. Titok nincs benne, csak a vault útvonala (ugyanaz, ami a `nas-parancs.sh`-ban eddig is szerepelt).

## Mérés — élőben, kívülről (https://saas.mediapartizan.ro/referencia/)

| mit | eredmény |
| --- | --- |
| memória | **132 MB** / 256 MB korlát (db 41, app 57, web 9, ai-híd 51) |
| doboz-kép mérete | 553 MB (a munkatér függőségei; a memória a szűk keresztmetszet, nem a lemez) |
| egy valódi figyelés | **78 másodperc** (17:57:03 → 17:58:21), 10 találat, **9 kártya** — egy esemény két cikkből összevonva |
| útvonalak kívülről | `/referencia` 301 → `/referencia/` 200, `/referencia/allapot` 200, `/referencia/beallitas` 200, `/` (fő alkalmazás) 200 |
| felület | HU és RO a közös felirat-csomagból, az előtaggal helyes hivatkozásokkal |
| NAS a kirakás után | 10,8 GB felszabadítható, terhelés 2,2 |

A kártyák valódi tartalommal: cím, összefoglaló, „Miért fontos neked?” indoklás, esemény ideje (a 0.2.0 új mezője),
forrásszám. **Ugyanaz a mag, ugyanaz a prompt, ugyanaz az AI — másik rendszerben.**
