-- 0128: J-1 (2026-09-25-i bejárás) — az első beállítás oldal-ajánlójának töltése és a 0 oldal figyelmeztetése; a Hírek lap
-- a sikertelen gyűjtést kimondja (nem „még nem futott”), és megmondja, mit tegyen a felhasználó.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('onboarding.eb_oldalak_keres', 'hu', 'Keressük a hozzátok illő híroldalakat…'),
  ('onboarding.eb_oldalak_keres', 'ro', 'Căutăm site-urile de știri potrivite pentru voi…'),
  ('onboarding.eb_oldalak_keres', 'en', 'Looking for news sites that suit you…'),
  ('onboarding.eb_nincs_oldal', 'hu', 'Nincs kiválasztott híroldal — így nem lesz honnan híreket gyűjteni. Jelölj be legalább egyet.'),
  ('onboarding.eb_nincs_oldal', 'ro', 'Nu ați ales niciun site de știri — nu vom avea de unde aduna știri. Bifați cel puțin unul.'),
  ('onboarding.eb_nincs_oldal', 'en', 'No news site selected — there will be nowhere to collect news from. Tick at least one.'),
  ('hf.stLastRunFailed', 'hu', 'Utolsó gyűjtés: {t} — nem sikerült'),
  ('hf.stLastRunFailed', 'ro', 'Ultima colectare: {t} — nu a reușit'),
  ('hf.stLastRunFailed', 'en', 'Last collection: {t} — it failed'),
  ('hf.futas_nem_sikerult_cim', 'hu', 'A legutóbbi gyűjtés nem hozott hírt: egyik figyelt oldalt sem tudtuk elolvasni.'),
  ('hf.futas_nem_sikerult_cim', 'ro', 'Ultima colectare nu a adus știri: nu am putut citi niciunul dintre site-urile urmărite.'),
  ('hf.futas_nem_sikerult_cim', 'en', 'The last collection brought no news: we could not read any of the sites you follow.'),
  ('hf.futas_nem_sikerult_szoveg', 'hu', 'Nézd meg a figyelt oldalakat, és a nem működő helyett adj meg másikat.'),
  ('hf.futas_nem_sikerult_szoveg', 'ro', 'Verifică site-urile urmărite și înlocuiește-l pe cel care nu funcționează.'),
  ('hf.futas_nem_sikerult_szoveg', 'en', 'Check the sites you follow and replace the one that does not work.'),
  ('hf.futas_nem_sikerult_link', 'hu', 'Figyelt oldalak'),
  ('hf.futas_nem_sikerult_link', 'ro', 'Site-uri urmărite'),
  ('hf.futas_nem_sikerult_link', 'en', 'Followed sites')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
