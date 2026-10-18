# F-4 · Építő — a Saját fiók gépezete (`apps/web`), képernyő nélkül

CÉL: a belépett ember a SAJÁT fiókját kezelheti három végponton: jelszóváltás a jelenlegi jelszó megadásával, a név módosítása,
kiléptetés minden más eszközről. Az e-mail-cím ZÁRVA (nincs rá végpont), fióktörlés NINCS. Képernyő nincs (a rajz hiányzik) — csak gépezet.

FORRÁS: a mellékelt `hitelesites/index.ts` (regisztráció, belépés — a jelszó `argon2` `hash`/`verify`; a munkamenet-tábla; a
`kilep()`), `hitelesites/suti.ts` (`munkamenetTokenKeresbol(keres)` — a KÉRÉS aktuális tokenje), `app/api/_kapu.ts` (a szintek),
`app/api/fiok/en/route.ts` (végpont-stílus a fiókhoz), `packages/contracts/src/index.ts` (a `HibaKod`, a `Jelszo`, `Nev` sémák),
`adatbazis/migraciok/0045_meghivo.sql` (a feliratok migráció-stílusa).

MIT CSINÁLJ:
1. `packages/contracts/src/index.ts` — a `HibaKod` bővül: `"ROSSZ_JELENLEGI_JELSZO"` (a jelenlegi jelszó nem stimmel). Új sémák:
   `JelszoValtasKeres = z.object({ jelenlegi: z.string().min(1).max(200), uj: Jelszo })`, `NevModositasKeres = z.object({ nev: Nev })`.
   Csak ezeket a sorokat add vissza `=== FÁJL: packages/contracts/src/index.RESZLET.ts ===` blokkban, a beszúrás helyének megjelölésével.
2. `apps/web/hitelesites/sajat.ts` (ÚJ) — három függvény, az `index.ts` `Eredmeny<T>` és `hibaEredmeny` mintájára (importáld onnan, amit lehet):
   - `jelszotValt(fiokId, be: unknown, aktualisToken: string): Promise<Eredmeny<{ masEszkozokKileptetve: number }>>` —
     rövid `uj` → `GYENGE_JELSZO` (a regisztráció mintájára a séma előtt); séma → `ERVENYTELEN_ADAT`; a fiók hash-ét `verify`-jal a
     `jelenlegi`-vel → ha nem stimmel `ROSSZ_JELENLEGI_JELSZO`; új hash mentése; **a fiók MINDEN MÁS munkamenete törlődik** (a mostani
     token lenyomata marad) — visszaadja, hányat törölt. Egy tranzakcióban.
   - `nevetModosit(fiokId, be: unknown): Promise<Eredmeny<{ nev: string }>>` — séma → `ERVENYTELEN_ADAT`; a `fiok.nev` frissül.
   - `masEszkozoketKileptet(fiokId, aktualisToken: string): Promise<{ torolt: number }>` — a fiók minden munkamenete törlődik, kivéve a mostanit.
   A tokenből a lenyomat: `createHash("sha256").update(token).digest("hex")` (ahogy a `kilep()` teszi).
3. Végpontok (`kapu(keres, "belepett")`, `export const dynamic = "force-dynamic"`, siker `{ fiok: … }`, hiba `{ hiba }` a `_kozos` `hiba/valasz`
   mintájára — a `fiok/en/route.ts` szerint):
   - `PUT apps/web/app/api/fiok/jelszo/route.ts` — törzs `JelszoValtasKeres`; hibák: GYENGE_JELSZO 400, ERVENYTELEN_ADAT 400, ROSSZ_JELENLEGI_JELSZO 400; siker 200 `{ fiok: { masEszkozokKileptetve } }`.
   - `PUT apps/web/app/api/fiok/nev/route.ts` — törzs `NevModositasKeres`; siker 200 `{ fiok: { nev } }`.
   - `POST apps/web/app/api/fiok/kileptetes-mindenhol/route.ts` — siker 200 `{ fiok: { torolt } }`.
4. `apps/web/adatbazis/migraciok/0047_sajat_fiok_feliratok.sql` — feliratok három nyelven, `ON CONFLICT DO UPDATE`:
   `fiok.hiba_rossz_jelenlegi_jelszo` (hu: „A jelenlegi jelszó nem stimmel." + ro, en), `fiok.jelszo_valtas_ok` („A jelszavad megváltozott.
   A többi eszközön ki lettél léptetve."), `fiok.nev_ok` („A neved megváltozott."), `fiok.kileptetes_ok` („A többi eszközön ki lettél léptetve."),
   `fiok.email_zarva` („Az e-mail-címed nem módosítható: ez a fiókod kulcsa. Ha új címre van szükséged, a munkatér tulajdonosa új meghívót ad."),
   `fiok.torles_nincs` („Fiók törlése nincs: a munkád a munkatérben marad, ha kilépsz belőle.").
5. `apps/web/probak/jogosultsag.VEGPONTOK.RESZLET.ts` — a három módosító végpont sora a mátrixba (mind `belepett`; a `kileptetes-mindenhol`
   `kulon: true`, mert a mátrix körében a szereplőket kiléptetné — külön próbája a tesztelő fájljában lesz; a `jelszo` törzse
   `{ jelenlegi: "x", uj: "ProbaJelszo123!" }` — a jogot nem kerüli meg, a sémán átmegy; a `nev` törzse `{ nev: "X" }`).

HATÁR: az itt felsorolt fájlok. A `_kapu.ts`-hez, a meglévő végpontokhoz, a `sema.ts`-hez NEM nyúlsz (nincs új tábla).
KÉSZ, HA: `pnpm --filter web tipus` zöld; a végpontok a fenti státuszokat adják.
TILOS: e-mail-módosító végpont; fióktörlés; a jelszó vagy a token naplózása; `any`.
Visszaadás: a fájlok teljes tartalommal (a RESZLET-ek részletként), külön `=== FÁJL: … ===` blokkban.
