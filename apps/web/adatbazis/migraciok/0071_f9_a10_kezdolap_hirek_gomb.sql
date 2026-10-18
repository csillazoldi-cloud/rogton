-- F9-A10: a kezdőlap fő gombja a valódi számmal
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kezdolap.fo_gomb_hirek_n', 'hu', 'Mind a {n} új hír megtekintése'),
  ('kezdolap.fo_gomb_hirek_n', 'ro', 'Vezi toate cele {n} știri noi'),
  ('kezdolap.fo_gomb_hirek_n', 'en', 'See all {n} new stories')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
