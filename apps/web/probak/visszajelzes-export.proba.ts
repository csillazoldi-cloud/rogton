import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { keres, veletlenEmail, takaritas, lezar } from "./segedek";

// V5b: beküldés után a lista.json létrejön és tartalmazza a beküldött szöveget.

describe("Visszajelzés export (V5b)", () => {
  let sutik: string;
  const jelszo = "ProbaJelszo123!";
  const szoveg = `proba-szoveg-${crypto.randomUUID().slice(0, 8)}`;

  beforeAll(async () => {
    const email = veletlenEmail();
    const reg = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev: "Proba Export", email, jelszo },
    });
    expect(reg.statusz).toBe(201);

    const bel = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(bel.statusz).toBe(200);
    sutik = bel.sutik.join("; ");

    const sz = await keres("/api/szervezet", {
      modszer: "POST",
      sutik,
      torzs: { nev: "Szervezet Export" },
    });
    expect(sz.statusz).toBe(201);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("beküldés után a lista.json létezik és tartalmazza a szöveget", async () => {
    const bekuld = await keres("/api/visszajelzes", {
      modszer: "POST",
      sutik,
      torzs: {
        lap: "/proba",
        lap_cim: "Próba lap",
        elem: null,
        kijelolt_szoveg: "",
        szoveg,
        nyelv: "hu",
        kep: null,
        ablak: { w: 1000, h: 800 },
      },
    });
    expect(bekuld.statusz).toBe(201);

    const mappa = process.env.FAJL_MAPPA ?? "./adatok/fajlok";
    const ut = join(mappa, "visszajelzes", "lista.json");
    const tartalom = await readFile(ut, "utf8");
    expect(tartalom).toContain(szoveg);
  });
});
