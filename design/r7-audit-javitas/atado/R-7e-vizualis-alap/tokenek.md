# Tokenek — R-7e · a skála

Rajz: `rajz/R7e-skala.dc.html` · egy artboard: betűskála, mezők, gombok, jelvények, dobozok, tartalomszélesség, felület.
Ez a lap **nem képernyő** — itt az érték a döntés. Ma mérve: `--fs-base` 15px, `--fs-sm` = base − 2, `--fs-xs` = base − 3, `--control-min` 44px.

## Betűskála — arányos származtatás, nem kivonásos

| Token | Régi | Új | Származtatás | Tartomány |
|---|---|---|---|---|
| `--fs-base` | 15px | **16px** | alapérték (a Megjelenés egyszerű nézetének három állása: 15 / 16 / 18) | 14–20px |
| `--fs-md` | 14px | **15px** | 0,9375 × base | számított |
| `--fs-sm` | 13px (base − 2) | **14px** | **0,875 × base** | számított |
| `--fs-xs` | 12px (base − 3) | **12,5px** | 0,78 × base, **de legalább 12,5px** | alsó korlát 12,5px |
| `--fs-title` | 16px | **17px** | 1,0625 × base | számított |
| `--fs-h2` | 24px | **26px** | 1,625 × base | számított |
| `--fs-h1` | 34px | **34px** (nyilvános lapon 42px) | 2,125 × base | 30–44px |
| `--lh` | 1,55 | **1,5** | — | 1,4–1,6 |

Az alsó korlát azért kell, mert nagy `--fs-base` esetén az arányos `--fs-xs` is nő, kicsi base-nél viszont 12,5px alá esne — a jelvények és időpontok ott olvashatatlanok.

## Mezők és érintési terület

| Token | Régi | Új | Megjegyzés |
|---|---|---|---|
| `--control-min` | 44px | **46px** | **minden** mező, gomb, választó, sorlista-sor és chip ebből él — telefonon is |
| `--control-min-s` | 36px | **38px** | csak a felső sáv és a kártyán belüli másodlagos gombok |
| `--pad-field-y` / `--pad-field-x` | `--ter-6` / `--ter-7` | változatlan | a magasságot a `min-height` adja, nem a párnázás |

A fejlesztő oldal listája kell arról, melyik mező **nem** a `--control-min`-ből él — azokat egyenként át kell kötni.

## Színek jelentése

| Token | Régi érték | Új érték | Miért |
|---|---|---|---|
| `--src-ai` | `--accent-text` (narancs) | **`--primary-2`** | az AI-eredet nem figyelmeztetés |
| `--src-ai-bg` | `--accent` 20% | **`--primary-2` 14%** | halkabb, semleges |
| `--accent-link` | `#ff6a40` (narancs) | **`var(--primary-2)`** | a link nem figyelmeztetés |
| `--src-user` / `--src-user-bg` | `--ok` (zöld) | **`--text-mut` / `--text` 7%** | a „te adtad meg” nem eredmény, csak eredet |
| `--warn` / `--warn-bg` / `--warn-border` | változatlan | változatlan | **kizárólag** figyelmeztetés: forráshiba, nem mentett változás, AI nem válaszolt |
| `--accent` / `--accent-text` | változatlan | **csak a `--warn` alapja** | halasztott arculat, AI-eredet, link nem használja |

## Hierarchia és dobozok
- Egy fő művelet lapon: `--grad-primary`. A másodlagos `--btn-ghost-*`, a halk háttér nélkül.
- A navigáció aktív állapota `--panel-soft-2` háttér + 2px aláhúzás `--text-mut`-tal — **nem** a kiemelőszín.
- Kártya (`--r-card`, `--bg-elev`) csak valóban különálló tartalomnak. Kapcsolódó mezők egy szakaszban, kerettel körbevett belső doboz nélkül. Panelen belüli panel nincs.
- A munkafelületen nincs fotó, üveg (`--blur-glass`, `--glass-*`), gradiens-háttér és glow; a `--glass-*` tokenek az R-7 lapokon nem szerepelnek. Dekoráció csak a nyitólapon.

## Tartalomszélesség — két új token

| Token | Alapérték | Tartomány | Mire |
|---|---|---|---|
| `--urlap-max` | **680px** | 640–720px | űrlapok, egyoszlopos lapok (regisztráció, onboarding, adatkezelés) |
| `--lista-max` | **1180px** | 1100–1200px | listák, kezdőlap, sorlisták |

Indok: ma minden lap más maximumot használ (560 / 1060 / 1180), ezért a lapcím vízszintes pozíciója lapról lapra ugrik. A két token egy helyen tartja. Kivétel, jelezve: a Hírfigyelés beállítása 760px — ott a forrássoron három művelet fér el egymás mellett.

## Válasz a kérés 8.4 kérdésére
A Theme Betűméret füljén **elég a származtatás cseréje**: a három csúszkából egy marad (`--fs-base`), a `--fs-sm` / `--fs-xs` / `--fs-title` / `--fs-h2` számítottá válik. Ha a rendszergazdának mégis kézi felülírás kell, az a haladó lapon maradhat egy „származtatás felülírása” szakaszban — de erre a rajz nem tesz vezérlőt, mert nincs rá gépezet.
