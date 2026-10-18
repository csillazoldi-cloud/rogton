-- 0174: c30 F5 (docs/terv/FESZTIVAL-ES-NYELVI-MOD-TERV.md §1.4, §10 F5; docs/decisions/2026-10-17-c30-f5-program.md) — a rendezvény
--   PROGRAMJA saját táblában (nem a profil jsonb-jében: a Zilele program ~88 tétel, ~40–60 KB két nyelven — a profilt minden mentés
--   újraírná, és minden poszt-prompt betöltené). Soronként szerkeszthető, napra kereshető, puhán törölhető.
--   · Szervezeti adat: sorszintű védelem, mint minden ügyféltáblán (A-11; ugyanaz a szabály, mint a 0152 kozlemeny_sorszam-nál).
--   · A km_app SELECT, INSERT, UPDATE jogot kap — DELETE-et NEM: törlés csak puhán (`torolve`), a sor megmarad.
--   · `modositva` / `forras = 'sajat'`: az újraolvasás ezeket soha nem írja felül (program/szabaly.ts ujraOlvasTerv); a `gep_kulcs` a gép
--     beírásának kulcsa (nap|kezdés|név) — az átírt sor eredetije így nem kerül be újra másodpéldányként.
-- Adatvesztés nincs: csak új tábla, index, jog és szabály. Ismételhető (IF NOT EXISTS / DROP … IF EXISTS).
--
-- Próbafuttatás a NAS-on (a „;” a BEGIN után kötelező; várt kimenet: CREATE TABLE, ALTER TABLE ×4, CREATE INDEX, GRANT, ALTER TABLE,
-- DROP POLICY (NOTICE: nem létezik), CREATE POLICY, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0174_c30_f5_program_tetel.sql; echo "ROLLBACK;"; } | ssh nas 'sudo docker exec -i aitmetica-saas-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km'

CREATE TABLE IF NOT EXISTS "program_tetel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"nap" date,
	"kezdes" time,
	"vege" time,
	"nev" jsonb NOT NULL,
	"leiras" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"helyszin" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fellepo" text DEFAULT '' NOT NULL,
	"fajta" text DEFAULT 'egyeb' NOT NULL,
	"kep_fajl_id" uuid,
	"jegy" text DEFAULT '' NOT NULL,
	"bizonytalan" boolean DEFAULT false NOT NULL,
	"aktiv" boolean DEFAULT true NOT NULL,
	"forras" text DEFAULT 'gep' NOT NULL,
	"modositva" boolean DEFAULT false NOT NULL,
	"gep_kulcs" text DEFAULT '' NOT NULL,
	"torolve" timestamp with time zone,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_tetel_nev_ervenyes" CHECK (jsonb_typeof("nev") = 'object' AND "nev" <> '{}'::jsonb),
	CONSTRAINT "program_tetel_leiras_ervenyes" CHECK (jsonb_typeof("leiras") = 'object'),
	CONSTRAINT "program_tetel_helyszin_ervenyes" CHECK (jsonb_typeof("helyszin") = 'object'),
	CONSTRAINT "program_tetel_fajta_ervenyes" CHECK ("fajta" IN ('koncert', 'eloadas', 'gyerek', 'jatek', 'workshop', 'kiallitas', 'gasztro', 'vasar', 'unnepseg', 'egyeb')),
	CONSTRAINT "program_tetel_forras_ervenyes" CHECK ("forras" IN ('gep', 'sajat'))
);
ALTER TABLE "program_tetel" DROP CONSTRAINT IF EXISTS "program_tetel_szervezet_id_szervezet_id_fk";
ALTER TABLE "program_tetel" ADD CONSTRAINT "program_tetel_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "program_tetel" DROP CONSTRAINT IF EXISTS "program_tetel_kep_fajl_id_arculat_fajl_id_fk";
ALTER TABLE "program_tetel" ADD CONSTRAINT "program_tetel_kep_fajl_id_arculat_fajl_id_fk" FOREIGN KEY ("kep_fajl_id") REFERENCES "public"."arculat_fajl"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX IF NOT EXISTS "program_tetel_szervezet_nap_idx" ON "program_tetel" ("szervezet_id", "nap", "kezdes");
GRANT SELECT, INSERT, UPDATE ON "program_tetel" TO "km_app";
ALTER TABLE "program_tetel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "program_tetel_sajat_szervezet" ON "program_tetel";
CREATE POLICY "program_tetel_sajat_szervezet" ON "program_tetel" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);
