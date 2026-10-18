import type { NextConfig } from "next";

const config: NextConfig = {
  // Önálló csomag: a dobozba csak a futáshoz kellő fájlok kerülnek, nem az egész node_modules.
  output: "standalone",
  // A munkaterület csomagjait (pl. @rogton/contracts) forrásból fordítjuk.
  transpilePackages: ["@rogton/contracts", "@rogton/design-system", "@rogton/ai-adapters"],
  poweredByHeader: false,
  // G9 (proxy.ts, az oldal kapuja): a proxy előtt a Next a kérés törzsét memóriába másolja, alapból 10 MB-ig, fölötte CSONKOLVA adja
  // tovább. A rendes feltöltések kódja 10 MB-nál a saját 413-át adja, az nginx 12 MB-ot enged át — ezért 12 MB, hogy a törzs ép
  // maradjon és a barátságos 413 megmaradjon. A 95 MB-os arculati feltöltés útja a proxyt kikerüli (proxy.ts matcher).
  experimental: { proxyClientMaxBodySize: "12mb" },
  // G4 (Rögtön, 2026-10-18): az ai/index.ts `join(process.cwd(), "prompts", …)` olvasása miatt a nyomkövető az EGÉSZ apps/web
  // mappát bevitte az önálló csomagba (458 .ts forrás, a próbák, a feliratok JSON-jai) — így a forráskód megjegyzései a dobozba
  // kerültek. A futáshoz csak a lefordított .next/server kell és a prompts/*.md; a többit kizárjuk, a promptokat név szerint kérjük.
  outputFileTracingIncludes: { "/**": ["./prompts/*.md"] },
  outputFileTracingExcludes: {
    "/**": ["./probak/**", "./**/*.ts", "./**/*.tsx", "./**/*.sql", "./feliratok/**", "./tsconfig*.json", "./*.tsbuildinfo", "./adatbazis/**"],
  },
  // A Next 16 dev-kiszolgálója AGENTS.md/CLAUDE.md fájlokat generálna az apps/web mappába — a tárhely belépési pontja a gyökér CLAUDE.md, ezt nem kérjük.
  agentRules: false,
};

export default config;
