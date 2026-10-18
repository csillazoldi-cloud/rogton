# Feladat — ÉPÍTŐ (F10-W1): a Hírek lap két hasábban (max 8), az ötlet elöl, a cím a beállított nyelven, a hír részletei felugróban, „Tartalomgyárba" gomb

Vilmos elfogadta az R-9 rajzot (2026-09-16). A Hírek lap kártyái KÉT HASÁBBAN állnak; egy kártyán a leghangsúlyosabb sor az, hogy MIT TUD KEZDENI a hírrel (az értékelés `miert` mondata); a hír címe a beállított nyelven (`cim_forditott`, ha van), alatta halványan az eredeti; egy lapon legfeljebb 8 kártya, alul „További N hír … Mutasd a következő 8-at"; a „Részletek" nem oldalsó panel, hanem FELUGRÓ ablak (a keretnél kb. 35 px keskenyebb), két hasábbal: balra a hír, jobbra „Mit adhat ez neked" (A cégednek · A vevőidnek · Egy tartalom, amit ma megírhattok); minden kártyán és a felugróban „Tartalomgyárba" gomb, ami MÉG NEM MŰKÖDIK (kikapcsolt, mellette „később működik" jelölés — Vilmos kérte így).

TypeScript 7 strict, Next.js 16, React 19. Minden kimenetet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban adsz vissza. Nincs új csomag, nincs `any`, NINCS beégetett szín/betű/méret/px a CSS-ben — csak `var(--…)` tokenek (a tokenőr elbukik rajta; a mellékelt attekintes.css mutatja a mintát). Felirat CSAK kulcsból (`t("hf.…")`), az új kulcsok három nyelven a migrációban. Magyar azonosítók és megjegyzések. TELJES fájl, ahol ezt írom; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI SZÓ SZERINT a mellékletből, egyedi) a nagy fájlokhoz.

