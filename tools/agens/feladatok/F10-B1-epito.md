# Feladat — ÉPÍTŐ (F10-B1): a Figyelés beállítása lap a közös keretben — 2/3 kitöltés + 1/3 magyarázat és javaslat

Vilmos döntése (2026-09-16, R-9 rajz 4. lapja): az űrlapos lapok is a KÖZÖS 1180-as keretben állnak (nem külön „űrlap-szélesség"); a keret KÉTHARMADÁN a kitöltés (a mai szakaszok egymás alatt), EGYHARMADÁN egy jobb oszlop: „Javaslat a profilodból" (a meglévő AI-javaslat gépezete), „Mi történik a témákkal" (magyarázat), „Korlátok a próbaidőszakban" (a valódi korlátok). MÉRVE ma: a `.km-hf-be-egyoszlop` 760-ra szűkíti a lapot és középre teszi — a keret (1180) alatt a tartalom „ultrakeskeny" (Vilmos szava).

TypeScript 7 strict, Next.js 16, React 19. `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkok; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI SZÓ SZERINT a mellékletből, egyedi — ha kell, több szomszédos sor). CSS CSAK tokenekkel (`var(--…)`, nincs px, nincs csupasz 0 — `var(--ter-0)`). Felirat CSAK kulcsból; új kulcsok a migrációban három nyelven. Magyar azonosítók és megjegyzések. Semmit ne tegyél a képernyőre, ami mögött nincs gépezet.

## Mit kell megírni

### 1. RÉSZLET: `_RESZLET-beallitas.md` (a mellékelt `Beallitas.tsx`-hez)
- CSERE 1: `<section data-screen-label="HF-II Figyelés beállítása" className="km-hf-be km-hf-be-egyoszlop">` → `<section data-screen-label="HF-II Figyelés beállítása" className="km-hf-be km-hf-be-racs">{/* R-9: 2/3 kitöltés + 1/3 magyarázat a közös keretben */}`.
- CSERE 2: a `<div className="km-hf-be-fej">` … `</div>` blokk (3 belső sor) UTÁN nyílik a bal oszlop: a fej záró `</div>` sora után új sor `        <div className="km-hf-be-bal">` (a RÉGI blokk: a fej teljes 5 sora + az üres sor + a `{/* Tervezet folytatása sáv */}` megjegyzés sora, hogy egyedi legyen; az ÚJ ugyanez, a fej `</div>`-je és a megjegyzés közé beszúrva a `<div className="km-hf-be-bal">`).
- CSERE 3: a teljes `{/* AI-javaslat sáv */}` blokk (a `<div className="km-hf-be-javaslat-sav">`-tól a záró `</div>`-ig, a mellékletben ~20 sor) TÖRLŐDIK innen (a jobb oszlopba kerül) — az ÚJ blokk üres marad, csak egy megjegyzés: `        {/* R-9: az AI-javaslat a jobb oszlopban (km-hf-be-jobb) */}`.
- CSERE 4: a gombsor blokk vége: a `{szerkesztheto && ( <div className="km-hf-be-gombsor"> … </div> )}` blokk záró `)}` sora után (a RÉGI: a mellékelt fájl utolsó 6 sora, `{probaAllapot !== "kesz" && …}`-tól a `</HirfigyeloKeret>`-ig szó szerint) az ÚJ: a bal oszlop zárása `        </div>` (km-hf-be-bal), majd a JOBB OSZLOP, majd `      </section>`:
```tsx
        {/* R-9: jobb oszlop — javaslat, magyarázat, korlátok */}
        <aside className="km-hf-be-jobb" aria-label={t("hf.jobb_cim")}>
          <div className="km-hf-be-jobb-doboz km-hf-be-jobb-javaslat">
            <div className="km-hf-be-jobb-doboz-cim"><span className="km-hf-be-orb" aria-hidden="true" />{t("hf.jobb_javaslat_cim")}</div>
            {javaslatFolyik ? (
              <p className="km-hf-be-megj" aria-live="polite">{t("hf.javaslatFolyik")}</p>
            ) : javaslatKesz ? (
              <>
                <p className="km-hf-be-megj">{t("hf.javaslat_kesz")}</p>
                <div className="km-hf-be-jobb-gombok">
                  <button type="button" className="km-hf-be-gomb km-hf-be-gomb-elsodleges" onClick={javaslatBeolvaszt} disabled={!szerkesztheto}>{t("hf.jobb_elfogadom")}</button>
                  <button type="button" className="km-hf-be-gomb km-hf-be-gomb-szellem" onClick={() => { setJavaslatKesz(false); setJavaslatTervezet(null); }}>{t("hf.jobb_nem_kell")}</button>
                </div>
              </>
            ) : javaslatHiba ? (
              <>
                <p className="km-hf-be-megj" aria-live="assertive">{t("hf.javaslatHiba")}</p>
                <button type="button" className="km-hf-be-gomb km-hf-be-gomb-szellem" onClick={javaslatKeres} disabled={!szerkesztheto}>{t("hf.ujra")}</button>
              </>
            ) : (
              <>
                <p className="km-hf-be-megj">{t("hf.jobb_javaslat_szoveg")}</p>
                <button type="button" className="km-hf-be-gomb km-hf-be-gomb-szellem" onClick={javaslatKeres} disabled={!szerkesztheto}>{t("hf.jobb_javaslat_keres")}</button>
              </>
            )}
          </div>
          <div className="km-hf-be-jobb-doboz">
            <div className="km-hf-be-jobb-doboz-cim">{t("hf.jobb_temak_cim")}</div>
            <p className="km-hf-be-megj">{t("hf.jobb_temak_szoveg")}</p>
          </div>
          <div className="km-hf-be-jobb-doboz">
            <div className="km-hf-be-jobb-doboz-cim">{t("hf.jobb_korlat_cim")}</div>
            <p className="km-hf-be-megj">{t("hf.jobb_korlat_szoveg", { cikk: HF_NAPI_CIKK, ora: HF_CIKK_MAX_KOR_ORA })}</p>
          </div>
        </aside>
      </section>
    </HirfigyeloKeret>
  );
}
```
- CSERE 5: az importok közé (a `@km/news-monitor-core`-ból már van import a fájlban — a mellékletben nézd meg a sorát, és a RÉGI blokkba azt tedd): a `HF_NAPI_CIKK, HF_CIKK_MAX_KOR_ORA` is bekerül az importba (mindkettő exportált konstans a magból: 60 és 48).

### 2. RÉSZLET: `_RESZLET-beallitas-css.md` (a mellékelt `beallitas.css`-hez)
- CSERE 1: a `.km-hf-be-egyoszlop { … }` sor (szó szerint) helyett:
```css
/* R-9 (Vilmos 2026-09-16): a közös keretben 2/3 kitöltés + 1/3 magyarázat — nincs külön űrlap-szélesség */
.km-hf-be-racs { display: grid; grid-template-columns: 2fr 1fr; gap: var(--ter-9); align-items: start; }
.km-hf-be-racs > .km-hf-be-fej { grid-column: 1 / -1; }
.km-hf-be-bal { display: flex; flex-direction: column; gap: var(--ter-8); min-width: 0; }
.km-hf-be-jobb { display: flex; flex-direction: column; gap: var(--ter-6); position: sticky; top: var(--ter-11); }
.km-hf-be-jobb-doboz { border: var(--bw) solid var(--line); border-radius: var(--r-card); background: var(--panel-soft); padding: var(--ter-6) var(--ter-7); display: flex; flex-direction: column; gap: var(--ter-4); }
.km-hf-be-jobb-javaslat { border-color: var(--accent-border); background: var(--accent-tint-weak); }
.km-hf-be-jobb-doboz-cim { display: flex; align-items: center; gap: var(--ter-4); font-size: var(--fs-xs); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-mut); font-weight: var(--fw-strong); }
.km-hf-be-orb { width: var(--ter-8); height: var(--ter-8); border-radius: 50%; /* tokenőr: ok — kör alak */ background: var(--grad-primary); box-shadow: var(--glow-primary); flex: none; }
.km-hf-be-jobb-gombok { display: flex; flex-wrap: wrap; gap: var(--ter-4); }
@media (max-width: 900px) { .km-hf-be-racs { grid-template-columns: minmax(0, 1fr); } .km-hf-be-jobb { position: static; } }
```
- A `.km-hf-be-javaslat-sav` szabály maradhat (nem használt többé; a beépítő takarítja).

### 3. TELJES migráció: `apps/web/adatbazis/migraciok/0080_r9_beallitas_ket_harmad.sql`
Fejléc `-- R-9: Figyelés beállítása 2/3 + 1/3 — a jobb oszlop feliratai`. `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();` — hu · ro · en:
- `hf.jobb_cim`: Segítség a beállításhoz · Ajutor pentru setare · Help with the setup
- `hf.jobb_javaslat_cim`: Javaslat a profilodból · Sugestie din profilul tău · A suggestion from your profile
- `hf.jobb_javaslat_szoveg`: A bemutatkozásod (tevékenység, célközönség) alapján az AI témákat javasol — a javaslatot te fogadod el, semmi nem változik magától. · Pe baza prezentării tale (activitate, public țintă) AI-ul propune teme — tu accepți sugestia, nimic nu se schimbă de la sine. · Based on your introduction (activity, audience) the AI suggests topics — you accept the suggestion, nothing changes by itself.
- `hf.jobb_javaslat_keres`: Kérek javaslatot · Cer o sugestie · Ask for a suggestion
- `hf.jobb_elfogadom`: Elfogadom · Accept · Accept
- `hf.jobb_nem_kell`: Nem kell · Nu e nevoie · No need
- `hf.jobb_temak_cim`: Mi történik a témákkal · Ce se întâmplă cu temele · What happens with the topics
- `hf.jobb_temak_szoveg`: Minden reggel a figyelt oldalak friss cikkeit ezekhez a témákhoz mérjük. Ami nem illik hozzájuk, az háttérhír lesz — nem tűnik el, csak nem hívja fel magára a figyelmet. · În fiecare dimineață comparăm articolele noi ale site-urilor urmărite cu aceste teme. Ce nu se potrivește devine știre de fundal — nu dispare, doar nu atrage atenția. · Every morning we match the fresh articles of the watched sites against these topics. What doesn't fit becomes a background story — it doesn't disappear, it just doesn't call for attention.
- `hf.jobb_korlat_cim`: Korlátok a próbaidőszakban · Limite în perioada de probă · Limits during the trial
- `hf.jobb_korlat_szoveg`: Naponta legfeljebb {cikk} cikket nézünk át, az elmúlt {ora} óra híreiből, egy gyűjtéssel reggel. · Zilnic verificăm cel mult {cikk} articole, din știrile ultimelor {ora} ore, cu o colectare dimineața. · We review at most {cikk} articles a day, from the last {ora} hours of news, with one collection in the morning.

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld, `pnpm tokenor` 0, `pnpm keretor` zöld; élőben 1440-en a bal oszlop ≈ 2/3, a jobb ≈ 1/3, a fej a teljes szélességen; a jobb oszlop javaslat-gombja a meglévő végpontot hívja. Add vissza: _RESZLET-beallitas.md, _RESZLET-beallitas-css.md, 0080 migráció.
