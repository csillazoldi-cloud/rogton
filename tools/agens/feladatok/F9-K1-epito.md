# Feladat — ÉPÍTŐ (F9-K1): EGY közös lapkeret minden belépett lapnak, és a keretőr, ami kikényszeríti

Vilmos szabálya (2026-09-16): **MINDEN lap ugyanabba a keretbe kerül** — 1180 pont széles, középen, a közös bal-jobb margóval —, és legyen gépezet, ami lehetetlenné teszi, hogy bármelyik lap máshogy jelenjen meg. MÉRVE ma 1440-es ablakban: Kezdőlap, Hírek, Szervezet adatai, Beállítások(Gépház), Saját fiók, AI-használat = 1180 középen (x=130); **Beállítások (`/beallitasok`) = 960 balra tapadva (x=0)**; Csapattagok = teljes szélesség, benne 1200; Megjelenés = 680 középen; Felület szövegei = 1400; az onboarding és a Kész lap = teljes szélességű `km-kozep`, benne középre tett kártya.

TypeScript 7 strict, CSS csak tokenekkel (nincs beégetett px a térközben — a tokenőr elbukik rajta; a szélesség `var(--lista-max)`). Minden kimenet `=== FÁJL: <út> ===` … `=== FÁJL VÉGE ===` blokkban. A nagy fájlokhoz RÉSZLET-fájl (`_RESZLET-<név>.md`, CSERE-blokkok: `### CSERE n` / `--- RÉGI` / `--- ÚJ` / `--- VÉGE`; a RÉGI SZÓ SZERINT és egyedi). Magyar azonosítók és megjegyzések.

## Mit kell megírni

### 1. A közös keret — RÉSZLET: `_RESZLET-alap.md` (a mellékelt `apps/web/app/alap.css`-hez)
A fájl végére (a RÉGI blokk: az utolsó két sor szó szerint):
```css
/* F9-K1 (Vilmos szabálya 2026-09-16): EGY lapkeret minden belépett lapnak — 1180 (a --lista-max token) középen, a közös margóval.
   A lap saját osztálya csak a BELSŐ elrendezését adja (rács, oszlopok, gap); szélességet, középre igazítást, külső térközt NEM. A keretőr (tools/hatar/keretor.mjs) ezt kényszeríti ki. */
.km-lap-keret { width: 100%; max-width: var(--lista-max); margin-inline: auto; padding: var(--ter-10) var(--ter-10) var(--ter-13); box-sizing: border-box; }
@media (max-width: 640px) { .km-lap-keret { padding: var(--ter-8) var(--ter-6) var(--ter-12); } }
```

### 2. Minden `<main` a keretbe — egy RÉSZLET-fájl minden érintett tsx-hez (`_RESZLET-<mappa>-<fájl>.md`)
A mellékelt `F9-K1-main-sorok.txt` 15 sort ad (fájl:sor és a `<main …` sor tartalma). MINDEGYIKNÉL a `className` elejére `km-lap-keret ` kerül:
- `className="km-tg-fo"` → `className="km-lap-keret km-tg-fo"` (és így tovább mind a 15-nél);
- ahol a className kifejezés (pl. `className={\`km-ob-racs${…}\`}`), ott: `className={\`km-lap-keret km-ob-racs${…}\`}`.
A RÉGI blokkba a teljes `<main` sort tedd, ahogy a mellékletben áll (a sor eleji behúzással együtt — a mellékletben a `fájl:sor` előtag NEM része a sornak).

### 3. A lapok saját osztályai elvesztik a keret-tulajdonságaikat — egy RÉSZLET-fájl minden érintett css-hez (`_RESZLET-<mappa>-<fájl>.css.md`)
A mellékelt `F9-K1-css-blokkok.txt` 28 blokkot ad (fájl + a szabály szó szerint). Minden blokkban, ami az alábbi osztályok egyikére vonatkozik (`km-ob-racs km-tg-fo km-koltsajat-tartalom km-kp-fo km-feliratok-fo km-fp-fo km-kozep km-adk-lap km-sf-lap km-be-lap km-hf-tartalom km-gh-fo km-ki-lap km-tema-egyszeru-fo km-tema-fo`): TÖRÖLD a `max-width`, `width`, `margin`/`margin-*`, `padding`/`padding-*`, `box-sizing` tulajdonságokat (a keret adja őket); MARADJON minden más (`display`, `flex-direction`, `gap`, `grid-template-columns`, `align-items`, `position`, `z-index`, `justify-content` …). Ha a blokk ettől üres lesz, a teljes szabály törlődik (a szelektor is). A `@media` alatti változatok ugyanígy (az ott álló padding is törlődik — a keret mobil szabálya adja). A RÉGI blokk a melléklet szerinti teljes szabály, betűre.
Kivétel: a `.km-kozep` `display: flex; justify-content: center;` marad (a kártya középen), csak a padding megy.

