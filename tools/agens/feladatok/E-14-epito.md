# Feladat — ÉPÍTŐ (E-14): a Theme-felület stíluslapja és az élő előnézet a v6 prototípus szerint

Mellékelve: a v6 prototípus képernyője (`Theme-beallitasok.dc.html` — EZ A MÉRCE, elemről elemre; a benne lévő inline
stílusokat és a `renderVals()` `pv*` stílusobjektumait fordítod le), a tokenek listája (`tema-szintek.ts`: `TOKEN_SZABALYOK`),
és a meglévő közös stíluslap részlete (`fiok.css` — a `.km-gomb`, `.km-gomb-szellem`, `.km-jelveny`, `.km-bemenet`,
`.km-fejlec*` már léteznek, NE írd újra; a tema.css csak a Theme-lap saját osztályait adja).

**Vasszabály (tokenőr):** a CSS-ben és a TSX-ben NEM lehet beégetett szín (`#…`, `rgb(`, `hsl(`, `color-mix(`), és a
`font-family:`, `font-size:`, `border-radius:`, `font-weight:` értéke csak `var(--…)` lehet. A v6 inline stílusaiban lévő
literál értékeket a megfelelő tokenre cseréld (`13px 26px` gombpárna → `var(--btn-pad-y) var(--btn-pad-x)`; `#cdd4e0` →
`var(--btn-ghost-text)`; `rgba(255,255,255,0.05)` → `var(--field-bg)`; `'#fff'` → `var(--on-primary)`; `6px`/`4px`
lekerekítés → `var(--r-btn)`/`var(--r-badge)`; `12px`/`13px`/`14px` betűméret → `var(--fs-xs)`/`var(--fs-sm)`/`var(--fs-md)`).
Térköz-px (padding, gap, margin, width) maradhat literál, ahogy a v6-ban.

## 1. `apps/web/app/tema/tema.css`
A v6 lap saját elemei, az alábbi osztálynevekkel (a v6 inline stílusát vidd át PONTOSAN, RTL-t nem kell):
- `.km-tema-fejlec` (header: sticky, `background: var(--bg-elev)`, alsó vonal, flex-wrap), `.km-tema-fejlec-bal`, `.km-tema-fejlec-jobb`,
  `.km-tema-cim` (a lap címe), `.km-tema-szint` (a kis jelvény a cím mellett — a v6 `thAdmin` jelvényének stílusa),
  `.km-tema-piszkos` (a „nem mentett módosítások / szinkronban” jelvény; `[data-piszkos="true"]` → warn színek, különben dim/line).
- `.km-tema-gomb` (a fejléc szellem-gombjai: Elvetés, Alapértékek, Tervezet mentése — a v6 header-gombok stílusa; hover
  `var(--btn-ghost-hover)`), `.km-tema-gomb-alkalmaz` (a kiemelt Alkalmazás gomb: `var(--grad-primary)`, glow-árnyék),
  `.km-tema-gomb:disabled` opacity.
- Üzenetek a fejléc alatt (`margin:14px 24px 0`): `.km-tema-uzenet` alap + `[data-fajta="ok"]` (ok-bg/ok), `[data-fajta="hiba"]`
  (err-border/err-bg/err), `[data-fajta="figyelem"]` (warn-border/warn-bg/warn), `[data-fajta="info"]` (line/panel-soft-2/text-mut —
  a betöltés-üzenet); `.km-tema-uzenet-cim` (félkövér első sor az importhibáknál), `.km-tema-uzenet code` (kód-betű, ltr),
  `.km-tema-uzenet-gomb` (a „Betöltés újra” kis gomb: err-btn-border/err-btn-bg/err).
- `.km-tema-fo` (main: flex, gap 22px, wrap, `padding:22px 24px 80px`, max-width 1400px, középre), `.km-tema-oszlop`
  (bal: `flex:1 1 320px; max-width:430px; min-width:280px`, oszlop, gap 14px), `.km-tema-elonezet-oszlop` (jobb:
  `flex:1.6 1 460px; min-width:300px; position:sticky; top:76px`).
- `.km-tema-szekcio` (a v6 section: line-keret, r-block, padding 18px, panel-soft), `.km-tema-szekcio-cim` (h2: display-betű,
  fw-head, fs-title, margin 0 0 12px), `.km-tema-jegyzet` (a halvány magyarázó sor: fs-xs, text-dim), `.km-tema-cimke`
  (mezőcímke: fs-xs, text-mut, block), `.km-tema-cimke strong` (text), `.km-tema-kod` (a `code` token-név: text-faint,
  kód-betű, `direction:ltr; unicode-bidi:isolate`).
