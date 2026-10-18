# Feladat — ÉPÍTŐ A (E-20): a Hírfigyelő tárolása és API-ja a webalkalmazásban (`apps/web`)

Mellékelve: a szerződés (`HIRFIGYELO-SZERZODES.md`, főleg 2.10–2.12), a mag `tar.ts` (a `HirfigyeloTar` interfész és a memóriatár
mintája), `folyamat.ts` (a folyamatok — ezeket HÍVOD, nem írod újra), `host.ts`; a webalkalmazás mintái: `sema.ts` részlete (RLS-es
tábla), `kapcsolat.ts` (`db`, `szervezetKent`), `tema-tar.ts` + `tema-index.ts` (egy tár és a szolgáltatásréteg mintája), `api-tema-_kozos.ts` +
`api-tema-route.ts` (API-útvonal minta), `hitelesites-index.ts` részlete (`FiokNezet`, szerepek), `profil-index.ts` (`profilBetolt`),
`0021_feliratok_ket_szintje.sql` (kézzel írt migráció minta RLS-sel). Az AI-hívót és a letöltőt ÉPÍTŐ B készíti
(`apps/web/hirfigyelo/ai.ts` → `export function aiHivo(szervezetId: string): AiHivo`, `apps/web/hirfigyelo/letolto.ts` → `export const letolto: Letolto`)
— te ezeket IMPORTÁLD (a fájlnevek és a szignatúrák rögzítettek), ne írd meg.

Készítsd el:
1. `apps/web/adatbazis/sema.ts` KIEGÉSZÍTÉSE (add vissza csak az ÚJ táblákat egy `=== FÁJL: apps/web/adatbazis/sema-hirfigyelo.ts ===` blokkban;
   én beillesztem): `hf_beallitas_verzio` (szervezet_id, verzio, allapot, eredet, beallitas jsonb, letrehozva; PK (szervezet_id, verzio); egyedi
   részindex az aktívra), `hf_tervezet` (szervezet_id, fiok_id, beallitas jsonb, frissitve; PK (szervezet_id, fiok_id)), `hf_forras` (id uuid PK,
   szervezet_id, cim, tipus, eredet, allapot, ellenorzott, utolso_sikeres, hiba_ok), `hf_futas` (id uuid PK, szervezet_id, szabaly_verzio,
   kezdet, veg, allapot, uj_talalatok, hibas_forrasok jsonb, proba), `hf_kivonat` (id uuid PK, szervezet_id, forras_id, cim, url, kanonikus_url,
   megjelenes, begyujtes, szoveg, csonkolt, ujjlenyomat, nyelv, lejar; **egyedi (szervezet_id, kanonikus_url)** — ez az A-10 gépezete),
   `hf_esemeny` (id, szervezet_id, fo_talalat_id, talalat_ids jsonb, letrehozva), `hf_talalat` (id uuid PK — a kivonat azonosítója —, szervezet_id,
   esemeny_id, kivonat_id, ertekeles jsonb null, ertekeles_allapot, megtekintes, jeloles, letrehozva, futas_id), `hf_visszajelzes`, `hf_javaslat`
   (javasolt jsonb, mi_alapjan jsonb, …), `hf_minta` (talalat_ids jsonb, lejar). MINDEN tábla: `szervezet_id` hivatkozás a `szervezet`-re
   (cascade), `pgPolicy(..., to: "km_app", using/withCheck: szervezet_id = aktualisSzervezet)`, `.enableRLS()` — mint a minta.
2. `apps/web/adatbazis/migraciok/0027_hirfigyelo_tablak.sql` — kézzel írt SQL ugyanezekre (CREATE TABLE, indexek, `ALTER TABLE … ENABLE ROW
   LEVEL SECURITY`, `CREATE POLICY … TO km_app USING (szervezet_id = current_setting('app.szervezet_id')::uuid) WITH CHECK (…)`, GRANT a
   km_app-nak — pontosan a 0021 mintája szerint).