### 4. A keretőr — TELJES: `tools/hatar/keretor.mjs`
Node (ESM), a mellékelt `tokenor.mjs` mintájára (fájlbejárás, kilépési kód, magyar üzenetek). Két szabály:
1. Minden `<main` az `apps/web/app/**/*.tsx` alatt (kivéve `Nyitolap.tsx` — a nyilvános nyitólap, és a `node_modules`, `.next`) `className`-jében szerepel a `km-lap-keret`; ha nincs, sértés: `fájl:sor — a <main> nincs a közös keretben (km-lap-keret)`.
2. Összegyűjti a `<main`-eken álló TÖBBI osztálynevet (a className literálból és a sablon-stringből a `km-…` tokeneket), és az `apps/web/app/**/*.css` fájlokban minden olyan szabályblokkban, amelynek szelektora egy ilyen osztályt pontosan tartalmaz (`.osztaly` után nem jöhet `-` vagy betű; leszármazott szelektor — pl. `.km-kp-fo .valami` — NEM számít, csak ha a blokk szelektorának utolsó egyszerű eleme maga az osztály), tilos a `max-width`, `width`, `margin`, `margin-*`, `padding`, `padding-*`: sértés: `fájl:sor — a lap saját osztálya (.km-…) keret-tulajdonságot ad (max-width): ezt csak a km-lap-keret adhatja`.
Kimenet: sértés nélkül `✔ keretőr: minden lap a közös keretben (N main, M css-fájl).`, sértéssel a lista és kilépési kód 1.

### 5. RÉSZLET: `_RESZLET-package.md` (a mellékelt `package.json` részlethez)
- CSERE 1: az `"ellenoriz"` sor: `pnpm hatar && pnpm tokenor && ` után `pnpm keretor && ` beszúrva.
- CSERE 2: a `"tokenor": "node tools/hatar/tokenor.mjs",` sor után új sor: `    "keretor": "node tools/hatar/keretor.mjs",`.

## Elfogadás (a beépítő méri)
`pnpm keretor` zöld; `pnpm tokenor` zöld; `pnpm tipus` zöld; élőben 1440-en MINDEN belépett lap fő eleme x=130, szélesség 1180. Add vissza: `_RESZLET-alap.md`, a 15 tsx-RÉSZLET, a css-RÉSZLET-ek, `tools/hatar/keretor.mjs`, `_RESZLET-package.md`.

## 6. Kiegészítés (Vilmos, ma): a Hírek lap felső sávja is a keretben
A Hírek lap fülsora (`apps/web/app/hirfigyelo/_kozos/HirfigyeloKeret.tsx`, `km-hf-fulsor`, mellékelve a részlet) teljes szélességű, a szövegei a bal szélen állnak — a keret alatt „kicsúszottnak” látszik. A sáv HÁTTERE maradhat teljes szélességű, de a TARTALMA a közös keretben áll:
- A keret sáv-változata az `alap.css`-ben (az 1. pont után): `.km-lap-keret-sav { width: 100%; max-width: var(--lista-max); margin-inline: auto; padding-inline: var(--ter-10); box-sizing: border-box; display: flex; align-items: center; gap: var(--ter-5); flex-wrap: wrap; }` + `@media (max-width: 640px) { .km-lap-keret-sav { padding-inline: var(--ter-6); } }`.
- `HirfigyeloKeret.tsx` RÉSZLET (`_RESZLET-hirfigyelo-keret.md`): a `<div className="km-hf-fulsor">` belsejét egy `<div className="km-lap-keret-sav">…</div>` fogja körbe (a modulnév, a jelvény, a `nav` és az új-találat jelvény mind ebbe kerül); a `km-hf-fulsor` marad a háttér és az alsó vonal.
- `hirfigyelo.css` RÉSZLET: a `.km-hf-fulsor` szabályból a `display: flex; align-items: center; gap: var(--ter-5); flex-wrap: wrap;` és a `padding` bal-jobb része megy át a sáv-változatba: marad `padding-block: var(--ter-5); border-bottom: …; background: …;`. A mobil szabályból (`@media` 22. sor) a `padding` ugyanígy.
- A keretőr 2. szabálya a `km-hf-fulsor`-ra NEM vonatkozik (nem main), de a `km-lap-keret-sav` is a keret része: a keretőr 1. szabálya kiegészül: minden `km-hf-fulsor` osztályú elem első gyermeke `km-lap-keret-sav` (egyszerű szöveges ellenőrzés a tsx-ben: a `className="km-hf-fulsor"` sorát követő első `<div` `km-lap-keret-sav`).
