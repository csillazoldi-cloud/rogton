import { describe, it, expect } from "vitest";
import {
  meghiv,
  meghivoElfogad,
  szerepAllit,
  tagEltavolit,
  kilep,
  dont,
} from "@km/hozzaferes-core";
import { hozzaferesKornyezet } from "../src/csatlakozok/hozzaferes-kornyezet.js";

describe("hozzaferes a hoston", () => {
  it("vegigjatsza a meghivas → elfogadas → szerep → eltavolitas kort", async () => {
    const k = hozzaferesKornyezet(":memory:");
    const szervezet_id = "sz-1";

    // A tulajdonos kontextusa — és A TAGSÁGA a tárban (nélküle a tagok listájában nincs tulajdonos, és a szabály nem tud róla)
    const ktxA = { fiok_id: "fiok-A", szervezet_id, szerep: "tulajdonos" as const };
    await k.tagsag.felvesz(szervezet_id, "fiok-A", "tulajdonos", new Date().toISOString());

    // 1. A tulajdonos meghív egy szerkesztőt
    const meghivEredmeny = await meghiv(k, ktxA, {
      szerep: "szerkeszto",
      email: "b@pelda.hu",
    });
    expect(meghivEredmeny.ok).toBe(true);
    if (!meghivEredmeny.ok) throw new Error("nem jo");
    const jegy = meghivEredmeny.ertek.jegy;

    // 2. A jegy beváltása B fiókkal
    const elfogadEredmeny = await meghivoElfogad(k, { fiok_id: "fiok-B" }, jegy);
    expect(elfogadEredmeny.ok).toBe(true);
    if (!elfogadEredmeny.ok) throw new Error("nem jo");
    expect(elfogadEredmeny.ertek.szerep).toBe("szerkeszto");

    // 3. B tag szerkesztő szereppel
    const tagok = await k.tagsag.tagok(szervezet_id);
    const bTag = tagok.find((t) => t.fiok_id === "fiok-B");
    expect(bTag).toBeDefined();
    expect(bTag?.szerep).toBe("szerkeszto");

    // 4. B nem hívhat meg tulajdonost (NAGYOBB_SZEREP)
    const ktxB = { fiok_id: "fiok-B", szervezet_id, szerep: "szerkeszto" as const };
    const bMeghiv = await meghiv(k, ktxB, { szerep: "tulajdonos" });
    expect(bMeghiv.ok).toBe(false);
    if (bMeghiv.ok) throw new Error("nem jo");
    expect(bMeghiv.hiba).toBe("NAGYOBB_SZEREP");

    // 5. A átállítja B-t nézőre
    const allitEredmeny = await szerepAllit(k, ktxA, "fiok-B", "nezo");
    expect(allitEredmeny.ok).toBe(true);
    if (!allitEredmeny.ok) throw new Error("nem jo");
    expect(allitEredmeny.ertek.szerep).toBe("nezo");

    // 6. A nem léphet ki (UTOLSO_TULAJDONOS)
    const kilepEredmeny = await kilep(k, ktxA);
    expect(kilepEredmeny.ok).toBe(false);
    if (kilepEredmeny.ok) throw new Error("nem jo");
    expect(kilepEredmeny.hiba).toBe("UTOLSO_TULAJDONOS");

    // 7. A eltávolítja B-t
    const eltavolitEredmeny = await tagEltavolit(k, ktxA, "fiok-B");
    expect(eltavolitEredmeny.ok).toBe(true);
    if (!eltavolitEredmeny.ok) throw new Error("nem jo");
    expect(eltavolitEredmeny.ertek.fiok_id).toBe("fiok-B");

    // 8. A jegy másodszor MEGHIVO_FELHASZNALVA
    const masodikElfogad = await meghivoElfogad(k, { fiok_id: "fiok-C" }, jegy);
    expect(masodikElfogad.ok).toBe(false);
    if (masodikElfogad.ok) throw new Error("nem jo");
    expect(masodikElfogad.hiba).toBe("MEGHIVO_FELHASZNALVA");

    k.zar();
  });

  it("a dont tiszta fuggveny mukodik a host kontextussal", () => {
    const ktx = {
      fiok_id: "fiok-A",
      szervezet_id: "sz-1",
      szerep: "tulajdonos" as const,
    };
    const eredmeny = dont(ktx, "tag_meghiv", {
      szerep: "szerkeszto",
      tagok: [],
    });
    expect(eredmeny.szabad).toBe(true);
  });
});
