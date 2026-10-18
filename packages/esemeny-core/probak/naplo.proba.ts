// h) ertesitesSzervezetiMent nézőként NINCS_JOG, tulajdonosként ok, ismeretlen fajta → ERVENYTELEN_ADAT;
// i) naplo legújabb elöl, limit.
import { describe, expect, it } from "vitest";
import {
  ertesitesSzervezetiMent,
  feljegyez,
  naplo,
} from "../src/index";
import { kornyezet, ktx, memoriaErtesites, memoriaTar } from "./segedek";

describe("ertesitesSzervezetiMent", () => {
  it("h) nézőként NINCS_JOG", async () => {
    const k = kornyezet();
    const eredmeny = await ertesitesSzervezetiMent(k, ktx("nezo"), { futas_hiba: "kimeno" });
    expect(eredmeny.ok).toBe(false);
    if (eredmeny.ok) return;
    expect(eredmeny.hiba).toBe("NINCS_JOG");
  });

  it("h) tulajdonosként ok", async () => {
    const ertesites = memoriaErtesites();
    const k = kornyezet({ ertesites });
    const eredmeny = await ertesitesSzervezetiMent(k, ktx("tulajdonos"), { futas_hiba: "kimeno" });
    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;
    expect(eredmeny.ertek.futas_hiba).toBe("kimeno");
    const mentett = await ertesites.szervezeti("sz-1");
    expect(mentett.futas_hiba).toBe("kimeno");
  });

  it("h) ismeretlen fajta a testben → ERVENYTELEN_ADAT", async () => {
    const k = kornyezet();
    const eredmeny = await ertesitesSzervezetiMent(k, ktx("tulajdonos"), {
      nincs_ilyen: "kimeno",
    });
    expect(eredmeny.ok).toBe(false);
    if (eredmeny.ok) return;
    expect(eredmeny.hiba).toBe("ERVENYTELEN_ADAT");
  });
});

describe("naplo", () => {
  it("i) legújabb elöl, limit", async () => {
    const tar = memoriaTar();
    const k = kornyezet({ tar });

    await feljegyez(k, { szervezet_id: "sz-1", fajta: "belepes" });
    await feljegyez(k, { szervezet_id: "sz-1", fajta: "kilepes" });
    await feljegyez(k, { szervezet_id: "sz-1", fajta: "futas_kesz" });

    const mind = await naplo(k, ktx("nezo"));
    expect(mind.ok).toBe(true);
    if (!mind.ok) return;
    expect(mind.ertek).toHaveLength(3);
    expect(mind.ertek[0]?.fajta).toBe("futas_kesz");
    expect(mind.ertek[2]?.fajta).toBe("belepes");

    const korlatozott = await naplo(k, ktx("nezo"), { limit: 2 });
    expect(korlatozott.ok).toBe(true);
    if (!korlatozott.ok) return;
    expect(korlatozott.ertek).toHaveLength(2);
    expect(korlatozott.ertek[0]?.fajta).toBe("futas_kesz");
    expect(korlatozott.ertek[1]?.fajta).toBe("kilepes");
  });
});
