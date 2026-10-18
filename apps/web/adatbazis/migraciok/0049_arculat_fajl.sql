-- F-6: az arculati fájlok meta-táblája, a védelmi szabály és a hibakódok feliratai.
--
-- A bájtok NEM itt vannak: azok a FAJL_MAPPA alatt, <szervezet_id>/<id>.<kiterjesztés> néven.
-- Ez a tábla csak a metaadatot őrzi. A típus a TARTALOMBÓL jön (mágikus fejléc), nem a névből.

CREATE TABLE IF NOT EXISTS "arculat_fajl" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "szervezet_id" uuid NOT NULL REFERENCES "szervezet"("id") ON DELETE CASCADE,
  "nev" text NOT NULL,
  "tipus" text NOT NULL,
  "meret" integer NOT NULL,
  "cel" text NOT NULL,
  "feltoltotte" uuid REFERENCES "fiok"("id") ON DELETE SET NULL,
  "feltoltve" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "arculat_fajl_szervezet" ON "arculat_fajl" ("szervezet_id");

-- Sorszintű védelem a `meghivo` mintájára: a szervezet tagjai látják a saját szervezetük fájljait.
ALTER TABLE "arculat_fajl" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arculat_fajl_sajat_szervezet" ON "arculat_fajl";
CREATE POLICY "arculat_fajl_sajat_szervezet" ON "arculat_fajl" AS PERMISSIVE FOR ALL TO "km_app"
  USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid)
  WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
GRANT SELECT, INSERT, UPDATE, DELETE ON "arculat_fajl" TO "km_app";

-- A hibakódok feliratai három nyelven (hu eredeti; ro, en fordítás) — a szerződés 6. pontja szerint.
INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('fajl.hiba_svg_nem_engedett', 'hu', 'SVG-t nem fogadunk el, mert programkódot hordozhat. Mentsd el PNG-ként vagy PDF-ként, és töltsd fel úgy.'),
  ('fajl.hiba_svg_nem_engedett', 'ro', 'Nu acceptăm SVG, deoarece poate conține cod. Salvează-l ca PNG sau PDF și încarcă-l așa.'),
  ('fajl.hiba_svg_nem_engedett', 'en', 'We do not accept SVG because it can carry code. Save it as PNG or PDF and upload it that way.'),
  ('fajl.hiba_tipus_nem_engedett', 'hu', 'Ezt a fájltípust nem fogadjuk el. PNG, JPG, WebP vagy PDF jöhet.'),
  ('fajl.hiba_tipus_nem_engedett', 'ro', 'Nu acceptăm acest tip de fișier. Poate veni PNG, JPG, WebP sau PDF.'),
  ('fajl.hiba_tipus_nem_engedett', 'en', 'We do not accept this file type. PNG, JPG, WebP or PDF is allowed.'),
  ('fajl.hiba_tul_nagy', 'hu', 'A fájl túl nagy: legfeljebb 10 MB lehet.'),
  ('fajl.hiba_tul_nagy', 'ro', 'Fișierul este prea mare: maximum 10 MB.'),
  ('fajl.hiba_tul_nagy', 'en', 'The file is too large: at most 10 MB.'),
  ('fajl.hiba_ures', 'hu', 'A fájl üres.'),
  ('fajl.hiba_ures', 'ro', 'Fișierul este gol.'),
  ('fajl.hiba_ures', 'en', 'The file is empty.'),
  ('fajl.feltoltve_ok', 'hu', 'A fájl feltöltve: {nev}.'),
  ('fajl.feltoltve_ok', 'ro', 'Fișier încărcat: {nev}.'),
  ('fajl.feltoltve_ok', 'en', 'File uploaded: {nev}.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
