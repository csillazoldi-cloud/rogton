-- Kézzel írt migráció (drizzle-kit --custom), E-22: a Hírfigyelő várólistája.
-- HOST-szintű tábla (mint az ai_koltseg_honap): NINCS sorszintű védelem, a futtató minden szervezet sorát látja.
CREATE TABLE "hf_sor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"fajta" text NOT NULL,
	"adat" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"allapot" text DEFAULT 'var' NOT NULL,
	"kiserlet" integer DEFAULT 0 NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"kezdve" timestamp with time zone,
	"vege" timestamp with time zone,
	"hiba_ok" text,
	"eredmeny" jsonb
);--> statement-breakpoint
ALTER TABLE "hf_sor" ADD CONSTRAINT "hf_sor_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_sor_allapot_letrehozva_idx" ON "hf_sor" USING btree ("allapot","letrehozva");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_sor" TO km_app;--> statement-breakpoint
-- A napi ütemezések listája a futtatónak: a km_tulaj (a tábla gazdája) nevében fut, ezért a sorszintű védelem alól kilát —
-- de CSAK ezt az egy, szűk listát adja (szervezet + időzítés + az utolsó napi futás kezdete), semmi mást.
CREATE OR REPLACE FUNCTION hf_napi_utemezesek()
RETURNS TABLE (szervezet_id uuid, idozites jsonb, utolso_napi timestamptz)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT v.szervezet_id, v.beallitas->'idozites' AS idozites,
         (SELECT max(s.kezdve) FROM hf_sor s WHERE s.szervezet_id = v.szervezet_id AND s.fajta = 'napi' AND s.allapot IN ('kesz','hiba')) AS utolso_napi
  FROM hf_beallitas_verzio v
  WHERE v.allapot = 'aktiv' AND v.beallitas->'idozites'->>'mod' = 'napi'
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION hf_napi_utemezesek() FROM PUBLIC;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION hf_napi_utemezesek() TO km_app;
