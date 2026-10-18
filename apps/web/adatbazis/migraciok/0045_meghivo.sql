-- F-3: a meghívó tábla, a védelmi szabály, a SECURITY DEFINER függvény és a hibakódok feliratai.
--
-- A meghívó egy egyszer használatos, hét napig érvényes jegy. A jegy MAGA sehol nem tárolódik:
-- csak a SHA-256 lenyomata (a `jelszo_visszaallitas` mintájára). Az elfogadásnál még nincs
-- szervezet-kontextus, ezért a lenyomat szerinti keresés egy SECURITY DEFINER függvényen át fut.

CREATE TABLE IF NOT EXISTS "meghivo" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "szervezet_id" uuid NOT NULL REFERENCES "szervezet"("id") ON DELETE CASCADE,
  "szerep" "szerep" NOT NULL,
  "email" text,
  "lenyomat" text NOT NULL,
  "letrehozta" uuid NOT NULL REFERENCES "fiok"("id"),
  "letrehozva" timestamptz NOT NULL DEFAULT now(),
  "lejar" timestamptz NOT NULL,
  "allapot" text NOT NULL DEFAULT 'kiadott',
  "elfogadta" uuid REFERENCES "fiok"("id"),
  "elfogadva" timestamptz,
  "visszavonva" timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS "meghivo_lenyomat" ON "meghivo" ("lenyomat");
CREATE INDEX IF NOT EXISTS "meghivo_szervezet" ON "meghivo" ("szervezet_id");

-- Sorszintű védelem a `tagsag` mintájára: a szervezet tagjai látják a saját szervezetük meghívóit.
ALTER TABLE "meghivo" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meghivo_sajat_szervezet" ON "meghivo";
CREATE POLICY "meghivo_sajat_szervezet" ON "meghivo" AS PERMISSIVE FOR ALL TO "km_app"
  USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid)
  WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE ON "meghivo" TO "km_app";

-- A lenyomat szerinti keresés munkatér NÉLKÜL fut (elfogadásnál még nincs szervezet).
-- Ezért SECURITY DEFINER: a `km_app` futtathatja, de csak ezen a szűk bejáraton át.
CREATE OR REPLACE FUNCTION "meghivo_lenyomat_szerint"("p_lenyomat" text)
RETURNS SETOF "meghivo"
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM "meghivo" WHERE "lenyomat" = "p_lenyomat" LIMIT 1;
$$;

REVOKE ALL ON FUNCTION "meghivo_lenyomat_szerint"(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "meghivo_lenyomat_szerint"(text) TO "km_app";

-- A hibakódok feliratai három nyelven (hu eredeti; ro, en fordítás).
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('hozzaferes.hiba_nincs_jog', 'hu', 'Ehhez nincs jogosultságod ebben a munkatérben.'),
  ('hozzaferes.hiba_nincs_jog', 'ro', 'Nu ai drepturi pentru asta în acest spațiu de lucru.'),
  ('hozzaferes.hiba_nincs_jog', 'en', 'You do not have permission for this in this workspace.'),
  ('hozzaferes.hiba_nagyobb_szerep', 'hu', 'Nem adhatsz magadnál nagyobb szerepet.'),
  ('hozzaferes.hiba_nagyobb_szerep', 'ro', 'Nu poți acorda un rol mai mare decât al tău.'),
  ('hozzaferes.hiba_nagyobb_szerep', 'en', 'You cannot grant a role higher than your own.'),
  ('hozzaferes.hiba_utolso_tulajdonos', 'hu', 'Az utolsó tulajdonos nem vehető le és nem léphet ki.'),
  ('hozzaferes.hiba_utolso_tulajdonos', 'ro', 'Ultimul proprietar nu poate fi eliminat și nu poate pleca.'),
  ('hozzaferes.hiba_utolso_tulajdonos', 'en', 'The last owner cannot be removed and cannot leave.'),
  ('hozzaferes.hiba_magat_nem', 'hu', 'Saját magadat nem távolíthatod el és nem állíthatod át. Kilépni a kilépéssel lehet.'),
  ('hozzaferes.hiba_magat_nem', 'ro', 'Nu te poți elimina și nu te poți reconfigura pe tine. Pentru a pleca, folosește ieșirea.'),
  ('hozzaferes.hiba_magat_nem', 'en', 'You cannot remove or change yourself. To leave, use the leave action.'),
  ('hozzaferes.hiba_mar_tag', 'hu', 'Ez a fiók már tagja a munkatérnek.'),
  ('hozzaferes.hiba_mar_tag', 'ro', 'Acest cont este deja membru al spațiului de lucru.'),
  ('hozzaferes.hiba_mar_tag', 'en', 'This account is already a member of the workspace.'),
  ('hozzaferes.hiba_nincs_ilyen_tag', 'hu', 'Nincs ilyen tag ebben a munkatérben.'),
  ('hozzaferes.hiba_nincs_ilyen_tag', 'ro', 'Nu există un astfel de membru în acest spațiu de lucru.'),
  ('hozzaferes.hiba_nincs_ilyen_tag', 'en', 'There is no such member in this workspace.'),
  ('hozzaferes.hiba_nincs_ilyen_meghivo', 'hu', 'Nincs ilyen meghívó.'),
  ('hozzaferes.hiba_nincs_ilyen_meghivo', 'ro', 'Nu există o astfel de invitație.'),
  ('hozzaferes.hiba_nincs_ilyen_meghivo', 'en', 'There is no such invitation.'),
  ('hozzaferes.hiba_meghivo_lejart', 'hu', 'Ez a meghívó lejárt. Kérj újat a munkatér tulajdonosától.'),
  ('hozzaferes.hiba_meghivo_lejart', 'ro', 'Această invitație a expirat. Cere una nouă proprietarului spațiului.'),
  ('hozzaferes.hiba_meghivo_lejart', 'en', 'This invitation has expired. Ask the workspace owner for a new one.'),
  ('hozzaferes.hiba_meghivo_felhasznalva', 'hu', 'Ezt a meghívót már felhasználták.'),
  ('hozzaferes.hiba_meghivo_felhasznalva', 'ro', 'Această invitație a fost deja folosită.'),
  ('hozzaferes.hiba_meghivo_felhasznalva', 'en', 'This invitation has already been used.'),
  ('hozzaferes.hiba_meghivo_visszavonva', 'hu', 'Ezt a meghívót visszavonták.'),
  ('hozzaferes.hiba_meghivo_visszavonva', 'ro', 'Această invitație a fost retrasă.'),
  ('hozzaferes.hiba_meghivo_visszavonva', 'en', 'This invitation has been revoked.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
