// apps/web/adatbazis/sema.ts — RÉSZLET (hf_sor)
export const hfSor = pgTable(
  "hf_sor",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    szervezetId: uuid("szervezet_id")
      .notNull()
      .references(() => szervezet.id, { onDelete: "cascade" }),
    fajta: text("fajta", { enum: ["futas", "ertekeles_ujra", "napi", "kiprobal"] }).notNull(),
    adat: jsonb("adat").notNull().default({}),
    allapot: text("allapot", { enum: ["var", "fut", "kesz", "hiba"] }).notNull().default("var"),
    kiserlet: integer("kiserlet").notNull().default(0),
    letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
    kezdve: timestamp("kezdve", { withTimezone: true }),
    vege: timestamp("vege", { withTimezone: true }),
    hibaOk: text("hiba_ok"),
    eredmeny: jsonb("eredmeny"),
  },
  (t) => [
    index("hf_sor_allapot_letrehozva_idx").on(t.allapot, t.letrehozva),
  ],
);

// ---------------------------------------------------------------------------
