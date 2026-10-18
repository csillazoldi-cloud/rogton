-- R-13 (2026-09-22, Vilmos): pénz helyett KREDIT. Minden mai AI-művelet 1 kredit. A munkatér havonta kap kreditet
-- (egyelőre a rendszergazda adja), a tulajdonos osztja szét a tagok között; aki nem kapott külön összeget, a ki nem
-- osztott rész egyenlő részét kapja. A megosztott olvasás 1 kreditje megoszlik (ezredre pontosan tároljuk).

-- 1. A munkatér havi kreditje. NULL = az alap (ALAP_MUNKATER_HAVI a kódban, teszt: 1000).
ALTER TABLE "szervezet" ADD COLUMN IF NOT EXISTS "kredit_havi" integer;--> statement-breakpoint

-- 2. A tag havi kreditje. NULL = egyenlő rész.
ALTER TABLE "tagsag" ADD COLUMN IF NOT EXISTS "kredit_havi" numeric(12,3);--> statement-breakpoint

-- 3. A felhasználás: egy sor = egy terhelés egy tagon (ezredben). A hónap Bukarest szerint ("YYYY-MM").
CREATE TABLE IF NOT EXISTS "kredit_mozgas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"fiok_id" uuid,
	"honap" text NOT NULL,
	"ezred" integer NOT NULL,
	"feladat" text NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "kredit_mozgas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kredit_mozgas" ADD CONSTRAINT "kredit_mozgas_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kredit_mozgas" ADD CONSTRAINT "kredit_mozgas_fiok_id_fiok_id_fk" FOREIGN KEY ("fiok_id") REFERENCES "public"."fiok"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kredit_mozgas_szervezet_honap" ON "kredit_mozgas" USING btree ("szervezet_id", "honap");--> statement-breakpoint
CREATE POLICY "kredit_mozgas_sajat" ON "kredit_mozgas" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT ON "kredit_mozgas" TO "km_app";--> statement-breakpoint

-- 4. A rendszergazda más munkatér havi kreditjét állítja és látja — a km_app más szervezet sorát nem írhatja/olvashatja,
--    ezért két SECURITY DEFINER függvény (a jogot az API ellenőrzi). Csak összesítést ad, egyetlen tartalmat sem.
CREATE OR REPLACE FUNCTION kredit_havi_allit(p_szervezet uuid, p_havi integer)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE szervezet SET kredit_havi = p_havi WHERE id = p_szervezet;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION kredit_havi_allit(uuid, integer) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION kredit_havi_allit(uuid, integer) TO km_app;--> statement-breakpoint
CREATE OR REPLACE FUNCTION kredit_osszes(p_honap text)
RETURNS TABLE (szervezet_id uuid, kredit_havi integer, felhasznalt_ezred bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sz.id, sz.kredit_havi, coalesce((SELECT sum(m.ezred) FROM kredit_mozgas m WHERE m.szervezet_id = sz.id AND m.honap = p_honap), 0)::bigint
  FROM szervezet sz;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION kredit_osszes(text) FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION kredit_osszes(text) TO km_app;
