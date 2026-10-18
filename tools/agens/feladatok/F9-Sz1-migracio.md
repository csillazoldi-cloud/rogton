# Feladat — ÉPÍTŐ (F9-Sz1, migráció): hiányzó feliratok pótlása és a régi nevek cseréje

Egyetlen SQL-fájlt írsz. A kimenet PONTOSAN ebben az alakban, semmi más szöveg előtte vagy utána:

=== FÁJL: apps/web/adatbazis/migraciok/0073_f9_sz1_feliratok_potlasa.sql ===
(a fájl tartalma)
=== FÁJL VÉGE ===

## A fájl alakja (ezt a mintát követed, betűre)

```sql
-- F9-Sz1: hiányzó feliratok pótlása (nyers kulcs látszott a képernyőn) és a régi nevek cseréje (Gépház, Kezdőképernyő, Theme, Hírfigyelő)
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kulcs.neve', 'hu', 'magyar szöveg'),
  ('kulcs.neve', 'ro', 'román szöveg'),
  ('kulcs.neve', 'en', 'angol szöveg'),
  …
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
```
Szabályok: minden kulcshoz PONTOSAN három sor (hu, ro, en) ebben a sorrendben; a sorok vesszővel elválasztva, az utolsó sor után NINCS vessző; az aposztróf a szövegben duplázva (`''`); a szövegeket SZÓ SZERINT az alábbi táblából veszed, nem fogalmazol át semmit.

## A kulcsok és a szövegek (hu · ro · en)

1. `beallitasok.mit_kuldunk_valasz` · „Ezt a részt még írjuk — a próbaidőszak alatt pótoljuk.” · „Această parte este încă în lucru — o completăm în perioada de probă.” · „This part is still being written — we will complete it during the trial period.”
2. `beallitasok.kinek_valasz` · ugyanaz a három szöveg, mint az 1. pontban
3. `beallitasok.mire_hasznalja_valasz` · ugyanaz a három szöveg, mint az 1. pontban
4. `onboarding1.ujra` · „Új javaslat” · „Sugestie nouă” · „New suggestion”
5. `feliratok.csoport_ai` · „AI-beállítások” · „Setări IA” · „AI settings”
6. `feliratok.csoport_r7` · „Új nevek (R-7)” · „Nume noi (R-7)” · „New names (R-7)”
7. `feliratok.csoport_sajatfiok` · „Saját fiók (új)” · „Cont propriu (nou)” · „Own account (new)”
8. `feliratok.angol_eredeti` · „angol eredeti” · „original în engleză” · „English original”
9. `feliratok.csoport_gephaz` · „Beállítások” · „Setări” · „Settings”
10. `kezdolap.oldalcim` · „Kezdőlap — Kommunikációs munkatér” · „Pagina de start — Spațiu de comunicare” · „Home — Communication workspace”
11. `fiok.oldalcim` · „Szervezet adatai — Kommunikációs munkatér” · „Datele organizației — Spațiu de comunicare” · „Organisation details — Communication workspace”
12. `gephaz.oldalcim` · „Beállítások — Kommunikációs munkatér” · „Setări — Spațiu de comunicare” · „Settings — Communication workspace”
13. `tema.oldalcim` · „Megjelenés — Kommunikációs munkatér” · „Aspect — Spațiu de comunicare” · „Appearance — Communication workspace”
14. `hf.oldalcim` · „Hírek — Kommunikációs munkatér” · „Știri — Spațiu de comunicare” · „News — Communication workspace”
15. `kimeno.vissza` · „← Beállítások” · „← Setări” · „← Settings”
16. `tagok.esemenyek_link` · „Az eseménynapló a Beállításokban →” · „Jurnalul de evenimente este în Setări →” · „The event log is in Settings →”

A gondolatjel (—), a nyíl (→, ←) és a román ékezetes betűk (ă, â, î, ș, ț) változatlanul, UTF-8-ban maradnak. A magyar idézőjeleket („ ”) NEM írod bele a SQL-be — azok itt csak a szöveg határát jelölik.
