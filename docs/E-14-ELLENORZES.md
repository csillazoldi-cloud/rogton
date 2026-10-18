# E-14 — A Theme-felület a v6 szerint: fordított ellenőrzés és végigjátszás (2026-09-07)

## 1. Mi épült
`/tema` — a v6 `Theme-beallitasok.dc.html` elemről elemre (`apps/web/app/tema/Tema.tsx`, `ElonezetPanel.tsx`, `tema.css`), a
D-09 két szintjével: a tulajdonos a szervezet saját megjelenését, a rendszergazda (szintválasztóval) a közös alapot is.
A szerkesztés csak az előnézetbe hat; „Tervezet mentése” → a kiszolgálóra (csak a szerkesztő látja); „Alkalmazás” → mindenki
(a lap feje azonnal átvált). Export a mezőbe; import csak az előnézetbe, típusonként ellenőrizve (a v6 validate tükre) —
hibás import: tételes hibalista, semmi nem változik. Olvashatósági figyelmeztetés (4,5:1 alatt). Feliratok: a v6 km-i18n.js
th*/val*/theme* kulcsai három nyelven (migráció `0019`) + a D-09 miatti saját szövegek (Kimi fordítás).
A fiókoldal jobb oszlopából link nyílik rá (a 4. szakasz terve szerint).

## 2. Fordított ellenőrzés (Kimi, `docs/E-14-FORDITOTT-ELLENORZES-kimi.md` — nyers)
Megállt és **javítva**: (1) az onboarding-részlet mezőjében fix „mintamuhely.hu” volt — a v6 `ob1card` felirat három nyelven
(`tema.ob1card`); (2) az előnézet gombjai ki voltak véve a tab-sorrendből — a v6-ban nincsenek, visszavéve. Saját átnézésem
javította: (3) a színmezők mellett a hex-érték állt — a v6-ban a token neve (`--bg`) áll.
A jelentés többi „eltérése” a felirat-kulcsok NEVÉRE vonatkozik (a v6 `thSaveDraft` ↔ nálunk `tema.save_draft`) — a szöveg
ugyanaz, ez nem eltérés; az arab betű az előnézetben nem alkalmazható (nincs arab nyelv); a `discard` „kétszintű” megjegyzése
téves (a v6 is az alkalmazotthoz tér vissza).
Ismert, elfogadott eltérések: nyelvválasztó a mi vezérlőnk; „Vissza a fiókhoz →” az „Onboarding →” helyett; a tervezet/alkalmazott
a kiszolgálón (nem a böngésző tárában); a szint jelvénye és a rendszergazda szintválasztója (D-09); a kód-szöveg minta az
aktuális `--primary` értéket mutatja; a gombpárna tokenből.

**Ami a v6-ban nincs:** korábbi verziók listája és visszaállítás gombja — Vilmos kérésére és jóváhagyásával (2026-09-07, „igen, tedd fel”)
felkerült a bal oszlop aljára (E-14b): verzió, állapot, dátum, „Visszaállítás” a korábbiaknál → új tervezet az előnézetbe, élesbe
csak alkalmazással. Feliratok: migráció `0020`.

## 3. Végigjátszás
Gépi végigjátszás (`/tmp/e14-jatek.py`, Playwright): szín állítása → csak az előnézet változik; kapszula; hibaállapot + mobil
nézet; részletes beállítások (4 választó, 5 csúszka); tervezet mentése → újratöltés után a tervezet visszajön, a lap még a
régi; hibás import → hibalista magyarul, az előnézet változatlan; export a mezőbe; jó import (részleges + ismeretlen kulcs
jelezve); alkalmazás → a lap ÉS a többi oldal átvált; elvetés → az alkalmazott; alapértékek → a közös alap. Három nyelven
(hu/ro/en, 1280 px) és telefonon (390 px); képernyőképek: `Claude outputs/e14-kepernyok/`.

## 4. Tanulság (kódban javítva)
A Next az útvonalakat külön csomagokba fordítja: egy modulszintű gyorsítótár útvonalanként külön példány — az API alkalmazása
nem ürítette a lap fejének gyorsítótárát, a téma 60 mp-ig a régi maradt. A gyorsítótár a `globalThis`-en él (`apps/web/tema/tar.ts`).
