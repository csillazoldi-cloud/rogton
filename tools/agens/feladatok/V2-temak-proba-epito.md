# Feladat — ÉPÍTŐ (V2): témák előre kitöltve, vessző/Enter, a próba magától indul és okot mond

Vilmos döntései (2026-09-18, a visszajelzések 5. és 6. pontja):
- A profilból javasolt témák EGYBŐL a listában állnak (jelölve, hogy javaslat), a felhasználó csak töröl vagy hozzáír. A külön „javaslat kész" doboz megszűnik.
- Vessző és Enter több témára bont; a Hozzáadás azonnal, AI-várakozás nélkül.
- A témák/oldalak mentése után a próba MAGÁTÓL indul (D-1); nincs „nem mentett változás" figyelmeztetés (minden módosítás azonnal mentődik); ha a próba nem fut le, emberi mondat a VALÓDI okkal + mit tegyen.

React 19, TS 7 strict. Kimenet `=== FÁJL: <út> ===` blokkokban; a `Beallitas.tsx` (500+ sor) RÉSZLET-fájllal (`_RESZLET-Beallitas.md`, legfeljebb 8 CSERE; a RÉGI szó szerint, egyedi). Tokenőr: CSS-ben csak `var(--…)`. Nincs `any`.

## MÉRT tények (`apps/web/app/hirfigyelo/beallitas/Beallitas.tsx`, mellékelve)
- 74–76.: első használatkor a lap `POST /api/hirfigyelo/beallitas/javaslat`-ot hív; a válasz `javaslatTervezet`-be kerül (`javaslatKesz` állapot), a listába csak a `javaslatBeolvaszt()` (164.) teszi át — gombra.
- 115.: `temaHozzaad` — egy mezőből egy témát ad; Enter kezelése nincs; vesszőt nem bont.
- 211.: `probaFuttatas` — gombra `POST /api/hirfigyelo/futas { proba: true }`; `probaHiba` csak igaz/hamis (239.), ok nélkül.
- 244–249.: `beforeunload` figyelmeztetés `piszkos` állapotnál; 279.: „nem mentett" felirat. A mentés `PUT /api/hirfigyelo/beallitas` (a `mentes()` függvény; automatikus mentés időzítővel: `tervezetIdozito`, 98.).
- A futás hibái a válaszban: `{ hiba: "AI_NEM_ELERHETO" | "NINCS_AKTIV_BEALLITAS" | "FORRAS_HIBAS" | … }` (a `futas` végpont, mellékelve); a haladás `GET /api/hirfigyelo/futas/sor/{id}` (a lap már kérdezi: `probaHaladas`).

## Mit kell megírni (RÉSZLET-ek a Beallitas.tsx-hez)
1. **Javaslat egyből a listába:** a 76. sor válaszát ne `javaslatTervezet`-be, hanem a `javaslatBeolvaszt` logikájával azonnal a `beallitas.temak`-ba (minden téma `forras: "javaslat"` jelöléssel — ha a `Tema` típusnak nincs ilyen mezője, a lap egy `javasoltNevek: Set<string>` állapotot tart, és a chipen egy kis „javaslat" címke áll). A `javaslatKesz`/`javaslatTervezet` állapot és a hozzá tartozó doboz + gomb kikerül. A „Javaslat a profilodból" jobb oszlop marad, de a gombja „Újra javasol" — az is egyből a listába olvaszt.
2. **Vessző/Enter:** `temaHozzaad` a mező értékét `,` és `;` mentén bontja, üreset és duplát kihagy; a mezőn `onKeyDown` Enter → `temaHozzaad()` + `preventDefault`. Nincs AI-hívás a hozzáadásban.
3. **Azonnali mentés:** a `tervezetIdozito` késleltetése legfeljebb 800 ms; a `beforeunload` figyelmeztetés és a `km-hf-be-nem-mentett` felirat kikerül; helyette a gomb mellett „Mentve · hh:mm" (a meglévő `mentesAllapot`-ból).
4. **A próba magától indul:** a mentés sikere után, ha van aktív beállítás (`vanAktiv`) és még nem futott próba ebben a munkamenetben (`probaAllapot === "nyugto"`), a `probaFuttatas()` magától meghívódik. A gomb marad „Újra futtatom" néven a kész állapotban.
5. **A hiba okot mond:** `probaHiba` legyen `string | null` (a válasz `hiba` kódja); a lapon a kódhoz felirat: `hf.proba_hiba.AI_NEM_ELERHETO` („Az AI most nem válaszol. Pár perc múlva újra próbáljuk — vagy kattints az Újra futtatom gombra."), `hf.proba_hiba.FORRAS_HIBAS` („Egyik figyelt oldal sem ad hírfolyamot. Nézd meg a listát lent."), `hf.proba_hiba.NINCS_AKTIV_BEALLITAS` („Előbb adj meg legalább egy témát és egy oldalt."), egyéb: `hf.proba_hiba.EGYEB` („Nem sikerült. Újra próbáljuk egy perc múlva."). A feliratok: `apps/web/adatbazis/migraciok/0089_v2_temak_proba.sql` (TELJES fájl; hu/ro/en; plusz `hf.mentve_ekkor` „Mentve · {ido}", `hf.tema_javaslat_cimke` „javaslat", `hf.ujra_javasol` „Újra javasol", `hf.proba_ujra` „Újra futtatom"). A hf.* feliratok adatfájlját utána a `tools/feliratok/szinkron.py` frissíti (ezt nem te futtatod).
6. **Próba:** `apps/web/probak/hf-temak.proba.ts` (élő, a mellékelt `hirfigyelo-felulet.proba.ts` mintájára): a javaslat végpont válasza után a `GET beallitas` témái tartalmazzák a javasoltakat; a `PUT beallitas` egy „a, b; c" témasorból három témát ment (ha a bontás a kliensben van, a próba a kliens-segédet hívja — tedd a bontást külön, tesztelhető függvénybe: `temakBont(szoveg: string): string[]` az `_kozos/kliens.tsx`-ben).

Más fájlhoz ne nyúlj.
