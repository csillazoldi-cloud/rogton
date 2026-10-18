-- 0138: R-16 K5 — a 12e „Betűk” feliratai (design/R16-arculat/TERV.md §2-K5, §2-K8; gepezet 7–8; kerdesek 2).
-- CSAK feliratok (9 kulcs × hu/ro/en = 27 sor, a design/R16-arculat/feliratok.json szövegével betűre). Tábla, oszlop, adat nem változik:
-- a saját betű a meglévő `arculat_fajl` táblába kerül (cel = 'betu'; a `cel` és a `tipus` oszlopon nincs CHECK — mérve: 0049), a vizsgálata
-- a K1 `elemzes` oszlopába. A többi kulcs, amit a 12e használ (betu.eros … betu.klasszikus, ez_legyen, megse, igy_nez_ki, masik_minta), a 0136-ban van.
-- ON CONFLICT: ismételhető (a már futott migrációt soha nem írjuk át — a javítás új migráció).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 27, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0138_r16_betuk_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r16.arculat.betu.kerdes', 'hu', 'Melyik betű illik hozzátok?'),
  ('r16.arculat.betu.kerdes', 'ro', 'Ce font vi se potrivește?'),
  ('r16.arculat.betu.kerdes', 'en', 'Which font suits you?'),
  ('r16.arculat.betu.ful_cim', 'hu', 'Cím'),
  ('r16.arculat.betu.ful_cim', 'ro', 'Titlu'),
  ('r16.arculat.betu.ful_cim', 'en', 'Heading'),
  ('r16.arculat.betu.ful_szoveg', 'hu', 'Szöveg'),
  ('r16.arculat.betu.ful_szoveg', 'ro', 'Text'),
  ('r16.arculat.betu.ful_szoveg', 'en', 'Text'),
  ('r16.arculat.betu.sajat', 'hu', 'Saját betűm van'),
  ('r16.arculat.betu.sajat', 'ro', 'Am fontul meu'),
  ('r16.arculat.betu.sajat', 'en', 'I have my own font'),
  ('r16.arculat.betu.sajat_tipus', 'hu', 'TTF, OTF vagy WOFF2 fájl'),
  ('r16.arculat.betu.sajat_tipus', 'ro', 'Fișier TTF, OTF sau WOFF2'),
  ('r16.arculat.betu.sajat_tipus', 'en', 'A TTF, OTF or WOFF2 file'),
  ('r16.arculat.betu.sajat_nev', 'hu', 'Saját: {nev}'),
  ('r16.arculat.betu.sajat_nev', 'ro', 'Propriu: {nev}'),
  ('r16.arculat.betu.sajat_nev', 'en', 'Your own: {nev}'),
  ('r16.arculat.betu.hiba_tipus', 'hu', 'Ezt a fájlt nem tudjuk betűként használni. Tölts fel TTF, OTF vagy WOFF2 fájlt.'),
  ('r16.arculat.betu.hiba_tipus', 'ro', 'Nu putem folosi acest fișier ca font. Încarcă un fișier TTF, OTF sau WOFF2.'),
  ('r16.arculat.betu.hiba_tipus', 'en', 'We can''t use this file as a font. Upload a TTF, OTF or WOFF2 file.'),
  ('r16.arculat.betu.hianyzo_betuk', 'hu', 'Ebből a betűből hiányzik néhány ékezet ({betuk}). Ezeket a {tartalek} betűvel írjuk.'),
  ('r16.arculat.betu.hianyzo_betuk', 'ro', 'Acestui font îi lipsesc câteva diacritice ({betuk}). Pe acestea le scriem cu fontul {tartalek}.'),
  ('r16.arculat.betu.hianyzo_betuk', 'en', 'This font is missing some accented letters ({betuk}). We write those in {tartalek}.'),
  ('r16.arculat.betu.licenc', 'hu', 'A betű használatáért te felelsz.'),
  ('r16.arculat.betu.licenc', 'ro', 'Răspunzi tu pentru folosirea fontului.'),
  ('r16.arculat.betu.licenc', 'en', 'You are responsible for the right to use this font.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
