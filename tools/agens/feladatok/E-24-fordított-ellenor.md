# Feladat — FORDÍTOTT ELLENŐR (E-24/E-25): a megépített képernyők mérése a v7 prototípus ellen (vasszabály)

Vasszabály: a képernyőn SEMMI nem lehet, ami nincs a rajzon; ami a rajzon van és hiányzik, az hiba; ami a rajzon nincs és mégis ott van, az is hiba (kivéve, amit a
feladat kifejezetten megenged: a lap betöltés/hiba-üzenete, a „Vissza a fiókhoz” link a fejlécben — az alkalmazás minden lapján ott van —, a néző szerep figyelmeztetése,
a `nem_tamogatott` forrás-állapot, a „Nincs változás” mentés-üzenet, az „Új téma…” beviteli mező, a Finomhangolás fül és a „Megnyitás →” link HIÁNYA — az E-26 hozza).
Mellékelve: `proto-attekintes.html` (a prototípus Áttekintés + részletpanel), `proto-beallitas.html` (a prototípus Beállítás lap), `proto-logika-attekintes.js`,
`proto-logika-beallitas.js` (mikor mi látszik), és a megépített kód: `HirfigyeloKeret.tsx`, `Attekintes.tsx`, `Beallitas.tsx`, `Forrasok.tsx`.

Készíts EGY fájlt: `docs/E-24-FORDITOTT-ELLENORZES-deepseek.md` (magyarul, tömören), három táblázattal (Áttekintés, Részletpanel, Beállítás):
| elem a prototípuson | a kódban | ítélet (RENDBEN / HIÁNYZIK / TÖBBLET / ELTÉR) | megjegyzés |
Vedd sorra a prototípus MINDEN látható elemét és állapotát (sáv elemei, AI-kiesés sáv, nincs-új doboz, összkép, szűrők, elrejtett-megjegyzés, kártya minden része és
gombja, üres szűrő, a panel minden szakasza és a tartalomötlet két állapota; a beállítás lapon a fej, a kérdés, a három oszlopcím, a célok, a szabad szöveg + gomb,
a témák + mezők + megkülönböztetés, a forráscsoportok + állapotok + ellenőrzés + hozzáadás + őszinteségi megjegyzés, az ütemezés, az üzenetek, a két gomb, a megjegyzés).
A végén: „Többlet a kódban” lista (ami a rajzon nincs) és „Javítandó” lista fontossági sorrendben, konkrét sorral/elemmel. Ne javasolj új funkciót.
