-- F9-A7: a 48 órás korlát mondata a beállítás lapon
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.korlat_48h', 'hu', 'Az elmúlt 2 nap híreit nézzük.'),
  ('hf.korlat_48h', 'ro', 'Ne uităm la știrile din ultimele 2 zile.'),
  ('hf.korlat_48h', 'en', 'We look at the news from the last 2 days.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
