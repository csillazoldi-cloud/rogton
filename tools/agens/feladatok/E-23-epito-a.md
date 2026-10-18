# Feladat — ÉPÍTŐ A (E-23): a mag — kártyák (esemény = egy kártya), összefoglaló az értékelésben, tartalomötlet kérésre

A Hírfigyelő magja (`packages/news-monitor-core`) tiszta TypeScript: nincs adatbázis, nincs hálózat, minden a `Kornyezet`-en át jön.
Mellékelve: `folyamat.ts` (a folyamatok — `figyelesFuttat`, `ertekelesUjra`, `attekintes`, `osszkep`), `talalat.ts` (Talalat, Ertekeles, Esemeny),
`ai.ts` (az AI-feladatok sémái), `tar.ts` (a tár-interfész + memóriatár), `host.ts` (jogok), `kivonat.ts`, `forras.ts`, `futas.ts`, `index.ts`.
A prototípus (a felületi mérce) kártyája: „cím, forrás(ok)+idő, összefoglaló, »Miért fontos neked?«, témacímke, fontosság (Fontos/Érdekes/Háttér),
Mentés / Nem releváns / Részletek; azonos eseményről szóló cikkek EGY kártyán, forrásszám-jelzéssel; v-címke (melyik szabályváltozattal készült)”;
a részletpanel: „hosszabb összefoglaló, eredeti link, több forrás, értékelés indoklása, igény szerinti tartalomötlet (nem generálódik automatikusan)”.

Készítsd el (add vissza az ÖSSZES érintett fájlt teljes egészében):

1. **`ai.ts`**: a `RelevanciaValasz` kap egy `osszefoglalo: z.string().trim().max(400).default("")` mezőt (1–2 mondat: MIRŐL szól a cikk — nem a döntés indoka).
   A `TartalomotletValasz` marad.
2. **`talalat.ts`**: az `Ertekeles` kap `osszefoglalo: z.string().trim().max(400).default("")` mezőt; a `Talalat` kap
   `tartalomotlet: z.object({ szoveg: z.string().max(1200), nyelv: z.string().length(2), keszult: z.iso.datetime() }).nullable().default(null)` mezőt.
   Új **`Kartya`** séma és **`kartyakEpit`** tiszta függvény (új fájl **`kartya.ts`**, exportálva az `index.ts`-ből):
   ```ts
   export const KartyaForras = z.object({ talalat_id, forras_id, forras_cim: z.string() /* a Forras.cim */, url, cim: z.string() /* a cikk címe */, megjelenes: z.iso.datetime().nullable(), nyelv: z.string().length(2).nullable() });
   export const Kartya = z.object({
     esemeny_id, fo_talalat_id, cim /* a fő találat cikkcíme */, osszefoglalo: z.string() /* az értékelés összefoglalója; ha nincs, a fő kivonat szövegének első 300 karaktere, szóhatáron vágva, „…”-tal */,
     miert: z.string(), indoklas: z.string(), fontossag: Fontossag.nullable(), temacimke: Temacimke.nullable(), ertekeles_allapot: ErtekelesAllapot,
     szabaly_verzio: z.number().int().positive().nullable() /* v-címke: az értékelés szabályverziója */, csonkolt_alapjan: z.boolean(),
     forrasok: z.array(KartyaForras).min(1), forras_szam: z.number().int().positive(),
     megtekintes: z.enum(["uj","megtekintett"]) /* „uj”, ha az esemény BÁRMELYIK találata új */, jeloles: z.enum(["nincs","mentett","elrejtett"]) /* a fő találaté */,
     letrehozva: z.iso.datetime() /* az eseményé */, tartalomotlet: Talalat.shape.tartalomotlet /* a fő találaté */,
   });
   export function kartyakEpit(be: { esemenyek: Esemeny[]; talalatok: Talalat[]; kivonatok: Kivonat[]; forrasok: Forras[] }): Kartya[]
   ```
   — eseményenként egy kártya; a fő találat = `esemeny.fo_talalat_id`; a források az esemény `talalat_ids`-e szerint (a találat → kivonat → forrás láncon;
   hiányzó kivonat/forrás esetén az adott forrás kimarad, de a kártya megmarad, ha legalább egy megvan; ha egy sincs, a kártya kimarad);
   rendezés: `letrehozva` csökkenő. A `forras_cim` a `Forras.cim` (URL) — a felület rövidíti. Determinisztikus, mellékhatás nélküli.
3. **`folyamat.ts`**:
   - a `figyelesFuttat` és az `ertekelesUjra` az értékelésbe beírja az `osszefoglalo`-t is (`r.osszefoglalo`);
   - az **`attekintes`** válasza kap egy `kartyak: Kartya[]` mezőt (a tár `esemenyek`, `talalatok`, `kivonatok(minden találat kivonat_id-je)`, `forrasok` alapján, `kartyakEpit`);
   - új folyamat **`tartalomotletKer(k, ktx, talalatId)`** → `Eredmeny<{ talalat: Talalat }>`: jog `futtat` (AI-költség); nincs ilyen találat → `NINCS_ILYEN_TALALAT`
     (új hibakód — vedd fel a `Hiba` típus kódjai közé, ha van felsorolás); ha a találatnak MÁR van tartalomötlete, azt adja vissza hívás nélkül;
     különben `k.ai("hf_tartalomotlet", { talalat: { cim, szoveg, csonkolt }, hangnem })` — a `hangnem` a `k.profil`-ból: `(profil as { hangnem_leiras?: string })?.hangnem_leiras ?? ""`;
     a választ `aiValaszEllenoriz("hf_tartalomotlet", …)`-zel ellenőrzi, menti a találatra (`tartalomotlet: { szoveg, nyelv, keszult: k.most() }`), `talalatMent`;
     AI-hiba → `{ ok: false, hiba: "AI_NEM_ELERHETO" | "AI_KERET_KIMERULT" | "AI_ROSSZ_VALASZ" }` (a `valasz.kod` szerint — ahogy a többi folyamat teszi).
     **Soha nem fut automatikusan** — csak ez a folyamat hívja.
4. **`tar.ts`**: a memóriatár változatlanul működjön (a Talalat új mezője jsonb-szerűen utazik; semmi tár-módosítás nem kell, csak ha a típus kényszeríti).
5. **Próbák** (`probak/kartya.proba.ts`, vitest, a meglévő próbák stílusában — nézd meg a mellékelt `folyamat.proba.ts` részletet): legalább 8 eset:
   egy esemény két találattal → egy kártya, `forras_szam` 2, mindkét forrás; `megtekintes` „uj”, ha bármelyik új; `osszefoglalo` tartalék a kivonatból (300 karakter, szóhatár, „…”);
   értékeletlen találat → `fontossag` null, `ertekeles_allapot` „fuggoben”; hiányzó kivonat → a forrás kimarad, a kártya marad; rendezés; `tartalomotletKer`:
   jog (néző → NINCS_JOG), nincs találat → NINCS_ILYEN_TALALAT, siker (memóriatár + ál-AI) → mentve, második kérés NEM hív AI-t (számláló), AI-hiba → hiba.

Szabályok: TypeScript 7 (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`), zod 4; a mag CSAK `@km/contracts`-ot és `zod`-ot importálhat; magyar nevek és megjegyzések;
nincs új npm-függőség. A meglévő 142 próba maradjon zöld (a `Talalat`/`Ertekeles` új mezői `default`-osak, a régi adatok érvényesek maradnak).
