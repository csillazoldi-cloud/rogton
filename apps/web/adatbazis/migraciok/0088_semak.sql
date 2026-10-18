-- 0088: R-10 (2026-09-18, Vilmos) — három, egy kattintással váltható színséma (Éjkék, Világos, Sötét).
-- A séma = tokenkészlet, amit a meglévő téma-tár új verzióként alkalmaz. A táblák új oszlopot kapnak:
-- a mentett séma kódját (ejkek | vilagos | sotet), nullable — a régi soroknál nincs.

ALTER TABLE "tema" ADD COLUMN "sema_kod" text;
ALTER TABLE "szervezet_tema" ADD COLUMN "sema_kod" text;

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('tema.sema.cim', 'hu', 'Séma'),
  ('tema.sema.cim', 'ro', 'Schemă'),
  ('tema.sema.cim', 'en', 'Theme'),

  ('tema.sema.magyarazat', 'hu', 'Egy kattintás, és az egész munkatér átvált. A korábbi séma a verziók között marad, bármikor visszaállítható.'),
  ('tema.sema.magyarazat', 'ro', 'Un clic și întregul spațiu de lucru se schimbă. Schema anterioară rămâne între versiuni, poate fi restabilită oricând.'),
  ('tema.sema.magyarazat', 'en', 'One click and the whole workspace switches. The previous theme stays among the versions, restorable at any time.'),

  ('tema.sema.aktiv', 'hu', 'Ezt használjátok'),
  ('tema.sema.aktiv', 'ro', 'Pe asta o folosiți'),
  ('tema.sema.aktiv', 'en', 'You use this one'),

  ('tema.sema.valt', 'hu', 'Erre váltok'),
  ('tema.sema.valt', 'ro', 'Trec pe asta'),
  ('tema.sema.valt', 'en', 'Switch to this'),

  ('tema.sema.valtas_folyamatban', 'hu', 'Átváltás…'),
  ('tema.sema.valtas_folyamatban', 'ro', 'Se schimbă…'),
  ('tema.sema.valtas_folyamatban', 'en', 'Switching…'),

  ('tema.sema.valtva', 'hu', 'Átváltva: {nev}'),
  ('tema.sema.valtva', 'ro', 'Schimbat: {nev}'),
  ('tema.sema.valtva', 'en', 'Switched: {nev}'),

  ('tema.sema.hiba', 'hu', 'Nem sikerült átváltani. Próbáld újra.'),
  ('tema.sema.hiba', 'ro', 'Nu s-a putut schimba. Încearcă din nou.'),
  ('tema.sema.hiba', 'en', 'Could not switch. Try again.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
