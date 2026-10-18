-- 0148: a lebegő Visszajelzés gomb a belépés ELŐTTI lapokon is (Kati 10-02: fiók létrehozása, belépés, az első beállítás lapjai —
-- „Mutasd be a szervezetet” stb.). Csilla 10-06: ebben a körben megy, Vilmosra nem várunk (a biztonsági átnézés utólag).
-- Ahol nincs munkamenet, a beküldés NÉVTELEN: a sorban nincs fiók és nincs szervezet, a `nevtelen` jelző igaz, a /visszajelzes lista
-- „Névtelen (belépés nélkül)” néven mutatja. Belépett, de még szervezet nélküli fióknál (szervezet létrehozása) a fiók megvan, a szervezet nincs.
-- A korlátok a kódban (apps/web/app/api/visszajelzes/route.ts, a belépési védelem mintájára: hitelesites/korlat.ts „visszajelzes” fajta).
--
-- MI VÁLTOZIK: a `visszajelzes.szervezet_id` és `fiok_id` NULL is lehet (eddig NOT NULL); új oszlop `nevtelen boolean NOT NULL DEFAULT false`.
-- Meglévő sor NEM változik (mind belépett beküldés: nevtelen = false, a két azonosító megvan). Adatvesztés nincs: csak lazítás és új oszlop.
-- A tulajdonos a végponton `szervezet_id = <sajátja>` szűrővel lát — a NULL szervezetű (névtelen) sor neki NEM jelenik meg, csak a
-- rendszergazdának (A-11: más munkatér adata nem szivárog, és névtelen beküldés sem kerül egy munkatér listájába).
-- 1 új felirat (vj.nevtelen) × 3 nyelv. Ismételhető (IF NOT EXISTS / DROP NOT NULL többször is lefut / ON CONFLICT).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: ALTER TABLE ×3, INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0148_visszajelzes_nevtelen.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

ALTER TABLE "visszajelzes" ALTER COLUMN "szervezet_id" DROP NOT NULL;
ALTER TABLE "visszajelzes" ALTER COLUMN "fiok_id" DROP NOT NULL;
ALTER TABLE "visszajelzes" ADD COLUMN IF NOT EXISTS "nevtelen" boolean DEFAULT false NOT NULL;

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('vj.nevtelen', 'hu', 'Névtelen (belépés nélkül)'),
  ('vj.nevtelen', 'ro', 'Anonim (fără autentificare)'),
  ('vj.nevtelen', 'en', 'Anonymous (not signed in)')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
