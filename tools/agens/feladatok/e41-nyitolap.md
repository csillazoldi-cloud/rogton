Te egy React/TypeScript fejlesztő vagy egy meglévő Next.js 16 alkalmazásban. A feladat: a mellékelt
RAJZ átültetése kódba. A rajz a mérce: ami nincs rajta, az ne kerüljön a képernyőre; ami rajta van,
az kerüljön rá, ugyanabban a sorrendben és arányokkal.

MELLÉKLETEK
1. `Nyitolap.dc.html` — a RAJZ. KÉT artboard van benne: az első az asztali (1440 széles), a második
   a telefonos (390 széles). Ugyanaz a tartalom, ezért EGY komponenst írj, ami CSS-sel törik.
2. `NYITOLAP-ATADO.md` — a tervező átadója: szerkezet, tokenhasználat, mobil eltérések, ellenőrzőlista.
3. `hirfigyelo.css` — egy meglévő lap CSS-e ebből az alkalmazásból: ebből látod, hogyan írunk CSS-t.

AMIT ÍRNOD KELL — pontosan két fájl:

=== FÁJL: apps/web/app/Nyitolap.tsx ===
Kiszolgálói komponens (NINCS benne "use client"). Bemenete:
`{ t: (kulcs: string) => string; verzio: string; nyelvvalaszto: React.ReactNode }`
A `nyelvvalaszto` egy kész elem, tedd a fejlécbe oda, ahol a rajzon a nyelvválasztó van.
Minden látható szöveg a `t("kulcs")` hívásból jön — SOHA ne írj be magyar szöveget közvetlenül.

A HASZNÁLHATÓ KULCSOK (ezeken kívül nincs másik, ne találj ki újat):
nyitolap.termeknev, nyitolap.belepes, nyitolap.regisztracio, nyitolap.kicker,
nyitolap.h1_eleje, nyitolap.h1_kiemelt, nyitolap.h1_vege, nyitolap.hero_alcim, nyitolap.hero_megj,
nyitolap.kartya_cim, nyitolap.k1_cim, nyitolap.k1_szoveg, nyitolap.k2_cim, nyitolap.k2_szoveg,
nyitolap.k3_cim, nyitolap.k3_szoveg, nyitolap.k4_cim, nyitolap.k4_szoveg, nyitolap.kartya_labjegyzet,
nyitolap.mit_tud_cim, nyitolap.mit_tud_alcim, nyitolap.f1_cim, nyitolap.f1_szoveg,
nyitolap.f2_cim, nyitolap.f2_szoveg, nyitolap.f3_cim, nyitolap.f3_szoveg,
nyitolap.indul_cim, nyitolap.l1_cim, nyitolap.l1_szoveg, nyitolap.l2_cim, nyitolap.l2_szoveg,
nyitolap.l3_cim, nyitolap.l3_szoveg,
nyitolap.adat_cim, nyitolap.adat_bevezeto, nyitolap.adat_1_cim, nyitolap.adat_1_szoveg,
nyitolap.adat_2_cim, nyitolap.adat_2_szoveg, nyitolap.adat_reszletek, nyitolap.adat_helykitolto,
nyitolap.adat_link, nyitolap.zaro_cim, nyitolap.zaro_szoveg, nyitolap.arazas,
nyitolap.ceg, nyitolap.kapcsolat, nyitolap.teszt_jelveny

A `h1` három részből áll: `h1_eleje` + `h1_kiemelt` (ez kapja a színátmenetes kiemelést,
`background: var(--grad-headline)` + `background-clip: text`) + `h1_vege`.

Hivatkozások: „Fiók létrehozása" → `/regisztracio`, „Belépés" → `/belepes`,
„Adatkezelési tájékoztató" → `/adatkezeles`. A verziószámot a `verzio` bemenetből írd ki.

=== FÁJL: apps/web/app/nyitolap.css ===
A lap CSS-e. Osztálynév-előtag: `.km-ny`.

KÖTELEZŐ SZABÁLYOK A CSS-RE (a rendszer ellenőrzi, és elbukik, ha megsérted):
- SEMMILYEN beégetett érték nincs: se szín (#hex, rgb, hsl), se `font-size: 14px`, se
  `font-weight: 600`, se `border-radius: 8px`. MINDEN ilyen érték `var(--token)` alakban áll.
- A rajzon szereplő méretekhez ezek a tokenek tartoznak:
  hero cím `--fs-hero` (telefonon `--fs-hero-sm`), szekciócím `--fs-szekcio`, zárócím `--fs-zaro`,
  lapcím `--fs-h1`, kártyacím `--fs-title`, alapszöveg `--fs-base`, kisebb `--fs-md`,
  még kisebb `--fs-sm`, legkisebb `--fs-xs`.
- Szín: `--bg`, `--bg-elev`, `--text`, `--text-mut`, `--text-dim`, `--text-faint`, `--primary`,
  `--primary-2`, `--on-primary`, `--accent`, `--accent-text`, `--ok`, `--focus`; származtatottak:
  `--grad-primary`, `--grad-headline`, `--line`, `--line-soft`, `--panel-soft`, `--panel-soft-2`,
  `--field-bg`, `--field-border`, `--btn-ghost-bg`, `--btn-ghost-border`, `--glass-bg`,
  `--glass-border`, `--glow-primary`, `--accent-tint-weak`, `--accent-border-soft`,
  `--src-web`, `--src-ai`, `--src-empty`, `--focus-ring`.
- Lekerekítés: `--r-card`, `--r-block`, `--r-btn`, `--r-field`, `--r-badge`. Kör alakú elemnél
  `border-radius: 50%; /* tokenőr: ok — kör alak */` a megengedett kivétel.
- Betűvastagság: `--fw-head`, `--fw-strong`.
- Térköz: `--pad-card`, `--pad-block`, `--gap`; gombok: `--btn-pad-y`, `--btn-pad-x`, `--control-min`.
- Betűcsalád: `--font-display-active`, `--font-body-active`, `--font-code-active`.
- Töréspont 720 px alatt: egy oszlop, a rácsok egymás alá, a gombok teljes szélességűek,
  a hero cím `--fs-hero-sm`. A rajz telefonos artboardja mutatja, mi hogyan néz ki ilyenkor.
- A háttérben lévő két úszó fényfolt legyen benne (`pointer-events:none`, `aria-hidden`),
  és `@media (prefers-reduced-motion: reduce)` esetén álljon meg minden animáció.

SZABÁLYOK
- TypeScript, szigorú típusok, `any` nélkül. React 19, Next 16.
- Szemantikus jelölés: `header`, `main`, `section`, `footer`, `h1`, `h2`, `h3`; a díszítő SVG-k
  `aria-hidden="true"`. A gombok, amik navigálnak, `<a>` elemek.
- Az ikonok vonalas SVG-k a rajzból; ne emodzsi.
- A válaszod CSAK a két fájlblokk legyen, `=== FÁJL: út ===` és `=== FÁJL VÉGE ===` közé zárva.
