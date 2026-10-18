// G5b (Rögtön, 2026-10-18): nincs „teszt” jelzés, a felület UI-betűje (gomb, menü, címke) Saira Condensed — a JetBrains Mono csak a
// valódi kód/azonosító helyeken (--font-mono) —, és a lap nem tölt betűt a Google-ről a látogató böngészőjébe.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AlapTokenek, R18_KOZOS, modCss, modTokenek } from "@rogton/design-system";
import alapJson from "@rogton/design-system/tema-alap.json";
import { PROBA_CIM } from "./segedek";

const olvas = (ut: string) => readFileSync(new URL(`../../../${ut}`, import.meta.url), "utf8");
const alap = AlapTokenek.parse((alapJson as { tokens: unknown }).tokens);

describe("G5b", () => {
  it("a fejlécben nincs „teszt” jelvény, a verziósor végén nincs „· teszt”", () => {
    expect(olvas("apps/web/app/_kozos/Keretek.tsx")).not.toContain("kozos.teszt_jelveny");
    expect(olvas("apps/web/adatbazis/migraciok/0183_g5b_teszt_jelzes_nelkul.sql")).toContain("('kezdolap.sor', 'hu', 'Rögtön · {verzio}')");
  });
  it("UI-betű: Saira Condensed mindkét módban; a kód-helyek a --font-mono-t használják", () => {
    for (const mod of ["sotet", "vilagos"] as const) {
      const t = modTokenek(alap, mod);
      expect(t["--font-code"]).toMatch(/^'Saira Condensed'/);
    }
    // a --font-mono mód-független R-18 token: mindkét mód blokkjába bekerül
    expect(R18_KOZOS["--font-mono"]).toMatch(/^'JetBrains Mono'/);
    expect(modCss(alap)).toContain("--font-mono:'JetBrains Mono',monospace");
    expect(olvas("apps/web/app/tema/tema.css")).toContain(".km-tema-kod { color: var(--text-faint); font-family: var(--font-mono, var(--font-code-active))");
  });
  it("a lap feje nem hivatkozik a Google Fonts-ra", () => {
    expect(olvas("apps/web/app/layout.tsx")).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
  it("élő lap (ha van próbakörnyezet): nincs jelvény, nincs Google-betű", async () => {
    const cim = process.env.PROBA_CIM;
    if (!cim) return;
    const html = await (await fetch(`${PROBA_CIM}/belepes`)).text();
    expect(html).not.toContain("km-jelveny");
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
    expect(html).toContain("--font-code:'Saira Condensed'");
  });
});
