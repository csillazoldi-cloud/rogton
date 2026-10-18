import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { keres, veletlenEmail, takaritas, lezar, PROBA_CIM } from "./segedek";

interface Esemeny {
  id: string;
  szervezet_id: string;
  fajta: string;
  sulyossag: string;
  fiok_id: string;
  ido: string;
  adat: unknown;
}

interface FajlMeta {
  id: string;
  tipus: string;
  meret: number;
  nev: string;
  cel: string;
}

describe("esemenynaplo, ertesites, AI-kapcsolo (F-5)", () => {
  const jelszo = "ProbaJelszo123!";
  let aSutik: string;
  let aSzervezetId: string;
  let bSutik: string;
  let cSutik: string;
  let cSzervezetId: string;

  async function fiokLetrehozas(szervezet: boolean): Promise<{ sutik: string; fiokId: string; szervezetId?: string }> {
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
    const sutik = belepes.sutik.join("; ");

    const fiokEn = await keres<unknown>("/api/fiok/en", { sutik });
    expect(fiokEn.statusz).toBe(200);
    const fiokTorzs = fiokEn.torzs as { id: string };
    const fiokId = fiokTorzs.id;

    let szervezetId = "";
    if (szervezet) {
      const szervezet = await keres("/api/szervezet", {
        modszer: "POST",
        torzs: { nev: "Proba Szervezet" },
        sutik,
      });
      expect(szervezet.statusz).toBe(201);
      const szervezetTorzs = szervezet.torzs as { id: string };
      szervezetId = szervezetTorzs.id;
    }

    return { sutik, fiokId, szervezetId };
  }

  beforeAll(async () => {
    const a = await fiokLetrehozas(true);
    aSutik = a.sutik;
    aSzervezetId = a.szervezetId!;

    const b = await fiokLetrehozas(false);
    bSutik = b.sutik;

    const c = await fiokLetrehozas(true);
    cSutik = c.sutik;
    cSzervezetId = c.szervezetId!;

    // A meghív B-t nézőnek
    const meghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { szerep: "nezo" },
    });
    expect(meghivo.statusz).toBe(201);
    const jegy = (meghivo.torzs as { hozzaferes: { jegy: string } }).hozzaferes.jegy;

    // B beváltja
    const elfogad = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { jegy },
    });
    expect(elfogad.statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("A GET /api/esemenyek tartalmazza a beforeAll eseményeit", async () => {
    const valasz = await keres<unknown>("/api/esemenyek?limit=50", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { esemeny: Esemeny[] };
    const fajtak = torzs.esemeny.map((e) => e.fajta);
    // a belépés fiókszintű esemény (szervezet nélkül) — a munkatér naplójában nem jelenik meg
    expect(fajtak).toContain("meghivo_kiadva");
    expect(fajtak).toContain("meghivo_elfogadva");
  });

  it("B (néző) is olvashatja A eseményeit", async () => {
    const valasz = await keres<unknown>("/api/esemenyek?limit=50", { sutik: bSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { esemeny: Esemeny[] };
    expect(torzs.esemeny.length).toBeGreaterThan(0);
  });

  it("C nem látja A eseményeit", async () => {
    const valasz = await keres<unknown>("/api/esemenyek?limit=50", { sutik: cSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { esemeny: Esemeny[] };
    const aEsemenyek = torzs.esemeny.filter((e) => e.szervezet_id === aSzervezetId);
    expect(aEsemenyek.length).toBe(0);
  });

  it("GET /api/ertesites → 200, beallitas mezők", async () => {
    const valasz = await keres<unknown>("/api/ertesites", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { beallitas: { kozos: boolean; szervezeti: boolean; hatasos: boolean } };
    expect(torzs.beallitas).toHaveProperty("kozos");
    expect(torzs.beallitas).toHaveProperty("szervezeti");
    expect(torzs.beallitas).toHaveProperty("hatasos");
  });

  it("PUT /api/ertesites (tulajdonos) → 200", async () => {
    const valasz = await keres<unknown>("/api/ertesites", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { futas_hiba: "kimeno" },
    });
    expect(valasz.statusz).toBe(200);
  });

  it("PUT /api/ertesites (néző) → 403", async () => {
    const valasz = await keres<unknown>("/api/ertesites", {
      modszer: "PUT",
      sutik: bSutik,
      torzs: { futas_hiba: "kimeno" },
    });
    expect(valasz.statusz).toBe(403);
  });

  it("PUT /api/ertesites ismeretlen fajta → 400", async () => {
    const valasz = await keres<unknown>("/api/ertesites", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { valami: "kimeno" },
    });
    expect(valasz.statusz).toBe(400);
  });

  it("GET /api/beallitas/ai → 200, ai_engedelyezve: true", async () => {
    const valasz = await keres<unknown>("/api/beallitas/ai", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { beallitas: { ai_engedelyezve: boolean } };
    expect(torzs.beallitas.ai_engedelyezve).toBe(true);
  });

  it("PUT /api/beallitas/ai (tulajdonos) → 200; AI kikapcsolva", async () => {
    const valasz = await keres<unknown>("/api/beallitas/ai", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { engedelyezve: false },
    });
    expect(valasz.statusz).toBe(200);
  });

  it("AI kikapcsolva: POST /api/onboarding/osszefoglalo → 409 AI_KIKAPCSOLVA", async () => {
    const valasz = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { forras_tipus: "leiras", leiras: "Ez egy próba leírás, elég hosszú." },
    });
    expect(valasz.statusz).toBe(409);
    const torzs = valasz.torzs as { hiba: string };
    expect(torzs.hiba).toBe("AI_KIKAPCSOLVA");
  });

  it("AI visszakapcsolva: POST /api/onboarding/osszefoglalo → nem 409", async () => {
    const valasz = await keres<unknown>("/api/beallitas/ai", {
      modszer: "PUT",
      sutik: aSutik,
      torzs: { engedelyezve: true },
    });
    expect(valasz.statusz).toBe(200);

    const osszefoglalo = await keres<unknown>("/api/onboarding/osszefoglalo", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { forras_tipus: "leiras", leiras: "Ez egy próba leírás, elég hosszú." },
    });
    expect(osszefoglalo.statusz).not.toBe(409);
  });

  it("Az események közt megjelenik ai_kapcsolo_valtozott", async () => {
    const valasz = await keres<unknown>("/api/esemenyek?limit=50", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { esemeny: Esemeny[] };
    const fajtak = torzs.esemeny.map((e) => e.fajta);
    expect(fajtak).toContain("ai_kapcsolo_valtozott");
  });
});

describe("fajlfeltoltes (F-6)", () => {
  const jelszo = "ProbaJelszo123!";
  let aSutik: string;
  let logoId = "";
  let aSzervezetId: string;
  let bSutik: string;
  let cSutik: string;
  let cSzervezetId: string;

  async function fiokLetrehozas(szervezet: boolean): Promise<{ sutik: string; fiokId: string; szervezetId?: string }> {
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
    const sutik = belepes.sutik.join("; ");

    const fiokEn = await keres<unknown>("/api/fiok/en", { sutik });
    expect(fiokEn.statusz).toBe(200);
    const fiokTorzs = fiokEn.torzs as { id: string };
    const fiokId = fiokTorzs.id;

    let szervezetId = "";
    if (szervezet) {
      const szervezet = await keres("/api/szervezet", {
        modszer: "POST",
        torzs: { nev: "Proba Szervezet" },
        sutik,
      });
      expect(szervezet.statusz).toBe(201);
      const szervezetTorzs = szervezet.torzs as { id: string };
      szervezetId = szervezetTorzs.id;
    }

    return { sutik, fiokId, szervezetId };
  }

  beforeAll(async () => {
    const a = await fiokLetrehozas(true);
    aSutik = a.sutik;
    aSzervezetId = a.szervezetId!;

    const b = await fiokLetrehozas(false);
    bSutik = b.sutik;

    const c = await fiokLetrehozas(true);
    cSutik = c.sutik;
    cSzervezetId = c.szervezetId!;

    // A meghív B-t nézőnek
    const meghivo = await keres<unknown>("/api/tagok/meghivo", {
      modszer: "POST",
      sutik: aSutik,
      torzs: { szerep: "nezo" },
    });
    expect(meghivo.statusz).toBe(201);
    const jegy = (meghivo.torzs as { hozzaferes: { jegy: string } }).hozzaferes.jegy;

    // B beváltja
    const elfogad = await keres<unknown>("/api/meghivo/elfogad", {
      modszer: "POST",
      sutik: bSutik,
      torzs: { jegy },
    });
    expect(elfogad.statusz).toBe(200);
  });

  afterAll(async () => {
    await takaritas();
    await lezar();
  });

  it("PNG feltöltés → 201, fajl meta", async () => {
    const pngFejlec = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const tartalom = new Uint8Array(100);
    const bajtok = new Uint8Array(pngFejlec.length + tartalom.length);
    bajtok.set(pngFejlec, 0);
    bajtok.set(tartalom, pngFejlec.length);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: aSutik,
        "x-fajl-nev": encodeURIComponent("logo.png"),
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
    logoId = torzs.fajl.id;
  });

  it("T-13: a feltöltés eseménye (fajl_feltoltve) az eseménynaplóban, a fájl azonosítójával — bájt és fájlnév nélkül", async () => {
    // a feljegyzés a háttérben megy (feljegyezHatterben): legfeljebb 5 mp-ig várunk rá
    let talalt: { fajta: string; adat: Record<string, unknown> } | undefined;
    for (let i = 0; i < 10 && !talalt; i++) {
      const valasz = await keres<unknown>("/api/esemenyek?limit=50", { sutik: aSutik });
      expect(valasz.statusz).toBe(200);
      const lista = (valasz.torzs as { esemeny: { fajta: string; adat: Record<string, unknown> }[] }).esemeny;
      talalt = lista.find((e) => e.fajta === "fajl_feltoltve" && e.adat["fajl_id"] === logoId);
      if (!talalt) await new Promise((r) => setTimeout(r, 500));
    }
    expect(talalt, "a fajl_feltoltve esemény a naplóban").toBeDefined();
    expect(talalt!.adat["tipus"]).toBe("png");
    expect(talalt!.adat["cel"]).toBe("logo");
    expect(JSON.stringify(talalt!.adat)).not.toContain("logo.png");
  });

  it("SVG szöveg (x-fajl-nev: logo.png) → 415 SVG_NEM_ENGEDETT", async () => {
    const svgSzoveg = "<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>";
    const bajtok = new TextEncoder().encode(svgSzoveg);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: aSutik,
        "x-fajl-nev": encodeURIComponent("logo.png"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: bajtok,
    });

    expect(valasz.status).toBe(415);
    const torzs = (await valasz.json()) as { hiba: string };
    expect(torzs.hiba).toBe("SVG_NEM_ENGEDETT");
  });

  it("GIF fejléc → 415 TIPUS_NEM_ENGEDETT", async () => {
    const gifFejlec = new TextEncoder().encode("GIF89a");
    const bajtok = new Uint8Array(gifFejlec.length + 100);
    bajtok.set(gifFejlec, 0);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: aSutik,
        "x-fajl-nev": encodeURIComponent("logo.gif"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: bajtok,
    });

    expect(valasz.status).toBe(415);
    const torzs = (await valasz.json()) as { hiba: string };
    expect(torzs.hiba).toBe("TIPUS_NEM_ENGEDETT");
  });

  it("Üres törzs → 400 URES", async () => {
    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: aSutik,
        "x-fajl-nev": encodeURIComponent("logo.png"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: new Uint8Array(0),
    });

    expect(valasz.status).toBe(400);
    const torzs = (await valasz.json()) as { hiba: string };
    expect(torzs.hiba).toBe("URES");
  });

  it("Nézőként → 403", async () => {
    const pngFejlec = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const bajtok = new Uint8Array(pngFejlec.length + 100);
    bajtok.set(pngFejlec, 0);

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl`, {
      method: "POST",
      headers: {
        cookie: bSutik,
        "x-fajl-nev": encodeURIComponent("logo.png"),
        "x-fajl-cel": "logo",
        "content-type": "application/octet-stream",
      },
      body: bajtok,
    });

    expect(valasz.status).toBe(403);
  });

  it("GET /api/arculat/fajl?cel=logo → 200, 1 elem", async () => {
    const valasz = await keres<unknown>("/api/arculat/fajl?cel=logo", { sutik: aSutik });
    expect(valasz.statusz).toBe(200);
    const torzs = valasz.torzs as { fajl: FajlMeta[] };
    expect(torzs.fajl).toHaveLength(1);
  });

  it("GET /api/arculat/fajl/{id} → 200, content-type: image/png, hossz = meret", async () => {
    const lista = await keres<unknown>("/api/arculat/fajl?cel=logo", { sutik: aSutik });
    const listaTorzs = lista.torzs as { fajl: FajlMeta[] };
    const fajlId = listaTorzs.fajl[0]?.id;
    const meret = listaTorzs.fajl[0]?.meret;

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl/${fajlId}`, {
      headers: { cookie: aSutik },
    });

    expect(valasz.status).toBe(200);
    expect(valasz.headers.get("content-type")).toBe("image/png");
    const test = await valasz.arrayBuffer();
    expect(test.byteLength).toBe(meret);
  });

  it("Más szervezet tagjaként → 404", async () => {
    const lista = await keres<unknown>("/api/arculat/fajl?cel=logo", { sutik: aSutik });
    const listaTorzs = lista.torzs as { fajl: FajlMeta[] };
    const fajlId = listaTorzs.fajl[0]?.id;

    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl/${fajlId}`, {
      headers: { cookie: cSutik },
    });

    expect(valasz.status).toBe(404);
  });

  it("Ismeretlen id → 404", async () => {
    const valasz = await fetch(`${PROBA_CIM}/api/arculat/fajl/ismeretlen-id-12345`, {
      headers: { cookie: aSutik },
    });

    expect(valasz.status).toBe(404);
  });
});
