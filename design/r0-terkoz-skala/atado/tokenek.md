# Tokenek — R-0 · Térköz-skála

Ez a rajz a térközről szól, ezért a saját szabályát a legszigorúbban tartja: **minden térköz a
skálából jön**, és az öt artboardon egyetlen pixelben írt térköz sincs — egy kivétellel, amit a
3. pont nevez meg.

## 1. Az új tokenek — a tizenöt fok

| Token | Alapérték | Miért kell |
|---|---|---|
| `--ter-0` | `0px` | A térköz hiánya, megnevezve. Kell, mert a „nincs köz” is döntés, és így a kódban sem marad csupasz `0`. Nem állítható. |
| `--ter-1` | `2px` | A legsűrűbb köz: jelvény belseje, pötty melletti hely. A mérésben 48 előfordulás. |
| `--ter-2` | `4px` | Címke és érték, ikon melletti köz. 61 előfordulás. |
| `--ter-3` | `6px` | Jelvény vízszintes tere, apró sorköz. 54 előfordulás. |
| `--ter-4` | `8px` | **A leggyakoribb köz a rendszerben**, 198 előfordulás. |
| `--ter-5` | `10px` | Lista sorai, kártyán belüli sorok, gombok közt. 143 előfordulás. |
| `--ter-6` | `12px` | Mezők és gombsorok köze, mezőbelső függőlegesen. 90 előfordulás. |
| `--ter-7` | `14px` | Csempék közti köz, mezőbelső vízszintesen. 90 előfordulás. |
| `--ter-8` | `16px` | Csempe belseje, telefonos lapmargó. 51 előfordulás. |
| `--ter-9` | `20px` | Nagy panel belseje. |
| `--ter-10` | `24px` | Lapmargó, gomb vízszintes tere. 31 előfordulás. |
| `--ter-11` | `32px` | Üvegkártya belseje. |
| `--ter-12` | `40px` | Rajzvászon margója, nagy szakaszköz. |
| `--ter-13` | `56px` | Szakaszok, artboardok közti levegő. |
| `--ter-14` | `80px` | A lépcső teteje. |

**Tartomány a Theme-lap szerkesztőjéhez:** minden fok 0-tól a következő fok kétszereséig
állítható, és **a lépcső monoton marad** — egy fok nem lehet nagyobb a következőnél. Ezt a lap
ellenőrizze, mert egy felcserélt fok az egész felületet szétszórja.

**Fok nem vehető fel és nem törölhető.** A skála zárt: ha egy elrendezéshez olyan érték kell,
ami nincs a lépcsőn, az a lépcső hibája, és akkor ez a lista változik — nem keletkezik kivétel.

## 2. A mai térköz-tokenek — megmaradnak, a skálára mutatnak

Egy sor kód sem törik el: a mai nevek érvényben maradnak, csak az értékük lesz `var(--ter-*)`.

| Mai token | Mai érték | Ezután | Elmozdulás |
|---|---|---|---|
| `--gap` | 12px | `var(--ter-6)` | nem változik |
| `--pad-card` | 36px | `var(--ter-11)` | −4px |
| `--pad-block` | 22px | `var(--ter-9)` | −2px |
| `--pad-field-y` | 13px | `var(--ter-6)` | −1px |
| `--pad-field-x` | 15px | `var(--ter-7)` | −1px |
| `--btn-pad-y` | 13px | `var(--ter-6)` | −1px |
| `--btn-pad-x` | 26px | `var(--ter-10)` | −2px |
| `--gap-tile` *(R-1)* | 14px | `var(--ter-7)` | nem változik |
| `--pad-tile` *(R-1)* | 18px | `var(--ter-8)` | −2px |
| `--pad-row-y` *(R-2)* | 14px | `var(--ter-7)` | nem változik |

**Nem térköz, marad önálló token:** `--tile-min` (300px, rácshasáb minimális szélessége),
`--fs-metric` (30px, betűméret), `--control-min` (44px, vezérlőmagasság), `--control-min-s`
(36px), `--bw`, az `--r-*` és az `--fs-*` család.

## 3. Ahol a rajz szándékosan nem tokent használ

**Egy hely van, a 3. artboard bal oldali („ELŐTTE”) részlete.** Ott a mai pixelértékek állnak
— 22 · 9 · 7 · 13 · 26 · 10 · 16 —, mert épp azt mutatja, amitől megszabadulunk. A felirat
kimondja, hogy ez a rajz egyetlen ilyen helye.

Ezen kívül a rajzban két érték nem a skálából jön, de nem is térköz:
- a fok-vonal magassága (14px) — a vonal maga az elem, a szélességét a fok adja;
- a jelvények és a pöttyök méretei, ahol a meglévő lapokon is alakértékek.

## 4. A Theme-beállítások lap

53 → **68 token**. Hat csoport: Szín · Betű · Betűméret · Forma · Térköz · Egyéb.
A térköz-csoport tartalma a `ATADO.md` 5. pontjában.

## 5. Használt meglévő tokenek

**Alap:** `--bg` `--bg-elev` `--text` `--text-mut` `--text-dim` `--text-faint` `--on-primary`
`--primary` `--primary-2` `--accent` `--accent-text` `--accent-link` `--ok` `--err` `--focus`
`--shadow-color` `--shadow-strength` `--font-display` `--font-body` `--font-code` `--fw-head`
`--fw-strong` `--fs-h1` `--fs-base` `--fs-title` `--r-card` `--r-block` `--r-btn` `--r-field`
`--r-badge` `--bw` `--control-min` `--lh` `--glass-alpha` `--motion`

**Származtatott:** `--font-*-active` `--grad-primary` `--focus-ring` `--glow-primary`
`--ok-strong` `--ok-bg` `--err-*` `--warn` `--warn-border` `--warn-bg` `--src-web`
`--src-web-bg` `--src-ai` `--src-ai-bg` `--src-empty` `--glass-border` `--line` `--line-soft`
`--line-dash` `--field-bg` `--field-border` `--panel-soft` `--panel-soft-2` `--btn-ghost-*`
`--shadow-pop` `--fs-h2` `--fs-md` `--fs-sm` `--fs-xs` `--control-min-s`

**Két új, nem térköz-token a rajz jelöléseihez** — csak akkor kell, ha a Theme-lap
térköz-csoportja megépül, mert a fok-vonal színe onnan jön:

| Token | Alapérték | Miért |
|---|---|---|
| `--ter-jel` | `color-mix(in srgb, var(--primary-2) 55%, transparent)` | a fok-vonal színe a Theme-lapon |
| `--ter-jel-bg` | `color-mix(in srgb, var(--primary-2) 14%, transparent)` | a fok-bélyeg háttere |

Ha nem akarsz két új színtokent, a vonal `--src-web`-bel, a bélyeg `--src-web-bg`-vel is
megoldható — akkor viszont a fok-jelölés ugyanúgy néz ki, mint a „web forrás” jelvény.
**Ez kérdés Vilmoshoz** (lásd `kerdesek.md`).
