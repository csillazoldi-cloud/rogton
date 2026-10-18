import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar, PROBA_CIM } from "./segedek";

interface FajlMeta {
  id: string;
  tipus: string;
  meret: number;
  nev: string;
  cel: string;
}

describe("arculat fajl feltoltes hibak (V4, 2026-09-18, Vilmos 8.)", () => {
  const jelszo = "ProbaJelszo123!";
  let sutik: string;

  async function fiokLetrehozas(): Promise<string> {
    const email = veletlenEmail();
    const nev = "Proba Felhasznalo";

    const regisztracio = await keres("/api/fiok/regisztracio", {
      modszer: "POST",
      torzs: { nev, email, jelszo },
    });
    expect(regisztracio.statusz).toBe(201);

    const belepes = await keres("/api/fiok/belepes", {
      modszer: "POST",
      torzs: { email, jelszo },
    });
    expect(belepes.statusz).toBe(200);
    const s = belepes.sutik.join("; ");

    const szervezet = await keres("/api/szervezet", {
      modszer: "POST",
      torzs: { nev: "Proba Szervezet" },
      sutik: s,
    });
    expect(szervezet.statusz).toBe(201);

    return s;
  }

  beforeAll(async () => {
    sutik = await fiokLetrehozas();
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("101 MB-os fájl → 413 TUL_NAGY (a valódi okot mondja)", async () => {
    // Elvárás áthelyezve 2026-10-10 (Csilla: az arculati fájl korlátja 10 MB → 100 MB; a logó arculati fájl): 11 MB → 101 MB.
    // 101 MB: a 100 MB-os korlát felett, de az nginx 105 MB-os plafonja alatt (az /api/arculat/fajl útvonalon) —
    // így a kérés eljut a kódhoz, és az adja a TUL_NAGY-ot (nem a proxy vágja el). A 10 MB-os betű/posztkép: nagy-feltoltes.proba.ts.
    const meret = 101 * 1024 * 1024;
    const bajtok = new Uint8Array(meret);
    // PNG fejléc, hogy a típusfelismerés ne bukjon el hamarabb
    bajtok.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: sutik,
        "x-fajl-nev": encodeURIComponent("nagy.png"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: bajtok,
    });

    expect(valasz.status).toBe(413);
    const torzs = (await valasz.json()) as { hiba: string };
    expect(torzs.hiba).toBe("TUL_NAGY");
  });

  it("„.jpg” nevű, de szöveges fájl → 415 TIPUS_NEM_ENGEDETT (a fejléc dönt, nem a kiterjesztés)", async () => {
    const szoveg = "Ez nem kep, csak szoveg. ".repeat(50);
    const bajtok = new TextEncoder().encode(szoveg);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: sutik,
        "x-fajl-nev": encodeURIComponent("hamis.jpg"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: bajtok,
    });

    expect(valasz.status).toBe(415);
    const torzs = (await valasz.json()) as { hiba: string };
    expect(torzs.hiba).toBe("TIPUS_NEM_ENGEDETT");
  });

  it("valódi kis PNG → 201", async () => {
    const pngFejlec = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const tartalom = new Uint8Array(100);
    const bajtok = new Uint8Array(pngFejlec.length + tartalom.length);
    bajtok.set(pngFejlec, 0);
    bajtok.set(tartalom, pngFejlec.length);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: sutik,
        "x-fajl-nev": encodeURIComponent("kis.png"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: bajtok,
    });

    expect(valasz.status).toBe(201);
    const torzs = (await valasz.json()) as { fajl: FajlMeta };
    expect(torzs.fajl.tipus).toBe("png");
    expect(torzs.fajl.cel).toBe("logo");
    expect(torzs.fajl.meret).toBe(bajtok.length);
  });
});

