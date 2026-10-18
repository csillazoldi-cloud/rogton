-- F9-Sz1/b: a rajzon nem szereplő mondatok lektorált értékei (tegezés, rövidebb, zsargon nélkül)
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('gephaz.tulaj_bevezeto', 'hu', 'Itt a saját munkateredre állítasz: amit átírsz, az csak a(z) {munkater} munkatérre hat, a többire nem. Amit nem írsz át, arra a közös alap érvényes.'),
  ('gephaz.tulaj_bevezeto', 'ro', 'Aici setezi pentru spațiul tău: ce modifici afectează doar spațiul {munkater}, nu celelalte. Pentru ce nu modifici se aplică baza comună.'),
  ('gephaz.tulaj_bevezeto', 'en', 'Here you set things for your own workspace: what you change affects only the {munkater} workspace, not the others. Whatever you leave unchanged follows the shared base.'),
  ('sajat.bevezeto', 'hu', 'Itt módosíthatod a nevedet, a felület nyelvét és a jelszavadat.'),
  ('sajat.bevezeto', 'ro', 'Aici îți poți modifica numele, limba interfeței și parola.'),
  ('sajat.bevezeto', 'en', 'Here you can change your name, the interface language and your password.'),
  ('sajat.egy_munkater_megj', 'hu', 'Egyetlen munkateredben vagy, ezért nincs mire váltani.'),
  ('sajat.egy_munkater_megj', 'ro', 'Ești într-un singur spațiu, deci nu ai la ce comuta.'),
  ('sajat.egy_munkater_megj', 'en', 'You are in a single workspace, so there is nothing to switch to.'),
  ('hf.suDraft', 'hu', 'Még nem mentett beállítás'),
  ('hf.suDraft', 'ro', 'Setare încă nesalvată'),
  ('hf.suDraft', 'en', 'Settings not saved yet'),
  ('hf.suActive', 'hu', 'Mentett beállítás (v{v})'),
  ('hf.suActive', 'ro', 'Setare salvată (v{v})'),
  ('hf.suActive', 'en', 'Saved settings (v{v})'),
  ('hf.srcGroupOwn', 'hu', 'Figyelt oldalak'),
  ('hf.srcGroupOwn', 'ro', 'Site-uri urmărite'),
  ('hf.srcGroupOwn', 'en', 'Monitored sites'),
  ('hf.honestyNote', 'hu', 'A figyelés a beállított oldalakból dolgozik — nem nézi a teljes internetet, és nem talál meg minden megjelenést.'),
  ('hf.honestyNote', 'ro', 'Monitorizarea lucrează din site-urile setate — nu urmărește întregul internet și nu găsește fiecare apariție.'),
  ('hf.honestyNote', 'en', 'Monitoring works from the sites you set — it does not watch the whole internet and will not find every mention.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
