Te egy TypeScript fejlesztő vagy egy meglévő Next.js alkalmazásban (Postgres, drizzle, sorszintű védelem). A feladat: a
„heti haladás” számláló gépezete a Tibor-szabálylap T8-hoz: „Ezen a héten: N poszt kész · M kép letöltve”.

A MELLÉKLETEK: `sema.ts` (részlet: a kep_pelda tábla mintája), `0124_kep_pelda.sql` (migráció-minta sorszintű védelemmel),
`route.ts` (egy meglévő API-útvonal mintája: kapu, valasz), `poszt-index.ts` (a posztmunka; a `szovegek` jsonb cellák,
cellánként `allapot` és `veglegesitve` ISO-időbélyeg), `Kitolto-reszlet.tsx` (a Képek kitöltő letöltése: `fajlba()`).

ÍRD MEG, fájlonként teljes tartalommal (=== FÁJL: út === … === FÁJL VÉGE ===), KIVÉVE a 4. pontot (CSERE-blokk):

1. `apps/web/adatbazis/migraciok/0130_halad.sql` — új tábla `halad_esemeny`: id uuid PK default gen_random_uuid(), szervezet_id uuid
   NOT NULL (FK szervezet, ON DELETE cascade), fajta text NOT NULL CHECK (fajta IN ('kep_letoltve')), ido timestamptz NOT NULL
   DEFAULT now(); index (szervezet_id, ido); GRANT SELECT, INSERT TO km_app; RLS + policy pontosan a 0124 mintájára
   („halad_esemeny_sajat_szervezet”). Mindenhol IF NOT EXISTS / DROP ... IF EXISTS, hogy újrafuttatható legyen.
   A statement-breakpoint jelölést úgy használd, ahogy a minta.

2. `apps/web/halad/index.ts` — `import "server-only";` majd:
   - `export async function kepLetoltesFeljegyez(szervezetId: string): Promise<void>` — egy sor a halad_esemeny táblába
     (`szervezetKent(szervezetId, tx => tx.insert(...))` — az `szervezetKent` a `../adatbazis/kapcsolat`-ból jön, a sémát
     `sema.haladEsemeny`-ként éred el: `import { sema, szervezetKent } from "../adatbazis/kapcsolat";`).
   - `export async function hetiHalad(szervezetId: string, most = new Date()): Promise<{ poszt_kesz: number; kep_letoltve: number; het_kezdete: string }>`
     A hét hétfő 00:00-tól számít, Europe/Bucharest időzónában (Intl.DateTimeFormat-tal számold ki, külső könyvtár nélkül).
     poszt_kesz: a szervezet poszt_munka sorainak szovegek cellái közül azok, amelyeknek `allapot === "vegleges"` és a
     `veglegesitve` a héten belül van (a sorokat szervezetKent-tel olvasd, a jsonb-t JS-ben szűrd).
     kep_letoltve: a halad_esemeny sorok száma a héten (fajta = 'kep_letoltve').

3. `apps/web/app/api/halad/route.ts` — GET (kapu "tag") → `valasz({ halad: await hetiHalad(e.szervezet.id) })`;
   POST (kapu "szerkeszto") → törzs `{ fajta: "kep_letoltve" }` (zod), különben 400 `{hiba:"ERVENYTELEN_ADAT"}`;
   siker → `kepLetoltesFeljegyez`, 204. `export const dynamic = "force-dynamic";` Hibánál 500 `{hiba:"BELSO_HIBA"}` és console.error.
   A `valasz` és `hiba` segédet ne importáld máshonnan: használd `Response.json(...)`-t, `cache-control: no-store` fejléccel.

4. `apps/web/adatbazis/sema.ts`-hez EGY CSERE-blokk (### CSERE 1 / --- RÉGI / --- ÚJ / --- VÉGE): a kep_pelda tábla definíciója
   UTÁN add hozzá a `haladEsemeny` táblát ugyanabban a stílusban (pgTable, index, pgPolicy, enableRLS).
   A RÉGI blokk a kep_pelda definíciójának utolsó sora legyen a mellékletből, betűre.

5. `Kitolto.tsx`-hez EGY CSERE-blokk: a `fajlba` függvény `a.remove();` sora után hívd meg (tűz-és-felejtsd):
   `void fetch("/api/halad", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fajta: "kep_letoltve" }) }).catch(() => {});`

Új szöveg a képernyőre NEM kerül. Magyar megjegyzéseket írj, röviden.
