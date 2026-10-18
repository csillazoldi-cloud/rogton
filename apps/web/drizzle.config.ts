import { defineConfig } from "drizzle-kit";

// Csak a migrációs SQL előállításához (pnpm sema). Az alkalmazás futás közben nem használja.
export default defineConfig({
  dialect: "postgresql",
  schema: "./adatbazis/sema.ts",
  out: "./adatbazis/migraciok",
  casing: "snake_case",
});
