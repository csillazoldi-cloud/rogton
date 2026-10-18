-- 0152: VZ-1 · Közlemények — két új gépezet (design/VZ1-szerkeszto/gepezet.md 5. és kerdesek 4., 8.; Csilla 2026-10-06 17:32).
--
-- 1. `kozlemeny_sorszam` — a közlemény száma (az azonosító sor „INFO 14”-e): munkaterenként és receptenként az UTOLSÓ letöltött szám;
--    a lap ennél eggyel többet javasol (kerdesek 8: „a gép számolja”), a munkatárs a Részletek alatt átírhatja. Szervezeti adat: sorszintű
--    védelem, mint minden ügyféltáblán (A-11) — egy munkatér sem látja és nem írja a másik számát.
-- 2. `kep_jelzes` — a képgyártó szabály-jelzései a LETÖLTÖTT közlemény-képekről (kerdesek 4: Tibor nem látja őket, a rendszergazdához
--    mennek). Szervezeti adat, sorszintű védelemmel. A rendszergazda listája SECURITY DEFINER függvényen át (mint a 0037 és a 0150):
--    a km_app szerep a védelem miatt csak a saját szervezetét látja; a jogot a végpont ellenőrzi (kapu: rendszergazda).
-- Adatvesztés nincs: csak új táblák és egy függvény. Ismételhető (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS / DROP CONSTRAINT IF EXISTS).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; a várt kimenet: CREATE TABLE ×2, …, CREATE FUNCTION, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0152_vz1_kozlemeny.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

CREATE TABLE IF NOT EXISTS "kozlemeny_sorszam" (
	"szervezet_id" uuid NOT NULL,
	"sablon" text NOT NULL,
	"utolso" integer NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kozlemeny_sorszam_pk" PRIMARY KEY ("szervezet_id", "sablon"),
	CONSTRAINT "kozlemeny_sorszam_sablon_ervenyes" CHECK ("sablon" IN ('zavar', 'allitas', 'adatsavok')),
	CONSTRAINT "kozlemeny_sorszam_utolso_ervenyes" CHECK ("utolso" >= 0 AND "utolso" <= 999999)
);
ALTER TABLE "kozlemeny_sorszam" DROP CONSTRAINT IF EXISTS "kozlemeny_sorszam_szervezet_id_szervezet_id_fk";
ALTER TABLE "kozlemeny_sorszam" ADD CONSTRAINT "kozlemeny_sorszam_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;
GRANT SELECT, INSERT, UPDATE ON "kozlemeny_sorszam" TO "km_app";
ALTER TABLE "kozlemeny_sorszam" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kozlemeny_sorszam_sajat_szervezet" ON "kozlemeny_sorszam";
CREATE POLICY "kozlemeny_sorszam_sajat_szervezet" ON "kozlemeny_sorszam" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);

CREATE TABLE IF NOT EXISTS "kep_jelzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"fiok_id" uuid,
	"sablon" text NOT NULL,
	"sorszam" integer,
	"szabaly" text NOT NULL,
	"szigorusag" text NOT NULL,
	"arculati" boolean DEFAULT false NOT NULL,
	"mezo" text DEFAULT '' NOT NULL,
	"reszlet" text DEFAULT '' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kep_jelzes_szigorusag_ervenyes" CHECK ("szigorusag" IN ('tiltas', 'figyelmeztetes'))
);
ALTER TABLE "kep_jelzes" DROP CONSTRAINT IF EXISTS "kep_jelzes_szervezet_id_szervezet_id_fk";
ALTER TABLE "kep_jelzes" ADD CONSTRAINT "kep_jelzes_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "kep_jelzes_szervezet_idx" ON "kep_jelzes" ("szervezet_id");
CREATE INDEX IF NOT EXISTS "kep_jelzes_letrehozva_idx" ON "kep_jelzes" ("letrehozva");
GRANT SELECT, INSERT ON "kep_jelzes" TO "km_app";
ALTER TABLE "kep_jelzes" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kep_jelzes_sajat_szervezet" ON "kep_jelzes";
CREATE POLICY "kep_jelzes_sajat_szervezet" ON "kep_jelzes" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);

CREATE OR REPLACE FUNCTION kep_jelzes_osszes()
RETURNS TABLE (
  id uuid, szervezet_id uuid, szervezet_nev text, sablon text, sorszam integer, szabaly text, szigorusag text, arculati boolean,
  mezo text, reszlet text, letrehozva timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT j.id, j.szervezet_id, coalesce(sz.nev, ''), j.sablon, j.sorszam, j.szabaly, j.szigorusag, j.arculati, j.mezo, j.reszlet, j.letrehozva
  FROM kep_jelzes j
  LEFT JOIN szervezet sz ON sz.id = j.szervezet_id
  ORDER BY j.letrehozva DESC
  LIMIT 500;
$$;
REVOKE ALL ON FUNCTION kep_jelzes_osszes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION kep_jelzes_osszes() TO km_app;