## MÉRT tények (2026-09-16)
- A `Kartya` típus (`@km/news-monitor-core`) a mai futásból ÚJ mezőket kap (a mag párhuzamosan készül, F10-M1): `cim_forditott: string` (üres, ha nincs), `cegednek: string`, `vevoidnek: string` — a régi értékeléseknél mind üres. Meglévő mezők: `cim, osszefoglalo, miert, indoklas, fontossag ("fontos"|"erdekes"|"hatter"|null), ertekeles_allapot ("fuggoben"|"kesz"|"keret_kimerult"), forrasok[] {talalat_id, forras_cim, url, cim, megjelenes, nyelv}, megtekintes, jeloles ("nincs"|"mentett"|"elrejtett"), letrehozva, esemeny_ideje, tartalomotlet {szoveg, nyelv, keszult}|null, szabaly_verzio, csonkolt_alapjan, fo_talalat_id`.
- A `miert` mondat jelentése az új promptban: MIT TEHET a hírrel a szervezet („Írhattok arról, …"); háttérhírnél PONTOSAN „Háttérhír; most nem kell tennetek semmit."; a régi értékeléseknél a régi jelentés (miért került eléd) — a képernyő ugyanúgy mutatja.
- A mellékelt `Attekintes.tsx` MÁR MEG VAN VÁGVA: a régi `HitCard`, `DetailPanel` és `elsoMondat` függvények törölve, az importsor a két új komponensre (`HirKartya`, `HirFelugro`) már benne van — TE ÍROD MEG a két komponenst, és a lista/felugró részt a RÉSZLET-tel cseréled.
- Segédek a `./_kozos/kliens`-ből: `idoRovid(iso, nyelv)`, `nyelvNev(kod, nyelv)`, `forrasNev(cim)`.
- Meglévő gomb-osztályok az attekintes.css-ben: `km-hf-at-gomb-mentes` (+ `data-mentve`), `km-hf-at-gomb-ghost`, `km-hf-at-gomb-reszlet`, `km-hf-at-kartya-kat` (kategória-jelvény), `km-hf-at-panel-otlet-gomb`; a „még nem működik" jelölés mintája: `.km-sf-keszul-jelveny` (sajat-fiok.css, mellékelve) a `--keszul`, `--keszul-bg`, `--keszul-border` tokenekkel; létező felirat: `jelzes.meg_nem_mukodik` = „még nem működik".
- Elérhető tokenek (csak ezek): `--ter-1…--ter-14, --fs-xs/sm/md/base/h/title/szekcio, --fw-head, --fw-strong, --lh, --font-body-active, --font-display-active, --text, --text-mut, --text-dim, --text-faint, --line, --line-soft, --line-dash, --panel-soft, --bg, --bg-elev, --r-badge, --r-btn, --r-block, --r-card, --bw, --shadow-pop, --accent, --accent-text, --accent-tint, --accent-tint-weak, --accent-border, --primary, --on-primary, --grad-primary, --glow-primary, --keszul, --keszul-bg, --keszul-border, --btn-ghost-bg/-border/-text/-hover, --control-min, --control-min-s, --lista-max, --fatyol-kozep, --fatyol-eros, --src-ai-bg, --ok-bg, --warn-bg, --dur-fast, --dur-med`.

## Mit kell megírni

### 1. TELJES: `apps/web/app/hirfigyelo/HirKartya.tsx` (ÚJ)
`"use client"`. Export `HirKartya` és a segéd `elsoMondat(szoveg)` (az első mondat a `.`-ig — a régiből: `const i = szoveg.indexOf("."); return i === -1 ? szoveg : szoveg.slice(0, i + 1);`).
Propok: `{ kartya: Kartya; nyelv: string; t: (kulcs: string, p?: Record<string, string | number>) => string; szerep: string; megtekintettHelyileg: boolean; onJelol: (jeloles: "nincs" | "mentett" | "elrejtett") => void; onNyit: () => void; onUjraertekel?: () => void; ujraFut?: boolean }`.
Szerkezet (az R-9 rajz 1. lapja):
```tsx
<article className="km-hf-k" data-uj={uj} data-fontossag={kartya.fontossag ?? "nincs"} data-fuggo={fuggoben}>
  <div className="km-hf-k-fej">
    {katCimke ? <span className="km-hf-at-kartya-kat" data-kat={kartya.fontossag}>{katCimke}</span> : fuggoben ? <span className="km-hf-at-kartya-kat" data-kat="fuggo">{t("hf.kat_keszul")}</span> : null}
    <span className="km-hf-k-meta">{kiado}{ido ? " · " + ido : ""}</span>
  </div>
  {ertekelesKesz && kartya.miert ? <div className="km-hf-k-otlet">{elsoMondat(kartya.miert)}</div> : null}
  <div className="km-hf-k-cimek">
    <div className="km-hf-k-cim">{kartya.cim_forditott || kartya.cim}</div>
    {kartya.cim_forditott && kartya.cim_forditott !== kartya.cim ? <div className="km-hf-k-eredeti">{t("hf.eredeti_elott")} {kartya.cim}</div> : null}
  </div>
  {fuggoben ? <div className="km-hf-k-keszul"><span className="km-hf-at-porgo" aria-hidden="true" />{t("hf.kartya_nincs_osszefoglalo")}</div> : null}
  <div className="km-hf-k-gombok">
    {fuggoben ? (
      <>{szerep !== "nezo" && onUjraertekel ? <button className="km-hf-at-gomb-mentes" onClick={onUjraertekel} disabled={ujraFut}>{ujraFut ? t("hf.osszefoglalo_ujra_fut") : t("hf.osszefoglalo_ujra")}</button> : null}
        {elsoForras ? <a href={elsoForras.url} target="_blank" rel="noopener noreferrer" className="km-hf-at-gomb-ghost">{t("hf.eredeti_cikk")} ↗</a> : null}</>
    ) : (
      <>
        <button className="km-hf-k-gomb-fo" onClick={onNyit}>{t("hf.gomb_reszletek")}</button>
        <button className="km-hf-at-gomb-mentes" data-mentve={…} onClick={() => onJelol(kartya.jeloles === "mentett" ? "nincs" : "mentett")}>{kartya.jeloles === "mentett" ? "✓ " + t("hf.saved") : t("hf.gomb_elmentem")}</button>
        {kartya.jeloles !== "elrejtett" ? <button className="km-hf-at-gomb-ghost" onClick={() => onJelol("elrejtett")}>{t("hf.gomb_nem_erdekel")}</button> : <button className="km-hf-at-gomb-ghost" onClick={() => onJelol("nincs")}>{t("hf.restore")}</button>}
        <TartalomgyarGomb t={t} />
      </>
    )}
  </div>
</article>
```
`TartalomgyarGomb` (exportált, a felugró is használja): `<span className="km-hf-gyar"><button type="button" className="km-hf-gyar-gomb" disabled aria-disabled="true" title={t("jelzes.meg_nem_mukodik")}>{t("hf.tartalomgyarba")} →</button><span className="km-hf-gyar-kesobb">{t("hf.kesobb_mukodik")}</span></span>` — megjegyzés: `{/* R-9: a gomb már kint van, a Tartalomgyár modul még nincs — Vilmos döntése: „később működik" jelöléssel */}`.
A kategória-felirat: `hf.kat_fontos` / `hf.kat_erdekes` / `hf.kat_hatter` (meglévők). `kiado = forrasNev(elsoForras.forras_cim)`, `ido = idoRovid(elsoForras.megjelenes, nyelv)`.

### 2. TELJES: `apps/web/app/hirfigyelo/HirFelugro.tsx` (ÚJ)
`"use client"`. Export `HirFelugro`. Propok: `{ kartya: Kartya; nyelv: string; t: …; szerep: string; otletFut: boolean; otletHiba: string | null; onBezar: () => void; onOtlet: () => void; onJelol: (jeloles: "nincs" | "mentett" | "elrejtett") => void }`.
Szerkezet (az R-9 rajz 2. lapja): a háttér `<div className="km-hf-fu-hatter" onClick={onBezar}>` (kattintás a háttérre zár), benne `<div role="dialog" aria-modal="true" aria-label={t("hf.detTitle")} className="km-hf-fu" data-screen-label="HF-Felugró" onClick={(e) => e.stopPropagation()}>`:
- Fejsor `km-hf-fu-fej`: kategória-jelvény (mint a kártyán) · `km-hf-fu-meta`: `{kiado} · {ido}` és ha `cim_forditott && cim_forditott !== cim` és az első forrás nyelve ismert: ` · {t("hf.forditva_nyelvbol", { nyelv: nyelvNev(elsoForras.nyelv, nyelv) })}` · jobbra `<button className="km-hf-at-gomb-ghost" onClick={onBezar}>✕ {t("kozos.bezaras")}</button>`.
- Törzs `km-hf-fu-torzs` (két hasáb):
  - BAL `km-hf-fu-bal`: `<h2 className="km-hf-fu-cim">{cim_forditott || cim}</h2>`; ha eltér: `<div className="km-hf-k-eredeti">{t("hf.eredeti_elott")} {cim}</div>`; `<p className="km-hf-fu-osszefoglalo">{kartya.osszefoglalo}</p>` (függőnél `t("hf.kartya_nincs_osszefoglalo")`, keret-kimerültnél `t("hf.keret_kimerult")`); gombsor: Elmentem/Mentve (mint a kártyán, `onJelol`), Nem érdekel/Visszaállítás, `<a … className="km-hf-at-gomb-ghost">{t("hf.eredeti_cikk")} ↗</a>` (az első forrás url-je); alatta `<details className="km-hf-fu-miert"><summary>{t("hf.fu_miert_kaptad")}</summary>` — benne: ha kész: `kartya.indoklas` (ha van) különben `kartya.miert`; `kartya.csonkolt_alapjan` → `t("hf.csonkolt")`; a források listája (minden `kartya.forrasok` elem: `forrasNev`, `idoRovid`, `t("hf.forras_nyelve", …)`, link `t("hf.gomb_eredeti_cikk")`); `kartya.szabaly_verzio` → `t("hf.verMadeWith", { v })`.
  - JOBB `km-hf-fu-jobb`: fejléc `<div className="km-hf-fu-jobb-cim"><span className="km-hf-fu-orb" aria-hidden="true" />{t("hf.fu_mit_adhat")}</div>`. Aztán:
    - ha `fontossag === "hatter"`: egy doboz `km-hf-fu-doboz` a `miert` mondattal (a „Háttérhír; …") és alatta halványan az `indoklas` első mondata.
    - különben, ha kész: doboz „A cégednek" (`km-hf-fu-doboz-cim` = `t("hf.fu_cegednek")`, szöveg = `kartya.cegednek || kartya.miert`); doboz „A vevőidnek" CSAK ha `kartya.vevoidnek` nem üres; doboz `km-hf-fu-doboz km-hf-fu-doboz-tartalom` fejléce `t("hf.fu_egy_tartalom")` + jelvény `t("hf.ovSummaryBadge")`: ha `kartya.tartalomotlet` → `<p>{tartalomotlet.szoveg}</p>` + sor: `<TartalomgyarGomb t={t} />`; ha nincs ötlet és `szerep !== "nezo"` és (fontos vagy érdekes): `<button className="km-hf-at-panel-otlet-gomb" onClick={onOtlet} disabled={otletFut}>{otletFut ? t("hf.detIdeaWorking") : "✦ " + t("hf.detIdeaBtn")}</button>` + `otletHiba`; ha néző és nincs ötlet: `t("hf.fu_otlet_nezo")`.
    - ha függőben / keret kimerült: egy doboz a `t("hf.stAiPend")` ill. `t("hf.keret_kimerult")` szöveggel.
    - lábjegyzet `km-hf-fu-lab`: `t("hf.otlet_figyelmeztetes")` — csak ha van ötlet.
Escape a szülőben zár (megvan). A felugró nyitásakor a lap ne görögjön: `useEffect` — `document.body.style.overflow = "hidden"`, visszaállítás a takarításban.

### 3. RÉSZLET: `_RESZLET-attekintes.md` (a mellékelt, MEGVÁGOTT Attekintes.tsx-hez)
- CSERE 1: az állapotok közé (a `const [haladas, setHaladas] = …` sor UTÁN): `  const [lathato, setLathato] = useState(8); // R-9: egy lapon legfeljebb 8 kártya`.
- CSERE 2: a `// 05 · lista: fő lista …` megjegyzéstől a `const hatterKartyak = …` sorig (3 sor, a RÉGI blokkba szó szerint) helyett:
```tsx
  // R-9: EGY lista, fontos → érdekes → még készül → háttér sorrendben, csoporton belül a hír ideje szerint; egyszerre 8 látszik
  const csoport = (k: Kartya) => (k.ertekeles_allapot !== "kesz" ? 2 : k.fontossag === "fontos" ? 0 : k.fontossag === "erdekes" ? 1 : 3);
  const rendezett = [...szurtKartyak].sort((a, b) => csoport(a) - csoport(b) || new Date(b.esemeny_ideje ?? b.letrehozva).getTime() - new Date(a.esemeny_ideje ?? a.letrehozva).getTime());
  const mutatott = rendezett.slice(0, lathato);
  const tobbi = rendezett.length - mutatott.length;
```
- CSERE 3: a szűrő gombjának `onClick={() => setSzuro(s.kulcs)}` → `onClick={() => { setSzuro(s.kulcs); setLathato(8); }}`.
- CSERE 4: a `<div className="km-hf-at-kartyak">` blokktól (a `{foKartyak.map((k) => (` sorral) a `</details>` + `)}` végéig (a mellékletben a `{/* Találatok */}` blokk belseje: a `km-hf-at-kartyak` div, az üres-üzenet, és a `hatterKartyak` `<details>`) — a RÉGI blokkba a teljes szakasz szó szerint — helyett:
```tsx
                <div className="km-hf-at-kartyak">
                  {mutatott.map((k) => (
                    <HirKartya
                      key={k.fo_talalat_id}
                      kartya={k}
                      nyelv={nyelv}
                      t={t}
                      szerep={szerep}
                      megtekintettHelyileg={megtekintettHelyi.has(k.fo_talalat_id)}
                      onJelol={(jeloles) => void jelol(k, jeloles)}
                      onNyit={() => {
                        setDetailId(k.fo_talalat_id);
                        void megtekint(k);
                      }}
                      onUjraertekel={() => void ertekelesUjra()}
                      ujraFut={ujraFut}
                    />
                  ))}
                  {szurtKartyak.length === 0 && (
                    <div className="km-hf-at-ures">{t("hf.emptyFilter")}</div>
                  )}
                </div>
                {tobbi > 0 && (
                  <div className="km-hf-at-tobbi">
                    <span className="km-hf-at-tobbi-szoveg">{t("hf.tovabbi_hirek", { n: tobbi })}</span>
                    <button className="km-hf-at-gomb-mentes" onClick={() => setLathato((l) => l + 8)}>{t("hf.mutasd_kovetkezo", { n: Math.min(8, tobbi) })} ▾</button>
                  </div>
                )}
```
- CSERE 5: a `{detailKartya && ( <DetailPanel … /> )}` blokk helyett `<HirFelugro kartya={detailKartya} nyelv={nyelv} t={t} szerep={szerep} otletFut={otletFut} otletHiba={otletHiba} onBezar={() => setDetailId(null)} onOtlet={() => void tartalomotlet(detailKartya)} onJelol={(j) => void jelol(detailKartya, j)} />`.
- Az `onMegtekint` prop megszűnik (a régi kártya kapta) — ne add át.

### 4. RÉSZLET: `_RESZLET-attekintes-css.md` (a mellékelt attekintes.css-hez)
- CSERE 1: a `.km-hf-at-kartyak {` szabály (`display: flex; flex-direction: column; gap: var(--ter-5);`) → `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ter-6); align-items: start;` (megjegyzés: `/* R-9: két hasáb */`).
- CSERE 2: a fájl végére (a RÉGI: az utolsó szabály, a mellékletben az utolsó 2 sor szó szerint) az ÚJ osztályok — csak tokenekkel:
  - `.km-hf-k` (kártya: `border: var(--bw) solid var(--line); border-radius: var(--r-card); background: var(--panel-soft); padding: var(--ter-7) var(--ter-8); display: flex; flex-direction: column; gap: var(--ter-4);`), `.km-hf-k[data-uj="true"]` (`border-color: var(--accent-border)`), `.km-hf-k[data-fuggo="true"]` (`border-style: dashed`).
  - `.km-hf-k-fej` (flex, space-between, `gap: var(--ter-4)`), `.km-hf-k-meta` (`font-size: var(--fs-xs); color: var(--text-dim)`).
  - `.km-hf-k-otlet` — A LEGHANGSÚLYOSABB: `font-family: var(--font-display-active); font-size: var(--fs-h); font-weight: var(--fw-head); line-height: var(--lh); color: var(--text);`.
  - `.km-hf-k-cim` (`font-size: var(--fs-md); font-weight: var(--fw-strong); color: var(--text); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`), `.km-hf-k-eredeti` (`font-size: var(--fs-xs); color: var(--text-faint); font-style: italic; margin-top: var(--ter-1); display: -webkit-box; -webkit-line-clamp: 1; …`).
  - `.km-hf-k-keszul` (flex, gap ter-4, `color: var(--text-mut); font-size: var(--fs-sm)`).
  - `.km-hf-k-gombok` (flex, wrap, `gap: var(--ter-4); margin-top: var(--ter-2); align-items: center`).
  - `.km-hf-k-gomb-fo` (`background: var(--grad-primary); color: var(--on-primary); border: none; border-radius: var(--r-btn); padding: var(--ter-3) var(--ter-7); font-size: var(--fs-sm); font-weight: var(--fw-strong); min-height: var(--control-min-s); cursor: pointer; font-family: var(--font-body-active); box-shadow: var(--glow-primary);`).
  - `.km-hf-gyar` (`margin-inline-start: auto; display: inline-flex; align-items: center; gap: var(--ter-3)`), `.km-hf-gyar-gomb` (`border: var(--bw) dashed var(--btn-ghost-border); background: transparent; color: var(--text-mut); border-radius: var(--r-btn); padding: var(--ter-3) var(--ter-6); font-size: var(--fs-sm); min-height: var(--control-min-s); cursor: not-allowed; font-family: var(--font-body-active);`), `.km-hf-gyar-kesobb` (mint `.km-sf-keszul-jelveny`: `font-size: var(--fs-xs); color: var(--keszul); border: var(--bw) solid var(--keszul-border); background: var(--keszul-bg); border-radius: var(--r-badge); padding: var(--ter-1) var(--ter-3); white-space: nowrap;`).
  - `.km-hf-at-tobbi` (`margin-top: var(--ter-6); border: var(--bw) solid var(--line); border-radius: var(--r-block); background: var(--panel-soft); padding: var(--ter-5) var(--ter-7); display: flex; align-items: center; justify-content: space-between; gap: var(--ter-5); flex-wrap: wrap`), `.km-hf-at-tobbi-szoveg` (`color: var(--text-mut); font-size: var(--fs-md)`).
  - FELUGRÓ: `.km-hf-fu-hatter` (`position: fixed; inset: 0; z-index: 55; background: var(--fatyol-kozep); display: flex; align-items: flex-start; justify-content: center; padding: var(--ter-10) var(--ter-5); overflow-y: auto;`), `.km-hf-fu` (`width: 100%; max-width: calc(var(--lista-max) - var(--ter-7)); /* R-9: a keretnél kb. 35 ponttal keskenyebb */ background: var(--bg-elev); border: var(--bw) solid var(--accent-border); border-radius: var(--r-card); box-shadow: var(--shadow-pop); box-sizing: border-box;`), `.km-hf-fu-fej` (flex, center, `gap: var(--ter-4); padding: var(--ter-5) var(--ter-7); border-bottom: var(--bw) solid var(--line)`; a Bezárás gomb `margin-inline-start: auto`), `.km-hf-fu-meta` (`font-size: var(--fs-sm); color: var(--text-mut)`), `.km-hf-fu-torzs` (`display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--ter-8); padding: var(--ter-7)`), `.km-hf-fu-cim` (`font-family: var(--font-display-active); font-size: var(--fs-title); font-weight: var(--fw-head); line-height: var(--lh); margin: var(--ter-0)`), `.km-hf-fu-osszefoglalo` (`font-size: var(--fs-md); color: var(--text-mut); line-height: var(--lh)`), `.km-hf-fu-gombok` (flex wrap gap ter-4), `.km-hf-fu-miert` (`margin-top: var(--ter-5); border-top: var(--bw) solid var(--line-soft); padding-top: var(--ter-4); color: var(--text-mut); font-size: var(--fs-sm)`; `summary { cursor: pointer; color: var(--text); min-height: var(--control-min-s); display: flex; align-items: center }`), `.km-hf-fu-jobb-cim` (flex, gap ter-4, `font-size: var(--fs-xs); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-mut); font-weight: var(--fw-strong)`), `.km-hf-fu-orb` (`width: var(--ter-8); height: var(--ter-8); border-radius: 50%; /* tokenőr: ok — kör alak */ background: var(--grad-primary); box-shadow: var(--glow-primary)`), `.km-hf-fu-doboz` (`border: var(--bw) solid var(--line); border-radius: var(--r-block); background: var(--panel-soft); padding: var(--ter-5) var(--ter-6); margin-top: var(--ter-4); font-size: var(--fs-md); line-height: var(--lh)`), `.km-hf-fu-doboz-cim` (mint a jobb-cím, `margin-bottom: var(--ter-2)`), `.km-hf-fu-doboz-tartalom` (`border-color: var(--accent-border); background: var(--accent-tint-weak)`), `.km-hf-fu-lab` (`margin-top: var(--ter-4); font-size: var(--fs-xs); color: var(--text-dim)`).
  - Mobil: `@media (max-width: 900px) { .km-hf-at-kartyak, .km-hf-fu-torzs { grid-template-columns: minmax(0, 1fr); } .km-hf-fu-hatter { padding: var(--ter-3); } .km-hf-gyar { margin-inline-start: 0; } }`.
  A régi `.km-hf-at-kartya…` és `.km-hf-at-panel…` szabályokat NE töröld (a beépítő takarítja).

### 5. TELJES migráció: `apps/web/adatbazis/migraciok/0079_r9_hirek_ket_hasab.sql`
Fejléc `-- R-9: Hírek két hasábban, felugró részletek, Tartalomgyárba gomb — feliratok`. `INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();` — a kulcsok (hu · ro · en):
- `hf.gomb_reszletek`: Részletek · Detalii · Details
- `hf.gomb_elmentem`: Elmentem · Salvez · Save
- `hf.tartalomgyarba`: Tartalomgyárba · În fabrica de conținut · To the content factory
- `hf.kesobb_mukodik`: később működik · funcționează mai târziu · works later
- `hf.eredeti_elott`: eredeti: · original: · original:
- `hf.kat_keszul`: még készül · în lucru · in progress
- `hf.tovabbi_hirek`: További {n} hír a két napból · Încă {n} știri din ultimele două zile · {n} more stories from the last two days
- `hf.mutasd_kovetkezo`: Mutasd a következő {n}-at · Arată următoarele {n} · Show the next {n}
- `hf.forditva_nyelvbol`: {nyelv} nyelvből fordítva · tradus din {nyelv} · translated from {nyelv}
- `hf.fu_mit_adhat`: Mit adhat ez neked · Ce îți poate oferi · What this can give you
- `hf.fu_cegednek`: A cégednek · Pentru firma ta · For your business
- `hf.fu_vevoidnek`: A vevőidnek · Pentru clienții tăi · For your customers
- `hf.fu_egy_tartalom`: Egy tartalom, amit ma megírhattok · Un conținut pe care îl puteți scrie azi · A piece you could write today
- `hf.fu_miert_kaptad`: Miért kaptad ezt a hírt? · De ce ai primit această știre? · Why did you get this story?
- `hf.fu_otlet_nezo`: Tartalomötletet a szerkesztők kérhetnek. · Ideile de conținut pot fi cerute de editori. · Editors can request a content idea.

### 6. RÉSZLET: `_RESZLET-kezdolap.md` (a mellékelt Kezdolap.tsx + kezdolap.css részlethez)
- `Kezdolap.tsx`: a `<span className="km-kp-hirek-cimsor">{c.cim}</span>` → `<span className="km-kp-hirek-cimsor">{c.cim}{c.cim_eredeti ? <span className="km-kp-hirek-eredeti">{t("hf.eredeti_elott")} {c.cim_eredeti}</span> : null}</span>` (a `c` típusa a mag oldaláról már tartalmazza a `cim_eredeti: string | null` mezőt — F10-M1).
- `kezdolap.css`: a `.km-kp-hirek-cimsor` szabály UTÁN: `.km-kp-hirek-eredeti { display: block; font-size: var(--fs-xs); color: var(--text-faint); font-style: italic; font-weight: normal; }`.

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm tokenor` 0; `pnpm keretor` zöld; élőben 1440-en két hasáb, legfeljebb 8 kártya, a „Részletek" felugró 1148 széles középen, a Tartalomgyárba gomb kikapcsolt „később működik" jelöléssel. Add vissza: HirKartya.tsx, HirFelugro.tsx, _RESZLET-attekintes.md, _RESZLET-attekintes-css.md, 0079 migráció, _RESZLET-kezdolap.md.
