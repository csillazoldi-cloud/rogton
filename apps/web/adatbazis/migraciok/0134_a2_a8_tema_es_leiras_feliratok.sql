-- 0134: a 09-25-i tesztelői visszajelzés A2 és A8 tétele.
-- A2 (Csilla, Kamilla): a Figyelés beállítása „Hozzáadás” gombja, ha nem vesz fel témát, egy mondatban megmondja, miért
--    (a hf.* kulcsok a `@km/news-monitor-feliratok` adatfájljaiban is — E-29, a feliratok-szinkron próba őrzi).
-- A8 (Kami): az első beállítás „Mivel foglalkoztok?” mezője alatt kimondjuk, hogy pár mondat kell; a túl rövid
--    leírásra és a „nem derül ki” gépi válaszra a mező alatti mondat mondja meg, mit írjon.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hf.tema_mar_van', 'hu', 'Ez a téma már a listán van.'),
  ('hf.tema_mar_van', 'ro', 'Tema aceasta este deja pe listă.'),
  ('hf.tema_mar_van', 'en', 'This topic is already on the list.'),
  ('hf.tema_tul_hosszu', 'hu', 'Ez túl hosszú egy témának: írd rövidebben, legfeljebb {max} betűvel.'),
  ('hf.tema_tul_hosszu', 'ro', 'Este prea lung pentru o temă: scrie-l mai scurt, cel mult {max} caractere.'),
  ('hf.tema_tul_hosszu', 'en', 'That is too long for a topic: shorten it to {max} characters at most.'),
  ('hf.tema_tul_sok', 'hu', 'Legfeljebb {max} témád lehet: törölj egyet, mielőtt újat adsz hozzá.'),
  ('hf.tema_tul_sok', 'ro', 'Poți avea cel mult {max} teme: șterge una înainte să adaugi alta.'),
  ('hf.tema_tul_sok', 'en', 'You can have at most {max} topics: remove one before adding another.'),
  ('onboarding.eb_leiras_megj', 'hu', 'Weboldal nélkül írj 2–3 mondatot: mit csináltok, kiknek és hol. Ha megadtad a weboldalt, kihagyható.'),
  ('onboarding.eb_leiras_megj', 'ro', 'Fără site, scrie 2–3 propoziții: ce faceți, pentru cine și unde. Dacă ai dat site-ul, poate rămâne gol.'),
  ('onboarding.eb_leiras_megj', 'en', 'Without a website, write 2–3 sentences: what you do, for whom and where. If you gave the website, you can skip it.'),
  ('onboarding.eb_leiras_keves', 'hu', 'Ebből még nem derül ki, mivel foglalkoztok: írd le 2–3 mondatban, mit csináltok, kiknek és hol.'),
  ('onboarding.eb_leiras_keves', 'ro', 'Din atât încă nu reiese cu ce vă ocupați: descrie în 2–3 propoziții ce faceți, pentru cine și unde.'),
  ('onboarding.eb_leiras_keves', 'en', 'That doesn''t tell us yet what you do: describe in 2–3 sentences what you do, for whom and where.'),
  ('onboarding.eb_weboldal_keves', 'hu', 'A weboldalból nem derül ki, mivel foglalkoztok: töröld a címet, és írd le lent 2–3 mondatban.'),
  ('onboarding.eb_weboldal_keves', 'ro', 'Din site nu reiese cu ce vă ocupați: șterge adresa și descrie mai jos în 2–3 propoziții.'),
  ('onboarding.eb_weboldal_keves', 'en', 'The website doesn''t show what you do: clear the address and describe it below in 2–3 sentences.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
