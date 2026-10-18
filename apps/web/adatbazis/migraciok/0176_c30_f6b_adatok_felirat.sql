-- 0176: c30 F6b (Csilla 10-17 16:20): a „Szervezet adatai” / „Company details” lap neve semleges MINDEN szervezettípusnak (a fesztivál
--   nem cég): HU „Adatok”, RO „Date”, EN „Details”. Ugyanez a név áll a menüben, a lapcímben, a vissza-linkekben (Programod, Nevek),
--   a Beállítások listájában, és azokban a mondatokban, amelyek a lapot a nevén nevezik. Más szöveg nem változik (a cégek képernyőin
--   is csak ez a név). A 0175 már a NAS-on van: nem írjuk át — ez új migráció. Csak meglévő kulcsok új szövege + az r15.nav.szervezet
--   eddig hiányzó (más alakú) román sora; ON CONFLICT: ismételhető. Tábla, oszlop, jog nem változik.
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: INSERT 0 48, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0176_c30_f6b_adatok_felirat.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('nav.szervezet_adatai', 'hu', 'Adatok'),
  ('nav.szervezet_adatai', 'ro', 'Date'),
  ('nav.szervezet_adatai', 'en', 'Details'),
  ('nav.ugyfelprofil', 'hu', 'Adatok'),
  ('nav.ugyfelprofil', 'ro', 'Date'),
  ('nav.ugyfelprofil', 'en', 'Details'),
  ('r15.nav.szervezet', 'hu', 'Adatok'),
  ('r15.nav.szervezet', 'ro', 'Date'),
  ('r15.nav.szervezet', 'en', 'Details'),
  ('fiok.szervezet_cim', 'hu', 'Adatok'),
  ('fiok.szervezet_cim', 'ro', 'Date'),
  ('fiok.szervezet_cim', 'en', 'Details'),
  ('fiok.oldalcim', 'hu', 'Adatok — Posztgyár'),
  ('fiok.oldalcim', 'ro', 'Date — Fabrica de postări'),
  ('fiok.oldalcim', 'en', 'Details — Post factory'),
  ('gephaz.szervezet_adatai', 'hu', 'Adatok'),
  ('gephaz.szervezet_adatai', 'ro', 'Date'),
  ('gephaz.szervezet_adatai', 'en', 'Details'),
  ('nevek.vissza', 'hu', '← Adatok'),
  ('nevek.vissza', 'ro', '← Date'),
  ('nevek.vissza', 'en', '← Details'),
  ('kezdolap.profil_sor', 'hu', 'Adatok mentve: {datum}'),
  ('kezdolap.profil_sor', 'ro', 'Date salvate: {datum}'),
  ('kezdolap.profil_sor', 'en', 'Details saved: {datum}'),
  ('onboarding.kesz_gomb_profil', 'hu', 'Adatok megnézése'),
  ('onboarding.kesz_gomb_profil', 'ro', 'Vezi datele'),
  ('onboarding.kesz_gomb_profil', 'en', 'View details'),
  ('iranytu.javaslat_hiba_profil', 'hu', 'Előbb töltsd ki az Adatok lapot — a javaslat abból dolgozik.'),
  ('iranytu.javaslat_hiba_profil', 'ro', 'Completează mai întâi pagina Date — propunerea pornește de acolo.'),
  ('iranytu.javaslat_hiba_profil', 'en', 'Fill in the Details page first — the suggestion works from it.'),
  ('kezdolap.teendo_arculat_szoveg', 'hu', 'Logó és színek az Adatok lapon.'),
  ('kezdolap.teendo_arculat_szoveg', 'ro', 'Logo și culori pe pagina Date.'),
  ('kezdolap.teendo_arculat_szoveg', 'en', 'Logo and colours on the Details page.'),
  ('onb.arak_kesobb', 'hu', 'Később az Adatoknál átállíthatod.'),
  ('onb.arak_kesobb', 'ro', 'Poți schimba mai târziu la Date.'),
  ('onb.arak_kesobb', 'en', 'You can change this later in Details.'),
  ('onboarding.eb_lab', 'hu', 'Az első gyűjtés kb. 2 perc. Az arculatot (logó, színek) később, az Adatok lapon adhatod meg.'),
  ('onboarding.eb_lab', 'ro', 'Prima colectare durează cca. 2 minute. Identitatea vizuală (logo, culori) o poți da mai târziu pe pagina Date.'),
  ('onboarding.eb_lab', 'en', 'The first collection takes about 2 minutes. You can add the brand (logo, colours) later on the Details page.'),
  ('onboarding.kesz_arculat', 'hu', 'Az arculatot (logó, színek) később, az Adatok lapon adhatod meg.'),
  ('onboarding.kesz_arculat', 'ro', 'Identitatea vizuală (logo, culori) o poți adăuga mai târziu, pe pagina Date.'),
  ('onboarding.kesz_arculat', 'en', 'You can add your visual identity (logo, colours) later, on the Details page.'),
  ('onboarding3.arculat_kesobb', 'hu', 'Az arculatot később, az Adatok lapon állíthatod be.'),
  ('onboarding3.arculat_kesobb', 'ro', 'Identitatea vizuală o poți seta mai târziu, pe pagina Date.'),
  ('onboarding3.arculat_kesobb', 'en', 'You can set your visual identity later, on the Details page.'),
  ('vz2.arculat_nelkul', 'hu', 'A céged színeit és logóját az Adatoknál adhatod meg — a képek akkor még jobban hasonlítanak rád.'),
  ('vz2.arculat_nelkul', 'ro', 'Culorile și logoul firmei le poți adăuga la Date — atunci imaginile vor semăna și mai mult cu tine.'),
  ('vz2.arculat_nelkul', 'en', 'You can add your company''s colours and logo in Details — then the images will look even more like you.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
