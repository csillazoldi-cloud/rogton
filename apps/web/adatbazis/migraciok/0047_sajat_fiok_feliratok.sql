-- F-4: a saját fiók (jelszóváltás, név, kiléptetés minden más eszközről) feliratai három nyelven.
-- Az e-mail-cím ZÁRVA, fióktörlés NINCS — ezt a felületen is jelezni kell.

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fiok.hiba_rossz_jelenlegi_jelszo', 'hu', 'A jelenlegi jelszó nem stimmel.'),
  ('fiok.hiba_rossz_jelenlegi_jelszo', 'ro', 'Parola actuală nu este corectă.'),
  ('fiok.hiba_rossz_jelenlegi_jelszo', 'en', 'The current password is incorrect.'),
  ('fiok.jelszo_valtas_ok', 'hu', 'A jelszavad megváltozott. A többi eszközön ki lettél léptetve.'),
  ('fiok.jelszo_valtas_ok', 'ro', 'Parola ta a fost schimbată. Ai fost deconectat pe celelalte dispozitive.'),
  ('fiok.jelszo_valtas_ok', 'en', 'Your password has been changed. You have been signed out on the other devices.'),
  ('fiok.nev_ok', 'hu', 'A neved megváltozott.'),
  ('fiok.nev_ok', 'ro', 'Numele tău a fost schimbat.'),
  ('fiok.nev_ok', 'en', 'Your name has been changed.'),
  ('fiok.kileptetes_ok', 'hu', 'A többi eszközön ki lettél léptetve.'),
  ('fiok.kileptetes_ok', 'ro', 'Ai fost deconectat pe celelalte dispozitive.'),
  ('fiok.kileptetes_ok', 'en', 'You have been signed out on the other devices.'),
  ('fiok.email_zarva', 'hu', 'Az e-mail-címed nem módosítható: ez a fiókod kulcsa. Ha új címre van szükséged, a munkatér tulajdonosa új meghívót ad.'),
  ('fiok.email_zarva', 'ro', 'Adresa ta de e-mail nu poate fi modificată: este cheia contului tău. Dacă ai nevoie de o adresă nouă, proprietarul spațiului de lucru îți dă o invitație nouă.'),
  ('fiok.email_zarva', 'en', 'Your email address cannot be changed: it is the key to your account. If you need a new address, the workspace owner will give you a new invitation.'),
  ('fiok.torles_nincs', 'hu', 'Fiók törlése nincs: a munkád a munkatérben marad, ha kilépsz belőle.'),
  ('fiok.torles_nincs', 'ro', 'Ștergerea contului nu există: munca ta rămâne în spațiul de lucru dacă ieși din el.'),
  ('fiok.torles_nincs', 'en', 'Account deletion does not exist: your work stays in the workspace if you leave it.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
