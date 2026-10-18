# Feladat — FORDÍTOTT ELLENŐR (E-16): a feliratok szerkesztője a jóváhagyott E-15 rajz ellen

Vasszabály: **semmi nem lehet a képernyőn, ami nincs a rajzon** — a felesleg hiba; ami hiányzik, az kérdés. A terv az E-15 rajz
(`Main.dc.html` asztali, `Telefon.dc.html` telefon — statikus HTML, a szövegek magyarul). A megvalósítás: `Feliratok.tsx` (React; a
szövegek `t("feliratok.kulcs")` alakban — a magyar értékek a mellékelt `feliratok-hu.json`-ban) és `feliratok.css`.

NEM kell futtatni semmit; hasonlítsd össze elemről elemre: fejléc (cím, szint jelvénye, piszkos jelvény, szintválasztó, nyelvválasztó,
3 gomb, vissza-link), üzenetsáv, bal oszlop (képernyők listája darabszámmal, számláló doboz 3 sorral), a fő panel (csoport címe +
összeg, magyarázat, keresőmező ikonnal, 3 szűrő), a kártyák (kulcs, állapot-jelvény: közös / saját / hiányzó fordítás, „hibakódhoz
kötött”, „Visszaállítás a közösre” gomb a sajátnál, 3 nyelv címkével, tartalék-jegyzet), „További N felirat mutatása”, alul
Export/import és Korábbi verziók. Telefon: a képernyők listája lenyíló, a nyelvek egymás alatt, a fejléc gombjai sorba törnek.

Ismert és ELFOGADOTT eltérések, NE jelezd: a rajz mintaszövegei (kulcsok, dátumok, számok) a valódi adatból jönnek; a rajzon a
„Tervezet mentve” üzenet példaként látszik; a lenyíló képernyőlista a rajzon egy szöveges menü, nálunk a böngésző lenyílója;
a keresésnél és a saját/hiányzó szűrőnél a lista minden képernyőre kiterjed (a cím ilyenkor „Mind”).

Add vissza egyetlen fájlt: `docs/E-16-FORDITOTT-ELLENORZES.md`, magyarul:
## Felesleg (van nálunk, nincs a rajzon) — HIBA
| Elem | Hol a kódban | Javaslat |
## Hiány (van a rajzon, nincs nálunk) — KÉRDÉS
| Rajz-elem | Megjegyzés |
## Eltérő viselkedés / megjelenés
| Rajz | Nálunk | Súly |
## Egyezik
Rövid felsorolás.
Légy konkrét; ha bizonytalan vagy, írd oda. Ne találj ki elemeket. Ne írj kódot.
