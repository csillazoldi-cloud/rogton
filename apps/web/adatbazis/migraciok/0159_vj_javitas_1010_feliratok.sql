-- 0159: Kati visszajelzései 10-10, javítás (design/R15/VISSZAJELZES-TRIAZS-1010.html #5; Csilla 10-10 19:56): a Posztszöveg képhelyének linkje
-- „Új képet készítek” helyett „Képet készítek ehhez a poszthoz” (a cél változatlan: /kepek/uj/hir?poszt=…). A szöveg a design/R15/feliratok-7.json-ból.
-- CSAK felirat: 1 ÚJ kulcs × 3 nyelv. A régi r15.kep.uj_kep kulcs marad (a Kezdőlap már a meglévő r15.kozos.kepet_keszitek_munka-t mutatja).
-- ON CONFLICT: ismételhető.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 3, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0159_vj_javitas_1010_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('r15.kep.kep_ehhez_poszthoz', 'hu', 'Képet készítek ehhez a poszthoz'),
  ('r15.kep.kep_ehhez_poszthoz', 'ro', 'Fac o imagine pentru această postare'),
  ('r15.kep.kep_ehhez_poszthoz', 'en', 'Make an image for this post')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
