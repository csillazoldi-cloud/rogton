-- Kézzel írt migráció (drizzle-kit --custom), E-16: a feliratok két szintje (D-09) — közös és szervezeti felülírás, verziózva.
-- A csomag alapja marad a `felirat` tábla (a kódból jövő szövegek, három nyelven); a felülírások csak az eltérő szövegeket tartják.
CREATE TABLE "kozos_felirat_verzio" (
	"verzio" integer PRIMARY KEY NOT NULL,
	"felulirasok" jsonb NOT NULL,
	"allapot" "tema_allapot" DEFAULT 'tervezet' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"alkalmazva" timestamp with time zone
);--> statement-breakpoint
CREATE UNIQUE INDEX "kozos_felirat_egy_alkalmazott" ON "kozos_felirat_verzio" USING btree ("allapot") WHERE allapot = 'alkalmazott';--> statement-breakpoint
CREATE UNIQUE INDEX "kozos_felirat_egy_tervezet" ON "kozos_felirat_verzio" USING btree ("allapot") WHERE allapot = 'tervezet';--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "kozos_felirat_verzio" TO km_app;--> statement-breakpoint
CREATE TABLE "szervezet_felirat_verzio" (
	"szervezet_id" uuid NOT NULL,
	"verzio" integer NOT NULL,
	"felulirasok" jsonb NOT NULL,
	"allapot" "tema_allapot" DEFAULT 'tervezet' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"alkalmazva" timestamp with time zone,
	CONSTRAINT "szervezet_felirat_verzio_szervezet_id_verzio_pk" PRIMARY KEY("szervezet_id","verzio")
);--> statement-breakpoint
ALTER TABLE "szervezet_felirat_verzio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "szervezet_felirat_verzio" ADD CONSTRAINT "szervezet_felirat_verzio_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "szervezet_felirat_egy_alkalmazott" ON "szervezet_felirat_verzio" USING btree ("szervezet_id") WHERE allapot = 'alkalmazott';--> statement-breakpoint
CREATE UNIQUE INDEX "szervezet_felirat_egy_tervezet" ON "szervezet_felirat_verzio" USING btree ("szervezet_id") WHERE allapot = 'tervezet';--> statement-breakpoint
CREATE POLICY "szervezet_felirat_sajat" ON "szervezet_felirat_verzio" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "szervezet_felirat_verzio" TO km_app;
