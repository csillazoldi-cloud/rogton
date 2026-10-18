-- F-5 (R-4): az eseménynapló, az értesítés két szintje, a szervezet AI-kapcsolója — és a feliratok három nyelven.
-- Az `esemeny` km_app-szabálya a saját szervezet sorait ÉS a szervezet nélküli (fiók-/rendszer-) sorokat engedi: a napló
-- szervezetre szűr, a szervezet nélkülieket csak a rendszergazda végpontja adja ki (a kapun át).

CREATE TABLE IF NOT EXISTS "esemeny" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "szervezet_id" uuid REFERENCES "szervezet"("id") ON DELETE CASCADE,
  "fajta" text NOT NULL,
  "sulyossag" text NOT NULL,
  "fiok_id" uuid REFERENCES "fiok"("id") ON DELETE SET NULL,
  "ido" timestamptz NOT NULL,
  "adat" jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS "esemeny_szervezet_ido" ON "esemeny" ("szervezet_id", "ido");
ALTER TABLE "esemeny" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "esemeny_sajat_vagy_rendszer" ON "esemeny";
CREATE POLICY "esemeny_sajat_vagy_rendszer" ON "esemeny" AS PERMISSIVE FOR ALL TO "km_app"
  USING (szervezet_id IS NULL OR szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid)
  WITH CHECK (szervezet_id IS NULL OR szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
GRANT SELECT, INSERT ON "esemeny" TO "km_app";

CREATE TABLE IF NOT EXISTS "ertesites_beallitas" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "szint" text NOT NULL,
  "szervezet_id" uuid REFERENCES "szervezet"("id") ON DELETE CASCADE,
  "adat" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "frissitve" timestamptz NOT NULL DEFAULT now()
);
-- egy sor szintenként és szervezetenként (a közösnél a szervezet NULL → a nulla-uuid helyettesíti az egyediségben)
CREATE UNIQUE INDEX IF NOT EXISTS "ertesites_beallitas_egy" ON "ertesites_beallitas" ("szint", (coalesce("szervezet_id", '00000000-0000-0000-0000-000000000000'::uuid)));
ALTER TABLE "ertesites_beallitas" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ertesites_beallitas_sajat_vagy_kozos" ON "ertesites_beallitas";
CREATE POLICY "ertesites_beallitas_sajat_vagy_kozos" ON "ertesites_beallitas" AS PERMISSIVE FOR ALL TO "km_app"
  USING (szervezet_id IS NULL OR szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid)
  WITH CHECK (szervezet_id IS NULL OR szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON "ertesites_beallitas" TO "km_app";

-- F-5 (R-4): a szervezet AI-kapcsolója
ALTER TABLE "szervezet" ADD COLUMN IF NOT EXISTS "ai_engedelyezve" boolean NOT NULL DEFAULT true;

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  -- belepes
  ('esemeny.belepes_cim', 'hu', 'Belepes'),
  ('esemeny.belepes_cim', 'ro', 'Conectare'),
  ('esemeny.belepes_cim', 'en', 'Sign in'),
  ('esemeny.belepes_szoveg', 'hu', '{nev} belepett.'),
  ('esemeny.belepes_szoveg', 'ro', '{nev} s-a conectat.'),
  ('esemeny.belepes_szoveg', 'en', '{nev} signed in.'),
  -- kilepes
  ('esemeny.kilepes_cim', 'hu', 'Kilepes'),
  ('esemeny.kilepes_cim', 'ro', 'Deconectare'),
  ('esemeny.kilepes_cim', 'en', 'Sign out'),
  ('esemeny.kilepes_szoveg', 'hu', '{nev} kilepett.'),
  ('esemeny.kilepes_szoveg', 'ro', '{nev} s-a deconectat.'),
  ('esemeny.kilepes_szoveg', 'en', '{nev} signed out.'),
  -- jelszo_valtas
  ('esemeny.jelszo_valtas_cim', 'hu', 'Jelszo valtoztatas'),
  ('esemeny.jelszo_valtas_cim', 'ro', 'Schimbare parola'),
  ('esemeny.jelszo_valtas_cim', 'en', 'Password change'),
  ('esemeny.jelszo_valtas_szoveg', 'hu', '{nev} megvaltoztatta a jelszavat.'),
  ('esemeny.jelszo_valtas_szoveg', 'ro', '{nev} si-a schimbat parola.'),
  ('esemeny.jelszo_valtas_szoveg', 'en', '{nev} changed their password.'),
  -- kileptetes_mindenhol
  ('esemeny.kileptetes_mindenhol_cim', 'hu', 'Kileptetes mindenhol'),
  ('esemeny.kileptetes_mindenhol_cim', 'ro', 'Deconectare peste tot'),
  ('esemeny.kileptetes_mindenhol_cim', 'en', 'Sign out everywhere'),
  ('esemeny.kileptetes_mindenhol_szoveg', 'hu', '{nev} minden eszkozrol kileptette magat.'),
  ('esemeny.kileptetes_mindenhol_szoveg', 'ro', '{nev} s-a deconectat de pe toate dispozitivele.'),
  ('esemeny.kileptetes_mindenhol_szoveg', 'en', '{nev} signed out from all devices.'),
  -- meghivo_kiadva
  ('esemeny.meghivo_kiadva_cim', 'hu', 'Meghivo kiadva'),
  ('esemeny.meghivo_kiadva_cim', 'ro', 'Invitatie trimisa'),
  ('esemeny.meghivo_kiadva_cim', 'en', 'Invitation sent'),
  ('esemeny.meghivo_kiadva_szoveg', 'hu', '{nev} meghivot adott ki {szerep} szerepre.'),
  ('esemeny.meghivo_kiadva_szoveg', 'ro', '{nev} a trimis o invitatie pentru rolul {szerep}.'),
  ('esemeny.meghivo_kiadva_szoveg', 'en', '{nev} sent an invitation for {szerep} role.'),
  -- meghivo_visszavonva
  ('esemeny.meghivo_visszavonva_cim', 'hu', 'Meghivo visszavonva'),
  ('esemeny.meghivo_visszavonva_cim', 'ro', 'Invitatie retrasa'),
  ('esemeny.meghivo_visszavonva_cim', 'en', 'Invitation revoked'),
  ('esemeny.meghivo_visszavonva_szoveg', 'hu', '{nev} visszavonta a meghivot.'),
  ('esemeny.meghivo_visszavonva_szoveg', 'ro', '{nev} a retras invitatia.'),
  ('esemeny.meghivo_visszavonva_szoveg', 'en', '{nev} revoked the invitation.'),
  -- meghivo_elfogadva
  ('esemeny.meghivo_elfogadva_cim', 'hu', 'Meghivo elfogadva'),
  ('esemeny.meghivo_elfogadva_cim', 'ro', 'Invitatie acceptata'),
  ('esemeny.meghivo_elfogadva_cim', 'en', 'Invitation accepted'),
  ('esemeny.meghivo_elfogadva_szoveg', 'hu', '{nev} elfogadta a meghivot.'),
  ('esemeny.meghivo_elfogadva_szoveg', 'ro', '{nev} a acceptat invitatia.'),
  ('esemeny.meghivo_elfogadva_szoveg', 'en', '{nev} accepted the invitation.'),
  -- tag_felveve
  ('esemeny.tag_felveve_cim', 'hu', 'Uj tag'),
  ('esemeny.tag_felveve_cim', 'ro', 'Membru nou'),
  ('esemeny.tag_felveve_cim', 'en', 'New member'),
  ('esemeny.tag_felveve_szoveg', 'hu', '{nev} csatlakozott a munkaterhez.'),
  ('esemeny.tag_felveve_szoveg', 'ro', '{nev} s-a alaturat spatiului de lucru.'),
  ('esemeny.tag_felveve_szoveg', 'en', '{nev} joined the workspace.'),
  -- szerep_valtozott
  ('esemeny.szerep_valtozott_cim', 'hu', 'Szerep valtozas'),
  ('esemeny.szerep_valtozott_cim', 'ro', 'Schimbare rol'),
  ('esemeny.szerep_valtozott_cim', 'en', 'Role changed'),
  ('esemeny.szerep_valtozott_szoveg', 'hu', '{nev} szerepe {regi_szerep}-rol {uj_szerep}-re valtozott.'),
  ('esemeny.szerep_valtozott_szoveg', 'ro', 'Rolul lui {nev} s-a schimbat din {regi_szerep} in {uj_szerep}.'),
  ('esemeny.szerep_valtozott_szoveg', 'en', '{nev} role changed from {regi_szerep} to {uj_szerep}.'),
  -- tag_eltavolitva
  ('esemeny.tag_eltavolitva_cim', 'hu', 'Tag eltavolitva'),
  ('esemeny.tag_eltavolitva_cim', 'ro', 'Membru eliminat'),
  ('esemeny.tag_eltavolitva_cim', 'en', 'Member removed'),
  ('esemeny.tag_eltavolitva_szoveg', 'hu', '{nev} eltavolitva a munkaterrol.'),
  ('esemeny.tag_eltavolitva_szoveg', 'ro', '{nev} a fost eliminat din spatiul de lucru.'),
  ('esemeny.tag_eltavolitva_szoveg', 'en', '{nev} was removed from the workspace.'),
  -- tag_kilepett
  ('esemeny.tag_kilepett_cim', 'hu', 'Tag kilepett'),
  ('esemeny.tag_kilepett_cim', 'ro', 'Membru plecat'),
  ('esemeny.tag_kilepett_cim', 'en', 'Member left'),
  ('esemeny.tag_kilepett_szoveg', 'hu', '{nev} kilepett a munkaterrol.'),
  ('esemeny.tag_kilepett_szoveg', 'ro', '{nev} a parasit spatiul de lucru.'),
  ('esemeny.tag_kilepett_szoveg', 'en', '{nev} left the workspace.'),
  -- futas_indult
  ('esemeny.futas_indult_cim', 'hu', 'Figyeles elindult'),
  ('esemeny.futas_indult_cim', 'ro', 'Monitorizare pornita'),
  ('esemeny.futas_indult_cim', 'en', 'Monitor started'),
  ('esemeny.futas_indult_szoveg', 'hu', 'A hirfigyeles futasa elindult.'),
  ('esemeny.futas_indult_szoveg', 'ro', 'Monitorizarea stirilor a inceput.'),
  ('esemeny.futas_indult_szoveg', 'en', 'News monitor run started.'),
  -- futas_kesz
  ('esemeny.futas_kesz_cim', 'hu', 'Figyeles kesz'),
  ('esemeny.futas_kesz_cim', 'ro', 'Monitorizare finalizata'),
  ('esemeny.futas_kesz_cim', 'en', 'Monitor finished'),
  ('esemeny.futas_kesz_szoveg', 'hu', 'A hirfigyeles futasa kesz, {uj_talalatok} uj talalat.'),
  ('esemeny.futas_kesz_szoveg', 'ro', 'Monitorizarea stirilor finalizata, {uj_talalatok} rezultate noi.'),
  ('esemeny.futas_kesz_szoveg', 'en', 'News monitor run finished, {uj_talalatok} new findings.'),
  -- futas_hiba
  ('esemeny.futas_hiba_cim', 'hu', 'Figyeles hiba'),
  ('esemeny.futas_hiba_cim', 'ro', 'Eroare monitorizare'),
  ('esemeny.futas_hiba_cim', 'en', 'Monitor error'),
  ('esemeny.futas_hiba_szoveg', 'hu', 'A hirfigyeles futasa megszakadt: {reszlet}.'),
  ('esemeny.futas_hiba_szoveg', 'ro', 'Monitorizarea stirilor a esuat: {reszlet}.'),
  ('esemeny.futas_hiba_szoveg', 'en', 'News monitor run failed: {reszlet}.'),
  -- keret_kimerult
  ('esemeny.keret_kimerult_cim', 'hu', 'AI keret kimerult'),
  ('esemeny.keret_kimerult_cim', 'ro', 'Limit AI epuizat'),
  ('esemeny.keret_kimerult_cim', 'en', 'AI quota exhausted'),
  ('esemeny.keret_kimerult_szoveg', 'hu', 'Az AI havi kerete kimerult a munkateren.'),
  ('esemeny.keret_kimerult_szoveg', 'ro', 'Limitul lunar AI a fost epuizat pentru acest spatiu.'),
  ('esemeny.keret_kimerult_szoveg', 'en', 'The monthly AI quota has been exhausted for this workspace.'),
  -- tema_alkalmazva
  ('esemeny.tema_alkalmazva_cim', 'hu', 'Tema alkalmazva'),
  ('esemeny.tema_alkalmazva_cim', 'ro', 'Tema aplicata'),
  ('esemeny.tema_alkalmazva_cim', 'en', 'Theme applied'),
  ('esemeny.tema_alkalmazva_szoveg', 'hu', 'A {tema} tema alkalmazva.'),
  ('esemeny.tema_alkalmazva_szoveg', 'ro', 'Tema {tema} aplicata.'),
  ('esemeny.tema_alkalmazva_szoveg', 'en', 'Theme {tema} applied.'),
  -- feliratok_alkalmazva
  ('esemeny.feliratok_alkalmazva_cim', 'hu', 'Feliratok frissitve'),
  ('esemeny.feliratok_alkalmazva_cim', 'ro', 'Etichete actualizate'),
  ('esemeny.feliratok_alkalmazva_cim', 'en', 'Labels updated'),
  ('esemeny.feliratok_alkalmazva_szoveg', 'hu', 'A feliratok frissitve lettek.'),
  ('esemeny.feliratok_alkalmazva_szoveg', 'ro', 'Etichetele au fost actualizate.'),
  ('esemeny.feliratok_alkalmazva_szoveg', 'en', 'Labels have been updated.'),
  -- profil_jovahagyva
  ('esemeny.profil_jovahagyva_cim', 'hu', 'Profil jovahagyva'),
  ('esemeny.profil_jovahagyva_cim', 'ro', 'Profil aprobat'),
  ('esemeny.profil_jovahagyva_cim', 'en', 'Profile approved'),
  ('esemeny.profil_jovahagyva_szoveg', 'hu', 'A hirfigyelo profilja jovahagyva.'),
  ('esemeny.profil_jovahagyva_szoveg', 'ro', 'Profilul monitorului de stiri a fost aprobat.'),
  ('esemeny.profil_jovahagyva_szoveg', 'en', 'News monitor profile approved.'),
  -- ai_kapcsolo_valtozott
  ('esemeny.ai_kapcsolo_valtozott_cim', 'hu', 'AI kapcsolo valtozott'),
  ('esemeny.ai_kapcsolo_valtozott_cim', 'ro', 'Comutator AI schimbat'),
  ('esemeny.ai_kapcsolo_valtozott_cim', 'en', 'AI toggle changed'),
  ('esemeny.ai_kapcsolo_valtozott_szoveg', 'hu', 'Az AI {allapot} lett ebben a munkaterben.'),
  ('esemeny.ai_kapcsolo_valtozott_szoveg', 'ro', 'AI a fost {allapot} in acest spatiu de lucru.'),
  ('esemeny.ai_kapcsolo_valtozott_szoveg', 'en', 'AI has been {allapot} in this workspace.'),
  -- fajl_feltoltve
  ('esemeny.fajl_feltoltve_cim', 'hu', 'Fajl feltoltve'),
  ('esemeny.fajl_feltoltve_cim', 'ro', 'Fisier incarcat'),
  ('esemeny.fajl_feltoltve_cim', 'en', 'File uploaded'),
  ('esemeny.fajl_feltoltve_szoveg', 'hu', '{nev} feltoltott egy fajlt: {fajl_nev}.'),
  ('esemeny.fajl_feltoltve_szoveg', 'ro', '{nev} a incarcat un fisier: {fajl_nev}.'),
  ('esemeny.fajl_feltoltve_szoveg', 'en', '{nev} uploaded a file: {fajl_nev}.'),
  -- mentes_kimaradt
  ('esemeny.mentes_kimaradt_cim', 'hu', 'Mentes kimaradt'),
  ('esemeny.mentes_kimaradt_cim', 'ro', 'Salvare omisa'),
  ('esemeny.mentes_kimaradt_cim', 'en', 'Backup missed'),
  ('esemeny.mentes_kimaradt_szoveg', 'hu', 'Az automatikus mentes nem futott le.'),
  ('esemeny.mentes_kimaradt_szoveg', 'ro', 'Salvarea automata nu a rulat.'),
  ('esemeny.mentes_kimaradt_szoveg', 'en', 'Automatic backup did not run.'),
  -- ai.kikapcsolva
  ('ai.kikapcsolva', 'hu', 'Ennel a munkaternel az AI ki van kapcsolva — a tulajdonos kapcsolhatja vissza a beallitasokban.'),
  ('ai.kikapcsolva', 'ro', 'AI este dezactivat in acest spatiu de lucru — proprietarul il poate reactiva din setari.'),
  ('ai.kikapcsolva', 'en', 'AI is turned off in this workspace — the owner can turn it back on in settings.'),
  -- ai.kapcsolo_be
  ('ai.kapcsolo_be', 'hu', 'bekapcsolva'),
  ('ai.kapcsolo_be', 'ro', 'activat'),
  ('ai.kapcsolo_be', 'en', 'turned on'),
  -- ai.kapcsolo_ki
  ('ai.kapcsolo_ki', 'hu', 'kikapcsolva'),
  ('ai.kapcsolo_ki', 'ro', 'dezactivat'),
  ('ai.kapcsolo_ki', 'en', 'turned off')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
