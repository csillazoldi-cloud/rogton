-- 0156: c1 + c7 két személyre szóló Telegram-üzenete (Csilla 2026-10-09 08:13: „a csoportüzenet mondja meg, KINEK mit kell tennie”).
--   vj.tg_reggel_fej — reggel 08:00, a tesztelőnek; vj.tg_este_fej — este 19:00, a fejlesztőnek; vj.tg_jelezte — ki jelezte a tételt.
-- {nev} a környezetből jön (TELEGRAM_TESZTELO_NEV / TELEGRAM_FEJLESZTO_NEV), {n} a darabszám. Belső üzenet: a ro/en a szabály miatt van meg.
-- A 0155 (vj.tg_uj_cim) felirata megmarad, a kód már nem használja. CSAK felirat; ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 9, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0156_c1_szemelyes_uzenetek.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vj.tg_reggel_fej', 'hu', '{nev}, tegnap {n} dolgot javítottunk — kérlek, nézd meg újra:'),
  ('vj.tg_reggel_fej', 'ro', '{nev}, ieri am reparat {n} lucruri — te rog, verifică-le din nou:'),
  ('vj.tg_reggel_fej', 'en', '{nev}, yesterday we fixed {n} things — please check them again:'),
  ('vj.tg_este_fej', 'hu', '{nev}, ma {n} új visszajelzés jött:'),
  ('vj.tg_este_fej', 'ro', '{nev}, azi au venit {n} feedbackuri noi:'),
  ('vj.tg_este_fej', 'en', '{nev}, {n} new pieces of feedback came in today:'),
  ('vj.tg_jelezte', 'hu', 'jelezte: {nev}'),
  ('vj.tg_jelezte', 'ro', 'semnalat de: {nev}'),
  ('vj.tg_jelezte', 'en', 'reported by: {nev}')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