3. `apps/web/hirfigyelo/tar.ts` — `export function postgresTar(): HirfigyeloTar` — MINDEN metódus `szervezetKent(szervezetId, tx => …)` alatt;
   a jsonb mezők a mag zod-sémáival parse-olva olvasáskor; `kivonatMent` → `INSERT … ON CONFLICT (szervezet_id, kanonikus_url) DO NOTHING`
   + a beszúrt sorok száma alapján `"uj" | "letezik"`; `lejartKivonatokTorol` → DELETE WHERE lejar < most (a találat és az esemény marad —
   csak a szöveg tűnik el; a talalat.kivonat_id megmarad, a `kivonatok()` egyszerűen nem adja vissza).
4. `apps/web/hirfigyelo/index.ts` — `export async function kornyezet(szervezetId: string): Promise<Kornyezet>` (tar: `postgresTar()`, letolto,
   ai: `aiHivo(szervezetId)`, profil: `await profilBetolt(szervezetId)` (null → `{}`), idAdo: `crypto.randomUUID`, most: `() => new Date()`,
   esemeny: `console.log` egy sorban); `export function hostKontextus(fiok: FiokNezet, szervezetId: string): HostKontextus | null` (a fiók
   szerepe a szervezetben → `szerep`; ha nincs tagság, null).
5. API-útvonalak (`apps/web/app/api/hirfigyelo/…`, mind `export const dynamic = "force-dynamic"`, a `_kozos.ts` mintája szerint saját
   `apps/web/app/api/hirfigyelo/_kozos.ts`-szel: `belepettSzervezet`, `hiba`, `valasz`, és `eredmenyValasz` a mag `Hiba` kódjaira:
   `NINCS_JOG`→403, `NINCS_BEALLITAS`→409, `FUT_MAR`→409, `ERVENYTELEN_ADAT`→400 (+ `hibak`), `NINCS_ILYEN_VERZIO`→404,
   `NINCS_ILYEN_JAVASLAT`→404, `MINTA_LEJART`→409; siker: `{ hirfigyelo: … }`):
   - `attekintes/route.ts` GET → `attekintes`
   - `beallitas/route.ts` GET (verziók + a hívó tervezete) / PUT (`beallitasMent(…, "kezi")`) ; `beallitas/tervezet/route.ts` PUT/DELETE (`tervezetMent`)
   - `beallitas/visszaallit/route.ts` POST `{ verzio }`
   - `forrasok/route.ts` GET / POST `{ cim }` (`forrasHozzaad(…, "kezi")`) ; `forrasok/[id]/ellenoriz/route.ts` POST
   - `futas/route.ts` POST `{ proba?: boolean }` (`figyelesFuttat` — SZINKRON, a válasz a futás; E-22 teszi háttérbe) / GET (futások listája)
   - `ertekeles-ujra/route.ts` POST
   - `talalatok/[id]/megtekint/route.ts` POST ; `talalatok/[id]/jelol/route.ts` POST `{ jeloles }`
   - `visszajelzes/route.ts` POST (a `Visszajelzes` sémája szerinti törzs, az `id`-t és a `letrehozva`-t a kiszolgáló adja)
   - `javaslat/route.ts` POST (`javaslatKer`) ; `javaslat/[id]/kiprobal/route.ts` POST ; `javaslat/[id]/dont/route.ts` POST `{ dontes }`
   - `osszkep/route.ts` GET
   A `[id]` útvonalaknál a Next 16 `params` `Promise` (`const { id } = await ctx.params`). Minden útvonal: belépés (401), szervezet (409 `NINCS_JOG`),
   `hostKontextus`, `kornyezet`, a mag függvénye, `eredmenyValasz`; `try/catch` → 500 `BELSO_HIBA` (a mintában így).
6. `packages/contracts/src/index.ts` `HibaKod` bővítése: `NINCS_BEALLITAS`, `FUT_MAR`, `NINCS_ILYEN_JAVASLAT`, `MINTA_LEJART`, `NINCS_ILYEN_FORRAS`
   (add vissza csak az enum blokkot `=== FÁJL: contracts-hibakod-reszlet.ts ===` néven).

Szabályok: TypeScript 7 + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`; a mag csak a `@km/news-monitor-core` bejáratán át; a
tár SOHA nem kap szervezet nélküli hívást; nincs `any`. Magyar nevek és megjegyzések. Add vissza az ÖSSZES fájlt külön blokkban.
