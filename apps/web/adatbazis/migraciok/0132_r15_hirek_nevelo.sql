-- 0132: R-15 · a Hírek címe a számhoz illő névelővel („az 1”, „a 2”) — {az} helyettesítő.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.hirek.kerdes', 'hu', 'Nézd át {az} {n} kész posztot')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
