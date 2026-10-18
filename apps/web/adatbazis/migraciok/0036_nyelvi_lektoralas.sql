-- Kézzel írt migráció, E-38: a román és angol felület lektorálása (A-16).
-- Két AI-lektor javasolt, egy harmadik felülbírálta (a javaslatok kétharmadát elvetette), a maradékot
-- soronként átnéztem: két javaslat kikerült, mert hibát vitt volna be ("Create a account", és egy
-- névütközés az "Overview" lapnévvel). Emberi anyanyelvi kör ezután következik (D-20).
-- A magyar szövegek nem változnak.

UPDATE "felirat" SET "szoveg" = 'Autentificare — Spațiu de lucru de comunicare', "frissitve" = now() WHERE "kulcs" = 'belepes.oldalcim' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Pagină de finalizare', "frissitve" = now() WHERE "kulcs" = 'feliratok.csoport_kesz' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'versiune neacceptată', "frissitve" = now() WHERE "kulcs" = 'feliratok.ellenorzes_bad_version' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'text gol — dacă vrei textul comun, omite cheia', "frissitve" = now() WHERE "kulcs" = 'feliratok.ellenorzes_empty_value' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Texte aplicate în întreaga aplicație.', "frissitve" = now() WHERE "kulcs" = 'feliratok.notice_applied' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Proiect salvat. Textele din întreaga aplicație nu s-au schimbat.', "frissitve" = now() WHERE "kulcs" = 'feliratok.notice_draft_ok' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Texte importate în proiect{ign}. Până la aplicare, întreaga aplicație nu se schimbă.', "frissitve" = now() WHERE "kulcs" = 'feliratok.notice_import_ok' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Versiunea {n} încărcată în proiect. Până la aplicare, întreaga aplicație nu se schimbă.', "frissitve" = now() WHERE "kulcs" = 'feliratok.notice_visszaallitva' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Nu există identitate vizuală aprobată — schița este o propunere, nu o regulă de producție.', "frissitve" = now() WHERE "kulcs" = 'fiok.arc_megj_egyeb' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = '{n} secțiuni lipsă: {list}', "frissitve" = now() WHERE "kulcs" = 'fiok.hianyzo_gomb' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Dintr-un singur eșantion nu putem afirma o îmbunătățire generală — decizia ta pe baza exemplelor.', "frissitve" = now() WHERE "kulcs" = 'hf.cmpCaveat' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Publicația originală', "frissitve" = now() WHERE "kulcs" = 'hf.detOrig' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Nothing to give feedback on yet. Run a trial on the Monitoring setup page, or mark hits in the Overview.', "frissitve" = now() WHERE "kulcs" = 'hf.tuEmpty' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'Identitate vizuală', "frissitve" = now() WHERE "kulcs" = 'mezo.arculat' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Obiectiv de comunicare', "frissitve" = now() WHERE "kulcs" = 'mezo.cel' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Limbile conținutului', "frissitve" = now() WHERE "kulcs" = 'mezo.nyelvek' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Salvarea a eșuat — datele tale sunt intacte', "frissitve" = now() WHERE "kulcs" = 'onboarding.mentes_hiba' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Introdu un site web sau descrie în câteva propoziții. Te ajutăm să pregătim bazele.', "frissitve" = now() WHERE "kulcs" = 'onboarding1.alcim' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Enter a website or describe it in a few sentences. We''ll help you build the basics.', "frissitve" = now() WHERE "kulcs" = 'onboarding1.alcim' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = '✓ Manual de identitate vizuală', "frissitve" = now() WHERE "kulcs" = 'onboarding1.arculat_kezikonyv_be' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'cu ce te ocupi.', "frissitve" = now() WHERE "kulcs" = 'onboarding1.cim_kiemelt' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Introduc un site web', "frissitve" = now() WHERE "kulcs" = 'onboarding1.forras_weboldal' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Propunerea nu este un fapt verificat — corecteaz-o liber.', "frissitve" = now() WHERE "kulcs" = 'onboarding1.nem_teny' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'We''ve prepared a few suggestions based on what you''ve shared so far. All are editable — or you can postpone them.', "frissitve" = now() WHERE "kulcs" = 'onboarding2.alcim' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'Ce vrei să obții prin comunicare? Pot fi mai multe obiective.', "frissitve" = now() WHERE "kulcs" = 'onboarding2.cel_pl' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'The system’s tools will use this profile. After approval it moves to your account, where you can edit it anytime.', "frissitve" = now() WHERE "kulcs" = 'onboarding3.alcim' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'Font pentru titluri', "frissitve" = now() WHERE "kulcs" = 'onboarding3.arc_betu_cim' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Font pentru text', "frissitve" = now() WHERE "kulcs" = 'onboarding3.arc_betu_szoveg' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Afișare neutră, temporară — nu este o regulă de brand salvată.', "frissitve" = now() WHERE "kulcs" = 'onboarding3.arc_ideiglenes' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Marcarea sursei nu înseamnă că afirmația este verificată sau actuală. Propunerea AI nu este un fapt. Detaliile provenienței se deschid din insignă.', "frissitve" = now() WHERE "kulcs" = 'onboarding3.eredet_megj' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'e.g. Sample Workshop', "frissitve" = now() WHERE "kulcs" = 'szervezet.nev_pl' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'Aplică în toată aplicația', "frissitve" = now() WHERE "kulcs" = 'tema.apply' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Nuanțele, gradientul și inelul de focus se actualizează derivând din acestea. Culoarea în sine nu transmite stare.', "frissitve" = now() WHERE "kulcs" = 'tema.colors_note' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = '⚠ Pereche de culori greu de citit: {list} — contrast sub 4,5:1.', "frissitve" = now() WHERE "kulcs" = 'tema.contrast' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'valoare invalidă: {value} — număr între {min} și {max}, ca text', "frissitve" = now() WHERE "kulcs" = 'tema.ellenorzes_bad_percent' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'versiune neacceptată: {value} — acceptate: {values}', "frissitve" = now() WHERE "kulcs" = 'tema.ellenorzes_bad_version' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Reîncercare', "frissitve" = now() WHERE "kulcs" = 'tema.eme_retry' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = '⚠ Eroare — datele se păstrează, se poate reîncerca. (Nu e semnalată doar prin culoare.)', "frissitve" = now() WHERE "kulcs" = 'tema.err_demo' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Transparență suprafață', "frissitve" = now() WHERE "kulcs" = 'tema.glass' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Importă din fișier', "frissitve" = now() WHERE "kulcs" = 'tema.import_fajl' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Înălțime rând', "frissitve" = now() WHERE "kulcs" = 'tema.lh' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Restaurarea a eșuat — tema aplicată și ciorna rămân neschimbate.', "frissitve" = now() WHERE "kulcs" = 'tema.notice_visszaallitas_err' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'editarea afectează mai întâi doar această zonă', "frissitve" = now() WHERE "kulcs" = 'tema.preview_note' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Orice rotunjire poate fi 0; „Capsulă” = rotunjire completă. Zona de clic este token separat.', "frissitve" = now() WHERE "kulcs" = 'tema.shapes_note' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'aspectul propriu al organizației — doar valorile diferite față de baza comună', "frissitve" = now() WHERE "kulcs" = 'tema.szint_szervezet' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Setări temă', "frissitve" = now() WHERE "kulcs" = 'tema.title' AND "nyelv" = 'ro';
UPDATE "felirat" SET "szoveg" = 'Surface transparency', "frissitve" = now() WHERE "kulcs" = 'tema.glass' AND "nyelv" = 'en';
UPDATE "felirat" SET "szoveg" = 'edits only affect this area at first', "frissitve" = now() WHERE "kulcs" = 'tema.preview_note' AND "nyelv" = 'en';