// R-16 K1 (TERV 2-K1): a logó helye (x-logo-valtozat) és a böngésző elemzése (x-logo-elemzes) a feltöltésben, és a GET /api/arculat/logok.
describe("arculat fajl — logóhely és elemzés fejlécben (R-16 K1)", () => {
  const jelszo = "ProbaJelszo123!";
  let sutik: string;
  const png = () => { const b = new Uint8Array(108); b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0); return b; };
  const b64url = (s: string) => Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const elemzes = { atlatszo: true, vilagossag: 0.94, szinszam: 1, arany: 4.2, szinek: [] as string[] };

  async function kuld(nev: string, fejlec: Record<string, string>, cel = "logo") {
    return fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: { cookie: sutik, "x-fajl-nev": encodeURIComponent(nev), "x-fajl-cel": cel, "content-type": "application/octet-stream", ...fejlec },
      body: png(),
    });
  }

  beforeAll(async () => {
    const email = veletlenEmail();
    expect((await keres("/api/fiok/regisztracio", { modszer: "POST", torzs: { nev: "Știință Ioana", email, jelszo } })).statusz).toBe(201);
    const b = await keres("/api/fiok/belepes", { modszer: "POST", torzs: { email, jelszo } });
    sutik = b.sutik.join("; ");
    expect((await keres("/api/szervezet", { modszer: "POST", torzs: { nev: "Știință și Țară SRL" }, sutik })).statusz).toBe(201);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("a hely és az érvényes elemzés tárolódik; a válasz FajlMeta-ja visszaadja", async () => {
    const v = await kuld("Știință – fehér logó.png", { "x-logo-valtozat": "sotet", "x-logo-elemzes": b64url(JSON.stringify(elemzes)) });
    expect(v.status).toBe(201);
    const t = (await v.json()) as { fajl: { logo_valtozat: string; eredet: string; elemzes: unknown } };
    expect(t.fajl.logo_valtozat).toBe("sotet");
    expect(t.fajl.eredet).toBe("feltoltes");
    expect(t.fajl.elemzes).toEqual(elemzes);
  });

  it("hibás elemzés → figyelmen kívül marad (201, elemzes null); hely nélkül a logó világos", async () => {
    const v = await kuld("rossz-elemzes.png", { "x-logo-elemzes": "!!nem-base64!!" });
    expect(v.status).toBe(201);
    const t = (await v.json()) as { fajl: { logo_valtozat: string; elemzes: unknown } };
    expect(t.fajl.logo_valtozat).toBe("vilagos");
    expect(t.fajl.elemzes).toBeNull();
    const w = await kuld("rossz-sema.png", { "x-logo-valtozat": "egyszinu", "x-logo-elemzes": b64url(JSON.stringify({ ...elemzes, vilagossag: 7 })) });
    expect(w.status).toBe(201);
    expect(((await w.json()) as { fajl: { elemzes: unknown } }).fajl.elemzes).toBeNull();
  });

  it("x-logo-valtozat=foo → 400 ERVENYTELEN_ADAT (és nem kerül fájl a tárba)", async () => {
    const v = await kuld("foo.png", { "x-logo-valtozat": "foo" });
    expect(v.status).toBe(400);
    expect(((await v.json()) as { hiba: string }).hiba).toBe("ERVENYTELEN_ADAT");
  });

  it("más célnál a hely és az elemzés nem tárolódik", async () => {
    const v = await kuld("kézikönyv.png", { "x-logo-valtozat": "sotet", "x-logo-elemzes": b64url(JSON.stringify(elemzes)) }, "kezikonyv");
    expect(v.status).toBe(201);
    const t = (await v.json()) as { fajl: { logo_valtozat: unknown; elemzes: unknown } };
    expect(t.fajl.logo_valtozat).toBeNull();
    expect(t.fajl.elemzes).toBeNull();
  });

  it("GET /api/arculat/logok: helyenként a legfrissebb képre alkalmas fájl", async () => {
    const v = await keres<{ logok: Record<string, { nev: string } | null> }>("/api/arculat/logok", { sutik });
    expect(v.statusz).toBe(200);
    expect(v.torzs.logok["sotet"]?.nev).toBe("Știință – fehér logó.png");
    expect(v.torzs.logok["egyszinu"]?.nev).toBe("rossz-sema.png");
    expect(v.torzs.logok["vilagos"]?.nev).toBe("rossz-elemzes.png");
    expect(v.torzs.logok["negyzetes"]).toBeNull();
  });
});
