-- 0161: a reggeli (08:00) tesztelői Telegram-üzenet záró sora (Csilla 2026-10-10 21:55): a „Mind egy helyen” link alatt egy állandó sor,
-- link NÉLKÜL (a hubnak nincs ismert webcíme). Csak a reggeli üzenetben, és csak ha az elmegy (N ≥ 1) — packages/visszajelzes-core
-- `reggeliUzenet`. CSAK felirat: 1 ÚJ kulcs × 3 nyelv. ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0161_vj_tg_hub.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vj.tg_hub', 'hu', 'Nézd meg a hub kártyát is — lehet új tesztfeladat.'),
  ('vj.tg_hub', 'ro', 'Vezi și cardul din hub — poate există o sarcină nouă de testare.'),
  ('vj.tg_hub', 'en', 'Check the hub card too — there may be a new test task.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
