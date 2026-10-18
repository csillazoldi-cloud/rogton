-- 0101: a három felület neve a Posztszöveg lapon (hu/ro/en). A 0099 már lefutott, ezért külön fájl.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('poszt.fb', 'hu', 'Facebook'), ('poszt.fb', 'ro', 'Facebook'), ('poszt.fb', 'en', 'Facebook'),
  ('poszt.ig', 'hu', 'Instagram'), ('poszt.ig', 'ro', 'Instagram'), ('poszt.ig', 'en', 'Instagram'),
  ('poszt.li', 'hu', 'LinkedIn'), ('poszt.li', 'ro', 'LinkedIn'), ('poszt.li', 'en', 'LinkedIn')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