- `.km-tema-szinek` (grid, `repeat(auto-fill,minmax(120px,1fr))`, gap 10px), `.km-tema-szin` (label: oszlop, gap 4px, fs-xs,
  text-mut), `.km-tema-szin-sor` (flex, gap 6px), `.km-tema-szin-bemenet` (input[type=color]: 38×30, field-border keret,
  r-badge, `background:none`, cursor), `.km-tema-szin-ertek` (a hex-érték kód-betűvel, fs-xs, text-dim).
- `.km-tema-valaszto` (select: width 100%, padding 9px 10px, field-border, r-field, bg-elev, text, fs-sm, margin-bottom 12px),
  `.km-tema-csuszka` (input[type=range]: width 100%, margin-bottom 10px, `accent-color: var(--primary)`),
  `.km-tema-csuszka-fej` (a lekerekítés-soroknál: flex, gap 10px, align center, margin-bottom 2px; a címke `flex:1`),
  `.km-tema-kapszula` (a „Kapszula” gomb: `border-radius: var(--r-pill)` — EZT a tokent NEM használjuk: írd `border-radius: 999px /* tokenőr: ok — a kapszula alakja definíció szerint teljes lekerekítés */`;
  `[data-be="true"]` → focus keret + focus-ring háttér + focus szín; különben btn-ghost-border/none/text-dim; padding 3px 10px; fs-xs).
- `.km-tema-adv-gomb` (a „▸ Részletes beállítások” fejléc-gomb: border none, background none, text, fs-title, display-betű,
  fw-head, cursor, padding 0, flex gap 8px), `.km-tema-adv` (a lenyíló tartalom: margin-top 14px), `.km-tema-adv-racs`
  (grid `repeat(auto-fill,minmax(140px,1fr))`, gap 10px, margin-bottom 12px).
- `.km-tema-io-gombok` (flex, gap 8px, wrap, margin-bottom 10px), `.km-tema-io-mezo` (textarea: width 100%, padding 10px,
  field-border, r-field, field-bg, text, kód-betű, fs-xs, `direction:ltr`, min-height 120px, resize vertical).
- Előnézet fej: `.km-tema-elonezet-fej` (flex, gap 10px, wrap, align center, margin-bottom 12px), `.km-tema-elonezet-cim`
  (display-betű, fw-strong, fs-title), `.km-tema-elonezet-megj` (fs-xs, text-dim), `.km-tema-mod` (a Desktop/Mobil
  szegmens: `margin-inline-start:auto`, flex, gap 6px, field-bg, line-soft keret, r-btn, padding 3px), `.km-tema-mod-gomb`
  (`[data-be="true"]` → grad-primary + on-primary; különben none + text-mut; r-btn, padding 6px 12px, fs-xs, fw-strong),
  `.km-tema-allapot-valaszto` (a kis select: padding 7px 9px, field-border, r-field, bg-elev, text, fs-xs).
- `.km-tema-elonezet-keret` (flex center, panel-soft, `dashed var(--line-dash)` keret, r-block, padding 18px, overflow auto),
  `.km-tema-elonezet` (a v6 `previewVars` gyökere: width 100%, `transition: max-width 0.25s`; `[data-mobil="true"]` → max-width 375px).
- Az előnézet BELSŐ elemei (a v6 preview blokk; a tokenek a gyökér elemen vannak beállítva, ezért itt minden `var(--…)`):
  `.km-pv-lap` (bg, text, body-betű, fs-base, lh, line-keret, r-card, padding 22px, oszlop, gap 18px), `.km-pv-fejezet`
  (a kis nagybetűs fejezetcím: fs-xs, letter-spacing .06em, uppercase, text-dim, fw-strong, margin-bottom 8px), `.km-pv-sor`
  (flex, gap 10px, wrap, align center), `.km-pv-gomb-elsodleges` (grad-primary, on-primary, border none, r-btn,
  btn-pad-y/x, min-height control-min, fs-base, fw-strong, cursor, glow-árnyék `0 8px 28px var(--glow-primary)`;
  `[data-allapot="hover"]` → `transform: translateY(-2px)`; `[data-allapot="focus"]` → `outline: 2px solid var(--focus); outline-offset: 2px`;
  `[data-allapot="disabled"]` → `background: var(--btn-disabled-bg); color: var(--text-faint); box-shadow: none; cursor: not-allowed`),
  `.km-pv-gomb-szellem` (btn-ghost-bg, `var(--bw) solid var(--btn-ghost-border)`, btn-ghost-text, r-btn, padding
  `var(--btn-pad-y) 20px`, min-height control-min, fs-md; `[data-allapot="hover"]` → btn-ghost-hover),
  `.km-pv-jelveny` (fs-xs, fw-strong, r-badge, padding 3px 9px) + `.km-pv-jelveny-sajat` (src-user-bg / src-user) +
  `.km-pv-jelveny-ai` (src-ai-bg / src-ai), `.km-pv-lepes` (28×28 kör: `border-radius: 50% /* tokenőr: ok — kör */`, inline-flex
  center, fs-sm, fw-head, grad-primary, on-primary, `box-shadow: 0 0 14px var(--glow-primary)`),
  `.km-pv-mezo-cimke` (fs-sm, fw-strong, btn-ghost-text, margin-bottom 6px), `.km-pv-mezo` (width 100%, box-sizing,
  padding pad-field-y/x, `var(--bw) solid var(--field-border)`, r-field, fs-base, field-bg, text; `[data-allapot="focus"]` →
  border-color focus + `box-shadow: 0 0 0 3px var(--focus-ring)`; `[data-allapot="error"]` → border-color err-border),
  `.km-pv-kod-sor` (fs-sm, text-mut) és `.km-pv-kod` (kód-betű, src-web szín, panel-soft-2, padding 2px 7px, r-badge, ltr),
  `.km-pv-hiba` (err-border keret, err-bg, r-block, padding 12px 15px, fs-sm, err), `.km-pv-siker` (ok-bg keret és háttér, ok),
  `.km-pv-ob` (a „Onboarding-részlet” rész: felső vonal `var(--bw) solid var(--line-soft)`, padding-top 16px), `.km-pv-ob-kartya`
  (glass-bg, glass-border, r-card, padding pad-block), `.km-pv-ob-cim` (h3: display-betű, fw-head, fs-h1, line-height 1.2,
  margin 0 0 8px, `text-wrap: pretty`), `.km-pv-ob-kiemelt` (grad-headline szöveg: background-clip text, color transparent),
  `.km-pv-ob-alcim` (text-mut, margin 0 0 14px, fs-md), `.km-pv-ob-mezo` (mint `.km-pv-mezo`, plusz margin-bottom 12px).
