# Kirakás a tesztre — hogyan jut a kód a tárhelyről a tesztoldalra

Készült: 2026-09-06, az E-1 lépésben. Ez a lánc **mérve működik**, nem terv.

## A lánc

1. **Kód** a felhőben készül és ott ellenőrződik: `pnpm ellenoriz` = határőr + típusellenőrzés + összerakás.
2. **Átvitel Vilmos gépére**: a Cowork híd a `SaaS\Claude outputs\` mappába teszi a forrást (tömörítve).
3. **Feltöltés a tárhelyre**: a gép Linux-munkakörnyezetében a `/tmp/repo` másolatba kerül, onnan
   `git push` a `vault/github-kulcs` kulccsal. (A felhő a privát tárhelyet nem éri el — ez adottság.)
4. **Kirakás a NAS-ra**: `bash nas/kirak.sh` — méri a NAS-t (szabály: 3 GB alatt / 20 fölött nem indul),
   lehúzza a tárhely friss állapotát, egyetlen tömörített fájlban átküldi a NAS-ra
   (`/volume2/docker/aitmetica-saas/forras/`), és a **háttérben** elindítja az összerakást.
   A NAS-on nincs git, ezért megy fájlként.
5. `bash nas/kirak.sh --allapot` — mutatja, hol tart az összerakás (`KESZ:0` = sikerült).
6. `bash nas/kirak.sh --indit` — a régi web doboz leáll és `-regi` néven megmarad (nem törlődik),
   az új két doboz elindul: `aitmetica-saas-app` (Next.js, belül 3000) és `aitmetica-saas-web`
   (nginx, 127.0.0.1:8400 → a DSM fordított proxy innen adja a saas.mediapartizan.ro-t).

## Adatbázis (E-2-től)

- `aitmetica-saas-db` doboz: PostgreSQL 18, csak belülről érhető el, adatai `adatok/postgres/` alatt.
- Két szerep: `km_tulaj` (a táblák gazdája, csak migrációhoz) és `km_app` (az alkalmazásé: nem tulajdonos,
  nem kerülheti meg a sorszintű védelmet). Jelszavaik a NAS `.env` fájljában és a `vault/adatbazis-belepes.txt`-ben.
- A táblák leírása: `apps/web/adatbazis/sema.ts` (Drizzle). Változtatás után `pnpm --filter @km/web sema`
  új SQL-fájlt tesz a `migraciok/` mappába; kézi lépés `drizzle-kit generate --custom`-mal.
- A migrációkat a `kirak.sh --indit` futtatja a db dobozban (`nas/adatbazis/migral.sh`): sorban, ami már
  lefutott, kimarad (`_migracio` tábla).
- Sorszintű védelem: az alkalmazás minden ügyféladat-műveletet `szervezetKent(...)`-en át végez
  (tranzakció + `set_config('app.szervezet_id')`). Beállítás nélkül a `km_app` semmit nem lát.
  Ellenőrzés: `/api/belso/elvalasztas` → `"eredmeny": "RENDBEN"`.

## Ami a NAS-on van

| Mi | Hol |
|---|---|
| a mappa | `/volume2/docker/aitmetica-saas/` |
| forrás (a tárhely másolata) | `forras/` — az előző `_torolni/forras-<idő>/` alá kerül, Vilmos törli |
| dobozleírás, nginx beállítás | `docker-compose.yml`, `nginx.conf` (az előző: `nginx.conf.elozo`) |
| az állapotoldal és a robots | `public/allapot/`, `public/robots.txt` — az nginx maga adja, az app újraépítése alatt is él |
| összerakás naplója | `build.log` |
| adatbázis jelszavai | `.env` (nincs a tárhelyen) |
| adatbázis adatai | `adatok/postgres/` |

## Ismert adottságok

- A NAS-on a `docker` csak rendszergazdaként megy: a `nas-parancs.sh` `NAS_SUDO=1` kapcsolója intézi,
  a jelszó a vaultból a csatornán megy, sehol nem íródik ki.
- Nincs docker-szintű állapotellenőrzés a dobozokon — szándékosan (NAS-szabalyok.md, szivárgás).
- A `dependency-cruiser` a TypeScript 7-et még nem érti, ezért a határőr (`tools/hatar`) saját
  TypeScript 6-ot kap; a többi csomag 7-tel megy. Ez az ADR-001 ismert kockázatának első esete — a
  megoldás egy csomagban él, nem érinti a terméket.

## Fizetős ágensek (E-3-tól)

- Futtató: `tools/agens/agens.py` — **Vilmos gépének Linux-munkakörnyezetében fut** (a kulcsok a vaultban
  maradnak, a felhőbe nem kerülnek). Egy hívás = egy feladatfájl (`tools/agens/feladatok/`) + mellékletek;
  az ágens `=== FÁJL: … ===` blokkokban ad vissza fájlokat, a script kiírja őket, és a tokenszámot,
  becsült árat a `docs/agens-naplo.jsonl`-be teszi. A kimenet tömörítve jön a felhőbe, ahol a határőr,
  a típusellenőrzés és a próbák futnak — az ágens munkája addig „javaslat", amíg ezek zöldek nem lesznek.
- Mérve 2026-09-06: DeepSeek (`deepseek-chat`) 7–10 mp egy 2–5 fájlos feladatra; Kimi `kimi-k2.6`
  (gondolkodás kikapcsolva) ~60 mp. A `kimi-k2.7-code` gondolkodó modell nem használható erre: a
  gondolkodás nem kapcsolható ki és a kimeneti keretet felemészti.
- A gépen egy parancs legfeljebb 3 percig élhet és a háttérbe tett folyamatot a rendszer a parancs végén
  leállítja — ezért a feladatokat 1–3 perc alatt megválaszolható darabokra kell vágni.

## Megjelenés és nyelvek (E-4-től)

- A tokenkészlet az adatbázis `tema` táblájából jön (aktív sor, verziózva; a `definicio` a `km-theme/2` szerkezet,
  a `@km/design-system` sémája ellenőrzi). A layout a `:root` változóit ebből írja a lap fejébe; ha nincs aktív
  téma vagy hibás, a csomagban lévő `tema-alap.json` a tartalék (naplózva). Származtatott tokenek: `szarmaztat()`.
- A feliratok a `felirat` táblából (kulcs + nyelv), 60 mp-es gyorsítótárral; hiányzó fordításnál a magyar jön.
  A forrás a tárhelyen: `apps/web/feliratok/{hu,ro,en}.json` → a `0005` migráció tölti be (nem ír felül meglévőt).
  Új szöveg: a JSON-okba ÉS egy új kézi migrációba (amíg nincs adminfelület).
- A nyelv: `km_nyelv` süti (1 év), különben a böngésző nyelve, különben magyar. Váltás: `POST /api/nyelv`, a
  fejléc nyelvválasztója hívja; a kiszolgálói rész frissül, a kitöltött mezők megmaradnak (mérve).
- **Tokenőr** (`pnpm tokenor`, a `pnpm ellenoriz` része): az `apps/` és `packages/` alatti CSS/TSX fájlokban
  nem lehet beégetett szín (hex/rgb/hsl), `font-family`, `font-size`, `font-weight`, `border-radius` — csak
  `var(--…)`. Indokolt kivétel egy sorban: `/* tokenőr: ok — miért */`. A design-system csomag kivétel (ott
  születnek a tokenek).

## Onboarding-piszkozat (E-6-tól)

- `onboarding_piszkozat` tábla: egy sor szervezetenként, a teljes piszkozat jsonb-ben (`OnboardingPiszkozat`
  a contracts csomagban, verziószámmal); sorszintű védelem (`szervezetKent`). Jóváhagyáskor (E-9) átadódik a
  hostnak és törlődik (R-06).
- `GET/PUT /api/onboarding/piszkozat` — a bejelentkezett ember első szervezetének piszkozata. A felület minden
  változás után ~800 ms-mal ment; a fejlécben „Piszkozat mentve / Mentés… / Nem sikerült menteni —
  újrapróbáljuk"; sikertelen mentés után a „Mentés és kilépés" nem lép ki (A-04).
- `POST /api/onboarding/osszefoglalo` — E-6-ban **teszt-csatlakozó** (`onboarding/osszefoglalo.ts`): minta-
  szöveget ad 700 ms után; az E-7 ide teszi a valódi AI-hívást. Az eredmény a profil-előnézet TEVÉKENYSÉG
  sorába kerül és a piszkozatba mentődik (`bemutatkozas.osszefoglalo`).
- A „+ Dokumentum csatolása" és az arculati források E-6-ban a piszkozatba a fájl NEVÉT / a jelölést mentik;
  maga a fájl a tárolási pontnál (ALAPTERV 6., MinIO) kerül fel.
- Új feliratok: `apps/web/feliratok/*.json` + kézi migráció (`0008`): a régi kulcsokat nem írja felül.

## AI-réteg (E-7-től)

- `@km/ai-adapters`: feladat-szerződés (`osszefoglalo`), szolgáltató-leírólap (mit tud, milyen nyelven, mennyibe
  kerül, hol fut), `hiv()` időkorláttal, költségszámítás. Csatlakozók: `teszt` (AI nélkül, minta-szöveg) és
  `anthropic` (D-08). A hívó feladatot kér, nem modellt. A válasz javaslat, a felhasználó hagyja jóvá.
- Beállítás a NAS `.env`-ben: `AI_SZOLGALTATO=teszt|anthropic|claude-elofizetes|codex-elofizetes|openai` (ugyanezek `HF_AI_SZOLGALTATO`-nak, plusz `helyi-ollama`) (D-10: `docs/D-10-ELOFIZETES.md`; belépők: `kirak.sh --titkok`), `AI_MODELL` (alap `claude-sonnet-5`),
  `AI_HAVI_KERET_USD` (alap 5), `ANTHROPIC_API_KEY` (a `vault/anthropic-key.txt`-ből, Vilmos teszi oda), `OPENAI_API_KEY` (a `vault/openai-key.txt`-ből a `kirak.sh --titkok` írja a NAS `.env`-jébe — D-F37), `OPENAI_MODELL` (alap `gpt-5-mini`).
- Mérés: minden hívás az `ai_hivas` táblába (szervezetnél, védett) és az `ai_koltseg_honap` havi összesítőbe;
  a keret elérésekor a hívás el sem indul (`AI_KERET_KIMERULT`).
- Prompt: `apps/web/prompts/osszefoglalo.hu.md` (verziózva a tárhelyen; a forrásszöveg ADAT, nem utasítás).
- Weboldal-letöltő (`onboarding/letolto.ts`): csak nyilvános cím (DNS-feloldás, belső/loopback/link-local/Tailscale
  100.64/10 tiltva, átirányítás után újra ellenőrizve), 10 s, 1 MB, csak HTML/szöveg, 12 000 karakter.
- Hibakódok a felületnek: `ERVENYTELEN_ADAT` (+`mezok.weboldal`: FORRAS_ROSSZ_CIM / FORRAS_TILTOTT_CIM),
  `FORRAS_NEM_ELERHETO` (502), `AI_NEM_ELERHETO` (503), `AI_KERET_KIMERULT` (429).

## Onboarding 2. lépés — Kommunikáció (E-8-tól)

- A képernyő a v6 prototípus OB-02 lapja, rajz-kör nélkül (a v6 a mérce): `apps/web/app/onboarding/2/`.
  A közös váz (fejléc, lépésjelző, kártya + profil-előnézet, piszkozat-mentés) az `onboarding/_kozos/keret.tsx`-ben
  van, az 1. lépés is ezt használja.
- Piszkozat: `kommunikacio` ág (`KommunikacioLepes` a contracts csomagban): célközönség, cél, tartalomnyelvek
  (18 kód, `TARTALOMNYELVEK`), hangnem + mintaszöveg; mindegyiknél forrás (`sajat | weboldal | ai`) és
  „általad módosítva” jelölés; a célközönség / cél / hangnem „későbbre hagyható” (`*_kesobb`).
- `POST /api/onboarding/javaslatok` — belépéskor egyszer, automatikusan (`javaslatok_kerve` után nem újra);
  csak az üres, nem későbbre hagyott mezőket tölti ki. A javasolt nyelvek chipként jelennek meg („+ magyar”),
  felvételükkor a forrás „Weboldal alapján” (v6). Feladattípus: `javaslatok`, prompt `prompts/javaslatok.hu.md`.
- `POST /api/onboarding/hangnem` — finomítás (közvetlenebb / tárgyilagosabb / saját megjegyzés); az új változat
  függőben marad („Új javaslat” doboz), amíg a felhasználó el nem fogadja (A-02). Feladattípus `hangnem_finomitas`.
- Mindkét hívás a keret- és költségmérésen megy át (`ai_hivas`, `ai_koltseg_honap`); a teszt-csatlakozó rögzített
  JSON-t ad, `[MINTA]` jelöléssel.
- `/onboarding/3` az E-9-ig a 2. lépésre irányít vissza: az „Átnézem a profilt →” gomb ment, de zsákutca nincs.
- Új feliratok három nyelven (v6 `km-i18n.js`-ből szó szerint): migráció `0012` (105 sor). Próbák: 51 zöld.

## Onboarding 3. lépés — Ellenőrzés és jóváhagyás (E-9-től)

- A képernyő a v6 OB-03 (+ OB-03-B arculat, OB-03-A „kész”), rajz-kör nélkül: `apps/web/app/onboarding/3/`, `onboarding/kesz/`.
- A sorok (név, tevékenység, célközönség, cél, tartalomnyelvek, hangnem): jelvény (kattintva az eredet részlete),
  soronkénti szerkesztés (v6 userEdit: saját érték / módosított javaslat), „Későbbre hagyva” / „Még nincs megadva”.
- Arculat: `piszkozat.arculat` (`ArculatLepes`): állapotgép nincs → tervezet → (kesobb | jovahagyott); a jóváhagyott
  pillanatképe a `verziok`-ban; jóváhagyott szerkesztése új tervezet (verzio+1), „Tervezet elvetése” a jóváhagyottat állítja
  vissza. A tervezetet az AI adja (`POST /api/onboarding/arculat`, feladat `arculat_javaslat`, prompt `prompts/arculat.hu.md`)
  a 2. lépés javaslataival együtt, vagy a 3. lépésre lépve, ha még nincs. A mintakártya KIZÁRÓLAG a tervezet értékeiből
  épül (semleges alapértékek: v6 `KM_BRAND_DEFAULTS`), SaaS-tokent nem örököl — a tokenőr ezekre kivételt kap.
- Jóváhagyás (R-06): `POST /api/onboarding/jovahagyas` → `szervezet_profil` tábla (migráció `0013`, RLS), a piszkozat
  törlődik; `HIANYOS_PROFIL` (nincs név/összefoglaló) 400, `NINCS_PISZKOZAT` 409. `GET /api/profil` a jóváhagyott profil.
  A profil `kesobbre` listája a jóváhagyáskor hiányzó részek (célközönség, cél, nyelvek, hangnem, arculat) — a „kész” lap
  ebből mutat cím-változatot (teljes / részleges) és jelvényeket.
- Jóváhagyás után az `/onboarding/1..3` a „kész” lapra visz (nincs piszkozat + van profil); `/fiok` az E-10-ig ugyanoda.
- Feliratok három nyelven a v6-ból: migráció `0014` (231 sor + a román 1. lépés nevének javítása). Próbák: 64 zöld.

## Fiókoldal (E-10-től)

- `/fiok` — a jóváhagyott rajz szerint (Claude Design: „Fiókoldal — a jóváhagyott profil”): a profil sorai a 3. lépés
  vezérlőivel (jelvény, eredet, soronkénti szerkesztés — `PUT /api/profil` mezőnként, a forrás/„módosítva” jel a v6
  userEdit szabálya szerint, üres mezőbe írt érték saját érték); „Későbbre hagyott részek” doboz; az arculat összecsukva
  (színek, betűk, képvilág, mintakártya), a Szerkesztés a közös `ArculatBlokk`-ot nyitja (ugyanaz, mint a 3. lépésen;
  a változás ~800 ms után mentődik); jobb oszlop: Szervezet (név, létrehozva, tagok szereppel — `szervezet/reszletek.ts`),
  Fiókod (név, e-mail, a felület nyelve), Honnan jött a profil.
- A `SzervezetProfil` a `*_modositva` jeleket és a `frissitve` időt is tárolja (jsonb, migráció nem kellett).
- Jóváhagyott profil nélkül a `/fiok` az onboardingra visz. Feliratok: migráció `0015` (81 sor, hu/ro/en). Próbák: 75 zöld.
- Szándékosan nincs rajta (nincs gépezet, külön lépés): tag meghívása, jelszóváltás, szervezet törlése, modulok.

## Hibautak (E-11-től)

- Bizonyítás és megismételhető előidézés: `docs/E-11-HIBAUTAK.md`; gépi próbák: `apps/web/probak/hibautak.proba.ts`
  (a havi keret kimerítése SQL-lel az `ai_koltseg_honap` táblában, visszaállítva a végén). Próbák: 92 zöld.
- Javítás: a kimerült keret minden AI-hívásnál 429 (`keretVagyJavaslatHiba`); a fejléc mentés-állapota a v6 szerint
  (`MentesAllapot`: pont, „Mentve: {idő}”, hibánál „Újrapróbálás”) — migráció `0016`.

## Az első építési egység zárása (E-12)

- `docs/E-12-ELLENORZES.md`: fordított ellenőrzés (6 javított eltérés a v6-tól, 1 kérdés), végigjátszás hu/ro/en +
  telefonon (2 javított telefonos hiba: a háttérfolt elfogta a koppintást; a fejléc nem tört sorba), az A-01…A-16 állása.
- Feliratok: migráció `0017`. Próbák: 92 zöld.

## Modulhatárok a kódban (E-12b, 2026-09-07 — a szétválasztás)

Az ALAPTERV 2. fejezetének táblája most a határőrben él (`.dependency-cruiser.cjs`), nem csak papíron:

| Csomag / mappa | Mi van benne | Amit NEM importálhat (a határőr elbukik) |
|---|---|---|
| `packages/profile-core` | a profil szabályai: `profilPiszkozatbol` (jóváhagyás), `profilModositasAlkalmaz` (eredet-szabály), `kesobbreLista`, az arculati állapotgép (`arculatModosit/Jovahagy/TervezetElvet/Kesobbre/Megis/Visszavon/TervezetBefogad`), `ARCULAT_ALAP`, a `ProfilTar` tárolási kapu | React, Next, adatbázis; onboarding-core, ai-adapters, design-system; apps/* |
| `packages/onboarding-core` | a három lépés szabályai: `tartalomnyelv`, `javaslatokBeolvaszt`, `piszkozatMezoSzerkeszt`, `jovahagyhato`, `nyelvekSzovegbol` | React, Next, adatbázis; design-system, hírfigyelő; apps/* (a profile-core-t HASZNÁLJA) |
| `apps/web/profil/` | a profil tárolása (`tar.ts`: a `ProfilTar` megvalósítása, RLS alatt) és a fiókoldal műveletei (`profilBetolt`, `profilModosit`) | az onboarding bármely fájlja |
| `apps/web/onboarding/` | piszkozat, AI-hívások, letöltő, és az átadás (`jovahagyas.ts`: profile-core szabály → `profilTar.ment` → a piszkozat törlése) | — (a profil kapuját hívja, a tábláját nem írja) |
| `apps/web/app/_kozos/` | a közös kliens-segédek (`kliens.tsx`: hívás, jelvény, mentés-állapot, nyelvnév; `ArculatBlokk.tsx`) — a fiókoldal és az onboarding is ezt használja | — |
| `apps/web/app/fiok/`, `app/api/profil/`, `szervezet/`, `hitelesites/` | a fiókoldal, a profil API-ja, a szervezet, az azonosítás (`aktualisSzervezet` ide került) | az onboarding bármely fájlja |

Bizonyítva: egy tiltott import a fiókoldalon és egy a profile-core-ban → a határőr 2 hibával elbukik; törölve → zöld.
Ami még nem a kapu mögött van (tudott, a 6. szakasz feladata): a piszkozat tárolása közvetlenül Drizzle-lel az
`apps/web/onboarding/piszkozat.ts`-ben — a `host-adapters` csomag ezt viszi majd kapu mögé, a hordozhatósággal együtt.

## A téma két szintje (E-13, 2026-09-07 — D-09)

- **Szabályok** a `packages/design-system/src/tema-szintek.ts`-ben (tiszta, adatbázis és React nélkül): `temaEllenoriz` (a v6
  `km-theme.js validate()` tükre, strukturált `{token, kod, parameterek}` hibákkal — az import és a mentés ELŐTT fut, hibánál
  semmi nem íródik, A-09), `egyesit` (közös alap + felülírás = hatásos), `felulirasokSzamol` (a teljes szerkesztett készletből
  csak az eltérő tokenek maradnak), `kontraszt` / `olvashatosagiFigyelmeztetesek`, és a felület szerződései
  (`SzervezetTemaAllapot`, `KozosTemaAllapot`, `TemaTervezetKeres`, `TemaVisszaallitasKeres`). Az alaptokenek sémája külön
  fájlba került (`tokenek.ts`), hogy ne legyen körkörös import.
- **Tárolás** az `apps/web/tema/tar.ts`-ben (ALAPTERV 3.: a téma gazdája az apps/web, verziózva). Két tábla, ugyanaz az
  állapotgép: `tema` = a KÖZÖS ALAP (teljes készlet; `allapot`: tervezet / alkalmazott / korabbi — az E-4-es `aktiv` helyett),
  `szervezet_tema` = a SZERVEZETI FELÜLÍRÁS (csak az eltérő tokenek; sorszintű védelem alatt). Legfeljebb egy tervezet és egy
  alkalmazott szintenként (részleges egyedi indexek). Alkalmazás = a tervezet lesz az alkalmazott, a korábbi alkalmazott
  korábbi; elvetés = a tervezet korábbi lesz (nem törlünk); visszaállítás = a korábbi verzióból ÚJ tervezet (élesbe csak
  alkalmazással). Gyorsítótár 60 mp, alkalmazáskor ürül. Migráció `0018`.
- **A lap feje** (`app/layout.tsx`): a belépett ember szervezetének HATÁSOS témája (közös alap + alkalmazott felülírás) megy
  a `:root` blokkba; belépés előtt a közös alap. Ha a szervezeti réteg hibás, a közös alap megy (naplózva).
- **API** (`app/api/tema/…`): szervezeti szint `GET|PUT|DELETE /api/tema`, `POST /api/tema/alkalmaz`, `POST /api/tema/visszaallit`
  — a PUT/DELETE/POST csak a szervezet TULAJDONOSÁNAK (403 `NINCS_JOG`); közös alap ugyanez `/api/tema/kozos…` alatt, csak a
  rendszergazdának. Hibakódok: `NINCS_TERVEZET` (409), `NINCS_ILYEN_VERZIO` (404), `ERVENYTELEN_ADAT` (400, `tema_hibak` +
  `figyelmen_kivul`).
- **Rendszergazda-jelölés** (`fiok.rendszergazda`): egyelőre egy ember. Az első jelölést a `RENDSZERGAZDA_EMAIL` környezeti
  változó (a NAS `.env`) adja a következő belépéskor; utána a fiókon marad, a változó törölhető. Máshogy csak SQL-lel adható
  vagy vehető el. A `FiokNezet` szerződésben `rendszergazda: boolean`.
- **Tokenőr:** a `probak/` mappa kivétel lett (a próbák témaértékeket küldenek adatként). Próbák: `tema.proba.ts` (16 eset:
  elválasztás három szervezettel, a lap feje, verziók, visszaállítás, hibás csomag nem ír, jogok) — 108 zöld összesen.
- Felület még nincs (E-14: a v6 `Theme-beallitasok` szerint).

## A Theme-felület (E-14, 2026-09-07)

(lásd a tárhelyi példányt — ugyanaz a szöveg: /tema, két szint, import csak az előnézetbe, migráció 0019, globalThis gyorsítótár)

## A feliratok két szintje és szerkesztője (E-16, 2026-09-07)

- **Szabályok** `packages/design-system/src/feliratok.ts` (tiszta): `feliratErtek` / `hatasosFeliratok` (szervezet → közös → alap,
  nyelvenként; ha nincs, ugyanez a lánc magyarul — tartaléknyelv), `feliratFelulirasokSzamol` (csak az alsóbb szinttől eltérő, nem üres
  szövegek), `feliratCsomagEllenoriz` (`km-feliratok/1`: ismeretlen kulcs → figyelmen kívül, üres/`<`/túl hosszú/nem-szöveg → hiba),
  `hibakodhozKotott`, `feliratCsoport`, a szerződések (`FeliratSzintAllapot`, `FeliratHiba`, `FeliratTervezetKeres`). A nyelvek
  (`NYELVEK`, `ALAP_NYELV`, `NYELV_SUTI`) külön fájlba kerültek (`nyelvek.ts`), hogy ne legyen körkörös import.
- **Tárolás** `apps/web/szovegek/tar.ts`: a csomag alapja a `felirat` tábla (migrációkból), a közös felülírás `kozos_felirat_verzio`,
  a szervezeti `szervezet_felirat_verzio` (RLS) — ugyanaz az állapotgép, mint a témánál (tervezet / alkalmazott / korábbi; legfeljebb
  egy tervezet és egy alkalmazott). Gyorsítótár a `globalThis`-en, alkalmazáskor ürül. Migráció `0021`.
- **Műveletek** `apps/web/szovegek/index.ts`: `lapFeliratai(nyelv, szervezetId)` — ezt hívja a `nyelv/index.ts` `feliratok()`-ja, a
  layout és az oldalcím (a szervezet a sütiből); a szint-műveletek (`szervezet*`, `kozos*`) a téma mintájára.
- **API** `app/api/feliratok/…` (a téma pontjainak tükre; a válasz burka `{ feliratok }`, a 400 törzse `felirat_hibak` + `figyelmen_kivul`).
- **Képernyő** `/feliratok` (`app/feliratok/`), részletek és a fordított ellenőrzés: `docs/E-16-ELLENORZES.md`. Feliratai: migráció `0022`.
- Próbák: `feliratok.proba.ts` (10) — 117 zöld összesen.

## Export / import fájlba (E-17, 2026-09-07)

- Mindkét admin-felületen (Theme, Feliratok) négy gomb: „Exportálás a mezőbe”, „Importálás a mezőből” (v6), és **„Exportálás
  fájlba”, „Importálás fájlból”** (a 4. szakasz E-17 sora szerint; a v6-ban nincs — a terv Vilmos „mehet”-jével jött). A fájl ugyanaz a
  csomag, mint a mezőé (`km-theme/2` / `km-feliratok/1`), a neve `tema-<szervezet>-<dátum>.json` / `feliratok-…json` (ékezet nélkül).
  Az importált fájl szövege a mezőbe kerül, és ugyanaz az ellenőrzés fut, mint a mezőből: hibás fájl → tételes hibalista, SEMMI nem
  változik (sem a tervezet, sem az alkalmazott); jó fájl → csak az előnézetbe/tervezetbe, élesbe alkalmazással.
- Közös segédek: `app/_kozos/kliens.tsx` — `fajltLetolt`, `FajlValaszto`, `fajlnevSzelet`.
- **A-09 bizonyítás:** kliensen (`temaEllenoriz` / `feliratCsomagEllenoriz`) ÉS kiszolgálón (a PUT ugyanazt a szabályt futtatja; próbák:
  `tema.proba.ts` 5–6, `feliratok.proba.ts` 3); a gépi végigjátszás (`/tmp/e17-jatek.py`): hibás fájl importja után az alkalmazott a
  kiszolgálón változatlan, jó fájl csak az előnézetbe. Feliratok: migráció `0023`. Próbák: 123 zöld.

## A fiókprofil átrajzolása (E-17b, 2026-09-07)

- **Spec:** Vilmos új mockupja, `design/fiokprofil-hirfigyelo-v7.zip` → `Fiokprofil-optimalizalt.dc.html` (a v7-es átadóból; a
  Hírfigyelő-prototípus ugyanebben a zipben az 5. szakaszé). A `/fiok` lap ennek a mása: fejléc morzsával („/ szervezet / Profil”),
  címsor („Ügyfélprofil”, „✓ Jóváhagyva”, „{dátum} · {ki}”, jobbra a **„N hiányzó rész: …”** gomb, ami az első hiányzóhoz görget),
  bevezető mondat, a hat mező **kártyarácsban** (tevékenység és hangnem teljes szélességben), az arculat összecsukva a rácsa alatt
  (**a jóváhagyás gombja itt is működik**, nem kell kinyitni), lábléc; jobbra egyetlen oldalsáv-kártya: szervezet, létrehozva, tagok
  szerep-jelvénnyel (a belépett tag alatt az e-mailje), **a felület nyelve** (a nyelvválasztó ide költözött a fejlécből), a profil eredete.
- **Szándékos többlet a mockuphoz képest** (a fordított ellenőrzés tudta): a mentés állapota a fejlécben (E-11), az oldalsáv
  „Beállítások” szakasza a Theme/Feliratok linkekkel (E-14/E-16 belépési pont), a nyitott arculat-blokk (v6 OB-03-B).
- **Gépezet változatlan** (E-10): mezőnkénti `PUT /api/profil`, jelvény → eredet-részlet, arculat 800 ms után mentődik, a jóváhagyott
  változat megmarad az új tervezet mellett. Új származtatott token: `--fs-h2` (a h1 70%-a, alapon 24px — a mockup címe).
  A `Nyelvvalaszto` kapott `className` paramétert. Régi, már nem használt `fiok.*` kulcsok törölve (migráció `0024`, 12 új kulcs 3 nyelven).
- **Ellenőrzés:** `/tmp/e17b-jatek.py` végigjátszás (regisztráció → onboarding → fiók: hiányzó-gomb görget, részlet nyílik, cél pótlása,
  arculat jóváhagyása a lapról, szerkesztés → 2. tervezet a jóváhagyott mellett, újratöltés, ro/en, telefon: nincs vízszintes görgetés);
  Kimi fordított ellenőrzés `docs/E-17b-FORDITOTT-ELLENORZES-kimi.md`: 0 valódi eltérés. Próbák: 123 zöld; `hatar`, `tokenor`, `tipus` rendben.

## Hibautak és a 4. szakasz zárása (E-18, 2026-09-07)

- **Hibautak:** a sikertelen mentés/alkalmazás/betöltés után az előző marad — gépi végigjátszás hálózati hibával és 500-zal mindkét
  admin-felületen, a kiszolgáló állapotát is lekérdezve (`docs/NEGYEDIK-SZAKASZ-ZARAS.md` 2. pont). Talált hiba: a Theme-lap
  betöltési feliratai hiányoztak → migráció **0025**.
- **Záró fordított ellenőrzés** (Kimi): Theme ↔ v6 (jegyzetek térköze javítva), Feliratok ↔ E-15 rajz (telefonon a kártya 12 px és a
  „Visszaállítás a közösre” a nyelvek alatt — javítva). `docs/E-18-FORDITOTT-ELLENORZES-{tema,feliratok}-kimi.md`.
- Végigjátszás 3 nyelven + telefon mindkét lapon a javítások után; 123 próba; a három őr rendben. A-07/A-09 bizonyítás és a szakasz
  összefoglalója: `docs/NEGYEDIK-SZAKASZ-ZARAS.md`; az átvételi tábla frissítve (`docs/E-12-ELLENORZES.md`).

## K-1 — az angol az alap- és tartaléknyelv (D-11, 2026-09-07 este)

- Egyetlen központi szabály: `packages/design-system/src/nyelvek.ts` `ALAP_NYELV = "en"`. Ettől: a hatásos felirat-lánc tartaléka az
  angol (`feliratErtek`), új látogatónak süti és böngésző-nyelv nélkül angol a felület (`nyelvKeresbol`), a feliratok-szerkesztő
  kártyáin az „English (eredeti)” oszlop az első (`NYELV_OSZLOPOK`), a „hiányzó fordítás” a magyarra és a románra vonatkozik.
  A választók sorrendje (Magyar · Română · English) a v6 szerint marad.
- A szerkesztő 5 magyarázó szövege három nyelven átírva (migráció **0026**, UPDATE a csomag alapján). A próbák magyar felülettel futnak
  (a `probak/segedek.ts` adja a `km_nyelv=hu` sütit, ha a próba mást nem ad); a tartaléknyelv-próba (6.) megfordítva: magyar alap
  törölve → magyarul az angol látszik. 123 próba zöld.
- A tartalomnyelvek (a mintakártya, a hangnem nyelve) nem változtak — az ügyfél tartalmának nyelve más kérdés, mint a felületé.

## E-19 — a Hírfigyelő magja és szerződése (2026-09-07 este; NEM kirakva külön — a következő kirakással megy)

- `packages/news-monitor-core` a `docs/HIRFIGYELO-SZERZODES.md` (0.1) szerint: beállítás és verziók (változatlan mentés nem ad
  verziót), források (osztályozás: Facebook és társai `nem_tamogatott`; kanonikus URL), kivonat (8 000 karakter, `csonkolt`, FNV-1a
  ujjlenyomat, 30 napos lejárat), találat/esemény (megtekintési állapot, jelölés, cikk-kulcs), dedup (gyanús pár + eseménybe sorolás),
  futás-állapotgép (dupla indítás tiltva, részleges hiba, AI-függőben, a mentés nem futás, következő futás időzónával), minta
  (lejárat → nincs azonos mintás összehasonlítás), visszajelzés és szabályjavaslat, AI-feladatok sémái és válasz-ellenőrzése
  (ADAT-blokk, csonkolt jelölés), host-kontextus és jogosultság, tár-interfész memóriabeli megvalósítással.
- Flotta: DeepSeek építő (a teljes csomag egy körben, 4 típushiba javítva) + két Kimi tesztelő párhuzamosan (5–5 próbafájl, a spec
  alapján, a kód ismerete nélkül) → 111 próba; 12 eltérés a kód és a próbák között — 10 a kód hibája (időzóna-számítás, `bovitett`
  csak meglévő eseménynél, rendezés magyar ábécé szerint, üres lista → `required`, ujjlenyomat a szövegre is), 2 spec-pontosítás
  (`osszehasonlitas` párosítása, `esemenybeSorol` szervezet-azonosítója). Tanulság: **egy `device_bash` hívás végén a háttérben
  hagyott ágens meghal** — a párhuzamos futtatás módja: több ágens EGY hívásban, `wait`-tel, mindegyik ≤ 170 mp (ezért a tesztelő
  feladat két félre bontva).
- Határőr: két új szabály (a mag csak `contracts`+`zod`; az alkalmazás csak a bejáraton át). `pnpm hatar` 145 modul rendben,
  tokenőr, tipus (7 csomag) rendben; a docker-kép a csomaggal épül.

## E-19b — a modul folyamatai és a bekötés bizonyítéka: `apps/proba-host` (2026-09-07 este)

- `packages/news-monitor-core/src/folyamat.ts` (a szerződés 2.12): a modul MINDEN folyamata (beállítás mentése, tervezet, visszaállítás,
  források, futás, újraértékelés, megtekintés/jelölés, visszajelzés, javaslat kérése/kipróbálása/döntése, áttekintés, összkép) —
  I/O nélkül, a host adta csatlakozókkal (tár, letöltő, AI-hívó, profil, idő, azonosító). Ugyanez a kód fut majd a webalkalmazásban.
- `apps/proba-host`: minimális tesztalkalmazás (Node + TypeScript, NEM Next): memóriatár, rögzített letöltő (jó forrás 4 cikkel — kettő
  ugyanarról —, hibás forrás), determinisztikus teszt-AI, a `@km/contracts` szerinti rögzített profil. `pnpm --filter @km/proba-host indit`
  a teljes kört a konzolra írja; 3 bekötési próba. **A modul kódjához nem nyúl** — a határőr tiltja is (151 modul rendben).
- Flotta: DeepSeek építő (folyamat + proba-host, 0,0074 USD) + Kimi tesztelő (27 folyamat-próba a spec alapján, 0,0677 USD) párhuzamosan
  indítva — a Kimi az első hívásban nem indult el (az egyik `&&` lánc hibája), külön hívásban futott. Eltérések a kód és a próbák
  között, javítva a MAGBAN: a `hibas` forrást a futás újra próbálja (a részleges forráshiba csak így látszik); az ujjlenyomat csak a
  szövegből (átvett hír más címmel = ugyanaz); a találat azonosítója = a kivonaté; a keret elfogyása MINDEN nem értékelt találaton
  látszik és egyszer jelez; `uj_talalatok` = új kártyák; a `Kornyezet` kapott `profil`-t (a spec hiánya volt). A próbákban: a tesztelő
  „ugyanaz a cikk” fixtúrája valójában ugyanaz az URL volt (helyesen kihagyva) → külön cím; `osszkep` mezőnév. 138 próba zöld a
  csomagban, 3 a proba-hostban; tipus 8 csomag; a docker-kép épül (a web-kép a hírfigyelőt még nem tartalmazza — E-20-tól).

## E-20 — a Hírfigyelő tárolása és API-ja a webalkalmazásban (2026-09-07 késő este)

- **Tárolás:** 10 új tábla (`hf_*`) a `sema.ts`-ben, mind szervezethez kötve, sorszintű védelemmel (`km_app` csak a saját szervezetét látja);
  a `hf_kivonat` **egyedi (szervezet, kanonikus URL)** kulcsa az A-10 gépezete (ugyanaz a cikk egyszer). Migráció **0027**.
  `apps/web/hirfigyelo/tar.ts`: a `HirfigyeloTar` Postgres-megvalósítása, minden hívás `szervezetKent` alatt.
- **Csatlakozók:** `apps/web/hirfigyelo/index.ts` (`kornyezet(szervezetId)`: tár, letöltő, AI-hívó, a közös profil, idő, azonosító; `hostKontextus`:
  a fiók szerepe a szervezetben), `hirfigyelo/ai.ts` (a közös csatlakozón át, feladatonként prompt-fájl `prompts/hf_*.hu.md`, a hírszöveg
  jelölt ADAT-blokkban, **keret-ellenőrzés minden hívás előtt**, mérés a `ai_hivas`-ba — D-12), `hirfigyelo/letolto.ts` → a KÖZÖS
  letöltő (`apps/web/letoltes`, az E-7 letöltő kiemelve): SSRF-védelem, **robots.txt tiszteletben**, 1 MB, csak szöveg, RSS/Atom-elemző
  függőség nélkül (legfeljebb 50 tétel), weboldalnál a lap maga a cikk. A közös AI-darabok (`szolgaltato`, keret, mérés, prompt) az
  `apps/web/ai`-ba kerültek — az onboarding onnan importál, a viselkedése változatlan (a keret-hiba típusa az onboardingban marad 429).
- **API:** `/api/hirfigyelo/…` — áttekintés, beállítás (GET/PUT, tervezet PUT/DELETE, visszaállítás), források (GET/POST, ellenőrzés),
  futás (POST — most még SZINKRON, a válasz a futás; E-22 teszi háttérbe; GET lista), újraértékelés, találat megtekintés/jelölés,
  visszajelzés, javaslat (kérés, kipróbálás, döntés), összkép. Válasz `{ hirfigyelo: … }`; a mag hibakódjai HTTP-kódra képezve
  (403/409/400/404). Új hibakódok a `contracts`-ban. A teszt-csatlakozó a hat hírfigyelő-feladatra determinisztikus JSON-t ad.
- **Ellenőrzés:** `probak/hirfigyelo.proba.ts` (10 élő próba: jogok és elválasztás két szervezettel + néző, verziók, tervezet, források
  — Facebook `nem_tamogatott`, valódi RSS (`PROBA_RSS`, alap: marosvasarhelyiek.ro/feed) — futás, **A-10** (második futás 0 új), megtekintés,
  visszajelzés → javaslat → kipróbálás → döntés, összkép). Helyben: **133 próba zöld** a webalkalmazásban (a valódi RSS-ből 10 cikk jött be,
  mind értékelve a teszt-AI-val), 138 a magban, 3 a proba-hostban; határőr 174 modul, tokenőr, tipus rendben.
- Flotta: 2 DeepSeek építő párhuzamosan (A: tár+API — a válasz hosszkorlátjába ütközött, A2 folytatta; B: AI-hívó, letöltő, promptok,
  kiemelések) + Kimi tesztelő (10 élő próba a spec alapján). Javítások a beépítéskor: körkörös séma-import (a táblák a `sema.ts`-be
  kerültek), `text({length})` nincs a drizzle-ben, a visszajelzés sémája, a `verzioVisszaallit` verziólistája, a válaszból az `ok` ki,
  a teszt-adapter a szöveges „Saját indok” sort is érti, az onboarding keret-hibájának típusa (a kiemelés után 500 lett volna → visszaállítva).
- **Élő ellenőrzés kívülről (első kör) és javítás:** a NAS-on a globális `AI_SZOLGALTATO=claude-elofizetes` miatt a hírfigyelő futása a
  hídon át ment, 10 cikk + a duplikátum-kérdések > 60 mp → a kérés 504-et kapott (a futás a kiszolgálón lefutott: 10 találat,
  `ai_fuggoben`). Két dolog derült ki: (1) D-12 szerint a hírfigyelő NEM mehet automatikusan a hídra → külön kapcsoló:
  **`HF_AI_SZOLGALTATO`** (alap `teszt`; a valódi AI ellenőrzéséhez `anthropic`; a híd csak kifejezett beállításra) — `apps/web/ai`
  `hirfigyeloSzolgaltato()`; (2) a szinkron futás a kérésben csak a teszt-csatlakozóval fér a 60 mp-be (a teszt-adapter hf-hívása 120 ms) —
  a háttérfutás (E-22) a valódi AI-hoz KÖTELEZŐ, nem opció. A futás `veg` ideje most a valódi vég. Ugyanaz a kör újra: lent.

## E-22 — háttérfutás: várólista a Postgresben, futtató az alkalmazásban, helyi AI a Dellen (2026-09-08 hajnal)

- **Döntés (D-13, a beszélgetésben):** NEM Redis/BullMQ (nem lesz új doboz a NAS-on). A várólista egy Postgres-tábla (`hf_sor`,
  host-szintű, migráció **0028**), a futtató az alkalmazás saját folyamatában él (`apps/web/instrumentation.ts` → `hirfigyelo/futtato.ts`,
  5 mp-es tick, egyszerre EGY munka az egész rendszerben — a NAS-t nem terheli párhuzamos futás). A nehéz AI-munka a Dell Ollamájára
  megy egy új közös csatlakozóval (`packages/ai-adapters/src/ollama.ts`, `helyi-ollama`, GPU-hívások sorban, `docs/D-13-HELYI-AI.md`).
- **Sor (`hirfigyelo/sor.ts`):** `sorbaTesz(szervezet, fajta, adat)` → `FUT_MAR`, ha már van `var`/`fut` tétele a szervezetnek;
  `kovetkezoKivesz` egy `UPDATE … SKIP LOCKED`-dal veszi ki a legrégebbi `var` tételt; a 15 percnél régebb óta `fut` tétel `hiba`
  (`idotullepes`), a hozzá tartozó `fut` futás is lezárva. Fajták: `futas` (kézi, `{ proba }`), `ertekeles_ujra`, `napi`.
- **Futtató (`hirfigyelo/futtato.ts`):** a rendszer nevében (`RENDSZER_FIOK`, tulajdonos-szerep a mag felé) hívja a mag folyamatait
  (`figyelesFuttat`, `ertekelesUjra`); az eredmény (`futas_id`, `uj_talalatok`) a sorra kerül. **Napi ütemezés** is itt: a
  `hf_napi_utemezesek()` SECURITY DEFINER függvény (migráció 0028; a futtató `km_app`-ként a sorszintű védelem miatt nem látná a
  többi szervezet beállítását) adja az aktív, `napi` módú beállításokat és az utolsó napi kezdést; a mag új `esedekes(idozites,
  utolsoKezdet, most)` szabálya (időzónával, alap Europe/Bucharest 07:00) dönt; egy nap egy `napi` tétel szervezetenként.
  `HF_FUTTATO=0` kikapcsolja (pl. próba-példányban).
- **API:** `POST /api/hirfigyelo/futas` → **202** `{ hirfigyelo: { sor } }` (409 `NINCS_BEALLITAS`, ha nincs aktív beállítás — a
  beépítéskor pótolva; 409 `FUT_MAR`, ha már sorban van); `GET futas` → `{ futasok, sor }` (az építő a futáslistát a sorra cserélte —
  visszatéve, a sor mellé); új `GET futas/sor/{id}` (a tétel állapota: var → fut → kesz | hiba, `eredmeny.futas_id`); új
  `GET futas/{id}` (egy futás + a találatai — a képernyőkhöz is kell, E-24); `POST ertekeles-ujra` → 202, sorba; `attekintes.sorban`
  = a szervezet var/fut tétele vagy null (a sáv „Figyelés fut a háttérben…” ebből tudja).
- **Ellenőrzés helyben:** a `hirfigyelo.proba.ts` a sorra átírva (10 élő próba: beküldés → 202 → várakozás a tételre → futás a listából,
  A-10 második futás 0 új, beállítás nélkül 409, a más szervezet tétele 404); **web 133, mag 142, ai-adapters 5 (Ollama-sor: a
  párhuzamos hívások sorban mennek, elérhetőség), proba-host 3 — mind zöld**; határőr 181 modul, tokenőr, tipus rendben. A futtató a
  helyi dobozban: `[hirfigyelo-futtato] elindult`, a valódi RSS-ből 10 → 0 új.
- Flotta: 2 DeepSeek építő párhuzamosan (A: sor, futtató, migráció, API; B: Ollama-csatlakozó + D-13 lap) + 2 DeepSeek tesztelő (a: az
  élő próbák átírása a sorra; b: az Ollama-sor próbái) — a Kimi tesztelő kétszer is a hívás végével halt meg (a háttérfolyamat nem éli
  túl a hívást), ezért DeepSeek. Javítások a beépítéskor: hiányzó `sql` import; a sorszintű védelem miatt a napi ütemezés SECURITY
  DEFINER függvénybe; `NINCS_ILYEN_SOR` és `NINCS_ILYEN_FUTAS` hibakód; az ai-adapters csomag függőségei (zod, @types/node); az Ollama-sor
  versenyhelyzete (két hívó ugyanazt az ígéretet olvasta → a helyet szinkron foglaljuk); a `RETURNING *` kígyóbetűs sora (→ `RETURNING id`
  + újraolvasás); a 409 `NINCS_BEALLITAS` a beküldésnél; a futáslista visszatéve; a futás-részlet útvonal.
- **Kirakás és élő ellenőrzés:** lent (NAS-mérés, migráció 0028, kívülről: beküldés → 202 → tétel `kesz` → második futás 0 új).
- **Kirakva és kívülről ellenőrizve (2026-09-08 07:02):** NAS-mérés előtte (11,0 GB felszabadítható, terhelés 1,5) és utána (1,9);
  migráció 0028 lefutott. Kívülről, friss próbafiókkal: futás beállítás nélkül **409 NINCS_BEALLITAS**; beállítás + valódi RSS
  (`hasznalhato`); beküldés **202** (a tétel `var`, `attekintes.sorban` = `var`/`fut`); második beküldés közben **409 FUT_MAR**; a tétel
  **7 mp alatt `kesz`**, a futás részlete 10 új találat (10 találat, mind `kesz`), `sorban` utána null, `ujDb` 10; **második futás 0 új**
  (A-10); `GET futas` 2 futás + 2 sor-tétel; idegen sor-tétel süti nélkül 401. Képek: `e22-elo-ellenorzes.png`, `e22-allapot.png`.
  Tanulság: induláskor a futtató első tickje a migráció előtt futott (a `hf_sor` még nem volt) → hibaüzenet + egy `unhandledRejection`
  a naplóban, a folyamat nem állt le, a migráció után magától rendben; a tick most minden lekérdezést elkap (`kovetkezoKivesz`,
  `hibara`) — a következő kirakással megy ki, nem külön (a „nem egymás után” szabály).

## E-23 — deduplikáció és AI-értékelés: kártyák, összefoglaló, tartalomötlet kérésre, promptok v2, a Dell mérése (2026-09-08 délelőtt)

- **Mi volt már meg E-19b/E-20-ból:** cikk ≠ esemény (kanonikus URL + ujjlenyomat + gyanús párra AI), relevancia Fontos/Érdekes/Háttér + „miért” + témacímke, összkép
  forráshivatkozással és `bizonytalan` jelzéssel, a hírszöveg ADAT-blokkban (A-14). E-23 ezt egészítette ki a prototípus kártyájára és részletpaneljére.
- **Mag:** `kartya.ts` — `kartyakEpit`: eseményenként EGY kártya (fő találat címe, összefoglaló, miért/indoklás/fontosság/témacímke, v-címke, források listája +
  `forras_szam`, „új” ha bármelyik találata új, jelölés, tartalomötlet); az `attekintes` válasza `kartyak`-at is ad — a felület (E-24) ezt rajzolja. Az értékelés új
  `osszefoglalo` mezője (miről szól a cikk, ≤ 400). `tartalomotletKer`: CSAK kérésre, a profil hangnemével, meglévő ötletnél nem hív újra; AI-hiba érthető kóddal.
  Új próbák: 9 (`kartya.proba.ts`) — **mag 151 zöld**.
- **Web:** migráció **0029** (`hf_talalat.tartalomotlet`), `POST/GET /api/hirfigyelo/talalatok/{id}/tartalomotlet` (404/429/502 a mag kódjaiból), a teszt-csatlakozó
  `[MINTA]` összefoglalót ad; 2 új élő próba (kártyák; tartalomötlet: null → POST → mentve → második POST nem hív → néző 403 → más szervezet 404) — **web 135 zöld**.
- **Promptok v2** (`docs/E-23-PROMPT-ELLENORZES.md`): relevancia + `osszefoglalo`; esemény-egyezés: kétségnél NEM ugyanaz (két kártya jobb, mint hamis összevonás);
  tartalomötlet: AI-javaslatként fogalmazva. Az ellenőr észrevétele: a válaszok nyelve most fixen magyar — román/angol felhasználónál is → nyitott kérdés (lent).
- **Mérhető minőség:** `tools/agens/hf-minta/relevancia.json` (12 kitalált `[MINTA]` cikk várt kategóriával: névütközés, kizárt sport, csonkolt, beágyazott utasítás) és
  `ugyanaz.json` (8 pár: más cím ugyanarról, folytatás, azonos cím más város); `python3 tools/agens/hf-prompt-proba.py --csak relevancia --kimenet …` bármely Ollama-végponton
  méri az egyezési arányt, az időt és az A-14-et. **Még nem futott** — a Dell ekkor nem volt elérhető (lent).
- **A Dell AI mérése élesben (D-13):** a tesztoldal hírfigyelője `HF_AI_SZOLGALTATO=helyi-ollama`-ra kapcsolva (NAS `.env`, csak app-újraindítás). Első valódi futás: 10 cikk,
  mind függőben — a 30 mp-es hívás-korlát rövidebb volt a modell hideg betöltésénél (30 mp) → 180 mp + `keep_alive` 30 perc (kirakva, második kör). Mérés a Dellen
  közvetlenül: **hideg 41,5 mp, meleg 3,8 mp/cikk, jó minőségű magyar JSON** („fontos / szakmai”, jól indokolt). Utána a Dell ingadozott (ugyanaz a kérés 100 mp fölött,
  majd az Ollama nem válaszolt) — kívülről nem látni, mi terheli a kártyát; kérdés Vilmosnak (fut-e képgenerálás/tanítás). A 10 függő értékelést az `ertekeles-ujra`
  pótolja, amint a Dell szabad. A futtató közben nem áll le: a tétel 15 perc után `hiba`, a következő futás rendben.
- Flotta: 3 DeepSeek párhuzamosan (építő A mag, építő B web, ellenőr promptok+próbakészlet) — `docs/AGENSEK.md`. Tanulság: a mag építőjének 28 000 token sem volt elég
  a próbákkal együtt (ismétlődő szóba futott) → a próbafájlt külön ágensnek vagy magamnak.
- **Nyitott kérdés Vilmosnak (egy kérdés):** az AI-válaszok (miért, összefoglaló, összkép, tartalomötlet) nyelve — most mindig magyar. Lehetőségek: (a) a szervezet
  beállításának első nyelve; (b) a felhasználó felületi nyelve; (c) marad magyar. Következmény: (a) egy román ügyfél románul kapja, a magyar munkatársa is; (b) ugyanaz a
  találat két munkatársnak két nyelven készülne (dupla AI-költség) — nem javaslom; (c) román ügyfélnek nem jó. **Javaslat: (a).**
- **Kirakva és kívülről ellenőrizve (2026-09-08 09:50):** migráció 0029; `GET attekintes` → **10 kártya** (a régi értékelések összefoglalója a kivonatból pótolva, v1
  címke, forrásszám 1 — egy forrás van); `GET talalatok/{id}/tartalomotlet` → null; `POST` → **502 `AI_NEM_ELERHETO` 12 mp alatt** (a Dell Ollamája ekkor kívülről sem
  válaszolt — a hibaút tiszta, semmi nem mentődött); nem létező találat 404; süti nélkül 401. A Dell visszatérte után: `POST` újra → az ötlet mentve (H-10 része).

## E-24 + E-25 — a Hírfigyelő két képernyője: Áttekintés és Figyelés beállítása a v7 prototípus szerint (2026-09-08 délelőtt)

- **Miért együtt:** az Áttekintés lapon a „Figyelés beállítása” fül és az első használat gombja a Beállítás lapra mutat — gomb gépezet nélkül nem mehet ki, ezért a két lap
  egy kirakással ment. A prototípus (`design/fiokprofil-hirfigyelo-v7.zip` → `Hirfigyelo-prototipus.dc.html`) a felületi mérce; rajz nem készült.
- **Közös váz** (`apps/web/app/hirfigyelo/_kozos/`): `HirfigyeloKeret` (fejléc: modulnév, „modul” jelvény, a fülek — csak a létező lapok: `ELERHETO_LAPOK`, a Finomhangolás
  fül az E-26-tal jön —, nyelvválasztó, „Vissza a fiókhoz”; a közös profil sora), `kliens.ts` (`hfKeres`, `varjSor` a háttérfutás megvárására, `idoRovid` időzónával,
  `nyelvNev`, `forrasNev`), `hirfigyelo.css`. A lapok kiszolgálói része a Theme-lap mintája: belépés → szervezet → közös profil (nélküle az onboarding).
- **Áttekintés** (`/hirfigyelo`, `Attekintes.tsx` + `attekintes.css`): első használat (üvegkártya + CTA); StatusStrip (utolsó sikeres futás, következő futás a beállítás
  időzónájában, új találatok száma, részleges forráshiba chip, „Futtatás most” → 202 → pörgő „Figyelés fut a háttérben…” → a végén újratöltés); AI-kiesés sáv (`ai_fuggoben` /
  függő értékelés; keret-kimerülésnél a D-12 szöveg); „Nincs új találat” doboz; Összkép (AI-jelvény, caveat; bizonytalannál kiemelve); szűrők Új/Mentett/Elrejtett/Mind;
  HitCard a mag kártyáiból (fontosság-jelvény, témacímke, források + idő, v-címke, cím, összefoglaló, „Miért fontos neked?”, „⧉ n forrás ugyanarról”, Mentés/Nem releváns/
  Visszaállítás/Részletek); elrejtésnél a „visszajelzésed a Finomhangolásban gyűlik” megjegyzés; DetailPanel (jobb oldali panel, telefonon teljes szélesség, Escape zár, a
  lista pozíciója és a szűrő megmarad; összefoglaló nyelvcímkével, indoklás, források linkkel, tartalomötlet CSAK gombra — 429/502 érthető szöveggel; csonkolt kivonatnál jelzés);
  a panel megnyitása megtekintetté tesz (3c). Néző: a futtatás és a jelölés gombjai nem látszanak.
- **Figyelés beállítása** (`/hirfigyelo/beallitas`, `Beallitas.tsx` + `Forrasok.tsx` + `beallitas.css`): fej + jelvény (Tervezet / Aktív beállítás v); első használatkor a
  kérdés (saját név is?) és AUTOMATIKUS AI-javaslat a profilból (`POST beallitas/javaslat` → tervezet; közben „Az AI a beállítást készíti…”); célok chipek; szabad szöveg + „✦
  Beállítás frissítése ebből” (AI-javaslat a szövegből); témák chipek (×, új téma), névváltozatok (az első témáé), területi fókusz, kizárások, megkülönböztetés; források
  csoportokban (kézi / AI-javasolt), állapot-jelvények (ellenőrzés alatt + Ellenőrzés gomb / használható + utolsó feldolgozás / korlátozott / hibás + ok / **nem támogatott** +
  magyarázat), hozzáadás, őszinteségi megjegyzés; ütemezés (kézi / napi + időpont + időzóna szövege), e-mail-megjegyzés; minden változás 800 ms után TERVEZET (a futó figyelést
  nem érinti — 3c); „Mentés és figyelés indítása” → `PUT beallitas` → „Beállítás mentve (v)” vagy „Nincs változás”; hiba → a mezők maradnak; „Próbafuttatás” → 202 → várakozás
  → „A próbafutás elkészült” (a „Megnyitás →” link az E-26-tal). Néző: minden mező letiltva, figyelmeztetés.
- **Gépezet, ami ehhez készült:** a mag `beallitasJavaslatKer` (AI-javaslat tervezetként; aktív verzió mellett az időzítés marad; 4 próba) + `POST /api/hirfigyelo/beallitas/
  javaslat`; a fiókprofil oldalsávján „Modulok → Hírfigyelő”; **migráció 0030**: a modul 173 felirata 3 nyelven (a prototípus `hf-i18n.js` szótárából, `hf.<kulcs>`; a
  prototípus-vezérlők nélkül; „(Európa/Budapest)” → `{tz}` a beállításból; + a hiányzó állapotok szövegei) — a Kimi lektor 60 javaslatából 25 beépítve
  (`docs/E-24-FELIRATOK-LEKTOR.md`; a „Budapest” javaslatai tévesek: az időzóna a beállításból jön).
- **Ellenőrzés:** `hirfigyelo-felulet.proba.ts` (9 élő próba: átirányítások, 3 nyelv, első használat, HF-II, AI-javaslat → tervezet, néző 403, a fiók linkje) — **web 144, mag
  158 zöld**; határőr 197 modul, tokenőr (3 megjelölt kivétel: kör alak, a prototípus vékony mellékcímkéje), tipus. Képernyőképek helyben (Playwright, a teszt-AI-val):
  első használat, beállítás AI-javaslattal, aktív beállítás forrásokkal, áttekintés futás előtt / közben / 10 kártyával, részletpanel, tartalomötlet, elrejtés, szűrő, telefon.
- **Fordított ellenőrzés (DeepSeek, `docs/E-24-FORDITOTT-ELLENORZES-deepseek.md`):** a prototípus minden eleme RENDBEN; a „többlet” lista tételei az elfogadott
  követelményekből jönnek, nem kitalálás: AI-kiesés/keret-kimerülés sáv (D-12, 3c), csonkolt jelzés (3d — a kártyáról levéve, csak a panelen), betöltési/futási/hozzáadási
  hibautak (E-18 elve: hibaút mindenütt), „nem támogatott” forrás (3c), „Nincs változás” (3c), néző figyelmeztetése. Javítva az ellenőrzés nyomán: a „miért” doboz függő
  értékelésnél nem jelenik meg (a prototípus `showWhy`-a), a csonkolt jelzés a panelre került.
- Flotta: 3 DeepSeek építő + 1 Kimi lektor az első körben (a Beállítás építője a 30 000 tokenes válaszban ismétlődő `useState`-sorokba futott → két félre osztva újra, B1 űrlap +
  B2 források/CSS, sikerrel) + 1 DeepSeek fordított ellenőr. Beépítéskor javítva: import-utak, típusnevek ütközése (`Beallitas` komponens vs séma), a chipek `data-be` értéke
  (B1 igen/nem ↔ B2 true/false), a lap 3 oszlopból 2-re (a prototípus szerint), a néző külön rajzolt ága helyett letiltott mezők, a jelvény logikája (aktív + mentetlen →
  Tervezet), a következő futás ideje a beállítás időzónájában, a kártya keretszíne, a betöltés-felirat.
- **Kirakva és kívülről ellenőrizve (2026-09-08 11:45):** migráció 0030; a 9 élő felület-próba a tesztoldal ellen: átirányítások, a lap 3 nyelven, első használat, HF-II,
  néző 403, a fiók linkje — 8 zöld; a 9. (AI-javaslat) **502 `AI_NEM_ELERHETO`**, mert a tesztoldal a Dell AI-ján áll és a Dell nem elérhető — a lap ilyenkor a
  „Az AI-javaslat most nem készült el — a mezőket kézzel is kitöltheted” üzenetet mutatja, minden más működik. A képernyőképek a helyi (azonos) építésből készültek
  (`e24-*.png`, `e25-*.png`): a felhős böngésző a tesztoldalt a proxy miatt nem éri el; Vilmos a saját belépésével nézi meg élőben.

## E-26 — a Finomhangolás képernyő a v7 prototípus szerint (2026-09-08 kora délután)

- **Gépezet, ami hiányzott:** a mag `finomhangolas(k, ktx)` folyamata (a legutóbbi minta és tételei — minta nélkül a visszajelzett találatok —, a visszajelzések, a
  javaslatok, a verziók, a minta lejárata) + `GET /api/hirfigyelo/finomhangolas`; a `javaslatDont` őre: már eldöntött vagy elavult (nem az aktív verzióra épülő)
  javaslatról nem lehet újra dönteni (`ERVENYTELEN_ADAT`) — ezt a tesztelő ágens élő próbája fogta meg; a `javaslatKer` AI-hibái érthető kóddal (429/502). Migráció
  **0031**: a lap kiegészítő feliratai (a minta lejárata — D-12 —, a verziók eredete, a javaslat készülése/hibája, az összehasonlítás hibája). A Finomhangolás fül és a
  Beállítás lap „Megnyitás →” linkje él (`ELERHETO_LAPOK`).
- **A lap** (`/hirfigyelo/finomhangolas`, `Finomhangolas.tsx` + `finomhangolas.css`, 860 px széles, a prototípus HF-III): üres állapot (nincs minta és visszajelzés → link a
  Beállításra); „Próbafutás eredménye — v. beállításváltozattal” + a korlátozott minta megjegyzése; tételek fontosság-jelvénnyel, forrással, címmel, „Fontos nekem” /
  „Nem releváns” chipekkel (a legutóbbi visszajelzés a bekapcsolt), a nem relevánsnál a 4 ok (másik cég / nem ez a téma / túl általános / ismétlődő), „Rögzítve” jelzés;
  2 új visszajelzés után AUTOMATIKUSAN AI-javaslat (jelenlegi szabály tömören, javasolt változtatás = az AI indoklása + a különbség „+ / −” sorai, „ez alapján” a
  visszajelzések száma, várható hatás); Kipróbálom → összehasonlítás ugyanazon a mintán (előrébb / hátrébb / változatlan soronként, a „nem állítunk általános
  javulást” felirattal), Elfogadom → új aktív verzió (`✓ v{n} alkalmazva — az előző visszaállítható`), Elvetem → „a visszajelzések megmaradnak”; lejárt mintánál a D-12
  üzenet és a Kipróbálom letiltva; profilt érintő javaslatnál a profil-érintés doboz + link a fiókra; szabályverziók listája (eredet + idő, aktív jelvény, Visszaállítás
  → új aktív verzió a régi tartalmával). Néző: figyelmeztetés, a gombok letiltva.
- **Ellenőrzés:** `hirfigyelo-finomhangolas.proba.ts` (8 élő próba a teljes folyamatra: minta → visszajelzések (néző 403) → javaslat (másodszor 400) → kipróbálás (404
  rossz id-re) → elfogadás (v2, újra 400) → visszaállítás (v3, 99 → 404) → a lap → elvetés); mag `finomhangolas.proba.ts` (3) — **web 152, mag 158 zöld**; határőr 203
  modul, tokenőr, tipus. Képernyőképek (helyben): üres állapot, minta, ok-választó, AI-javaslat, összehasonlítás, elfogadva (v2 aktív, v1 visszaállítható), telefon.
- Flotta: 1 DeepSeek építő + 1 DeepSeek tesztelő párhuzamosan. Beépítéskor javítva: a kizárások típusa (szöveg, nem objektum), a `page.tsx` (a tesztelő kitalált
  segédfüggvényeket használt — a Beállítás lap mintájára újraírva), a szerep típusa, a verziók ideje a felület nyelvén, az automatikus javaslatkérés effektje (a saját
  állapotváltozása szakította meg a kérést → ref-őr), a chip stílusa a prototípus szerint; a tesztelő kitalált beállítás-sémája és meghívó-útvonala (nincs ilyen; SQL-lel,
  mint a többi próba), az `eredet` értékek (`ai_javaslat`, nem `javaslat` — az én API-lapom hibája), a `PROBA_CIM` használata.
- **Élő ellenőrzés kívülről (első kör) és javítás:** a tesztoldalon (a Dell AI-jával, amely közben visszatért) a folyamat: futás → minta 10 tétellel → 2 visszajelzés →
  **AI-javaslat 200** (a Dell válaszolt) → **kipróbálás 504**: a javaslat kipróbálása a minta minden cikkére egy AI-hívás, valódi AI-val > 60 mp → a kérés lejárt
  (ugyanaz, mint az E-20 futásánál). Javítás: a kipróbálás is a háttérbe (E-22 sor, `kiprobal` fajta): a POST 202 + tétel, az eredmény (`osszehasonlitas`) a tétel
  `eredmeny`-ében, a lap `varjSor`-ral várja (a pörgő „Összehasonlítás ugyanazon a mintán…” addig látszik); a javaslat léte és a minta lejárata azonnal ellenőrzött
  (404 / 409). Elfogadás 200 (v2), újra 400, visszaállítás 200 (v3, `visszaallitas`), a lap 200. Kirakva második körben — a „nem egymás után” szabály kivétele: hibajavítás
  mérés után, naplózva.
- **Kirakva a javítás és kívülről ellenőrizve (2026-09-08 14:05, a Dell AI-jával — a Dell közben visszatért):** futás → minta 10 tétellel → 2 visszajelzés → AI-javaslat 200
  (a Dell készítette, 11 mp) → kipróbálás **202 → a tétel 71 mp alatt `kesz`**, 6 összehasonlító sor → elfogadás 200 (v2) → újra 400 → visszaállítás 200 (v3) → a lap 200.
  Mérés az `ai_hivas`-ból: relevancia a Dellen **6,5 mp/cikk** (40 ok), **9 válasz `AI_ROSSZ_VALASZ`** (üres/csonka válasz — a 300 tokenes kimeneti korlát az összefoglalóval
  együtt kevés; 700-ra emelve, a következő kirakással megy — H-10 része).

## E-27 — az 5. szakasz zárása (2026-09-08 délután)

- **`docs/OTODIK-SZAKASZ-ZARAS.md`**: a 12 elfogadási feltétel mérve (hol, mivel), a szerkezet az ALAPTERV ellen (3 eltérés — döntés következménye, a terv
  hozzáigazítása Vilmosra vár), ágensköltség, nyitott kérdések.
- **H-10 a Dellen** (`docs/E-27-H10-MERES.md`): a mérőkészlet 12 cikkén fontosság 8/12, témacímke 7/12; 8 cikkpáron esemény-egyezés 8/8; 4,9 ill. 1,8 mp. Az
  ellenőr ágens mérőszkriptje az Ollama burkát (`message.content`) nem bontotta ki → minden válasz „hiba” volt; javítva a beépítéskor. A beágyazott utasítást a modell
  nem hajtja végre, de az indoklásban megemlíti — a relevancia-prompt v3 (tiltás) után is; szépséghiba, nem biztonsági rés (rögzítve H-2-nél).
- **H-11 helyben** (keret 0): 10 találat `keret_kimerult`, a sáv és a „…” jelvények (kép `e27-h11-keret-kimerult.png`); javítva közben: értékeletlen kártyán nem jelenik
  meg témacímke (a „Tartalomötlet-forrás” ál-címke ment). **H-5 helyben**: a Theme API-n átállított szín/lekerekítés/címbetű a hírfigyelő lapján (kép `e27-h5-tema-orokles.png`).
- **Fordított ellenőrzés E-26** (`docs/E-26-FORDITOTT-ELLENORZES-deepseek.md`): 3 javítás beépítve — a javaslat doboza csak KÉSZ javaslattal (a készülés/hiba keret
  nélküli üzenet), a verziók növekvő sorrendben (mint a prototípus), visszaállítás után a javaslat állapota alaphelyzetbe; a profil-érintés doboz feltétele
  (csak `profil_erintett`) szándékos — a követelmény szerint a közös profilt érintő javaslatnál jön.
- Ebben a kirakásban: a relevancia kimeneti korlátja 700 token, a relevancia-prompt v3, a témacímke-jelvény javítása, a Finomhangolás 3 javítása, a mérőszkript.
- **Kirakva és kívülről ellenőrizve (2026-09-08 15:20, a Dell AI-jával):** a teljes finomhangolási kör: javaslat 200 (4,8–12,9 mp), kipróbálás 202 → 73 mp alatt kész,
  **10/10 összehasonlító sor** (a 700 tokenes korlát után nincs üres válasz: 23/23 hívás sikeres, relevancia 6,7 mp/cikk), elfogadás v2, újra 400, visszaállítás v3, a lap 200.
  A 9 felület-próba a tesztoldalon: 8 zöld + 1 „eltérés”, ami nem hiba: az AI-javaslat első témája a valódi AI-nál a szabad szövegből jön („Helyi közlekedés”), a próba a
  teszt-csatlakozó viselkedését (a profil neve) várta — a próba a teszt-csatlakozóra szól, a valódi AI-val a válasz helyes.
