-- 0146: R-13 kredit-képernyők, 2. kör (Csilla 2026-10-06, kerdesek 2): elfogyott kreditnél a Hírek és a Posztszöveg lapon a TULAJDONOS a
-- „…szólj a munkatér tulajdonosának.” mondat helyett halk linket kap a Kreditek nézetre (/tagok/kreditek). A tag mondata változatlan.
-- A szöveg Csilla szava (hu/ro/en). CSAK feliratok: tábla, oszlop, adat nem változik. 1 új kulcs × 3 nyelv = 3 sor. ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0146_r13_tobb_kredit_link.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r13.kredit.tobbet_szeretnel', 'hu', 'Szeretnél több kreditet?'),
  ('r13.kredit.tobbet_szeretnel', 'ro', 'Vrei mai multe credite?'),
  ('r13.kredit.tobbet_szeretnel', 'en', 'Want more credits?')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
