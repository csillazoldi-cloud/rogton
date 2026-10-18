-- Kézzel írt migráció, E-50: a Fiókok lap (rendszergazda).
--
-- Három új oszlop a fiókon, két szervezetközi olvasó függvény, és a lap feliratai.
-- A rajz: design/e50/ (Fiokok.dc.html). A döntések 2026-09-10-én, Vilmossal:
--   · a próbafiók-jelölés NEM e-mail-mintából megy, hanem a fiókra írt „eredet" értékből;
--   · a jogosultság marad kétállapotú (rendszergazda igen/nem), a négyértékű szerep-változat vázlat marad.

-- ---------------------------------------------------------------------------
-- 1. Felfüggesztés. NULL = aktív; időbélyeg = ekkor függesztették fel.
--    A gépezet a belépési úton van (apps/web/hitelesites/index.ts): a belep() elutasít,
--    az aktualisFiok() elutasít, és a felfüggesztés törli a fiók munkamenet-sorait.
-- ---------------------------------------------------------------------------
ALTER TABLE "fiok" ADD COLUMN IF NOT EXISTS "felfuggesztve" timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Utolsó belépés. MIÉRT KELL KÜLÖN OSZLOP: a `munkamenet` tábla nem belépési napló,
--    hanem az ÉLŐ munkamenetek listája — kilépéskor és lejáratkor törlődik a sor.
--    Mérve 2026-09-10-én: a 67 fiókból 26-nak egyetlen munkamenet-sora sincs, náluk
--    a „mikor lépett be utoljára" örökre üres maradt volna.
-- ---------------------------------------------------------------------------
ALTER TABLE "fiok" ADD COLUMN IF NOT EXISTS "utolso_belepes" timestamptz;

-- Egyszeri feltöltés abból, ami még megvan: az élő munkamenetek legkorábbi indulása.
-- Ez ALSÓ becslés (a régebbi belépések sorai már nincsenek meg), de igazabb az üresnél.
UPDATE "fiok" f
SET "utolso_belepes" = m.utolso
FROM (SELECT "fiok_id", max("letrehozva") AS utolso FROM "munkamenet" GROUP BY "fiok_id") m
WHERE m."fiok_id" = f."id" AND f."utolso_belepes" IS NULL;

-- ---------------------------------------------------------------------------
-- 3. Eredet: ember hozta létre, vagy gépi teszt. A LÉTREHOZÁS írja (hitelesites/index.ts,
--    fiokEredete()), a szűrő ezt olvassa. Eddig csak találgatni lehetett az e-mail címből.
--    A létrehozáskori szabály nem tippel: a .example/.local/.test/.invalid végződést szabvány
--    tartja fenn (RFC 2606, 6761) — ilyen tartomány nem kézbesíthető, valódi ember nem nyithat
--    rajta fiókot. Minden más cím embernek számít.
-- ---------------------------------------------------------------------------
ALTER TABLE "fiok" ADD COLUMN IF NOT EXISTS "eredet" text NOT NULL DEFAULT 'ember';
ALTER TABLE "fiok" DROP CONSTRAINT IF EXISTS "fiok_eredet_ervenyes";
ALTER TABLE "fiok" ADD CONSTRAINT "fiok_eredet_ervenyes" CHECK ("eredet" IN ('ember', 'gepi_teszt'));

-- EGYSZERI besorolás a meglévő soroknak. A mért állapot 2026-09-10-én: 67 fiók, ebből
-- három valódi ember (yahoo.com ×2, gmail.com ×1), a többi 64 hat tartományban:
-- proba.hu 26 · proba.example 22 · aitmetica.local 12 · teszt-a.example 2 · teszt-b.example 1 · pelda.hu 1.
-- A .example/.local/.test/.invalid végződést szabvány tartja fenn — ilyen címe senkinek nem lehet.
-- A proba.hu és a pelda.hu valódi tartomány LEHETNE, ezért ezeket tételesen soroljuk fel,
-- nem mintával: a szabály itt ér véget, a jövőt már az oszlop viszi.
UPDATE "fiok"
SET "eredet" = 'gepi_teszt'
WHERE "email" ~ '@[^@]+\.(example|local|test|invalid)$'
   OR split_part("email", '@', 2) IN ('proba.hu', 'pelda.hu');

