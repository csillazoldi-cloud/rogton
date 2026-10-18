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

export const szerep = pgEnum("szerep", ["tulajdonos", "szerkeszto", "nezo"]);

/** Szervezet = az ügyfél: a fizetési és adatgazdai egység. */
export const szervezet = pgTable(
  "szervezet",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nev: text("nev").notNull(),
// … (kihagyva) …
export const hfFutas = pgTable(
  "hf_futas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id").notNull().references(() => szervezet.id, { onDelete: "cascade" }),
    szabalyVerzio: integer("szabaly_verzio").notNull(),
    kezdet: timestamp("kezdet", { withTimezone: true }).notNull(),
    veg: timestamp("veg", { withTimezone: true }),
    allapot: text("allapot", { enum: ["indul", "fut", "kesz", "reszleges", "hiba", "ai_fuggoben"] }).notNull(),
    ujTalalatok: integer("uj_talalatok").notNull().default(0),
    hibasForrasok: jsonb("hibas_forrasok").notNull().default([]),
    proba: boolean("proba").notNull().default(false),
  },
  (t) => [
    index("hf_futas_szervezet_idx").on(t.szervezetId),
    pgPolicy("hf_futas_sajat", {
      for: "all",
      to: "km_app",
      using: sql`szervezet_id = ${aktualisSzervezet}`,
      withCheck: sql`szervezet_id = ${aktualisSzervezet}`,
    }),
  ],
).enableRLS();
