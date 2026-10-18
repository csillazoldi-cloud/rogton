-- F9-A6: az elakadt értékelés a kártyán szól, a lista tetején csak a szám
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.ertekeles_hianyzik_n', 'hu', '{n} hír értékelése hiányzik.'),
  ('hf.ertekeles_hianyzik_n', 'ro', 'Lipsește evaluarea a {n} știri.'),
  ('hf.ertekeles_hianyzik_n', 'en', '{n} stories are missing their rating.'),
  ('hf.kartya_nincs_osszefoglalo', 'hu', 'Ehhez a hírhez még nincs összefoglaló — az eredeti cikket elolvashatod.'),
  ('hf.kartya_nincs_osszefoglalo', 'ro', 'Această știre nu are încă rezumat — poți citi articolul original.'),
  ('hf.kartya_nincs_osszefoglalo', 'en', 'This story has no summary yet — you can read the original article.'),
  ('hf.osszefoglalo_ujra', 'hu', 'Összefoglaló újrapróbálása'),
  ('hf.osszefoglalo_ujra', 'ro', 'Reîncearcă rezumatul'),
  ('hf.osszefoglalo_ujra', 'en', 'Retry the summary'),
  ('hf.osszefoglalo_ujra_fut', 'hu', 'Az összefoglaló készül…'),
  ('hf.osszefoglalo_ujra_fut', 'ro', 'Rezumatul se pregătește…'),
  ('hf.osszefoglalo_ujra_fut', 'en', 'Preparing the summary…'),
  ('hf.eredeti_cikk', 'hu', 'Eredeti cikk'),
  ('hf.eredeti_cikk', 'ro', 'Articolul original'),
  ('hf.eredeti_cikk', 'en', 'Original article')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
