-- Kézzel írt migráció, E-17b: a fiókprofil-oldal átrajzolása (Vilmos mockupja: Fiokprofil-optimalizalt) — új feliratok három
-- nyelven (Kimi fordítás), és a már nem használt régi fiókoldali kulcsok törlése (a szervezeti/közös felülírásokban maradó
-- ilyen kulcsot a hatásos szótár nem használja, nem zavar).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fiok.cim', 'hu', 'Ügyfélprofil'),
  ('fiok.morzsa', 'hu', '/ {szervezet} / Profil'),
  ('fiok.jovahagyva_jelveny', 'hu', '✓ Jóváhagyva'),
  ('fiok.jovahagyva_meta', 'hu', '{ido} · {ki}'),
  ('fiok.hianyzo_gomb', 'hu', '{n} hiányzó rész: {list}'),
  ('fiok.bevezeto', 'hu', 'Ezt a profilt használja minden eszköz. A mentett változás azonnal érvényes; a modulok a következő futásnál már ezt kapják.'),
  ('fiok.eredet_reszletei', 'hu', 'Eredet részletei'),
  ('fiok.letrehozva_sor', 'hu', 'Létrehozva: {datum}'),
  ('fiok.felulet_nyelve', 'hu', 'A felület nyelve'),
  ('fiok.nyelv_megj_rovid', 'hu', 'A profil szövegeit nem írja át.'),
  ('fiok.honnan_rovid', 'hu', 'A profil az onboarding három lépéséből jött létre, jóváhagyással. Azóta nincs piszkozat — a hiteles profil ez az egy, itt.'),
  ('fiok.beallitasok', 'hu', 'Beállítások'),
  ('fiok.cim', 'ro', 'Profil client'),
  ('fiok.morzsa', 'ro', '/ {szervezet} / Profil'),
  ('fiok.jovahagyva_jelveny', 'ro', '✓ Aprobat'),
  ('fiok.jovahagyva_meta', 'ro', '{ido} · {ki}'),
  ('fiok.hianyzo_gomb', 'ro', '{n} secțiune lipsă: {list}'),
  ('fiok.bevezeto', 'ro', 'Acest profil este folosit de toate instrumentele. Modificările salvate sunt valabile imediat; modulele îl vor folosi la următoarea rulare.'),
  ('fiok.eredet_reszletei', 'ro', 'Detalii origine'),
  ('fiok.letrehozva_sor', 'ro', 'Creat: {datum}'),
  ('fiok.felulet_nyelve', 'ro', 'Limba interfeței'),
  ('fiok.nyelv_megj_rovid', 'ro', 'Nu rescrie textele din profil.'),
  ('fiok.honnan_rovid', 'ro', 'Profilul a fost creat din cei trei pași ai Onboarding-ului, cu aprobare. De atunci nu există ciornă — acesta este singurul profil autentic, aici.'),
  ('fiok.beallitasok', 'ro', 'Setări'),
  ('fiok.cim', 'en', 'Client profile'),
  ('fiok.morzsa', 'en', '/ {szervezet} / Profile'),
  ('fiok.jovahagyva_jelveny', 'en', '✓ Approved'),
  ('fiok.jovahagyva_meta', 'en', '{ido} · {ki}'),
  ('fiok.hianyzo_gomb', 'en', '{n} missing section: {list}'),
  ('fiok.bevezeto', 'en', 'Every tool uses this profile. Saved changes take effect immediately; modules will use it on their next run.'),
  ('fiok.eredet_reszletei', 'en', 'Origin details'),
  ('fiok.letrehozva_sor', 'en', 'Created: {datum}'),
  ('fiok.felulet_nyelve', 'en', 'Interface language'),
  ('fiok.nyelv_megj_rovid', 'en', 'Does not rewrite the profile texts.'),
  ('fiok.honnan_rovid', 'en', 'The profile was created from the three Onboarding steps, with approval. Since then there is no draft — this is the one authentic profile, right here.'),
  ('fiok.beallitasok', 'en', 'Settings')
ON CONFLICT ("kulcs", "nyelv") DO NOTHING;

DELETE FROM "felirat" WHERE "kulcs" IN ('fiok.cim_eleje', 'fiok.cim_kiemelt', 'fiok.alcim', 'fiok.kesobbre', 'fiok.mentve', 'fiok.mentes', 'fiok.mentes_hiba', 'fiok.letrehozva', 'fiok.tagok', 'fiok.fiokod', 'fiok.email', 'fiok.nyelv', 'fiok.nyelv_megj', 'fiok.honnan_cim', 'fiok.honnan');
