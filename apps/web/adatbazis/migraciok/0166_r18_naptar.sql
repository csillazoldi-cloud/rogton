-- 0166: R-18 3. kör · Naptár (Csilla 2026-10-11, rajz: Claude Design „Naptár …”). A kész poszt napja a MEGLÉVŐ poszt_munka táblán:
--   tervezett_nap  — amit Tibor elfogadott vagy választott (dátum, Europe/Bucharest szerinti nap)
--   javasolt_nap   — a gép javaslata (poszt/naptar.ts javasolNapot), amíg el nem fogadja
--   kiteve         — mikor jelölte „Kitettem”-nek
-- Csak HOZZÁADÁS: három üres (NULL) oszlop, alapérték nélkül — a meglévő sorok nem változnak, semmi nem íródik át. Új tábla NINCS, a sorszintű
-- védelem (poszt_munka_sajat_szervezet) és a km_app jogai változatlanok: az új oszlopokat ugyanaz a szabály védi, mint a sor többi részét.
-- Ismételhető (IF NOT EXISTS).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: ALTER TABLE, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0166_r18_naptar.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

ALTER TABLE "poszt_munka"
  ADD COLUMN IF NOT EXISTS "tervezett_nap" date,
  ADD COLUMN IF NOT EXISTS "javasolt_nap" date,
  ADD COLUMN IF NOT EXISTS "kiteve" timestamp with time zone;
