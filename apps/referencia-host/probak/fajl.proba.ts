import { describe, it, expect } from "vitest";
import {
  feltolt,
  fajlOlvas,
  fajlLista,
  dont,
  type FajlTipus,
} from "@km/fajl-core";
import { fajlKornyezet } from "../src/csatlakozok/fajl-kornyezet.js";

describe("fajl a hoston", () => {
  it("PNG feltoltes es visszaolvasas mukodik", async () => {
    const k = fajlKornyezet(":memory:");

    const ktxSzerkeszto = {
      fiok_id: "fiok-A",
      szervezet_id: "sz-1",
      szerep: "szerkeszto" as const,
    };

    // a) PNG-fejlec feltoltes szerkesztokent → meta a tarban, a bajtok visszaolvashatok
    const pngFejlec = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const feltoltEredmeny = await feltolt(k, ktxSzerkeszto, {
      nev: "logo.png",
      cel: "logo",
      bajtok: pngFejlec,
    });
    expect(feltoltEredmeny.ok).toBe(true);
    if (!feltoltEredmeny.ok) throw new Error("nem jo");
    expect(feltoltEredmeny.ertek.tipus).toBe("png" as FajlTipus);
    expect(feltoltEredmeny.ertek.meret).toBe(pngFejlec.length);

    const olvasEredmeny = await fajlOlvas(k, ktxSzerkeszto, feltoltEredmeny.ertek.id);
    expect(olvasEredmeny.ok).toBe(true);
    if (!olvasEredmeny.ok) throw new Error("nem jo");
    expect(olvasEredmeny.ertek.meta.id).toBe(feltoltEredmeny.ertek.id);
    expect(olvasEredmeny.ertek.bajtok.length).toBe(pngFejlec.length);
    expect(olvasEredmeny.ertek.bajtok[0]).toBe(0x89);

    // e) fajlLista cel szerint
    const listaLogo = await fajlLista(k, ktxSzerkeszto, "logo");
    expect(listaLogo.ok).toBe(true);
    if (!listaLogo.ok) throw new Error("nem jo");
    expect(listaLogo.ertek.length).toBe(1);
    expect(listaLogo.ertek[0]!.cel).toBe("logo");

    const listaMind = await fajlLista(k, ktxSzerkeszto);
    expect(listaMind.ok).toBe(true);
    if (!listaMind.ok) throw new Error("nem jo");
    expect(listaMind.ertek.length).toBe(1);

    k.zar();
  });

  it("SVG elutasitas es jogosultsagok mukodnek", async () => {
    const k = fajlKornyezet(":memory:");

    const ktxSzerkeszto = {
      fiok_id: "fiok-A",
      szervezet_id: "sz-1",
      szerep: "szerkeszto" as const,
    };

    // b) SVG szoveg (a neve "logo.png") → SVG_NEM_ENGEDETT
    const svgTartalom = new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');
    const svgEredmeny = await feltolt(k, ktxSzerkeszto, {
      nev: "logo.png",
      cel: "logo",
      bajtok: svgTartalom,
    });
    expect(svgEredmeny.ok).toBe(false);
    if (svgEredmeny.ok) throw new Error("nem jo");
    expect(svgEredmeny.hiba).toBe("SVG_NEM_ENGEDETT");

    // c) nezo → NINCS_JOG
    const ktxNezo = {
      fiok_id: "fiok-B",
      szervezet_id: "sz-1",
      szerep: "nezo" as const,
    };
    const nezoEredmeny = await feltolt(k, ktxNezo, {
      nev: "kep.png",
      cel: "referencia",
      bajtok: new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    });
    expect(nezoEredmeny.ok).toBe(false);
    if (nezoEredmeny.ok) throw new Error("nem jo");
    expect(nezoEredmeny.hiba).toBe("NINCS_JOG");

    // d) masik szervezetbol NINCS_ILYEN_FAJL
    const ktxMasik = {
      fiok_id: "fiok-C",
      szervezet_id: "sz-2",
      szerep: "szerkeszto" as const,
    };
    // Eloszor feltoltunk egy fajlt az elso szervezetbe
    const pngFejlec = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const feltoltEredmeny = await feltolt(k, ktxSzerkeszto, {
      nev: "masik.png",
      cel: "referencia",
      bajtok: pngFejlec,
    });
    expect(feltoltEredmeny.ok).toBe(true);
    if (!feltoltEredmeny.ok) throw new Error("nem jo");

    // Masik szervezet nem eri el
    const masikOlvas = await fajlOlvas(k, ktxMasik, feltoltEredmeny.ertek.id);
    expect(masikOlvas.ok).toBe(false);
    if (masikOlvas.ok) throw new Error("nem jo");
    expect(masikOlvas.hiba).toBe("NINCS_ILYEN_FAJL");

    k.zar();
  });
});

