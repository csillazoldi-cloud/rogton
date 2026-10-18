-- 0113: R-12 A6 — a kijelentkező gomb felirata a szótár szerint (hu/ro/en). A 0112 a nav.kilepes-t
-- írta át, de a gomb a kozos.kilepes kulcsot használja.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kozos.kilepes', 'hu', 'Kijelentkezés'),
  ('kozos.kilepes', 'ro', 'Deconectare'),
  ('kozos.kilepes', 'en', 'Sign out')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
