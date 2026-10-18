// a) alapból SEMMI nem megy ki; b) közös "kimeno" a futas_hiba-ra → kimegy, feliratozóból;
// c) szervezeti felülírás "nincs" a közös "kimeno" fölött → nem megy ki;
// d) a csatorna hibája → tárban ott az esemény, kikuldve:false, kuldesHiba kitöltve;
// e) ismeretlen fajta → ISMERETLEN_FAJTA, a tárban semmi.
import { describe, expect, it } from "vitest";
import { feljegyez } from "../src/index";
import {
  egyszeruFeliratozo,
  gyujtoCsatorna,
  kornyezet,
  memoriaErtesites,
  memoriaTar,
} from "./segedek";

describe("feljegyez — alap és küldés", () => {
  it("a) alapból semmi nem megy ki, a tárban 1 esemény", async () => {
    const tar = memoriaTar();
    const csatorna = gyujtoCsatorna();
    const k = kornyezet({ tar, csatorna });

    const eredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "belepes",
      fiok_id: "f-1",
    });

    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;
    expect(eredmeny.ertek.kikuldve).toBe(false);
    expect(eredmeny.ertek.kuldesHiba).toBeNull();
    expect(tar._osszes).toHaveLength(1);
    expect(csatorna._kuldott).toHaveLength(0);
  });

  it("b) közös kimeno a futas_hiba-ra → kimegy, a cím/szöveg a feliratozóból", async () => {
    const tar = memoriaTar();
    const ertesites = memoriaErtesites();
    await ertesites.kozosMent({ futas_hiba: "kimeno" });
    const csatorna = gyujtoCsatorna();
    const felirat = egyszeruFeliratozo({
      "esemeny.futas_hiba_cim": "Futáshiba",
      "esemeny.futas_hiba_szoveg": "A(z) {futas} futás hibára futott.",
    });
    const k = kornyezet({ tar, ertesites, csatorna, felirat });

    const eredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "futas_hiba",
      adat: { futas: "napi-ellenorzes" },
    });

    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;
    expect(eredmeny.ertek.kikuldve).toBe(true);
    expect(eredmeny.ertek.kuldesHiba).toBeNull();
    expect(csatorna._kuldott).toHaveLength(1);
    expect(csatorna._kuldott[0]?.cim).toBe("Futáshiba");
    expect(csatorna._kuldott[0]?.szoveg).toBe("A(z) napi-ellenorzes futás hibára futott.");
    expect(csatorna._kuldott[0]?.fajta).toBe("futas_hiba");
    expect(csatorna._kuldott[0]?.sulyossag).toBe("hiba");
  });

  it("c) szervezeti felülírás nincs a közös kimeno fölött → nem megy ki", async () => {
    const tar = memoriaTar();
    const ertesites = memoriaErtesites();
    await ertesites.kozosMent({ futas_hiba: "kimeno" });
    await ertesites.szervezetiMent("sz-1", { futas_hiba: "nincs" });
    const csatorna = gyujtoCsatorna();
    const k = kornyezet({ tar, ertesites, csatorna });

    const eredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "futas_hiba",
    });

    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;
    expect(eredmeny.ertek.kikuldve).toBe(false);
    expect(csatorna._kuldott).toHaveLength(0);
    expect(tar._osszes).toHaveLength(1);
  });

  it("d) a csatorna hibája → tárban ott az esemény, kikuldve:false, kuldesHiba kitöltve", async () => {
    const tar = memoriaTar();
    const ertesites = memoriaErtesites();
    await ertesites.kozosMent({ futas_hiba: "kimeno" });
    const csatorna = gyujtoCsatorna();
    csatorna._hiba = "halozat hiba";
    const k = kornyezet({ tar, ertesites, csatorna });

    const eredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "futas_hiba",
    });

    expect(eredmeny.ok).toBe(true);
    if (!eredmeny.ok) return;
    expect(eredmeny.ertek.kikuldve).toBe(false);
    expect(eredmeny.ertek.kuldesHiba).toBe("halozat hiba");
    expect(tar._osszes).toHaveLength(1);
  });

  it("e) ismeretlen fajta → ISMERETLEN_FAJTA, a tárban semmi", async () => {
    const tar = memoriaTar();
    const k = kornyezet({ tar });

    const eredmeny = await feljegyez(k, {
      szervezet_id: "sz-1",
      fajta: "nincs_ilyen" as never,
    });

    expect(eredmeny.ok).toBe(false);
    if (eredmeny.ok) return;
    expect(eredmeny.hiba).toBe("ISMERETLEN_FAJTA");
    expect(tar._osszes).toHaveLength(0);
  });
});
