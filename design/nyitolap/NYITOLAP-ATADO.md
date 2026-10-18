# Nyitólap — implementációs átadó

Aitmetica SRL · Kommunikációs munkatér · nyilvános főoldal (belépés előtt)
Forrásfájl: `Nyitolap.dc.html` · téma: `tema-alap.json` + `km-theme.js`

## 0. Mit vegyél alapul (és mit ne)

**A hiteles forrás a `Nyitolap.dc.html` és a `tema-alap.json`** — nem a képernyőkép.
A PNG nem elegendő a pontos megvalósításhoz:
- a pixelből visszamért szín/méret sosem lesz azonos az eredeti tokenértékkel (áttetsző rétegek, blur és gradiens miatt a mért érték biztosan téves);
- a képen nem látszik, melyik érték **token** és melyik egyszeri döntés — így a Theme-felületen végzett későbbi módosítás nem üt át a lapon;
- nem látszanak az állapotok (hover, fókusz, tiltott), a betűcsalád-hivatkozások, a logikai elrendezés és a szemantikus HTML (fejlécszintek, aria-címkék, gomb vs. link).

A PNG hasznos **referenciaképként** az arányok gyors ellenőrzéséhez — a megvalósítás alapja a HTML és a tokenkészlet.

## 1. Két artboard

| Nézet | Szélesség | Elrendezés |
|---|---|---|
| Asztali | 1440 px (tartalom 56 px oldalpadding) | 2 hasábos hero, 3 hasábos kártyarácsok |
| Telefon | 390 px (20 px oldalpadding) | egy oszlop, ugyanaz a tartalom, azonos sorrend |

Élesben ne két külön oldal legyen: **egy fluid oldal**, ahol a rácsok `repeat(auto-fit, minmax(...))` vagy egyszerű töréspont alapján egy oszlopra váltanak. A mobil artboard a törés utáni állapotot rögzíti.

Mobil eltérések (szándékosak, ne hagyd ki): a hero cím 52 → 32 px, a szekciócímek 26 → 22 px, a záró cím 30 → 24 px; a gombok teljes szélességűek; a fejlécben a nyelvválasztó HU/RO/EN rövidítéssel, a terméknév `text-overflow: ellipsis`; a lábléc egy oszlopban. **Minden szöveg a token-skálán marad** (`--fs-sm` 13 px a legkisebb, kizárólag másodlagos információn).

## 2. Szerkezet és sorrend

1. **Fejléc** — a belső felület fejlécének mása: K-logó (`--grad-primary`, `--r-btn`), terméknév (`--font-display`, `--fw-strong`, `--fs-title`); jobbra nyelvválasztó, „Belépés" halk gomb, „Fiók létrehozása" kiemelt gomb. Háttér `--bg-elev`, alsó vonal `--line-soft`.
2. **Hero** — kicker (Aitmetica SRL) · H1 egy mondat, benne egyetlen gradiens-kiemelés (`--grad-headline`, background-clip) · magyarázó mondat · két gomb · nyelv- és arculat-megjegyzés. Jobb oldalon üvegkártya (`--glass-bg`, `--glass-border`, `--blur-glass`): „Amit egy találat mellé megkapsz" — négy sor a **valódi eredetjelvényekkel** (`--src-web`, `--src-ai`, `--src-empty`, `--ok`). Ez nem ál-képernyőkép, hanem a rendszer saját jelöléskészlete.
3. **Mit tud ma** — három kártya vonalas SVG-ikonnal (stroke=`currentColor`-szerű token-szín, `stroke-width:1.4`, nincs kitöltés).
4. **Hogyan indul** — három számozott kártya (1 → 2 → 3), körjelölés `--grad-primary`.
5. **Mi történik az adatokkal** — `--accent-tint-weak` háttér, `--accent-border-soft` keret; három állítás + egy link.
6. **Záró cselekvés** — cím, egy mondat, „Fiók létrehozása" (a lap egyetlen elsődleges cselekvésének megismétlése), alatta az árazás helykitöltő.
7. **Lábléc** — Aitmetica SRL · [KAPCSOLAT] · Adatkezelési tájékoztató · verziószám (`--font-code`) · „tesztkörnyezet" jelvény.

Háttérben két lassan úszó fényfolt (`drift1`/`drift2`, `--dur-amb`), `pointer-events:none`, `aria-hidden`. `prefers-reduced-motion` esetén minden animáció leáll — ez a lapon is kötelező.

## 3. Tokenhasználat — nincs beégetett érték

A lapon **nincs közvetlen szín, betűcsalád vagy lekerekítés**; minden `var(--token)`. Az oldal betöltésnél a `tema-alap.json`-t olvassa, és a Theme-felületen alkalmazott témát (`localStorage: km-theme-applied`) ráolvasztja — így a nyitólap ugyanúgy témázható, mint a belső felület, a teljesen szögletes beállítást is beleértve.

