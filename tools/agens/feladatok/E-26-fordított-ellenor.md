# Feladat — FORDÍTOTT ELLENŐR (E-26): a Finomhangolás lap mérése a v7 prototípus ellen (vasszabály)

Vasszabály: a képernyőn SEMMI nem lehet, ami nincs a rajzon; ami a rajzon van és hiányzik, az hiba; ami a rajzon nincs és mégis ott van, az is hiba (kivéve, amit a
feladat kifejezetten megenged: a lap betöltés/hiba-üzenete, a néző szerep figyelmeztetése, a minta lejáratának üzenete (D-12 döntés), a javaslat készülése/hibája és az
összehasonlítás hibája üzenetek (hibautak), a verziók sorában az eredet + idő leírás (a prototípus mintaszövege helyett), a „Vissza a fiókhoz” link a fejlécben).
Mellékelve: `proto-finomhangolas.html` (a prototípus HF-III szakasza), `proto-logika-finomhangolas.js` (mikor mi látszik), és a megépített `Finomhangolas.tsx`.

Készíts EGY fájlt: `docs/E-26-FORDITOTT-ELLENORZES-deepseek.md` (magyarul, tömören), egy táblázattal:
| elem a prototípuson | a kódban | ítélet (RENDBEN / HIÁNYZIK / TÖBBLET / ELTÉR) | megjegyzés |
Vedd sorra a prototípus MINDEN látható elemét és állapotát: cím + bevezető; üres állapot + link; a próbafutás cím-sora + megjegyzés; a tételek minden része (jelvény, meta, cím,
a két gomb, a „Rögzítve” jelzés, az ok-választó és a 4 ok); a javaslat doboz minden része és három állapota (kész: 3 gomb; kipróbálás közben: pörgő; összehasonlítva: cím, sorok
három fajta jelöléssel, caveat, 2 gomb); az elfogadva és az elvetve üzenet; a profil-érintés doboz + link; a verziók doboza (sorok: v-szám, leírás, aktív jelvény vagy
Visszaállítás gomb; a záró megjegyzés). A végén: „Többlet a kódban” és „Javítandó” lista fontossági sorrendben, konkrét elemmel. Ne javasolj új funkciót.
