-- 0150: R-17 B · fizetős logótervezés (design/R17-visszajelzes/gepezet.md B; Csilla 10-06: a névlogó marad az elsődleges út, a tervezői
-- ajánlat a halk második; az ár a rendszergazda állítja, alap 79 EUR; e-mail csak, ha a levelezés be van állítva).
--
-- 1. `rendszer_beallitas` — KÖZÖS (nem szervezeti) beállítások kulcs → JSON értékkel, mint az `arfolyam`: nincs sorszintű védelem, a
--    rendszergazda állítja a végponton (/api/admin/logoterv). Két kulcs: `logoterv_ar` (szám EUR-ban, vagy null = a gomb nem látszik)
--    és `logoterv_cimzett` (e-mail-cím, üres = nincs levél, a kérés csak a listában van). Kezdőérték: 79 és "" (ON CONFLICT DO NOTHING —
--    a rendszergazda későbbi beállítását egy újrafuttatás nem írja felül).
-- 2. `logoterv_keres` — egy beküldött kérdőív. Szervezeti adat: sorszintű védelem, mint minden ügyféltáblán (A-11). Az ár a beküldés
--    pillanatának ára (a beállítás később változhat). `ertesites`: nincs_beallitva · kuldes · elkuldve · hiba.
-- 3. A rendszergazda listája és az állapot állítása SECURITY DEFINER függvényen át (mint a 0037 ai_koltseg_osszes): a km_app szerep a
--    sorszintű védelem miatt csak a saját szervezetét látja. A jogot a végpont ellenőrzi (kapu: rendszergazda).
-- Adatvesztés nincs: csak új táblák és függvények. Ismételhető (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS / ON CONFLICT).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: CREATE TABLE ×2, INSERT 0 2, …, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0150_r17_logoterv.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

CREATE TABLE IF NOT EXISTS "rendszer_beallitas" (
	"kulcs" text PRIMARY KEY NOT NULL,
	"ertek" jsonb NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL
);
GRANT SELECT, INSERT, UPDATE ON "rendszer_beallitas" TO "km_app";
INSERT INTO "rendszer_beallitas" ("kulcs", "ertek") VALUES
  ('logoterv_ar', '79'::jsonb),
  ('logoterv_cimzett', '""'::jsonb)
ON CONFLICT ("kulcs") DO NOTHING;

CREATE TABLE IF NOT EXISTS "logoterv_keres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"fiok_id" uuid,
	"fiok_nev" text DEFAULT '' NOT NULL,
	"ar_eur" numeric(10, 2),
	"valaszok" jsonb NOT NULL,
	"fajl_idk" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"allapot" text DEFAULT 'uj' NOT NULL,
	"ertesites" text DEFAULT 'nincs_beallitva' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logoterv_keres_allapot_ervenyes" CHECK ("allapot" IN ('uj', 'folyamatban', 'kesz')),
	CONSTRAINT "logoterv_keres_ertesites_ervenyes" CHECK ("ertesites" IN ('nincs_beallitva', 'kuldes', 'elkuldve', 'hiba'))
);
ALTER TABLE "logoterv_keres" DROP CONSTRAINT IF EXISTS "logoterv_keres_szervezet_id_szervezet_id_fk";
ALTER TABLE "logoterv_keres" ADD CONSTRAINT "logoterv_keres_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "logoterv_keres_szervezet_idx" ON "logoterv_keres" ("szervezet_id");
CREATE INDEX IF NOT EXISTS "logoterv_keres_letrehozva_idx" ON "logoterv_keres" ("letrehozva");
GRANT SELECT, INSERT, UPDATE ON "logoterv_keres" TO "km_app";
ALTER TABLE "logoterv_keres" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "logoterv_keres_sajat_szervezet" ON "logoterv_keres";
CREATE POLICY "logoterv_keres_sajat_szervezet" ON "logoterv_keres" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);

CREATE OR REPLACE FUNCTION logoterv_keres_osszes()
RETURNS TABLE (
  id uuid, szervezet_id uuid, szervezet_nev text, fiok_nev text, ar_eur numeric, valaszok jsonb, fajl_db integer,
  allapot text, ertesites text, letrehozva timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT k.id, k.szervezet_id, coalesce(sz.nev, ''), k.fiok_nev, k.ar_eur, k.valaszok, jsonb_array_length(k.fajl_idk),
         k.allapot, k.ertesites, k.letrehozva
  FROM logoterv_keres k
  LEFT JOIN szervezet sz ON sz.id = k.szervezet_id
  ORDER BY k.letrehozva DESC
  LIMIT 500;
$$;
REVOKE ALL ON FUNCTION logoterv_keres_osszes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION logoterv_keres_osszes() TO km_app;

CREATE OR REPLACE FUNCTION logoterv_keres_allapot(p_id uuid, p_allapot text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (UPDATE logoterv_keres SET allapot = p_allapot WHERE id = p_id RETURNING 1)
  SELECT count(*) > 0 FROM u;
$$;
REVOKE ALL ON FUNCTION logoterv_keres_allapot(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION logoterv_keres_allapot(uuid, text) TO km_app;
