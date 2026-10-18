-- 0163: R-18 arculatfrissítés (Csilla 2026-10-11): a termék neve a felső sávban („Posztgyár”, nagybetűvel kiírva), a „Profil ▾” és a
-- „Cégeim ▾” menü (csak egynél több cégnél), a harang akadálymentes neve a számmal, és a sötét / világos mód váltója.
-- A szöveg a design/R18-arculatfrissites/feliratok.json-ból (a rajz és IRANYOK.md / IRANYOK-round4.md feliratai).
-- CSAK felirat: 9 ÚJ kulcs × 3 nyelv = 27 sor. ON CONFLICT: ismételhető. (A nyitolap.termeknev és a kozos.app_nev NEM változik — nyitott döntés.)
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: INSERT 0 27, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0163_r18_arculatfrissites_feliratok.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fejlec.termeknev', 'hu', 'Posztgyár'),
  ('fejlec.termeknev', 'ro', 'Fabrica de postări'),
  ('fejlec.termeknev', 'en', 'Post factory'),
  ('fejlec.haza', 'hu', '{nev} – Kezdőlap'),
  ('fejlec.haza', 'ro', '{nev} – Acasă'),
  ('fejlec.haza', 'en', '{nev} – Home'),
  ('nav.profil', 'hu', 'Profil'),
  ('nav.profil', 'ro', 'Profil'),
  ('nav.profil', 'en', 'Profile'),
  ('nav.cegeim', 'hu', 'Cégeim'),
  ('nav.cegeim', 'ro', 'Companiile mele'),
  ('nav.cegeim', 'en', 'My companies'),
  ('nav.ertesitesek_szammal', 'hu', 'Értesítések: {n}'),
  ('nav.ertesitesek_szammal', 'ro', 'Notificări: {n}'),
  ('nav.ertesitesek_szammal', 'en', 'Notifications: {n}'),
  ('mod.valto.vilagosra', 'hu', 'Világos mód bekapcsolása'),
  ('mod.valto.vilagosra', 'ro', 'Activează modul luminos'),
  ('mod.valto.vilagosra', 'en', 'Switch to light mode'),
  ('mod.valto.sotetre', 'hu', 'Sötét mód bekapcsolása'),
  ('mod.valto.sotetre', 'ro', 'Activează modul întunecat'),
  ('mod.valto.sotetre', 'en', 'Switch to dark mode'),
  ('mod.vilagos', 'hu', 'Világos mód'),
  ('mod.vilagos', 'ro', 'Mod luminos'),
  ('mod.vilagos', 'en', 'Light mode'),
  ('mod.sotet', 'hu', 'Sötét mód'),
  ('mod.sotet', 'ro', 'Mod întunecat'),
  ('mod.sotet', 'en', 'Dark mode')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
