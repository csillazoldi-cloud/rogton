-- 0118: 2026-09-22 (Vilmos: „sokkal szigorúbb és személyre szabottabb szűrés”) — a kiszűrt hírek nem látszanak, csak a számuk.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.kiszurt_sor', 'hu', '{n} hír nem illett hozzád — ezeket kiszűrtük.'),
  ('hf.kiszurt_sor', 'ro', '{n} știri nu ți se potriveau — le-am filtrat.'),
  ('hf.kiszurt_sor', 'en', '{n} news items did not fit you — we filtered them out.'),
  ('hf.kiszurt_pontositas', 'hu', 'A kiszűrt híreket ({n}) itt sem mutatjuk.'),
  ('hf.kiszurt_pontositas', 'ro', 'Știrile filtrate ({n}) nu le arătăm nici aici.'),
  ('hf.kiszurt_pontositas', 'en', 'The filtered-out news ({n}) are not shown here either.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
