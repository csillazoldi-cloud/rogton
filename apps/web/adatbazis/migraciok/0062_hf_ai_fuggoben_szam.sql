-- F-8.1 e (audit 11.): az AI-kiesés sávja SZÁMMAL ('{n} hír értékelése még készül - a többit már olvashatod.'), csak ha van kész kártya is.
-- A régi hf.stAiPend marad arra az esetre, ha még egy kártya sem kész.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.stAiPendN', 'hu', '{n} hír értékelése még készül — a többit már olvashatod.'),
  ('hf.stAiPendN', 'ro', '{n} știri sunt încă în curs de evaluare — pe restul le poți citi deja.'),
  ('hf.stAiPendN', 'en', '{n} stories are still being rated — you can already read the rest.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
