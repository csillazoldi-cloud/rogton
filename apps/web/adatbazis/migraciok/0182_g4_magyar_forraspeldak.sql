-- 0182: G4 (Rögtön, 2026-10-18) — magyarországi hírforrás- és honlappéldák. A forrás-ajánló listája (packages/news-monitor-core
--   forras-lista.ts) a kódban él, és magyar országos + szakmai oldalakra cserélődött (12 cím, mind élő RSS, 2026-10-18-án mérve);
--   ez a migráció a felületi PÉLDÁKAT igazítja hozzá: a régi erdélyi / romániai oldalnevek (és a .ro végű magyar példák) helyett
--   magyar címek. Csak meglévő kulcsok szövege változik; ismételhető. A hf.* kulcsok a packages/news-monitor-feliratok
--   adatfájljaiban is átírva (a feliratok-szinkron próba őrzi: adatfájl = adatbázis).
--
-- Próbafuttatás (várt kimenet: INSERT 0 N, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0182_g4_magyar_forraspeldak.sql; echo "ROLLBACK;"; } | docker exec -i gma-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.srcAddBad', 'en', 'That does not look like a site address. Type the address of the site, for example: telex.hu'),
  ('hf.srcAddBad', 'hu', 'Ez nem tűnik oldalcímnek. Írd be az oldal címét, például: telex.hu'),
  ('hf.srcAddBad', 'ro', 'Aceasta nu pare a fi adresa unui site. Scrie adresa site-ului, de exemplu: telex.hu'),
  ('hf.srcAddPh', 'en', 'Type the site address — for example telex.hu'),
  ('hf.srcAddPh', 'hu', 'Írd be az oldal címét — például telex.hu'),
  ('hf.srcAddPh', 'ro', 'Scrie adresa site-ului — de exemplu telex.hu'),
  ('onboarding.eb_oldal_pl', 'hu', 'pl. telex.hu'),
  ('onboarding.eb_oldal_pl', 'ro', 'ex. telex.hu'),
  ('onboarding.eb_oldal_uj_pl', 'hu', '+ másik oldal címe (pl. probapekseg.hu)'),
  ('onboarding.eb_weboldal_pl', 'hu', 'pl. probapekseg.hu'),
  ('r15.mit.oldal_pelda', 'en', 'e.g. telex.hu'),
  ('r15.mit.oldal_pelda', 'hu', 'pl. telex.hu'),
  ('r15.mit.oldal_pelda', 'ro', 'de ex. telex.hu')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
