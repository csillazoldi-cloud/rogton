# F-5 · Építő — az eseménynapló, az értesítés két szintje és az AI-kapcsoló a webalkalmazásban (`apps/web`)

CÉL: a `@km/esemeny-core` (a mellékelt SZERZŐDÉS szerint; a csomagot párhuzamosan más írja — a bejárata `@km/esemeny-core`) él a
webalkalmazásban: `esemeny` és `ertesites_beallitas` táblák, a portok Postgres-megvalósítása, a meglévő jelek bekötése, kimenő csatorna
(webes horog, a címe környezeti változóból), végpontok; ÉS a szervezetenkénti AI-kapcsoló minden AI-hívás előtt érvényesítve. Képernyő NINCS.

FORRÁS: a szerződés; a minták: `apps/web/hozzaferes/tar.ts` + `index.ts` (tár- és környezet-stílus), `apps/web/app/api/tagok/route.ts` (végpont-stílus,
`kapu`), `apps/web/adatbazis/sema.ts` RÉSZLETE (a `meghivo` tábla: pgTable + pgPolicy + enableRLS), `apps/web/adatbazis/migraciok/0045_meghivo.sql`
(migráció-stílus, RLS), `apps/web/ai/index.ts` (a `keretEllenoriz` — ide jön az AI-kapcsoló), `apps/web/hirfigyelo/index.ts` (az `esemeny` port ma
konzolra ír), `apps/web/hitelesites/index.ts` (belépés/kilépés), `apps/web/hozzaferes/index.ts` (a hozzáférés eseménye ma konzolra ír).

MIT CSINÁLJ:
1. `sema.ts` RÉSZLET (`=== FÁJL: apps/web/adatbazis/sema.esemeny.RESZLET.ts ===`): `esemeny` tábla (id uuid pk; szervezet_id uuid NULL → szervezet cascade;
   fajta text; sulyossag text; fiok_id uuid NULL → fiok set null; ido timestamptz; adat jsonb) — RLS: a szervezetes sorok `szervezet_id = aktualisSzervezet`,
   a rendszer-sorok (NULL) csak a `km_tulaj`-nak (a km_app-nak NEM — a rendszer-naplót a rendszergazda a `gazda_esemenyek()` SECURITY DEFINER függvényen át olvassa);
   `ertesites_beallitas` (szint text 'kozos'|'szervezeti'; szervezet_id uuid NULL; adat jsonb; frissitve; PK (szint, coalesce(szervezet_id, '00000000-…')) — vagy
   egyedi index a párra); a `szervezet` tábla ÚJ oszlopa: `ai_engedelyezve boolean not null default true`.
2. `migraciok/0048_esemeny_ertesites_ai.sql` — a fenti táblák, szabályok, a `gazda_esemenyek(limit int)` függvény (`SECURITY DEFINER`, `GRANT EXECUTE TO km_app`),
   az `ALTER TABLE szervezet ADD COLUMN ai_engedelyezve boolean NOT NULL DEFAULT true`, és a feliratok 3 nyelven: az `esemeny.<fajta>_cim` és `_szoveg` a
   szerződés 2. pontjának MIND a 21 fajtájára (rövid, emberi mondatok; a szöveg a `{kulcs}` helyekkel az `adat` értékeire, pl. `{email}`, `{szerep}`, `{uj_talalatok}`),
   plusz `ai.kikapcsolva` („Ennél a munkatérnél az AI ki van kapcsolva — a tulajdonos kapcsolhatja vissza a beállításokban.”) és `ai.kapcsolo_be`/`ai.kapcsolo_ki`.
3. `apps/web/esemeny/tar.ts` (a két tár Postgresszel; `rendszerLista` a függvényen át), `apps/web/esemeny/index.ts`: `esemenyKornyezet()` — `ora`, `azonosito`
   (`randomUUID`), `csatorna`: ha `process.env.ERTESITES_WEBHOOK_URL` van, `fetch(url, { method: "POST", body: JSON.stringify(uzenet) })` 5 mp-es időkorláttal,
   különben `{ ok: false, hiba: "NINCS_CSATORNA" }` (semmi nem megy ki); `felirat`: a kiszolgálói feliratbetöltő (nézd meg az `apps/web/nyelv/index.ts`-t — az
   angol tartaléknyelvvel). ÉS egy kényelmi: `feljegyezHatterben(e)` — a `feljegyez` hívása `void`-dal, a hibát csak naplózza (a jelek bekötése ezt hívja, hogy egy
   naplóhiba soha ne állítsa meg az eredeti műveletet).
