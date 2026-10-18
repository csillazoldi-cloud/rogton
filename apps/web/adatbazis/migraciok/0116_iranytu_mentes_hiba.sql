-- 0116: 2026-09-21 (Vilmos hibája) — az iránytű mentése/jóváhagyása némán elbukott, ha egy mező túl hosszú volt.
-- Mostantól a gombok alatt megjelenik, melyik mező a gond.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('iranytu.mentes_hiba_mezo', 'hu', 'Nem sikerült menteni. Nézd meg ezt a mezőt: {mezo} — lehet, hogy túl hosszú vagy üres.'),
  ('iranytu.mentes_hiba_mezo', 'ro', 'Nu s-a putut salva. Verifică acest câmp: {mezo} — poate este prea lung sau gol.'),
  ('iranytu.mentes_hiba_mezo', 'en', 'Could not save. Check this field: {mezo} — it may be too long or empty.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