// R-16 K1 (A-12, TERV 1.1): a második host is tárolja a logó helyét, az eredetet és az elemzést; a régi adatbázis-fájl
// oszlopait hozzáadja, és a régi logó-sor világos lesz — semmi nem törlődik.
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hasznaltLogok } from "@km/fajl-core";
import { sqliteFajl } from "../src/csatlakozok/sqlite-fajl.js";

describe("fajl a hoston — logóhely (R-16 K1)", () => {
  const png = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ktx = { fiok_id: "fiok-A", szervezet_id: "sz-1", szerep: "szerkeszto" as const };

  it("a hely, az eredet és az elemzés visszaolvasható; más célnál a hely null", async () => {
    const k = fajlKornyezet(":memory:");
    const elemzes = { atlatszo: true, vilagossag: 0.93, szinszam: 1, arany: 4.2, szinek: [] };
    const a = await feltolt(k, ktx, { nev: "Ördögh Ősz – fehér.png", cel: "logo", bajtok: png, logo_valtozat: "sotet", elemzes });
    const b = await feltolt(k, ktx, { nev: "kézikönyv.png", cel: "kezikonyv", bajtok: png, logo_valtozat: "sotet" });
    expect(a.ok && b.ok).toBe(true);
    const lista = await fajlLista(k, ktx);
    if (!lista.ok) throw new Error("nem jo");
    const logo = lista.ertek.find((f) => f.cel === "logo");
    expect(logo?.logo_valtozat).toBe("sotet");
    expect(logo?.eredet).toBe("feltoltes");
    expect(logo?.elemzes).toEqual(elemzes);
    expect(lista.ertek.find((f) => f.cel === "kezikonyv")?.logo_valtozat).toBeNull();
    expect(hasznaltLogok(lista.ertek, null).sotet).toBe(logo?.id);
    k.zar();
  });

  it("régi adatbázis-fájl: az oszlopok bekerülnek, a régi logó-sor világos, a sorok megmaradnak", async () => {
    const ut = join(mkdtempSync(join(tmpdir(), "km-fajl-")), "regi.db");
    const regi = new DatabaseSync(ut);
    regi.exec("CREATE TABLE fajl (id TEXT PRIMARY KEY, szervezet_id TEXT NOT NULL, nev TEXT NOT NULL, tipus TEXT NOT NULL, meret INTEGER NOT NULL, cel TEXT NOT NULL, feltoltotte TEXT NOT NULL, feltoltve TEXT NOT NULL, bajtok BLOB NOT NULL);");
    regi.prepare("INSERT INTO fajl VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("regi-logo", "sz-1", "régi.png", "png", 8, "logo", "fiok-A", "2026-09-01T08:00:00.000Z", png);
    regi.prepare("INSERT INTO fajl VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run("regi-kk", "sz-1", "kk.png", "png", 8, "kezikonyv", "fiok-A", "2026-09-01T08:00:00.000Z", png);
    regi.close();
    const { tar, zar } = sqliteFajl(ut);
    const lista = await tar.lista("sz-1");
    expect(lista.length).toBe(2);
    expect(lista.find((f) => f.id === "regi-logo")?.logo_valtozat).toBe("vilagos");
    expect(lista.find((f) => f.id === "regi-kk")?.logo_valtozat).toBeNull();
    expect(lista.every((f) => f.eredet === "feltoltes")).toBe(true);
    zar();
    // másodszor megnyitva sem nyúl hozzá (a PRAGMA table_info szerint már megvan)
    const masodszor = sqliteFajl(ut);
    expect((await masodszor.tar.lista("sz-1")).length).toBe(2);
    masodszor.zar();
  });
});
