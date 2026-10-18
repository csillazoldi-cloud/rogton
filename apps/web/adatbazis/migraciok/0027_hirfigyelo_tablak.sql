-- Kézzel írt migráció (drizzle-kit --custom), E-20: a Hírfigyelő táblái.
-- Minden ügyféladat szervezethez kötve, sorszintű védelemmel; a km_app szerep csak a saját szervezetét látja.
CREATE TABLE "hf_beallitas_verzio" (
	"szervezet_id" uuid NOT NULL,
	"verzio" integer NOT NULL,
	"allapot" text NOT NULL,
	"eredet" text NOT NULL,
	"beallitas" jsonb NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hf_beallitas_verzio_szervezet_id_verzio_pk" PRIMARY KEY("szervezet_id","verzio")
);--> statement-breakpoint
ALTER TABLE "hf_beallitas_verzio" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_beallitas_verzio" ADD CONSTRAINT "hf_beallitas_verzio_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hf_beallitas_egy_aktiv" ON "hf_beallitas_verzio" USING btree ("szervezet_id") WHERE allapot = 'aktiv';--> statement-breakpoint
CREATE POLICY "hf_beallitas_sajat" ON "hf_beallitas_verzio" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_beallitas_verzio" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_tervezet" (
	"szervezet_id" uuid NOT NULL,
	"fiok_id" uuid NOT NULL,
	"beallitas" jsonb NOT NULL,
	"frissitve" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hf_tervezet_szervezet_id_fiok_id_pk" PRIMARY KEY("szervezet_id","fiok_id")
);--> statement-breakpoint
ALTER TABLE "hf_tervezet" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_tervezet" ADD CONSTRAINT "hf_tervezet_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "hf_tervezet_sajat" ON "hf_tervezet" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_tervezet" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_forras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"cim" text NOT NULL,
	"tipus" text,
	"eredet" text NOT NULL,
	"allapot" text NOT NULL,
	"ellenorzott" boolean DEFAULT false NOT NULL,
	"utolso_sikeres" timestamp with time zone,
	"hiba_ok" text
);--> statement-breakpoint
ALTER TABLE "hf_forras" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_forras" ADD CONSTRAINT "hf_forras_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_forras_szervezet_idx" ON "hf_forras" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_forras_sajat" ON "hf_forras" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_forras" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_futas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"szabaly_verzio" integer NOT NULL,
	"kezdet" timestamp with time zone NOT NULL,
	"veg" timestamp with time zone,
	"allapot" text NOT NULL,
	"uj_talalatok" integer DEFAULT 0 NOT NULL,
	"hibas_forrasok" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"proba" boolean DEFAULT false NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_futas" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_futas" ADD CONSTRAINT "hf_futas_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_futas_szervezet_idx" ON "hf_futas" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_futas_sajat" ON "hf_futas" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_futas" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_kivonat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"forras_id" uuid NOT NULL,
	"cim" text NOT NULL,
	"url" text NOT NULL,
	"kanonikus_url" text NOT NULL,
	"megjelenes" timestamp with time zone,
	"begyujtes" timestamp with time zone NOT NULL,
	"szoveg" text NOT NULL,
	"csonkolt" boolean DEFAULT false NOT NULL,
	"ujjlenyomat" text NOT NULL,
	"nyelv" text,
	"lejar" timestamp with time zone NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_kivonat" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_kivonat" ADD CONSTRAINT "hf_kivonat_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hf_kivonat_szervezet_kanonikus" ON "hf_kivonat" USING btree ("szervezet_id","kanonikus_url");--> statement-breakpoint
CREATE INDEX "hf_kivonat_szervezet_idx" ON "hf_kivonat" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_kivonat_sajat" ON "hf_kivonat" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_kivonat" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_esemeny" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"fo_talalat_id" uuid NOT NULL,
	"talalat_ids" jsonb NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_esemeny" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_esemeny" ADD CONSTRAINT "hf_esemeny_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_esemeny_szervezet_idx" ON "hf_esemeny" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_esemeny_sajat" ON "hf_esemeny" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_esemeny" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_talalat" (
	"id" uuid PRIMARY KEY NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"esemeny_id" uuid NOT NULL,
	"kivonat_id" uuid NOT NULL,
	"ertekeles" jsonb,
	"ertekeles_allapot" text NOT NULL,
	"megtekintes" text DEFAULT 'uj' NOT NULL,
	"jeloles" text DEFAULT 'nincs' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"futas_id" uuid NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_talalat" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_talalat" ADD CONSTRAINT "hf_talalat_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_talalat_szervezet_idx" ON "hf_talalat" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_talalat_sajat" ON "hf_talalat" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_talalat" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_visszajelzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"talalat_id" uuid NOT NULL,
	"fajta" text NOT NULL,
	"okok" jsonb NOT NULL,
	"sajat_indok" text DEFAULT '' NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_visszajelzes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_visszajelzes" ADD CONSTRAINT "hf_visszajelzes_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_visszajelzes_szervezet_idx" ON "hf_visszajelzes" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_visszajelzes_sajat" ON "hf_visszajelzes" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_visszajelzes" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_javaslat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"szabaly_verzio" integer NOT NULL,
	"javasolt" jsonb NOT NULL,
	"mi_alapjan" jsonb NOT NULL,
	"indoklas" text NOT NULL,
	"varhato_hatas" text NOT NULL,
	"profil_erintett" boolean DEFAULT false NOT NULL,
	"allapot" text NOT NULL,
	"minta_id" uuid,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_javaslat" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_javaslat" ADD CONSTRAINT "hf_javaslat_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_javaslat_szervezet_idx" ON "hf_javaslat" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_javaslat_sajat" ON "hf_javaslat" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_javaslat" TO km_app;--> statement-breakpoint
CREATE TABLE "hf_minta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"szervezet_id" uuid NOT NULL,
	"szabaly_verzio" integer NOT NULL,
	"talalat_ids" jsonb NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"lejar" timestamp with time zone NOT NULL
);--> statement-breakpoint
ALTER TABLE "hf_minta" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "hf_minta" ADD CONSTRAINT "hf_minta_szervezet_id_szervezet_id_fk" FOREIGN KEY ("szervezet_id") REFERENCES "public"."szervezet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hf_minta_szervezet_idx" ON "hf_minta" USING btree ("szervezet_id");--> statement-breakpoint
CREATE POLICY "hf_minta_sajat" ON "hf_minta" AS PERMISSIVE FOR ALL TO "km_app" USING (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid) WITH CHECK (szervezet_id = nullif(current_setting('app.szervezet_id', true), '')::uuid);--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "hf_minta" TO km_app;
