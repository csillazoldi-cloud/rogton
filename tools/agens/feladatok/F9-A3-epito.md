# Feladat — ÉPÍTŐ (F9-A3): futás-számláló a sorban — a futás közben látszó valódi számok (oldalak · cikkek · átnézve)

TypeScript 7 strict, zod 4.5, Next.js 16, React 19, drizzle-orm. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`, nincs beégetett szín/betű/méret — csak a meglévő CSS-osztályok. Felirat CSAK kulcsból, három nyelven. Magyar azonosítók és megjegyzések. A mag (`packages/news-monitor-core`) tiszta: nincs benne hálózat, tárolás.

Két fajta kimenet: TELJES fájl; RÉSZLET-fájl (`_RESZLET-….md`) CSERE-blokkokkal a nagy fájlokhoz:
```
### CSERE 1
--- RÉGI
<a mellékelt fájlból SZÓ SZERINT kimásolt, egyedi sorok>
--- ÚJ
<az új sorok>
--- VÉGE
```
A RÉGI blokknak betűre egyeznie kell, és csak egyszer szabad előfordulnia.

## MÉRT tények (2026-09-14/15)

- `GET /api/hirfigyelo/futas/sor/<id>` futás közben csak `allapot: "fut"`-ot ad, `eredmeny` null — a lap 3 mp-enként kérdez (`varjSor` a `_kozos/kliens.ts`-ben), de nincs mit mutatnia; a Hírek lapon „A gyűjtés fut…”, a beállítás lapon „Próbafutás folyamatban…” áll számok nélkül.
- A futás a magban (`figyelesFuttat`, mellékelt részlet): forrásonként `k.letolto(f)` (siker vagy `forras_hiba`), cikkenként kivonat (`ujKivonatok`), majd értékelés egyenként (`for (let i = 0; i < ertekelesSzam; i++)` … `k.ai("hf_relevancia", …)`). A `Kornyezet` típusban van `esemeny?:` visszahívó (mellékelve a `host.ts` részlete).
- A futtató (`apps/web/hirfigyelo/futtato.ts`, `feldolgoz(tetel)`) a `kornyezet(...)`-ből kapja a `k`-t, és a `figyelesFuttat(k, ktx, …)`-ot hívja; a sor sora a `hf_sor` tábla (`sema.hfSor`: id, szervezetId, fajta, adat, allapot, kiserlet, letrehozva, kezdve, vege, hibaOk, eredmeny). A `sor.ts` `sorTetelParse` alakítja a sort `SorTetel`-lé; `lezar`/`hibara` ír a sorra (`db().update(sema.hfSor).set(…).where(eq(sema.hfSor.id, id))` mintával).

## Mit kell megírni

### 1. TELJES: `packages/news-monitor-core/src/host.ts` (mellékelve)
Új exportált típus:
```ts
/** F9-A3: a futás haladása — a host a sor tételébe írja, a képernyő ezt mutatja. */
export type FutasHaladas = { forrasok_letoltve: number; forrasok_osszes: number; cikkek_talalt: number; cikkek_ertekelve: number; cikkek_ertekelendo: number };
```
Más nem változik.

### 2. RÉSZLET: `_RESZLET-folyamat.md` (a mellékelt `folyamat.ts` részlethez)
- CSERE 1: a `Kornyezet` típusban az `esemeny?: (e: HirfigyeloEsemeny) => void;` sor UTÁN: `  /** F9-A3: a futás haladása forrásonként és értékelésenként; a host tárolja, a képernyő mutatja. */\n  haladas?: (h: FutasHaladas) => void | Promise<void>;`
- CSERE 2: az importban (`import type { AiHivo, HirfigyeloEsemeny, HostKontextus } from "./host";`) a `FutasHaladas` is.
- CSERE 3: a `let datumNelkul = 0; …` sor UTÁN egy segéd: `  let forrasokLetoltve = 0; // F9-A3\n  const haladas = async (cikkekErtekelve: number, cikkekErtekelendo: number) => { await k.haladas?.({ forrasok_letoltve: forrasokLetoltve, forrasok_osszes: hasznalhatoForrasok.length, cikkek_talalt: ujKivonatok.length, cikkek_ertekelve: cikkekErtekelve, cikkek_ertekelendo: cikkekErtekelendo }); };`
- CSERE 4: a forrás-ciklusban a `const letoltes = await k.letolto(f);` sor UTÁN: `    forrasokLetoltve += 1;` — és a ciklus VÉGÉN (a belső cikk-ciklus záró `}` után, még a forrás-ciklus `}` előtt): `    await haladas(0, 0);` (a hibás forrásnál a `continue` előtt is: `forrasokLetoltve += 1; await haladas(0, 0);` — a RÉGI blokk: `      futas = futasAtmenet(futas, { fajta: "forras_hiba", forras_id: f.id, ok: letoltes.hibaOk }, most);`).
- CSERE 5: az értékelő ciklusban, a `const ertekelesSzam = Math.min(ujTalalatok.length, HF_NAPI_CIKK);` sor UTÁN: `  await haladas(0, ertekelesSzam);` — és minden értékelés UTÁN (a ciklus törzsének végén, az `await k.tar.talalatMent(szervezetId, talalat);` sora után, ami az értékelés mentése — a mellékelt részletből azonosítsd a ciklus utolsó mentését, és azt a sort SZÓ SZERINT másold a RÉGI blokkba): `    await haladas(i + 1, ertekelesSzam);`
Ha egy RÉGI blokk a mellékelt részletben nem egyértelmű (több helyen áll), válassz bővebb, egyedi környezetet (több sort).

