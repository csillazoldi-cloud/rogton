-- 0122: Képek — egynyelvű kép (V-1: egy vagy két nyelv). A kiférés-sáv szövege egy nyelvre, és a kétnyelvű
-- sáv szövegén a nyelv jele (addig „1 sor · 1 sor” állt, nem látszott, melyik melyik) — a toldalék nélkül.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vz.sav_zold_egy', 'hu', '{sor} sor (legfeljebb {max}) · {lepcso} betűméret'),
  ('vz.sav_zold_egy', 'ro', '{sor} rânduri (maximum {max}) · mărime {lepcso}'),
  ('vz.sav_zold_egy', 'en', '{sor} lines (at most {max}) · {lepcso} text size'),
  ('vz.sav_zold', 'hu', 'HU {hu_sor} sor · RO {ro_sor} sor (legfeljebb {max}) · {lepcso} betűméret'),
  ('vz.sav_zold', 'ro', 'HU {hu_sor} rânduri · RO {ro_sor} rânduri (maximum {max}) · mărime {lepcso}'),
  ('vz.sav_zold', 'en', 'HU {hu_sor} lines · RO {ro_sor} lines (at most {max}) · {lepcso} text size')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