Használt tokenek: `--bg`, `--bg-elev`, `--text`, `--text-mut`, `--text-dim`, `--text-faint`, `--on-primary`, `--primary`, `--primary-2`, `--accent`, `--accent-text`, `--accent-link`, `--ok`, `--focus`, `--font-display`, `--font-body`, `--font-code`, `--fw-head`, `--fw-strong`, `--fs-title/base/md/sm/xs`, `--lh`, `--r-card/block/btn/field/badge`, `--bw`, `--pad-card`, `--pad-block`, `--btn-pad-y/x`, `--gap`, `--control-min`, `--blur-glass`, `--glass-alpha`, `--dur-fast`, `--dur-amb` + a `km-theme.js derive()` származtatottjai (`--grad-primary`, `--grad-headline`, `--glass-bg/border/shadow`, `--line*`, `--panel-soft*`, `--btn-ghost-*`, `--focus-ring`, `--glow-primary`, `--src-*`, `--accent-tint*`).

**Új token nem készült** a nyitólaphoz. Ha később kell, azt a közös rendszer bővítéseként kell dokumentálni.

A hero H1 két méret-tokent használ: `--fs-hero` (52 px, asztali) és `--fs-hero-sm` (32 px, mobil). Mindkettő a közös témakészlet része (`tema-alap.json`), típusos sémával (`km-theme.js`) és a Theme-felület Tipográfia szekciójában állíthatóan — nem komponensben rögzített érték.

## 4. Szövegkezelés

Minden látható szöveg a központi nyelvi állományba tartozik (a `km-i18n.js` mintája szerint), stabil kulcsokkal: fejléc, hero, szekciócímek, kártyaszövegek, adatkezelési állítások, gombfeliratok, lábléc, hozzáférhetőségi címkék. **Három kötelező nyelv: magyar, román, angol** (a belső felületen az angol az alapnyelv és a tartaléknyelv). A nyelvválasztás belépés nélkül is elérhető, és a választás a belépés után is érvényes marad.

Hangnem: közvetlen, tegező, tárgyilagos — a belső képernyők szóhasználata. Emodzsi nincs.

## 5. Amit a lap tudatosan NEM ígér

Nem szerepel rajta — és ne is kerüljön rá: tartalomgyártás és közzététel, ütemezett publikálás, kampánykezelés, fizetés, külső integrációk, mobilalkalmazás, teljes internetfigyelés, „minden megjelenést megtalálunk" jellegű állítás. Kitalált ügyfélnév, szám, vélemény, díj és logóhad nincs.

**Helykitöltők (valódi adat hiányában):**
- `[ADATKEZELÉSI TÁJÉKOZTATÓ — az AI-szolgáltató, a tárolás helye és a megőrzési idő megnevezésével]`
- `[ÁRAZÁS — még nincs meghatározva]`
- `[KAPCSOLAT — e-mail, székhely]`

Az adatkezelési blokk három állítása kizárólag olyan, ami a felületen már így működik: a jóváhagyott profil a fiókhoz tartozik és ott módosítható · az AI-javaslat nem ellenőrzött tény, az eredet és az utolsó módosító látszik · a rendszer a kijelölt forrásokból dolgozik. **Minden további adatkezelési állítás a jogi tájékoztatóból jöhet, nem a nyitólapról.**

## 6. Cselekvések és bekötés

| Elem | Esemény |
|---|---|
| „Fiók létrehozása" (fejléc, hero, záró blokk) | `auth.signup` → utána a közös onboarding 1. lépése |
| „Belépés" (fejléc, hero) | `auth.login` → belépés után Áttekintés (hírfigyelő) vagy onboarding, ha nincs jóváhagyott profil |
| Nyelvválasztó | felületnyelv beállítása, megmarad a belépés után is |
| „Adatkezelési tájékoztató" | statikus jogi oldal |

A lapon nincs regisztrációs űrlap — a nyitólap csak átadja a folyamatot. Ez a képernyő **statikus, bejelentkezés nélküli**; nem tölt be ügyféladatot, és nem használja az ügyfél arculati profilját a felület témájaként.

## 7. Ellenőrzési lista

1. 1440 és 390 px mellett is helyes a törés; a hero cím nem szakad el, nincs 13 px alatti szöveg.
2. Minden gomb magassága ≥ `--control-min`; a fókusz látható (`--focus`, `--focus-ring`).
3. A Theme-felületen minden lekerekítés 0-ra állítva a nyitólap is szögletes lesz; betűcsalád- és színváltás átüt.
4. `prefers-reduced-motion` esetén a fényfoltok nem mozognak.
5. Egyetlen elsődleges cselekvés van (`Fiók létrehozása`), másodlagos a „Belépés".
6. A lapon nincs olyan képesség említve, amely az átadóban kizárt tételek közé tartozik.
7. Szövegcsere magyar → román → angol nyelven nem tör el elrendezést (a román és angol szöveg hosszabb).

## 8. Nyitott döntések

Végleges domain és terméknév · árazás és számlázás · az adatkezelési tájékoztató tartalma és az AI-szolgáltató megnevezése · kapcsolati adatok · SEO/meta és nyitókép (Open Graph) — ehhez a kép még nem készült.
