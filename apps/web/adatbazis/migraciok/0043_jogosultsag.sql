-- Kézzel írt migráció, B-01: egységes jogellenőrzés minden módosító végponton.
--
-- A gépezet a kódban van (apps/web/app/api/_kapu.ts); itt csak az a néhány mondat, amit a
-- felhasználó lát, ha egy jog hiányzik. Eddig ezekre NEM volt felirat, tehát az általános
-- „Valami hiba történt" jelent meg — ami se nem igaz, se nem használható.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hiba.NINCS_JOG', 'hu', 'Ehhez nincs jogosultságod ebben a munkatérben. Ha kell, kérd a munkatér tulajdonosától.'),
  ('hiba.NINCS_JOG', 'ro', 'Nu ai drepturi pentru asta în acest spațiu de lucru. Dacă ai nevoie, cere-i proprietarului spațiului.'),
  ('hiba.NINCS_JOG', 'en', 'You do not have permission for this in this workspace. If you need it, ask the workspace owner.'),
  ('hiba.NINCS_SZERVEZET', 'hu', 'Még nem tartozol egyetlen munkatérhez sem. Hozz létre egyet, vagy kérd meg valakit, hogy vegyen fel a sajátjába.'),
  ('hiba.NINCS_SZERVEZET', 'ro', 'Încă nu aparții niciunui spațiu de lucru. Creează unul sau roagă pe cineva să te adauge în al său.'),
  ('hiba.NINCS_SZERVEZET', 'en', 'You do not belong to any workspace yet. Create one, or ask someone to add you to theirs.'),
  ('fiok.csak_tulajdonos', 'hu', 'A munkatér adatait a tulajdonos szerkesztheti. Te látod őket, de nem tudod átírni.'),
  ('fiok.csak_tulajdonos', 'ro', 'Datele spațiului de lucru pot fi editate de proprietar. Tu le vezi, dar nu le poți modifica.'),
  ('fiok.csak_tulajdonos', 'en', 'The workspace details can be edited by the owner. You can see them, but not change them.'),
  ('onboarding3.jovahagyas_tulajdonos', 'hu', 'A jóváhagyás a munkatér tulajdonosáé: a kitöltést bárki elvégezheti, de a hivatalos arculatot ő zárja le.'),
  ('onboarding3.jovahagyas_tulajdonos', 'ro', 'Aprobarea îi revine proprietarului spațiului de lucru: completarea o poate face oricine, dar identitatea oficială o încheie el.'),
  ('onboarding3.jovahagyas_tulajdonos', 'en', 'Approval belongs to the workspace owner: anyone can fill this in, but the owner closes the official identity.'),
  ('fiok.nincs_profil_nezo', 'hu', 'Ez a munkatér még nincs beállítva. A beállítás a tulajdonos dolga — amint kész, itt látod a munkatér adatait.'),
  ('fiok.nincs_profil_nezo', 'ro', 'Acest spațiu de lucru nu este încă configurat. Configurarea îi revine proprietarului — de îndată ce e gata, vei vedea aici datele spațiului.'),
  ('fiok.nincs_profil_nezo', 'en', 'This workspace is not set up yet. Setting it up is the owner’s job — as soon as it is done, you will see the workspace details here.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
