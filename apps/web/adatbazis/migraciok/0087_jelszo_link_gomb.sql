-- 0087: a Fiókok lap fiók-részletének „Jelszó-visszaállító link" gombja, és a „Jelszó elfelejtve"
-- lap szövegének frissítése. A linket a rendszergazda küldi el (D-17: a rendszer nem küld e-mailt).

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fiokok.aReset', 'hu', 'Jelszó-visszaállító link'),
  ('fiokok.aReset', 'ro', 'Link de resetare a parolei'),
  ('fiokok.aReset', 'en', 'Password reset link'),

  ('fiokok.aResetWorking', 'hu', 'Link készül…'),
  ('fiokok.aResetWorking', 'ro', 'Se generează linkul…'),
  ('fiokok.aResetWorking', 'en', 'Creating the link…'),

  ('fiokok.resetLinkTitle', 'hu', 'Küldd el ezt a linket a felhasználónak'),
  ('fiokok.resetLinkTitle', 'ro', 'Trimite acest link utilizatorului'),
  ('fiokok.resetLinkTitle', 'en', 'Send this link to the user'),

  ('fiokok.resetLinkValid', 'hu', 'Érvényes eddig: {ido} (60 perc)'),
  ('fiokok.resetLinkValid', 'ro', 'Valabil până la: {ido} (60 de minute)'),
  ('fiokok.resetLinkValid', 'en', 'Valid until {ido} (60 minutes)'),

  ('fiokok.resetLinkHow', 'hu', 'A linken a felhasználó új jelszót ad meg. A rendszer nem küld e-mailt — te küldöd el (üzenetben, e-mailben).'),
  ('fiokok.resetLinkHow', 'ro', 'Pe link utilizatorul își setează o parolă nouă. Sistemul nu trimite e-mail — îl trimiți tu (mesaj, e-mail).'),
  ('fiokok.resetLinkHow', 'en', 'On the link the user sets a new password. The system sends no e-mail — you send it (message, e-mail).'),

  ('fiokok.resetLinkError', 'hu', 'Nem sikerült linket készíteni. Próbáld újra.'),
  ('fiokok.resetLinkError', 'ro', 'Nu s-a putut genera linkul. Încearcă din nou.'),
  ('fiokok.resetLinkError', 'en', 'Could not create the link. Try again.'),

  ('fiokok.copy', 'hu', 'Másolás'),
  ('fiokok.copy', 'ro', 'Copiază'),
  ('fiokok.copy', 'en', 'Copy'),

  ('fiokok.copied', 'hu', 'Másolva ✓'),
  ('fiokok.copied', 'ro', 'Copiat ✓'),
  ('fiokok.copied', 'en', 'Copied ✓'),

  ('fiok.visszaallitas_szoveg', 'hu', 'A jelszót a rendszergazda állítja vissza: küld neked egy linket, azzal új jelszót adhatsz. Írj neki:'),
  ('fiok.visszaallitas_szoveg', 'ro', 'Parola o resetează administratorul: îți trimite un link cu care îți setezi o parolă nouă. Scrie-i:'),
  ('fiok.visszaallitas_szoveg', 'en', 'The administrator resets the password: they send you a link to set a new one. Write to them:')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