- Telefon (`@media (max-width: 900px)`): a fejléc gombjai sorba törnek; `.km-tema-elonezet-oszlop` `position: static`; a
  `.km-tema-fo` padding 14px 12px 60px.

## 2. `apps/web/app/tema/ElonezetPanel.tsx` — az élő előnézet (kliens-komponens, `"use client"`)
```ts
import type { AlapTokenek } from "@km/design-system";
export type ElonezetAllapot = "normal" | "hover" | "focus" | "disabled" | "error";
export function ElonezetPanel(p: {
  teljes: Record<string, string>;      // teljesTokenek(tokenek) — alap + származtatott, EZEK mennek CSS-változóként a gyökérre
  allapot: ElonezetAllapot;
  mobil: boolean;
  t: (kulcs: string) => string;        // feliratok
}): JSX.Element;
```
- A gyökér: `<div className="km-tema-elonezet" data-mobil={p.mobil ? "true" : "false"} style={p.teljes as React.CSSProperties}>`
  (a `Record<string,string>` kulcsai `--…` változók — a React elfogadja; ha a típus nem engedi, `as unknown as React.CSSProperties`).
- Benne PONTOSAN a v6 preview blokk sorrendje és elemei: `.km-pv-lap` → (1) `.km-pv-fejezet` `t("tema.components")` +
  `.km-pv-sor` [Elsődleges gomb `t("tema.primary")`, Másodlagos `t("tema.secondary")`, jelvény `t("jelveny.sajat")`,
  jelvény `t("jelveny.ai")`, lépés-kör „2”] — a gombok `data-allapot={p.allapot}`; (2) mezőcímke `t("tema.field_label")` +
  `<input readOnly className="km-pv-mezo" data-allapot={p.allapot} value={…}>` ahol az érték: error → `t("tema.field_error")`,
  focus → `t("tema.field_focus")`, egyébként `t("tema.field_sample")`; (3) `.km-pv-kod-sor`: `t("tema.code_demo")`: + `<code className="km-pv-kod">--primary: {p.teljes["--primary"]}</code>`
  (a v6-ban fix `#4f5fd6` áll — nálunk az aktuális érték, hogy ne legyen beégetve); (4) csak `allapot === "error"` esetén
  `.km-pv-hiba` `t("tema.err_demo")`; (5) `.km-pv-siker` `t("tema.ok_demo")`; (6) `.km-pv-ob`: `.km-pv-fejezet` `t("tema.ob_snippet")`,
  `.km-pv-ob-kartya`: h3 `.km-pv-ob-cim` = `t("onboarding1.cim_eleje")` + szóköz + `<span className="km-pv-ob-kiemelt">{t("onboarding1.cim_kiemelt")}</span>`,
  `.km-pv-ob-alcim` `t("onboarding1.alcim")`, `<input readOnly dir="ltr" className="km-pv-ob-mezo" value="mintamuhely.hu">`,
  elsődleges gomb `t("onboarding1.gomb")`.
- Nincs saját állapot, nincs hívás, nincs `any`. A gombok `type="button"`, `tabIndex={-1}` (minta, nem vezérlő).

Add vissza a két fájlt `=== FÁJL: <út> ===` blokkban. Ne írj mást.
