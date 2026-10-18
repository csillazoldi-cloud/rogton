// apps/web/adatbazis/sema.ts — RÉSZLET (a csomag tábla)
// F-7a (D-F35): csomagok — host-adat (nincs sorszintű védelem), a km_app csak olvassa. Ár és pénznem a pilotban NULL.
// ---------------------------------------------------------------------------
export const csomag = pgTable("csomag", {
  kod: text("kod").primaryKey(),
  modulok: text("modulok").array().notNull().default([]),
  arHavi: numeric("ar_havi", { precision: 10, scale: 2 }),
  penznem: text("penznem"),
  letrehozva: timestamp("letrehozva", { withTimezone: true }).notNull().defaultNow(),
});
