-- F9-A4: a Figyelés beállítása lap állapotainak feliratai
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.tervezet_folytatas', 'hu', 'Van egy korábban elkezdett beállításod, amely még nincs használatban.'),
  ('hf.tervezet_folytatas', 'ro', 'Ai o setare începută mai devreme, care încă nu este folosită.'),
  ('hf.tervezet_folytatas', 'en', 'You have a setup you started earlier that is not in use yet.'),
  ('hf.folytatom', 'hu', 'Folytatom'),
  ('hf.folytatom', 'ro', 'Continui'),
  ('hf.folytatom', 'en', 'Continue'),
  ('hf.megnezem_mostanit', 'hu', 'Megnézem a mostanit'),
  ('hf.megnezem_mostanit', 'ro', 'Văd setarea actuală'),
  ('hf.megnezem_mostanit', 'en', 'Show the current one'),
  ('hf.mentve_ekkor', 'hu', 'Mentve {ido}'),
  ('hf.mentve_ekkor', 'ro', 'Salvat la {ido}'),
  ('hf.mentve_ekkor', 'en', 'Saved at {ido}'),
  ('hf.nincs_figyelt_oldal', 'hu', 'Még nincs figyelt oldal.'),
  ('hf.nincs_figyelt_oldal', 'ro', 'Încă nu urmărim niciun site.'),
  ('hf.nincs_figyelt_oldal', 'en', 'No sites are being monitored yet.'),
  ('hf.forras_ok_napi', 'hu', 'Ezt az oldalt minden reggel átnézzük.'),
  ('hf.forras_ok_napi', 'ro', 'Verificăm acest site în fiecare dimineață.'),
  ('hf.forras_ok_napi', 'en', 'We check this site every morning.'),
  ('hf.forras_ok_lista', 'hu', 'Ez az oldal a figyelési listádon van.'),
  ('hf.forras_ok_lista', 'ro', 'Acest site este pe lista ta de urmărire.'),
  ('hf.forras_ok_lista', 'en', 'This site is on your watch list.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
