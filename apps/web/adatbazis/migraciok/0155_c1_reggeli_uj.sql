-- 0155: c1 összevonva a c7-tel (Csilla 2026-10-09 07:53) — a reggeli Telegram-üzenet első részének címe, hu/ro/en.
-- A hub nem lehet cél (a hub-csatlakozó Claude saját belépése), ezért az új visszajelzések is a reggeli üzenetbe kerülnek.
-- CSAK felirat; ON CONFLICT: ismételhető. A 0154 nem változik.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0155_c1_reggeli_uj.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vj.tg_uj_cim', 'hu', 'Új visszajelzések'),
  ('vj.tg_uj_cim', 'ro', 'Feedback nou'),
  ('vj.tg_uj_cim', 'en', 'New feedback')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
