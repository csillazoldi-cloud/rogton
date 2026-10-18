766-
767-// F9-A2: az összkép tárolva — futásonként egyszer készül (apps/web/hirfigyelo/osszkep.ts).
768:export const hfOsszkep = pgTable(
769-  "hf_osszkep",
770-  {
771-    szervezetId: uuid("szervezet_id").primaryKey().references(() => szervezet.id, { onDelete: "cascade" }),
772-    futasId: uuid("futas_id"),
773-    osszkep: jsonb("osszkep"),
774-    hibaIdeje: timestamp("hiba_ideje", { withTimezone: true }),
775-    frissitve: timestamp("frissitve", { withTimezone: true }).notNull().defaultNow(),
776-  },
777-  (t) => [
778-    pgPolicy("hf_osszkep_sajat", {
779-      for: "all",
780-      to: "km_app",
781-      using: sql`szervezet_id = ${aktualisSzervezet}`,
782-      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
783-    }),
784-  ],
// A befogadó alkalmazás adatbázisa — ALAPTERV 3. pont: fiók, szervezet, tagság gazdája az apps/web.
// Minden ügyféladatot hordozó tábla első oszlopa a szervezet azonosítója, és az adatbázis maga
// kényszeríti ki az elválasztást (sorszintű védelem) — nem a program jóindulata.
import { sql } from "drizzle-orm";
import { pgTable, pgPolicy, uuid, text, timestamp, pgEnum, primaryKey, uniqueIndex, index, integer, jsonb, boolean, numeric } from "drizzle-orm/pg-core";

// NULLIF: egy lezárt tranzakció után a beállítás üres szöveg marad, nem NULL — az üres szövegből nem lesz uuid.
/** Az aktuális szervezet — szervezetKent(...) állítja be (set_config('app.szervezet_id')). */
const aktualisSzervezet = sql`nullif(current_setting('app.szervezet_id', true), '')::uuid`;
/** Az aktuális fiók — fiokKent(...) állítja be (set_config('app.fiok_id')). */
const aktualisFiok = sql`nullif(current_setting('app.fiok_id', true), '')::uuid`;

16:export const szervezet = pgTable(
17-  "szervezet",
18-  {
19-    id: uuid("id").primaryKey().defaultRandom(),
20-    nev: text("nev").notNull(),
21-    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
22-    // E-39: a szervezet havi AI-kerete USD-ben. NULL = az AI_HAVI_KERET_USD alapérték érvényes rá.