### 3. TELJES migráció: `apps/web/adatbazis/migraciok/0078_f9_a3_sor_haladas.sql`
Fejléc `-- F9-A3: a futás haladása a sor tételén; a haladás mondata`. `ALTER TABLE "hf_sor" ADD COLUMN IF NOT EXISTS "haladas" jsonb;--> statement-breakpoint` majd feliratok (`INSERT INTO "felirat" … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();`):
- `hf.futas_haladas`: hu „{f}/{m} oldal · {c} cikk · {e} átnézve” · ro „{f}/{m} site-uri · {c} articole · {e} evaluate” · en „{f}/{m} sites · {c} articles · {e} reviewed”

### 4. RÉSZLET: `_RESZLET-sema.md` (a mellékelt sema-részlethez): a `hfSor` táblában az `eredmeny: jsonb("eredmeny"),` sor UTÁN `    haladas: jsonb("haladas"), // F9-A3`.

### 5. TELJES: `apps/web/hirfigyelo/sor.ts` (mellékelve)
- `SorTetel` új mező: `haladas: FutasHaladas | null` (a típus a `@km/news-monitor-core`-ból); a `sorTetelParse` kitölti (`(sor.haladas ?? null) as FutasHaladas | null`).
- Új export: `export async function haladasIr(id: string, h: FutasHaladas): Promise<void>` — `db().update(sema.hfSor).set({ haladas: h }).where(eq(sema.hfSor.id, id))`.
Más nem változik.

### 6. RÉSZLET: `_RESZLET-futtato.md` (a mellékelt `futtato.ts` részlethez)
- CSERE 1: az importban a `haladasIr` a `./sor`-ból (a mellékelt import-sort SZÓ SZERINT a RÉGI blokkba).
- CSERE 2: a `feldolgoz`-ban a `const k = await kornyezet(tetel.szervezetId, await tetelNyelve(tetel));` sor UTÁN: `  k.haladas = async (h) => { try { await haladasIr(tetel.id, h); } catch (hiba) { console.error("[hirfigyelo-futtato] haladas:", hiba); } }; // F9-A3: a haladás a sor tételére — hiba nem állítja meg a futást`

### 7. TELJES: `apps/web/app/hirfigyelo/_kozos/kliens.ts` (mellékelve)
- `SorTetel` (a kliens típusa) új mező: `haladas?: { forrasok_letoltve: number; forrasok_osszes: number; cikkek_talalt: number; cikkek_ertekelve: number; cikkek_ertekelendo: number } | null`.
- `varjSor` új opció: `onLepes?: (sor: SorTetel) => void` — minden sikeres lekérdezés után meghívja (a `fut`/`var` állapotúval is), mielőtt tovább várna.
Más nem változik.

### 8. RÉSZLET: `_RESZLET-attekintes.md` (a mellékelt Attekintes-részlethez)
- Új állapot: `const [haladas, setHaladas] = useState<NonNullable<SorTetel["haladas"]> | null>(null);` (a `useState` sorok közé, a `const [ujraFut, setUjraFut] = useState(false);` UTÁN).
- Mindegyik `varjSor(<id>)` hívás (a részletben 4 van: `varjSor(a.torzs.sorban.id)` kétszer, `varjSor(v.torzs.sor.id)` kétszer) kap egy második paramétert: `{ onLepes: (s) => setHaladas(s.haladas ?? null) }`, és a `.then(...)` / `await` után (a futás lezárásakor) `setHaladas(null)` is történjen — a RÉGI blokkokba a hívás sorát ÉS a rá következő sort tedd, hogy egyediek legyenek.
- A futás közbeni sáv: a `{t("hf.stRunning")}` szöveg UTÁN (ugyanabban a `km-hf-at-fut` span-ben): `{haladas ? " · " + t("hf.futas_haladas", { f: haladas.forrasok_letoltve, m: haladas.forrasok_osszes, c: haladas.cikkek_talalt, e: haladas.cikkek_ertekelve }) : null}`.

### 9. RÉSZLET: `_RESZLET-beallitas.md` (a mellékelt Beallitas-részlethez)
- Új állapot `const [probaHaladas, setProbaHaladas] = useState<{ forrasok_letoltve: number; forrasok_osszes: number; cikkek_talalt: number; cikkek_ertekelve: number } | null>(null);` a `probaAllapot` állapota után.
- A `probaFuttatas`-ban `const sor = await varjSor(v.torzs.sor.id);` → `const sor = await varjSor(v.torzs.sor.id, { onLepes: (s) => setProbaHaladas(s.haladas ?? null) });` és utána `setProbaHaladas(null);`.
- A gomb felirata: `{probaAllapot === "fut" ? t("hf.trialRunningBtn") : t("hf.proba_inditasa")}` → `{probaAllapot === "fut" ? (probaHaladas ? t("hf.futas_haladas", { f: probaHaladas.forrasok_letoltve, m: probaHaladas.forrasok_osszes, c: probaHaladas.cikkek_talalt, e: probaHaladas.cikkek_ertekelve }) : t("hf.trialRunningBtn")) : t("hf.proba_inditasa")}`.

## Elfogadás (a beépítő méri)
A mag próbái zöldek; `pnpm tipus` zöld; futás közben 3–5 mp-enként változó számok a Hírek lapon és a próbafutás gombján; a sor-végpont `haladas` mezőt ad. Add vissza: host.ts, _RESZLET-folyamat.md, 0078 migráció, _RESZLET-sema.md, sor.ts, _RESZLET-futtato.md, kliens.ts, _RESZLET-attekintes.md, _RESZLET-beallitas.md.
