# Feladat — ÉPÍTŐ (E-30): a referencia-host FELÜLETE — két kiszolgálói oldal, három nyelven, tokenekből

A hírfigyelő magja két rendszerben fut: a nagy webalkalmazásban (Next + React), és egy MÁSODIK, minimális hostban (`apps/referencia-host`: sima Node, SQLite).
A második hostnak eddig csak JSON-válaszai vannak. Most kap két EGYSZERŰ, kiszolgálón összeállított HTML-oldalt — **nincs React, nincs Next, nincs kliensoldali
keretrendszer, nincs npm-függőség**: sima szövegből épített HTML, egyetlen `<style>` blokkal.

Ez NEM a nagy alkalmazás képernyőinek másolata. Ez a „második rendszer” minimális nézete: bizonyíték, hogy ugyanaz a mag máshol is működik.

## Amit készítesz — négy fájl

### 1. `apps/referencia-host/src/felulet/stilus.ts`
`export const STILUS: string` — a lap CSS-e egyetlen szövegben. **KIZÁRÓLAG `var(--…)` értékek**: szín, betűcsalád, betűméret, lekerekítés, betűvastagság
NEM éghet be (ez gépi ellenőrzés, elbukik tőle a fordítás). A LÉTEZŐ tokenek — CSAK ezeket használhatod, MÁS nevet ne találj ki (a nem létező változó üresen marad, a lap szétesik):

- szín: `--bg` `--bg-elev` `--text` `--text-mut` `--text-dim` `--text-faint` `--primary` `--primary-2` `--on-primary` `--accent` `--accent-text`
  `--accent-link` `--accent-tint` `--accent-tint-weak` `--accent-border` `--ok` `--ok-bg` `--ok-strong` `--err` `--err-bg` `--err-border` `--err-strong`
  `--warn` `--warn-bg` `--warn-border` `--focus` `--focus-ring` `--line` `--line-soft` `--panel-soft` `--panel-soft-2` `--header-bg` `--field-bg` `--field-border`
  `--btn-ghost-bg` `--btn-ghost-border` `--btn-ghost-text` `--btn-disabled-bg` `--selection`
- fontosság-jelvényekhez (a nagy alkalmazás is ezeket használja): `--src-ai` / `--src-ai-bg` (fontos), `--src-web` / `--src-web-bg` (érdekes),
  `--src-empty` / `--src-empty-bg` (háttér), `--src-user` / `--src-user-bg`
- betű: `--font-body` `--font-display` `--font-code`; méret: `--fs-xs` `--fs-sm` `--fs-base` `--fs-md` `--fs-h2` `--fs-h1` `--fs-title`;
  vastagság: `--fw-strong` `--fw-head`; sormagasság: `--lh`
- távolság és méret: `--gap` `--pad-card` `--pad-block` `--pad-field-x` `--pad-field-y` `--btn-pad-x` `--btn-pad-y` `--control-min` `--bw`
- lekerekítés: `--r-card` `--r-block` `--r-btn` `--r-field` `--r-badge`
- árnyék: `--shadow-pop` `--glass-bg` `--glass-border`

Ahol nincs megfelelő token (pl. egy lista `max-width`-je vagy `gap` többszöröse), ott számolj a meglévőből: `calc(var(--gap) * 2)`.
Elrendezés: legfeljebb 900 px széles, középre; egyszerű, tiszta lista; telefonon is olvasható (`@media (max-width: 600px)` a tördeléshez).
Kivétel csak indokoltan, a sor végén `/* tokenőr: ok — … */` megjegyzéssel (pl. `border-radius: 50%` körhöz).

### 2. `apps/referencia-host/src/felulet/lap.ts`
```ts
export function htmlBiztos(szoveg: string): string;   // & < > " ' escape-elése — KÖTELEZŐ minden kiírt adatra
export function lap(f: { cim: string; nyelv: Nyelv; aktiv: "talalatok" | "beallitas"; tartalom: string; tokenekCss: string }): string;
```
A teljes HTML-dokumentum: `<!doctype html>`, `<html lang="…">`, `<meta charset>`, `<meta name="viewport">`, `<title>`, egyetlen `<style>` (a kapott
`tokenekCss` + a `STILUS`), majd a törzs: fejléc (a modul neve + a „referencia-host” jelölés), navigáció (Találatok / Beállítás), nyelvválasztó három
hivatkozással (`?nyelv=hu`, `?nyelv=ro`, `?nyelv=en` — az aktuális lap útvonalán maradva), a `tartalom`, végül egy egysoros lábléc.

**A `htmlBiztos` HASZNÁLATA KÖTELEZŐ minden adaton**, ami a hírekből vagy a beállításból jön (cím, összefoglaló, forráscím, témanév): ezek IDEGEN szövegek,
HTML-t tartalmazhatnak. Az egyetlen kivétel a `tokenekCss`, amit a hívó ad.

