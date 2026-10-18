# Feladat — ÉPÍTŐ (R8T): az R-8 vizuális nyelv tokenjei — kék/indigó alap, meleg korall kiemelés, fényudvar, AI-korong, Sora címbetű

Vilmos 2026-09-15-én elfogadta az R-8 rajzot (kék alap + meleg korall kiemelés), és 2026-09-16-án kérte: a kinézet MINDEN lapon legyen az, ami a rajzon — „LEGYEN SZÉP". Ez a lépés a tokenkészletet és a közös alapstílust hozza a rajz szintjére; a lapok szerkezete külön lépés. A `R8-tokenek.md` (mellékelve) a szerződés.

TypeScript 7 strict, zod 4.5. `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkok. TELJES fájl, ahol ezt írom; RÉSZLET-fájl (`_RESZLET-….md`, `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI SZÓ SZERINT a mellékletből, egyedi) a nagy fájlokhoz. Magyar azonosítók és megjegyzések. CSS csak tokenekkel — az alap.css-ben a `body::before` fényudvar is csak `var(--…)`-ból él (a `%` és a `deg` értékek a gradiens-leírásban nem „beégetett méret" — ha a tokenőr mégis kifogásolná, a sor végére `/* tokenőr: ok — fényudvar alakja, nem méret */`).

## MÉRT tények (2026-09-16)
- A tokenkészlet: `packages/design-system/src/tokenek.ts` (zod, `.strict()`), a szabályok/tartományok `tema-szintek.ts` (`TOKEN_SZABALYOK`, TELJES kulcslista — új tokent MINDKETTŐBE fel kell venni, különben a `.strict()` séma elutasítja a tárolt témát), az alapértékek `tema-alap.json`, a származtatás `index.ts` `szarmaztat()`. A közös alap a `tema` táblában tárolva van (TELJES készlet): a JSON csak a HIÁNYZÓ kulcsokat pótolja — ezért a MEGVÁLTOZÓ meglévő értékeket migrációval kell a tárolt közös alapba írni (minta: `0052_csempe_tokenek.sql`, mellékelve; ott a tárolt nyer — most a rajz nyer, mert Vilmos a rajzot fogadta el: a jsonb `||` sorrendje fordított).
- A betűk a `apps/web/app/layout.tsx` Google-linkjéből jönnek (mellékelt részlet). Ma: `--font-display` 'Archivo', `--font-body` 'Public Sans'.
- `--grad-primary` ma kétpontos (`--primary` → `--primary-2`); `--glow-primary` egy color-mix szín (nem árnyék). A meglévő komponensek `box-shadow: var(--glow-primary)`-t is használnak — ezért az új `--glow-primary` LEGYEN teljes árnyék-érték (`0 8px 28px <szín>`), és aki színként használta, az a `--glow-primary-color`-t kapja (nézd meg a mellékelt `glow-hasznalat.txt`-t: ott a sorok; ha egy sor `box-shadow:`-ban használja, jó; ha `background`/`border`/`color`-ban, cseréld `--glow-primary-color`-ra a RÉSZLET-ben).

## Mit kell megírni

### 1. RÉSZLET: `_RESZLET-tokenek.md` (a mellékelt `tokenek.ts`-hez) — új alaptokenek a sémában, a `--fatyol` sora UTÁN:
```ts
  // R-8 (2026-09-15, Vilmos): meleg korall kiemelő (a gradiens vége, az AI-korong, a „fontos" jelzés), arany az „érdekes"-hez,
  // a fényudvar erőssége (0 = nincs), az AI-korong mérete.
  "--accent-warm": szin, "--accent-gold": szin,
  "--aurora-opacity": szazalek(0, 70),
  "--orb-size": meret(44, 120),
```
(a `szin`, `szazalek`, `meret` segédek a fájlban léteznek — a mellékletben látod a nevüket; ha másképp hívják, azt használd.)

### 2. RÉSZLET: `_RESZLET-tema-szintek.md` (a mellékelt `tema-szintek.ts`-hez) — a `TOKEN_SZABALYOK` végére (a `"--fatyol"` sora UTÁN): `"--accent-warm": { tipus: "color" }, "--accent-gold": { tipus: "color" }, "--aurora-opacity": { tipus: "percent", min: 0, max: 70 }, "--orb-size": { tipus: "size", min: 44, max: 120 }, // R-8`.

### 3. TELJES: `packages/design-system/src/tema-alap.json` (mellékelve) — a megváltozó értékek (minden más marad):
`--bg` `#070912` · `--bg-elev` `#0d1020` · `--primary` `#5b6cff` · `--primary-2` `#9a6bff` · `--accent` `#ff7a59` · `--accent-text` `#ffb39f` · `--accent-link` `#9fa8ff` · `--font-display` `'Sora',sans-serif` · `--font-body` `'Manrope',sans-serif` · `--fs-metric` `34px` · `--r-card` `16px` · `--r-block` `12px` · `--r-btn` `12px` · `--r-field` `10px` · `--r-badge` `999px` · `--keszul` `#9fb0d8` (marad) · új: `--accent-warm` `#ff7a59`, `--accent-gold` `#ffb86b`, `--aurora-opacity` `50`, `--orb-size` `88px`.

### 4. RÉSZLET: `_RESZLET-index.md` (a mellékelt design-system `index.ts`-hez) — a `szarmaztat()`-ban:
- `"--grad-primary"` → `` `linear-gradient(120deg,${t["--primary"]} 0%,${t["--primary-2"]} 45%,${t["--accent-warm"]} 100%)` `` (megjegyzés: `// R-8: három pont, a vége a meleg korall`).
- `"--glow-primary": kever(t["--primary"], 40), "--glow-primary-strong": kever(t["--primary-2"], 50),` → `"--glow-primary-color": kever(t["--primary"], 40), "--glow-primary": \`0 8px 28px ${kever(t["--primary-2"], 45)}\`, "--glow-primary-strong": \`0 12px 40px ${kever(t["--primary-2"], 60)}\`, "--glow-warm": \`0 0 14px ${kever(t["--accent-warm"], 30)}\`,` (megjegyzés: `// R-8: a ragyogás teljes árnyék-érték; a régi szín-változat --glow-primary-color`).
- Új sorok a `--blob1…3` után: `"--aurora-1": kever(t["--primary"], t["--aurora-opacity"] || "50"), "--aurora-2": kever(t["--accent-warm"], t["--aurora-opacity"] || "50"), "--aurora-3": kever(t["--accent-gold"], Math.round(parseInt(t["--aurora-opacity"] || "50", 10) * 0.7)),` és `"--orb-size-sm": \`${Math.round(px(t["--orb-size"]) / 2)}px\`,` és `"--motion-rise": t["--motion"] === "off" ? "0.001s" : t["--motion"] === "slow" ? "1s" : "0.6s",` és `"--surface": kever(txt, 3.5), "--surface-2": kever(txt, 7), "--border": kever(txt, 8), "--border-2": kever(txt, 16),` (megjegyzés: `// R-8: üvegszerű kártyák a fényudvar fölött`).
- Minden más sor marad.

### 5. RÉSZLET: `_RESZLET-layout.md` (a mellékelt layout-részlethez): a Google-link `family=` listája elejére `Sora:wght@600;700;800&family=Manrope:wght@400;500;600;700&` kerül (a többi család marad).

### 6. RÉSZLET: `_RESZLET-alap-css.md` (a mellékelt `alap.css`-hez) — a fájl végére (a RÉGI: az utolsó két sor szó szerint):
```css
/* R-8 (2026-09-15): a fényudvar a LAP háttere — három fényfolt a --aurora-1/2/3 tokenekből; --aurora-opacity 0 = nincs. Elmosva, a kártyák mögött átdereng. */
body { position: relative; }
body::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(60% 50% at 12% 8%, var(--aurora-1), transparent 60%),
    radial-gradient(45% 40% at 88% 18%, var(--aurora-2), transparent 60%),
    radial-gradient(50% 45% at 50% 100%, var(--aurora-3), transparent 60%); /* tokenőr: ok — a fényfoltok alakja, nem méret */
  filter: blur(var(--blur-glass)); opacity: 1; }
/* R-8: az AI fénykorongja — csak ott, ahol az AI éppen dolgozik vagy az ő eredménye áll (összkép, folyamat, javaslat). */
.km-orb { width: var(--orb-size); height: var(--orb-size); border-radius: 50%; /* tokenőr: ok — kör alak */ flex: none; position: relative;
  background: conic-gradient(from 0deg, var(--primary), var(--primary-2), var(--accent-warm), var(--accent-gold), var(--primary)); /* tokenőr: ok — a korong színkúpja */
  box-shadow: var(--glow-primary); animation: km-orb-forog var(--dur-amb) linear infinite; }
.km-orb::after { content: ""; position: absolute; inset: var(--ter-3); border-radius: 50%; /* tokenőr: ok — kör alak */ background: var(--bg-elev); }
.km-orb-sm { width: var(--orb-size-sm); height: var(--orb-size-sm); }
.km-orb-sm::after { inset: var(--ter-2); }
@keyframes km-orb-forog { to { transform: rotate(360deg); } }
/* R-8: a kártyák beúszása — prefers-reduced-motion: nincs. */
.km-emelkedik { animation: km-emelkedik var(--motion-rise) cubic-bezier(.2,.8,.2,1) both; }
@keyframes km-emelkedik { from { opacity: 0; transform: translateY(var(--ter-6)); } to { opacity: 1; transform: none; } }
/* R-8: gradiens szöveg — egy-két szóra egy mondatban, nem bekezdésre. */
.km-grad { background: var(--grad-primary); -webkit-background-clip: text; background-clip: text; color: transparent; }
@media (prefers-reduced-motion: reduce) { .km-orb { animation: none; } .km-emelkedik { animation: none; } }
```

### 7. TELJES migráció: `apps/web/adatbazis/migraciok/0081_r8_tokenek.sql`
Fejléc `-- R-8 (Vilmos 2026-09-15): a tokenkészlet a rajz szintjén — a TÁROLT közös alapban a rajz értékei nyernek; új tokenek; a Megjelenés lap feliratai`. Egy `UPDATE "tema" SET "definicio" = jsonb_set("definicio", '{tokens}', ("definicio" -> 'tokens') || '{…}'::jsonb)` — a `{…}` a 3. pont MINDEN megváltozó és új kulcsa értékkel (a rajz nyer: a `||` jobb oldalán a rajz). Utána `--> statement-breakpoint` és feliratok (`INSERT INTO "felirat" … ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();`): `tema.accent_warm` (hu „Meleg kiemelő szín" · ro „Culoare de accent caldă" · en „Warm accent"), `tema.accent_gold` („Arany jelzés (érdekes)" · „Auriu (interesant)" · „Gold (interesting)"), `tema.aurora_opacity` („Fényudvar erőssége (0 = nincs)" · „Intensitatea aurei (0 = fără)" · „Aurora strength (0 = none)"), `tema.orb_size` („AI-korong mérete" · „Mărimea discului AI" · „AI orb size").

### 8. RÉSZLET: `_RESZLET-tema-lap.md` (a mellékelt Tema.tsx részlethez): a `csuszka("--fs-metric", t("tema.fs_metric"), 18, 48)` sora UTÁN: `{csuszka("--aurora-opacity", t("tema.aurora_opacity"), 0, 70)}` és `{csuszka("--orb-size", t("tema.orb_size"), 44, 120)}`; a színválasztók közé (a mellékletben a `--primary-2` színválasztójának sora után, ugyanazzal a segéddel) `--accent-warm` (`t("tema.accent_warm")`) és `--accent-gold` (`t("tema.accent_gold")`).

## Elfogadás (a beépítő méri)
`pnpm tipus` zöld; `pnpm tokenor` 0; a design-system próbái zöldek; élőben a `:root` `--grad-primary` három pontos, a háttéren látszik a fényudvar, a címbetű Sora. Add vissza: _RESZLET-tokenek.md, _RESZLET-tema-szintek.md, tema-alap.json, _RESZLET-index.md, _RESZLET-layout.md, _RESZLET-alap-css.md, 0081 migráció, _RESZLET-tema-lap.md.
