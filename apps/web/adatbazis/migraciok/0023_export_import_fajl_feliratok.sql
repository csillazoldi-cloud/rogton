-- Kézzel írt migráció, E-17: export/import fájlba — a gombok és üzenetek feliratai három nyelven.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.export_fajl', 'hu', 'Exportálás fájlba'),
  ('tema.import_fajl', 'hu', 'Importálás fájlból'),
  ('tema.notice_export_fajl', 'hu', 'Téma letöltve fájlként: {nev}'),
  ('feliratok.notice_export_fajl', 'hu', 'Szövegek letöltve fájlként: {nev}'),
  ('tema.export_fajl', 'ro', 'Exportare în fișier'),
  ('tema.import_fajl', 'ro', 'Importare din fișier'),
  ('tema.notice_export_fajl', 'ro', 'Tema descărcată ca fișier: {nev}'),
  ('feliratok.notice_export_fajl', 'ro', 'Textele descărcate ca fișier: {nev}'),
  ('tema.export_fajl', 'en', 'Export to file'),
  ('tema.import_fajl', 'en', 'Import from file'),
  ('tema.notice_export_fajl', 'en', 'Theme downloaded as file: {nev}'),
  ('feliratok.notice_export_fajl', 'en', 'Texts downloaded as file: {nev}')
ON CONFLICT ("kulcs", "nyelv") DO NOTHING;
