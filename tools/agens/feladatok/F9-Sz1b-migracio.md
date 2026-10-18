# Feladat — ÉPÍTŐ (F9-Sz1/b, migráció): a rajzon nem szereplő mondatok lektorált értékei

Egyetlen SQL-fájlt írsz. A kimenet PONTOSAN ebben az alakban, semmi más szöveg előtte vagy utána:

=== FÁJL: apps/web/adatbazis/migraciok/0077_f9_sz1b_lektor.sql ===
(a fájl tartalma)
=== FÁJL VÉGE ===

## A fájl alakja (betűre)

```sql
-- F9-Sz1/b: a rajzon nem szereplő mondatok lektorált értékei (tegezés, rövidebb, zsargon nélkül)
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kulcs.neve', 'hu', 'magyar szöveg'),
  ('kulcs.neve', 'ro', 'román szöveg'),
  ('kulcs.neve', 'en', 'angol szöveg'),
  …
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
```
Szabályok: minden kulcshoz PONTOSAN három sor (hu, ro, en) ebben a sorrendben; vesszővel elválasztva, az utolsó után NINCS vessző; aposztróf a szövegben duplázva (`''`); a szövegeket SZÓ SZERINT az alábbi táblából veszed; a `{munkater}` és `{v}` helyőrzők változatlanul maradnak.

## A kulcsok és a szövegek (hu · ro · en)

1. `gephaz.tulaj_bevezeto` · „Itt a saját munkateredre állítasz: amit átírsz, az csak a(z) {munkater} munkatérre hat, a többire nem. Amit nem írsz át, arra a közös alap érvényes.” · „Aici setezi pentru spațiul tău: ce modifici afectează doar spațiul {munkater}, nu celelalte. Pentru ce nu modifici se aplică baza comună.” · „Here you set things for your own workspace: what you change affects only the {munkater} workspace, not the others. Whatever you leave unchanged follows the shared base.”
2. `sajat.bevezeto` · „Itt módosíthatod a nevedet, a felület nyelvét és a jelszavadat.” · „Aici îți poți modifica numele, limba interfeței și parola.” · „Here you can change your name, the interface language and your password.”
3. `sajat.egy_munkater_megj` · „Egyetlen munkateredben vagy, ezért nincs mire váltani.” · „Ești într-un singur spațiu, deci nu ai la ce comuta.” · „You are in a single workspace, so there is nothing to switch to.”
4. `hf.suDraft` · „Még nem mentett beállítás” · „Setare încă nesalvată” · „Settings not saved yet”
5. `hf.suActive` · „Mentett beállítás (v{v})” · „Setare salvată (v{v})” · „Saved settings (v{v})”
6. `hf.srcGroupOwn` · „Figyelt oldalak” · „Site-uri urmărite” · „Monitored sites”
7. `hf.honestyNote` · „A figyelés a beállított oldalakból dolgozik — nem nézi a teljes internetet, és nem talál meg minden megjelenést.” · „Monitorizarea lucrează din site-urile setate — nu urmărește întregul internet și nu găsește fiecare apariție.” · „Monitoring works from the sites you set — it does not watch the whole internet and will not find every mention.”

A gondolatjel (—) és a román ékezetes betűk (ă, â, î, ș, ț) változatlanul, UTF-8-ban maradnak. A magyar idézőjeleket („ ”) NEM írod bele a SQL-be.
