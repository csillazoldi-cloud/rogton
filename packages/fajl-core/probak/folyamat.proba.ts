// e) néző nem tölthet fel (NINCS_JOG), szerkesztő igen; f) feltolt sikeres útja: meta a tárban, esemény, a név megtisztítva;
// g) fajlOlvas más szervezet fájljára NINCS_ILYEN_FAJL; h) fajlLista cél szerint szűr.
import { describe, expect, it } from "vitest";
import {
  feltolt,
  fajlLista,
  fajlMeta,
  fajlOlvas,
  HostKontextus,
} from "../src/index.js";
import { kornyezet, memTar, pngFej } from "./segedek";

function ktx(szerep: HostKontextus["szerep"], szervezet = "sz-1"): HostKontextus {
  return { fiok_id: "f-1", szervezet_id: szervezet, szerep };
}

describe("feltolt", () => {
  it("néző nem tölthet fel → NINCS_JOG", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    const r = await feltolt(k, ktx("nezo"), {
      nev: "logo.png",
      cel: "logo",
      bajtok: pngFej(),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("NINCS_JOG");
  });

  it("szerkesztő feltölthet, meta a tárban, esemény, név megtisztítva", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    const r = await feltolt(k, ktx("szerkeszto"), {
      nev: "al/logo\\x.png",
      cel: "logo",
      bajtok: pngFej(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.nev).toBe("al_logo_x.png");
    expect(r.ertek.tipus).toBe("png");
    expect(r.ertek.szervezet_id).toBe("sz-1");
    expect(r.ertek.feltoltotte).toBe("f-1");

    const mentett = await tar.meta("sz-1", r.ertek.id);
    expect(mentett).not.toBeNull();
    expect(mentett?.nev).toBe("al_logo_x.png");

    expect(k.esemenyek.length).toBe(1);
    expect(k.esemenyek[0].fajta).toBe("fajl_feltoltve");
    expect(k.esemenyek[0].fajl_id).toBe(r.ertek.id);
  });

  it("a név 200 karakterre levágva", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    const hosszu = "a".repeat(300) + ".png";
    const r = await feltolt(k, ktx("tulajdonos"), {
      nev: hosszu,
      cel: "dokumentum",
      bajtok: pngFej(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.nev.length).toBe(200);
  });
});

describe("fajlMeta / fajlOlvas / fajlLista", () => {
  it("fajlOlvas más szervezet fájljára → NINCS_ILYEN_FAJL", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    const r = await feltolt(k, ktx("szerkeszto", "sz-1"), {
      nev: "logo.png",
      cel: "logo",
      bajtok: pngFej(),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const mas = await fajlOlvas(k, ktx("nezo", "sz-2"), r.ertek.id);
    expect(mas.ok).toBe(false);
    if (!mas.ok) expect(mas.hiba).toBe("NINCS_ILYEN_FAJL");

    const sajat = await fajlOlvas(k, ktx("nezo", "sz-1"), r.ertek.id);
    expect(sajat.ok).toBe(true);
  });

  it("fajlMeta ismeretlen id → NINCS_ILYEN_FAJL", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    const r = await fajlMeta(k, ktx("nezo"), "nincs-ilyen");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.hiba).toBe("NINCS_ILYEN_FAJL");
  });

  it("fajlLista cél szerint szűr", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    await feltolt(k, ktx("szerkeszto"), {
      nev: "a.png",
      cel: "logo",
      bajtok: pngFej(),
    });
    await feltolt(k, ktx("szerkeszto"), {
      nev: "b.png",
      cel: "referencia",
      bajtok: pngFej(),
    });
    await feltolt(k, ktx("szerkeszto"), {
      nev: "c.png",
      cel: "logo",
      bajtok: pngFej(),
    });

    const mind = await fajlLista(k, ktx("nezo"));
    expect(mind.ok).toBe(true);
    if (mind.ok) expect(mind.ertek.length).toBe(3);

    const csakLogo = await fajlLista(k, ktx("nezo"), "logo");
    expect(csakLogo.ok).toBe(true);
    if (csakLogo.ok) {
      expect(csakLogo.ertek.length).toBe(2);
      for (const m of csakLogo.ertek) expect(m.cel).toBe("logo");
    }
  });
});

// R-16 K1 (TERV 1.1): a hely, az eredet és az elemzés átmenő adat — a mag nem értelmezi az elemzést.
describe("feltolt — logóhely, eredet, elemzés (R-16 K1)", () => {
  it("logónál a hely alapból világos, az eredet feltöltés, az elemzés null", async () => {
    const k = kornyezet(memTar());
    const r = await feltolt(k, ktx("szerkeszto"), { nev: "Kövesi Térkő – logó.png", cel: "logo", bajtok: pngFej() });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ertek.logo_valtozat).toBe("vilagos");
    expect(r.ertek.eredet).toBe("feltoltes");
    expect(r.ertek.elemzes).toBeNull();
  });

  it("a megadott hely és elemzés a tárba kerül; más célnál a hely és az elemzés null", async () => {
    const tar = memTar();
    const k = kornyezet(tar);
    const elemzes = { atlatszo: true, vilagossag: 0.9, szinszam: 1, arany: 4.1, szinek: [] };
    const r = await feltolt(k, ktx("szerkeszto"), { nev: "fehér.png", cel: "logo", bajtok: pngFej(), logo_valtozat: "sotet", elemzes });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((await tar.meta("sz-1", r.ertek.id))?.logo_valtozat).toBe("sotet");
    expect((await tar.meta("sz-1", r.ertek.id))?.elemzes).toEqual(elemzes);
    const d = await feltolt(k, ktx("szerkeszto"), { nev: "kézikönyv.pdf", cel: "kezikonyv", bajtok: pngFej(), logo_valtozat: "sotet", elemzes });
    expect(d.ok).toBe(true);
    if (!d.ok) return;
    expect(d.ertek.logo_valtozat).toBeNull();
    expect(d.ertek.elemzes).toBeNull();
  });
});
