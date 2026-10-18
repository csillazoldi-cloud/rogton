# Feladat — TESZTELŐ (E-19b): a bekötés próbája — a folyamatok a spec 2.12 pontja szerint, memóriatárral

Mellékelve: `HIRFIGYELO-SZERZODES.md` (a SPEC; a 2.12 pont a folyamatoké — az építő PÁRHUZAMOSAN írja) és a kész mag `index.ts`,
`host.ts`, `tar.ts`, `ai.ts` (a nevek és alakok). A próbákban a `Kornyezet`-et TE rakod össze: `memoriaTar()`, egy saját rögzített
`Letolto` (két forrás: egy jó 4 cikkel, ebből 2 ugyanarról más címmel; egy hibás), egy saját determinisztikus `AiHivo` (a spec 2.9
válasz-sémái szerint érvényes válaszok; egy állítható kapcsolóval: `keretKimerult`, `hibazik`), `idAdo` számláló, rögzített `most`.
A kontextus: tulajdonos (uuid), és egy néző (uuid) a jogpróbákhoz. A beállítás: egy téma „Minta Műhely”, célok `["sajat_marka"]`,
időzítés `kezi`.

Írd meg a `packages/news-monitor-core/probak/folyamat.proba.ts` fájlt (vitest, `import { … } from "../src/index"`), sorszámozva:

1. `beallitasMent`: néző → `NINCS_JOG`; tulajdonos érvénytelen (üres témák) → `ERVENYTELEN_ADAT`; jó → verzió 1 aktív; ugyanaz újra → `uj: null`, továbbra is 1 verzió; módosítva → 2.
2. `tervezetMent` nem hoz létre verziót (a `verziok` lista változatlan), és a `tar.tervezet` visszaadja.
3. `forrasHozzaad`: facebook-cím → `nem_tamogatott`/`belepes_mogott`, de mentve; jó cím → `ellenorzes_alatt`; `forrasEllenoriz` a jóra → `hasznalhato`, a hibásra → `hibas` + `hiba_ok`.
4. `figyelesFuttat` beállítás nélkül → `NINCS_BEALLITAS`; néző → `NINCS_JOG`.
5. `figyelesFuttat` (proba: true): futás `reszleges` (a hibás forrás miatt), `hibas_forrasok` 1, új találatok 3 (4 cikk, 2 ugyanarról → 3 esemény… figyelem: a találat CIKKENKÉNT van, az esemény csoport — tehát 4 találat, 3 esemény), minden találat `uj`, értékelése `kesz`, `fontos`/`hatter` a tesztAI szerint; `minta` létrejön 4 találattal; a `futas_indult` és `futas_kesz` esemény megérkezett.
6. **A-10**: ugyanaz a futás még egyszer → `uj_talalatok: 0`, a találatok száma marad 4, az események száma 3; és két „egyidejű” hívás (a másodikat a futás közben — a memóriatárban az első `indul/fut` futása után) → `FUT_MAR`.
7. AI-keret: a tesztAI `keretKimerult` kapcsolóval → a találatok `ertekeles_allapot: keret_kimerult`, esemény `keret_kimerult`, a futás mégis lezárul; AI-hiba kapcsolóval → `fuggoben` + a futás `ai_fuggoben`; utána `ertekelesUjra` (kapcsoló ki) → mind `kesz`, letöltés nélkül (a letöltő számlálója nem nő).
8. `talalatMegtekint` → `megtekintett`; `talalatJelol("elrejtett")` → `elrejtett` és a verziók száma változatlan (nem hoz létre szabályt).
9. `visszajelzesRogzit` + `javaslatKer` → javaslat `fuggo`, az aktív verzióra; `javaslatKiprobal` → összehasonlítás 4 sorral; a minta lejáratát a `most` léptetésével 31 nappal → `MINTA_LEJART`; `javaslatDont("elfogad")` → új verzió (`eredet: ai_javaslat`), a javaslat `elfogadva`; egy másik javaslat `elvet` → `elvetve`, a visszajelzések megmaradnak.
10. `attekintes`: `utolsoSikeres` a részleges futás; `ujDb` a nem megtekintettek száma; `forrasHibak` 1. `osszkep`: a válasz hivatkozásai létező találatokra mutatnak; nem létező hivatkozás kiesik.

Add vissza az EGY fájlt (`=== FÁJL: packages/news-monitor-core/probak/folyamat.proba.ts ===`). Ne írj kódot a `src`-be. Ahol a spec nem egyértelmű, a spec szó szerinti szövege szerint dönts és jelöld `// SPEC-KÉRDÉS:`.
