import type { NextConfig } from "next";

const config: NextConfig = {
  // Önálló csomag: a dobozba csak a futáshoz kellő fájlok kerülnek, nem az egész node_modules.
  output: "standalone",
  // A munkaterület csomagjait (pl. @rogton/contracts) forrásból fordítjuk.
  transpilePackages: ["@rogton/contracts", "@rogton/design-system", "@rogton/ai-adapters"],
  poweredByHeader: false,
  // A Next 16 dev-kiszolgálója AGENTS.md/CLAUDE.md fájlokat generálna az apps/web mappába — a tárhely belépési pontja a gyökér CLAUDE.md, ezt nem kérjük.
  agentRules: false,
};

export default config;
