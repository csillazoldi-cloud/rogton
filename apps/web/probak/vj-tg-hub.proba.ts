// Csilla 2026-10-10 21:55: a reggeli (08:00) tesztelői Telegram-üzenet záró sora — vj.tg_hub (0161), csak a reggeli üzenetben.
// Fájlolvasás, adatbázis nélkül (a sorrendet és a csonkolást a packages/visszajelzes-core/probak/ertesites.proba.ts méri).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gy = (ut: string) => new URL(`../../../${ut}`, import.meta.url).pathname;
const olvas = (ut: string) => readFileSync(gy(ut), "utf8");

describe("vj.tg_hub", () => {
  it("0161: a kulcs mindhárom nyelven, link nélkül", () => {
    const m = olvas("apps/web/adatbazis/migraciok/0161_vj_tg_hub.sql");
    expect(m).toContain("('vj.tg_hub', 'hu', 'Nézd meg a hub kártyát is — lehet új tesztfeladat.')");
    for (const ny of ["ro", "en"]) expect(m).toContain(`('vj.tg_hub', '${ny}', `);
    expect(/https?:\/\//.test(m.split("INSERT")[1]!)).toBe(false);
  });
  // G4 (Rögtön, 2026-10-18): a visszajelzésekről nincs kimenő értesítés (Telegram / hub) — a küldő (apps/web/visszajelzes/ertesites.ts)
  // kikerült. A próba most azt őrzi, hogy NE is legyen visszacsempészve, és a futtató ne hívja.
  it("nincs kimenő visszajelzés-értesítő (Telegram / hub), a futtató sem hívja", () => {
    expect(() => olvas("apps/web/visszajelzes/ertesites.ts")).toThrow();
    expect(olvas("apps/web/hirfigyelo/futtato.ts")).not.toMatch(/ertesitesekTick|api\.telegram\.org|HUB_FEEDBACK_URL/);
  });
});
