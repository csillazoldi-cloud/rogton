-- 0185: G9 (Rögtön, 2026-10-18 16:05 döntés) — az oldal kapuja: EGY közös jelszó minden előtt (KAPU_JELSZO a .env-ben), a
--   Cloudflare Access helyett. Döntés: docs/decisions/2026-10-18-g9-kapu.md.
--   1. kapu_jegy — a kapu sütijeinek jegyei. A jegyet magát nem tároljuk, csak a SHA-256 lenyomatát (id), mellette a jelszó
--      lenyomatát (jelszócsere = minden régi süti érvénytelen) és a cím lenyomatát. HOST-szintű, mint a belepesi_kiserlet: NINCS
--      sorszintű védelem (nem ügyféladat, és minden kérés előtt, szervezet nélkül kell olvasni). Minden eszköz kiléptetése:
--      TRUNCATE kapu_jegy (uzem/README.md, Runbook). Kicsi marad: a lejárt jegyeket az új jegy kiadása takarítja.
--   2. A kapu lapjának feliratai (kapu.*; hu/ro/en — a felület csak magyart mutat, G3).
--   A rossz próbálkozások a meglévő belepesi_kiserlet táblába mennek („kapu” fajta; a fajta oszlop szöveg, nincs rajta megkötés).
--   Ismételhető.
--
-- Próbafuttatás (várt kimenet: CREATE TABLE, CREATE INDEX, GRANT, INSERT 0 18, ROLLBACK):
--   { echo "BEGIN;"; cat apps/web/adatbazis/migraciok/0185_g9_kapu.sql; echo "ROLLBACK;"; } | docker exec -i gma-db psql -v ON_ERROR_STOP=1 -U km_tulaj -d km

CREATE TABLE IF NOT EXISTS "kapu_jegy" (
	-- a jegy SHA-256 lenyomata (hex); magát a jegyet SEHOL nem tároljuk
	"id" text PRIMARY KEY NOT NULL,
	-- a kiadáskor érvényes jelszó lenyomata (HMAC-SHA256); ha a KAPU_JELSZO változik, a jegy nem egyezik többé
	"jelszo_lenyomat" text NOT NULL,
	"letrehozva" timestamp with time zone DEFAULT now() NOT NULL,
	"lejar" timestamp with time zone NOT NULL,
	-- óránként legfeljebb egyszer frissül
	"utolso_hasznalat" timestamp with time zone DEFAULT now() NOT NULL,
	-- a kérő címének csonkolt HMAC-lenyomata (nem visszafejthető; tájékoztatásul)
	"ip_hash" text NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kapu_jegy_lejar_idx" ON "kapu_jegy" USING btree ("lejar");--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON "kapu_jegy" TO km_app;--> statement-breakpoint

INSERT INTO "felirat" ("kulcs", "nyelv", "szoveg") VALUES
  ('kapu.oldalcim', 'hu', 'Rögtön'),
  ('kapu.oldalcim', 'ro', 'Rögtön'),
  ('kapu.oldalcim', 'en', 'Rögtön'),
  ('kapu.jelszo', 'hu', 'Jelszó'),
  ('kapu.jelszo', 'ro', 'Parolă'),
  ('kapu.jelszo', 'en', 'Password'),
  ('kapu.belepes', 'hu', 'Belépés'),
  ('kapu.belepes', 'ro', 'Intră'),
  ('kapu.belepes', 'en', 'Sign in'),
  ('kapu.rossz', 'hu', 'Nem jó a jelszó.'),
  ('kapu.rossz', 'ro', 'Parola nu este bună.'),
  ('kapu.rossz', 'en', 'That is not the password.'),
  ('kapu.sok', 'hu', 'Túl sok próbálkozás. Próbáld 15 perc múlva.'),
  ('kapu.sok', 'ro', 'Prea multe încercări. Încearcă peste 15 minute.'),
  ('kapu.sok', 'en', 'Too many attempts. Try again in 15 minutes.'),
  ('kapu.zarva', 'hu', 'A belépés most nem elérhető.'),
  ('kapu.zarva', 'ro', 'Intrarea nu este disponibilă acum.'),
  ('kapu.zarva', 'en', 'Signing in is not available right now.')
ON CONFLICT ("kulcs", "nyelv") DO UPDATE SET "szoveg" = EXCLUDED."szoveg", "frissitve" = now();
