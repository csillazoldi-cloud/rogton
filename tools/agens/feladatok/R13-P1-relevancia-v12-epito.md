# Feladat — ÉPÍTŐ (R13-P1): a hírolvasás utasítása (hf_relevancia) v12 — „tények előbb, döntés a kódban”

Mellékelve a mai utasítás (v11-es szűrőhöz tartozó szöveg, a fájl fejében „v10”). Ezt kell átírni v12-re.
Magyar szöveg, a mai hangnemben és szerkezetben. `=== FÁJL: packages/news-monitor-promptok/promptok/hf_relevancia.hu.md ===`
… `=== FÁJL VÉGE ===`, a TELJES fájl.

## Miért változik

Vilmos döntése (2026-09-22): a hírszűrés **fiókonként** állítható, három fokozattal:
- **Nagyon szigorú** — csak ami a beállított helyen (pl. Marosvásárhelyen) történt, és a FŐ témája az egyik téma; vagy
  a szervezetről / a figyelt névről szól.
- **Közepes** — a hely nem feltétel: az országos vagy külföldi hír is jöhet, ha a FŐ témája az egyik téma.
- **Laza** — az is jöhet, ami csak ÉRINTI az egyik témát.

A gép egy cikket EGYSZER olvas el, és a PROGRAM dönti el tagonként, a modell tényei alapján. Ezért a modell most
**nem a szigorú fokozat szerint dönt**, hanem:
1. megadja a TÉNYEKET (ezek maradnak, a mai leírásukkal): `rola_szol`, `fo_tema`, `hely_feltetel`, `hatokor`,
   `hely_idezet`, `helyszin`; és ÚJ: `erintett_tema` — a beállítás egy NEM-helynév témájának (vagy Iránytű-céljának)
   pontos neve, amelyet a cikk ÉRDEMBEN érint, de nem a fő tárgya; ha nincs ilyen, vagy a fő téma már megvan: "".
2. a `fontossag`-ot a **LAZA** fokozat szerint adja:
   - "fontos": a cikk közvetlenül a szervezetről / a figyelt névről szól, vagy konkrét döntést, választ kíván tőle
     (változatlanul a mai leírással);
   - "erdekes": a cikk fő témája VAGY érdemben érintett témája a beállítás egy nem-helynév témája (vagy Iránytű-cél),
     és a "miert" meg tudja nevezni, melyik, és egy konkrét teendőt;
   - "hatter": minden más — és MINDIG, ha a cikk fő témája az Iránytű kerülendő témája; ha kétséges, "hatter".
   - A HELY ebben a döntésben NEM számít: a helyfeltételt a program nézi a tényekből (`hely_feltetel`, `hatokor`,
     `hely_idezet`, `helyszin`). A modell a helyért NE tegye háttérbe a cikket.
3. a szöveges mezőket (`miert`, `cegednek`, `vevoidnek`, `indoklas`, `osszefoglalo`, `cim_forditott`) ugyanúgy írja,
   mint ma; háttérnél ugyanúgy a rögzített „Háttérhír; most nem kell tennetek semmit.” mondat.

## Mit tarts meg szó szerint vagy tartalmában
- A JSON-kulcsok listáját bővítsd az `erintett_tema` kulccsal (a `fo_tema` után).
- Az ellenőrző mezők mai leírása (a `rola_szol`, `fo_tema`, `hely_feltetel`, `hatokor`, `hely_idezet`, `helyszin`
  pontjai) maradjon, csak a záró „Ha … akkor a fontossag CSAK hatter lehet” pont változik: most az a szabály, hogy
  ha `rola_szol` false ÉS a `fo_tema` és az `erintett_tema` is üres, akkor "hatter".
- A „Hogyan döntsd el, kapcsolódik-e a cikk” rész 1. pontja (HELYNEVEK) módosul: a helynév nem téma (ez marad), de
  a helyfeltételt már NEM a modell alkalmazza a fontosságra — a tényekben adja meg. A 2. pont (FŐ TÉMA) kiegészül: ami
  érdemben érinti a témát, az az `erintett_tema`; ami csak egy mondatban, mellékesen említi, az SEM érintett téma.
- A „Közérthetőség”, a „További szabályok” és az ADAT-védelem része VÁLTOZATLAN.
- A {{nyelv}} helyek maradnak.
- A fájl első sora a fejléc-megjegyzés: `<!-- prompt: hírfigyelő relevancia-értékelés · v12 · 2026-09-22 · fiókonkénti fokozatok (Vilmos): a modell a tényeket adja és a LAZA fokozat szerinti fontosságot, a hely és a szigorúbb fokozatok a kódban dőlnek el; új: erintett_tema — v10: hatókör + szó szerinti hely-idézet; v9: ellenőrző mezők; v8: nagyon szigorú; v7: F10-M1 -->`

A blokkon kívül legfeljebb 10 sor magyarázat.