### 3. `apps/referencia-host/src/felulet/talalatok.ts`
```ts
export function talalatokOldal(a: {
  nyelv: Nyelv;
  kartyak: Kartya[];
  utolsoSikeres: Futas | null;
  fut: boolean;                 // van „var”/„fut” tétel a sorban
  ujDb: number;
  forrasHibak: { forras_id: string; ok: string }[];
  forrasCime: (forrasId: string) => string;
  feliratok: (kulcs: string, ertekek?: Record<string, string | number>) => string;
}): string;
```
Felül egy állapotsor: ha `fut` → `hf.stRunning`; különben `utolsoSikeres` van → `hf.stLastRun` a futás végének idejével (`{t}`), ha nincs → `hf.stNever`.
Mellette az új találatok száma (`hf.stNew` `{n}`), vagy `hf.stNoNew`, ha `ujDb === 0`.
Alatta egy űrlap: `<form method="post" action="/inditas">` egyetlen gombbal — `hf.stRunNow`; ha `fut` igaz, a gomb LETILTVA (`disabled`) és a felirata
`hf.trialRunningBtn`.
Ha van `forrasHibak`, egy figyelmeztető sáv: `hf.srcProblem` (`{p}` = a hibás források címei vesszővel).

Utána a kártyák listája, `letrehozva` szerint csökkenő sorrendben. Egy kártya:
- fontosság-jelvény: `fontos` → `hf.impHigh`, `erdekes` → `hf.impMed`, `hatter` → `hf.impLow`; ha `ertekeles_allapot !== "kesz"`, akkor „…” és nincs jelvény;
- a cím (`cim`), ha van `megtekintes === "uj"` → mellette az `hf.fNew` jelvény;
- az `osszefoglalo` egy bekezdésben;
- a `miert` a `hf.whyLabel` címke alatt, kisebb betűvel;
- lábsor: `hf.detSources` + a `forrasok` darabszáma és a forrás(ok) címe a `forrasCime` segítségével.

Ha nincs kártya: `hf.ovNoNewTitle` és `hf.ovNoNewBody`.

### 4. `apps/referencia-host/src/felulet/beallitas.ts`
```ts
export function beallitasOldal(a: {
  nyelv: Nyelv;
  aktiv: BeallitasVerzio | null;
  forrasok: Forras[];
  feliratok: (kulcs: string, ertekek?: Record<string, string | number>) => string;
}): string;
```
CSAK MEGTEKINTÉS — se űrlap, se mentés gomb (a második hostban a beállítás a `profil.json`-ból jön; a szerkesztés a nagy alkalmazás dolga).
Három szakasz a `hf.colWhat` / `hf.colFrom` / `hf.colWhen` címekkel:
1. **Mit figyelünk**: a témák neve (és a névváltozatok zárójelben), a kizárások; ha üres, `hf.nincs`.
2. **Honnan**: a források listája, mindegyik mellett az állapota — `hasznalhato` → `hf.srcOk`, `korlatozott` → `hf.srcLimited`, `hibas` → `hf.srcErr`,
   `ellenorzes_alatt` → `hf.srcChecking`; ha van `hiba_ok`, az `hf.srcProblem` `{p}` helyén.
3. **Mikor**: `idozites.mod === "napi"` → `hf.stNextRun` (`{t}` = `ora:perc` két számjeggyel, `{tz}` = az időzóna); `kezi` → `hf.stNextManual`.
Fent a verzió száma („v{n}”), ha van aktív beállítás; ha nincs aktív verzió, egyetlen sor: `hf.stNever`.

## Szabályok

TypeScript 7 szigorú kapcsolókkal (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess` — a tömbindexelés `T | undefined`), ESM: a saját fájljaidra
`.js` kiterjesztésű relatív import. A típusokat a `@km/news-monitor-core` csomag BEJÁRATÁRÓL hozd (`Kartya`, `Forras`, `BeallitasVerzio`, `Futas`), a `Nyelv`-et
a `@km/news-monitor-feliratok`-ból. NINCS `any`, nincs `console.log`, nincs új npm-függőség, nincs kliensoldali JavaScript (a lapon egyetlen `<script>` sem).
Magyar függvény- és változónevek, magyar megjegyzések. Az időpontokat `new Intl.DateTimeFormat(nyelv, { dateStyle: "short", timeStyle: "short" })`-tal írd ki.

A felirat-kulcsokat SZÓ SZERINT a fenti listából használd — ne találj ki újat. A `feliratok(kulcs, ertekek)` már behelyettesíti a `{…}` helyőrzőket.

A választ ADD VISSZA MINDEN FÁJLT TELJES EGÉSZÉBEN, fájlonként ```ts blokkban, a blokk fölött a fájl útvonalával.
