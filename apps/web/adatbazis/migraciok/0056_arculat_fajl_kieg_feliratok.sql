-- F-6b: 6 kulcs, aminek a rajzon nincs szövege (betöltési hiba, Rendben gomb, a fájl metasora, üres cél) — hu eredeti, ro/en fordítás.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('arculat_fajl.feltoltve_szoveg', 'hu', 'feltöltve: {ido}'),
  ('arculat_fajl.feltoltve_szoveg', 'ro', 'încărcat: {ido}'),
  ('arculat_fajl.feltoltve_szoveg', 'en', 'uploaded: {ido}'),
  ('arculat_fajl.hiba_betoltes', 'hu', 'Az arculati anyagok listája most nem tölthető be. Frissítsd a lapot.'),
  ('arculat_fajl.hiba_betoltes', 'ro', 'Lista materialelor de identitate nu se poate încărca acum. Reîncarcă pagina.'),
  ('arculat_fajl.hiba_betoltes', 'en', 'The brand materials list cannot be loaded right now. Refresh the page.'),
  ('arculat_fajl.hiba_bezar', 'hu', 'Rendben'),
  ('arculat_fajl.hiba_bezar', 'ro', 'Am înțeles'),
  ('arculat_fajl.hiba_bezar', 'en', 'OK'),
  ('arculat_fajl.meta', 'hu', '{tipus} · {meret} · feltöltve: {ido}'),
  ('arculat_fajl.meta', 'ro', '{tipus} · {meret} · încărcat: {ido}'),
  ('arculat_fajl.meta', 'en', '{tipus} · {meret} · uploaded: {ido}'),
  ('arculat_fajl.nincs_fajl', 'hu', 'Még nincs feltöltött fájl.'),
  ('arculat_fajl.nincs_fajl', 'ro', 'Niciun fișier încărcat încă.'),
  ('arculat_fajl.nincs_fajl', 'en', 'No file uploaded yet.'),
  ('kozos.rendben', 'hu', 'Rendben'),
  ('kozos.rendben', 'ro', 'Am înțeles'),
  ('kozos.rendben', 'en', 'OK')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
