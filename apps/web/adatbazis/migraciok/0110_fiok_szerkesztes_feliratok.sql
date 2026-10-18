-- 0110: a Szervezet adatai lap szerkesztőjének új feliratai (hu/ro/en). Hiba 2026-09-21: a nyelvek
-- szabad szövegből üres listát mentettek, a 300 karakternél hosszabb hangnemet a rendszer csendben
-- elutasította. Most: nyelv-kockák, két hangnem-mező (leírás + minta mondat), hibasor a mező alatt.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fiok.nyelv_legalabb_egy', 'hu', 'Jelölj be legalább egy nyelvet.'),
  ('fiok.nyelv_legalabb_egy', 'ro', 'Bifează cel puțin o limbă.'),
  ('fiok.nyelv_legalabb_egy', 'en', 'Pick at least one language.'),
  ('fiok.hangnem_leiras_cimke', 'hu', 'Hangnem — néhány szóban'),
  ('fiok.hangnem_leiras_cimke', 'ro', 'Tonul — în câteva cuvinte'),
  ('fiok.hangnem_leiras_cimke', 'en', 'Tone — in a few words'),
  ('fiok.hangnem_minta_cimke', 'hu', 'Minta mondat — így szóljon egy poszt'),
  ('fiok.hangnem_minta_cimke', 'ro', 'Frază de exemplu — așa să sune o postare'),
  ('fiok.hangnem_minta_cimke', 'en', 'Sample sentence — how a post should sound'),
  ('fiok.hangnem_hossz', 'hu', '{n} / {max} karakter'),
  ('fiok.hangnem_hossz', 'ro', '{n} / {max} caractere'),
  ('fiok.hangnem_hossz', 'en', '{n} / {max} characters'),
  ('fiok.hangnem_tul_hosszu', 'hu', 'A hangnem legfeljebb {max} karakter lehet. A hosszabb szöveget írd a minta mondatba.'),
  ('fiok.hangnem_tul_hosszu', 'ro', 'Tonul poate avea cel mult {max} caractere. Textul mai lung scrie-l în fraza de exemplu.'),
  ('fiok.hangnem_tul_hosszu', 'en', 'The tone can be at most {max} characters. Put the longer text in the sample sentence.'),
  ('fiok.mentes_nem_sikerult', 'hu', 'Nem sikerült menteni. A beírt szöveg itt maradt — próbáld újra.'),
  ('fiok.mentes_nem_sikerult', 'ro', 'Salvarea nu a reușit. Textul scris a rămas aici — încearcă din nou.'),
  ('fiok.mentes_nem_sikerult', 'en', 'Saving failed. Your text is still here — try again.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
