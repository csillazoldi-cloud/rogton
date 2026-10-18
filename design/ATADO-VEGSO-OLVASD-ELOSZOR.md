# Átadó — R-2, R-3, R-6, R-4

2026-09-13 · Aitmetica SRL · a négy rajz a megbeszélt sorrendben: R-2 → R-3 → R-6 → R-4.

Mind a négy mappa ugyanúgy épül fel:

| Fájl | Mi van benne |
|---|---|
| `ATADO.md` | mit döntött el a rajz, artboardonként; az R-3-é a végén v2-szakasszal |
| `rajz/*.dc.html` | a **hiteles** rajz — a megnyitásához hálózat kell (betűk), és a `support.js` mellette |
| `feliratok.json` | minden látható szöveg felirat-kulccsal, három nyelven (hu · ro · en) |
| `adatkotes.md` | melyik vezérlő melyik végponthoz kötődik |
| `kerdesek.md` | amit nem tudtam eldönteni, és ami a leírásból a mai gépezettel nem jön ki |
| `tokenek.md` | ha új token kellett (R-4: négy; R-3 v2 ugyanazt a hármat használja) |

## Amit a négy rajz közösen kimond

**Kikapcsolt vezérlő csak ott van, ahol a funkció készül.** Amit a felhasználó a szerepe miatt nem tehet meg, azt a lap nem mutatja szürkén, hanem egyáltalán nem mutatja.

**A „még nem működik" jelölés** (R-4-ben tervezve, R-3-ban is használva): szaggatott keret, halk `--keszul` szín — nem hibaszín —, a vezérlő kikapcsolt és nem kattintható, és **mindig ott a mondat, miért nem működik és mi kell hozzá**.

**Minden hiba megmondja a következő lépést**, és a mező alatt áll, nem a lap tetején.

## A hiteles rajzfájlok

- R-2 · `R-2-tagok/rajz/R2-tagok.dc.html` — hét artboard
- R-3 · `R-3-sajat-fiok/rajz/R3-sajat-fiok v2.dc.html` — **hat artboard, a v2 a hiteles** (a v1 is a mappában van)
- R-6 · `R-6-arculat-fajlok/rajz/R6-arculat-fajlok.dc.html` — hat artboard
- R-4 · `R-4-ertesitesek-adatpolitika/rajz/R4-ertesitesek-adatpolitika.dc.html` — hét artboard

## Nyitott kérdések — egy helyen

Mindegyik a saját `kerdesek.md`-jében áll tételesen. A három, amit érdemes előbb eldönteni:

1. **R-3:** a „Kiléptetés minden eszközről" ezen a gépen is léptessen-e ki (a leírás ezt írja, a mai végpont nem ezt teszi).
2. **R-4:** az értesítés-beállítás fiókonként vagy munkatérenként külön él-e.
3. **R-4:** a felhő-kapcsoló munkatér-szintű lesz-e vagy rendszerszintű.
