-- 0154: c1 + c7 (Csilla 2026-10-08/09) — a Visszajelzés modul két kimenő értesítése.
--   1. `visszajelzes.kesz_ido`: MIKOR lett „kész” egy tétel. A reggeli „Tegnap javítva” üzenet (c7) ebből tudja, mi készült el
--      az előző reggel óta. A korábban „kész”-re tett tételeknek nincs idejük (NULL) — azokról nem megy üzenet (helyes: régiek).
--   2. A Telegram-üzenet három felirata, hu/ro/en (az üzenet ma csak magyarul megy ki; a ro/en a szabály miatt van meg).
-- Az utoljára elküldött nap jelzője a meglévő `rendszer_beallitas` táblában él (kulcsok: ertesites.hub, ertesites.telegram) — nem kell új tábla.
-- Adatot nem töröl, nem ír át: csak egy üres oszlop és feliratok. ON CONFLICT / IF NOT EXISTS: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: ALTER TABLE, INSERT 0 9, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0154_c1c7_ertesitesek.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

ALTER TABLE "visszajelzes" ADD COLUMN IF NOT EXISTS "kesz_ido" timestamp with time zone;

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vj.tg_cim', 'hu', 'Tegnap javítva'),
  ('vj.tg_cim', 'ro', 'Reparat ieri'),
  ('vj.tg_cim', 'en', 'Fixed yesterday'),
  ('vj.tg_tobb', 'hu', '…és még {n}'),
  ('vj.tg_tobb', 'ro', '…și încă {n}'),
  ('vj.tg_tobb', 'en', '…and {n} more'),
  ('vj.tg_link', 'hu', 'Mind egy helyen: {url}'),
  ('vj.tg_link', 'ro', 'Toate într-un loc: {url}'),
  ('vj.tg_link', 'en', 'All in one place: {url}')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