-- ---------------------------------------------------------------------------
-- 4. Szervezetközi olvasás. MIÉRT SECURITY DEFINER: a `tagsag`, `szervezet`, `hf_*` és
--    `ai_hivas` táblákon sorszintű védelem van — a km_app szerep CSAK a saját szervezetét
--    látja. A rendszergazda-lapnak mindet látnia kell. Ugyanaz a minta, mint a 0037-ben.
--    Mindkét függvény CSAK ÖSSZESÍTÉST ad vissza: darabszám, dátum, név, költség.
--    Egyetlen cikk, prompt, válasz, beállítás vagy jelszó-lenyomat sem megy át rajtuk.
--    A hívó oldalon a rendszergazda-jogot az API ellenőrzi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION gazda_fiokok()
RETURNS TABLE (
  id uuid, email text, nev text, nyelv text, letrehozva timestamptz,
  rendszergazda boolean, felfuggesztve timestamptz, eredet text,
  utolso_belepes timestamptz, elo_munkamenet bigint, munkaterek jsonb
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.email, f.nev, f.nyelv, f.letrehozva,
         f.rendszergazda, f.felfuggesztve, f.eredet, f.utolso_belepes,
         (SELECT count(*) FROM munkamenet m WHERE m.fiok_id = f.id AND m.lejar > now())::bigint,
         coalesce((
           SELECT jsonb_agg(jsonb_build_object('nev', sz.nev, 'szerep', t.szerep) ORDER BY sz.nev)
           FROM tagsag t JOIN szervezet sz ON sz.id = t.szervezet_id
           WHERE t.fiok_id = f.id
         ), '[]'::jsonb)
  FROM fiok f
  ORDER BY f.letrehozva DESC;
$$;
REVOKE ALL ON FUNCTION gazda_fiokok() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION gazda_fiokok() TO km_app;

CREATE OR REPLACE FUNCTION gazda_munkaterek(p_honap text)
RETURNS TABLE (
  id uuid, nev text, letrehozva timestamptz, profil_jovahagyva timestamptz,
  tulajdonos_email text, tulajdonos_nev text, hirfigyelo boolean,
  forrasok bigint, utolso_futas timestamptz, hivasok bigint, usd numeric, keret_usd numeric
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sz.id, sz.nev, sz.letrehozva, p.jovahagyva,
         tul.email, tul.nev,
         EXISTS (SELECT 1 FROM hf_beallitas_verzio b WHERE b.szervezet_id = sz.id AND b.allapot = 'aktiv'),
         (SELECT count(*) FROM hf_forras fo WHERE fo.szervezet_id = sz.id)::bigint,
         (SELECT max(fu.kezdet) FROM hf_futas fu WHERE fu.szervezet_id = sz.id AND fu.proba = false),
         (SELECT count(*) FROM ai_hivas h WHERE h.szervezet_id = sz.id AND to_char(h.letrehozva, 'YYYY-MM') = p_honap)::bigint,
         coalesce((SELECT sum(h.becsult_usd) FROM ai_hivas h WHERE h.szervezet_id = sz.id AND to_char(h.letrehozva, 'YYYY-MM') = p_honap), 0)::numeric,
         sz.ai_keret_usd
  FROM szervezet sz
  LEFT JOIN szervezet_profil p ON p.szervezet_id = sz.id
  LEFT JOIN LATERAL (
    SELECT f.email, f.nev FROM tagsag t JOIN fiok f ON f.id = t.fiok_id
    WHERE t.szervezet_id = sz.id AND t.szerep = 'tulajdonos'
    ORDER BY t.letrehozva LIMIT 1
  ) tul ON true
  ORDER BY sz.letrehozva DESC;
$$;
REVOKE ALL ON FUNCTION gazda_munkaterek(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION gazda_munkaterek(text) TO km_app;

-- ---------------------------------------------------------------------------
-- 5. Feliratok. A magyar a mérce; a román és angol a Design szótárából (admin-i18n.js).
--    A „próbafiók" magyarázatát átírtam: az „eredet" mező miatt a jelölés már nem becslés.
-- ---------------------------------------------------------------------------
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('gazdanav.rendszergazda', 'hu', 'rendszergazda'),
  ('gazdanav.rendszergazda', 'ro', 'administrator'),
  ('gazdanav.rendszergazda', 'en', 'administrator'),
  ('gazdanav.tema', 'hu', 'Theme'),
  ('gazdanav.tema', 'ro', 'Theme'),
  ('gazdanav.tema', 'en', 'Theme'),
  ('gazdanav.feliratok', 'hu', 'Feliratok'),
  ('gazdanav.feliratok', 'ro', 'Texte'),
  ('gazdanav.feliratok', 'en', 'Copy'),
  ('gazdanav.koltseg', 'hu', 'Költség'),
  ('gazdanav.koltseg', 'ro', 'Costuri'),
  ('gazdanav.koltseg', 'en', 'Cost'),
  ('gazdanav.fiokok', 'hu', 'Fiókok'),
  ('gazdanav.fiokok', 'ro', 'Conturi'),
  ('gazdanav.fiokok', 'en', 'Accounts'),
  ('fiokok.uiLangLabel', 'hu', 'A felület nyelve'),
  ('fiokok.uiLangLabel', 'ro', 'Limba interfeței'),
  ('fiokok.uiLangLabel', 'en', 'Interface language'),
  ('fiokok.title', 'hu', 'Fiókok'),
  ('fiokok.title', 'ro', 'Conturi'),
  ('fiokok.title', 'en', 'Accounts'),
  ('fiokok.sub', 'hu', 'Ki regisztrált, mit tartalmaz a fiókja, és mi mozdult utoljára. Csak rendszergazda látja.'),
  ('fiokok.sub', 'ro', 'Cine s-a înregistrat, ce conține contul și ce s-a mișcat ultima dată. Vizibil doar pentru administrator.'),
  ('fiokok.sub', 'en', 'Who signed up, what their account holds, and what moved last. Visible to administrators only.'),
  ('fiokok.tabAccounts', 'hu', 'Fiókok'),
  ('fiokok.tabAccounts', 'ro', 'Conturi'),
  ('fiokok.tabAccounts', 'en', 'Accounts'),
  ('fiokok.tabSpaces', 'hu', 'Munkaterek'),
  ('fiokok.tabSpaces', 'ro', 'Spații de lucru'),
  ('fiokok.tabSpaces', 'en', 'Workspaces'),
  ('fiokok.searchPh', 'hu', 'Keresés e-mailre vagy névre…'),
  ('fiokok.searchPh', 'ro', 'Caută după e-mail sau nume…'),
  ('fiokok.searchPh', 'en', 'Search by e-mail or name…'),
  ('fiokok.searchLabel', 'hu', 'Keresés'),
  ('fiokok.searchLabel', 'ro', 'Căutare'),
  ('fiokok.searchLabel', 'en', 'Search'),
  ('fiokok.sortLabel', 'hu', 'Rendezés'),
  ('fiokok.sortLabel', 'ro', 'Sortare'),
  ('fiokok.sortLabel', 'en', 'Sort'),
  ('fiokok.sortCreated', 'hu', 'Létrehozás szerint'),
  ('fiokok.sortCreated', 'ro', 'După creare'),
  ('fiokok.sortCreated', 'en', 'By creation'),
  ('fiokok.sortSeen', 'hu', 'Utolsó belépés szerint'),
  ('fiokok.sortSeen', 'ro', 'După ultima autentificare'),
  ('fiokok.sortSeen', 'en', 'By last sign-in'),
  ('fiokok.origAll', 'hu', 'Mind'),
  ('fiokok.origAll', 'ro', 'Toate'),
  ('fiokok.origAll', 'en', 'All'),
  ('fiokok.origReal', 'hu', 'Valódi'),
  ('fiokok.origReal', 'ro', 'Reale'),
  ('fiokok.origReal', 'en', 'Real'),
  ('fiokok.origTest', 'hu', 'Próbafiók'),
  ('fiokok.origTest', 'ro', 'Cont de test'),
  ('fiokok.origTest', 'en', 'Test account'),
  ('fiokok.countTpl', 'hu', '{shown} / {total} fiók · {test} próbafiók'),
  ('fiokok.countTpl', 'ro', '{shown} / {total} conturi · {test} de test'),
  ('fiokok.countTpl', 'en', '{shown} / {total} accounts · {test} test'),
  ('fiokok.countSpaces', 'hu', '{n} munkatér'),
  ('fiokok.countSpaces', 'ro', '{n} spații de lucru'),
  ('fiokok.countSpaces', 'en', '{n} workspaces'),
  ('fiokok.testNoteTitle', 'hu', 'Mi alapján válik el a próbafiók?'),
  ('fiokok.testNoteTitle', 'ro', 'Pe ce bază se separă contul de test?'),
  ('fiokok.testNoteTitle', 'en', 'How is a test account told apart?'),
  ('fiokok.testNoteBody', 'hu', 'A fiók a létrehozásakor rögzíti, hogy ember vagy gépi teszt hozta létre; a szűrő ezt olvassa, nem az e-mail címet. Gépi tesztnek az számít, aminek a címe szabvány által fenntartott végződésű (.example, .local, .test, .invalid) — ilyen tartomány nem kézbesíthető, valódi ember nem nyithat rajta fiókot. A 2026-09-10 előtt létrejött fiókok egyszeri besorolást kaptak a tartományuk alapján.'),
  ('fiokok.testNoteBody', 'ro', 'Contul reține la creare dacă a fost creat de un om sau de un test automat; filtrul citește asta, nu adresa de e-mail. Test automat înseamnă o adresă cu terminație rezervată prin standard (.example, .local, .test, .invalid) — un astfel de domeniu nu poate primi e-mail, deci un om real nu poate deschide cont pe el. Conturile create înainte de 10.09.2026 au primit o clasificare unică, pe baza domeniului.'),
  ('fiokok.testNoteBody', 'en', 'The account records at creation whether a person or an automated test made it; the filter reads that, not the e-mail address. Automated test means an address in a standard-reserved suffix (.example, .local, .test, .invalid) — such a domain cannot receive mail, so no real person can open an account on it. Accounts created before 2026-09-10 were classified once, by their domain.'),
  ('fiokok.testRowTag', 'hu', 'próba'),
  ('fiokok.testRowTag', 'ro', 'test'),
  ('fiokok.testRowTag', 'en', 'test'),
  ('fiokok.colWho', 'hu', 'Fiók'),
  ('fiokok.colWho', 'ro', 'Cont'),
  ('fiokok.colWho', 'en', 'Account'),
  ('fiokok.colCreated', 'hu', 'Létrejött'),
  ('fiokok.colCreated', 'ro', 'Creat'),
  ('fiokok.colCreated', 'en', 'Created'),
  ('fiokok.colSeen', 'hu', 'Utolsó belépés'),
  ('fiokok.colSeen', 'ro', 'Ultima autentificare'),
  ('fiokok.colSeen', 'en', 'Last sign-in'),
  ('fiokok.colSessions', 'hu', 'Élő belépés'),
  ('fiokok.colSessions', 'ro', 'Sesiuni active'),
  ('fiokok.colSessions', 'en', 'Live sessions'),
  ('fiokok.colLang', 'hu', 'Nyelv'),
  ('fiokok.colLang', 'ro', 'Limbă'),
  ('fiokok.colLang', 'en', 'Language'),
  ('fiokok.colSpaces', 'hu', 'Munkaterek'),
  ('fiokok.colSpaces', 'ro', 'Spații'),
  ('fiokok.colSpaces', 'en', 'Workspaces'),
  ('fiokok.colState', 'hu', 'Állapot'),
  ('fiokok.colState', 'ro', 'Stare'),
  ('fiokok.colState', 'en', 'State'),
  ('fiokok.colSpace', 'hu', 'Munkatér'),
  ('fiokok.colSpace', 'ro', 'Spațiu de lucru'),
  ('fiokok.colSpace', 'en', 'Workspace'),
  ('fiokok.colOwner', 'hu', 'Tulajdonos'),
  ('fiokok.colOwner', 'ro', 'Proprietar'),
  ('fiokok.colOwner', 'en', 'Owner'),
  ('fiokok.colProfile', 'hu', 'Profil'),
  ('fiokok.colProfile', 'ro', 'Profil'),
  ('fiokok.colProfile', 'en', 'Profile'),
  ('fiokok.colMonitor', 'hu', 'Hírfigyelő'),
  ('fiokok.colMonitor', 'ro', 'Monitorizare'),
  ('fiokok.colMonitor', 'en', 'Monitoring'),
  ('fiokok.colSources', 'hu', 'Források'),
  ('fiokok.colSources', 'ro', 'Surse'),
  ('fiokok.colSources', 'en', 'Sources'),
  ('fiokok.colCalls', 'hu', 'AI-hívás (hó)'),
  ('fiokok.colCalls', 'ro', 'Apeluri AI (lună)'),
  ('fiokok.colCalls', 'en', 'AI calls (month)'),
  ('fiokok.colCost', 'hu', 'Költség (hó)'),
  ('fiokok.colCost', 'ro', 'Cost (lună)'),
  ('fiokok.colCost', 'en', 'Cost (month)'),
  ('fiokok.colQuota', 'hu', 'Havi keret'),
  ('fiokok.colQuota', 'ro', 'Limită lunară'),
  ('fiokok.colQuota', 'en', 'Monthly quota'),
  ('fiokok.stActive', 'hu', 'aktív'),
  ('fiokok.stActive', 'ro', 'activ'),
  ('fiokok.stActive', 'en', 'active'),
  ('fiokok.stSuspended', 'hu', 'felfüggesztve'),
  ('fiokok.stSuspended', 'ro', 'suspendat'),
  ('fiokok.stSuspended', 'en', 'suspended'),
  ('fiokok.stAdmin', 'hu', 'rendszergazda'),
  ('fiokok.stAdmin', 'ro', 'administrator'),
  ('fiokok.stAdmin', 'en', 'administrator'),
  ('fiokok.profileOk', 'hu', 'jóváhagyott'),
  ('fiokok.profileOk', 'ro', 'aprobat'),
  ('fiokok.profileOk', 'en', 'approved'),
  ('fiokok.profileNone', 'hu', 'nincs jóváhagyva'),
  ('fiokok.profileNone', 'ro', 'neaprobat'),
  ('fiokok.profileNone', 'en', 'not approved'),
  ('fiokok.monitorOn', 'hu', 'aktív beállítás'),
  ('fiokok.monitorOn', 'ro', 'configurație activă'),
  ('fiokok.monitorOn', 'en', 'active configuration'),
  ('fiokok.monitorOff', 'hu', 'nincs aktív beállítás'),
  ('fiokok.monitorOff', 'ro', 'fără configurație activă'),
  ('fiokok.monitorOff', 'en', 'no active configuration'),
  ('fiokok.quotaDefault', 'hu', 'alapérték'),
  ('fiokok.quotaDefault', 'ro', 'valoare implicită'),
  ('fiokok.quotaDefault', 'en', 'default'),
  ('fiokok.never', 'hu', 'még nem lépett be'),
  ('fiokok.never', 'ro', 'nu s-a autentificat încă'),
  ('fiokok.never', 'en', 'never signed in'),
  ('fiokok.noLang', 'hu', 'nincs megadva'),
  ('fiokok.noLang', 'ro', 'nespecificat'),
  ('fiokok.noLang', 'en', 'not set'),
  ('fiokok.roleOwner', 'hu', 'tulajdonos'),
  ('fiokok.roleOwner', 'ro', 'proprietar'),
  ('fiokok.roleOwner', 'en', 'owner'),
  ('fiokok.roleEditor', 'hu', 'szerkesztő'),
  ('fiokok.roleEditor', 'ro', 'editor'),
  ('fiokok.roleEditor', 'en', 'editor'),
  ('fiokok.roleViewer', 'hu', 'néző'),
  ('fiokok.roleViewer', 'ro', 'vizualizator'),
  ('fiokok.roleViewer', 'en', 'viewer'),
  ('fiokok.empty', 'hu', 'Nincs a szűrőnek megfelelő találat.'),
  ('fiokok.empty', 'ro', 'Niciun rezultat pentru acest filtru.'),
  ('fiokok.empty', 'en', 'No result matches this filter.'),
  ('fiokok.open', 'hu', 'Megnyitás'),
  ('fiokok.open', 'ro', 'Deschide'),
  ('fiokok.open', 'en', 'Open'),
  ('fiokok.close', 'hu', 'Bezárás'),
  ('fiokok.close', 'ro', 'Închide'),
  ('fiokok.close', 'en', 'Close'),
  ('fiokok.detAccount', 'hu', 'Fiók'),
  ('fiokok.detAccount', 'ro', 'Cont'),
  ('fiokok.detAccount', 'en', 'Account'),
  ('fiokok.detSpace', 'hu', 'Munkatér'),
  ('fiokok.detSpace', 'ro', 'Spațiu de lucru'),
  ('fiokok.detSpace', 'en', 'Workspace'),
  ('fiokok.detContains', 'hu', 'Mit tartalmaz'),
  ('fiokok.detContains', 'ro', 'Ce conține'),
  ('fiokok.detContains', 'en', 'What it holds'),
  ('fiokok.detLastMove', 'hu', 'Utoljára mozdult'),
  ('fiokok.detLastMove', 'ro', 'Ultima mișcare'),
  ('fiokok.detLastMove', 'en', 'Last movement'),
  ('fiokok.detActions', 'hu', 'Műveletek'),
  ('fiokok.detActions', 'ro', 'Acțiuni'),
  ('fiokok.detActions', 'en', 'Actions'),
  ('fiokok.detNoSpaces', 'hu', 'Ez a fiók egyetlen munkatérnek sem tagja.'),
  ('fiokok.detNoSpaces', 'ro', 'Acest cont nu este membru în niciun spațiu de lucru.'),
  ('fiokok.detNoSpaces', 'en', 'This account is not a member of any workspace.'),
  ('fiokok.lastMoveTpl', 'hu', '{what} · {when}'),
  ('fiokok.lastMoveTpl', 'ro', '{what} · {when}'),
  ('fiokok.lastMoveTpl', 'en', '{what} · {when}'),
  ('fiokok.lmLogin', 'hu', 'belépés'),
  ('fiokok.lmLogin', 'ro', 'autentificare'),
  ('fiokok.lmLogin', 'en', 'sign-in'),
  ('fiokok.lmRun', 'hu', 'hírfigyelő-futás'),
  ('fiokok.lmRun', 'ro', 'rulare monitorizare'),
  ('fiokok.lmRun', 'en', 'monitoring run'),
  ('fiokok.lmProfile', 'hu', 'profil jóváhagyva'),
  ('fiokok.lmProfile', 'ro', 'profil aprobat'),
  ('fiokok.lmProfile', 'en', 'profile approved'),
  ('fiokok.lmCreated', 'hu', 'fiók létrehozva'),
  ('fiokok.lmCreated', 'ro', 'cont creat'),
  ('fiokok.lmCreated', 'en', 'account created'),
  ('fiokok.lmSpaceCreated', 'hu', 'munkatér létrehozva'),
  ('fiokok.lmSpaceCreated', 'ro', 'spațiu creat'),
  ('fiokok.lmSpaceCreated', 'en', 'workspace created'),
  ('fiokok.aSuspend', 'hu', 'Fiók felfüggesztése'),
  ('fiokok.aSuspend', 'ro', 'Suspendă contul'),
  ('fiokok.aSuspend', 'en', 'Suspend account'),
  ('fiokok.aUnsuspend', 'hu', 'Felfüggesztés visszavonása'),
  ('fiokok.aUnsuspend', 'ro', 'Anulează suspendarea'),
  ('fiokok.aUnsuspend', 'en', 'Undo suspension'),
  ('fiokok.aMakeAdmin', 'hu', 'Rendszergazda-jelölés adása'),
  ('fiokok.aMakeAdmin', 'ro', 'Acordă rol de administrator'),
  ('fiokok.aMakeAdmin', 'en', 'Grant administrator flag'),
  ('fiokok.aDropAdmin', 'hu', 'Rendszergazda-jelölés elvétele'),
  ('fiokok.aDropAdmin', 'ro', 'Retrage rolul de administrator'),
  ('fiokok.aDropAdmin', 'en', 'Remove administrator flag'),
  ('fiokok.aQuota', 'hu', 'Havi AI-keret átállítása'),
  ('fiokok.aQuota', 'ro', 'Modifică limita AI lunară'),
  ('fiokok.aQuota', 'en', 'Change monthly AI quota'),
  ('fiokok.quotaLabel', 'hu', 'Havi AI-keret'),
  ('fiokok.quotaLabel', 'ro', 'Limită AI lunară'),
  ('fiokok.quotaLabel', 'en', 'Monthly AI quota'),
  ('fiokok.quotaHint', 'hu', 'Üresen hagyva az alapérték érvényes. Ugyanez az érték a Költség lapon is látszik.'),
  ('fiokok.quotaHint', 'ro', 'Lăsat gol, se aplică valoarea implicită. Aceeași valoare apare și pe pagina Costuri.'),
  ('fiokok.quotaHint', 'en', 'Left empty, the default applies. The same value appears on the Cost page.'),
  ('fiokok.quotaSave', 'hu', 'Keret mentése'),
  ('fiokok.quotaSave', 'ro', 'Salvează limita'),
  ('fiokok.quotaSave', 'en', 'Save quota'),
  ('fiokok.quotaSaved', 'hu', 'A keret átállítva: {v}'),
  ('fiokok.quotaSaved', 'ro', 'Limită modificată: {v}'),
  ('fiokok.quotaSaved', 'en', 'Quota changed: {v}'),
  ('fiokok.cfTitle', 'hu', 'Megerősítés'),
  ('fiokok.cfTitle', 'ro', 'Confirmare'),
  ('fiokok.cfTitle', 'en', 'Confirmation'),
  ('fiokok.cfSuspend', 'hu', 'Felfüggeszted ezt a fiókot?'),
  ('fiokok.cfSuspend', 'ro', 'Suspenzi acest cont?'),
  ('fiokok.cfSuspend', 'en', 'Suspend this account?'),
  ('fiokok.cfSuspendWhat', 'hu', 'Ezután nem tud belépni, és a most élő belépései megszűnnek. Az adatai, munkaterei és találatai megmaradnak. Bármikor visszavonható.'),
  ('fiokok.cfSuspendWhat', 'ro', 'Nu se va mai putea autentifica, iar sesiunile active se închid. Datele, spațiile și rezultatele se păstrează. Se poate anula oricând.'),
  ('fiokok.cfSuspendWhat', 'en', 'They will not be able to sign in, and their live sessions end. Their data, workspaces and hits are kept. Reversible at any time.'),
  ('fiokok.cfUnsuspend', 'hu', 'Visszavonod a felfüggesztést?'),
  ('fiokok.cfUnsuspend', 'ro', 'Anulezi suspendarea?'),
  ('fiokok.cfUnsuspend', 'en', 'Undo the suspension?'),
  ('fiokok.cfUnsuspendWhat', 'hu', 'Ezután újra be tud lépni. Új belépést kell kezdeményeznie; a korábbi belépései nem élednek fel.'),
  ('fiokok.cfUnsuspendWhat', 'ro', 'Se va putea autentifica din nou. Trebuie să inițieze o autentificare nouă; sesiunile anterioare nu revin.'),
  ('fiokok.cfUnsuspendWhat', 'en', 'They will be able to sign in again. They must start a new sign-in; earlier sessions do not come back.'),
  ('fiokok.cfMakeAdmin', 'hu', 'Rendszergazda-jelölést adsz ennek a fióknak?'),
  ('fiokok.cfMakeAdmin', 'ro', 'Acorzi rol de administrator acestui cont?'),
  ('fiokok.cfMakeAdmin', 'en', 'Grant the administrator flag to this account?'),
  ('fiokok.cfMakeAdminWhat', 'hu', 'Ezután látja ezt a lapot, a Theme, a Feliratok és a Költség lapot, és más fiókokon is végezhet műveletet. A saját munkatereihez való hozzáférése nem változik.'),
  ('fiokok.cfMakeAdminWhat', 'ro', 'Va vedea această pagină, precum și Theme, Texte și Costuri, și va putea acționa asupra altor conturi. Accesul la propriile spații nu se schimbă.'),
  ('fiokok.cfMakeAdminWhat', 'en', 'They will see this page, plus Theme, Copy and Cost, and will be able to act on other accounts. Access to their own workspaces does not change.'),
  ('fiokok.cfDropAdmin', 'hu', 'Elveszed a rendszergazda-jelölést?'),
  ('fiokok.cfDropAdmin', 'ro', 'Retragi rolul de administrator?'),
  ('fiokok.cfDropAdmin', 'en', 'Remove the administrator flag?'),
  ('fiokok.cfDropAdminWhat', 'hu', 'Ezután nem látja a rendszergazda-lapokat. A saját munkatereihez való hozzáférése nem változik.'),
  ('fiokok.cfDropAdminWhat', 'ro', 'Nu va mai vedea paginile de administrare. Accesul la propriile spații nu se schimbă.'),
  ('fiokok.cfDropAdminWhat', 'en', 'They will no longer see the administration pages. Access to their own workspaces does not change.'),
  ('fiokok.cfSelfWarn', 'hu', 'Ez a saját fiókod. Ha elveszed, azonnal elveszíted a hozzáférést ehhez a laphoz, és csak adatbázisból lehet visszaadni.'),
  ('fiokok.cfSelfWarn', 'ro', 'Acesta este contul tău. Dacă îl retragi, pierzi imediat accesul la această pagină și poate fi redat doar din baza de date.'),
  ('fiokok.cfSelfWarn', 'en', 'This is your own account. If you remove it, you lose access to this page immediately, and it can only be restored from the database.'),
  ('fiokok.cfCancel', 'hu', 'Mégse'),
  ('fiokok.cfCancel', 'ro', 'Renunță'),
  ('fiokok.cfCancel', 'en', 'Cancel'),
  ('fiokok.cfConfirm', 'hu', 'Végrehajtom'),
  ('fiokok.cfConfirm', 'ro', 'Execut'),
  ('fiokok.cfConfirm', 'en', 'Execute'),
  ('fiokok.doneSuspend', 'hu', 'A fiók felfüggesztve.'),
  ('fiokok.doneSuspend', 'ro', 'Contul a fost suspendat.'),
  ('fiokok.doneSuspend', 'en', 'The account is suspended.'),
  ('fiokok.doneUnsuspend', 'hu', 'A felfüggesztés visszavonva.'),
  ('fiokok.doneUnsuspend', 'ro', 'Suspendarea a fost anulată.'),
  ('fiokok.doneUnsuspend', 'en', 'The suspension is undone.'),
  ('fiokok.doneAdmin', 'hu', 'Rendszergazda-jelölés megadva.'),
  ('fiokok.doneAdmin', 'ro', 'Rol de administrator acordat.'),
  ('fiokok.doneAdmin', 'en', 'Administrator flag granted.'),
  ('fiokok.doneDropAdmin', 'hu', 'Rendszergazda-jelölés elvéve.'),
  ('fiokok.doneDropAdmin', 'ro', 'Rol de administrator retras.'),
  ('fiokok.doneDropAdmin', 'en', 'Administrator flag removed.'),
  ('fiokok.notMade', 'hu', 'Amit ez a lap szándékosan nem tud'),
  ('fiokok.notMade', 'ro', 'Ce nu face intenționat această pagină'),
  ('fiokok.notMade', 'en', 'What this page deliberately cannot do'),
  ('fiokok.notMadeBody', 'hu', 'Fiók végleges törlése · jelszó átállítása más nevében · belépés más fiókjába · e-mail küldése · számlázás. Ezekhez nincs gépezet, és részben jogi kérdés.'),
  ('fiokok.notMadeBody', 'ro', 'Ștergerea definitivă a contului · resetarea parolei în numele altcuiva · autentificarea în contul altcuiva · trimiterea de e-mailuri · facturare. Nu există mecanism pentru ele și sunt parțial chestiuni juridice.'),
  ('fiokok.notMadeBody', 'en', 'Permanent account deletion · resetting a password on someone else’s behalf · signing in as another account · sending e-mail · billing. There is no machinery for these, and they are partly legal questions.'),
  ('fiokok.oldalcim', 'hu', 'Fiókok — Kommunikációs munkatér'),
  ('fiokok.oldalcim', 'ro', 'Conturi — Spațiu de lucru de comunicare'),
  ('fiokok.oldalcim', 'en', 'Accounts — Communication workspace'),
  ('hiba.FIOK_FELFUGGESZTVE', 'hu', 'Ez a fiók fel van függesztve. Ha tévedésnek gondolod, szólj a rendszergazdának.'),
  ('hiba.FIOK_FELFUGGESZTVE', 'ro', 'Acest cont este suspendat. Dacă crezi că este o greșeală, anunță administratorul.'),
  ('hiba.FIOK_FELFUGGESZTVE', 'en', 'This account is suspended. If you think this is a mistake, contact the administrator.'),
  ('fiokok.betoltes_hiba', 'hu', 'A lista nem töltődött be.'),
  ('fiokok.betoltes_hiba', 'ro', 'Lista nu s-a încărcat.'),
  ('fiokok.betoltes_hiba', 'en', 'The list did not load.'),
  ('fiokok.ujra', 'hu', 'Újra'),
  ('fiokok.ujra', 'ro', 'Din nou'),
  ('fiokok.ujra', 'en', 'Retry'),
  ('fiokok.folyik', 'hu', 'Folyamatban…'),
  ('fiokok.folyik', 'ro', 'În curs…'),
  ('fiokok.folyik', 'en', 'Working…'),
  ('fiokok.detOrigin', 'hu', 'Eredet'),
  ('fiokok.detOrigin', 'ro', 'Origine'),
  ('fiokok.detOrigin', 'en', 'Origin'),
  ('fiokok.sajatFelfuggesztes', 'hu', 'A saját fiókodat nem függesztheted fel: azonnal kizárnád magad, és a visszavonáshoz épp belépni kellene — utána csak adatbázisból lehetne visszaengedni.'),
  ('fiokok.sajatFelfuggesztes', 'ro', 'Nu îți poți suspenda propriul cont: te-ai bloca imediat afară, iar pentru retragere ar trebui tocmai să te autentifici — după aceea doar din baza de date ai putea fi lăsat înapoi.'),
  ('fiokok.sajatFelfuggesztes', 'en', 'You cannot suspend your own account: you would lock yourself out at once, and undoing it would require signing in — after that only the database could let you back in.'),
  ('fiokok.utolsoGazda', 'hu', 'Te vagy az egyetlen rendszergazda. Ha a jelölés lekerülne, ezeket a lapokat senki nem érné el, és csak adatbázisból lehetne visszaadni — ezért a rendszer nem engedi. Előbb adj jelölést valaki másnak.'),
  ('fiokok.utolsoGazda', 'ro', 'Ești singurul administrator. Dacă marcajul ar fi retras, nimeni nu ar mai ajunge la aceste pagini și ar putea fi redat doar din baza de date — de aceea sistemul nu permite. Dă mai întâi marcajul altcuiva.'),
  ('fiokok.utolsoGazda', 'en', 'You are the only administrator. If the mark were removed, nobody would reach these pages and it could only be restored from the database — so the system does not allow it. Give the mark to someone else first.'),
  ('hiba.ONKIZARAS', 'hu', 'Ez az utolsó rendszergazda-jelölés — elvéve senki nem érné el a rendszergazda-lapokat.'),
  ('hiba.ONKIZARAS', 'ro', 'Acesta este ultimul marcaj de administrator — retras, nimeni nu ar mai ajunge la paginile de administrare.'),
  ('hiba.ONKIZARAS', 'en', 'This is the last administrator mark — removed, nobody would reach the administrator pages.'),
  ('hiba.NINCS_ILYEN_FIOK', 'hu', 'Nincs ilyen fiók. Lehet, hogy időközben megszűnt — frissítsd a listát.'),
  ('hiba.NINCS_ILYEN_FIOK', 'ro', 'Nu există un astfel de cont. Poate a dispărut între timp — reîmprospătează lista.'),
  ('hiba.NINCS_ILYEN_FIOK', 'en', 'No such account. It may have disappeared in the meantime — refresh the list.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
