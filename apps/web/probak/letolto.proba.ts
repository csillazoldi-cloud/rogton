import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { cimNormalizal, nyersBajtok, nyilvanosCim, weboldalSzoveg, LetoltesHiba } from "../onboarding/letolto";

describe("cimNormalizal", () => {
  it("normalizalja a cimet https-re", () => {
    const eredmeny = cimNormalizal("mintamuhely.hu");
    expect(eredmeny.href).toBe("https://mintamuhely.hu/");
  });

  it("hibat ad rossz protokollra", () => {
    expect(() => cimNormalizal("ftp://x")).toThrow(LetoltesHiba);
    try {
      cimNormalizal("ftp://x");
    } catch (hiba) {
      expect(hiba).toBeInstanceOf(LetoltesHiba);
      expect((hiba as LetoltesHiba).kod).toBe("FORRAS_ROSSZ_CIM");
    }
  });

  it("hibat ad ervenytelen cimre", () => {
    expect(() => cimNormalizal("nem cím")).toThrow(LetoltesHiba);
    try {
      cimNormalizal("nem cím");
    } catch (hiba) {
      expect(hiba).toBeInstanceOf(LetoltesHiba);
      expect((hiba as LetoltesHiba).kod).toBe("FORRAS_ROSSZ_CIM");
    }
  });
});

describe("nyilvanosCim", () => {
  const tiltottCimek = [
    new URL("http://127.0.0.1/"),
    new URL("http://10.1.2.3/"),
    new URL("http://192.168.1.1/"),
    new URL("http://169.254.1.1/"),
    new URL("http://100.89.241.71/"),
    new URL("http://localhost/"),
    new URL("http://[::1]/"),
    new URL("http://[fd00::1]/"),
  ];

  it.each(tiltottCimek)("elutasitja a tiltott cimet: %s", async (url) => {
    await expect(nyilvanosCim(url)).rejects.toBeInstanceOf(LetoltesHiba);
    try {
      await nyilvanosCim(url);
    } catch (hiba) {
      expect(hiba).toBeInstanceOf(LetoltesHiba);
      expect((hiba as LetoltesHiba).kod).toBe("FORRAS_TILTOTT_CIM");
    }
  });
});

describe("weboldalSzoveg", () => {
  it("elutasitja a 127.0.0.1 cimet a kiszolgalo meghivasa nelkul", async () => {
    // A kiszolgalo nem indul el, mert a szures elobb utasitja el a kerest.
    // Ha a szures nem mukodne, a fetch timeout-olna vagy kapcsolati hibat adna.
    const port = 54321; // veletlen, nem hasznalt port
    let kod: string | undefined;
    try {
      await weboldalSzoveg(`http://127.0.0.1:${port}/`);
    } catch (h) {
      if (h instanceof LetoltesHiba) kod = h.kod;
    }
    expect(kod).toBe("FORRAS_TILTOTT_CIM");
  });
});

// R-16 K7 (TERV §2-K7 Self-test, gepezet 10): a bájt-letöltő a webalkalmazás bejáratán át — egy VALÓDI helyi kiszolgálóval, amely képet
// adna: a szűrés előbb utasít el, a kiszolgálóhoz kérés nem érkezik. (A bináris, az átirányítás, a 2 MB és a text/html esetei hálózat
// nélkül a csomag próbájában: packages/letolto/probak/letolto.proba.ts „nyersBajtok — R-16 K7”.)
describe("nyersBajtok — R-16 K7", () => {
  it("helyi kiszolgáló logója: elutasítva, a kiszolgáló kérést sem kap", async () => {
    let keres = 0;
    const kiszolgalo = createServer((_q, v) => { keres++; v.writeHead(200, { "content-type": "image/png" }); v.end(Buffer.from([0x89, 0x50, 0x4e, 0x47])); });
    await new Promise<void>((r) => kiszolgalo.listen(0, "127.0.0.1", () => r()));
    const port = (kiszolgalo.address() as { port: number }).port;
    const kodok: string[] = [];
    for (const c of [`http://127.0.0.1:${port}/logo.png`, `http://localhost:${port}/logo.png`, `http://[::ffff:127.0.0.1]:${port}/logo.png`]) {
      try { await nyersBajtok(c); kodok.push("nincs hiba"); } catch (h) { kodok.push(h instanceof LetoltesHiba ? h.kod : String(h)); }
    }
    await new Promise<void>((r) => kiszolgalo.close(() => r()));
    // a pont nélküli „localhost” már a cím formáján elbukik (FORRAS_ROSSZ_CIM, cimNormalizal) — ez is elutasítás, hálózat nélkül
    expect(kodok).toEqual(["FORRAS_TILTOTT_CIM", "FORRAS_ROSSZ_CIM", "FORRAS_TILTOTT_CIM"]);
    expect(keres).toBe(0);
  });
});

// Megjegyzes: A letolto.ts modul nem exportal kulon szovegkinyero segedfuggvenyt,
// igy a szovegkinyeres tesztelese kulon nem lehetseges. A weboldalSzoveg a teljes
// folyamatot (letoltes + szures + kinyeres) egyutt vegzi, ami a fenti tesztben
// a tiltott cim szuresere korlatozodik.
