-- 0082_r8_kezdolap.sql — R-8: a Kezdőlap új feliratai (hu · ro · en).
-- A meglévő kezdolap.* kulcsokat nem érintjük; csak az újakat szúrjuk be.

INSERT INTO felirat (kulcs, nyelv, szoveg) VALUES
  ('kezdolap.elso_lepes', 'hu', 'első lépés'),
  ('kezdolap.elso_lepes', 'ro', 'primul pas'),
  ('kezdolap.elso_lepes', 'en', 'first step'),

  ('kezdolap.elso_cim_1', 'hu', 'Mondd el, mivel foglalkoztok —'),
  ('kezdolap.elso_cim_1', 'ro', 'Spune-ne cu ce vă ocupați —'),
  ('kezdolap.elso_cim_1', 'en', 'Tell us what you do —'),

  ('kezdolap.elso_cim_2', 'hu', 'a többit mi csináljuk.'),
  ('kezdolap.elso_cim_2', 'ro', 'restul îl facem noi.'),
  ('kezdolap.elso_cim_2', 'en', 'we do the rest.'),

  ('kezdolap.elso_szoveg', 'hu', 'Elég a weboldal címe vagy pár mondat. A többit elkészítjük helyetted: bemutatkozás, célközönség, és a hírek, amiket figyelünk.'),
  ('kezdolap.elso_szoveg', 'ro', 'Ajunge adresa site-ului sau câteva propoziții. Restul îl pregătim noi: prezentarea, publicul țintă și știrile pe care le urmărim.'),
  ('kezdolap.elso_szoveg', 'en', 'The website address or a few sentences is enough. We prepare the rest: introduction, audience, and the news we watch.'),

  ('kezdolap.elso_sugo_r8', 'hu', 'Kb. 3 perc. Bemutatkozás, célközönség, hangnem, figyelt hírek — mind elkészül, te csak átnézed.'),
  ('kezdolap.elso_sugo_r8', 'ro', 'Cca. 3 minute. Prezentare, public, ton, știri urmărite — totul se pregătește, tu doar verifici.'),
  ('kezdolap.elso_sugo_r8', 'en', 'About 3 minutes. Introduction, audience, tone, watched news — all prepared, you just review.'),

  ('kezdolap.nezo_elso', 'hu', 'A munkatér beállítását a tulajdonos végzi el.'),
  ('kezdolap.nezo_elso', 'ro', 'Setarea spațiului o face proprietarul.'),
  ('kezdolap.nezo_elso', 'en', 'The workspace owner completes the setup.'),

  ('kezdolap.folyamatban', 'hu', 'Folyamatban'),
  ('kezdolap.folyamatban', 'ro', 'În curs'),
  ('kezdolap.folyamatban', 'en', 'In progress'),

  ('kezdolap.folyamat_kezdve', 'hu', 'elindult {ido}-kor'),
  ('kezdolap.folyamat_kezdve', 'ro', 'a pornit la {ido}'),
  ('kezdolap.folyamat_kezdve', 'en', 'started at {ido}'),

  ('kezdolap.folyamat_cim', 'hu', 'Összegyűjtjük és átnézzük a mai híreket'),
  ('kezdolap.folyamat_cim', 'ro', 'Adunăm și verificăm știrile de azi'),
  ('kezdolap.folyamat_cim', 'en', 'Collecting and reviewing today''s news'),

  ('kezdolap.folyamat_szoveg', 'hu', 'Az AI most olvassa a cikkeket, és eldönti, melyik lehet fontos nektek.'),
  ('kezdolap.folyamat_szoveg', 'ro', 'AI-ul citește acum articolele și decide care poate fi importantă pentru voi.'),
  ('kezdolap.folyamat_szoveg', 'en', 'The AI is reading the articles and deciding which may matter to you.'),

  ('kezdolap.folyamat_oldalak', 'hu', 'Figyelt oldalak'),
  ('kezdolap.folyamat_oldalak', 'ro', 'Site-uri urmărite'),
  ('kezdolap.folyamat_oldalak', 'en', 'Watched sites'),

  ('kezdolap.folyamat_cikkek', 'hu', 'Új cikk az elmúlt 2 napból'),
  ('kezdolap.folyamat_cikkek', 'ro', 'Articole noi din ultimele 2 zile'),
  ('kezdolap.folyamat_cikkek', 'en', 'New articles from the last 2 days'),

  ('kezdolap.folyamat_cikkek_megj', 'hu', 'a régebbieket nem nézzük'),
  ('kezdolap.folyamat_cikkek_megj', 'ro', 'pe cele mai vechi nu le verificăm'),
  ('kezdolap.folyamat_cikkek_megj', 'en', 'older ones are skipped'),

  ('kezdolap.folyamat_atnezve', 'hu', 'Átnézve az AI-val'),
  ('kezdolap.folyamat_atnezve', 'ro', 'Verificate cu AI'),
  ('kezdolap.folyamat_atnezve', 'en', 'Reviewed with AI'),

  ('kezdolap.folyamat_megj', 'hu', 'A már átnézett hírek olvashatók a Hírek lapon — az oldalváltás nem szakítja meg a munkát.'),
  ('kezdolap.folyamat_megj', 'ro', 'Știrile deja verificate se pot citi pe pagina Știri — schimbarea paginii nu întrerupe lucrul.'),
  ('kezdolap.folyamat_megj', 'en', 'Reviewed stories can be read on the News page — switching pages doesn''t interrupt the work.'),

  ('kezdolap.osszkep_cimke', 'hu', 'Ma reggel · az AI átnézte'),
  ('kezdolap.osszkep_cimke', 'ro', 'Azi dimineață · AI-ul a verificat'),
  ('kezdolap.osszkep_cimke', 'en', 'This morning · reviewed by the AI'),

  ('kezdolap.elkeszult', 'hu', 'Elkészült'),
  ('kezdolap.elkeszult', 'ro', 'Gata'),
  ('kezdolap.elkeszult', 'en', 'Done'),

  ('kezdolap.hirek_uj_r8', 'hu', 'új hír'),
  ('kezdolap.hirek_uj_r8', 'ro', 'știri noi'),
  ('kezdolap.hirek_uj_r8', 'en', 'new stories'),

  ('kezdolap.ebbol', 'hu', 'ebből'),
  ('kezdolap.ebbol', 'ro', 'dintre care'),
  ('kezdolap.ebbol', 'en', 'of which'),

  ('kezdolap.hirek_megtekintese', 'hu', 'Hírek megtekintése'),
  ('kezdolap.hirek_megtekintese', 'ro', 'Vezi știrile'),
  ('kezdolap.hirek_megtekintese', 'en', 'View the news'),

  ('kezdolap.teendo', 'hu', 'Teendő'),
  ('kezdolap.teendo', 'ro', 'De făcut'),
  ('kezdolap.teendo', 'en', 'To do'),

  ('kezdolap.tetel_n', 'hu', '{n} tétel'),
  ('kezdolap.tetel_n', 'ro', '{n} elemente'),
  ('kezdolap.tetel_n', 'en', '{n} items'),

  ('kezdolap.teendo_napi_cim', 'hu', 'Napi hírfigyelés bekapcsolása'),
  ('kezdolap.teendo_napi_cim', 'ro', 'Pornirea urmăririi zilnice'),
  ('kezdolap.teendo_napi_cim', 'en', 'Turn on daily news watch'),

  ('kezdolap.teendo_napi_szoveg', 'hu', 'Most csak akkor gyűjtünk híreket, ha kézzel indítod.'),
  ('kezdolap.teendo_napi_szoveg', 'ro', 'Acum adunăm știri doar când pornești manual.'),
  ('kezdolap.teendo_napi_szoveg', 'en', 'Right now we only collect news when you start it by hand.'),

  ('kezdolap.teendo_napi_gomb', 'hu', 'Bekapcsolom'),
  ('kezdolap.teendo_napi_gomb', 'ro', 'Pornesc'),
  ('kezdolap.teendo_napi_gomb', 'en', 'Turn on'),

  ('kezdolap.teendo_forras_cim', 'hu', '{n} oldalt nem tudtunk feldolgozni'),
  ('kezdolap.teendo_forras_cim', 'ro', '{n} site-uri nu au putut fi procesate'),
  ('kezdolap.teendo_forras_cim', 'en', '{n} sites could not be processed'),

  ('kezdolap.teendo_forras_szoveg', 'hu', 'Nézd meg, melyik, és próbáld újra.'),
  ('kezdolap.teendo_forras_szoveg', 'ro', 'Vezi care și încearcă din nou.'),
  ('kezdolap.teendo_forras_szoveg', 'en', 'See which one and try again.'),

  ('kezdolap.teendo_forras_gomb', 'hu', 'Megnézem'),
  ('kezdolap.teendo_forras_gomb', 'ro', 'Văd'),
  ('kezdolap.teendo_forras_gomb', 'en', 'Take a look'),

  ('kezdolap.teendo_profil_cim', 'hu', 'A bemutatkozásból még hiányzik valami'),
  ('kezdolap.teendo_profil_cim', 'ro', 'Din prezentare mai lipsește ceva'),
  ('kezdolap.teendo_profil_cim', 'en', 'Something is still missing from your introduction'),

  ('kezdolap.teendo_profil_gomb', 'hu', 'Kiegészítem'),
  ('kezdolap.teendo_profil_gomb', 'ro', 'Completez'),
  ('kezdolap.teendo_profil_gomb', 'en', 'Complete it'),

  ('kezdolap.csomagod', 'hu', 'Csomagod'),
  ('kezdolap.csomagod', 'ro', 'Pachetul tău'),
  ('kezdolap.csomagod', 'en', 'Your plan'),

  ('kezdolap.csomag_hirek_forras', 'hu', 'Hírek modul · legfeljebb {n} figyelt oldal'),
  ('kezdolap.csomag_hirek_forras', 'ro', 'Modulul Știri · cel mult {n} site-uri urmărite'),
  ('kezdolap.csomag_hirek_forras', 'en', 'News module · up to {n} watched sites'),

  ('kezdolap.csomag_hirek', 'hu', 'Hírek modul'),
  ('kezdolap.csomag_hirek', 'ro', 'Modulul Știri'),
  ('kezdolap.csomag_hirek', 'en', 'News module'),

  ('kezdolap.csomag_tobbi', 'hu', 'A további modulok — Studio, Newsroom, Agency — később érhetők el.'),
  ('kezdolap.csomag_tobbi', 'ro', 'Celelalte module — Studio, Newsroom, Agency — vor fi disponibile mai târziu.'),
  ('kezdolap.csomag_tobbi', 'en', 'The other modules — Studio, Newsroom, Agency — come later.'),

  ('kezdolap.minden_rendben', 'hu', 'Minden rendben'),
  ('kezdolap.minden_rendben', 'ro', 'Totul e în regulă'),
  ('kezdolap.minden_rendben', 'en', 'All good'),

  ('kezdolap.forrasok_mukodik', 'hu', '{n} oldal működik'),
  ('kezdolap.forrasok_mukodik', 'ro', '{n} site-uri funcționează'),
  ('kezdolap.forrasok_mukodik', 'en', '{n} sites working')
ON CONFLICT (kulcs, nyelv) DO NOTHING;
