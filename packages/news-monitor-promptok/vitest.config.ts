import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { include: ["probak/**/*.proba.ts"] },
});
