-- 0162: VJ-1011 (Csilla 10-11 „proceed with the rest”): a Hírek lap 4+ hírnél az első hármat mutatja, a többi a „Még {n} hír” mögött
-- (ugyanaz a minta, mint a Kezdőlap „Még {n} javaslat”-a). A szöveg a design/VJ-1011/feliratok.json-ból.
-- CSAK felirat: 1 ÚJ kulcs × 3 nyelv. ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0162_vj_1011_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.hirek.meg_hir', 'hu', 'Még {n} hír'),
  ('r15.hirek.meg_hir', 'ro', 'Încă {n} știri'),
  ('r15.hirek.meg_hir', 'en', '{n} more news')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
