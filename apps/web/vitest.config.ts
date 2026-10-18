import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["probak/**/*.proba.ts"],
    testTimeout: 20000,
    fileParallelism: false,
    globals: false,
  },
  resolve: {
    alias: {
      "server-only": new URL("./probak/ures.ts", import.meta.url).pathname,
    },
  },
});
