-- 0114: a „Hogyan fogalmazzunk?" leírása 300 helyett 3000 karakterig mehet (Vilmos döntése, 2026-09-21).
-- A mező már nem „néhány szó": szabályok és példák is beleférnek. A hibaszöveg nem küld a minta mondatba.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fiok.hangnem_leiras_cimke', 'hu', 'Hogyan írjunk — szabályok, példák'),
  ('fiok.hangnem_leiras_cimke', 'ro', 'Cum să scriem — reguli, exemple'),
  ('fiok.hangnem_leiras_cimke', 'en', 'How to write — rules, examples'),
  ('fiok.hangnem_tul_hosszu', 'hu', 'Ez a mező legfeljebb {max} karakter lehet.'),
  ('fiok.hangnem_tul_hosszu', 'ro', 'Acest câmp poate avea cel mult {max} caractere.'),
  ('fiok.hangnem_tul_hosszu', 'en', 'This field can be at most {max} characters.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
