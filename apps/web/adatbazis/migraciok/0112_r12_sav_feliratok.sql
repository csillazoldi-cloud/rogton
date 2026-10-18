-- 0112: R-12 A6 — a szótár szerint „Kijelentkezés", nem „Kilépés" (hu/ro/en).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('nav.kilepes', 'hu', 'Kijelentkezés'),
  ('nav.kilepes', 'ro', 'Deconectare'),
  ('nav.kilepes', 'en', 'Sign out')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
