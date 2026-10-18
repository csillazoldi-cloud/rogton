-- 0160: c5 R-15 3. kör (Csilla 10-10 21:02–21:03) + a fájlkorlát 10 MB → 100 MB (Csilla 10-10). A szöveg a design/R15/feliratok-8.json-ból.
--  · r15.kezdolap.csempek ÚJ (a Kezdőlap gyors-elérés csempéinek felolvasott neve);
--  · r15.kezdolap.meg_apro CSERE: „Még {n} apróság” → „Még {n} javaslat” (Csilla 21:03);
--  · fajl.hiba_tul_nagy_100, arculat_fajl.nagy_mit_100, arculat_fajl.halozat_mit_100 ÚJ: az arculati fájl 100 MB-os hibaszövegei. A régi (10 MB-os)
--    kulcsok MARADNAK: a betű (Betuk lap) és a posztkép (R15KepHely) korlátja 10 MB maradt;
--  · arculat_fajl.tipusok / korlatok / nagy_korlat CSERE: 100 MB (a nagy_korlat már nem igaz „minden célra ugyanaz”).
-- CSAK felirat: 3 új + 5 cserélt kulcs × 3 nyelv = 24 sor. ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 24, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0160_r15_c5_kor3_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.kezdolap.csempek', 'hu', 'Gyors elérés'),
  ('r15.kezdolap.csempek', 'ro', 'Acces rapid'),
  ('r15.kezdolap.csempek', 'en', 'Quick access'),
  ('r15.kezdolap.meg_apro', 'hu', 'Még {n} javaslat'),
  ('r15.kezdolap.meg_apro', 'ro', 'Încă {n} sugestii'),
  ('r15.kezdolap.meg_apro', 'en', '{n} more suggestions'),
  ('fajl.hiba_tul_nagy_100', 'hu', 'A fájl túl nagy: legfeljebb 100 MB lehet.'),
  ('fajl.hiba_tul_nagy_100', 'ro', 'Fișierul este prea mare: maximum 100 MB.'),
  ('fajl.hiba_tul_nagy_100', 'en', 'The file is too large: at most 100 MB.'),
  ('arculat_fajl.nagy_mit_100', 'hu', 'Túl nagy: legfeljebb 100 MB.'),
  ('arculat_fajl.nagy_mit_100', 'ro', 'Prea mare: cel mult 100 MB.'),
  ('arculat_fajl.nagy_mit_100', 'en', 'Too large: at most 100 MB.'),
  ('arculat_fajl.halozat_mit_100', 'hu', 'Nem ért fel a fájl — túl nagy, vagy megszakadt a kapcsolat. Legfeljebb 100 MB.'),
  ('arculat_fajl.halozat_mit_100', 'ro', 'Fișierul nu a ajuns — prea mare sau conexiunea s-a întrerupt. Cel mult 100 MB.'),
  ('arculat_fajl.halozat_mit_100', 'en', 'The file did not arrive — too large, or the connection dropped. At most 100 MB.'),
  ('arculat_fajl.tipusok', 'hu', 'PNG · JPG · WEBP · PDF · legfeljebb 100 MB'),
  ('arculat_fajl.tipusok', 'ro', 'PNG · JPG · WEBP · PDF · maximum 100 MB'),
  ('arculat_fajl.tipusok', 'en', 'PNG · JPG · WEBP · PDF · up to 100 MB'),
  ('arculat_fajl.korlatok', 'hu', 'PNG, JPG vagy PDF, legfeljebb 100 MB.'),
  ('arculat_fajl.korlatok', 'ro', 'PNG, JPG sau PDF, cel mult 100 MB.'),
  ('arculat_fajl.korlatok', 'en', 'PNG, JPG or PDF, at most 100 MB.'),
  ('arculat_fajl.nagy_korlat', 'hu', 'Arculati fájl legfeljebb 100 MB, betű legfeljebb 10 MB.'),
  ('arculat_fajl.nagy_korlat', 'ro', 'Fișier de identitate cel mult 100 MB, font cel mult 10 MB.'),
  ('arculat_fajl.nagy_korlat', 'en', 'Brand files up to 100 MB, fonts up to 10 MB.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
