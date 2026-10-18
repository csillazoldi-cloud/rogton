# R-8 · tokenek

A rajz a meglévő készletre épül (R-7e: `--fs-base` 16 px, `--fs-sm` 14, `--fs-xs` 12,5, `--control-min` 46 px, `--ter-0…14`, `--urlap-max`, `--lista-max`, `--tile-min`, `--fs-metric`). Ami itt új, indokolva, alapértékkel és tartománnyal. Beégetett érték a komponensben nincs — minden az alábbi tokenekből él (tokenőr).

## Új vagy módosított tokenek

| Token | Alapérték | Tartomány / megjegyzés | Miért |
|---|---|---|---|
| `--font-display` | `'Sora', system-ui, sans-serif` | a Theme-lapon cserélhető; a betűkészlet Google-ról (Adatkezelés lapon már kimondva) | karakteres cím- és számbetű; a `--font-body` marad Manrope/rendszer |
| `--fs-metric` | **34 px** (volt 30) | 28–40 | a kezdőlap és a futás számai hangsúlyosabbak |
| `--grad-primary` | `linear-gradient(120deg, var(--primary) 0%, var(--primary-2) 45%, var(--accent-warm) 100%)` | a három szín tokenből | a fő gomb, a fénysáv, a gradiens szöveg, a logó — egy gradiens, sok elem |
| `--primary` | `#5b6cff` (volt #4f5fd6) | a Megjelenés egyszerű nézetén választható | élénkebb indigó a sötét alapon; a régi érték tartományon belül marad |
| `--primary-2` | `#9a6bff` | a `--primary`-ból származtatott lila (R-7c E5 kérdése — itt a válasz: külön token, a gradiens középső pontja) | |
| `--accent-warm` | `#ff7a59` | a Megjelenés lapon állítható „kiemelő szín" | a meleg pont: a gradiens vége, a jelvény pötty, az AI-korong |
| `--accent-gold` | `#ffb86b` | | az „érdekes" kategória jelzése (chip + színcsík); a „fontos" a `--accent-warm` |
| `--bg` | `#070912` | | a mai `--bg` mélyebb, kékes fekete — a fényudvar ezen látszik |
| `--surface` | `rgba(255,255,255,.035)` · `--surface-2` `rgba(255,255,255,.07)` | | üvegszerű kártyák a fényudvar fölött (átlátszó, nem tömör szín) |
| `--border` | `rgba(255,255,255,.08)` · `--border-2` `rgba(255,255,255,.16)` | | |
| `--glow-primary` | `0 8px 28px rgba(140,100,255,.45)` | | a fő gomb és a kiemelt kártya ragyogása |
| `--glow-warm` | `0 0 14px rgba(255,122,89,.3)` | | a meleg jelvények |
| `--aurora-1/2/3` | `#4a5cff` · `#ff6a4a` · `#ffb020` | a Theme-lapon egyben kapcsolható (`--aurora-opacity` 0 = nincs fényudvar) | a háttér három fényfoltja; a nyugalmat kereső ügyfél kikapcsolhatja |
| `--aurora-opacity` | `.5` | 0–.7 | |
| `--r-card` | 16 px (volt 12) · `--r-btn` 12 px (volt 10) | | lágyabb kártyák a fényudvarhoz |
| `--motion-rise` | `.6s cubic-bezier(.2,.8,.2,1)` | `prefers-reduced-motion`: 0 | a kártyák beúszása |
| `--orb-size` | 88 px · `--orb-size-sm` 44 px | | az AI fénykorongja (forgó kúpos gradiens a `--grad-primary` színeiből + `--accent-gold`) |

## Ami marad a mai értéken

`--fs-base` 16 · `--fs-sm` 14 · `--fs-xs` 12,5 · `--control-min` 46 · a 15 fokú térköz-skála · `--tile-min` 300 · `--urlap-max` / `--lista-max` · a narancs (`--warn`) **csak figyelmeztetésre** — a rajzon a `--warn` külön token (`#ff5a5a`, vöröses), hogy ne keveredjen a meleg kiemelővel.

## Szabályok, amiket a rajz kimond

- Egy fő művelet lapon, mindig `--grad-primary`-val és `--glow-primary`-val; minden más gomb üveg (`--surface-2`) vagy körvonalas.
- Gradiens szöveg (`.grad`) csak egy-két szóra egy mondatban (az összkép kulcsszava, a „indulhat", a fő számok) — nem bekezdésre.
- Fénykorong csak ott, ahol az AI **éppen dolgozik** vagy **az ő eredménye** áll (összkép, folyamat, javaslat sávja, „az AI dolgozik" lap). Nem díszítés máshol.
- A fényudvar a lap háttere, nem a kártyáké; a kártyák mögött elmosódva átdereng.
- Nézőnek a gombok nem jelennek meg; a fénykorong és az összkép igen (az eredmény az övé is).
