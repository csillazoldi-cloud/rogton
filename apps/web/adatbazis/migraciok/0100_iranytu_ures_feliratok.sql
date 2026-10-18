-- 0100: az iránytű üres lapjának második gombja (hu/ro/en). R-11/B: javaslat helyett kézzel is kezdhető.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('iranytu.inkabb_magam', 'hu', 'Inkább magam töltöm ki'),
  ('iranytu.inkabb_magam', 'ro', 'Prefer să completez eu'),
  ('iranytu.inkabb_magam', 'en', 'I will fill it in myself')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