4. A jelek bekötése (mindegyik `feljegyezHatterben`): `hitelesites/index.ts` `belep()` siker → `belepes` (adat: {}), `kilep()` → `kilepes`;
   `hitelesites/sajat.ts` → `jelszo_valtas`, `kileptetes_mindenhol`; `hozzaferes/index.ts` esemény-kimenete → a hozzáférés 7 fajtája (fajta azonos név);
   `hirfigyelo/index.ts` esemény-kimenete → `futas_indult`/`futas_kesz`/`futas_hiba`/`keret_kimerult` (a `mentes_hiba` → `futas_hiba` adat.reszlet-tel);
   `tema/index.ts` alkalmazás → `tema_alkalmazva`; `feliratok` alkalmazás → `feliratok_alkalmazva` (keresd meg az alkalmazó függvényt); az onboarding jóváhagyás →
   `profil_jovahagyva` (keresd meg). CSAK a hívás sorát add hozzá — a meglévő logikát nem írod át; ezekhez a fájlokhoz `=== FÁJL: …RESZLET… ===` blokkban a
   beszúrandó sorokat add, a hely megjelölésével (a teljes fájlt NE add vissza).
5. Az AI-kapcsoló: `apps/web/ai/index.ts` `keretEllenoriz(szervezetId)` ELEJÉN: ha a szervezet `ai_engedelyezve` hamis → `throw new AiKozosHiba("AI_KIKAPCSOLVA")`
   (az `AiKozosHiba.kod` típusa bővül); a `contracts` `HibaKod`-ja bővül `"AI_KIKAPCSOLVA"`-val (RESZLET). Ahol a végpontok az `AI_KERET_KIMERULT`-et 429-re fordítják,
   az `AI_KIKAPCSOLVA` 409 legyen — keresd meg a fordítás helyét (`grep AI_KERET_KIMERULT apps/web/app`), és RESZLET-ként add a bővítést.
6. Végpontok (`kapu`, `dynamic`, siker `{ esemeny: … }` ill. `{ beallitas: … }`, hiba `{ hiba }`):
   - `GET apps/web/app/api/esemenyek/route.ts` — szint `tag`; `?fajta=&limit=` → `naplo()`.
   - `GET apps/web/app/api/esemenyek/rendszer/route.ts` — szint `rendszergazda`; `tar.rendszerLista`.
   - `GET/PUT apps/web/app/api/ertesites/route.ts` — GET szint `tag` → `ertesitesLekerdez`; PUT szint `tulajdonos` → `ertesitesSzervezetiMent`.
   - `PUT apps/web/app/api/ertesites/kozos/route.ts` — szint `rendszergazda` → `ertesitesKozosMent`.
   - `GET/PUT apps/web/app/api/beallitas/ai/route.ts` — GET szint `tag` → `{ beallitas: { ai_engedelyezve } }`; PUT szint `tulajdonos`, törzs `{ engedelyezve: boolean }`
     → a szervezet oszlopa frissül `szervezetKent` alatt, és `ai_kapcsolo_valtozott` esemény (adat: { engedelyezve }).
7. `apps/web/probak/jogosultsag.VEGPONTOK.RESZLET.ts` — a módosító végpontok (PUT ertesites, PUT ertesites/kozos, PUT beallitas/ai) sorai `fajl`-lal.
8. `apps/web/package.json` — dependency `@km/esemeny-core`.

HATÁR: az itt felsorolt fájlok; a `packages/` mappához nem nyúlsz; a `_kapu.ts`-hez nem. KÉSZ, HA: `pnpm --filter web tipus` zöld. TILOS: titok az `adat`-ban
(jelszó, jegy, süti, kulcs — az `email` sem kerül az adatba, csak a `fiok_id`); a horog címének naplózása; `any`.
Visszaadás: az új fájlok teljes tartalommal; a meglévők RESZLET-blokkokban (beszúrandó sorok + hely).
