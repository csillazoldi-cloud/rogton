-- Kézzel írt migráció (drizzle-kit --custom), E-34: belépési védelem.
-- D-17 döntése (2026-09-08): a regisztráció NYITVA marad, ezért a sebességkorlát nem kényelmi
-- funkció, hanem A FŐ VÉDELEM. Két tábla készül:
--   belepesi_kiserlet   — minden belépési/regisztrációs kísérlet naplója (ez EGYBEN hozzáférésnapló)
--   jelszo_visszaallitas — egyszer használatos, lejáró visszaállító jegyek
-- Mindkettő HOST-szintű (mint az ai_koltseg_honap és a hf_sor): NINCS sorszintű védelem,
-- mert nem ügyféladat és a belépés előtt is kell olvasni — szervezeti kontextus még nincs.

CREATE TABLE "belepesi_kiserlet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	-- "belepes" | "regisztracio" | "jelszo_visszaallitas"
	"fajta" text NOT NULL,
	-- a megcélzott e-mail KISBETŰSEN, ha volt ilyen a kérésben (a fiók létezését ez NEM árulja el)
	"email" text,
	-- a kérő címe, ahogy a kiszolgáló látta; ismeretlen esetén 'ismeretlen'
	"cim" text NOT NULL,
	"sikeres" boolean NOT NULL,
	"ido" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
-- A számláló lekérdezései: (e-mail, idő) és (cím, idő). A `sikeres` a WHERE-ben szűr, nem az indexben,
-- mert a napló olvasásakor (hozzáférésnapló) a sikeres sorok is kellenek.
CREATE INDEX "belepesi_kiserlet_email_ido_idx" ON "belepesi_kiserlet" USING btree ("email","ido");--> statement-breakpoint
CREATE INDEX "belepesi_kiserlet_cim_ido_idx" ON "belepesi_kiserlet" USING btree ("cim","ido");--> statement-breakpoint
CREATE INDEX "belepesi_kiserlet_ido_idx" ON "belepesi_kiserlet" USING btree ("ido");--> statement-breakpoint
GRANT SELECT, INSERT, DELETE ON "belepesi_kiserlet" TO km_app;--> statement-breakpoint

CREATE TABLE "jelszo_visszaallitas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fiok_id" uuid NOT NULL,
	-- a jegy SHA-256 lenyomata; magát a jegyet SEHOL nem tároljuk (mint a munkamenetnél)
	"jegy_lenyomat" text NOT NULL,
	"lejar" timestamp with time zone NOT NULL,
	"felhasznalva" timestamp with time zone,
	-- ki adta ki (rendszergazda fiókja) — a naplózhatóság miatt
	"kiadta" uuid,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "jelszo_visszaallitas" ADD CONSTRAINT "jelszo_visszaallitas_fiok_id_fiok_id_fk" FOREIGN KEY ("fiok_id") REFERENCES "public"."fiok"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "jelszo_visszaallitas_jegy" ON "jelszo_visszaallitas" USING btree ("jegy_lenyomat");--> statement-breakpoint
CREATE INDEX "jelszo_visszaallitas_fiok" ON "jelszo_visszaallitas" USING btree ("fiok_id");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "jelszo_visszaallitas" TO km_app;
